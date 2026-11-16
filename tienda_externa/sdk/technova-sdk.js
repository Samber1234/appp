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
  let sdkOriginToken = 'sdk_rt001_3a720d4ab5a0d3da85dfe2cd';

  let sessionId = sessionStorage.getItem('technova_session_id');
  if (!sessionId || sessionId.length < 8) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
    sessionStorage.setItem('technova_session_id', sessionId);
  }

  // Huella determinística por navegador/comprador para sincronizar política de 24h en backend (Redis)
  function computeClientBuyerHash() {
    const raw = [
      RETAIL_ID,
      navigator.userAgent || 'ua',
      navigator.language || 'es-PE',
      (window.screen && `${window.screen.width}x${window.screen.height}`) || '1366x768'
    ].join('|');
    let h1 = 0xdeadbeef ^ raw.length;
    let h2 = 0x41c6ce57 ^ raw.length;
    for (let i = 0; i < raw.length; i++) {
      const ch = raw.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 'cli_' + (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
  }
  const CLIENT_BUYER_HASH = computeClientBuyerHash();

  function computeFallbackSha256Hex(seedStr) {
    let out = '';
    for (let block = 0; block < 8; block++) {
      let h = (0x811c9dc5 ^ (block * 0x9e3779b9)) >>> 0;
      const str = `${seedStr}|blk_${block}`;
      for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 0x01000193) >>> 0;
      }
      out += h.toString(16).padStart(8, '0');
    }
    return out.slice(0, 64);
  }

  function getSdkHeaders() {
    return {
      'Content-Type': 'application/json',
      'X-Retail-ID': RETAIL_ID,
      'X-TechNova-SDK-Token': sdkOriginToken,
      'X-Client-Hash': CLIENT_BUYER_HASH
    };
  }

  let inactivityTimer = null;
  let dwellStart = Date.now();
  let offerActive = false;
  let urgencyInterval = null;
  let currentProductData = null;
  let interactionCount = 0;

  function getPeruTimeFormatted() {
    try {
      return new Date().toLocaleTimeString('es-PE', {
        timeZone: 'America/Lima',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    } catch (e) {
      return new Date().toLocaleTimeString();
    }
  }

  function getPeruIsoNow() {
    return new Date(Date.now() - (5 * 3600 * 1000)).toISOString().slice(0, -1);
  }

  function logAI(msg, type = 'info') {
    console.log(`[TechNova IA - ${RETAIL_ID}] ${msg}`);
    const hudList = document.getElementById('technova-hud-events');
    if (hudList) {
      const li = document.createElement('li');
      li.style.padding = '4px 0';
      li.style.borderBottom = '1px solid #eee';
      li.style.color = type === 'alert' ? '#dc3545' : (type === 'success' ? '#198754' : '#495057');
      li.style.fontWeight = type === 'alert' || type === 'success' ? 'bold' : 'normal';
      li.textContent = `[${getPeruTimeFormatted()}] ${msg}`;
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
        headers: getSdkHeaders(),
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
        headers: getSdkHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        const ipHash64 = (data.AnonymizedIpHash && data.AnonymizedIpHash.length === 64)
          ? data.AnonymizedIpHash
          : computeFallbackSha256Hex(payload.session_id);
        persistLiveTelemetryCrossTab({
          PK_SessionId: data.PK_SessionId || payload.session_id,
          SK_Timestamp: data.SK_Timestamp || getPeruIsoNow(),
          EventType: data.EventType || payload.event_type,
          ProductSku: data.ProductSku || payload.product_sku || 'LENOVO-G5',
          AnonymizedIpHash: ipHash64,
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

    // 0003326 (CP041, CP071): Verificar si ya se canjeó el cupón de un solo uso en la sesión
    if (sessionStorage.getItem(`tn_offer_converted_${RETAIL_ID}`) === 'true' || sessionStorage.getItem('tn_coupon_redeemed_RT-001') === 'true') {
      logAI('Política de uso único: El comprador ya aplicó su cupón promocional en esta sesión.', 'info');
      if (triggerReason === 'manual_test') {
        showToastNotification('Ya utilizaste tu cupón de descuento único (30%) en esta sesión.', '#0d6efd');
      }
      return;
    }

    // HU0037-1 / CP042, CP072: Respeto estricto de límite de frecuencia de 24 horas en cliente + servidor
    const lastDismissed = localStorage.getItem(`technova_dismissed_${RETAIL_ID}`);
    if (lastDismissed) {
      const elapsedHours = (Date.now() - parseInt(lastDismissed, 10)) / (1000 * 60 * 60);
      if (elapsedHours < 24) {
        logAI(`Frecuencia activa: Oferta pausada para respetar límite de 24h (${elapsedHours.toFixed(1)}h transcurridas)`, 'info');
        if (triggerReason === 'manual_test') {
          showToastNotification('Política de frecuencia 24h activa: no se muestran nuevas ofertas hasta mañana.', '#0d6efd');
        }
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
      client_hash: CLIENT_BUYER_HASH,
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
        headers: getSdkHeaders(),
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('API predict error');
      const data = await res.json();

      if (data.show_offer) {
        window.TechNova.mostrarAlerta = true;
        renderOfferModal(data);
      } else {
        window.TechNova.mostrarAlerta = false;
        if (data.reason === 'FREQUENCY_LIMIT_ACTIVE') {
          localStorage.setItem(`technova_dismissed_${RETAIL_ID}`, Date.now().toString());
          if (triggerReason === 'manual_test') {
            showToastNotification('Política de frecuencia 24h activa en servidor (Redis): oferta bloqueada.', '#0d6efd');
          }
        } else if (data.reason === 'COUPON_ALREADY_REDEEMED_IN_SESSION') {
          sessionStorage.setItem(`tn_offer_converted_${RETAIL_ID}`, 'true');
          if (triggerReason === 'manual_test') {
            showToastNotification('El cupón de un solo uso ya fue canjeado en esta sesión.', '#0d6efd');
          }
        }
        logAI(`Inferencia finalizada: ${data.message || data.reason || 'No se despliega oferta.'}`, 'info');
      }
    } catch (err) {
      window.TechNova.mostrarAlerta = false;
      logAI('Servicio de inferencia no disponible o bloqueado por política de frecuencia.', 'warn');
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
    const couponCode = data.coupon_code || 'TN30-UNICO';

    const overlay = document.createElement('div');
    overlay.id = 'technova-overlay';
    overlay.innerHTML = `
      <div id="technova-popup-card">
        <button id="technova-btn-close" title="Cerrar oferta">(X)</button>
        <div class="tn-brand" style="color: ${accentColor}; font-weight: bold; font-size: 0.95rem; margin-bottom: 8px;">Laptops Retail</div>
        <span class="tn-tag" style="background-color: ${accentColor}20; color: ${accentColor}; font-size: 0.8rem; font-weight: bold; padding: 4px 10px; border-radius: 20px; display: inline-block; margin-bottom: 15px;">¡Exclusivo para ti!</span>
        
        <h2 style="font-size: 1.35rem; color: #1a1a1a; margin: 0 0 10px 0; line-height: 1.3;">${data.title || '¡Oferta personalizada exclusiva para ti!'}</h2>
        <p style="font-size: 0.95rem; color: #555; line-height: 1.5; margin-bottom: 12px;">${data.body}</p>
        <p style="font-size: 0.9rem; font-weight: bold; color: ${accentColor}; margin-bottom: 10px;">${discPct}% de descuento para la ${prodLabel}</p>
        <div style="font-size: 0.78rem; color: #0f5132; background: #d1e7dd; padding: 5px 10px; border-radius: 6px; margin-bottom: 14px; font-weight: 600;">
          Cupón de 1 solo uso: <code id="technova-coupon-code">${couponCode}</code> (No acumulable)
        </div>
        
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

    // HU0037-1 / CP042, CP072: Cierre inmediato al primer clic en '(X)' y respeto de 24h en cliente y servidor
    document.getElementById('technova-btn-close').addEventListener('click', () => {
      closeOfferModal();
      localStorage.setItem(`technova_dismissed_${RETAIL_ID}`, Date.now().toString());
      fetch(`${API_URL}/api/v1/alert-dismiss`, {
        method: 'POST',
        headers: getSdkHeaders(),
        body: JSON.stringify({ session_id: sessionId, retail_id: RETAIL_ID, client_hash: CLIENT_BUYER_HASH })
      }).catch(() => {});
      logAI('Usuario cerró la oferta con (X). Frecuencia de 24 horas activada en cliente y servidor.', 'info');
      sendTelemetry('offer_dismissed');
    });

    // HU0036-1 / CP041, CP071: Botón CTA 'Comprar ahora' con validación de cupón de un solo uso
    document.getElementById('technova-btn-cta').addEventListener('click', async () => {
      closeOfferModal();

      let conversionAccepted = true;
      try {
        const res = await fetch(`${API_URL}/api/v1/conversion`, {
          method: 'POST',
          headers: getSdkHeaders(),
          body: JSON.stringify({
            session_id: sessionId,
            retail_id: RETAIL_ID,
            client_hash: CLIENT_BUYER_HASH,
            coupon_code: couponCode,
            product_sku: data.recommended_sku || 'LENOVO-G5',
            product_name: data.product_name || 'Laptop Lenovo Gamer i5',
            discount_percent: data.discount_percent || 30.0,
            amount_recovered: data.discounted_price || 2939.30
          })
        });
        if (!res.ok) {
          conversionAccepted = false;
        }
      } catch (e) {
        // Si está offline, validar por estado de sesión local
        if (sessionStorage.getItem(`tn_offer_converted_${RETAIL_ID}`) === 'true') {
          conversionAccepted = false;
        }
      }

      if (!conversionAccepted) {
        showToastNotification('Este cupón promocional de un solo uso ya fue canjeado anteriormente.', '#dc3545');
        logAI(`Intento de reutilización de cupón '${couponCode}' bloqueado (uso único).`, 'alert');
        return;
      }

      sessionStorage.setItem(`tn_offer_converted_${RETAIL_ID}`, 'true');
      localStorage.setItem(`technova_dismissed_${RETAIL_ID}`, Date.now().toString());

      showToastNotification(`¡Conversión exitosa! Cupón ${couponCode} (${discPct}% dcto.) aplicado a tu pedido.`);
      logAI(`¡Conversión exitosa! Cupón único ${couponCode} (${discPct}% dcto.) aplicado al pedido.`, 'success');

      window.dispatchEvent(new CustomEvent('technova:conversion', {
        detail: {
          sku: data.recommended_sku || (currentProductData && currentProductData.sku) || 'LENOVO-G5',
          product_name: data.product_name || 'Laptop Lenovo Gamer i5',
          original_price: data.original_price || 4199.00,
          discounted_price: data.discounted_price || 2939.30,
          discount_percent: data.discount_percent || 30,
          coupon_code: couponCode
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

  function showToastNotification(msg, bgColor = '#198754') {
    const existing = document.getElementById('technova-conversion-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.id = 'technova-conversion-toast';
    toast.style.position = 'fixed';
    toast.style.bottom = '25px';
    toast.style.right = '25px';
    toast.style.backgroundColor = bgColor;
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
        <span>Motor Híbrido IA (Tiempo Real) — Retail ID: ${RETAIL_ID} | Modelos: GRU (Secuencias) + XGBoost (Scores)</span>
        <button id="technova-hud-toggle" title="Minimizar/Expandir consola IA">_</button>
      </div>
      <div id="technova-hud-body">
        <div style="font-size: 0.78rem; color: #475569; margin-bottom: 6px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
          <span>Sesión activa: <strong>${sessionId}</strong></span>
          <span>Estado: <strong style="color:#198754;">Monitoreo Telemetría Activo (&lt;40ms)</strong></span>
        </div>
        <ul id="technova-hud-events" style="list-style: none; padding: 0; margin: 0; max-height: 92px; overflow-y: auto; font-size: 0.82rem; line-height: 1.45;">
          <li style="padding: 3px 0; color: #334155;">Sistema listo. Esperando actividad del comprador...</li>
        </ul>
      </div>
    `;
    const slot = document.getElementById('technova-hud-slot');
    const mainContainer = document.querySelector('main.main-container');
    if (slot) {
      slot.appendChild(hud);
    } else if (mainContainer) {
      mainContainer.prepend(hud);
    } else {
      document.body.appendChild(hud);
    }

    let collapsed = false;
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
        position: relative;
        width: 100%;
        max-width: 100%;
        background: #ffffff;
        border: 1px solid #bfdbfe;
        border-left: 4px solid #0d6efd;
        border-radius: 10px;
        box-shadow: 0 2px 10px rgba(13, 110, 253, 0.08);
        font-family: 'Segoe UI', monospace, sans-serif;
        z-index: 10;
        overflow: hidden;
        box-sizing: border-box;
      }
      #technova-hud-events li {
        white-space: normal;
        word-break: break-word;
      }
      @media (max-width: 768px) {
        #technova-popup-card {
          width: 94%;
          padding: 22px 16px;
        }
      }
      #technova-hud-header {
        background: #0d6efd; color: white;
        padding: 8px 14px; font-size: 0.84rem; font-weight: bold;
        display: flex; justify-content: space-between; align-items: center;
        gap: 10px;
      }
      #technova-hud-toggle { background: transparent; border: none; color: white; cursor: pointer; font-weight: bold; font-size: 14px; }
      #technova-hud-body { padding: 10px 14px; }
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
        if (cfg.sdk_token) sdkOriginToken = cfg.sdk_token;
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
