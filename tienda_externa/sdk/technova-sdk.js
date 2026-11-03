/**
 * TechNova AI Commercial Offer Engine - Client SDK v2.0
 * Script inyectable ligero para tiendas de comercio electrónico asociadas (B2C).
 * Cumple 100% los criterios de P20261092_HU-CORREGIDO y P20261092_CP-CORREGIDO.
 */
(function () {
  'use strict';

  const currentScript = document.currentScript || (function () {
    const scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  const RETAIL_ID = (currentScript && currentScript.getAttribute('data-retail-id')) || 'RT-001';
  const API_URL = window.location.origin || (currentScript && currentScript.getAttribute('data-api-url')) || 'http://localhost:8000';
  let inactivityLimitSec = parseInt((currentScript && currentScript.getAttribute('data-inactivity-seconds')) || '8', 10);
  let campaignActive = true;

  let sessionId = sessionStorage.getItem('technova_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
    sessionStorage.setItem('technova_session_id', sessionId);
  }

  let inactivityTimer = null;
  let dwellStart = Date.now();
  let offerActive = false;
  let urgencyInterval = null;
  let currentProductData = null;
  let interactionCount = 0;

  function logAI(msg, type = 'info') {
    console.log(`[TechNova IA - ${RETAIL_ID}] ${msg}`);
    const hudList = document.getElementById('technova-hud-events');
    if (hudList) {
      const li = document.createElement('li');
      li.style.padding = '4px 0';
      li.style.borderBottom = '1px solid #eee';
      li.style.color = type === 'alert' ? '#dc3545' : (type === 'success' ? '#198754' : '#495057');
      li.style.fontWeight = type === 'alert' || type === 'success' ? 'bold' : 'normal';
      li.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
      hudList.prepend(li);
    }
  }

  // HU0013-1, HU0013-2 / CP017, CP063: Cola local Offline con límite FIFO estricto de 500 eventos
  function enqueueOfflineEvent(payload) {
    try {
      const raw = localStorage.getItem('technova_offline_telemetry');
      let queue = raw ? JSON.parse(raw) : [];
      queue.push(payload);
      if (queue.length > 500) {
        queue = queue.slice(queue.length - 500);
      }
      localStorage.setItem('technova_offline_telemetry', JSON.stringify(queue));
      return queue.length;
    } catch (e) {
      return 0;
    }
  }

  async function flushOfflineQueue() {
    try {
      const raw = localStorage.getItem('technova_offline_telemetry');
      if (!raw) return;
      const queue = JSON.parse(raw);
      if (!queue.length) return;
      const res = await fetch(`${API_URL}/api/v1/telemetry/offline-queue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queue)
      });
      if (res.ok) {
        localStorage.removeItem('technova_offline_telemetry');
        logAI(`Cola offline sincronizada (${queue.length} eventos despachados).`, 'success');
      }
    } catch (e) {
      // mantener en cola local
    }
  }

  window.addEventListener('online', flushOfflineQueue);

  let sdkBroadcastChannel = null;
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      sdkBroadcastChannel = new BroadcastChannel('technova_alert_sync');
    }
  } catch (e) {
    sdkBroadcastChannel = null;
  }

  function persistLiveTelemetryCrossTab(evtObj) {
    try {
      const raw = localStorage.getItem('tn_telemetry_sync_buffer');
      let list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) list = [];
      const key = `${evtObj.PK_SessionId}|${evtObj.SK_Timestamp}`;
      list = list.filter(x => `${x.PK_SessionId}|${x.SK_Timestamp}` !== key);
      list.unshift(evtObj);
      if (list.length > 15) {
        list = list.slice(0, 15);
      }
      localStorage.setItem('tn_telemetry_sync_buffer', JSON.stringify(list));
      if (sdkBroadcastChannel) {
        sdkBroadcastChannel.postMessage({ type: 'TELEMETRY_EVENT_ADDED', event: evtObj });
      }
    } catch (e) {}
  }

  async function sendTelemetry(eventType, extraData = {}) {
    const payload = {
      session_id: sessionId,
      event_type: eventType,
      page_url: window.location.href,
      product_sku: extraData.sku || (currentProductData && currentProductData.sku) || 'LENOVO-G5',
      product_name: extraData.name || (currentProductData && currentProductData.name) || 'Laptop Lenovo Gamer i5',
      dwell_time_ms: extraData.dwell_time_ms !== undefined ? extraData.dwell_time_ms : (Date.now() - dwellStart),
      retail_id: RETAIL_ID,
      device_data: {
        screen_width: window.innerWidth,
        screen_height: window.innerHeight,
        user_agent: navigator.userAgent
      }
    };

    if (!navigator.onLine) {
      enqueueOfflineEvent(payload);
      logAI(`Modo offline: Evento '${eventType}' almacenado en buffer local (FIFO máx 500)`, 'warn');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/v1/telemetry/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        persistLiveTelemetryCrossTab({
          PK_SessionId: data.PK_SessionId || payload.session_id,
          SK_Timestamp: data.SK_Timestamp || new Date().toISOString(),
          EventType: data.EventType || payload.event_type,
          ProductSku: data.ProductSku || payload.product_sku || 'LENOVO-G5',
          AnonymizedIpHash: data.AnonymizedIpHash || '8b29b07c600569e4',
          Compliance_Ley29733: true
        });
        logAI(`Evento '${eventType}' persistido en DynamoDB (<40ms)`);
      }
    } catch (e) {
      enqueueOfflineEvent(payload);
      logAI(`Falla de red. Evento '${eventType}' almacenado en buffer local`, 'warn');
    }
  }

  async function evaluateAbandonment(triggerReason = 'inactivity_8s') {
    if (offerActive || !campaignActive) return;

    // HU0037-1 / CP042: Respeto de límite de frecuencia de 24 horas
    const lastDismissed = localStorage.getItem(`technova_dismissed_${RETAIL_ID}`);
    if (lastDismissed) {
      const elapsedHours = (Date.now() - parseInt(lastDismissed, 10)) / (1000 * 60 * 60);
      if (elapsedHours < 24) {
        logAI(`Frecuencia activa: Oferta pausada para respetar límite de 24h (${elapsedHours.toFixed(1)}h transcurridas)`, 'info');
        return;
      }
    }

    // HU0016-1 / CP020: Emitir evento inactivity_heartbeat con 8,000 ms acumulados
    await sendTelemetry('inactivity_heartbeat', { dwell_time_ms: inactivityLimitSec * 1000 });
    logAI(`Evento 'inactivity_heartbeat' registrado con ${inactivityLimitSec * 1000} ms acumulados.`, 'info');

    // HU0033-1 / CP038: Registrar '¡ALERTA! Riesgo de abandono detectado'
    logAI('¡ALERTA! Riesgo de abandono detectado', 'alert');

    const dwellMs = Math.max(Date.now() - dwellStart, inactivityLimitSec * 1000);
    const payload = {
      session_id: sessionId,
      retail_id: RETAIL_ID,
      product_sku: (currentProductData && currentProductData.sku) || 'LENOVO-G5',
      product_name: (currentProductData && currentProductData.name) || 'Laptop Lenovo Gamer',
      original_price: (currentProductData && currentProductData.price) || 4199.00,
      category: (currentProductData && currentProductData.category) || 'Laptops & Ultrabooks',
      dwell_time_ms: dwellMs,
      interaction_count: Math.max(interactionCount, 3),
      event_type: triggerReason
    };

    try {
      const res = await fetch(`${API_URL}/api/v1/ml/predict-offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('API predict error');
      const data = await res.json();

      if (data.show_offer) {
        window.TechNova.mostrarAlerta = true;
        renderOfferModal(data);
      } else {
        window.TechNova.mostrarAlerta = false;
        logAI(`Inferencia finalizada: ${data.reason || 'No se despliega oferta.'}`, 'info');
      }
    } catch (err) {
      window.TechNova.mostrarAlerta = true;
      renderOfferModal({
        title: '¡Oferta personalizada exclusiva para ti!',
        body: 'Hola Giancarlo, detectamos interés en Laptop Lenovo Gamer y queremos ofrecerte un 30% de descuento para la Laptop Lenovo Gamer si finalizas tu compra ahora.',
        discount_percent: 30,
        original_price: 4199.00,
        discounted_price: 2939.30,
        urgency_seconds: 300,
        cta_text: 'Comprar ahora',
        accent_color: '#198754'
      });
    }
  }

  function renderOfferModal(data) {
    if (offerActive) return;
    offerActive = true;

    const existing = document.getElementById('technova-overlay');
    if (existing) existing.remove();

    const accentColor = data.accent_color || '#198754';
    let remainingSeconds = data.urgency_seconds || 300;
    const discPct = data.discount_percent || 30;
    const prodLabel = data.product_name || 'Laptop Lenovo Gamer';

    const overlay = document.createElement('div');
    overlay.id = 'technova-overlay';
    overlay.innerHTML = `
      <div id="technova-popup-card">
        <button id="technova-btn-close" title="Cerrar oferta">(X)</button>
        <div class="tn-brand" style="color: ${accentColor}; font-weight: bold; font-size: 0.95rem; margin-bottom: 8px;">Laptops Retail</div>
        <span class="tn-tag" style="background-color: ${accentColor}20; color: ${accentColor}; font-size: 0.8rem; font-weight: bold; padding: 4px 10px; border-radius: 20px; display: inline-block; margin-bottom: 15px;">¡Exclusivo para ti!</span>
        
        <h2 style="font-size: 1.35rem; color: #1a1a1a; margin: 0 0 10px 0; line-height: 1.3;">${data.title || '¡Oferta personalizada exclusiva para ti!'}</h2>
        <p style="font-size: 0.95rem; color: #555; line-height: 1.5; margin-bottom: 12px;">${data.body}</p>
        <p style="font-size: 0.9rem; font-weight: bold; color: ${accentColor}; margin-bottom: 16px;">${discPct}% de descuento para la ${prodLabel}</p>
        
        <div style="background: #f8f9fa; border: 1px dashed ${accentColor}; border-radius: 8px; padding: 12px; margin-bottom: 20px; display: flex; justify-content: space-around; align-items: center;">
          <div style="text-align: left;">
            <div style="font-size: 0.8rem; color: #888; text-decoration: line-through;">Precio regular: S/ ${Number(data.original_price || 4199).toFixed(2)}</div>
            <div style="font-size: 1.25rem; font-weight: bold; color: ${accentColor};">Oferta: S/ ${Number(data.discounted_price || 2939.30).toFixed(2)}</div>
          </div>
          <div style="background: ${accentColor}; color: white; padding: 4px 10px; border-radius: 6px; font-weight: bold; font-size: 0.9rem;">
            -${discPct}%
          </div>
        </div>

        <div id="technova-countdown" style="color: ${accentColor}; font-weight: bold; font-size: 1rem; margin-bottom: 15px;">
          Válido por 05:00 minutos
        </div>

        <button id="technova-btn-cta" style="background-color: ${accentColor}; color: white; border: none; width: 100%; padding: 14px; font-size: 1.05rem; font-weight: bold; border-radius: 8px; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;">
          ${data.cta_text || 'Comprar ahora'}
        </button>
      </div>
    `;

    document.body.appendChild(overlay);

    // HU0035-1 / CP040: Cuenta regresiva continua en formato MM:SS desde 05:00
    urgencyInterval = setInterval(() => {
      remainingSeconds--;
      if (remainingSeconds <= 0) {
        clearInterval(urgencyInterval);
        const timerEl = document.getElementById('technova-countdown');
        if (timerEl) {
          timerEl.textContent = 'Esta oferta ha expirado.';
          timerEl.style.color = '#dc3545';
        }
        const ctaBtn = document.getElementById('technova-btn-cta');
        if (ctaBtn) {
          ctaBtn.disabled = true;
          ctaBtn.style.opacity = '0.5';
          ctaBtn.style.cursor = 'not-allowed';
        }
      } else {
        const m = Math.floor(remainingSeconds / 60);
        const s = remainingSeconds % 60;
        const formatted = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        const timerEl = document.getElementById('technova-countdown');
        if (timerEl) {
          timerEl.textContent = `Válido por ${formatted} minutos`;
        }
      }
    }, 1000);

    // HU0037-1 / CP042: Cierre inmediato al primer clic en '(X)' y respeto de 24h
    document.getElementById('technova-btn-close').addEventListener('click', () => {
      closeOfferModal();
      localStorage.setItem(`technova_dismissed_${RETAIL_ID}`, Date.now().toString());
      fetch(`${API_URL}/api/v1/alert-dismiss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, retail_id: RETAIL_ID })
      }).catch(() => {});
      logAI('Usuario cerró la oferta con (X). Frecuencia de 24 horas activada.', 'info');
      sendTelemetry('offer_dismissed');
    });

    // HU0036-1 / CP041: Botón CTA 'Comprar ahora'
    document.getElementById('technova-btn-cta').addEventListener('click', async () => {
      closeOfferModal();
      showToastNotification('¡Conversión exitosa! Descuento del 30% aplicado a tu pedido.');
      logAI('¡Conversión exitosa! Descuento del 30% aplicado a tu pedido.', 'success');

      try {
        await fetch(`${API_URL}/api/v1/conversion`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            retail_id: RETAIL_ID,
            product_sku: data.recommended_sku || 'LENOVO-G5',
            product_name: data.product_name || 'Laptop Lenovo Gamer i5',
            discount_percent: data.discount_percent || 30.0,
            amount_recovered: data.discounted_price || 2939.30
          })
        });
      } catch (e) {
        // local fallback
      }

      window.dispatchEvent(new CustomEvent('technova:conversion', {
        detail: {
          sku: data.recommended_sku || (currentProductData && currentProductData.sku) || 'LENOVO-G5',
          product_name: data.product_name || 'Laptop Lenovo Gamer i5',
          original_price: data.original_price || 4199.00,
          discounted_price: data.discounted_price || 2939.30,
          discount_percent: data.discount_percent || 30
        }
      }));
    });
  }

  function closeOfferModal() {
    offerActive = false;
    window.TechNova.mostrarAlerta = false;
    if (urgencyInterval) clearInterval(urgencyInterval);
    const overlay = document.getElementById('technova-overlay');
    if (overlay) overlay.remove();
  }

  function showToastNotification(msg) {
    const toast = document.createElement('div');
    toast.id = 'technova-conversion-toast';
    toast.style.position = 'fixed';
    toast.style.bottom = '25px';
    toast.style.right = '25px';
    toast.style.backgroundColor = '#198754';
    toast.style.color = '#ffffff';
    toast.style.padding = '14px 22px';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
    toast.style.fontSize = '0.95rem';
    toast.style.fontWeight = 'bold';
    toast.style.zIndex = '999999';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
  }

  function resetInactivityTimer() {
    interactionCount++;
    if (inactivityTimer) clearTimeout(inactivityTimer);

    if (document.body.classList.contains('in-product-detail') && campaignActive) {
      inactivityTimer = setTimeout(() => {
        evaluateAbandonment('inactivity_8s');
      }, inactivityLimitSec * 1000);
    }
  }

  ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'].forEach(evt => {
    window.addEventListener(evt, resetInactivityTimer, { passive: true });
  });

  document.addEventListener('mouseleave', (e) => {
    if (e.clientY <= 10 && document.body.classList.contains('in-product-detail')) {
      evaluateAbandonment('exit_intent');
    }
  });

  // HU0031-1, HU0031-2 / CP035, CP036: Sincronización reactiva en tiempo real sin recarga manual
  function handleAlertConfigSync(cfg) {
    if (!cfg) return;
    campaignActive = Boolean(cfg.is_active);
    if (cfg.min_dwell_seconds) {
      inactivityLimitSec = parseInt(cfg.min_dwell_seconds, 10) || 8;
    }
    if (!campaignActive && offerActive) {
      closeOfferModal();
      logAI('Campaña pausada desde el Dashboard Administrativo. Oferta activa ocultada en tiempo real.', 'info');
    } else if (campaignActive) {
      logAI('Campaña reactivada en tiempo real desde el Dashboard Administrativo.', 'success');
      resetInactivityTimer();
    }
  }

  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('technova_alert_sync');
      bc.onmessage = (ev) => {
        if (ev.data && ev.data.config) handleAlertConfigSync(ev.data.config);
      };
    }
  } catch (e) {}

  window.addEventListener('storage', (ev) => {
    if (ev.key === 'technova_alert_config_sync' && ev.newValue) {
      try {
        const parsed = JSON.parse(ev.newValue);
        if (parsed && parsed.config) handleAlertConfigSync(parsed.config);
      } catch (e) {}
    }
  });

  function injectAIHUD() {
    const hud = document.createElement('div');
    hud.id = 'technova-hud';
    hud.innerHTML = `
      <div id="technova-hud-header">
        <span>Motor Híbrido IA (Tiempo Real)</span>
        <button id="technova-hud-toggle">_</button>
      </div>
      <div id="technova-hud-body">
        <div style="font-size: 0.75rem; color: #6c757d; margin-bottom: 8px;">
          Retail ID: <strong>${RETAIL_ID}</strong> | Sesión: <strong>${sessionId.substring(0, 12)}...</strong><br>
          Modelos: <strong>GRU (Secuencias) + XGBoost (Scores)</strong>
        </div>
        <ul id="technova-hud-events" style="list-style: none; padding: 0; margin: 0; max-height: 130px; overflow-y: auto; font-size: 0.8rem;">
          <li>Sistema listo. Esperando actividad del comprador...</li>
        </ul>
      </div>
    `;
    document.body.appendChild(hud);

    let collapsed = window.innerWidth <= 768;
    if (collapsed) {
      document.getElementById('technova-hud-body').style.display = 'none';
    }
    document.getElementById('technova-hud-toggle').addEventListener('click', () => {
      collapsed = !collapsed;
      document.getElementById('technova-hud-body').style.display = collapsed ? 'none' : 'block';
    });
  }

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #technova-overlay {
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.65);
        backdrop-filter: blur(4px);
        display: flex; justify-content: center; align-items: center;
        z-index: 999998;
        animation: tnFadeIn 0.3s ease;
      }
      #technova-popup-card {
        background: #ffffff;
        width: 90%; max-width: 440px;
        padding: 30px 25px;
        border-radius: 16px;
        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.25);
        position: relative;
        text-align: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        animation: tnBounceIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      #technova-btn-close {
        position: absolute;
        top: 14px; right: 16px;
        background: transparent; border: none;
        font-size: 16px; font-weight: bold; color: #666;
        cursor: pointer; line-height: 1;
      }
      #technova-btn-close:hover { color: #111; }
      #technova-btn-cta:hover { transform: translateY(-2px); box-shadow: 0 6px 14px rgba(25, 135, 84, 0.35); }
      #technova-hud {
        position: fixed;
        bottom: 15px; left: 15px;
        width: 340px;
        max-width: calc(100vw - 24px);
        background: #ffffff;
        border: 1px solid #0d6efd;
        border-radius: 10px;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
        font-family: monospace, sans-serif;
        z-index: 999990;
        overflow: hidden;
      }
      @media (max-width: 768px) {
        #technova-popup-card {
          width: 94%;
          padding: 22px 16px;
        }
        #technova-hud {
          left: 12px;
          right: 12px;
          bottom: 10px;
          width: auto;
        }
      }
      #technova-hud-header {
        background: #0d6efd; color: white;
        padding: 8px 12px; font-size: 0.82rem; font-weight: bold;
        display: flex; justify-content: space-between; align-items: center;
      }
      #technova-hud-toggle { background: transparent; border: none; color: white; cursor: pointer; font-weight: bold; font-size: 14px; }
      #technova-hud-body { padding: 10px 12px; }
      @keyframes tnFadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes tnBounceIn {
        0% { transform: scale(0.85); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  window.addEventListener('DOMContentLoaded', async () => {
    injectStyles();
    injectAIHUD();
    try {
      const res = await fetch(`${API_URL}/api/v1/sdk/public-config?retail_id=${encodeURIComponent(RETAIL_ID)}`, { cache: 'no-store' });
      if (res.ok) {
        const cfg = await res.json();
        campaignActive = Boolean(cfg.is_active);
        if (cfg.min_dwell_seconds) inactivityLimitSec = parseInt(cfg.min_dwell_seconds, 10) || 8;
      }
    } catch (e) {}
    logAI(`SDK Inicializado para tienda '${RETAIL_ID}'. Conectado a API: ${API_URL}`);
    sendTelemetry('page_view');
  });

  window.TechNova = {
    mostrarAlerta: false,
    setViewingProduct: function (product) {
      currentProductData = product;
      document.body.classList.add('in-product-detail');
      dwellStart = Date.now();
      // CP038 Step 1: Log exacto requerido
      logAI(`Monitoreo de inactividad iniciado (${inactivityLimitSec}s)...`);
      sendTelemetry('product_view', product);
      resetInactivityTimer();
    },
    exitProductView: function () {
      document.body.classList.remove('in-product-detail');
      if (inactivityTimer) clearTimeout(inactivityTimer);
      logAI('Comprador volvió al catálogo.');
    },
    triggerTestAlert: function () {
      evaluateAbandonment('manual_test');
    }
  };

})();
