/* =============================================
   IndexedDB Database Layer  v2
   ============================================= */

class InventoryDB {
  constructor() {
    this.DB_NAME    = 'InventoryDB';
    this.DB_VERSION = 2;          // bumped: added 'logs' store
    this.db         = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      req.onerror    = () => reject(req.error);
      req.onsuccess  = () => { this.db = req.result; resolve(); };

      req.onupgradeneeded = (e) => {
        const db  = e.target.result;
        const old = e.oldVersion;

        /* v1 → items + owners + settings */
        if (old < 1) {
          const items = db.createObjectStore('items', { keyPath: 'id' });
          items.createIndex('ownerId',     'ownerId',     { unique: false });
          items.createIndex('orderStatus', 'orderStatus', { unique: false });
          items.createIndex('type',        'type',        { unique: false });
          items.createIndex('createdAt',   'createdAt',   { unique: false });

          db.createObjectStore('owners',   { keyPath: 'id' });
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        /* v2 → logs store */
        if (old < 2) {
          const logs = db.createObjectStore('logs', { keyPath: 'id' });
          logs.createIndex('ts', 'ts', { unique: false });
        }
      };
    });
  }

  uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  /* ───────── items ───────── */

  async getItems(filter = {}) {
    return new Promise((resolve, reject) => {
      const req = this.db.transaction('items', 'readonly').objectStore('items').getAll();
      req.onsuccess = () => {
        let rows = req.result || [];

        if (filter.ownerId)     rows = rows.filter(i => i.ownerId     === filter.ownerId);
        if (filter.orderStatus) rows = rows.filter(i => i.orderStatus === filter.orderStatus);
        if (filter.type)        rows = rows.filter(i => i.type        === filter.type);
        if (filter.search) {
          const q = filter.search.toLowerCase();
          rows = rows.filter(i =>
            (i.name  || '').toLowerCase().includes(q) ||
            (i.type  || '').toLowerCase().includes(q) ||
            (i.size  || '').toLowerCase().includes(q) ||
            (i.notes || '').toLowerCase().includes(q)
          );
        }

        rows.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        resolve(rows);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async getItem(id) {
    return new Promise((resolve, reject) => {
      const req = this.db.transaction('items', 'readonly').objectStore('items').get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => reject(req.error);
    });
  }

  async saveItem(item) {
    const now = new Date().toISOString();
    if (!item.id) { item.id = this.uid(); item.createdAt = now; }
    item.updatedAt = now;
    item.total     = Math.round(((item.quantity || 0) * (item.price || 0)) * 100) / 100;

    return new Promise((resolve, reject) => {
      const req = this.db.transaction('items', 'readwrite').objectStore('items').put(item);
      req.onsuccess = () => resolve(item);
      req.onerror   = () => reject(req.error);
    });
  }

  async deleteItem(id) {
    return new Promise((resolve, reject) => {
      const req = this.db.transaction('items', 'readwrite').objectStore('items').delete(id);
      req.onsuccess = () => resolve();
      req.onerror   = () => reject(req.error);
    });
  }

  /* ───────── owners ───────── */

  async getOwners() {
    return new Promise((resolve, reject) => {
      const req = this.db.transaction('owners', 'readonly').objectStore('owners').getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror   = () => reject(req.error);
    });
  }

  async saveOwner(owner) {
    if (!owner.id) { owner.id = this.uid(); owner.createdAt = new Date().toISOString(); }
    return new Promise((resolve, reject) => {
      const req = this.db.transaction('owners', 'readwrite').objectStore('owners').put(owner);
      req.onsuccess = () => resolve(owner);
      req.onerror   = () => reject(req.error);
    });
  }

  async deleteOwner(id) {
    return new Promise((resolve, reject) => {
      const req = this.db.transaction('owners', 'readwrite').objectStore('owners').delete(id);
      req.onsuccess = () => resolve();
      req.onerror   = () => reject(req.error);
    });
  }

  /* ───────── settings ───────── */

  async getSetting(key, def = null) {
    return new Promise((resolve) => {
      const req = this.db.transaction('settings', 'readonly').objectStore('settings').get(key);
      req.onsuccess = () => resolve(req.result?.value ?? def);
      req.onerror   = () => resolve(def);
    });
  }

  async setSetting(key, value) {
    return new Promise((resolve, reject) => {
      const req = this.db.transaction('settings', 'readwrite').objectStore('settings').put({ key, value });
      req.onsuccess = () => resolve();
      req.onerror   = () => reject(req.error);
    });
  }

  /* ───────── logs ───────── */

  /**
   * @param {string} type     — 'item_add' | 'item_edit' | 'item_delete' |
   *                            'owner_add' | 'owner_edit' | 'owner_delete' |
   *                            'backup' | 'restore' | 'clear'
   * @param {string} desc     — human-readable description
   * @param {object} [meta]   — optional payload snapshot
   */
  async logAction(type, desc, meta = {}) {
    const entry = { id: this.uid(), type, desc, meta, ts: new Date().toISOString() };
    return new Promise((resolve) => {
      // Log failures must NEVER break the app — swallow silently
      try {
        const req = this.db.transaction('logs', 'readwrite').objectStore('logs').add(entry);
        req.onsuccess = () => resolve(entry);
        req.onerror   = () => resolve(entry);
      } catch (_) { resolve(entry); }
    });
  }

  async getLogs(limit = 80) {
    return new Promise((resolve, reject) => {
      const store   = this.db.transaction('logs', 'readonly').objectStore('logs');
      const results = [];
      const req     = store.openCursor(null, 'prev');   // newest first
      req.onsuccess = (e) => {
        const c = e.target.result;
        if (c && results.length < limit) { results.push(c.value); c.continue(); }
        else resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async clearLogs() {
    return new Promise((resolve, reject) => {
      const req = this.db.transaction('logs', 'readwrite').objectStore('logs').clear();
      req.onsuccess = () => resolve();
      req.onerror   = () => reject(req.error);
    });
  }

  /* ───────── import / export ───────── */

  async exportAll() {
    const [items, owners] = await Promise.all([this.getItems(), this.getOwners()]);
    return { version: 2, exportedAt: new Date().toISOString(), items, owners };
  }

  async importAll(data) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['items', 'owners'], 'readwrite');
      tx.objectStore('items').clear();
      tx.objectStore('owners').clear();
      (data.items  || []).forEach(i => tx.objectStore('items').put(i));
      (data.owners || []).forEach(o => tx.objectStore('owners').put(o));
      tx.oncomplete = () => resolve();
      tx.onerror    = () => reject(tx.error);
    });
  }
}
