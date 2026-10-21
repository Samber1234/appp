// Lógica de Tienda Externa B2C
let cart = [];
let appliedDiscount = 0; // Porcentaje de descuento aplicado por oferta

const PRODUCTS = {
  'LENOVO-G5': { sku: 'LENOVO-G5', name: 'Laptop Lenovo Gamer i5 13va Gen', price: 4199.00 },
  'ASUS-ROG': { sku: 'ASUS-ROG', name: 'Laptop ASUS ROG Strix i7 13va', price: 5899.00 },
  'HP-VICTUS': { sku: 'HP-VICTUS', name: 'Laptop HP Victus AMD Ryzen 5', price: 3249.00 },
  'MSI-CYBORG': { sku: 'MSI-CYBORG', name: 'Laptop MSI Cyborg 15 Intel i5', price: 3899.00 }
};

function openDetails(sku) {
  const prod = PRODUCTS[sku];
  if (!prod) return;

  document.getElementById('detail-title').textContent = prod.name;
  document.getElementById('detail-price').textContent = `S/ ${prod.price.toFixed(2)}`;
  document.getElementById('btn-detail-add').onclick = () => addToCart(prod.sku, prod.name, prod.price);

  document.getElementById('detail-modal').style.display = 'flex';

  // Notificar al SDK de TechNova que el usuario está en la ficha técnica
  if (window.TechNova && window.TechNova.setViewingProduct) {
    window.TechNova.setViewingProduct(prod);
  }
}

function closeDetails() {
  document.getElementById('detail-modal').style.display = 'none';

  // Notificar al SDK que salió de la ficha
  if (window.TechNova && window.TechNova.exitProductView) {
    window.TechNova.exitProductView();
  }
}

function addToCart(sku, name, price) {
  const existing = cart.find(i => i.sku === sku);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ sku, name, price, qty: 1 });
  }
  updateCartUI();
  openCartDrawer();
}

function updateCartUI() {
  const countEl = document.getElementById('cart-count');
  const totalEl = document.getElementById('cart-total');
  const itemsList = document.getElementById('cart-items-list');
  const subtotalEl = document.getElementById('cart-subtotal');
  const discountRow = document.getElementById('discount-row');
  const discountEl = document.getElementById('cart-discount');
  const grandTotalEl = document.getElementById('cart-grand-total');

  const totalItems = cart.reduce((sum, i) => sum + i.qty, 0);
  const subtotal = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
  
  let discountAmount = 0;
  if (appliedDiscount > 0) {
    discountAmount = subtotal * (appliedDiscount / 100);
    discountRow.style.display = 'flex';
    discountEl.textContent = `-S/ ${discountAmount.toFixed(2)}`;
  } else {
    discountRow.style.display = 'none';
  }

  const grandTotal = Math.max(0, subtotal - discountAmount);

  countEl.textContent = totalItems;
  totalEl.textContent = `S/ ${grandTotal.toFixed(2)}`;
  subtotalEl.textContent = `S/ ${subtotal.toFixed(2)}`;
  grandTotalEl.textContent = `S/ ${grandTotal.toFixed(2)}`;

  if (cart.length === 0) {
    itemsList.innerHTML = '<div class="cart-empty">Tu carrito está vacío actualmente.</div>';
  } else {
    itemsList.innerHTML = cart.map(i => `
      <div class="cart-item-row">
        <div>
          <strong>${i.name}</strong><br>
          <small>${i.qty} x S/ ${i.price.toFixed(2)}</small>
        </div>
        <div>
          <strong>S/ ${(i.price * i.qty).toFixed(2)}</strong>
        </div>
      </div>
    `).join('');
  }
}

function openCartDrawer() {
  document.getElementById('cart-drawer').classList.add('open');
}

function closeCartDrawer() {
  document.getElementById('cart-drawer').classList.remove('open');
}

function checkout() {
  if (cart.length === 0) {
    alert('Tu carrito está vacío.');
    return;
  }
  alert('¡Compra finalizada exitosamente! Gracias por comprar en Laptops Retail Lima.');
  cart = [];
  appliedDiscount = 0;
  updateCartUI();
  closeCartDrawer();
}

// Escuchar la conversión disparada por el SDK de TechNova al aceptar la oferta
window.addEventListener('technova:conversion', (e) => {
  console.log('[Tienda Externa] Evento de conversión recibido desde el SDK:', e.detail);
  appliedDiscount = e.detail.discount_percent || 30;

  // Si el producto no estaba en el carrito, añadirlo
  const sku = 'LENOVO-G5';
  if (!cart.find(i => i.sku === sku)) {
    cart.push({ sku: sku, name: e.detail.product_name, price: e.detail.original_price, qty: 1 });
  }

  updateCartUI();
  openCartDrawer();
});

// Inicializar listeners del DOM
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('cart-btn').addEventListener('click', openCartDrawer);
  document.getElementById('cart-close-btn').addEventListener('click', closeCartDrawer);

  const testBtn = document.getElementById('btn-force-test');
  if (testBtn) {
    testBtn.addEventListener('click', () => {
      if (window.TechNova && window.TechNova.triggerTestAlert) {
        window.TechNova.triggerTestAlert();
      }
    });
  }
});
