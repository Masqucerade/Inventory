/* =============================================
   API Client — shared server storage
   ============================================= */

/* Прозрачно добавляем токен авторизации ко всем запросам /api
   и ловим 401 (сессия истекла → показать экран входа). */
(function () {
  const orig = window.fetch.bind(window);
  window.fetch = (url, opts = {}) => {
    if (typeof url === 'string' && url.startsWith('/api')) {
      const token = localStorage.getItem('inv_token') || '';
      opts = { ...opts, headers: { ...(opts.headers || {}), 'x-auth-token': token } };
      return orig(url, opts).then(res => {
        if (res.status === 401 && !url.startsWith('/api/login')) {
          localStorage.removeItem('inv_token');
          window.dispatchEvent(new CustomEvent('inv-unauthorized'));
        }
        return res;
      });
    }
    return orig(url, opts);
  };
})();

class InventoryDB {
  constructor() {}

  async init() { /* no local setup needed */ }

  /* ─── AUTH ─── */
  async login(login, password) {
    const r = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ login, password }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || 'Ошибка входа');
    localStorage.setItem('inv_token', d.token);
    return d.user;
  }
  async me() {
    const r = await fetch('/api/me');
    return r.ok ? r.json() : null;
  }
  async logout() {
    try { await fetch('/api/logout', { method: 'POST' }); } catch {}
    localStorage.removeItem('inv_token');
  }
  async changeMyPassword(password) {
    const r = await fetch('/api/me/password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || 'Ошибка');
    return d;
  }
  async reimburseExpenses() {
    const r = await fetch('/api/employee-payments/reimburse', { method: 'POST' });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || 'Ошибка');
    return d;
  }

  /* ─── USERS (root) ─── */
  async getUsers() {
    try { const r = await fetch('/api/users'); return r.ok ? r.json() : []; }
    catch { return []; }
  }
  async addUser(u) {
    const r = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(u) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || 'Ошибка');
    return d;
  }
  async updateUser(id, u) {
    const r = await fetch(`/api/users/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(u) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || 'Ошибка');
    return d;
  }
  async deleteUser(id) {
    const r = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || 'Ошибка');
    return d;
  }

  uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  /* ─── ITEMS ─── */
  async getItems(filter = {}) {
    const p = new URLSearchParams();
    if (filter.ownerId)     p.set('ownerId',     filter.ownerId);
    if (filter.orderStatus) p.set('orderStatus', filter.orderStatus);
    if (filter.search)      p.set('search',      filter.search);
    try {
      const r = await fetch(`/api/items?${p}`);
      return r.ok ? r.json() : [];
    } catch { return []; }
  }

  async getItem(id) {
    try {
      const r = await fetch(`/api/items/${id}`);
      return r.ok ? r.json() : null;
    } catch { return null; }
  }

  async saveItem(item) {
    const r = await fetch('/api/items', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(item),
    });
    return r.json();
  }

  async deleteItem(id) {
    await fetch(`/api/items/${id}`, { method: 'DELETE' });
  }

  /* ─── OWNERS ─── */
  async getOwners() {
    try {
      const r = await fetch('/api/owners');
      return r.ok ? r.json() : [];
    } catch { return []; }
  }

  async saveOwner(owner) {
    const r = await fetch('/api/owners', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(owner),
    });
    return r.json();
  }

  async deleteOwner(id) {
    await fetch(`/api/owners/${id}`, { method: 'DELETE' });
  }

  /* ─── SETTINGS (remain local per-device) ─── */
  async getSetting(key, def = null) {
    try {
      const v = localStorage.getItem(`inv_s_${key}`);
      return v !== null ? JSON.parse(v) : def;
    } catch { return def; }
  }

  async setSetting(key, value) {
    localStorage.setItem(`inv_s_${key}`, JSON.stringify(value));
  }

  /* ─── LOGS ─── */
  async logAction(type, desc, meta = {}) {
    try {
      const r = await fetch('/api/logs', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ type, desc, meta }),
      });
      return r.json();
    } catch { return { type, desc }; }
  }

  async getLogs(limit = 80) {
    try {
      const r = await fetch('/api/logs');
      const logs = await r.json();
      return logs.slice(0, limit);
    } catch { return []; }
  }

  async clearLogs() {
    await fetch('/api/logs', { method: 'DELETE' });
  }

  /* ─── EMPLOYEE PAYMENTS ─── */
  async getEmployeePayments(ownerId = null) {
    try {
      const url = ownerId ? `/api/employee-payments?ownerId=${ownerId}` : '/api/employee-payments';
      const r = await fetch(url);
      return r.ok ? r.json() : [];
    } catch { return []; }
  }

  async addEmployeePayment(payment) {
    const r = await fetch('/api/employee-payments', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payment),
    });
    return r.json();
  }

  async deleteEmployeePayment(id) {
    await fetch(`/api/employee-payments/${id}`, { method: 'DELETE' });
  }

  /* ─── PAYMENTS ─── */
  async getPayments() {
    try {
      const r = await fetch('/api/payments');
      return r.ok ? r.json() : [];
    } catch { return []; }
  }

  async addPayment(payment) {
    const r = await fetch('/api/payments', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payment),
    });
    return r.json();
  }

  async deletePayment(id) {
    await fetch(`/api/payments/${id}`, { method: 'DELETE' });
  }

  /* ─── PURCHASE PLANS ─── */
  async getPlans() {
    try {
      const r = await fetch('/api/plans');
      return r.ok ? r.json() : [];
    } catch { return []; }
  }

  async addPlan(plan) {
    const r = await fetch('/api/plans', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(plan),
    });
    return r.json();
  }

  async patchPlan(id, patch) {
    const r = await fetch(`/api/plans/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(patch),
    });
    return r.json();
  }

  async deletePlan(id) {
    await fetch(`/api/plans/${id}`, { method: 'DELETE' });
  }

  /* ─── CATEGORIES ─── */
  async getCategories() {
    try { const r = await fetch('/api/categories'); return r.ok ? r.json() : []; }
    catch { return []; }
  }
  async addCategory(cat) {
    const r = await fetch('/api/categories', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(cat) });
    return r.json();
  }
  async deleteCategory(id) { await fetch(`/api/categories/${id}`, { method:'DELETE' }); }

  /* ─── TASKS ─── */
  async getTasks() {
    try { const r = await fetch('/api/tasks'); return r.ok ? r.json() : []; }
    catch { return []; }
  }
  async addTask(task) {
    const r = await fetch('/api/tasks', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(task) });
    return r.json();
  }
  async patchTask(id, patch) {
    const r = await fetch(`/api/tasks/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(patch) });
    return r.json();
  }
  async deleteTask(id) { await fetch(`/api/tasks/${id}`, { method:'DELETE' }); }

  /* ─── QUICK ACCESS ─── */
  async getQuickItems() {
    try { const r = await fetch('/api/quickaccess'); return r.ok ? r.json() : []; }
    catch { return []; }
  }
  async addQuickItem(item) {
    const r = await fetch('/api/quickaccess', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(item) });
    return r.json();
  }
  async patchQuickItem(id, patch) {
    const r = await fetch(`/api/quickaccess/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(patch) });
    return r.json();
  }
  async deleteQuickItem(id) { await fetch(`/api/quickaccess/${id}`, { method:'DELETE' }); }

  /* ─── PROJECT NOTES ─── */
  async getProjectNotes() {
    try {
      const r = await fetch('/api/project');
      return r.ok ? r.json() : [];
    } catch { return []; }
  }

  async addProjectNote(note) {
    const r = await fetch('/api/project', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note),
    });
    return r.json();
  }

  async patchProjectNote(id, patch) {
    const r = await fetch(`/api/project/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    return r.json();
  }

  async deleteProjectNote(id) {
    await fetch(`/api/project/${id}`, { method: 'DELETE' });
  }

  /* ─── FAQ ─── */
  async getFaqItems() {
    try {
      const r = await fetch('/api/faq');
      return r.ok ? r.json() : [];
    } catch { return []; }
  }

  async addFaqItem(item) {
    const r = await fetch('/api/faq', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(item),
    });
    return r.json();
  }

  async patchFaqItem(id, patch) {
    const r = await fetch(`/api/faq/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(patch),
    });
    return r.json();
  }

  async deleteFaqItem(id) {
    await fetch(`/api/faq/${id}`, { method: 'DELETE' });
  }

  /* ─── SALES ─── */
  async getSales() {
    try { const r = await fetch('/api/sales'); return r.ok ? r.json() : []; }
    catch { return []; }
  }
  async addSale(sale) {
    const r = await fetch('/api/sales', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sale) });
    return r.json();
  }
  async deleteSale(id) { await fetch(`/api/sales/${id}`, { method: 'DELETE' }); }

  /* ─── EXPORT / IMPORT ─── */
  async exportAll() {
    const r = await fetch('/api/export');
    return r.json();
  }

  async importAll(data) {
    await fetch('/api/import', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    });
  }
}
