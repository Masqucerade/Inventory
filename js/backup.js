/* =============================================
   Backup Manager
   – Auto-backup every 24 h
   – Manual save: cloud + download + localStorage
   – Each step is fully independent (no cascade failures)
   ============================================= */

class BackupManager {
  constructor(db) {
    this.db          = db;
    this.INTERVAL    = 24 * 60 * 60 * 1000;
    this.LS_TIME_KEY = 'inv_last_backup';
    this.LS_AUTO_KEY = 'inv_auto_backup';
  }

  /* ── auto-check on app start ── */
  async checkAutoBackup() {
    if (!this.isAutoEnabled()) return;
    const last = this.getLastTime();
    if (!last || (Date.now() - last.getTime()) > this.INTERVAL) {
      // Silent cloud save only
      try {
        const data = await this.db.exportAll();
        await this._saveToCloud(data);
        localStorage.setItem(this.LS_TIME_KEY, new Date().toISOString());
      } catch (_) {}
    }
  }

  /* ── manual save button ── */
  async manualSave() {
    try {
      const data = await this.db.exportAll();

      // Step 1: cloud (silent, non-blocking)
      this._saveToCloud(data).catch(() => {});

      // Step 2: file download
      this._download(data);

      // Step 3: timestamp (always)
      localStorage.setItem(this.LS_TIME_KEY, new Date().toISOString());

      return true;
    } catch (err) {
      console.error('Backup error:', err);
      return false;
    }
  }

  /* ── download (tries multiple methods) ── */
  _download(data) {
    try {
      const name = `masqucerade-backup-${new Date().toISOString().slice(0, 10)}.json`;
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });

      // Method A: navigator.share with file (works in Telegram iOS/Android)
      if (navigator.canShare?.({ files: [new File([blob], name, { type: 'application/json' })] })) {
        const file = new File([blob], name, { type: 'application/json' });
        navigator.share({ files: [file], title: 'Masqucerade Backup' })
          .catch(() => this._anchorDownload(blob, name));
        return;
      }

      // Method B: anchor click (browsers, desktop TG)
      this._anchorDownload(blob, name);
    } catch (err) {
      console.warn('Download failed:', err);
    }
  }

  _anchorDownload(blob, name) {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = name;
    a.style.position = 'fixed';
    a.style.left     = '-9999px';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 2000);
  }

  /* ── restore from JSON file ── */
  async restoreFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (!Array.isArray(data.items) && !Array.isArray(data.owners))
            throw new Error('Неверный формат файла');
          await this.db.importAll(data);
          resolve(data);
        } catch (err) { reject(err); }
      };
      reader.onerror = () => reject(new Error('Ошибка чтения файла'));
      reader.readAsText(file);
    });
  }

  /* ── Telegram CloudStorage (chunked, 3900 chars/key) ── */
  async _saveToCloud(data) {
    const tg = window.Telegram?.WebApp;
    if (!tg?.CloudStorage) return false;

    const json      = JSON.stringify(data);
    const chunkSize = 3900;
    const chunks    = [];
    for (let i = 0; i < json.length; i += chunkSize)
      chunks.push(json.slice(i, i + chunkSize));

    return new Promise((resolve) => {
      const meta = JSON.stringify({ chunks: chunks.length, savedAt: new Date().toISOString() });
      tg.CloudStorage.setItem('inv_meta', meta, () => {
        if (!chunks.length) { resolve(true); return; }
        let done = 0;
        chunks.forEach((c, i) => {
          tg.CloudStorage.setItem(`inv_chunk_${i}`, c, () => {
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
        const meta = JSON.parse(metaStr);
        const keys = Array.from({ length: meta.chunks }, (_, i) => `inv_chunk_${i}`);
        tg.CloudStorage.getItems(keys, (err2, vals) => {
          if (err2) { reject(err2); return; }
          try { resolve(JSON.parse(keys.map(k => vals[k] || '').join(''))); }
          catch (e) { reject(e); }
        });
      });
    });
  }

  /* ── helpers ── */
  getLastTime()    { const v = localStorage.getItem(this.LS_TIME_KEY); return v ? new Date(v) : null; }
  getLastTimeStr() {
    const t = this.getLastTime();
    return t ? t.toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Никогда';
  }
  isAutoEnabled()     { return localStorage.getItem(this.LS_AUTO_KEY) !== 'off'; }
  setAutoEnabled(val) { localStorage.setItem(this.LS_AUTO_KEY, val ? 'on' : 'off'); }
}

/* ── Image resize ── */
// Масштабирует уже загруженный <img> в JPEG data-URL со стороной ≤ max.
function _scaleToDataUrl(img, max, q) {
  let { width: w, height: h } = img;
  if (w > max) { h = Math.round(h * max / w); w = max; }
  if (h > max) { w = Math.round(w * max / h); h = max; }
  const c = Object.assign(document.createElement('canvas'), { width: w, height: h });
  c.getContext('2d').drawImage(img, 0, 0, w, h);
  return c.toDataURL('image/jpeg', q);
}

// Из файла делаем две версии: full (≤900px) для просмотра и thumb (≤300px,
// ~15 КБ) для списков и карточек. Декодируем файл один раз.
function makePhotoVariants(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload  = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload  = () => resolve({
        full:  _scaleToDataUrl(img, 900, 0.82),
        thumb: _scaleToDataUrl(img, 300, 0.7),
      });
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function resizeImage(file, maxW = 900, maxH = 900, q = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload  = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload  = () => {
        let { width: w, height: h } = img;
        if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
        if (h > maxH) { w = Math.round(w * maxH / h); h = maxH; }
        const c = Object.assign(document.createElement('canvas'), { width: w, height: h });
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL('image/jpeg', q));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
