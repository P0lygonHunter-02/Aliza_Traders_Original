/* Aliza Traders Admin SPA */
(function () {
  const app = document.getElementById('app');
  let state = { view: 'dashboard', products: [], orders: [], messages: [], categories: [], settings: {}, stats: {} };

  async function api(path, opts = {}) {
    const res = await fetch(path, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
      ...opts,
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      renderLogin();
      throw new Error('unauthorized');
    }
    return { res, data };
  }

  function money(n) {
    return 'Rs ' + Number(n || 0).toLocaleString('en-PK');
  }

  function esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ---------- Login ---------- */
  function renderLogin(err) {
    app.innerHTML = `
      <div class="login-wrap">
        <div class="login-card">
          <div class="brand">
            <img src="/img/logo.png" alt="Aliza Traders" />
            <h1>Admin Panel</h1>
            <p>Sign in to manage store</p>
          </div>
          <form id="loginForm">
            <div class="field"><label>Username</label><input name="username" autocomplete="username" required value="admin" /></div>
            <div class="field"><label>Password</label><input name="password" type="password" autocomplete="current-password" required /></div>
            <button class="btn btn-primary" type="submit">Sign in</button>
            ${err ? `<p class="err">${esc(err)}</p>` : ''}
          </form>
        </div>
      </div>`;
    document.getElementById('loginForm').onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        const { data } = await api('/api/admin/login', {
          method: 'POST',
          body: JSON.stringify({ username: fd.get('username'), password: fd.get('password') }),
        });
        if (!data.ok) return renderLogin(data.error || 'Login failed');
        boot();
      } catch {
        renderLogin('Network error');
      }
    };
  }

  /* ---------- Shell ---------- */
  function shell(title, bodyHtml) {
    return `
    <div class="shell">
      <aside class="sidebar">
        <div class="side-brand"><img src="/img/logo.png" alt="Aliza" /></div>
        <nav>
          <button class="nav-btn ${state.view === 'dashboard' ? 'active' : ''}" data-nav="dashboard">Dashboard</button>
          <button class="nav-btn ${state.view === 'products' ? 'active' : ''}" data-nav="products">Products</button>
          <button class="nav-btn ${state.view === 'orders' ? 'active' : ''}" data-nav="orders">Orders</button>
          <button class="nav-btn ${state.view === 'messages' ? 'active' : ''}" data-nav="messages">Messages</button>
          <button class="nav-btn ${state.view === 'settings' ? 'active' : ''}" data-nav="settings">Settings</button>
          <a href="/" target="_blank" rel="noopener">View store →</a>
        </nav>
        <div class="side-foot">
          <button class="nav-btn" id="logoutBtn">Logout</button>
        </div>
      </aside>
      <div class="main">
        <div class="topbar"><h2>${esc(title)}</h2></div>
        <div class="content">${bodyHtml}</div>
      </div>
    </div>`;
  }

  function bindNav() {
    app.querySelectorAll('[data-nav]').forEach((btn) => {
      btn.onclick = () => {
        state.view = btn.getAttribute('data-nav');
        route();
      };
    });
    const lo = document.getElementById('logoutBtn');
    if (lo) {
      lo.onclick = async () => {
        await api('/api/admin/logout', { method: 'POST' });
        renderLogin();
      };
    }
  }

  /* ---------- Views ---------- */
  async function viewDashboard() {
    const { data } = await api('/api/admin/dashboard');
    state.stats = data.stats || {};
    const s = state.stats;
    app.innerHTML = shell(
      'Dashboard',
      `<div class="stats">
        <div class="stat"><div class="n">${s.products ?? 0}</div><div class="l">Products</div></div>
        <div class="stat"><div class="n">${s.orders ?? 0}</div><div class="l">Orders</div></div>
        <div class="stat"><div class="n">${s.pending ?? 0}</div><div class="l">Pending</div></div>
        <div class="stat"><div class="n">${s.unreadMessages ?? 0}</div><div class="l">Unread msgs</div></div>
        <div class="stat"><div class="n">${money(s.revenue)}</div><div class="l">Revenue</div></div>
      </div>
      <div class="panel"><div class="panel-h"><h3>Quick actions</h3></div>
        <div style="padding:16px;display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-primary btn-sm" data-nav="products">Manage products</button>
          <button class="btn btn-ghost btn-sm" data-nav="settings">Edit store settings</button>
        </div>
      </div>`
    );
    bindNav();
    app.querySelectorAll('[data-nav]').forEach((btn) => {
      btn.onclick = () => {
        state.view = btn.getAttribute('data-nav');
        route();
      };
    });
  }

  async function viewProducts() {
    const [{ data: pd }, { data: cd }] = await Promise.all([
      api('/api/admin/products'),
      api('/api/admin/categories'),
    ]);
    state.products = pd.products || [];
    state.categories = cd.categories || [];

    const rows = state.products
      .map(
        (p) => `<tr>
        <td><img class="thumb" src="${esc(p.image_url || 'https://picsum.photos/seed/p' + p.id + '/80/100')}" alt="" /></td>
        <td><strong>${esc(p.name)}</strong><div style="color:var(--muted);font-size:11px">${esc(p.category_name || '')}</div></td>
        <td>${money(p.price)}</td>
        <td>${p.stock}</td>
        <td>${p.is_active ? '<span class="badge badge-on">Live</span>' : '<span class="badge badge-off">Hidden</span>'}</td>
        <td class="actions">
          <button class="btn btn-ghost btn-sm" data-edit="${p.id}">Edit</button>
          <button class="btn btn-danger btn-sm" data-del="${p.id}">Delete</button>
        </td>
      </tr>`
      )
      .join('');

    app.innerHTML = shell(
      'Products',
      `<div class="panel">
        <div class="panel-h">
          <h3>${state.products.length} products</h3>
          <button class="btn btn-primary btn-sm" id="addProduct">+ Add product</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th></th><th>Name</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr></thead>
            <tbody>${rows || '<tr><td colspan="6" class="empty">No products yet</td></tr>'}</tbody>
          </table>
        </div>
      </div>
      <div id="modalRoot"></div>`
    );
    bindNav();
    document.getElementById('addProduct').onclick = () => openProductModal();
    app.querySelectorAll('[data-edit]').forEach((b) => {
      b.onclick = () => openProductModal(Number(b.getAttribute('data-edit')));
    });
    app.querySelectorAll('[data-del]').forEach((b) => {
      b.onclick = async () => {
        if (!confirm('Delete this product?')) return;
        await api('/api/admin/products/' + b.getAttribute('data-del'), { method: 'DELETE' });
        viewProducts();
      };
    });
  }

  function openProductModal(id) {
    const p = id ? state.products.find((x) => x.id === id) : null;
    const cats = state.categories
      .map((c) => `<option value="${c.id}" ${p && p.category_id == c.id ? 'selected' : ''}>${esc(c.name)}</option>`)
      .join('');
    const root = document.getElementById('modalRoot');
    root.innerHTML = `
      <div class="modal-bg">
        <div class="modal">
          <h3>${p ? 'Edit product' : 'Add product'}</h3>
          <form id="prodForm" class="form-grid">
            <div class="field"><label>Name *</label><input name="name" required value="${esc(p?.name || '')}" /></div>
            <div class="form-row">
              <div class="field"><label>Price (PKR) *</label><input name="price" type="number" required value="${p?.price ?? ''}" /></div>
              <div class="field"><label>Compare at</label><input name="compare_at_price" type="number" value="${p?.compare_at_price ?? ''}" /></div>
            </div>
            <div class="form-row">
              <div class="field"><label>Category</label><select name="category_id"><option value="">—</option>${cats}</select></div>
              <div class="field"><label>Stock</label><input name="stock" type="number" value="${p?.stock ?? 10}" /></div>
            </div>
            <div class="field"><label>Image URL</label><input name="image_url" placeholder="https://… (ImgBB / R2 later)" value="${esc(p?.image_url || '')}" /></div>
            <div class="field"><label>Sizes (comma)</label><input name="sizes" value="${esc(p?.sizes || 'S,M,L,XL')}" /></div>
            <div class="field"><label>Description</label><textarea name="description" rows="2">${esc(p?.description || '')}</textarea></div>
            <div class="field"><label>Details (one per line)</label><textarea name="details" rows="3">${esc(p?.details || '')}</textarea></div>
            <div class="checks">
              <label><input type="checkbox" name="is_featured" ${p?.is_featured ? 'checked' : ''}/> Featured</label>
              <label><input type="checkbox" name="is_new" ${p?.is_new ? 'checked' : ''}/> New</label>
              <label><input type="checkbox" name="is_sale" ${p?.is_sale ? 'checked' : ''}/> On sale</label>
              <label><input type="checkbox" name="is_active" ${!p || p.is_active ? 'checked' : ''}/> Live on store</label>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-ghost" id="cancelModal">Cancel</button>
              <button type="submit" class="btn btn-primary">${p ? 'Save' : 'Create'}</button>
            </div>
          </form>
        </div>
      </div>`;
    document.getElementById('cancelModal').onclick = () => (root.innerHTML = '');
    document.getElementById('prodForm').onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const body = {
        name: fd.get('name'),
        price: Number(fd.get('price')),
        compare_at_price: fd.get('compare_at_price') ? Number(fd.get('compare_at_price')) : null,
        category_id: fd.get('category_id') ? Number(fd.get('category_id')) : null,
        stock: Number(fd.get('stock') || 0),
        image_url: fd.get('image_url') || null,
        sizes: fd.get('sizes'),
        description: fd.get('description'),
        details: fd.get('details'),
        is_featured: !!fd.get('is_featured'),
        is_new: !!fd.get('is_new'),
        is_sale: !!fd.get('is_sale'),
        is_active: !!fd.get('is_active'),
      };
      if (p) await api('/api/admin/products/' + p.id, { method: 'PUT', body: JSON.stringify(body) });
      else await api('/api/admin/products', { method: 'POST', body: JSON.stringify(body) });
      root.innerHTML = '';
      viewProducts();
    };
  }

  async function viewOrders() {
    const { data } = await api('/api/admin/orders');
    state.orders = data.orders || [];
    const rows = state.orders
      .map((o) => {
        let items = '';
        try {
          items = JSON.parse(o.items || '[]')
            .map((i) => `${i.name} x${i.qty}`)
            .join(', ');
        } catch {
          items = o.items || '';
        }
        return `<tr>
          <td><strong>#${esc(o.order_number || o.id)}</strong><div style="font-size:11px;color:var(--muted)">${esc(o.created_at || '')}</div></td>
          <td>${esc(o.customer_name)}<div style="font-size:11px">${esc(o.customer_phone)}</div></td>
          <td style="max-width:180px;font-size:12px">${esc(items)}</td>
          <td>${money(o.total)}</td>
          <td>
            <select data-status="${o.id}" class="status-sel" style="padding:6px;border-radius:6px;border:1px solid var(--border)">
              ${['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']
                .map((s) => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s}</option>`)
                .join('')}
            </select>
          </td>
        </tr>`;
      })
      .join('');

    app.innerHTML = shell(
      'Orders',
      `<div class="panel"><div class="panel-h"><h3>${state.orders.length} orders</h3></div>
      <div class="table-wrap"><table>
        <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="5" class="empty">No orders yet — cart WhatsApp flow does not create DB orders until Phase 3</td></tr>'}</tbody>
      </table></div></div>`
    );
    bindNav();
    app.querySelectorAll('.status-sel').forEach((sel) => {
      sel.onchange = async () => {
        await api('/api/admin/orders/' + sel.getAttribute('data-status'), {
          method: 'PATCH',
          body: JSON.stringify({ status: sel.value }),
        });
      };
    });
  }

  async function viewMessages() {
    const { data } = await api('/api/admin/messages');
    state.messages = data.messages || [];
    const rows = state.messages
      .map(
        (m) => `<tr style="${m.is_read ? '' : 'background:#FFFBF0'}">
        <td><strong>${esc(m.name)}</strong><div style="font-size:11px;color:var(--muted)">${esc(m.phone || '')} ${esc(m.email || '')}</div></td>
        <td style="max-width:280px;font-size:13px">${esc(m.message)}</td>
        <td style="font-size:11px;color:var(--muted)">${esc(m.created_at || '')}</td>
        <td class="actions">
          ${!m.is_read ? `<button class="btn btn-ghost btn-sm" data-read="${m.id}">Mark read</button>` : ''}
          <button class="btn btn-danger btn-sm" data-mdel="${m.id}">Delete</button>
        </td>
      </tr>`
      )
      .join('');

    app.innerHTML = shell(
      'Messages',
      `<div class="panel"><div class="panel-h"><h3>${state.messages.length} messages</h3></div>
      <div class="table-wrap"><table>
        <thead><tr><th>From</th><th>Message</th><th>Date</th><th></th></tr></thead>
        <tbody>${rows || '<tr><td colspan="4" class="empty">No messages</td></tr>'}</tbody>
      </table></div></div>`
    );
    bindNav();
    app.querySelectorAll('[data-read]').forEach((b) => {
      b.onclick = async () => {
        await api('/api/admin/messages/' + b.getAttribute('data-read') + '/read', { method: 'PATCH' });
        viewMessages();
      };
    });
    app.querySelectorAll('[data-mdel]').forEach((b) => {
      b.onclick = async () => {
        if (!confirm('Delete message?')) return;
        await api('/api/admin/messages/' + b.getAttribute('data-mdel'), { method: 'DELETE' });
        viewMessages();
      };
    });
  }

  async function viewSettings() {
    const { data } = await api('/api/admin/settings');
    const s = data.settings || {};
    app.innerHTML = shell(
      'Settings',
      `<form id="setForm" class="panel" style="padding:20px;max-width:640px">
        <h3 style="margin-bottom:16px;color:var(--maroon)">Contact & social</h3>
        <div class="form-grid">
          <div class="form-row">
            <div class="field"><label>Phone</label><input name="phone" value="${esc(s.phone || '')}" /></div>
            <div class="field"><label>WhatsApp (92…)</label><input name="whatsapp" value="${esc(s.whatsapp || '')}" /></div>
          </div>
          <div class="field"><label>Email</label><input name="email" value="${esc(s.email || '')}" /></div>
          <div class="field"><label>Instagram URL</label><input name="instagram" value="${esc(s.instagram || '')}" /></div>
          <div class="field"><label>Facebook URL</label><input name="facebook" value="${esc(s.facebook || '')}" /></div>
          <div class="field"><label>TikTok URL</label><input name="tiktok" value="${esc(s.tiktok || '')}" /></div>
          <div class="field"><label>Address</label><input name="address" value="${esc(s.address || '')}" /></div>
          <div class="field"><label>Announcement ticker</label><input name="announcement" value="${esc(s.announcement || '')}" /></div>
          <div class="field"><label>Hero title</label><input name="hero_title" value="${esc(s.hero_title || '')}" /></div>
          <div class="field"><label>Hero subtitle</label><input name="hero_subtitle" value="${esc(s.hero_subtitle || '')}" /></div>
          <div class="field"><label>Shipping note</label><input name="shipping_note" value="${esc(s.shipping_note || '')}" /></div>
          <h3 style="margin:12px 0 8px;color:var(--maroon)">Storefront stats (manual)</h3>
          <div class="form-row">
            <div class="field"><label>Happy customers</label><input name="stats_customers" value="${esc(s.stats_customers || '500+')}" /></div>
            <div class="field"><label>Unique designs</label><input name="stats_designs" value="${esc(s.stats_designs || '50+')}" /></div>
          </div>
          <div class="form-row">
            <div class="field"><label>Orders delivered</label><input name="stats_orders" value="${esc(s.stats_orders || '1200+')}" /></div>
            <div class="field"><label>Rating</label><input name="stats_rating" value="${esc(s.stats_rating || '4.9')}" /></div>
          </div>
          <button type="submit" class="btn btn-primary" style="width:auto">Save settings</button>
          <p id="setMsg" class="ok" style="display:none">Saved ✓</p>
        </div>
      </form>`
    );
    bindNav();
    document.getElementById('setForm').onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const body = Object.fromEntries(fd.entries());
      await api('/api/admin/settings', { method: 'PUT', body: JSON.stringify(body) });
      const msg = document.getElementById('setMsg');
      msg.style.display = 'block';
      setTimeout(() => (msg.style.display = 'none'), 2000);
    };
  }

  async function route() {
    try {
      if (state.view === 'dashboard') await viewDashboard();
      else if (state.view === 'products') await viewProducts();
      else if (state.view === 'orders') await viewOrders();
      else if (state.view === 'messages') await viewMessages();
      else if (state.view === 'settings') await viewSettings();
    } catch (e) {
      if (String(e.message) !== 'unauthorized') {
        app.innerHTML = `<div class="empty">Error loading admin. <button class="btn btn-ghost" onclick="location.reload()">Retry</button></div>`;
      }
    }
  }

  async function boot() {
    try {
      const { data } = await api('/api/admin/me');
      if (!data.ok) return renderLogin();
      state.view = 'dashboard';
      await route();
    } catch {
      renderLogin();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
