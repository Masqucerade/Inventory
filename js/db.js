/* =============================================
   API Client — shared server storage
   ============================================= */

class InventoryDB {
  constructor() {}

  async init() { /* no local setup needed */ }

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
