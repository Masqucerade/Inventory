/* =============================================
   Main Application  —  Inventory Telegram Mini App
   Web3 Minimalism edition with full action logging
   ============================================= */

/* ── Constants ── */
const STATUSES = [
  { id: 'ordered',      label: 'Заказано',   icon: '📋', color: 'rgba(255,255,255,0.40)' },
  { id: 'at_warehouse', label: 'На складе',  icon: '📦', color: '#fb923c' },
  { id: 'in_stock',     label: 'В наличии',  icon: '●',  color: '#4ade80' },
  { id: 'processing',   label: 'В заказе',   icon: '○',  color: '#93c5fd' },
  { id: 'waiting',      label: 'Ожидается',  icon: '◎',  color: '#c4b5fd' },
  { id: 'done',         label: 'Завершено',  icon: '✓',  color: 'rgba(255,255,255,0.22)' },
];

const OWNER_COLORS = [
  '#ff6b6b','#ff9500','#ffd60a','#30d158','#00c7be',
  '#7c6dfa','#5856d6','#af52de','#ff375f','#8e8e93',
];

const LOG_META = {
  item_add:     { icon: '➕', color: 'rgba(48,209,88,.15)' },
  item_edit:    { icon: '✏️', color: 'rgba(124,109,250,.15)' },
  item_delete:  { icon: '🗑', color: 'rgba(248,113,113,.15)' },
  owner_add:    { icon: '👤', color: 'rgba(48,209,88,.15)' },
  owner_edit:   { icon: '✏️', color: 'rgba(124,109,250,.15)' },
  owner_delete: { icon: '🗑', color: 'rgba(248,113,113,.15)' },
  backup:       { icon: '💾', color: 'rgba(59,130,246,.15)' },
  restore:      { icon: '📂', color: 'rgba(255,159,10,.15)' },
  clear:        { icon: '🧹', color: 'rgba(248,113,113,.15)' },
};

const DEFAULT_COLOR = '#7c6dfa';

const statusById = (id) => STATUSES.find(s => s.id === id) || STATUSES[0];
const fmtNum = (n) => n == null ? '' : Number(n).toLocaleString('ru-RU', { maximumFractionDigits: 2 });
const fmtMoney = (n) => (!n && n !== 0) ? '0 ₽' : fmtNum(n) + ' ₽';
const debounce = (fn, ms = 280) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

/* ============================================= */
class App {
  constructor() {
    this.db     = new InventoryDB();
    this.backup = new BackupManager(this.db);

    this.items  = [];
    this.owners = [];

    this.currentView   = 'inventory';
    this.filterOwnerId = null;
    this.filterStatus  = '';
    this.searchQuery   = '';
    this._sortBy  = 'date';
    this._sortDir = 'desc';

    this.editingItemId  = null;
    this.editingOwnerId = null;
    this.currentPhoto   = null;

    this._selOwner  = null;
    this._selStatus = 'ordered';
    this._selColor  = DEFAULT_COLOR;
    this._sizes     = [{ size: '', qty: 1 }];
    this._saving    = false;

    this._detailItemId = null;
    this._confirmRes   = null;
    this._confirmRej   = null;
    this._toastTimer   = null;

    this._selectMode   = false;
    this._selectedIds  = new Set();

    this._filterMonarc      = false;
    this._filterSale        = false;
    this._archiveOpen       = false;
    this._currentPayType    = 'deposit';
    this._currentEmpOwnerId = null;
  }

  /* ──────────────────────────────────────────
     INIT
     ────────────────────────────────────────── */
  async init() {
    try {
      this.initTheme();             // apply before render
      await this.db.init();
      await this.loadData();
      this.initTelegram();
      this.bindGlobal();
      this.renderView('inventory');
      this.backup.checkAutoBackup();
    } catch (err) {
      console.error('Init error:', err);
    }
  }

  initTheme() {
    const saved = localStorage.getItem('inv_theme') || 'dark';
    this.applyTheme(saved);
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('inv_theme', theme);
    const tg = window.Telegram?.WebApp;
    if (tg) {
      const bg = theme === 'light' ? '#f0f0f0' : '#0a0a0a';
      try { tg.setHeaderColor(bg); tg.setBackgroundColor(bg); } catch (_) {}
    }
  }

  toggleMenu() {
    const menu     = document.getElementById('headerMenu');
    const backdrop = document.getElementById('menuBackdrop');
    const isOpen   = menu.classList.contains('open');
    if (isOpen) {
      this.closeMenu();
    } else {
      this.renderMenuPanel();
      menu.classList.add('open');
      backdrop.classList.remove('hidden');
    }
  }

  closeMenu() {
    document.getElementById('headerMenu').classList.remove('open');
    document.getElementById('menuBackdrop').classList.add('hidden');
  }

