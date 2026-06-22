/* =============================================
   IndexedDB Database Layer
   ============================================= */

class InventoryDB {
  constructor() {
    this.DB_NAME    = 'InventoryDB';
    this.DB_VERSION = 1;
    this.db         = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        this.db = req.result;
        resolve();
      };

      req.onupgradeneeded = (e) => {
        const db = e.target.result;

        /* items */
        if (!db.objectStoreNames.contains('items')) {
          const s = db.createObjectStore('items', { keyPath: 'id' });
          s.createIndex('ownerId',     'ownerId',     { unique: false });
          s.createIndex('orderStatus', 'orderStatus', { unique: false });
          s.createIndex('type',        'type',        { unique: false });
          s.createIndex('createdAt',   'createdAt',   { unique: false });
        }

        /* owners */
        if (!db.objectStoreNames.contains('owners')) {
          db.createObjectStore('owners', { keyPath: 'id' });
        }

        /* settings */
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  /* ---- items ---- */

  async getItems(filter = {}) {
    return new Promise((resolve, reject) => {
      const tx    = this.db.transaction('items', 'readonly');
      const store = tx.objectStore('items');
      const req   = store.getAll();

      req.onsuccess = () => {
        let items = req.result || [];

        if (filter.ownerId)     items = items.filter(i => i.ownerId === filter.ownerId);
        if (filter.orderStatus) items = items.filter(i => i.orderStatus === filter.orderStatus);
        if (filter.type)        items = items.filter(i => i.type === filter.type);
        if (filter.search) {
          const q = filter.search.toLowerCase();
          items = items.filter(i =>
            (i.name  && i.name.toLowerCase().includes(q)) ||
            (i.type  && i.type.toLowerCase().includes(q)) ||
            (i.size  && i.size.toLowerCase().includes(q)) ||
            (i.notes && i.notes.toLowerCase().includes(q))
          );
        }

        items.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async getItem(id) {
    return new Promise((resolve, reject) => {
      const req = this.db.transaction('items', 'readonly')
                         .objectStore('items').get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => reject(req.error);
    });
  }

  async saveItem(item) {
    const now = new Date().toISOString();
    if (!item.id) {
      item.id        = this.uid();
      item.createdAt = now;
    }
    item.updatedAt = now;
    item.total     = Math.round(((item.quantity || 0) * (item.price || 0)) * 100) / 100;

    return new Promise((resolve, reject) => {
      const tx  = this.db.transaction('items', 'readwrite');
      const req = tx.objectStore('items').put(item);
      req.onsuccess = () => resolve(item);
      req.onerror   = () => reject(req.error);
    });
  }

  async deleteItem(id) {
    return new Promise((resolve, reject) => {
      const req = this.db.transaction('items', 'readwrite')
                         .objectStore('items').delete(id);
      req.onsuccess = () => resolve();
      req.onerror   = () => reject(req.error);
    });
  }

  /* ---- owners ---- */

  async getOwners() {
    return new Promise((resolve, reject) => {
      const req = this.db.transaction('owners', 'readonly')
                         .objectStore('owners').getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror   = () => reject(req.error);
    });
  }

  async saveOwner(owner) {
    if (!owner.id) {
      owner.id        = this.uid();
      owner.createdAt = new Date().toISOString();
    }
    return new Promise((resolve, reject) => {
      const req = this.db.transaction('owners', 'readwrite')
                         .objectStore('owners').put(owner);
      req.onsuccess = () => resolve(owner);
      req.onerror   = () => reject(req.error);
    });
  }

  async deleteOwner(id) {
    return new Promise((resolve, reject) => {
      const req = this.db.transaction('owners', 'readwrite')
                         .objectStore('owners').delete(id);
      req.onsuccess = () => resolve();
      req.onerror   = () => reject(req.error);
    });
  }

  /* ---- settings ---- */

  async getSetting(key, def = null) {
    return new Promise((resolve) => {
      const req = this.db.transaction('settings', 'readonly')
                         .objectStore('settings').get(key);
      req.onsuccess = () => resolve(req.result ? req.result.value : def);
      req.onerror   = () => resolve(def);
    });
  }

  async setSetting(key, value) {
    return new Promise((resolve, reject) => {
      const req = this.db.transaction('settings', 'readwrite')
                         .objectStore('settings').put({ key, value });
      req.onsuccess = () => resolve();
      req.onerror   = () => reject(req.error);
    });
  }

  /* ---- import / export ---- */

  async exportAll() {
    const [items, owners] = await Promise.all([this.getItems(), this.getOwners()]);
    return {
      version:    1,
      exportedAt: new Date().toISOString(),
      items,
      owners,
    };
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
