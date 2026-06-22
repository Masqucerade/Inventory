/* =============================================
   Backup Manager
   – Auto-backup every 24 h (stored in localStorage)
   – Manual backup → download JSON
   – Restore from JSON file
   – Telegram CloudStorage when available
   ============================================= */

class BackupManager {
  constructor(db) {
    this.db              = db;
    this.INTERVAL_MS     = 24 * 60 * 60 * 1000; // 24 h
    this.LS_KEY          = 'inv_last_backup';
    this.LS_AUTO_KEY     = 'inv_auto_backup';
  }

  /* ---- auto-backup check (call on app start) ---- */
  async checkAutoBackup() {
    if (!this.isAutoEnabled()) return;

    const last = this.getLastTime();
    if (!last || (Date.now() - last.getTime()) > this.INTERVAL_MS) {
      await this._saveToTelegramCloud();      // silent cloud save
      localStorage.setItem(this.LS_KEY, new Date().toISOString());
    }
  }

  /* ---- manual save triggered by user ---- */
  async manualSave(showDownload = true) {
    try {
      const data = await this.db.exportAll();

      // 1. Try Telegram CloudStorage
      await this._saveToTelegramCloud(data);

      // 2. Also download as file if requested
      if (showDownload) {
        this._downloadJSON(data);
      }

      localStorage.setItem(this.LS_KEY, new Date().toISOString());
      return true;
    } catch (err) {
      console.error('Backup error:', err);
      return false;
    }
  }

  /* ---- restore from JSON file ---- */
  async restoreFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (!data.items && !data.owners) throw new Error('Неверный формат файла');
          await this.db.importAll(data);
          resolve(data);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Ошибка чтения файла'));
      reader.readAsText(file);
    });
  }

  /* ---- Telegram CloudStorage ---- */
  async _saveToTelegramCloud(data) {
    const tg = window.Telegram?.WebApp;
    if (!tg?.CloudStorage) return false;

    if (!data) data = await this.db.exportAll();
    const json = JSON.stringify(data);

    // CloudStorage max value = 4096 chars per key → chunk it
    const chunkSize = 3900;
    const chunks = [];
    for (let i = 0; i < json.length; i += chunkSize) {
      chunks.push(json.slice(i, i + chunkSize));
    }

    return new Promise((resolve) => {
      const meta = JSON.stringify({ chunks: chunks.length, savedAt: new Date().toISOString() });
      tg.CloudStorage.setItem('inv_meta', meta, () => {
        let done = 0;
        if (chunks.length === 0) { resolve(true); return; }
        chunks.forEach((chunk, i) => {
          tg.CloudStorage.setItem(`inv_chunk_${i}`, chunk, () => {
            if (++done === chunks.length) resolve(true);
          });
        });
      });
    });
  }

  async restoreFromCloud() {
    const tg = window.Telegram?.WebApp;
    if (!tg?.CloudStorage) return null;

    return new Promise((resolve, reject) => {
      tg.CloudStorage.getItem('inv_meta', (err, metaStr) => {
        if (err || !metaStr) { resolve(null); return; }
        const meta   = JSON.parse(metaStr);
        const keys   = Array.from({ length: meta.chunks }, (_, i) => `inv_chunk_${i}`);
        tg.CloudStorage.getItems(keys, (err2, vals) => {
          if (err2) { reject(err2); return; }
          try {
            const json = keys.map(k => vals[k] || '').join('');
            const data = JSON.parse(json);
            resolve(data);
          } catch (e) { reject(e); }
        });
      });
    });
  }

  /* ---- download helper ---- */
  _downloadJSON(data) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `склад-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* ---- state helpers ---- */
  getLastTime() {
    const v = localStorage.getItem(this.LS_KEY);
    return v ? new Date(v) : null;
  }

  getLastTimeStr() {
    const t = this.getLastTime();
    if (!t) return 'Никогда';
    return t.toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  isAutoEnabled() {
    return localStorage.getItem(this.LS_AUTO_KEY) !== 'off';
  }

  setAutoEnabled(val) {
    localStorage.setItem(this.LS_AUTO_KEY, val ? 'on' : 'off');
  }
}

/* ---- Image resize utility ---- */
function resizeImage(file, maxW = 900, maxH = 900, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width: w, height: h } = img;
        if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
        if (h > maxH) { w = Math.round(w * maxH / h); h = maxH; }
        const canvas = Object.assign(document.createElement('canvas'), { width: w, height: h });
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
