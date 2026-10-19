/* Aliza Traders — client cart + contact */
(function () {
  const KEY = 'aliza_cart';

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]');
    } catch {
      return [];
    }
  }

  function saveCart(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
    updateBadge();
  }

  function updateBadge() {
    const el = document.getElementById('cartCount');
    if (!el) return;
    const n = getCart().reduce((s, i) => s + (i.qty || 1), 0);
    el.textContent = String(n);
    el.style.display = n ? 'grid' : 'none';
  }

  function addToCart(item) {
    const cart = getCart();
    const existing = cart.find((x) => x.id === item.id && x.size === item.size);
    if (existing) existing.qty += item.qty || 1;
    else cart.push({ ...item, qty: item.qty || 1 });
    saveCart(cart);
  }

  // Add to cart buttons
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('#addCartBtn');
    if (!btn) return;
    const sizeEl = document.querySelector('.size-chip[style*="maroon"]');
    const size = sizeEl ? sizeEl.getAttribute('data-size') : 'M';
    addToCart({
      id: Number(btn.dataset.id),
      name: btn.dataset.name,
      price: Number(btn.dataset.price),
      img: btn.dataset.img,
      size,
      qty: 1,
    });
    btn.textContent = 'ADDED ✓';
    setTimeout(() => (btn.textContent = 'ADD TO CART'), 1500);
  });

  // Cart page render
  function renderCart() {
    const root = document.getElementById('cartRoot');
    if (!root) return;
    const cart = getCart();
    if (!cart.length) {
      root.innerHTML =
        '<p class="empty-state">Your cart is empty.<br/><a href="/shop" class="section-link" style="display:inline-block;margin-top:12px">Continue shopping</a></p>';
      return;
    }
    let total = 0;
    const rows = cart
      .map((item, idx) => {
        total += item.price * item.qty;
        return `<div style="display:flex;gap:12px;padding:14px 0;border-bottom:1px solid var(--border)">
          <img src="${item.img}" alt="" width="72" height="96" style="object-fit:cover;border-radius:8px;background:var(--ivory-dark)" />
          <div style="flex:1">
            <div style="font-weight:600;font-size:14px">${item.name}</div>
            <div style="font-size:12px;color:var(--text-muted);margin:4px 0">Size: ${item.size || '—'} · Qty: ${item.qty}</div>
            <div style="font-weight:700;color:var(--maroon)">Rs ${(item.price * item.qty).toLocaleString('en-PK')}</div>
          </div>
          <button data-remove="${idx}" style="border:none;background:none;color:var(--danger);font-size:12px;cursor:pointer">Remove</button>
        </div>`;
      })
      .join('');
    root.innerHTML = `
      ${rows}
      <div style="margin-top:20px;display:flex;justify-content:space-between;align-items:center">
        <strong>Total</strong>
        <strong style="font-size:18px;color:var(--maroon)">Rs ${total.toLocaleString('en-PK')}</strong>
      </div>
      <a href="https://wa.me/923000000000?text=${encodeURIComponent('Order from Aliza Traders:\\n' + cart.map((i) => `${i.name} (${i.size}) x${i.qty}`).join('\\n') + '\\nTotal: Rs ' + total)}"
         class="btn btn-primary" style="width:100%;margin-top:20px;text-align:center" target="_blank" rel="noopener">
        Order on WhatsApp
      </a>
      <p style="font-size:12px;color:var(--text-muted);text-align:center;margin-top:10px">Cash on Delivery available nationwide</p>
    `;
    root.querySelectorAll('[data-remove]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cart = getCart();
        cart.splice(Number(btn.getAttribute('data-remove')), 1);
        saveCart(cart);
        renderCart();
      });
    });
  }

  // Contact form
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const payload = Object.fromEntries(fd.entries());
      const msg = document.getElementById('contactMsg');
      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.ok) {
          msg.style.color = 'var(--success)';
          msg.textContent = 'Message sent! We will reply soon.';
          form.reset();
        } else {
          msg.style.color = 'var(--danger)';
          msg.textContent = data.error || 'Failed. Try WhatsApp.';
        }
      } catch {
        msg.style.color = 'var(--danger)';
        msg.textContent = 'Network error. Please use WhatsApp.';
      }
    });
  }

  updateBadge();
  renderCart();
})();
