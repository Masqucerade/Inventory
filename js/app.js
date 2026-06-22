/* =============================================
   Main Application  —  Inventory Telegram Mini App
   Web3 Minimalism edition with full action logging
   ============================================= */

/* ── Constants ── */
const STATUSES = [
  { id: 'in_stock',   label: 'В наличии', icon: '✅', color: '#30d158' },
  { id: 'on_order',   label: 'Под заказ', icon: '📋', color: '#ff9f0a' },
  { id: 'in_transit', label: 'В пути',    icon: '🚚', color: '#60a5fa' },
  { id: 'received',   label: 'Получен',   icon: '📦', color: '#a78bfa' },
  { id: 'reserved',   label: 'Резерв',    icon: '🔒', color: '#38bdf8' },
  { id: 'sold',       label: 'Продан',    icon: '💰', color: '#6b7280' },
  { id: 'cancelled',  label: 'Отменён',   icon: '❌', color: '#f87171' },
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

    this.editingItemId  = null;
    this.editingOwnerId = null;
    this.currentPhoto   = null;

    this._selOwner  = null;
    this._selStatus = 'in_stock';
    this._selColor  = DEFAULT_COLOR;

    this._detailItemId = null;
    this._confirmRes   = null;
    this._confirmRej   = null;
    this._toastTimer   = null;
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

    /* FAB */
    document.getElementById('fabBtn').addEventListener('click', () => this.openItemModal());

    /* Save */
    document.getElementById('saveBtn').addEventListener('click', () => this.doManualSave());

    /* History */
    document.getElementById('historyBtn').addEventListener('click', () => this.openModal('historyModal'));
    document.getElementById('historyModalClose').addEventListener('click', () => this.closeModal('historyModal'));
    document.getElementById('clearLogsBtn').addEventListener('click', () => this.clearLogs());

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
      const chip = e.target.closest('[data-owner]');
      if (!chip) return;
      this.filterOwnerId = chip.dataset.owner || null;
      this.renderOwnerFilterChips();
      this.renderInventoryList();
    });

    /* Inventory list item click (delegated) */
    document.getElementById('inventoryList').addEventListener('click', (e) => {
      const card = e.target.closest('.item-card');
      if (card) this.openDetailModal(card.dataset.id);
    });

    /* Item modal */
    document.getElementById('itemModalClose').addEventListener('click', () => this.closeModal('itemModal'));
    document.getElementById('itemModalSave').addEventListener('click', () => this.saveItem());

    /* Qty */
    document.getElementById('qtyPlus').addEventListener('click', () => {
      const el = document.getElementById('fieldQuantity');
      el.value = Math.max(0, (parseInt(el.value) || 0) + 1);
      this.updateTotal();
    });
    document.getElementById('qtyMinus').addEventListener('click', () => {
      const el = document.getElementById('fieldQuantity');
      el.value = Math.max(0, (parseInt(el.value) || 0) - 1);
      this.updateTotal();
    });
    document.getElementById('fieldQuantity').addEventListener('input', () => this.updateTotal());
    document.getElementById('fieldPrice').addEventListener('input', () => this.updateTotal());

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
      setTimeout(() => this.openItemModal(id), 150);
    });

    /* Owner modal */
    document.getElementById('addOwnerBtn').addEventListener('click', () => this.openOwnerModal());
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
    document.getElementById('fabBtn').classList.toggle('hidden', view !== 'inventory');

    switch (view) {
      case 'inventory': this.renderInventoryView(); break;
      case 'stats':     this.renderStats();         break;
      case 'owners':    this.renderOwners();        break;
      case 'settings':  this.renderSettings();      break;
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
    el.innerHTML =
      `<button class="chip ${!this.filterOwnerId ? 'active' : ''}" data-owner="">Все</button>` +
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

    const items = await this.db.getItems({
      ownerId:     this.filterOwnerId || undefined,
      orderStatus: this.filterStatus  || undefined,
      search:      this.searchQuery   || undefined,
    });

    if (!items.length) {
      list.innerHTML = `
        <div class="empty-state">
          <svg width="68" height="68" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width=".9">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
          <h3>${this.searchQuery ? 'Ничего не найдено' : 'Нет товаров'}</h3>
          <p>${this.searchQuery ? 'Попробуйте другой запрос' : 'Нажмите + чтобы добавить первый товар'}</p>
        </div>`;
      return;
    }

    const ownerMap = Object.fromEntries(this.owners.map(o => [o.id, o]));
    list.innerHTML = `<div class="items-list">${items.map((item, idx) => {
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

      return `<div class="item-card" data-id="${item.id}" style="animation-delay:${Math.min(idx*28,200)}ms">
        <div class="item-thumb">${thumb}</div>
        <div class="item-info">
          <div class="item-top">
            <div style="min-width:0">
              <div class="item-name">${this.esc(item.name)}</div>
              <div class="item-type-size">${this.esc(item.type)}${item.size ? ' · ' + this.esc(item.size) : ''}</div>
            </div>
            <span class="status-badge ${item.orderStatus}">${st.label}</span>
          </div>
          <div class="item-meta">
            ${owner ? `<span class="item-owner-tag"><span class="owner-dot" style="background:${owner.color}"></span>${this.esc(owner.name)}</span>` : ''}
            <span class="item-qty-badge">${item.quantity} шт</span>
          </div>
          <div class="item-bottom">
            <span class="item-total">${item.price ? fmtMoney(item.total) : '—'}</span>
            ${item.price ? `<span style="font-size:11px;color:var(--hint)">${fmtMoney(item.price)}/шт</span>` : ''}
          </div>
        </div>
      </div>`;
    }).join('')}</div>`;
  }

  /* ──────────────────────────────────────────
     ITEM DETAIL
     ────────────────────────────────────────── */
  async openDetailModal(id) {
    const item = await this.db.getItem(id);
    if (!item) return;
    this._detailItemId = id;

    const st    = statusById(item.orderStatus);
    const owner = this.owners.find(o => o.id === item.ownerId);

    const rows = [
      ['Тип',     item.type     || '—'],
      ['Размер',  item.size     || '—'],
      ['Кол-во',  item.quantity + ' шт'],
      ['Цена/шт', item.price    ? fmtMoney(item.price) : '—'],
      ['Итого',   fmtMoney(item.total), 'big'],
      ['Статус',  `<span class="status-badge ${item.orderStatus}">${st.label}</span>`],
      ['Владелец', owner
        ? `<span style="display:flex;align-items:center;gap:6px;justify-content:flex-end">
             <span style="width:10px;height:10px;border-radius:50%;background:${owner.color};display:inline-block;flex-shrink:0"></span>
             ${this.esc(owner.name)}
           </span>`
        : '—'],
      ['Создан',   this.fmtDate(item.createdAt)],
      ['Обновлён', this.fmtDate(item.updatedAt)],
    ].map(([k,v,c]) =>
      `<div class="detail-row"><span class="detail-key">${k}</span><span class="detail-val ${c||''}">${v}</span></div>`
    ).join('');

    document.getElementById('detailModalTitle').textContent = item.name;
    document.getElementById('detailModalBody').innerHTML = `
      ${item.photo ? `<img src="${item.photo}" class="detail-photo" alt="">` : ''}
      <div class="detail-card">${rows}</div>
      ${item.notes ? `<div class="detail-notes">${this.esc(item.notes)}</div>` : ''}
      <button class="detail-delete-btn" id="detailDeleteBtn">🗑 Удалить товар</button>
    `;
    document.getElementById('detailDeleteBtn').addEventListener('click', () => this.deleteItem(id));
    this.openModal('detailModal');
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
    this._selStatus    = 'in_stock';

    /* Reset */
    ['fieldType','fieldName','fieldSize','fieldNotes'].forEach(i => document.getElementById(i).value = '');
    document.getElementById('fieldQuantity').value = '1';
    document.getElementById('fieldPrice').value    = '';
    document.getElementById('totalDisplay').textContent = '0 ₽';
    document.getElementById('photoPreview').src = '';
    document.getElementById('photoPreview').classList.add('hidden');
    document.getElementById('photoPlaceholder').classList.remove('hidden');
    document.getElementById('photoRemove').classList.add('hidden');

    /* Type datalist */
    const types = [...new Set(this.items.map(i => i.type).filter(Boolean))];
    document.getElementById('typesList').innerHTML = types.map(t => `<option value="${this.esc(t)}">`).join('');

    document.getElementById('itemModalTitle').textContent = id ? 'Изменить товар' : 'Новый товар';

    if (id) {
      const item = await this.db.getItem(id);
      if (item) {
        document.getElementById('fieldType').value     = item.type     || '';
        document.getElementById('fieldName').value     = item.name     || '';
        document.getElementById('fieldSize').value     = item.size     || '';
        document.getElementById('fieldQuantity').value = item.quantity ?? 1;
        document.getElementById('fieldPrice').value    = item.price    || '';
        document.getElementById('fieldNotes').value    = item.notes    || '';
        this._selOwner  = item.ownerId     || null;
        this._selStatus = item.orderStatus || 'in_stock';
        this.updateTotal();
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
    this.openModal('itemModal');
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

  updateTotal() {
    const qty   = parseFloat(document.getElementById('fieldQuantity').value) || 0;
    const price = parseFloat(document.getElementById('fieldPrice').value)    || 0;
    document.getElementById('totalDisplay').textContent = fmtMoney(qty * price);
  }

  async saveItem() {
    const name = document.getElementById('fieldName').value.trim();
    const type = document.getElementById('fieldType').value.trim();
    if (!name) { this.toast('Укажите наименование товара'); return; }
    if (!type) { this.toast('Укажите тип товара'); return; }

    const isNew = !this.editingItemId;
    const item  = {
      ...(isNew ? {} : { id: this.editingItemId }),
      type,
      name,
      size:        document.getElementById('fieldSize').value.trim(),
      quantity:    parseFloat(document.getElementById('fieldQuantity').value) || 0,
      price:       parseFloat(document.getElementById('fieldPrice').value)    || 0,
      notes:       document.getElementById('fieldNotes').value.trim(),
      ownerId:     this._selOwner  || null,
      orderStatus: this._selStatus || 'in_stock',
      photo:       this.currentPhoto || null,
    };

    const saved = await this.db.saveItem(item);
    await this.db.logAction(
      isNew ? 'item_add' : 'item_edit',
      isNew ? `Добавлен товар: «${name}»` : `Изменён товар: «${name}»`,
      { id: saved.id, name, type, quantity: item.quantity, price: item.price }
    );
    await this.loadData();
    this.closeModal('itemModal');
    this.renderInventoryList();
    this.toast(isNew ? 'Товар добавлен ✓' : 'Товар обновлён ✓');
  }

  /* ──────────────────────────────────────────
     OWNERS VIEW
     ────────────────────────────────────────── */
  async renderOwners() {
    const list  = document.getElementById('ownersList');
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
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width=".9">
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
    this.renderOwners();
    this.toast(isNew ? 'Владелец добавлен ✓' : 'Владелец обновлён ✓');
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
    this.renderOwners();
    this.toast('Владелец удалён');
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
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width=".9">
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
      byStatus[i.orderStatus] = (byStatus[i.orderStatus] || 0) + 1;
      const k = i.ownerId || '__none__';
      if (!byOwner[k]) byOwner[k] = { qty: 0, val: 0, cnt: 0 };
      byOwner[k].qty += (i.quantity || 0);
      byOwner[k].val += (i.total    || 0);
      byOwner[k].cnt++;
      if (i.type) {
        if (!byType[i.type]) byType[i.type] = { cnt: 0, val: 0 };
        byType[i.type].cnt++;
        byType[i.type].val += (i.total || 0);
      }
    });

    const maxSt  = Math.max(...Object.values(byStatus), 1);
    const maxOwV = Math.max(...Object.values(byOwner).map(v => v.val), 1);
    const maxTyC = Math.max(...Object.values(byType).map(v => v.cnt), 1);

    const statusBars = STATUSES.filter(s => byStatus[s.id]).map(s => {
      const cnt = byStatus[s.id];
      return `<div class="bar-row">
        <span class="bar-label">${s.icon} ${s.label}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${Math.round(cnt/maxSt*100)}%;background:${s.color}"></div></div>
        <span class="bar-count">${cnt}</span>
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

    const typeSorted = Object.entries(byType).sort((a, b) => b[1].cnt - a[1].cnt);
    const typeRows   = typeSorted.map(([t, v]) =>
      `<div class="bar-row">
        <span class="bar-label">${this.esc(t)}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${Math.round(v.cnt/maxTyC*100)}%;background:var(--a1)"></div></div>
        <span class="bar-count">${v.cnt} / ${fmtMoney(v.val)}</span>
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
    const el      = document.getElementById('settingsContent');
    const lastBk  = this.backup.getLastTimeStr();
    const autoOn  = this.backup.isAutoEnabled();
    const hasCld  = !!window.Telegram?.WebApp?.CloudStorage;
    const theme   = localStorage.getItem('inv_theme') || 'dark';

    const toggle = (on) => `
      <div class="toggle-track" style="background:${on ? 'var(--a1)' : 'var(--muted)'}">
        <div class="toggle-thumb" style="transform:translateX(${on ? 18 : 0}px)"></div>
      </div>`;

    const arrow = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="settings-row-arrow"><polyline points="9 18 15 12 9 6"/></svg>`;

    el.innerHTML = `
      <div class="backup-info-card">
        <div class="backup-last">💾 Последний бэкап: <strong>${lastBk}</strong></div>
        ${hasCld ? '<div class="backup-last">☁️ Telegram CloudStorage: подключён</div>' : ''}
      </div>

      <div class="section-title">Внешний вид</div>
      <div class="settings-section">
        <div class="settings-row" style="cursor:default">
          <div class="settings-row-icon gray">🎨</div>
          <div class="settings-row-info">
            <div class="settings-row-title">Тема</div>
          </div>
          <div class="theme-toggle" id="themeToggle">
            <button class="theme-btn ${theme === 'dark'  ? 'active' : ''}" data-t="dark">🌙 Тёмная</button>
            <button class="theme-btn ${theme === 'light' ? 'active' : ''}" data-t="light">☀️ Светлая</button>
          </div>
        </div>
      </div>

      <div class="section-title">Резервная копия</div>
      <div class="settings-section">
        <div class="settings-row" id="sBtnBackup">
          <div class="settings-row-icon blue">💾</div>
          <div class="settings-row-info">
            <div class="settings-row-title">Сохранить сейчас</div>
            <div class="settings-row-sub">Скачать JSON-файл с данными</div>
          </div>${arrow}
        </div>
        <div class="settings-row" id="sBtnAutoToggle">
          <div class="settings-row-icon green">🔄</div>
          <div class="settings-row-info">
            <div class="settings-row-title">Авто-бэкап каждые 24 ч</div>
            <div class="settings-row-sub">${autoOn ? 'Включён ✓' : 'Выключен'}</div>
          </div>${toggle(autoOn)}
        </div>
        <div class="settings-row" id="sBtnRestore">
          <div class="settings-row-icon orange">📂</div>
          <div class="settings-row-info">
            <div class="settings-row-title">Восстановить из файла</div>
            <div class="settings-row-sub">Загрузить JSON-бэкап</div>
          </div>${arrow}
        </div>
        ${hasCld ? `
        <div class="settings-row" id="sBtnCloudRestore">
          <div class="settings-row-icon teal">☁️</div>
          <div class="settings-row-info">
            <div class="settings-row-title">Восстановить из облака</div>
            <div class="settings-row-sub">Telegram Cloud Storage</div>
          </div>${arrow}
        </div>` : ''}
      </div>

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

      <input type="file" id="restoreFileInput" accept=".json" hidden>
    `;

    /* Theme toggle */
    document.getElementById('themeToggle').addEventListener('click', (e) => {
      const btn = e.target.closest('.theme-btn');
      if (!btn) return;
      this.applyTheme(btn.dataset.t);
      this.renderSettings();
    });

    document.getElementById('sBtnBackup').addEventListener('click', () => this.doManualSave());

    document.getElementById('sBtnAutoToggle').addEventListener('click', () => {
      this.backup.setAutoEnabled(!this.backup.isAutoEnabled());
      this.renderSettings();
    });

    document.getElementById('sBtnRestore').addEventListener('click', () =>
      document.getElementById('restoreFileInput').click()
    );

    document.getElementById('restoreFileInput').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const ok = await this.confirm('Восстановить данные из файла?\nТекущие данные будут заменены.');
      if (!ok) { e.target.value = ''; return; }
      try {
        await this.backup.restoreFromFile(file);
        await this.db.logAction('restore', `Восстановлено из файла: ${file.name}`);
        await this.loadData();
        this.renderSettings();
        this.toast('Данные восстановлены ✓');
      } catch (err) { this.toast('Ошибка: ' + err.message); }
      e.target.value = '';
    });

    document.getElementById('sBtnCloudRestore')?.addEventListener('click', async () => {
      const ok = await this.confirm('Восстановить из Telegram Cloud?\nТекущие данные будут заменены.');
      if (!ok) return;
      try {
        const data = await this.backup.restoreFromCloud();
        if (!data) { this.toast('Нет данных в облаке'); return; }
        await this.db.importAll(data);
        await this.db.logAction('restore', 'Восстановлено из Telegram CloudStorage');
        await this.loadData();
        this.renderSettings();
        this.toast('Восстановлено из облака ✓');
      } catch (err) { this.toast('Ошибка: ' + err.message); }
    });
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
    el.style.display = 'flex';
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('open')));

    /* Auto-load logs when history modal opens */
    if (id === 'historyModal') this.renderLogs();
  }

  closeModal(id) {
    const el   = document.getElementById(id);
    el.classList.remove('open');
    const hide = () => { el.style.display = ''; el.removeEventListener('transitionend', hide); };
    el.addEventListener('transitionend', hide);
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
  confirm(msg) {
    return new Promise((resolve) => {
      document.getElementById('confirmMsg').textContent = msg;
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
