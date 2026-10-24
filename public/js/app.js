/* Aliza Traders — cart, checkout (Phase 3), contact */
(function () {
  const KEY = 'aliza_cart';
  let publicSettings = { whatsapp: '923000000000', shipping_note: '' };

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

  function money(n) {
    return 'Rs ' + Number(n || 0).toLocaleString('en-PK');
  }

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
        return `<div class="cart-row" style="display:flex;gap:12px;padding:14px 0;border-bottom:1px solid var(--border)">
          <img src="${item.img}" alt="" width="72" height="96" style="object-fit:cover;border-radius:8px;background:var(--ivory-dark)" />
          <div style="flex:1">
            <div style="font-weight:600;font-size:14px">${item.name}</div>
            <div style="font-size:12px;color:var(--text-muted);margin:4px 0">Size: ${item.size || '—'} · Qty:
              <button type="button" data-qty="${idx}" data-d="-1" style="border:1px solid var(--border);width:24px;height:24px;border-radius:4px;background:white;cursor:pointer">−</button>
              <strong style="margin:0 6px">${item.qty}</strong>
              <button type="button" data-qty="${idx}" data-d="1" style="border:1px solid var(--border);width:24px;height:24px;border-radius:4px;background:white;cursor:pointer">+</button>
            </div>
            <div style="font-weight:700;color:var(--maroon)">${money(item.price * item.qty)}</div>
          </div>
          <button data-remove="${idx}" style="border:none;background:none;color:var(--danger);font-size:12px;cursor:pointer">Remove</button>
        </div>`;
      })
      .join('');

    root.innerHTML = `
      ${rows}
      <div style="margin-top:20px;display:flex;justify-content:space-between;align-items:center">
        <strong>Total</strong>
        <strong style="font-size:18px;color:var(--maroon)">${money(total)}</strong>
      </div>
      <p style="font-size:12px;color:var(--text-muted);margin:8px 0 20px">${publicSettings.shipping_note || 'Cash on Delivery · Nationwide Pakistan'}</p>

      <div class="checkout-box" style="background:var(--white);border:1px solid var(--border);border-radius:var(--radius);padding:20px;margin-top:8px">
        <h3 style="font-size:15px;margin-bottom:14px;color:var(--maroon)">Checkout · COD</h3>
        <form id="checkoutForm" style="display:grid;gap:12px">
          <input name="customer_name" required placeholder="Full name *" style="padding:12px 14px;border:1px solid var(--border);border-radius:8px;background:var(--ivory)" />
          <input name="customer_phone" required placeholder="Phone / WhatsApp *" style="padding:12px 14px;border:1px solid var(--border);border-radius:8px;background:var(--ivory)" />
          <input name="city" required placeholder="City *" style="padding:12px 14px;border:1px solid var(--border);border-radius:8px;background:var(--ivory)" />
          <textarea name="customer_address" required rows="2" placeholder="Full delivery address *" style="padding:12px 14px;border:1px solid var(--border);border-radius:8px;background:var(--ivory);resize:vertical"></textarea>
          <input name="customer_email" type="email" placeholder="Email (optional)" style="padding:12px 14px;border:1px solid var(--border);border-radius:8px;background:var(--ivory)" />
          <textarea name="notes" rows="2" placeholder="Order notes (optional)" style="padding:12px 14px;border:1px solid var(--border);border-radius:8px;background:var(--ivory);resize:vertical"></textarea>
          <button type="submit" class="btn btn-primary" id="placeOrderBtn" style="width:100%">Place Order · ${money(total)}</button>
          <p id="checkoutMsg" style="font-size:13px;text-align:center;min-height:18px"></p>
        </form>
      </div>
    `;

    root.querySelectorAll('[data-remove]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cart = getCart();
        cart.splice(Number(btn.getAttribute('data-remove')), 1);
        saveCart(cart);
        renderCart();
      });
    });
    root.querySelectorAll('[data-qty]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cart = getCart();
        const idx = Number(btn.getAttribute('data-qty'));
        const d = Number(btn.getAttribute('data-d'));
        if (!cart[idx]) return;
        cart[idx].qty = Math.max(1, (cart[idx].qty || 1) + d);
        saveCart(cart);
        renderCart();
      });
    });

    const form = document.getElementById('checkoutForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const msg = document.getElementById('checkoutMsg');
        const submitBtn = document.getElementById('placeOrderBtn');
        const fd = new FormData(form);
        const items = getCart();
        if (!items.length) {
          msg.style.color = 'var(--danger)';
          msg.textContent = 'Cart is empty';
          return;
        }
        submitBtn.disabled = true;
        submitBtn.textContent = 'Placing order…';
        try {
          const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customer_name: fd.get('customer_name'),
              customer_phone: fd.get('customer_phone'),
              customer_email: fd.get('customer_email') || '',
              customer_address: fd.get('customer_address'),
              city: fd.get('city'),
              notes: fd.get('notes') || '',
              items,
            }),
          });
          const data = await res.json();
          if (!data.ok) {
            msg.style.color = 'var(--danger)';
            msg.textContent = data.error || 'Order failed';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Place Order';
            return;
          }
          saveCart([]);
          root.innerHTML = `
            <div style="text-align:center;padding:32px 12px">
              <div style="font-size:40px;margin-bottom:12px">✓</div>
              <h2 style="color:var(--maroon);margin-bottom:8px">Order placed!</h2>
              <p style="font-size:14px;color:var(--text-soft);margin-bottom:6px">Order number</p>
              <p style="font-size:22px;font-weight:800;color:var(--gold-dim);margin-bottom:16px">${data.order_number}</p>
              <p style="font-size:14px;margin-bottom:20px">Total ${money(data.total)} · Cash on Delivery</p>
              <a class="btn btn-primary" href="${data.whatsapp_url}" target="_blank" rel="noopener" style="display:inline-flex;margin-bottom:12px">Confirm on WhatsApp</a>
              <br/>
              <a href="/shop" class="section-link" style="display:inline-block;margin-top:12px">Continue shopping</a>
            </div>`;
          updateBadge();
        } catch {
          msg.style.color = 'var(--danger)';
          msg.textContent = 'Network error. Try again.';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Place Order';
        }
      });
    }
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

  fetch('/api/settings/public')
    .then((r) => r.json())
    .then((d) => {
      if (d && d.ok) publicSettings = d;
    })
    .catch(() => {})
    .finally(() => {
      updateBadge();
      renderCart();
    });
})();