  renderMenuPanel() {
    const el     = document.getElementById('headerMenuBody');
    const lastBk = this.backup.getLastTimeStr();
    const theme  = localStorage.getItem('inv_theme') || 'dark';

    const arrow       = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="settings-row-arrow"><polyline points="9 18 15 12 9 6"/></svg>`;
    const svgSend     = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
    const svgAuto     = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`;
    const svgDownload = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
    const svgUpload   = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`;
    const svgTruck    = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="1" y="3" width="15" height="13" rx="1"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`;

    el.innerHTML = `
      <div class="section-title">Внешний вид</div>
      <div class="settings-section">
        <div class="settings-row" style="cursor:default">
          <div class="settings-row-icon gray">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          </div>
          <div class="settings-row-info"><div class="settings-row-title">Тема</div></div>
          <div class="menu-theme-toggle" id="menuThemeToggle">
            <button class="menu-theme-btn${theme === 'dark'  ? ' active' : ''}" data-t="dark">🌙</button>
            <button class="menu-theme-btn${theme === 'light' ? ' active' : ''}" data-t="light">☀️</button>
          </div>
        </div>
      </div>

      <div class="section-title">Инструменты</div>
      <div class="settings-section">
        <div class="settings-row" id="mDeliveryBtn">
          <div class="settings-row-icon gray">${svgTruck}</div>
          <div class="settings-row-info">
            <div class="settings-row-title">Стоимость доставки</div>
          </div>${arrow}
        </div>
      </div>

      <div class="section-title">Резервная копия</div>
      <div class="settings-section">
        <div class="settings-row" id="mBtnTgBackup">
          <div class="settings-row-icon blue">${svgSend}</div>
          <div class="settings-row-info">
            <div class="settings-row-title">Отправить в Telegram</div>
            <div class="settings-row-sub">Файл с данными — прямо в чат</div>
          </div>${arrow}
        </div>
        <div class="settings-row" style="cursor:default">
          <div class="settings-row-icon green">${svgAuto}</div>
          <div class="settings-row-info">
            <div class="settings-row-title">Авто-бэкап каждые 24 ч</div>
            <div class="settings-row-sub">Последний: <strong>${lastBk}</strong></div>
          </div>
          <div class="auto-backup-badge">ON</div>
        </div>
        <div class="settings-row" id="mBtnBackup">
          <div class="settings-row-icon gray">${svgDownload}</div>
          <div class="settings-row-info">
            <div class="settings-row-title">Скачать JSON</div>
            <div class="settings-row-sub">Сохранить файл локально</div>
          </div>${arrow}
        </div>
        <div class="settings-row" id="mBtnRestore">
          <div class="settings-row-icon orange">${svgUpload}</div>
          <div class="settings-row-info">
            <div class="settings-row-title">Восстановить из файла</div>
            <div class="settings-row-sub">Загрузить JSON-бэкап</div>
          </div>${arrow}
        </div>
      </div>

      <div class="section-title">Участники</div>
      <div class="settings-section">
        <div class="settings-row" id="mAddOwnerBtn">
          <div class="settings-row-icon green">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div class="settings-row-info"><div class="settings-row-title">Добавить участника</div></div>${arrow}
        </div>
      </div>
      <div id="menuOwnersList"></div>

      <div class="section-title">О приложении</div>
      <div class="settings-section">
        <div class="settings-row" style="cursor:default">
          <div class="settings-row-icon" style="background:rgba(124,109,250,.12)">🏢</div>
          <div class="settings-row-info">
            <div class="settings-row-title">Masqucerade INC.</div>
            <div class="settings-row-sub">Версия 1.1 · Telegram Mini App</div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('menuThemeToggle').addEventListener('click', e => {
      const btn = e.target.closest('.menu-theme-btn');
      if (!btn) return;
      this.applyTheme(btn.dataset.t);
      document.querySelectorAll('.menu-theme-btn').forEach(b =>
        b.classList.toggle('active', b === btn)
      );
    });

    document.getElementById('mDeliveryBtn').addEventListener('click', () => {
      this.closeMenu();
      this.enterSelectMode();
    });

    document.getElementById('mBtnTgBackup').addEventListener('click', async () => {
      this.closeMenu();
      this.toast('Отправляю в Telegram…');
      try {
        const r = await fetch('/api/backup/send', { method: 'POST' });
        const d = await r.json();
        this.toast(d.ok ? '✓ Бэкап отправлен в Telegram' : '✗ Не удалось — настройте TG_LOG_TOKEN');
      } catch { this.toast('✗ Ошибка отправки'); }
    });

    document.getElementById('mBtnBackup').addEventListener('click', () => {
      this.closeMenu();
      this.doManualSave();
    });

    document.getElementById('mBtnRestore').addEventListener('click', () => {
      this.closeMenu();
      document.getElementById('restoreFileInput').click();
    });

    document.getElementById('mAddOwnerBtn').addEventListener('click', () => {
      this.closeMenu();
      this.openOwnerModal();
    });

    this.renderOwners('menuOwnersList');
  }

  async loadData() {
    [this.items, this.owners] = await Promise.all([
      this.db.getItems(),
      this.db.getOwners(),
    ]);
  }

  initTelegram() {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;
    tg.ready();
    tg.expand();
  }

  /* ──────────────────────────────────────────
     GLOBAL (ONE-TIME) EVENT BINDINGS
     ────────────────────────────────────────── */
  bindGlobal() {
    /* Nav */
    document.querySelectorAll('.nav-btn').forEach(b =>
      b.addEventListener('click', () => this.renderView(b.dataset.view))
    );

    /* Sort bar */
    document.getElementById('statusFilterChips').closest('.view-header').addEventListener('click', e => {
      const opt = e.target.closest('.sort-opt');
      const dir = e.target.closest('#sortDirBtn');
      if (opt) {
        this._sortBy = opt.dataset.sort;
        document.querySelectorAll('.sort-opt').forEach(b => b.classList.toggle('active', b === opt));
        this.renderInventoryList();
      }
      if (dir) {
        this._sortDir = this._sortDir === 'desc' ? 'asc' : 'desc';
        dir.textContent = this._sortDir === 'desc' ? '↓' : '↑';
        this.renderInventoryList();
      }
    });

    /* FAB */
    document.getElementById('fabBtn').addEventListener('click', () => {
      if (this.currentView === 'settings') this.openFaqModal();
      else this.openItemModal();
    });

    /* Hamburger menu */
    document.getElementById('menuBtn').addEventListener('click', () => this.toggleMenu());
    document.getElementById('menuBackdrop').addEventListener('click', () => this.closeMenu());

    /* Restore file input (permanent in DOM) */
    document.getElementById('restoreFileInput').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const ok = await this.confirm('Восстановить данные из файла?\nТекущие данные будут заменены.', 'Восстановить', false);
      if (!ok) { e.target.value = ''; return; }
      try {
        await this.backup.restoreFromFile(file);
        await this.db.logAction('restore', `Восстановлено из файла: ${file.name}`);
        await this.loadData();
        this.toast('Данные восстановлены ✓');
      } catch (err) { this.toast('Ошибка: ' + err.message); }
      e.target.value = '';
    });

    /* Search */
    const inp = document.getElementById('searchInput');
    const clr = document.getElementById('searchClear');
    inp.addEventListener('input', debounce(() => {
      this.searchQuery = inp.value.trim();
      clr.classList.toggle('hidden', !this.searchQuery);
      this.renderInventoryList();
    }));
    clr.addEventListener('click', () => {
      inp.value = this.searchQuery = '';
      clr.classList.add('hidden');
      this.renderInventoryList();
    });

    /* Status filter chips (static) */
    document.getElementById('statusFilterChips').addEventListener('click', (e) => {
      const chip = e.target.closest('[data-status]');
      if (!chip) return;
      this.filterStatus = chip.dataset.status;
      document.querySelectorAll('#statusFilterChips .chip').forEach(c =>
        c.classList.toggle('active', c.dataset.status === this.filterStatus)
      );
      this.renderInventoryList();
    });

    /* Owner filter chips (dynamic, delegated) */
    document.getElementById('ownerFilterChips').addEventListener('click', (e) => {
      if (e.target.closest('[data-monarc]')) {
        this._filterMonarc = true;
        this.filterOwnerId = null;
        this.renderOwnerFilterChips();
        this.renderInventoryList();
        return;
      }
      const chip = e.target.closest('[data-owner]');
      if (!chip) return;
      this._filterMonarc = false;
      this.filterOwnerId = chip.dataset.owner || null;
      this.renderOwnerFilterChips();
      this.renderInventoryList();
    });

    /* Sale filter */
    document.getElementById('saleFilterBtn').addEventListener('click', () => {
      this._filterSale = !this._filterSale;
      document.getElementById('saleFilterBtn').classList.toggle('active', this._filterSale);
      this.renderInventoryList();
    });

    /* Inventory list item click (delegated) */
    document.getElementById('inventoryList').addEventListener('click', (e) => {
      const card = e.target.closest('.item-card');
      if (!card) return;
      if (this._selectMode) this.toggleSelectItem(card.dataset.id);
      else this.openDetailModal(card.dataset.id);
    });

    /* Delivery */
    document.getElementById('deliveryBarApply').addEventListener('click', () => this.openDeliveryModal());
    document.getElementById('deliveryBarCancel').addEventListener('click', () => this.exitSelectMode());
    document.getElementById('deliveryModalClose').addEventListener('click', () => this.closeModal('deliveryModal'));
    document.getElementById('deliveryModalSave').addEventListener('click', () => this.applyDelivery());

    /* Item modal */
    document.getElementById('itemModalClose').addEventListener('click', () => this.closeModal('itemModal'));
    document.getElementById('itemModalSave').addEventListener('click', () => this.saveItem());

    /* Sizes */
    document.getElementById('sizesList').addEventListener('click', (e) => {
      const dec = e.target.closest('.size-dec');
      const inc = e.target.closest('.size-inc');
      const rm  = e.target.closest('.size-remove');
      if (dec) { const i = +dec.dataset.idx; this._sizes[i].qty = Math.max(0, (this._sizes[i].qty||0) - 1); this.renderSizes(); }
      if (inc) { const i = +inc.dataset.idx; this._sizes[i].qty = (this._sizes[i].qty||0) + 1; this.renderSizes(); }
      if (rm)  { const i = +rm.dataset.idx;  this._sizes.splice(i, 1); this.renderSizes(); }
    });
    document.getElementById('sizesList').addEventListener('input', (e) => {
      const si = e.target.closest('.size-row-input');
      const qi = e.target.closest('.size-qty-input');
      if (si) { const i = +si.dataset.idx; this._sizes[i].size = si.value; }
      if (qi) { const i = +qi.dataset.idx; this._sizes[i].qty  = parseInt(qi.value) || 0; this.updateTotal(); }
    });
    document.getElementById('addSizeBtn').addEventListener('click', () => {
      this._sizes.push({ size: '', qty: 1 });
      this.renderSizes();
      setTimeout(() => {
        const inputs = document.querySelectorAll('.size-row-input');
        inputs[inputs.length - 1]?.focus();
      }, 50);
    });
    document.getElementById('fieldPrice').addEventListener('input', () => this.updateTotal());
    document.getElementById('fieldBuyPrice').addEventListener('input', () => this.updateTotal());

    /* Photo */
    document.getElementById('photoPicker').addEventListener('click', (e) => {
      if (e.target.closest('#photoRemove')) return;
      document.getElementById('photoInput').click();
    });
    document.getElementById('photoInput').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const b64 = await resizeImage(file);
        this.currentPhoto = b64;
        document.getElementById('photoPreview').src = b64;
        document.getElementById('photoPreview').classList.remove('hidden');
        document.getElementById('photoPlaceholder').classList.add('hidden');
        document.getElementById('photoRemove').classList.remove('hidden');
      } catch (_) { this.toast('Ошибка загрузки фото'); }
      e.target.value = '';
    });
    document.getElementById('photoRemove').addEventListener('click', (e) => {
      e.stopPropagation();
      this.currentPhoto = null;
      document.getElementById('photoPreview').src = '';
      document.getElementById('photoPreview').classList.add('hidden');
      document.getElementById('photoPlaceholder').classList.remove('hidden');
      document.getElementById('photoRemove').classList.add('hidden');
    });

    /* Paste image from clipboard (Ctrl+V) when item modal is open */
    document.addEventListener('paste', async (e) => {
      if (!document.getElementById('itemModal').classList.contains('open')) return;

      // Primary: clipboardData.items (works when photo area or text input focused)
      let file = [...(e.clipboardData?.items || [])]
        .find(i => i.type.startsWith('image/'))
        ?.getAsFile();

      // Fallback: navigator.clipboard.read() — works when number inputs are focused
      // (browsers filter clipboardData for non-text inputs)
      if (!file) {
        try {
          const items = await navigator.clipboard.read();
          for (const item of items) {
            const imgType = item.types.find(t => t.startsWith('image/'));
            if (imgType) { file = await item.getType(imgType); break; }
          }
        } catch (_) {}
      }

      if (!file) return;
      e.preventDefault();
      try {
        const b64 = await resizeImage(file);
        this.currentPhoto = b64;
        document.getElementById('photoPreview').src = b64;
        document.getElementById('photoPreview').classList.remove('hidden');
        document.getElementById('photoPlaceholder').classList.add('hidden');
        document.getElementById('photoRemove').classList.remove('hidden');
        this.toast('Фото вставлено ✓');
      } catch (_) { this.toast('Ошибка вставки фото'); }
    });

    /* Owner chips in item form (delegated) */
    document.getElementById('ownerSelect').addEventListener('click', (e) => {
      const btn = e.target.closest('.owner-chip');
      if (!btn) return;
      this._selOwner = this._selOwner === btn.dataset.ownerId ? null : btn.dataset.ownerId;
      document.querySelectorAll('#ownerSelect .owner-chip').forEach(c =>
        c.classList.toggle('selected', c.dataset.ownerId === this._selOwner)
      );
    });

    /* Status chips in item form (delegated) */
    document.getElementById('statusSelect').addEventListener('click', (e) => {
      const btn = e.target.closest('.status-chip');
      if (!btn) return;
      this._selStatus = btn.dataset.status;
      document.querySelectorAll('#statusSelect .status-chip').forEach(c =>
        c.classList.toggle('selected', c.dataset.status === this._selStatus)
      );
    });

    /* Detail modal */
    document.getElementById('detailModalClose').addEventListener('click', () => this.closeModal('detailModal'));
    document.getElementById('detailModalEdit').addEventListener('click', () => {
      const id = this._detailItemId;
      this.closeModal('detailModal');
      this.openItemModal(id);
    });

    /* Employee modal */
    document.getElementById('empModalClose').addEventListener('click', () => {
      this.closeModal('empModal');
      if (this.currentView === 'finance') this.renderFinance();
    });

    /* Payment modal */
    document.getElementById('paymentModalClose').addEventListener('click', () => this.closeModal('paymentModal'));
    document.getElementById('paymentModalSave').addEventListener('click', () => this.savePayment());

    /* Plan modal */
    document.getElementById('planModalClose').addEventListener('click', () => this.closeModal('planModal'));
    document.getElementById('planModalSave').addEventListener('click', () => this.savePlan());
    document.getElementById('planTitle').addEventListener('keydown', e => { if (e.key === 'Enter') this.savePlan(); });

    /* FAQ modal */
    document.getElementById('faqModalClose').addEventListener('click', () => this.closeModal('faqModal'));
    document.getElementById('faqModalSave').addEventListener('click', () => this.saveFaqItem());
    document.getElementById('faqAddLineBtn').addEventListener('click', () => this._addFaqLine());
    document.getElementById('faqLinesList').addEventListener('click', (e) => {
      const rm = e.target.closest('.faq-line-remove');
      if (rm) rm.closest('.faq-line-row').remove();
    });

    /* Owner modal */
    document.getElementById('ownerModalClose').addEventListener('click', () => this.closeModal('ownerModal'));
    document.getElementById('ownerModalSave').addEventListener('click', () => this.saveOwner());
    document.getElementById('ownerName').addEventListener('input', () => {
      const v = document.getElementById('ownerName').value.trim();
      document.getElementById('ownerAvatarPreview').textContent = v ? v[0].toUpperCase() : 'А';
    });

    /* Color picker (delegated — rendered once inside openOwnerModal, but listener is here) */
    document.getElementById('colorPicker').addEventListener('click', (e) => {
      const dot = e.target.closest('.color-dot');
      if (!dot) return;
      this._selColor = dot.dataset.color;
      document.querySelectorAll('#colorPicker .color-dot').forEach(d =>
        d.classList.toggle('selected', d.dataset.color === this._selColor)
      );
      document.getElementById('ownerAvatarPreview').style.background = this._selColor;
    });

    /* Confirm */
    document.getElementById('confirmCancel').addEventListener('click', () => this._confirmRej?.());
    document.getElementById('confirmOk').addEventListener('click', () => this._confirmRes?.());
  }

  /* ──────────────────────────────────────────
     VIEW ROUTING
     ────────────────────────────────────────── */
  renderView(view) {
    this.currentView = view;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`view-${view}`)?.classList.add('active');
    document.querySelector(`.nav-btn[data-view="${view}"]`)?.classList.add('active');
    document.getElementById('fabBtn').classList.toggle('hidden', view !== 'inventory' && view !== 'settings');

    switch (view) {
      case 'inventory': this.renderInventoryView(); break;
      case 'stats':     this.renderStats();         break;
      case 'finance':   this.renderFinance();       break;
      case 'settings':  this.renderFaq();            break;
    }
  }

  /* ──────────────────────────────────────────
     INVENTORY
     ────────────────────────────────────────── */
  renderInventoryView() {
    this.renderOwnerFilterChips();
    this.renderInventoryList();
  }

  renderOwnerFilterChips() {
    const el = document.getElementById('ownerFilterChips');
    const allActive = !this.filterOwnerId && !this._filterMonarc;
    el.innerHTML =
      `<button class="chip ${allActive ? 'active' : ''}" data-owner="">Все</button>` +
      `<button class="chip monarc-chip${this._filterMonarc ? ' active' : ''}" data-monarc="1">Monarc</button>` +
      this.owners.map(o => {
        const a = this.filterOwnerId === o.id;
        return `<button class="chip ${a ? 'active' : ''}" data-owner="${o.id}"
          ${a ? `style="background:${o.color};border-color:transparent;color:#fff"` : ''}>
          ${this.esc(o.name)}
        </button>`;
      }).join('');
  }

  async renderInventoryList() {
    const list = document.getElementById('inventoryList');
    list.innerHTML = '<div class="skeleton-wrap"><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></div>';

    let items = await this.db.getItems({
      ownerId:     this.filterOwnerId || undefined,
      orderStatus: this.filterStatus  || undefined,
      search:      this.searchQuery   || undefined,
    });

    // Client-side sort
    const sd = this._sortDir === 'asc' ? 1 : -1;
    if (this._sortBy === 'price') {
      items.sort((a, b) => sd * ((a.price || 0) - (b.price || 0)));
    } else if (this._sortBy === 'qty') {
      items.sort((a, b) => sd * ((a.quantity || 0) - (b.quantity || 0)));
    } else if (this._sortBy === 'name') {
      items.sort((a, b) => sd * (a.name || '').localeCompare(b.name || '', 'ru'));
    }
    // 'date' — already sorted by server (updatedAt desc); respect direction
    if (this._sortBy === 'date' && this._sortDir === 'asc') items.reverse();

    // Monarc isolation: hide Monarc items from normal view, show only in Monarc filter
    if (this._filterMonarc) {
      items = items.filter(i => i.isMonarc);
    } else {
      items = items.filter(i => !i.isMonarc);
    }

    // Sale filter
    if (this._filterSale) items = items.filter(i => i.isForSale);

    // Archive split: done items go to collapsed section unless explicitly filtering by done
    let activeItems   = items;
    let archivedItems = [];
    if (this.filterStatus !== 'done') {
      activeItems   = items.filter(i => i.orderStatus !== 'done');
      archivedItems = items.filter(i => i.orderStatus === 'done');
    }

    if (!activeItems.length && !archivedItems.length) {
      list.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width=".9">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
          <h3>${this.searchQuery ? 'Ничего не найдено' : 'Нет товаров'}</h3>
          <p>${this.searchQuery ? 'Попробуйте другой запрос' : 'Нажмите + чтобы добавить первый товар'}</p>
        </div>`;
      return;
    }

    const ownerMap = Object.fromEntries(this.owners.map(o => [o.id, o]));
    let html = '';

    if (activeItems.length) {
      html += `<div class="items-list">${activeItems.map((item, idx) => this._itemCardHtml(item, idx, ownerMap)).join('')}</div>`;
    }

    if (archivedItems.length) {
      const n    = archivedItems.length;
      const word = n === 1 ? 'товар' : (n < 5 ? 'товара' : 'товаров');
      html += `
        <div class="archive-section">
          <button class="archive-toggle" id="archiveToggle" type="button">
            <span>Архив · ${n} ${word}</span>
            <svg class="archive-chevron${this._archiveOpen ? ' open' : ''}" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <div id="archiveListWrap"${this._archiveOpen ? '' : ' class="hidden"'}>
            <div class="items-list">${archivedItems.map((item, idx) => this._itemCardHtml(item, idx, ownerMap)).join('')}</div>
          </div>
        </div>`;
    }

    list.innerHTML = html;

    document.getElementById('archiveToggle')?.addEventListener('click', () => {
      this._archiveOpen = !this._archiveOpen;
      document.getElementById('archiveListWrap')?.classList.toggle('hidden', !this._archiveOpen);
      document.querySelector('#archiveToggle .archive-chevron')?.classList.toggle('open', this._archiveOpen);
    });
  }

  _itemCardHtml(item, idx, ownerMap) {
    const st    = statusById(item.orderStatus);
    const owner = ownerMap[item.ownerId];
    const thumb = item.photo
      ? `<img src="${item.photo}" loading="lazy" alt="">`
      : `<div class="item-thumb-placeholder">
           <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
             <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
             <polyline points="21 15 16 10 5 21"/>
           </svg>
         </div>`;

    const sizesArr  = item.sizes?.length > 0 ? item.sizes : (item.size ? [{size: item.size, qty: item.quantity||0}] : []);
    const sizePills = sizesArr.filter(s => s.qty > 0 || s.size)
      .map(s => `<span class="size-pill">${this.esc(s.size||'?')}${s.qty !== 1 ? ' ×'+s.qty : ''}</span>`).join('');

    return `<div class="item-card${this._selectMode && this._selectedIds.has(item.id) ? ' selected' : ''}" data-id="${item.id}" style="animation-delay:${Math.min(idx*28,200)}ms">
      <div class="item-thumb">${thumb}</div>
      <div class="item-info">
        <div class="item-top">
          <div style="min-width:0">
            <div class="item-name">${this.esc(item.name)}</div>
            <div class="item-type-size">${this.esc(item.type)}</div>
          </div>
          <div class="item-top-badges">
            <span class="status-badge ${item.orderStatus}">${st.label}</span>${item.isForSale ? `<span class="sale-tag">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                <line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg></span>` : ''}
          </div>
        </div>
        <div class="item-meta">
          ${owner ? `<span class="item-owner-tag"><span class="owner-dot" style="background:${owner.color}"></span>${this.esc(owner.name)}</span>` : ''}
          ${sizePills || `<span class="size-pill">—</span>`}
        </div>
        ${item.notes ? `<div class="item-notes-preview">${this.esc(item.notes)}</div>` : ''}
        ${item.price ? `
        <div class="item-bottom">
          <span class="item-price-unit">${fmtMoney(item.price)}${item.buyPrice ? ` <span class="item-buy-price">← ${fmtMoney(item.buyPrice)}${item.deliveryCost ? ` + ${fmtMoney(item.deliveryCost)}` : ''}</span>` : (item.deliveryCost ? ` <span class="item-buy-price">+ ${fmtMoney(item.deliveryCost)} дост.</span>` : '')}</span>
          <span class="item-total-dim">${fmtMoney(item.total)}</span>
        </div>` : ''}
        ${this._selectMode ? '<div class="select-check"></div>' : ''}
      </div>
    </div>`;
  }

  /* ──────────────────────────────────────────
     ITEM DETAIL
     ────────────────────────────────────────── */
  async openDetailModal(id) {
    const item = this.items.find(i => i.id === id) || await this.db.getItem(id);
    if (!item) return;
    this._detailItemId = id;

    const st    = statusById(item.orderStatus);
    const owner = this.owners.find(o => o.id === item.ownerId);

    const sizesArr = item.sizes?.length > 0 ? item.sizes : (item.size ? [{size: item.size, qty: item.quantity||0}] : []);
    const sizesCard = sizesArr.length > 0 ? `
      <div class="detail-card">
        ${sizesArr.map(s => `
          <div class="detail-row">
            <span class="detail-key">${this.esc(s.size || 'Без размера')}</span>
            <span class="detail-val">${s.qty} шт</span>
          </div>`).join('')}
      </div>` : '';

    const margin    = (item.price && item.buyPrice) ? item.price - item.buyPrice : null;
    const marginStr = margin !== null
      ? `<span style="color:${margin >= 0 ? '#34d399' : '#f87171'}">${margin >= 0 ? '+' : ''}${fmtMoney(margin)}</span>`
      : '—';

    const priceRows = [
      ['Тип',          item.type         || '—'],
      ['Цена закупа',  item.buyPrice     ? fmtMoney(item.buyPrice)     : '—'],
      ['Доставка',     item.deliveryCost ? fmtMoney(item.deliveryCost) : '—'],
      ['Цена продажи', item.price        ? fmtMoney(item.price)        : '—'],
      ['Маржа / шт',   marginStr],
      ['Итого',        fmtMoney(item.total), 'big'],
    ].map(([k,v,c]) =>
      `<div class="detail-row"><span class="detail-key">${k}</span><span class="detail-val ${c||''}">${v}</span></div>`
    ).join('');

    const metaRows = [
      ['Владелец', owner
        ? `<span style="display:flex;align-items:center;gap:6px;justify-content:flex-end">
             <span style="width:8px;height:8px;border-radius:50%;background:${owner.color};display:inline-block;flex-shrink:0"></span>
             ${this.esc(owner.name)}</span>`
        : '—'],
      ['На продаже', item.isForSale
        ? `<span class="sale-tag">
             <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
               <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
               <line x1="7" y1="7" x2="7.01" y2="7"/>
             </svg></span>`
        : '—'],
      ['Создан', this.fmtDate(item.createdAt)],
    ].map(([k,v]) =>
      `<div class="detail-row"><span class="detail-key">${k}</span><span class="detail-val">${v}</span></div>`
    ).join('');

    document.getElementById('detailModalTitle').textContent = item.name;
    document.getElementById('detailModalBody').innerHTML = `
      ${item.photo ? `<img src="${item.photo}" class="detail-photo" alt="">` : ''}
      ${sizesCard}
      <div class="detail-card">${priceRows}</div>
      <div class="detail-card">
        <div class="detail-row detail-status-row" id="detailStatusRow" style="cursor:pointer">
          <span class="detail-key">Статус</span>
          <span class="detail-val" style="display:flex;align-items:center;gap:8px">
            <span class="status-badge ${item.orderStatus}" id="detailStatusBadge">${st.label}</span>
            <svg id="detailStatusChevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="color:var(--text3);flex-shrink:0;transition:transform .2s">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </span>
        </div>
        <div class="quick-status-panel hidden" id="quickStatusPanel">
          ${STATUSES.map(s =>
            `<button class="quick-status-btn${s.id === item.orderStatus ? ' active' : ''}" data-qstatus="${s.id}">
               <span class="status-badge ${s.id}" style="pointer-events:none">${s.label}</span>
             </button>`
          ).join('')}
        </div>
        ${metaRows}
      </div>
      ${item.notes ? `<div class="detail-notes">${this.esc(item.notes)}</div>` : ''}
      <button class="detail-delete-btn" id="detailDeleteBtn">Удалить товар</button>
    `;

    document.getElementById('detailDeleteBtn').addEventListener('click', () => this.deleteItem(id));

    document.getElementById('detailStatusRow').addEventListener('click', () => {
      const panel   = document.getElementById('quickStatusPanel');
      const chevron = document.getElementById('detailStatusChevron');
      const opening = panel.classList.contains('hidden');
      panel.classList.toggle('hidden');
      if (chevron) chevron.style.transform = opening ? 'rotate(180deg)' : '';
    });

    document.getElementById('quickStatusPanel').addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-qstatus]');
      if (!btn) return;
      await this.quickSetStatus(id, btn.dataset.qstatus);
    });

    this.openModal('detailModal');
  }

  async quickSetStatus(id, statusId) {
    const item = this.items.find(i => i.id === id) || await this.db.getItem(id);
    if (!item) return;

    const closePanel = () => {
      document.getElementById('quickStatusPanel')?.classList.add('hidden');
      const ch = document.getElementById('detailStatusChevron');
      if (ch) ch.style.transform = '';
    };

    if (item.orderStatus === statusId) { closePanel(); return; }

    const wasDone = item.orderStatus === 'done';
    const becomesDone = statusId === 'done';

    await this.db.saveItem({ ...item, orderStatus: statusId });
    const st = statusById(statusId);
    await this.db.logAction('item_edit',
      `Статус изменён: «${item.name}» → ${st.label}`,
      { id, status: statusId }
    );

    // Update cache without refetch
    const cached = this.items.find(i => i.id === id);
    if (cached) cached.orderStatus = statusId;

    // Update detail modal badge in-place
    const badge = document.getElementById('detailStatusBadge');
    if (badge) { badge.className = `status-badge ${statusId}`; badge.textContent = st.label; }
    document.querySelectorAll('#quickStatusPanel .quick-status-btn').forEach(btn =>
      btn.classList.toggle('active', btn.dataset.qstatus === statusId)
    );
    closePanel();

    if (wasDone !== becomesDone) {
      // Archive section changes — need full re-render
      await this.loadData();
      this.renderInventoryList();
    } else {
      // Just patch the badge on the card — no skeleton flash
      const card = document.querySelector(`.item-card[data-id="${id}"]`);
      if (card) {
        const cardBadge = card.querySelector('.status-badge');
        if (cardBadge) { cardBadge.className = `status-badge ${statusId}`; cardBadge.textContent = st.label; }
      }
    }

    this.toast(`Статус: ${st.label} ✓`);
  }

  async deleteItem(id) {
    const item = await this.db.getItem(id);
    const ok   = await this.confirm('Удалить этот товар? Действие нельзя отменить.');
    if (!ok) return;
    await this.db.deleteItem(id);
    await this.db.logAction('item_delete', `Удалён товар: «${item?.name || id}»`, { id, name: item?.name });
    await this.loadData();
    this.closeModal('detailModal');
    this.renderInventoryList();
    this.toast('Товар удалён');
  }

  /* ──────────────────────────────────────────
     ITEM FORM
     ────────────────────────────────────────── */
  async openItemModal(id = null) {
    this.editingItemId = id;
    this.currentPhoto  = null;
    this._selOwner     = null;
    this._selStatus    = 'ordered';
    this._sizes        = [{ size: '', qty: 1 }];

    /* Reset */
    ['fieldType','fieldName','fieldNotes','fieldPrice','fieldBuyPrice','fieldDeliveryCost'].forEach(k => document.getElementById(k).value = '');
    document.getElementById('fieldIsMonarc').checked  = !id && this._filterMonarc;
    document.getElementById('fieldIsForSale').checked = false;
    document.getElementById('totalDisplay').textContent = '0 ₽';
    document.getElementById('marginDisplay').textContent = '—';
    document.getElementById('marginDisplay').style.color = 'var(--text2)';
    document.getElementById('photoPreview').src = '';
    document.getElementById('photoPreview').classList.add('hidden');
    document.getElementById('photoPlaceholder').classList.remove('hidden');
    document.getElementById('photoRemove').classList.add('hidden');

    /* Type datalist */
    const types = [...new Set(this.items.map(i => i.type).filter(Boolean))];
    document.getElementById('typesList').innerHTML = types.map(t => `<option value="${this.esc(t)}">`).join('');

    document.getElementById('itemModalTitle').textContent = id ? 'Изменить товар' : 'Новый товар';

    if (id) {
      const item = this.items.find(i => i.id === id) || await this.db.getItem(id);
      if (item) {
        document.getElementById('fieldType').value          = item.type         || '';
        document.getElementById('fieldName').value          = item.name         || '';
        document.getElementById('fieldPrice').value         = item.price        || '';
        document.getElementById('fieldBuyPrice').value      = item.buyPrice     || '';
        document.getElementById('fieldDeliveryCost').value  = item.deliveryCost || '';
        document.getElementById('fieldNotes').value = item.notes || '';
        document.getElementById('fieldIsMonarc').checked  = !!item.isMonarc;
        document.getElementById('fieldIsForSale').checked = !!item.isForSale;
        this._selOwner  = item.ownerId     || null;
        this._selStatus = item.orderStatus || 'ordered';
        this._sizes = item.sizes?.length > 0
          ? item.sizes.map(s => ({ size: s.size || '', qty: s.qty || 0 }))
          : [{ size: item.size || '', qty: item.quantity || 1 }];
        if (item.photo) {
          this.currentPhoto = item.photo;
          document.getElementById('photoPreview').src = item.photo;
          document.getElementById('photoPreview').classList.remove('hidden');
          document.getElementById('photoPlaceholder').classList.add('hidden');
          document.getElementById('photoRemove').classList.remove('hidden');
        }
      }
    }

    this.refreshOwnerChips();
    this.refreshStatusChips();
    this.renderSizes();
    this.openModal('itemModal');
  }

  renderSizes() {
    const list = document.getElementById('sizesList');
    if (!list) return;
    list.innerHTML = this._sizes.map((s, i) => `
      <div class="size-row">
        <input type="text" class="size-row-input" data-idx="${i}"
               value="${this.esc(s.size)}" placeholder="Размер…"
               list="sizeSuggestions" autocomplete="off">
        <button type="button" class="size-dec" data-idx="${i}">−</button>
        <input type="number" class="size-qty-input" data-idx="${i}"
               value="${s.qty}" min="0" inputmode="numeric">
        <button type="button" class="size-inc" data-idx="${i}">+</button>
        ${this._sizes.length > 1
          ? `<button type="button" class="size-remove" data-idx="${i}">
               <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8">
                 <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
               </svg></button>`
          : ''}
      </div>`).join('');
    this.updateTotal();
  }

  refreshOwnerChips() {
    const wrap = document.getElementById('ownerSelect');
    if (!this.owners.length) {
      wrap.innerHTML = `<span style="font-size:13px;color:var(--hint)">Добавьте владельцев во вкладке «Владельцы»</span>`;
      return;
    }
    wrap.innerHTML = this.owners.map(o =>
      `<button type="button" class="owner-chip ${this._selOwner === o.id ? 'selected' : ''}" data-owner-id="${o.id}">
         <span class="owner-chip-dot" style="background:${o.color}">${o.name[0].toUpperCase()}</span>
         ${this.esc(o.name)}
       </button>`
    ).join('');
  }

  refreshStatusChips() {
    document.getElementById('statusSelect').innerHTML = STATUSES.map(s =>
      `<button type="button" class="status-chip ${this._selStatus === s.id ? 'selected' : ''}" data-status="${s.id}">
         <span>${s.icon}</span> ${s.label}
       </button>`
    ).join('');
  }

  /* ──────────────────────────────────────────
     DELIVERY SELECTION MODE
     ────────────────────────────────────────── */
  enterSelectMode() {
    this._selectMode  = true;
    this._selectedIds = new Set();
    document.getElementById('deliveryBar').classList.remove('hidden');
    this.renderInventoryList();
    this.updateDeliveryBar();
    this.toast('Нажмите на товары для выбора');
  }

  exitSelectMode() {
    this._selectMode  = false;
    this._selectedIds = new Set();
    document.getElementById('deliveryBar').classList.add('hidden');
    this.renderInventoryList();
  }

  toggleSelectItem(id) {
    if (this._selectedIds.has(id)) this._selectedIds.delete(id);
    else this._selectedIds.add(id);
    const card = document.querySelector(`.item-card[data-id="${id}"]`);
    if (card) card.classList.toggle('selected', this._selectedIds.has(id));
    this.updateDeliveryBar();
  }

  updateDeliveryBar() {
    const n = this._selectedIds.size;
    const word = n === 1 ? 'товар' : n > 1 && n < 5 ? 'товара' : 'товаров';
    document.getElementById('deliveryBarCount').textContent =
      n === 0 ? 'Выберите товары' : `Выбрано: ${n} ${word}`;
    document.getElementById('deliveryBarApply').disabled = n === 0;
  }

  openDeliveryModal() {
    if (!this._selectedIds.size) return;
    const n    = this._selectedIds.size;
    const word = n === 1 ? 'товару' : n < 5 ? 'товарам' : 'товарам';
    document.getElementById('deliveryModalDesc').textContent =
      `Применить к ${n} ${word}`;
    document.getElementById('deliveryCostInput').value = '';
    this.openModal('deliveryModal');
    setTimeout(() => document.getElementById('deliveryCostInput').focus(), 350);
  }

  async applyDelivery() {
    const cost = parseFloat(document.getElementById('deliveryCostInput').value) || 0;
    const ids  = [...this._selectedIds];
    for (const id of ids) {
      const item = this.items.find(i => i.id === id);
      if (!item) continue;
      await this.db.saveItem({ ...item, deliveryCost: cost });
    }
    const n = ids.length;
    await this.db.logAction('item_edit',
      `Доставка ${fmtMoney(cost)} установлена для ${n} тов.`
    );
    await this.loadData();
    this.closeModal('deliveryModal');
    this.exitSelectMode();
    this.toast(`Доставка ${fmtMoney(cost)} установлена ✓`);
  }

  updateTotal() {
    const totalQty  = this._sizes.reduce((s, r) => s + (parseInt(r.qty) || 0), 0);
    const price     = parseFloat(document.getElementById('fieldPrice')?.value)    || 0;
    const buyPrice  = parseFloat(document.getElementById('fieldBuyPrice')?.value) || 0;
    const totalEl   = document.getElementById('totalDisplay');
    const marginEl  = document.getElementById('marginDisplay');
    if (totalEl) totalEl.textContent = fmtMoney(totalQty * price);
    if (marginEl) {
      if (price && buyPrice) {
        const margin = price - buyPrice;
        marginEl.textContent = (margin >= 0 ? '+' : '') + fmtMoney(margin);
        marginEl.style.color = margin >= 0 ? '#34d399' : '#f87171';
      } else {
        marginEl.textContent = '—';
        marginEl.style.color = 'var(--text2)';
      }
    }
  }

  async saveItem() {
    if (this._saving) return;
    const name = document.getElementById('fieldName').value.trim();
    const type = document.getElementById('fieldType').value.trim();
    if (!name) { this.toast('Укажите наименование товара'); return; }
    if (!type) { this.toast('Укажите тип товара'); return; }
    this._saving = true;

    const isNew  = !this.editingItemId;
    const sizes  = this._sizes.filter(s => s.size.trim() || (s.qty || 0) > 0);
    const totQty = sizes.reduce((s, r) => s + (parseInt(r.qty) || 0), 0);
    const item   = {
      ...(isNew ? {} : { id: this.editingItemId }),
      type,
      name,
      sizes,
      quantity:    totQty,
      price:        parseFloat(document.getElementById('fieldPrice').value)        || 0,
      buyPrice:     parseFloat(document.getElementById('fieldBuyPrice').value)     || 0,
      deliveryCost: parseFloat(document.getElementById('fieldDeliveryCost').value) || 0,
      notes:       document.getElementById('fieldNotes').value.trim(),
      ownerId:     this._selOwner  || null,
      orderStatus: this._selStatus || 'ordered',
      isMonarc:    document.getElementById('fieldIsMonarc').checked,
      isForSale:   document.getElementById('fieldIsForSale').checked,
      photo:       this.currentPhoto || null,
    };

    const saved = await this.db.saveItem(item);
    await this.db.logAction(
      isNew ? 'item_add' : 'item_edit',
      isNew ? `Добавлен товар: «${name}»` : `Изменён товар: «${name}»`,
      { id: saved.id, name, type, quantity: totQty, price: item.price }
    );
    await this.loadData();
    this.closeModal('itemModal');
    this.renderInventoryList();
    this.toast(isNew ? 'Товар добавлен ✓' : 'Товар обновлён ✓');
    this._saving = false;
  }

  /* ──────────────────────────────────────────
     FINANCE VIEW
     ────────────────────────────────────────── */
  async renderFinance() {
    const el = document.getElementById('financeContent');
    const [payments, empPayments, plans] = await Promise.all([
      this.db.getPayments(),
      this.owners.length ? this.db.getEmployeePayments() : Promise.resolve([]),
      this.db.getPlans(),
    ]);

    const balance = payments.reduce((s, p) =>
      p.type === 'deposit' ? s + (p.amount || 0) : s - (p.amount || 0), 0);
    const pos = balance >= 0;

    const empBals = {};
    empPayments.forEach(p => {
      empBals[p.ownerId] = (empBals[p.ownerId] || 0) +
        (p.type === 'credit' ? (p.amount || 0) : -(p.amount || 0));
    });

    const payHistHtml = payments.length
      ? `<div class="section-title">История</div>
         <div class="pay-list">${payments.map((p, idx) => `
           <div class="pay-entry" style="animation-delay:${Math.min(idx*20,180)}ms">
             <div class="pay-icon ${p.type}">${p.type === 'deposit' ? '+' : '−'}</div>
             <div class="pay-info">
               <div class="pay-desc">${this.esc(p.desc || (p.type === 'deposit' ? 'Депозит' : 'Списание'))}</div>
               <div class="pay-time">${this.fmtDate(p.ts)}</div>
             </div>
             <div class="pay-amount ${p.type}">${p.type === 'deposit' ? '+' : '−'}${fmtMoney(p.amount)}</div>
             <button class="pay-del" data-id="${p.id}">
               <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8">
                 <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
               </svg>
             </button>
           </div>`).join('')}
         </div>`
      : '';

    const empSectionHtml = this.owners.length
      ? `<div class="section-title">Сотрудники</div>
         <div class="emp-bal-list">${this.owners.map(o => {
           const bal = empBals[o.id] || 0;
           const ep  = bal >= 0;
           return `<div class="emp-bal-card" data-owner-id="${o.id}">
             <div class="emp-bal-avatar" style="background:${o.color}">${o.name[0].toUpperCase()}</div>
             <div class="emp-bal-name">${this.esc(o.name)}</div>
             <div class="emp-bal-amount ${ep ? 'pos' : 'neg'}">${ep ? '+' : '−'}${fmtMoney(Math.abs(bal))}</div>
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="color:var(--text3);flex-shrink:0">
               <polyline points="9 18 15 12 9 6"/>
             </svg>
           </div>`;
         }).join('')}</div>`
      : '';

    const pending  = plans.filter(p => !p.done);
    const donePlans = plans.filter(p => p.done);
    const allPlans  = [...pending, ...donePlans];

    const planItemHtml = (p) => `
      <div class="plan-item${p.done ? ' plan-done' : ''}" data-plan-id="${p.id}">
        <button class="plan-check" data-plan-id="${p.id}" title="${p.done ? 'Отметить активным' : 'Отметить выполненным'}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8">
            ${p.done
              ? '<polyline points="20 6 9 17 4 12"/>'
              : '<rect x="3" y="3" width="18" height="18" rx="3"/>'}
          </svg>
        </button>
        <div class="plan-info">
          <div class="plan-title">${this.esc(p.title)}</div>
          ${p.note ? `<div class="plan-note">${this.esc(p.note)}</div>` : ''}
        </div>
        ${p.amount ? `<div class="plan-amount">${fmtMoney(p.amount)}</div>` : ''}
        <button class="pay-del" data-plan-del="${p.id}">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>`;

    const plansSectionHtml = `
      <div class="section-title" style="display:flex;align-items:center;justify-content:space-between">
        <span>Планы закупок</span>
        <button class="plan-add-btn" id="addPlanBtn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>Добавить
        </button>
      </div>
      <div class="plan-list" id="planList">
        ${allPlans.length
          ? allPlans.map(planItemHtml).join('')
          : `<div class="plan-empty">Нет планов — нажмите «Добавить»</div>`}
      </div>`;

    el.innerHTML = `
      <div class="balance-card">
        <div class="balance-label">Баланс компании</div>
        <div class="balance-amount ${pos ? 'pos' : 'neg'}">${pos ? '' : '−'}${fmtMoney(Math.abs(balance))}</div>
      </div>
      <div class="finance-actions">
        <button class="fin-btn deposit" id="depositBtn">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>Депозит
        </button>
        <button class="fin-btn charge" id="chargeBtn">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>Выставить счёт
        </button>
      </div>
      ${plansSectionHtml}
      ${payHistHtml}
      ${empSectionHtml}
    `;

    document.getElementById('depositBtn').addEventListener('click', () => this.openPaymentModal('deposit'));
    document.getElementById('chargeBtn').addEventListener('click',  () => this.openPaymentModal('charge'));
    document.getElementById('addPlanBtn').addEventListener('click', () => this.openPlanModal());

    el.querySelectorAll('.pay-del[data-id]').forEach(btn =>
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const ok = await this.confirm('Удалить эту запись?');
        if (!ok) return;
        await this.db.deletePayment(btn.dataset.id);
        this.renderFinance();
      })
    );

    el.querySelectorAll('[data-plan-del]').forEach(btn =>
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const ok = await this.confirm('Удалить план?');
        if (!ok) return;
        await this.db.deletePlan(btn.dataset.planDel);
        this.renderFinance();
      })
    );

    el.querySelectorAll('.plan-check').forEach(btn =>
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id   = btn.dataset.planId;
        const item = btn.closest('.plan-item');
        const done = !item.classList.contains('plan-done');
        await this.db.patchPlan(id, { done });
        this.renderFinance();
      })
    );

    el.querySelectorAll('.emp-bal-card').forEach(card =>
      card.addEventListener('click', () => this.openEmpModal(card.dataset.ownerId))
    );
  }

  openPlanModal() {
    document.getElementById('planTitle').value  = '';
    document.getElementById('planAmount').value = '';
    document.getElementById('planNote').value   = '';
    this.openModal('planModal');
    setTimeout(() => document.getElementById('planTitle').focus(), 320);
  }

  async savePlan() {
    const title = document.getElementById('planTitle').value.trim();
    if (!title) { this.toast('Укажите название'); return; }
    const amount = parseFloat(document.getElementById('planAmount').value) || 0;
    const note   = document.getElementById('planNote').value.trim();
    await this.db.addPlan({ title, amount: amount || null, note: note || null });
    this.closeModal('planModal');
    this.renderFinance();
    this.toast('План добавлен ✓');
  }

  async openEmpModal(ownerId) {
    this._currentEmpOwnerId = ownerId;
    const owner = this.owners.find(o => o.id === ownerId);
    if (!owner) return;
    document.getElementById('empModalTitle').textContent = owner.name;
    await this.renderEmpModal(ownerId);
    this.openModal('empModal');
  }

  async renderEmpModal(ownerId) {
    const el       = document.getElementById('empModalBody');
    const payments = await this.db.getEmployeePayments(ownerId);

    const salary   = payments.reduce((s, p) => p.type === 'credit' && !p.isExpense ? s + (p.amount || 0) : s, 0);
    const expenses = payments.reduce((s, p) => p.type === 'credit' &&  p.isExpense ? s + (p.amount || 0) : s, 0);
    const debits   = payments.reduce((s, p) => p.type === 'debit'                  ? s + (p.amount || 0) : s, 0);
    const balance  = salary + expenses - debits;
    const pos      = balance >= 0;

    const balanceExtra = expenses > 0
      ? `<div class="emp-bal-split">
           <span>💼 ${fmtMoney(salary)} зарплата</span>
           <span>🧾 ${fmtMoney(expenses)} к возврату</span>
         </div>`
      : '';

    const histHtml = payments.length
      ? `<div class="section-title">История</div>
         <div class="pay-list">${payments.map((p, idx) => {
           const isCredit  = p.type === 'credit';
           const isExpense = p.isExpense;
           const cls = isExpense ? 'expense' : (isCredit ? 'deposit' : 'charge');
           const icon = isExpense ? '🧾' : (isCredit ? '+' : '−');
           const defaultDesc = isExpense ? 'Расход из своих' : (isCredit ? 'Начисление' : 'Выплата');
           return `<div class="pay-entry" style="animation-delay:${Math.min(idx*20,180)}ms">
             <div class="pay-icon ${cls}">${icon}</div>
             <div class="pay-info">
               <div class="pay-desc">${this.esc(p.desc || defaultDesc)}</div>
               <div class="pay-time">${this.fmtDate(p.ts)}</div>
             </div>
             ${isExpense
               ? `<div class="pay-amount-col">
                    <div class="pay-amount expense">+${fmtMoney(p.amount)}</div>
                    <div class="pay-return-label">↩ вернуть</div>
                  </div>`
               : `<div class="pay-amount ${cls}">${isCredit ? '+' : '−'}${fmtMoney(p.amount)}</div>`}
             <button class="pay-del" data-id="${p.id}">
               <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8">
                 <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
               </svg>
             </button>
           </div>`;
         }).join('')}</div>`
      : `<div class="empty-state" style="padding:40px 20px">
           <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width=".9">
             <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
           </svg>
           <h3>Нет операций</h3><p>Начислите сумму или выплатите</p>
         </div>`;

    el.innerHTML = `
      <div class="balance-card">
        <div class="balance-label">К выплате</div>
        <div class="balance-amount ${pos ? 'pos' : 'neg'}">${pos ? '' : '−'}${fmtMoney(Math.abs(balance))}</div>
        ${balanceExtra}
      </div>
      <div class="finance-actions" style="grid-template-columns:1fr 1fr 1fr">
        <button class="fin-btn deposit" id="empCreditBtn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>Зарплата
        </button>
        <button class="fin-btn expense" id="empExpenseBtn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
            <line x1="7" y1="7" x2="7.01" y2="7"/>
          </svg>Расход
        </button>
        <button class="fin-btn charge" id="empDebitBtn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>Выплатить
        </button>
      </div>
      ${histHtml}
    `;

    document.getElementById('empCreditBtn').addEventListener('click', () =>
      this.openPaymentModal('credit', ownerId)
    );
    document.getElementById('empExpenseBtn').addEventListener('click', () =>
      this.openPaymentModal('expense', ownerId)
    );
    document.getElementById('empDebitBtn').addEventListener('click', () =>
      this.openPaymentModal('debit', ownerId)
    );

    el.querySelectorAll('.pay-del').forEach(btn =>
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const ok = await this.confirm('Удалить эту запись?');
        if (!ok) return;
        await this.db.deleteEmployeePayment(btn.dataset.id);
        this.renderEmpModal(ownerId);
      })
    );
  }

  openPaymentModal(type, empOwnerId = null) {
    this._currentPayType    = type;
    this._currentEmpOwnerId = empOwnerId;
    const titles = { deposit: 'Депозит', charge: 'Выставить счёт', credit: 'Начислить', debit: 'Выплатить', expense: 'Расход из своих' };
    const saves  = { deposit: 'Добавить', charge: 'Выставить',      credit: 'Начислить', debit: 'Выплатить', expense: 'Записать' };
    document.getElementById('paymentModalTitle').textContent = titles[type] || 'Операция';
    document.getElementById('paymentModalSave').textContent  = saves[type]  || 'Добавить';
    document.getElementById('paymentAmount').value = '';
    document.getElementById('paymentDesc').value   = '';
    this.openModal('paymentModal');
    setTimeout(() => document.getElementById('paymentAmount').focus(), 320);
  }

  async savePayment() {
    const amount = parseFloat(document.getElementById('paymentAmount').value);
    if (!amount || amount <= 0) { this.toast('Укажите сумму'); return; }
    const desc = document.getElementById('paymentDesc').value.trim();
    const isExpense = this._currentPayType === 'expense';
    const sign = (this._currentPayType === 'deposit' || this._currentPayType === 'credit' || isExpense) ? '+' : '−';

    if (this._currentEmpOwnerId) {
      const owner = this.owners.find(o => o.id === this._currentEmpOwnerId);
      await this.db.addEmployeePayment({
        ownerId:   this._currentEmpOwnerId,
        ownerName: owner?.name || '',
        type:      isExpense ? 'credit' : this._currentPayType,
        isExpense: isExpense || undefined,
        amount,    desc,
      });
      this.closeModal('paymentModal');
      await this.renderEmpModal(this._currentEmpOwnerId);
    } else {
      await this.db.addPayment({ type: this._currentPayType, amount, desc });
      this.closeModal('paymentModal');
      this.renderFinance();
    }
    this.toast(`${sign}${fmtMoney(amount)} ✓`);
  }

  /* ──────────────────────────────────────────
     OWNERS VIEW
     ────────────────────────────────────────── */
  async renderOwners(containerId = 'ownersList') {
    const list  = document.getElementById(containerId);
    if (!list) return;
    const items = await this.db.getItems();
    const cntMap = {}, valMap = {};
    items.forEach(i => {
      if (!i.ownerId) return;
      cntMap[i.ownerId] = (cntMap[i.ownerId] || 0) + (i.quantity || 0);
      valMap[i.ownerId] = (valMap[i.ownerId] || 0) + (i.total    || 0);
    });

    if (!this.owners.length) {
      list.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width=".9">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <h3>Нет владельцев</h3>
          <p>Нажмите + чтобы добавить владельца</p>
        </div>`;
      return;
    }

    list.innerHTML = `<div class="owners-grid">${this.owners.map((o, idx) => `
      <div class="owner-card" style="animation-delay:${idx*40}ms">
        <div class="owner-avatar" style="background:${o.color}">${o.name[0].toUpperCase()}</div>
        <div class="owner-info">
          <div class="owner-name">${this.esc(o.name)}</div>
          <div class="owner-sub">${cntMap[o.id] || 0} шт · ${fmtMoney(valMap[o.id] || 0)}</div>
        </div>
        <div class="owner-card-actions">
          <button class="btn-icon-sm edit-owner" data-id="${o.id}">✏️</button>
          <button class="btn-icon-sm danger del-owner" data-id="${o.id}">🗑</button>
        </div>
      </div>`).join('')}</div>`;

    list.querySelectorAll('.edit-owner').forEach(btn =>
      btn.addEventListener('click', (e) => { e.stopPropagation(); this.openOwnerModal(btn.dataset.id); })
    );
    list.querySelectorAll('.del-owner').forEach(btn =>
      btn.addEventListener('click', (e) => { e.stopPropagation(); this.deleteOwner(btn.dataset.id); })
    );
  }

  /* ──────────────────────────────────────────
     OWNER FORM
     ────────────────────────────────────────── */
  async openOwnerModal(id = null) {
    this.editingOwnerId = id;
    this._selColor      = DEFAULT_COLOR;

    document.getElementById('ownerName').value                     = '';
    document.getElementById('ownerAvatarPreview').textContent      = 'А';
    document.getElementById('ownerAvatarPreview').style.background = DEFAULT_COLOR;
    document.getElementById('ownerModalTitle').textContent         = id ? 'Изменить владельца' : 'Новый владелец';

    document.getElementById('colorPicker').innerHTML = OWNER_COLORS.map(c =>
      `<div class="color-dot ${c === DEFAULT_COLOR ? 'selected' : ''}" data-color="${c}" style="background:${c}"></div>`
    ).join('');

    if (id) {
      const owner = this.owners.find(o => o.id === id);
      if (owner) {
        document.getElementById('ownerName').value                     = owner.name;
        document.getElementById('ownerAvatarPreview').textContent      = owner.name[0].toUpperCase();
        this._selColor = owner.color || DEFAULT_COLOR;
        document.getElementById('ownerAvatarPreview').style.background = this._selColor;
        document.querySelectorAll('#colorPicker .color-dot').forEach(d =>
          d.classList.toggle('selected', d.dataset.color === this._selColor)
        );
      }
    }
    this.openModal('ownerModal');
  }

  async saveOwner() {
    const name = document.getElementById('ownerName').value.trim();
    if (!name) { this.toast('Введите имя владельца'); return; }
    const isNew = !this.editingOwnerId;
    const owner = {
      ...(isNew ? {} : { id: this.editingOwnerId }),
      name,
      color: this._selColor,
    };
    const saved = await this.db.saveOwner(owner);
    await this.db.logAction(
      isNew ? 'owner_add' : 'owner_edit',
      isNew ? `Добавлен владелец: «${name}»` : `Изменён владелец: «${name}»`,
      { id: saved.id, name }
    );
    await this.loadData();
    this.closeModal('ownerModal');
    this.renderOwners('menuOwnersList');
    this.renderOwnerFilterChips();
    this.toast(isNew ? 'Участник добавлен ✓' : 'Участник обновлён ✓');
  }

  async deleteOwner(id) {
    const owner = this.owners.find(o => o.id === id);
    const ok    = await this.confirm(`Удалить владельца «${owner?.name}»?\nТовары останутся без владельца.`);
    if (!ok) return;

    const owned = await this.db.getItems({ ownerId: id });
    for (const item of owned) await this.db.saveItem({ ...item, ownerId: null });

    await this.db.deleteOwner(id);
    await this.db.logAction('owner_delete', `Удалён владелец: «${owner?.name || id}»`, { id, name: owner?.name });
    await this.loadData();
    this.renderOwners('menuOwnersList');
    this.renderOwnerFilterChips();
    this.toast('Участник удалён');
  }

  /* ──────────────────────────────────────────
     STATS
     ────────────────────────────────────────── */
  async renderStats() {
    const el    = document.getElementById('statsContent');
    const items = await this.db.getItems();

    if (!items.length) {
      el.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width=".9">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          <h3>Нет данных</h3><p>Добавьте товары для просмотра статистики</p>
        </div>`;
      return;
    }

    const totalQty = items.reduce((s, i) => s + (i.quantity || 0), 0);
    const totalVal = items.reduce((s, i) => s + (i.total    || 0), 0);
    const avgPrice = totalQty ? totalVal / totalQty : 0;

    const byStatus = {}, byOwner = {}, byType = {};
    items.forEach(i => {
      const qty = i.quantity || 0;
      byStatus[i.orderStatus] = (byStatus[i.orderStatus] || 0) + qty;
      const k = i.ownerId || '__none__';
      if (!byOwner[k]) byOwner[k] = { qty: 0, val: 0, cnt: 0 };
      byOwner[k].qty += qty;
      byOwner[k].val += (i.total || 0);
      byOwner[k].cnt++;
      if (i.type) {
        if (!byType[i.type]) byType[i.type] = { qty: 0, val: 0 };
        byType[i.type].qty += qty;
        byType[i.type].val += (i.total || 0);
      }
    });

    const maxSt  = Math.max(...Object.values(byStatus), 1);
    const maxOwV = Math.max(...Object.values(byOwner).map(v => v.val), 1);
    const maxTyQ = Math.max(...Object.values(byType).map(v => v.qty), 1);

    const statusBars = STATUSES.filter(s => byStatus[s.id]).map(s => {
      const qty = byStatus[s.id];
      return `<div class="bar-row">
        <span class="bar-label">${s.icon} ${s.label}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${Math.round(qty/maxSt*100)}%;background:${s.color}"></div></div>
        <span class="bar-count">${qty} шт</span>
      </div>`;
    }).join('') || noData;

    const ownerRows = Object.entries(byOwner)
      .sort((a, b) => b[1].val - a[1].val)
      .map(([oid, v]) => {
        const o = this.owners.find(o => o.id === oid);
        const n = o ? o.name : 'Без владельца';
        const c = o ? o.color : '#6b7280';
        return `<div class="owner-stat-row">
          <div class="owner-stat-avatar" style="background:${c}">${n[0].toUpperCase()}</div>
          <div class="owner-stat-info">
            <div class="owner-stat-name">${this.esc(n)}</div>
            <div class="bar-track" style="margin-top:5px">
              <div class="bar-fill" style="width:${Math.round(v.val/maxOwV*100)}%;background:${c}"></div>
            </div>
          </div>
          <div style="text-align:right;flex-shrink:0">
            <div style="font-size:14px;font-weight:700;color:var(--text)">${fmtMoney(v.val)}</div>
            <div style="font-size:11px;color:var(--hint)">${v.qty} шт · ${v.cnt} поз</div>
          </div>
        </div>`;
      }).join('') || noData;

    const typeSorted = Object.entries(byType).sort((a, b) => b[1].qty - a[1].qty);
    const typeRows   = typeSorted.map(([t, v]) =>
      `<div class="bar-row">
        <span class="bar-label">${this.esc(t)}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${Math.round(v.qty/maxTyQ*100)}%;background:var(--a1)"></div></div>
        <span class="bar-count">${v.qty} шт / ${fmtMoney(v.val)}</span>
      </div>`
    ).join('');

    const noData = '<span style="font-size:14px;color:var(--hint)">Нет данных</span>';

    el.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card accent">
          <div class="stat-value">${fmtMoney(totalVal)}</div>
          <div class="stat-label">Общая стоимость</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${items.length}</div>
          <div class="stat-label">Позиций</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${totalQty}</div>
          <div class="stat-label">Штук всего</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${fmtMoney(avgPrice)}</div>
          <div class="stat-label">Средняя цена</div>
        </div>
      </div>
      <div class="section-title">По статусам</div>
      <div class="stats-section">${statusBars}</div>
      <div class="section-title">По владельцам</div>
      <div class="stats-section">${ownerRows}</div>
      ${typeSorted.length ? `<div class="section-title">По типам</div><div class="stats-section">${typeRows}</div>` : ''}
    `;
  }

  /* ──────────────────────────────────────────
     SETTINGS
     ────────────────────────────────────────── */
  renderSettings() {
    const el = document.getElementById('settingsContent');
    if (!el) return;
    el.innerHTML = `
      <div class="settings-empty-hint">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
        <p>Настройки доступны через меню ☰ в шапке</p>
      </div>`;
  }

  /* ──────────────────────────────────────────
     FAQ
     ────────────────────────────────────────── */
  async renderFaq() {
    const el    = document.getElementById('settingsContent');
    if (!el) return;
    const items = await this.db.getFaqItems();

    if (!items.length) {
      el.innerHTML = `
        <div class="faq-empty">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17" stroke-linecap="round" stroke-width="2.5"/>
          </svg>
          <p>Нет топиков — нажмите + чтобы добавить</p>
        </div>`;
      return;
    }

    const svgCopy = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
    const svgDel  = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`;
    const svgEdit = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;

    el.innerHTML = `<div class="faq-list">${items.map(item => {
      const lines = (item.lines || []).filter(l => l.text?.trim());
      const linesHtml = lines.length ? `
        <div class="faq-script">
          ${lines.map((l, i) => `
            <div class="faq-script-line">
              ${l.label ? `<div class="faq-script-label">${this.esc(l.label)}</div>` : ''}
              <div class="faq-script-row">
                <div class="faq-script-text">${this._faqRender(l.text)}</div>
                <button class="faq-copy-btn" data-text="${this.esc(l.text)}" title="Копировать">${svgCopy}</button>
              </div>
            </div>`).join('')}
        </div>` : '';

      return `
      <div class="faq-item" data-faq-id="${item.id}">
        <div class="faq-head">
          <span class="faq-title">${this.esc(item.title)}</span>
          <svg class="faq-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
        <div class="faq-body">
          ${item.body ? `<div class="faq-text">${this.esc(item.body).replace(/\n/g, '<br>')}</div>` : ''}
          ${linesHtml}
          <div class="faq-actions">
            <button class="faq-edit" data-faq-id="${item.id}">${svgEdit} Изменить</button>
            <button class="faq-delete" data-faq-id="${item.id}">${svgDel} Удалить</button>
          </div>
        </div>
      </div>`;
    }).join('')}
    </div>`;

    el.querySelectorAll('.faq-head').forEach(head => {
      head.addEventListener('click', () => head.closest('.faq-item').classList.toggle('open'));
    });

    el.querySelectorAll('.faq-copy-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const text = btn.dataset.text;
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const ta = document.createElement('textarea');
          ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
          document.body.appendChild(ta); ta.select(); document.execCommand('copy');
          document.body.removeChild(ta);
        }
        btn.classList.add('copied');
        setTimeout(() => btn.classList.remove('copied'), 1500);
        this.toast('Скопировано ✓');
      });
    });

    el.querySelectorAll('.faq-edit').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const item = items.find(i => i.id === btn.dataset.faqId);
        if (item) this.openFaqModal(item);
      });
    });

    el.querySelectorAll('.faq-delete').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); this.deleteFaqItem(btn.dataset.faqId); });
    });
  }

  _addFaqLine(label = '', text = '') {
    const list = document.getElementById('faqLinesList');
    const row  = document.createElement('div');
    row.className = 'faq-line-row';
    row.innerHTML = `
      <div class="faq-line-top">
        <input class="form-input faq-line-label" placeholder="Пометка (необяз.)" value="${this.esc(label)}" autocomplete="off">
        <button class="faq-line-remove" type="button" title="Удалить строку">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="faq-line-toolbar">
        <button class="faq-fmt-btn" data-fmt="bold" type="button" title="Жирный"><b>B</b></button>
      </div>
      <textarea class="form-input faq-line-text" placeholder="Текст сообщения…" rows="5">${this.esc(text)}</textarea>`;
    list.appendChild(row);

    const ta  = row.querySelector('.faq-line-text');
    const btn = row.querySelector('[data-fmt="bold"]');
    btn.addEventListener('click', () => {
      const start = ta.selectionStart;
      const end   = ta.selectionEnd;
      const sel   = ta.value.slice(start, end);
      if (!sel) { ta.focus(); return; }
      const replacement = `**${sel}**`;
      ta.value = ta.value.slice(0, start) + replacement + ta.value.slice(end);
      ta.setSelectionRange(start + 2, start + 2 + sel.length);
      ta.focus();
    });
    ta.focus();
  }

  _faqRender(raw) {
    return this.esc(raw)
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }

  openFaqModal(item = null) {
    this._editingFaqId = item?.id || null;
    document.querySelector('#faqModal .modal-title').textContent = item ? 'Редактировать' : 'Новый топик';
    document.getElementById('faqTitle').value = item?.title || '';
    document.getElementById('faqBody').value  = item?.body  || '';
    const list = document.getElementById('faqLinesList');
    list.innerHTML = '';
    (item?.lines || []).forEach(l => this._addFaqLine(l.label, l.text));
    this.openModal('faqModal');
    setTimeout(() => document.getElementById('faqTitle').focus(), 350);
  }

  async saveFaqItem() {
    const title = document.getElementById('faqTitle').value.trim();
    const body  = document.getElementById('faqBody').value.trim();
    if (!title) { this.toast('Введите заголовок'); return; }

    const lines = [...document.querySelectorAll('#faqLinesList .faq-line-row')].map(row => ({
      label: row.querySelector('.faq-line-label').value.trim(),
      text:  row.querySelector('.faq-line-text').value.trim(),
    })).filter(l => l.text);

    if (this._editingFaqId) {
      await this.db.patchFaqItem(this._editingFaqId, { title, body, lines });
      this.toast('Топик обновлён ✓');
    } else {
      await this.db.addFaqItem({ title, body, lines });
      this.toast('Топик добавлен ✓');
    }
    this._editingFaqId = null;
    this.closeModal('faqModal');
    this.renderFaq();
  }

  async deleteFaqItem(id) {
    const ok = await this.confirm('Удалить этот топик?');
    if (!ok) return;
    await this.db.deleteFaqItem(id);
    this.renderFaq();
  }

  /* ──────────────────────────────────────────
     HISTORY / LOGS MODAL
     ────────────────────────────────────────── */
  async openHistoryModal() {
    await this.renderLogs();
    this.openModal('historyModal');
  }

  async renderLogs() {
    const el   = document.getElementById('logsContainer');
    const logs = await this.db.getLogs(80);

    if (!logs.length) {
      el.innerHTML = `
        <div class="empty-state" style="padding:40px 20px">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width=".9">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <h3>История пуста</h3>
          <p>Здесь будут записи всех изменений</p>
        </div>`;
      return;
    }

    el.innerHTML = `<div class="log-list">${logs.map((entry, idx) => {
      const m = LOG_META[entry.type] || { icon: '•', color: 'var(--surface2)' };
      return `<div class="log-entry" style="animation-delay:${Math.min(idx*15,200)}ms">
        <div class="log-icon" style="background:${m.color}">${m.icon}</div>
        <div class="log-info">
          <div class="log-desc">${this.esc(entry.desc)}</div>
          <div class="log-time">${this.fmtDate(entry.ts)}</div>
        </div>
      </div>`;
    }).join('')}</div>`;
  }

  async clearLogs() {
    const ok = await this.confirm('Очистить всю историю изменений?');
    if (!ok) return;
    await this.db.clearLogs();
    await this.renderLogs();
    this.toast('История очищена');
  }

  /* ──────────────────────────────────────────
     BACKUP
     ────────────────────────────────────────── */
  async doManualSave() {
    const btn = document.getElementById('saveBtn');
    btn.style.opacity = '0.45';
    const ok = await this.backup.manualSave();   // no arg needed
    if (ok) await this.db.logAction('backup', 'Создан бэкап вручную');
    btn.style.opacity = '';
    this.toast(ok ? '💾 Бэкап сохранён' : '❌ Ошибка бэкапа');
  }

  /* ──────────────────────────────────────────
     MODAL HELPERS
     ────────────────────────────────────────── */
  openModal(id) {
    const el = document.getElementById(id);
    requestAnimationFrame(() => el.classList.add('open'));
  }

  closeModal(id) {
    document.getElementById(id)?.classList.remove('open');
  }

  /* ──────────────────────────────────────────
     TOAST
     ────────────────────────────────────────── */
  toast(msg, ms = 2200) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(this._toastTimer);
    requestAnimationFrame(() => el.classList.add('show'));
    this._toastTimer = setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.classList.add('hidden'), 260);
    }, ms);
  }

  /* ──────────────────────────────────────────
     CONFIRM
     ────────────────────────────────────────── */
  confirm(msg, okLabel = 'Удалить', danger = true) {
    return new Promise((resolve) => {
      document.getElementById('confirmMsg').textContent = msg;
      const okBtn = document.getElementById('confirmOk');
      okBtn.textContent = okLabel;
      okBtn.style.color = danger ? '#f87171' : '#34d399';
      document.getElementById('confirmOverlay').classList.remove('hidden');
      this._confirmRes = () => { document.getElementById('confirmOverlay').classList.add('hidden'); resolve(true); };
      this._confirmRej = () => { document.getElementById('confirmOverlay').classList.add('hidden'); resolve(false); };
    });
  }

  /* ──────────────────────────────────────────
     UTILS
     ────────────────────────────────────────── */
  esc(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = String(str);
    return d.innerHTML;
  }

  fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('ru-RU', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  }
}

/* ──────────────────────────────────────────
   BOOT
   ────────────────────────────────────────── */
const app = new App();
document.addEventListener('DOMContentLoaded', () => app.init());
