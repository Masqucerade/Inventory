/* =============================================
   Main Application  —  Inventory Telegram Mini App
   Web3 Minimalism edition with full action logging
   ============================================= */

/* ── Constants ── */

/* Инлайн-SVG-иконки интерфейса — вместо эмодзи (стиль Aniq-ui) */
const UI_PATHS = {
  clipboard:  '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
  package:    '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
  image:      '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
  star:       '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  fileText:   '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
  megaphone:  '<path d="M3 11l18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  bell:       '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  repeat:     '<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
  eye:        '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff:     '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>',
  creditCard: '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
  phone:      '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  mapPin:     '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  key:        '<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>',
  link:       '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  receipt:    '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="16" y2="11"/>',
  checkCircle:'<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  plus:       '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  edit:       '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
  trash:      '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  user:       '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  save:       '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',
  folder:     '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
  xCircle:    '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
  layers:     '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  tag:        '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
  msg:        '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
  heart:      '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
  alert:      '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
  lock:       '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  shield:     '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  spark:      '<path d="M12 3l1.9 5.6 5.6 1.9-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-1.9z"/><path d="M19 15l.9 2.6 2.6.9-2.6.9L19 22l-.9-2.6-2.6-.9 2.6-.9z"/>',
  gift:       '<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',
  sun:        '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',
  moon:       '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
  pin:        '<path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1z"/>',
  info:       '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
};
const uiIcon = (name, size = 14) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px">${UI_PATHS[name] || ''}</svg>`;

const STATUSES = [
  { id: 'ordered',      label: 'Заказано',   icon: uiIcon('clipboard', 13), color: 'rgba(255,255,255,0.40)' },
  { id: 'at_warehouse', label: 'На складе',  icon: uiIcon('package', 13),   color: '#fb923c' },
  { id: 'in_stock',     label: 'В наличии',  icon: '●',  color: '#4ade80' },
  { id: 'processing',   label: 'В заказе',   icon: '○',  color: '#93c5fd' },
  { id: 'done',         label: 'Завершено',  icon: '✓',  color: 'rgba(255,255,255,0.22)' },
];

const OWNER_COLORS = [
  '#ff6b6b','#ff9500','#ffd60a','#30d158','#00c7be',
  '#7c6dfa','#5856d6','#af52de','#ff375f','#8e8e93',
];

const LOG_META = {
  item_add:     { icon: uiIcon('plus', 13),    color: 'rgba(48,209,88,.15)' },
  item_edit:    { icon: uiIcon('edit', 12),    color: 'rgba(127,127,127,.18)' },
  item_delete:  { icon: uiIcon('trash', 12),   color: 'rgba(248,113,113,.15)' },
  owner_add:    { icon: uiIcon('user', 13),    color: 'rgba(48,209,88,.15)' },
  owner_edit:   { icon: uiIcon('edit', 12),    color: 'rgba(127,127,127,.18)' },
  owner_delete: { icon: uiIcon('trash', 12),   color: 'rgba(248,113,113,.15)' },
  backup:       { icon: uiIcon('save', 12),    color: 'rgba(59,130,246,.15)' },
  restore:      { icon: uiIcon('folder', 12),  color: 'rgba(255,159,10,.15)' },
  clear:        { icon: uiIcon('xCircle', 13), color: 'rgba(248,113,113,.15)' },
};

const DEFAULT_COLOR = '#a1a1aa';

const statusById = (id) => STATUSES.find(s => s.id === id) || STATUSES[0];
const fmtNum = (n) => n == null ? '' : Number(n).toLocaleString('ru-RU', { maximumFractionDigits: 2 });
const fmtMoney = (n) => (!n && n !== 0) ? '0 ₽' : fmtNum(n) + ' ₽';
const debounce = (fn, ms = 280) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

/* ── Микровзаимодействия ──
   runCountUps: числа [data-count][data-fmt] «набегают» от нуля.
   animateSection: секции появляются каскадом, полосы графиков растут. */
function runCountUps(root) {
  root.querySelectorAll('[data-count]').forEach(el => {
    const target = parseFloat(el.dataset.count) || 0;
    const fmt    = el.dataset.fmt || 'num';
    const dur    = 750;
    const t0     = performance.now();
    const out    = v => fmt === 'money' ? fmtMoney(Math.round(v)) : fmtNum(Math.round(v));
    if (!target || document.hidden) { el.textContent = out(target); return; }
    /* Страховка: если rAF заморожен (фоновая вкладка/WebView) —
       через dur+250мс просто ставим финальное значение */
    const failsafe = setTimeout(() => { el.textContent = out(target); }, dur + 250);
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);         // easeOutCubic
      el.textContent = out(target * e);
      if (p < 1) requestAnimationFrame(step);
      else { clearTimeout(failsafe); el.textContent = out(target); }
    };
    requestAnimationFrame(step);
  });
}

function animateSection(root) {
  [...root.children].forEach((c, i) => {
    c.classList.add('reveal');
    c.style.animationDelay = Math.min(i * 60, 420) + 'ms';
  });
  requestAnimationFrame(() => requestAnimationFrame(() => {
    root.querySelectorAll('.bar-fill[data-w]').forEach((b, i) => {
      b.style.transitionDelay = Math.min(i * 50, 400) + 'ms';
      b.style.width = b.dataset.w + '%';
    });
  }));
}

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
    this._photos        = [];
    this._taskPhoto     = null;

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
    this._filterCat         = null;
    this._filterGarment     = null;
    this._catFilterOpen     = false;
    this._projectSubTab     = 'tasks';
    this.categories         = [];
    this._archiveOpen       = false;
    this._currentPayType    = 'deposit';
    this._currentEmpOwnerId = null;

    this.currentUser        = null;
    this.users              = [];
    this._booted            = false;
  }

  /* ──────────────────────────────────────────
     INIT
     ────────────────────────────────────────── */
  async init() {
    try {
      this.initTheme();
      this.detectPlatform();
      this.bindLogin();
      window.addEventListener('inv-unauthorized', () => {
        this.currentUser = null;
        this.showLogin();
      });

      const token = localStorage.getItem('inv_token');
      let user = null;
      if (token) { try { user = await this.db.me(); } catch {} }

      if (user) { this.currentUser = user; await this.boot(); }
      else      { this.showLogin(); }
    } catch (err) {
      console.error('Init error:', err);
    }
  }

  // Запуск приложения после успешной авторизации
  async boot() {
    document.body.classList.add('authed');
    document.getElementById('loginScreen').classList.add('hidden');

    if (!this._booted) {
      await this.db.init();
      this.initTelegram();
      // Ошибка в одной привязке не должна мешать рендеру экрана
      try { this.bindGlobal(); } catch (e) { console.error('bindGlobal error:', e); }
      this._booted = true;
    }
    this._updateProfileBadge();
    await this.loadData();
    // Веб-версия на широком экране открывается с дашборда «Обзор»
    const isWebWide = document.documentElement.classList.contains('is-web')
      && window.matchMedia('(min-width: 1000px)').matches;
    const startView = isWebWide ? 'overview'
      : (['inventory','stats','finance','project','site','settings'].find(v => this.hasAccess(v)) || 'inventory');
    this.renderView(startView);
    this._applyAccess();
    this.backup.checkAutoBackup();

    // Скан QR-этикетки: #item=<id> — карточка товара, #items=a,b,c — посылка
    const qrOne   = /#item=([\w-]+)/.exec(location.hash);
    const qrMulti = /#items=([\w,-]+)/.exec(location.hash);
    if (qrOne || qrMulti) {
      history.replaceState(null, '', location.pathname);
      if (qrMulti) this._selectScanned(qrMulti[1].split(','));
      else {
        const id = decodeURIComponent(qrOne[1]);
        if (this.items.some(i => i.id === id)) this.openDetailModal(id);   // превью, не редактирование
        else this.toast('Товар с этикетки не найден — возможно, удалён');
      }
    }
  }

  /* ── Доступ к разделам ── */
  hasAccess(section) {
    if (section === 'settings') section = 'faq';   // вкладка FAQ = view "settings"
    
    const u = this.currentUser;
    if (!u) return false;
    if (section === 'profile') return true;        // личная страница есть у каждого
    if (section === 'overview') return true;       // дашборд-сводка есть у каждого
    if (section === 'roles') return u.role === 'root';   // роли и права — только root
    if (section === 'calendar') return u.role === 'root'; // личный календарь root'а
    if (u.role === 'root') return true;
    // Сотрудник: вкладки «Проект» нет — её содержимое живёт на «Личном»
    if (section === 'project') return false;
    if (!Array.isArray(u.access)) return true;   // не настроено = полный доступ
    return u.access.includes(section);
  }

  // Скрыть вкладки, к которым нет доступа; уйти с запрещённого экрана
  _applyAccess() {
    document.querySelectorAll('.nav-btn').forEach(b =>
      b.classList.toggle('hidden', !this.hasAccess(b.dataset.view)));
    this._renderNavSections();
    this._initSidebarToggle();
    this._setupMoreNav();
    // Задачи/заметки/доступы сотрудника живут на «Личном» — переносим узлы проекта
    this._mountProjectInProfile();
    if (!this.hasAccess(this.currentView)) {
      const first = ['inventory','stats','finance','project','site','terminal','settings'].find(v => this.hasAccess(v));
      if (first) this.renderView(first);
    }
  }

  /* Сайдбар: полный → только значки → скрыт (бургер в топбаре).
     Выбор запоминается. На мобиле/в Telegram топбар скрыт CSS-ом. */
  _initSidebarToggle() {
    const nav = document.querySelector('.bottom-nav');
    if (!nav || this._sbInit) return;
    this._sbInit = true;
    const apply = (m) => {
      document.body.classList.toggle('sb-icons',  m === 'icons');
      document.body.classList.toggle('sb-hidden', m === 'hidden');
      localStorage.setItem('sbMode', m);
    };
    document.getElementById('tbBurger')?.addEventListener('click', () => {
      const cur = document.body.classList.contains('sb-icons') ? 'icons'
                : document.body.classList.contains('sb-hidden') ? 'hidden' : 'full';
      apply(cur === 'full' ? 'icons' : cur === 'icons' ? 'hidden' : 'full');
    });
    // Карточка профиля внизу сайдбара: клик — «Личное» (пункта в меню нет),
    // иконка справа — выход
    const card = document.createElement('div');
    card.className = 'nav-profile';
    card.innerHTML = `
      <span class="nav-profile-ava" id="sbAva">?</span>
      <span class="nav-profile-info"><b id="sbName"></b><i id="sbRole"></i></span>
      <button class="nav-profile-out" id="sbLogout" type="button" title="Выйти из аккаунта">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      </button>`;
    card.addEventListener('click', (e) => {
      if (e.target.closest('#sbLogout')) return;
      this.renderView('profile');
    });
    card.querySelector('#sbLogout').addEventListener('click', async () => {
      if (!await this.confirm('Выйти из аккаунта?', 'Выйти')) return;
      await this.db.logout();
      location.reload();
    });
    nav.appendChild(card);
    this._updateProfileBadge();   // карточка создана после первого обновления бейджей
    // Тултипы пунктов — в режиме «только значки» подписей нет
    nav.querySelectorAll('.nav-btn').forEach(b =>
      b.title = b.querySelector('.nav-label')?.textContent || '');
    apply(localStorage.getItem('sbMode') || 'full');
    this._initTopbar();
  }

  /* Топбар веб-версии: тема, профиль, глобальный поиск с ⌘K */
  _initTopbar() {
    if (this._tbInit) return;
    this._tbInit = true;
    const themeBtn = document.getElementById('tbTheme');
    const setThemeIcon = () => {
      const dark = (localStorage.getItem('inv_theme') || 'dark') === 'dark';
      if (themeBtn) themeBtn.innerHTML = dark
        ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`
        : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
    };
    setThemeIcon();
    themeBtn?.addEventListener('click', () => {
      const next = (localStorage.getItem('inv_theme') || 'dark') === 'dark' ? 'light' : 'dark';
      this.applyTheme(next);
      setThemeIcon();
    });
    // Поиск в топбаре зеркалит поиск склада
    const tb = document.getElementById('tbSearch');
    const si = document.getElementById('searchInput');
    tb?.addEventListener('input', () => {
      if (this.currentView !== 'inventory') this.renderView('inventory');
      if (si) { si.value = tb.value; si.dispatchEvent(new Event('input')); }
    });
    tb?.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { tb.value = ''; tb.dispatchEvent(new Event('input')); tb.blur(); }
    });
    // ⌘K / Ctrl+K — фокус в поиск
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.code === 'KeyK') {
        e.preventDefault();
        tb?.focus(); tb?.select();
      }
    });
  }

  /* Мобильная пилюля: вторичные вкладки (Проект/Сайт/Промокоды/Роли/Терминал)
     живут в листе «Ещё» — иначе низ нагромождён. В веб-сайдбаре видны все. */
  _setupMoreNav() {
    const btn   = document.getElementById('navMoreBtn');
    const sheet = document.getElementById('moreSheet');
    const back  = document.getElementById('moreBackdrop');
    if (!btn || !sheet || !back) return;
    if (!btn._bound) {
      btn._bound = true;
      const close = () => { sheet.classList.remove('open'); back.classList.add('hidden'); };
      this._closeMoreNav = close;
      btn.addEventListener('click', () => {
        if (sheet.classList.contains('open')) { close(); return; }
        this._renderMoreSheet();
        sheet.classList.add('open');
        back.classList.remove('hidden');
      });
      back.addEventListener('click', close);
    }
    this._renderMoreSheet();
  }

  _renderMoreSheet() {
    const body = document.getElementById('moreSheetBody');
    const btn  = document.getElementById('navMoreBtn');
    if (!body || !btn) return;
    const views = ['project', 'calendar', 'site', 'promos', 'tg', 'roles', 'settings'].filter(v => this.hasAccess(v));
    btn.classList.toggle('hidden', !views.length);
    // Иконки и подписи берём у самих кнопок навигации — один источник правды
    body.innerHTML = views.map(v => {
      const src   = document.querySelector(`.nav-btn[data-view="${v}"]`);
      const icon  = src?.querySelector('.nav-icon')?.outerHTML || '';
      const label = src?.querySelector('.nav-label')?.textContent || v;
      return `<button class="more-row${this.currentView === v ? ' active' : ''}" data-view="${v}" type="button">${icon}<span>${label}</span></button>`;
    }).join('');
    body.querySelectorAll('.more-row').forEach(r => r.addEventListener('click', () => {
      this._closeMoreNav?.();
      this.renderView(r.dataset.view);
    }));
  }

  /* Подписи групп в сайдбаре (веб, широкий экран): вставляются перед первой
     видимой кнопкой группы; на мобиле скрыты CSS-ом. У сотрудника «Проект»
     скрыт — группа «Команда» начинается с «Личного». */
  _renderNavSections() {
    const nav = document.querySelector('.bottom-nav');
    if (!nav) return;
    nav.querySelectorAll('.nav-sec').forEach(n => n.remove());
    if (!document.documentElement.classList.contains('is-web')) return;
    const GROUPS = [['inventory', 'Склад'], ['finance', 'Деньги'], ['project', 'Команда'], ['site', 'Витрина'], ['roles', 'Система']];
    const visible = v => {
      const b = nav.querySelector(`.nav-btn[data-view="${v}"]`);
      return b && !b.classList.contains('hidden') ? b : null;
    };
    for (const [view, label] of GROUPS) {
      let btn = visible(view);
      // «Личное» в веб-сайдбаре скрыто (вход через карточку профиля внизу) —
      // у сотрудника без «Проекта» группа «Команда» просто не вставляется
      if (view === 'roles' && !btn) btn = visible('settings');   // у сотрудника «Система» начинается с Терминала
      if (!btn) continue;
      const d = document.createElement('div');
      d.className = 'nav-sec';
      d.textContent = label;
      nav.insertBefore(d, btn);
    }
  }

  /* Сотрудник: DOM-узлы «Проекта» (шапка, вкладки, контент) физически
     переезжают на личную страницу — вся логика проекта работает как есть.
     Root: узлы возвращаются на место во вкладку «Проект». */
  _mountProjectInProfile() {
    const isRoot = this.currentUser?.role === 'root';
    const nodes  = ['projHero', 'projTabs', 'projectContent'].map(id => document.getElementById(id));
    if (nodes.some(n => !n)) return;
    const target = isRoot ? document.getElementById('projectBody')
                          : document.getElementById('profileProjectMount');
    if (target && nodes[0].parentElement !== target) target.append(...nodes);
  }

  // Аватар текущего профиля справа вверху (+ чип в топбаре)
  _updateProfileBadge() {
    const el = document.getElementById('profileInitial');
    const btn = document.getElementById('profileBtn');
    const u = this.currentUser || {};
    const initial = (u.name || u.login || '?')[0].toUpperCase();
    if (el && btn) {
      el.textContent = initial;
      btn.title = `${u.name || ''}${u.role === 'root' ? ' · root' : ''}`;
      btn.classList.toggle('is-root', u.role === 'root');
    }
    // Карточка профиля внизу сайдбара
    const sa = document.getElementById('sbAva');
    const sn = document.getElementById('sbName');
    const sr = document.getElementById('sbRole');
    if (sa) sa.textContent = initial;
    if (sn) sn.textContent = u.name || u.login || '';
    if (sr) sr.textContent = u.role === 'root' ? 'Root-админ' : `@${u.login || ''}`;
  }

  showLogin() {
    document.body.classList.remove('authed');
    const ls = document.getElementById('loginScreen');
    ls.classList.remove('hidden');
    const err = document.getElementById('loginError');
    if (err) err.textContent = '';
    const pw = document.getElementById('loginPassword');
    if (pw) pw.value = '';
    setTimeout(() => document.getElementById('loginLogin')?.focus(), 120);
  }

  bindLogin() {
    const form = document.getElementById('loginForm');
    if (!form || form._bound) return;
    form._bound = true;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const login = document.getElementById('loginLogin').value.trim();
      const pass  = document.getElementById('loginPassword').value;
      const errEl = document.getElementById('loginError');
      const btn   = document.getElementById('loginSubmit');
      if (!login || !pass) { errEl.textContent = 'Введите логин и пароль'; return; }
      btn.disabled = true; btn.textContent = 'Вход…';
      try {
        const user = await this.db.login(login, pass);
        this.currentUser = user;
        errEl.textContent = '';
        document.getElementById('loginPassword').value = '';
        await this.boot();
      } catch (err) {
        errEl.textContent = err.message || 'Ошибка входа';
      } finally {
        btn.disabled = false; btn.textContent = 'Войти';
      }
    });
  }

  initTheme() {
    const saved = localStorage.getItem('inv_theme') || 'dark';
    this.applyTheme(saved);
  }

  // Открыто как обычный сайт (не в Telegram) → десктоп-оформление под macOS
  detectPlatform() {
    const tg = window.Telegram?.WebApp;
    const inTelegram = !!(tg && tg.initData && tg.initData.length > 0);
    document.documentElement.classList.toggle('is-web', !inTelegram);
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

  // Контент бывшего бургер-меню; теперь рендерится на «Личном» (mount)
  renderMenuPanel(el = document.getElementById('headerMenuBody')) {
    const lastBk = this.backup.getLastTimeStr();
    const theme  = localStorage.getItem('inv_theme') || 'dark';

    const arrow       = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="settings-row-arrow"><polyline points="9 18 15 12 9 6"/></svg>`;
    const svgSend     = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
    const svgAuto     = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`;
    const svgDownload = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
    const svgUpload   = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`;
    const svgTruck    = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="1" y="3" width="15" height="13" rx="1"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`;
    const svgLogout   = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`;
    const svgUserAdd  = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>`;

    const isRoot = this.currentUser?.role === 'root';
    const u      = this.currentUser || {};

    const chevron = `<svg class="menu-acc-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="6 9 12 15 18 9"/></svg>`;
    const plus    = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;

    // Профильное и сервисное (аккаунт, бэкапы, тема) живёт на «Личном» —
    // здесь только справочники, связанные с товарами
    // Пользователи и их права живут на вкладке «Роли и права»
    el.innerHTML = `
      <div class="menu-acc" data-acc="owners">
        <button class="menu-acc-head">
          <span class="menu-acc-title">Участники</span>
          <span class="menu-acc-count">${(this.owners || []).length}</span>
          <span class="menu-acc-add" id="mAddOwnerBtn" title="Добавить участника">${plus}</span>
          ${chevron}
        </button>
        <div class="menu-acc-body"><div id="menuOwnersList"></div></div>
      </div>

      <div class="menu-acc" data-acc="cats">
        <button class="menu-acc-head">
          <span class="menu-acc-title">Категории</span>
          <span class="menu-acc-count">${(this.categories || []).length}</span>
          <span class="menu-acc-add" id="mAddCatBtn" title="Добавить категорию">${plus}</span>
          ${chevron}
        </button>
        <div class="menu-acc-body"><div id="menuCatList"></div></div>
      </div>

      <div class="menu-acc" data-acc="brands">
        <button class="menu-acc-head">
          <span class="menu-acc-title">Бренды</span>
          <span class="menu-acc-count">${(this.brands || []).length}</span>
          <span class="menu-acc-add" id="mAddBrandBtn" title="Добавить бренд">${plus}</span>
          ${chevron}
        </button>
        <div class="menu-acc-body"><div id="menuBrandList"></div></div>
      </div>

      <div class="menu-foot">
        <span>Masqucerade INC. · v1.2</span>
      </div>
    `;

    /* Аккордеоны: раскрытие секций, «+» не сворачивает */
    el.querySelectorAll('.menu-acc-head').forEach(head => {
      head.addEventListener('click', (e) => {
        if (e.target.closest('.menu-acc-add')) return;
        const acc = head.parentElement;
        const open = acc.classList.toggle('open');
        if (open) this._openAccs.add(acc.dataset.acc);
        else this._openAccs.delete(acc.dataset.acc);
      });
    });
    (this._openAccs || (this._openAccs = new Set())).forEach(k => {
      el.querySelector(`.menu-acc[data-acc="${k}"]`)?.classList.add('open');
    });

    document.getElementById('mAddOwnerBtn').addEventListener('click', () => {
      this.closeMenu();
      this.openOwnerModal();
    });
    document.getElementById('mAddCatBtn').addEventListener('click', () => this._openCatPrompt());
    document.getElementById('mAddBrandBtn').addEventListener('click', () => this._openBrandPrompt());

    this.renderOwners('menuOwnersList');
    this._renderMenuCats();
    this._renderMenuBrands();
  }

  /* ──────────────────────────────────────────
     USERS (root)
     ────────────────────────────────────────── */
  /* Вкладка «Роли и права»: роли-пресеты прав + пользователи панели */
  async renderRolesView() {
    const el = document.getElementById('rolesContent');
    if (!el) return;
    el.innerHTML = `<div class="ov-skel">
      <div class="skel-block" style="height:64px"></div>
      <div class="skel-block" style="height:64px"></div>
      <div class="skel-block" style="height:64px"></div>
    </div>`;
    const [roles, users, danger] = await Promise.all([
      this.db.getRoles(), this.db.getUsers(), this.db.getDangerStatus(),
    ]);
    if (this.currentView !== 'roles') return;
    this._roles = roles;
    this.users  = users;

    const SEC_N = 9;
    const roleUsers = r => users.filter(u => u.roleId === r.id);
    const accessSub = (access, hideCosts) =>
      `${!Array.isArray(access) || access.length >= SEC_N ? 'все разделы' : `разделов: ${access.length}/${SEC_N}`}${hideCosts ? ' · без закупа' : ''}`;

    const rolesRows = roles.map(r => {
      const n = roleUsers(r).length;
      return `<div class="settings-row role-row" data-role-id="${r.id}">
        <div class="settings-row-icon" style="background:rgba(56,189,248,.12)">${uiIcon('shield', 14)}</div>
        <div class="settings-row-info">
          <div class="settings-row-title">${this.esc(r.name)}</div>
          <div class="settings-row-sub">${accessSub(r.access, r.hideCosts)} · пользователей: ${n}${r.note ? ` · ${this.esc(r.note)}` : ''}</div>
        </div>
        <div class="block-row-actions">
          ${n ? `<button class="btn-line role-apply" data-id="${r.id}" title="Обновить права всех пользователей с этой ролью">Применить · ${n}</button>` : ''}
          <button class="block-toggle role-edit" data-id="${r.id}" title="Изменить">${uiIcon('edit', 12)}</button>
          <button class="block-delete-btn role-del" data-id="${r.id}" title="Удалить">${uiIcon('trash', 13)}</button>
        </div>
      </div>`;
    }).join('');

    const userRows = users.map(usr => {
      const role = roles.find(r => r.id === usr.roleId);
      return `<div class="settings-row" style="cursor:default">
        <div class="settings-row-icon" style="background:var(--fill2);color:var(--text);font-weight:700">${(usr.name || usr.login || '?')[0].toUpperCase()}</div>
        <div class="settings-row-info">
          <div class="settings-row-title">${this.esc(usr.name || usr.login)}${usr.role === 'root' ? '<span class="promo-badge on" style="margin-left:8px">root</span>' : role ? `<span class="promo-badge off" style="margin-left:8px">${this.esc(role.name)}</span>` : ''}</div>
          <div class="settings-row-sub">@${this.esc(usr.login)}${usr.role === 'root' ? ' · полный доступ' : ` · ${accessSub(usr.access, usr.hideCosts)}${usr.notify?.length ? ` · увед. ${usr.notify.length}` : ''}`}</div>
        </div>
        ${usr.role === 'root' ? '' : `
          <div class="block-row-actions">
            <button class="block-toggle user-edit-btn" data-uid="${usr.id}" title="Изменить">${uiIcon('edit', 12)}</button>
            <button class="block-delete-btn user-del-btn" data-uid="${usr.id}" title="Удалить">${uiIcon('trash', 13)}</button>
          </div>`}
      </div>`;
    }).join('');

    el.innerHTML = `
      <div class="site-sec-head">
        <div>
          <div class="site-sec-title">Роли</div>
          <div class="site-sec-hint">Готовые наборы прав: назначаются пользователю при создании, «Применить» обновляет всех после правки роли</div>
        </div>
        <div class="site-sec-actions"><button class="site-mini-add" id="roleAddBtn">＋ Роль</button></div>
      </div>
      ${roles.length
        ? `<div class="settings-section">${rolesRows}</div>`
        : `<div class="faq-empty"><div style="opacity:.5">${uiIcon('shield', 30)}</div>
             <p>Ролей пока нет.<br>Создайте, например, «Менеджер витрины» — только Товары и Сайт, без закупа.</p></div>`}

      <div class="site-sec-head" style="margin-top:22px">
        <div>
          <div class="site-sec-title">Пользователи</div>
          <div class="site-sec-hint">Аккаунты панели: доступы, видимость цен и уведомления в Telegram</div>
        </div>
        <div class="site-sec-actions"><button class="site-mini-add" id="userAddBtn">＋ Пользователь</button></div>
      </div>
      <div class="settings-section">${userRows}</div>

      <div class="site-sec-head" style="margin-top:22px">
        <div>
          <div class="site-sec-title">Опасные зоны</div>
          <div class="site-sec-hint">Критичные действия требуют отдельный пароль-подтверждение — его вводят все, включая root</div>
        </div>
      </div>
      <div class="settings-section">
        <div class="settings-row" style="cursor:default">
          <div class="settings-row-icon" style="background:rgba(248,113,113,.12)">${uiIcon('lock', 14)}</div>
          <div class="settings-row-info">
            <div class="settings-row-title">Пароль опасных зон
              <span class="promo-badge ${danger.set ? 'on' : 'off'}" style="margin-left:8px">${danger.set ? 'Задан' : 'Не задан'}</span>
            </div>
            <div class="settings-row-sub">${danger.set
              ? 'Защищено: публикация в TG-канал, удаление товаров'
              : 'Пока не задан — опасные действия выполняются без подтверждения'}</div>
          </div>
          <div class="block-row-actions">
            <button class="btn-line" id="dangerSetBtn" style="height:26px;padding:0 10px;font-size:11.5px;font-weight:600;white-space:nowrap">${danger.set ? 'Сменить' : 'Задать пароль'}</button>
            ${danger.set ? `<button class="block-delete-btn" id="dangerClearBtn" title="Снять пароль — открыть зоны">${uiIcon('trash', 13)}</button>` : ''}
          </div>
        </div>
      </div>`;

    document.getElementById('roleAddBtn')?.addEventListener('click', () => this.openRoleModal());
    document.getElementById('userAddBtn')?.addEventListener('click', () => this.openUserModal());
    el.querySelectorAll('.role-edit').forEach(b => b.addEventListener('click', () =>
      this.openRoleModal(this._roles.find(x => x.id === b.dataset.id))));
    el.querySelectorAll('.role-apply').forEach(b => b.addEventListener('click', async () => {
      const r = this._roles.find(x => x.id === b.dataset.id);
      if (!await this.confirm(`Обновить права всех пользователей с ролью «${r.name}» по её текущим настройкам?`, 'Применить', false)) return;
      const d = await this.db.applyRole(r.id);
      this.toast(`Роль применена к ${d.applied} польз. ✓`);
      this.renderRolesView();
    }));
    el.querySelectorAll('.role-del').forEach(b => b.addEventListener('click', async () => {
      const r = this._roles.find(x => x.id === b.dataset.id);
      if (!await this.confirm(`Удалить роль «${r.name}»? Права пользователей останутся как есть, снимется только метка.`)) return;
      await this.db.deleteRole(r.id);
      this.toast('Роль удалена ✓');
      this.renderRolesView();
    }));
    el.querySelectorAll('.user-edit-btn').forEach(btn =>
      btn.addEventListener('click', () => {
        const usr = users.find(x => x.id === btn.dataset.uid);
        if (usr) this.openUserModal(usr);
      }));
    el.querySelectorAll('.user-del-btn').forEach(btn =>
      btn.addEventListener('click', async () => {
        const usr = users.find(x => x.id === btn.dataset.uid);
        if (!await this.confirm(`Удалить пользователя «${usr?.name || usr?.login}»?`)) return;
        try {
          await this.db.deleteUser(btn.dataset.uid);
          this.toast('Пользователь удалён ✓');
          this.renderRolesView();
        } catch (e) { this.toast(e.message || 'Ошибка'); }
      }));

    /* Опасные зоны */
    document.getElementById('dangerSetBtn')?.addEventListener('click', () => this._openDangerSetModal());
    document.getElementById('dangerClearBtn')?.addEventListener('click', async () => {
      if (!await this.confirm('Снять пароль опасных зон? Критичные действия перестанут требовать подтверждение.')) return;
      await this.db.clearDangerPassword();
      this.toast('Пароль снят ✓');
      this.renderRolesView();
    });
  }

  _openDangerSetModal() {
    document.getElementById('dangerSetPass').value  = '';
    document.getElementById('dangerSetPass2').value = '';
    if (!this._dangerSetBound) {
      this._dangerSetBound = true;
      document.getElementById('dangerSetClose').addEventListener('click', () => this.closeModal('dangerSetModal'));
      document.getElementById('dangerSetSave').addEventListener('click', async () => {
        const p1 = document.getElementById('dangerSetPass').value;
        const p2 = document.getElementById('dangerSetPass2').value;
        if (p1.length < 4) { this.toast('Пароль — минимум 4 символа'); return; }
        if (p1 !== p2)     { this.toast('Пароли не совпадают'); return; }
        try {
          await this.db.setDangerPassword(p1);
          this.closeModal('dangerSetModal');
          this.toast('Пароль опасных зон сохранён ✓');
          this.renderRolesView();
        } catch (e) { this.toast(e.message); }
      });
    }
    this.openModal('dangerSetModal');
    setTimeout(() => document.getElementById('dangerSetPass')?.focus(), 150);
  }

  /* Выполнить действие опасной зоны: если сервер требует пароль
     (code danger_password) — спросить и повторить. Возвращает результат fn
     или null, если пользователь отменил ввод. Остальные ошибки — наружу. */
  async _withDanger(actionLabel, fn) {
    let dp = '';
    while (true) {
      try { return (await fn(dp)) ?? true; }
      catch (e) {
        if (e.code === 'danger_password') {
          if (dp) this.toast('Неверный пароль');
          dp = await this.askDangerPassword(actionLabel);
          if (dp === null || dp === undefined) return null;
          continue;
        }
        throw e;
      }
    }
  }

  /* ── Опасные зоны: модалка ввода пароля-подтверждения ── */
  askDangerPassword(actionLabel) {
    return new Promise((resolve) => {
      const inp = document.getElementById('dangerAskInput');
      document.getElementById('dangerAskText').textContent = actionLabel;
      inp.value = '';
      const done = (val) => {
        this._dangerAskRes = null;
        this.closeModal('dangerAskModal');
        resolve(val);
      };
      this._dangerAskRes = done;
      if (!this._dangerAskBound) {
        this._dangerAskBound = true;
        document.getElementById('dangerAskClose').addEventListener('click', () => this._dangerAskRes?.(null));
        document.getElementById('dangerAskOk').addEventListener('click', () =>
          this._dangerAskRes?.(document.getElementById('dangerAskInput').value));
        inp.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') this._dangerAskRes?.(inp.value);
        });
      }
      this.openModal('dangerAskModal');
      setTimeout(() => inp.focus(), 150);
    });
  }

  /* ── Модалка роли ── */
  openRoleModal(role = null) {
    this._editingRoleId = role?.id || null;
    document.getElementById('roleModalTitle').textContent = role ? 'Роль' : 'Новая роль';
    document.getElementById('roleModalSave').textContent  = role ? 'Сохранить' : 'Создать';
    document.getElementById('roleName').value = role?.name || '';
    document.getElementById('roleNote').value = role?.note || '';
    this._renderAccessChips(role?.access || null, 'roleAccessChips');
    this._setRoleHideCosts(!!role?.hideCosts);
    this._bindRoleModal();
    this.openModal('roleModal');
    if (!role) setTimeout(() => document.getElementById('roleName')?.focus(), 150);
  }

  _setRoleHideCosts(on) {
    this._roleHideCosts = on;
    const track = document.getElementById('roleHideCostsToggle');
    if (!track) return;
    track.style.background = on ? 'var(--accent)' : 'var(--muted)';
    track.querySelector('.toggle-thumb').style.transform = `translateX(${on ? 18 : 0}px)`;
  }

  _bindRoleModal() {
    if (this._roleModalBound) return;
    this._roleModalBound = true;
    document.getElementById('roleModalClose').addEventListener('click', () => this.closeModal('roleModal'));
    document.getElementById('roleHideCostsRow').addEventListener('click', () => this._setRoleHideCosts(!this._roleHideCosts));
    document.getElementById('roleModalSave').addEventListener('click', async () => {
      const name = document.getElementById('roleName').value.trim();
      if (!name) { this.toast('Введите название роли'); return; }
      const access = [...document.querySelectorAll('#roleAccessChips .vis-chip.active')].map(c => c.dataset.acc);
      if (!access.length) { this.toast('Откройте хотя бы один раздел'); return; }
      const data = { name, access, hideCosts: !!this._roleHideCosts, note: document.getElementById('roleNote').value.trim() };
      try {
        if (this._editingRoleId) {
          await this.db.updateRole(this._editingRoleId, data);
          this.closeModal('roleModal');
          // Права поменялись — сразу предлагаем раскатать их на сотрудников
          // с этой ролью (иначе изменения живут только в пресете)
          const cnt = (this.users || []).filter(u => u.roleId === this._editingRoleId && u.role !== 'root').length;
          if (cnt && await this.confirm(
            `Роль обновлена. Применить новые права к ${cnt} сотр. с этой ролью?`, 'Применить', false)) {
            const d = await this.db.applyRole(this._editingRoleId);
            this.toast(`Права обновлены у ${d.applied} сотр. ✓`);
          } else {
            this.toast('Роль обновлена ✓');
          }
        } else {
          await this.db.addRole(data);
          this.toast(`Роль «${name}» создана ✓`);
          this.closeModal('roleModal');
        }
        this.renderRolesView();
      } catch (e) { this.toast(e.message); }
    });
  }

  openUserModal(usr = null) {
    this._editingUserId = usr?.id || null;
    document.getElementById('userModalTitle').textContent = usr ? 'Изменить пользователя' : 'Новый пользователь';
    document.getElementById('userModalSave').textContent  = usr ? 'Сохранить' : 'Добавить';
    document.getElementById('userName').value     = usr?.name     || '';
    document.getElementById('userLogin').value    = usr?.login    || '';
    // Пароли хранятся хэшами — показать нельзя, можно только задать новый
    document.getElementById('userPassword').value = '';
    document.getElementById('userPassword').placeholder = usr ? 'Новый пароль (пусто — не менять)' : 'Пароль';
    document.getElementById('userTgChat').value   = usr?.tgChatId || '';
    // Роль-пресет: выбор подставляет доступы и видимость цен
    const sel = document.getElementById('userRoleSelect');
    if (sel) {
      sel.innerHTML = `<option value="">— Своя настройка —</option>` +
        (this._roles || []).map(r => `<option value="${r.id}"${usr?.roleId === r.id ? ' selected' : ''}>${this.esc(r.name)}</option>`).join('');
      sel.onchange = () => {
        const r = (this._roles || []).find(x => x.id === sel.value);
        if (!r) return;
        this._renderAccessChips(r.access);
        this._setHideCostsToggle(!!r.hideCosts);
      };
    }
    this._renderAccessChips(usr?.access || null);
    this._setHideCostsToggle(!!usr?.hideCosts);
    this._renderNotifyChips(usr?.notify || []);
    this.openModal('userModal');
    setTimeout(() => document.getElementById('userName').focus(), 350);
  }

  _setHideCostsToggle(on) {
    this._userHideCosts = on;
    const track = document.getElementById('userHideCostsToggle');
    if (!track) return;
    track.style.background = on ? 'var(--accent)' : 'var(--muted)';
    track.querySelector('.toggle-thumb').style.transform = `translateX(${on ? 18 : 0}px)`;
  }

  _renderNotifyChips(selected) {
    const el = document.getElementById('userNotifyChips');
    if (!el) return;
    const CATS = {
      item_add:    'Новый товар',
      item_edit:   'Изменение товара',
      item_delete: 'Удаление товара',
      finance:     'Финансы',
      owners:      'Сотрудники',
      system:      'Система / бэкапы',
    };
    el.innerHTML = Object.entries(CATS).map(([c, label]) =>
      `<button type="button" class="vis-chip${selected.includes(c) ? ' active' : ''}" data-ncat="${c}">${label}</button>`
    ).join('');
    el.onclick = (e) => {
      const chip = e.target.closest('.vis-chip');
      if (chip) chip.classList.toggle('active');
    };
  }

  // Чипы «доступ к разделам»: null = все включены
  _renderAccessChips(access, containerId = 'userAccessChips') {
    const el = document.getElementById(containerId);
    if (!el) return;
    const LABELS = { inventory: 'Товары', stats: 'Статистика', finance: 'Счёт', project: 'Проект', site: 'Сайт', promos: 'Промокоды', tg: 'Telegram', faq: 'Терминал', terminal: 'Журнал (консоль)' };
    const on = s => !Array.isArray(access) || access.includes(s);
    el.innerHTML = Object.entries(LABELS).map(([s, label]) =>
      `<button type="button" class="vis-chip${on(s) ? ' active' : ''}" data-acc="${s}">${label}</button>`
    ).join('');
    el.onclick = (e) => {
      const chip = e.target.closest('.vis-chip');
      if (chip) chip.classList.toggle('active');
    };
  }

  _readAccessChips() {
    return [...document.querySelectorAll('#userAccessChips .vis-chip.active')].map(c => c.dataset.acc);
  }

  async saveUser() {
    const name     = document.getElementById('userName').value.trim();
    const login    = document.getElementById('userLogin').value.trim();
    const password = document.getElementById('userPassword').value;
    const access   = this._readAccessChips();
    const hideCosts = !!this._userHideCosts;
    const tgChatId  = document.getElementById('userTgChat').value.trim();
    const notify    = [...document.querySelectorAll('#userNotifyChips .vis-chip.active')].map(c => c.dataset.ncat);
    if (!login) { this.toast('Введите логин'); return; }
    if (!password && !this._editingUserId) { this.toast('Введите пароль'); return; }
    if (!access.length) { this.toast('Откройте хотя бы один раздел'); return; }
    if (notify.length && !tgChatId) { this.toast('Укажите Chat ID для уведомлений'); return; }
    const payload = { name, login, access, hideCosts, tgChatId, notify,
      roleId: document.getElementById('userRoleSelect')?.value || '' };
    if (password) payload.password = password;   // при редактировании пустое поле = пароль не меняется
    try {
      if (this._editingUserId) {
        await this.db.updateUser(this._editingUserId, payload);
        this.toast('Пользователь обновлён ✓');
      } else {
        await this.db.addUser(payload);
        this.toast('Пользователь добавлен ✓');
      }
      this._editingUserId = null;
      this.closeModal('userModal');
      await this.loadData();
      if (this.currentView === 'roles') this.renderRolesView();
    } catch (e) { this.toast(e.message || 'Ошибка'); }
  }

  /* ──────────────────────────────────────────
     VISIBILITY PICKER (root)
     ────────────────────────────────────────── */
  _renderVisChips(containerId, selected) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const users     = (this.users || []).filter(u => u.role !== 'root');
    const allActive = !Array.isArray(selected) || selected.length === 0;
    // «Только я»: visibility=['__none__'] — id никому не принадлежит,
    // поэтому сотрудники записи не видят, root видит всё как всегда
    const onlyMe = selected?.includes('__none__');
    el.innerHTML =
      `<button type="button" class="vis-chip${allActive ? ' active' : ''}" data-vis="all">Все</button>` +
      `<button type="button" class="vis-chip${onlyMe ? ' active' : ''}" data-vis="__none__">${uiIcon('lock', 11)} Только я</button>` +
      (users.length
        ? users.map(u => `<button type="button" class="vis-chip${selected?.includes(u.id) ? ' active' : ''}" data-vis="${u.id}">${this.esc(u.name || u.login)}</button>`).join('')
        : '');
    el.onclick = (e) => {
      const chip = e.target.closest('.vis-chip');
      if (!chip) return;
      const allChip  = el.querySelector('[data-vis="all"]');
      const noneChip = el.querySelector('[data-vis="__none__"]');
      if (chip === allChip || chip === noneChip) {
        // «Все» и «Только я» — взаимоисключающие одиночные режимы
        el.querySelectorAll('.vis-chip').forEach(c => c.classList.toggle('active', c === chip));
      } else {
        chip.classList.toggle('active');
        allChip.classList.remove('active');
        noneChip.classList.remove('active');
        const anyUser = [...el.querySelectorAll('.vis-chip')].some(c =>
          c.dataset.vis !== 'all' && c.dataset.vis !== '__none__' && c.classList.contains('active'));
        if (!anyUser) allChip.classList.add('active');
      }
    };
  }

  _readVis(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return [];
    if (el.querySelector('[data-vis="all"]')?.classList.contains('active')) return [];
    return [...el.querySelectorAll('.vis-chip.active')].map(c => c.dataset.vis).filter(v => v !== 'all');
  }

  // Метка «видно только…» — показывается только root'у
  _visBadge(rec) {
    if (this.currentUser?.role !== 'root') return '';
    const v = rec.visibility;
    if (!Array.isArray(v) || v.length === 0) return '';
    if (v.includes('__none__'))
      return `<span class="vis-badge" title="Видно только вам">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>`;
    const names = v.map(id => this.users.find(u => u.id === id)?.name).filter(Boolean).join(', ');
    return `<span class="vis-badge" title="Видно: ${this.esc(names)}">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      ${v.length}</span>`;
  }

  async _renderMenuCats() {
    const el = document.getElementById('menuCatList');
    if (!el) return;
    const cats = await this.db.getCategories();
    this.categories = cats;
    if (!cats.length) { el.innerHTML = ''; return; }
    const svgDel = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`;
    const svgAdd = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
    const svgEd  = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
    const tagIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`;
    const byOrder = (a, b) => (a.order || 0) - (b.order || 0);
    // c — категория, i/n — позиция среди соседей (для стрелок)
    const row = (c, isSub, i, n) => `
      <div class="settings-row cat-row-adm${isSub ? ' cat-sub' : ''}" style="cursor:default">
        <div class="settings-row-icon" style="background:rgba(251,191,36,.1)">${tagIcon}</div>
        <div class="settings-row-info"><div class="settings-row-title">${this.esc(c.name)}</div></div>
        <div class="cat-row-actions">
          <button class="cat-mini cat-up-btn"   data-id="${c.id}" data-dir="up"   title="Выше"${i === 0 ? ' disabled' : ''}>↑</button>
          <button class="cat-mini cat-down-btn" data-id="${c.id}" data-dir="down" title="Ниже"${i === n - 1 ? ' disabled' : ''}>↓</button>
          <button class="cat-mini cat-rename-btn" data-id="${c.id}" title="Переименовать">${svgEd}</button>
          ${isSub ? '' : `<button class="cat-mini cat-addsub-btn" data-parent-id="${c.id}" title="Добавить подкатегорию">${svgAdd}</button>`}
          <button class="cat-mini cat-del-btn" data-cat-id="${c.id}" title="Удалить">${svgDel}</button>
        </div>
      </div>`;
    const tops = cats.filter(c => !c.parentId).sort(byOrder);
    el.innerHTML = `<div class="settings-section">${
      tops.map((t, ti) => {
        const subs = cats.filter(c => c.parentId === t.id).sort(byOrder);
        return row(t, false, ti, tops.length) + subs.map((s, si) => row(s, true, si, subs.length)).join('');
      }).join('')
    }</div>`;
    el.querySelectorAll('.cat-del-btn').forEach(btn =>
      btn.addEventListener('click', async () => {
        const ok = await this.confirm('Удалить категорию? Подкатегории станут основными.');
        if (!ok) return;
        await this.db.deleteCategory(btn.dataset.catId);
        await this.loadData();
        this._renderMenuCats();
        this.renderCatFilterChips();
      })
    );
    el.querySelectorAll('.cat-addsub-btn').forEach(btn =>
      btn.addEventListener('click', () => this._openCatPrompt(btn.dataset.parentId)));
    el.querySelectorAll('.cat-rename-btn').forEach(btn =>
      btn.addEventListener('click', () => this._renameCat(btn.dataset.id)));
    el.querySelectorAll('.cat-up-btn, .cat-down-btn').forEach(btn =>
      btn.addEventListener('click', () => this._moveCat(btn.dataset.id, btn.dataset.dir)));
  }

  async _renameCat(id) {
    const c = this.categories.find(x => x.id === id);
    if (!c) return;
    const name = await this._prompt('Переименовать категорию', c.name, '');
    if (!name || name === c.name) return;
    await this.db.updateCategory(id, { name });
    await this.loadData();
    this._renderMenuCats();
    this.renderCatFilterChips();
    this.renderInventoryList();
    this.toast('Переименовано ✓');
  }

  async _moveCat(id, dir) {
    const c = this.categories.find(x => x.id === id);
    if (!c) return;
    const sibs = this.categories.filter(x => (x.parentId || null) === (c.parentId || null))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    const i = sibs.findIndex(x => x.id === id);
    const j = dir === 'up' ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= sibs.length) return;
    [sibs[i], sibs[j]] = [sibs[j], sibs[i]];
    await Promise.all(sibs.map((x, idx) => x.order === idx ? null : this.db.updateCategory(x.id, { order: idx })));
    await this.loadData();
    this._renderMenuCats();
    this.renderCatFilterChips();
  }

  async _openCatPrompt(parentId = null) {
    const name = await this._prompt(
      parentId ? 'Название подкатегории' : 'Название категории',
      '', parentId ? 'Футболки, Кофты…' : 'Одежда, Обувь, Аксессуары…');
    if (!name) return;
    await this.db.addCategory(parentId ? { name, parentId } : { name });
    await this.loadData();
    this._renderMenuCats();
    this.renderCatFilterChips();
    this.toast(parentId ? 'Подкатегория добавлена ✓' : 'Категория добавлена ✓');
  }

  /* ── Шаблонные бренды: список в меню, подсказки в форме товара ── */
  async _renderMenuBrands() {
    const el = document.getElementById('menuBrandList');
    if (!el) return;
    const brands = await this.db.getBrands();
    this.brands = brands;
    if (!brands.length) { el.innerHTML = ''; return; }
    const svgDel = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`;
    const svgEd  = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
    const brandIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="6"/><path d="M15.5 13 17 22l-5-3-5 3 1.5-9"/></svg>`;
    const sorted = [...brands].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    el.innerHTML = `<div class="settings-section">${sorted.map(b => `
      <div class="settings-row cat-row-adm" style="cursor:default">
        <div class="settings-row-icon" style="background:rgba(96,165,250,.12)">${brandIcon}</div>
        <div class="settings-row-info"><div class="settings-row-title">${this.esc(b.name)}</div></div>
        <div class="cat-row-actions">
          <button class="cat-mini brand-rename-btn" data-id="${b.id}" title="Переименовать">${svgEd}</button>
          <button class="cat-mini brand-del-btn" data-id="${b.id}" title="Удалить">${svgDel}</button>
        </div>
      </div>`).join('')}</div>`;
    el.querySelectorAll('.brand-del-btn').forEach(btn =>
      btn.addEventListener('click', async () => {
        const ok = await this.confirm('Удалить бренд из шаблонов? У товаров бренд останется.');
        if (!ok) return;
        await this.db.deleteBrand(btn.dataset.id);
        this._renderMenuBrands();
      }));
    el.querySelectorAll('.brand-rename-btn').forEach(btn =>
      btn.addEventListener('click', async () => {
        const b = (this.brands || []).find(x => x.id === btn.dataset.id);
        if (!b) return;
        const name = await this._prompt('Переименовать бренд', b.name, '');
        if (!name || name === b.name) return;
        await this.db.updateBrand(b.id, { name });   // сервер обновит и товары с этим брендом
        await this.loadData();
        this._renderMenuBrands();
        this.toast('Переименовано ✓');
      }));
  }

  async _openBrandPrompt() {
    const name = await this._prompt('Название бренда', '', 'Rick Owens, Chrome Hearts…');
    if (!name) return;
    await this.db.addBrand(name);
    this._renderMenuBrands();
    this.toast('Бренд добавлен ✓');
  }

  _prompt(title, defaultVal = '', placeholder = '') {
    return new Promise(resolve => {
      const val = window.prompt(title, defaultVal);
      resolve(val === null ? null : val.trim());
    });
  }

  async loadData() {
    const isRoot = this.currentUser?.role === 'root';
    [this.items, this.owners, this.categories, this.users, this.brands] = await Promise.all([
      this.db.getItems(),
      this.db.getOwners(),
      this.db.getCategories(),
      isRoot ? this.db.getUsers() : Promise.resolve([]),
      this.db.getBrands(),
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
      // «Личное» сотрудника содержит вкладки проекта — FAB работает так же
      if (this.currentView === 'project' || this.currentView === 'profile') {
        if (this._projectSubTab === 'quick')      this.openQuickModal();
        else if (this._projectSubTab === 'notes') this.openNoteModal();
        else this.openTaskModal();
      } else if (this.currentView === 'settings') this.openGuideModal();
      else this.openItemModal();
    });

    /* Hamburger menu */
    // Бургер-меню упразднено: его содержимое живёт на «Личном»
    document.getElementById('menuBtn')?.addEventListener('click', () => this.toggleMenu());
    document.getElementById('profileBtn')?.addEventListener('click', () => this.renderView('profile'));
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
        this.renderView(this.currentView);   // показать восстановленные данные сразу
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

    /* Вид списка товаров: карточки / таблица (веб) */
    this._invMode = localStorage.getItem('invViewMode') || 'cards';
    const seg = document.getElementById('invModeSeg');
    if (seg) {
      const applySeg = () => seg.querySelectorAll('button').forEach(b =>
        b.classList.toggle('on', b.dataset.mode === this._invMode));
      applySeg();
      seg.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-mode]');
        if (!b || b.dataset.mode === this._invMode) return;
        this._invMode = b.dataset.mode;
        localStorage.setItem('invViewMode', this._invMode);
        applySeg();
        this.renderInventoryList();
      });
    }

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

    /* Owner filter chips */
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

    /* Кнопка режима выделения — тумблер */
    document.getElementById('selectModeBtn').addEventListener('click', () => {
      this._selectMode ? this.exitSelectMode() : this.enterSelectMode();
    });
    document.getElementById('catFilterToggle').addEventListener('click', () => this.toggleCatFilter());

    /* Inventory list item click (delegated) */
    document.getElementById('inventoryList').addEventListener('click', (e) => {
      const card = e.target.closest('.item-card, .item-row');
      if (!card) return;
      if (card.closest('.items-list')?._justDragged) return;   // это был drag, не тап
      if (this._selectMode) this.toggleSelectItem(card.dataset.id);
      else this.openDetailModal(card.dataset.id);
    });

    /* Delivery */
    document.getElementById('bulkParcelBtn').addEventListener('click', async () => {
      if (!this._selectedIds.size) return;
      const input = await this._prompt('Номер посылки', '', 'Например: 1 (пусто — убрать)');
      if (input === null || input === undefined) return;
      const parcel = input.trim() || null;
      await this.applyBulk(
        { parcel },
        parcel ? `Добавлены в посылку #${parcel}` : 'Убраны из посылки',
        parcel ? `В посылке #${parcel} ✓` : 'Убрано из посылки ✓');
    });
    document.getElementById('bulkDeliveryBtn').addEventListener('click', () => this.openDeliveryModal());
    document.getElementById('bulkOwnerBtn').addEventListener('click', () => this.openBulkOwnerModal());
    document.getElementById('bulkStatusBtn').addEventListener('click', () => {
      if (!this._selectedIds.size) return;
      document.getElementById('bulkStatusDesc').textContent = this._bulkDesc();
      document.getElementById('bulkStatusList').innerHTML = STATUSES.map(s => `
        <div class="settings-row bulk-status-row" data-status="${s.id}">
          <div class="settings-row-icon" style="background:color-mix(in srgb, ${s.color} 22%, transparent)">${s.icon}</div>
          <div class="settings-row-info"><div class="settings-row-title">${s.label}</div></div>
        </div>`).join('');
      this.openModal('bulkStatusModal');
    });
    document.getElementById('bulkStatusClose').addEventListener('click', () => this.closeModal('bulkStatusModal'));
    document.getElementById('bulkStatusList').addEventListener('click', async (e) => {
      const row = e.target.closest('.bulk-status-row');
      if (!row) return;
      const s = STATUSES.find(x => x.id === row.dataset.status);
      this.closeModal('bulkStatusModal');
      await this.applyBulk({ orderStatus: s.id },
        `Статус «${s.label}» установлен`, `Статус: ${s.label} ✓`);
    });

    document.getElementById('bulkDeleteBtn').addEventListener('click', () => this.bulkDelete());
    document.getElementById('bulkLabelsBtn').addEventListener('click', () => this.bulkLabels());
    document.getElementById('scanQrBtn')?.addEventListener('click', () => this.scanQr());
    document.getElementById('qrScanClose')?.addEventListener('click', () => this._qrStop?.());

    // «Выбрать все» — все товары текущего списка (с учётом фильтров и поиска)
    document.getElementById('selectAllBtn').addEventListener('click', async () => {
      const ids = [...document.querySelectorAll('#inventoryList .item-card')]
        .map(c => c.dataset.id).filter(Boolean);
      const allSelected = ids.length && ids.every(id => this._selectedIds.has(id));
      if (allSelected) ids.forEach(id => this._selectedIds.delete(id));
      else ids.forEach(id => this._selectedIds.add(id));
      await this.renderInventoryList();   // список перерисовывается асинхронно
      this.updateDeliveryBar();
    });

    document.getElementById('bulkParamsBtn').addEventListener('click', () => {
      if (!this._selectedIds.size) return;
      document.getElementById('bulkParamsDesc').textContent = this._bulkDesc();
      ['bulkBrand', 'bulkCondition', 'bulkSex'].forEach(id => document.getElementById(id).value = '');
      // Подсказки брендов — те же, что в форме товара
      const brands = [...new Set([
        ...(this.brands || []).map(b => b.name),
        ...this.items.map(i => (i.brand || '').trim()),
      ].filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru'));
      const dl = document.getElementById('brandsList');
      if (dl) dl.innerHTML = brands.map(b => `<option value="${this.esc(b)}">`).join('');
      this.openModal('bulkParamsModal');
    });
    document.getElementById('bulkParamsClose').addEventListener('click', () => this.closeModal('bulkParamsModal'));
    document.getElementById('bulkParamsSave').addEventListener('click', () => this.applyBulkParams());
    document.getElementById('bulkFlagsBtn').addEventListener('click', () => {
      if (!this._selectedIds.size) return;
      document.getElementById('bulkFlagsDesc').textContent = this._bulkDesc();
      this.openModal('bulkFlagsModal');
    });
    document.getElementById('deliveryBarCancel').addEventListener('click', () => this.exitSelectMode());
    document.getElementById('deliveryModalClose').addEventListener('click', () => this.closeModal('deliveryModal'));
    document.getElementById('deliveryModalSave').addEventListener('click', () => this.applyDelivery());

    /* Bulk: владелец */
    document.getElementById('bulkOwnerModalClose').addEventListener('click', () => this.closeModal('bulkOwnerModal'));
    document.getElementById('bulkOwnerModalSave').addEventListener('click', () => this.applyBulkOwner());
    document.getElementById('bulkOwnerChips').addEventListener('click', (e) => {
      const chip = e.target.closest('.owner-chip');
      if (!chip) return;
      this._bulkOwnerId = chip.dataset.ownerId || null;
      document.querySelectorAll('#bulkOwnerChips .owner-chip').forEach(c =>
        c.classList.toggle('selected', c === chip));
    });

    /* Bulk: флаги */
    document.getElementById('bulkFlagsModalClose').addEventListener('click', () => this.closeModal('bulkFlagsModal'));
    document.querySelectorAll('.bulk-flag-btn').forEach(btn =>
      btn.addEventListener('click', async () => {
        const patch = JSON.parse(btn.dataset.patch);
        const label = btn.querySelector('.settings-row-title').textContent;
        this.closeModal('bulkFlagsModal');
        await this.applyBulk(patch, label, `${label} ✓`);
      })
    );

    /* Подборки на сайте */
    document.getElementById('collectionsModalClose').addEventListener('click', () => this.closeModal('collectionsModal'));
    document.getElementById('collectionAddBtn').addEventListener('click', () => this.openCollectionModal());
    document.getElementById('collectionModalClose').addEventListener('click', () => this.closeModal('collectionModal'));
    document.getElementById('collectionModalSave').addEventListener('click', () => this.saveCollectionForm());
    document.getElementById('collectionsList').addEventListener('click', async (e) => {
      const del = e.target.closest('.col-delete-btn');
      if (del) {
        const ok = await this.confirm('Удалить подборку? Товары останутся на сайте.');
        if (!ok) return;
        const c = (this._collections || []).find(x => x.id === del.dataset.id);
        await this.db.deleteCollection(del.dataset.id);
        this.db.logAction('site_col', `Подборка «${c?.title || '—'}» удалена с витрины`, { level: 'danger' });
        this.toast('Подборка удалена');
        this.renderCollectionsList();
        return;
      }
      const row = e.target.closest('[data-col-id]');
      if (row) {
        const col = (this._collections || []).find(c => c.id === row.dataset.colId);
        if (col) this.openCollectionModal(col);
      }
    });
    document.getElementById('colItemsPicker').addEventListener('click', (e) => {
      const row = e.target.closest('.col-pick-row');
      if (!row) return;
      const id = row.dataset.itemId;
      if (this._colPicked.has(id)) this._colPicked.delete(id);
      else this._colPicked.add(id);
      row.classList.toggle('picked', this._colPicked.has(id));
      this._updateColCount();
      this._renderColOrder();
    });
    document.getElementById('colOrderList').addEventListener('click', (e) => {
      const mv = e.target.closest('.col-ord-move');
      if (mv && !mv.disabled) this._moveColItem(mv.dataset.id, mv.dataset.dir);
    });
    // Логотип подборки: ужимаем до 600px в PNG — прозрачность сохраняется
    // (общий resizeImage отдаёт JPEG и залил бы фон белым)
    document.getElementById('colLogoBtn').addEventListener('click', () =>
      document.getElementById('colLogoInput').click());
    document.getElementById('colLogoClear').addEventListener('click', () => {
      this._colLogo = ''; this._renderColLogo();
    });
    document.getElementById('colLogoInput').addEventListener('change', (e) => {
      const f = e.target.files[0];
      e.target.value = '';
      if (!f) return;
      const r = new FileReader();
      r.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const k = Math.min(1, 600 / Math.max(img.width, img.height));
          const c = Object.assign(document.createElement('canvas'),
            { width: Math.round(img.width * k), height: Math.round(img.height * k) });
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          this._colLogo = c.toDataURL('image/png');
          this._renderColLogo();
        };
        img.onerror = () => this.toast('Не удалось прочитать файл');
        img.src = ev.target.result;
      };
      r.readAsDataURL(f);
    });

    /* Блоки на сайте */
    document.getElementById('blocksModalClose').addEventListener('click', () => this.closeModal('blocksModal'));
    document.getElementById('blockAddBtn').addEventListener('click', () => this.openBlockModal());
    document.getElementById('blockModalClose').addEventListener('click', () => this.closeModal('blockModal'));
    document.getElementById('blockModalSave').addEventListener('click', () => this.saveBlockForm());
    document.getElementById('blocksList').addEventListener('click', async (e) => {
      const del = e.target.closest('.block-delete-btn');
      if (del) {
        if (!await this.confirm('Удалить блок?')) return;
        const b = (this._blocks || []).find(x => x.id === del.dataset.id);
        await this.db.deleteBlock(del.dataset.id);
        this.db.logAction('site_block', `${b ? this._blockLabel(b) : 'Блок'} удалён с витрины`, { level: 'danger' });
        this.toast('Блок удалён');
        this.renderBlocksList();
        return;
      }
      const mv = e.target.closest('.block-move');
      if (mv) { this.moveBlock(mv.dataset.id, mv.dataset.dir); return; }
      const tg = e.target.closest('.block-toggle');
      if (tg) {
        const b = (this._blocks || []).find(x => x.id === tg.dataset.id);
        if (b) {
          await this.db.saveBlock({ id: b.id, enabled: !b.enabled });
          this.db.logAction('site_block', `${this._blockLabel(b)} ${!b.enabled ? 'показан' : 'скрыт'} на витрине`);
          this.renderBlocksList();
        }
        return;
      }
      const row = e.target.closest('[data-block-id]');
      if (row) {
        const b = (this._blocks || []).find(x => x.id === row.dataset.blockId);
        if (b) this.openBlockModal(b);
      }
    });
    document.getElementById('blockFormBody').addEventListener('click', (e) => this._onBlockFormClick(e));
    document.getElementById('blockFormBody').addEventListener('change', (e) => this._onBlockFormChange(e));

    /* Вкладка «Сайт» */
    document.getElementById('siteContent').addEventListener('click', (e) => this._onSiteClick(e));

    /* Item modal */
    document.getElementById('itemModalClose').addEventListener('click', () => this.closeModal('itemModal'));
    document.getElementById('itemModalSave').addEventListener('click', () => this.saveItem());

    /* Sizes */
    document.getElementById('sizesList').addEventListener('click', (e) => {
      const dec = e.target.closest('.size-dec');
      const inc = e.target.closest('.size-inc');
      const rm  = e.target.closest('.size-remove');
      const rdec = e.target.closest('.rsv-dec');
      const rinc = e.target.closest('.rsv-inc');
      // «В заказе» не может превышать остаток размера
      const clampRsv = (i) => { const s = this._sizes[i];
        s.reservedQty = Math.max(0, Math.min(s.reservedQty || 0, s.qty || 0)); };
      if (dec) { const i = +dec.dataset.idx; this._sizes[i].qty = Math.max(0, (this._sizes[i].qty||0) - 1); clampRsv(i); this.renderSizes(); }
      if (inc) { const i = +inc.dataset.idx; this._sizes[i].qty = (this._sizes[i].qty||0) + 1; this.renderSizes(); }
      if (rm)  { const i = +rm.dataset.idx;  this._sizes.splice(i, 1); this.renderSizes(); }
      if (rdec) { const i = +rdec.dataset.idx; this._sizes[i].reservedQty = (this._sizes[i].reservedQty || 0) - 1; clampRsv(i); this.renderSizes(); }
      if (rinc) { const i = +rinc.dataset.idx; this._sizes[i].reservedQty = (this._sizes[i].reservedQty || 0) + 1; clampRsv(i); this.renderSizes(); }
    });
    document.getElementById('sizesList').addEventListener('input', (e) => {
      const si = e.target.closest('.size-row-input');
      const qi = e.target.closest('.size-qty-input');
      if (si) { const i = +si.dataset.idx; this._sizes[i].size = si.value; }
      if (qi) { const i = +qi.dataset.idx; this._sizes[i].qty  = parseInt(qi.value) || 0;
        this._sizes[i].reservedQty = Math.max(0, Math.min(this._sizes[i].reservedQty || 0, this._sizes[i].qty || 0));
        this.updateTotal(); }
    });
    document.getElementById('sizesList').addEventListener('change', (e) => {
      const os = e.target.closest('.size-owner-select');
      if (os) { const i = +os.dataset.idx; this._sizes[i].ownerId = os.value || null; }
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

    /* Тумблер «На сайте» раскрывает описание для витрины */
    document.getElementById('fieldShowOnSite').addEventListener('change', (e) => {
      document.getElementById('siteDescGroup').style.display = e.target.checked ? '' : 'none';
    });

    /* Автоподбор по названию: категория, бренд и тип одежды —
       пока поле пустое и не заполнялось вручную */
    document.getElementById('fieldCategory').addEventListener('change', () => {
      this._catManual = true;   // событие change прилетает только от пользователя
      this._autoGarment();
    });
    let _agT;
    document.getElementById('fieldName').addEventListener('input', () => {
      clearTimeout(_agT);
      _agT = setTimeout(() => { this._autoCategory(); this._autoBrand(); this._autoGarment(); }, 400);
    });
    document.getElementById('fieldGarment').addEventListener('change', () => {
      this._garmentManual = true;   // выбрал руками — больше не трогаем
    });
    document.getElementById('fieldBrand').addEventListener('input', () => {
      this._brandManual = true;
    });

    /* Photo.
       Защита от iOS ghost-click: после тапа по чипам/селектам Safari может
       синтезировать click по координатам пальца — если туда попала фото-зона,
       открывалась галерея. Открываем пикер только если нажатие (pointerdown)
       началось внутри самой фото-зоны. */
    this._photoPickerArmed = false;
    document.addEventListener('pointerdown', (e) => {
      this._photoPickerArmed = !!e.target.closest('#photoPicker');
    }, true);
    document.getElementById('photoStrip').addEventListener('click', async (e) => {
      if (!this._photoPickerArmed) return;
      const rm = e.target.closest('.photo-thumb-remove');
      if (rm) {
        this._photos.splice(+rm.dataset.idx, 1);
        this._renderPhotoStrip();
        return;
      }
      const thumb = e.target.closest('.photo-thumb');
      if (thumb) {
        if (document.getElementById('photoStrip')._justDragged) return;   // это было перетаскивание
        const i = +thumb.dataset.idx;
        if (i > 0) {
          // Тап по фото делает его главным (обложкой)
          this._photos.unshift(this._photos.splice(i, 1)[0]);
          this._renderPhotoStrip();
          this.toast('Фото сделано главным ✓');
        }
        return;
      }
      if (e.target.closest('.photo-add-tile')) document.getElementById('photoInput').click();
    });
    document.getElementById('photoInput').addEventListener('change', async (e) => {
      const files = [...e.target.files].slice(0, 10 - this._photos.length);
      for (const file of files) {
        try { this._photos.push(await makePhotoVariants(file)); }
        catch (_) { this.toast('Ошибка загрузки фото'); }
      }
      this._renderPhotoStrip();
      e.target.value = '';
    });
    this._bindPhotoDrag();

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
      if (this._photos.length >= 10) { this.toast('Максимум 10 фото'); return; }
      try {
        this._photos.push(await makePhotoVariants(file));
        this._renderPhotoStrip();
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
    document.getElementById('debtModalClose').addEventListener('click', () => this.closeModal('debtModal'));
    document.getElementById('planModalSave').addEventListener('click', () => this.savePlan());
    document.getElementById('planTitle').addEventListener('keydown', e => { if (e.key === 'Enter') this.savePlan(); });

    /* Project modal */
    document.getElementById('taskModalClose').addEventListener('click', () => this.closeModal('taskModal'));
    document.getElementById('taskPersonalRow')?.addEventListener('click', () =>
      this._setTaskPersonal(!this._taskPersonal));
    document.getElementById('taskModalSave').addEventListener('click', () => this.saveTask());

    /* Task photo (null-safe — не роняем bindGlobal, если HTML устарел в кэше) */
    document.getElementById('taskPhotoPicker')?.addEventListener('click', (e) => {
      if (e.target.closest('#taskPhotoRemove')) return;
      document.getElementById('taskPhotoInput')?.click();
    });
    document.getElementById('taskPhotoInput')?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try { this._setTaskPhoto(await resizeImage(file)); }
      catch (_) { this.toast('Ошибка загрузки фото'); }
      e.target.value = '';
    });
    document.getElementById('taskPhotoRemove')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this._setTaskPhoto(null);
    });
    document.getElementById('quickModalClose').addEventListener('click', () => this.closeModal('quickModal'));
    document.getElementById('quickModalSave').addEventListener('click', () => this.saveQuickItem());

    /* Note modal */
    document.getElementById('noteModalClose').addEventListener('click', () => this.closeModal('noteModal'));
    document.getElementById('noteModalSave').addEventListener('click', () => this.saveNoteItem());
    document.getElementById('noteColorPicker').addEventListener('click', (e) => {
      const dot = e.target.closest('.color-dot');
      if (!dot) return;
      this._noteColor = dot.dataset.color;
      document.querySelectorAll('#noteColorPicker .color-dot').forEach(d =>
        d.classList.toggle('selected', d.dataset.color === this._noteColor));
    });

    /* FAQ modal */
    document.getElementById('faqModalClose').addEventListener('click', () => this.closeModal('faqModal'));
    document.getElementById('faqModalSave').addEventListener('click', () => this.saveFaqItem());

    /* Guide modal (Markdown / HTML) */
    document.getElementById('guideModalClose').addEventListener('click', () => this.closeModal('guideModal'));
    document.getElementById('guideModalSave').addEventListener('click', () => this.saveGuide());
    document.querySelectorAll('#guideModal .guide-fmt').forEach(btn => {
      btn.addEventListener('click', () => {
        this._guideFormat = btn.dataset.fmt === 'html' ? 'html' : 'markdown';
        document.querySelectorAll('#guideModal .guide-fmt').forEach(b => b.classList.toggle('active', b === btn));
        document.getElementById('guideBody').placeholder = this._guideFormat === 'html'
          ? 'Вставьте HTML-страницу целиком…'
          : '# Заголовок\n\nТекст гайда в **Markdown**…';
        // если сейчас открыто превью — перерисовать под новый формат
        if (document.querySelector('#guideModal .guide-tab[data-gtab="preview"]').classList.contains('active')) {
          this._renderGuidePreview();
        }
      });
    });
    document.querySelectorAll('#guideModal .guide-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const preview = tab.dataset.gtab === 'preview';
        document.querySelectorAll('#guideModal .guide-tab').forEach(t => t.classList.toggle('active', t === tab));
        const ta = document.getElementById('guideBody');
        const pv = document.getElementById('guidePreview');
        if (preview) { this._renderGuidePreview(); pv.style.display = ''; ta.style.display = 'none'; }
        else { ta.style.display = ''; pv.style.display = 'none'; }
      });
    });

    document.getElementById('saleModalClose').addEventListener('click', () => this.closeModal('saleModal'));
    document.getElementById('saleModalSave').addEventListener('click', () => this.saveSale());

    /* Sale modal — live profit preview.
       Поля цены — text/inputmode=decimal: цифры вводятся только с клавиатуры,
       колесо/свайп мышью значение не меняют. Чистим всё, кроме цифр и точки. */
    ['saleSalePrice', 'saleBuyPrice', 'saleDeliveryCost'].forEach(id =>
      document.getElementById(id).addEventListener('input', (e) => {
        const clean = e.target.value.replace(',', '.').replace(/[^0-9.]/g, '');
        if (clean !== e.target.value) e.target.value = clean;
        this._updateSalePreview();
      })
    );

    /* Остальные числовые поля: запрещаем менять значение колесом мыши */
    document.addEventListener('wheel', (e) => {
      const t = e.target;
      if (t.tagName === 'INPUT' && t.type === 'number' && document.activeElement === t) e.preventDefault();
    }, { passive: false });

    /* Sale modal — item select → populate sizes + prefill prices */
    document.getElementById('saleItemSelect').addEventListener('change', () => this._onSaleItemChange());
    document.getElementById('faqAddLineBtn').addEventListener('click', () => this._addFaqLine());
    document.getElementById('faqLinesList').addEventListener('click', (e) => {
      const rm = e.target.closest('.faq-line-remove');
      if (rm) rm.closest('.faq-line-row').remove();
    });

    /* User modal (root) */
    document.getElementById('userModalClose')?.addEventListener('click', () => this.closeModal('userModal'));
    document.getElementById('userModalSave')?.addEventListener('click', () => this.saveUser());
    document.getElementById('userHideCostsRow')?.addEventListener('click', () =>
      this._setHideCostsToggle(!this._userHideCosts));

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
    if (!this.hasAccess(view)) return;   // раздел закрыт для этого пользователя
    this.currentView = view;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`view-${view}`)?.classList.add('active');
    document.querySelector(`.nav-btn[data-view="${view}"]`)?.classList.add('active');
    // «Ещё» подсвечена, когда активная вкладка спрятана внутри (мобильная пилюля)
    document.getElementById('navMoreBtn')?.classList.toggle('active',
      ['project', 'site', 'promos', 'tg', 'roles', 'settings'].includes(view));
    // Карточка профиля в сайдбаре подсвечена на «Личном»
    document.querySelector('.nav-profile')?.classList.toggle('active', view === 'profile');
    const isRoot = this.currentUser?.role === 'root';
    // На вкладке «Гайды» создавать может только root; «Личное» сотрудника
    // включает задачи проекта — FAB для создания задачи нужен и там
    const fabHidden = !['inventory','project','settings'].includes(view) && !(view === 'profile' && !isRoot)
      || (view === 'settings' && !isRoot);
    document.getElementById('fabBtn').classList.toggle('hidden', fabHidden);

    switch (view) {
      case 'overview':  this.renderOverview();      break;
      case 'inventory': this.renderInventoryView(); break;
      case 'stats':     this.renderStats();         break;
      case 'finance':   this.renderFinance();       break;
      case 'project':   this.renderProject();       break;
      case 'calendar':  this.renderCalendar();      break;
      case 'site':      this.renderSiteView();      break;
      case 'promos':    this.renderPromos();        break;
      case 'tg':        this.renderTgView();        break;
      case 'roles':     this.renderRolesView();     break;
      case 'profile':   this.renderProfile();       break;
      case 'terminal':  this.renderTerminal();      break;
      case 'settings':  this.renderGuides();         break;
    }
  }

  /* ──────────────────────────────────────────
     OVERVIEW — дашборд-сводка (Aniq-ui)
     ────────────────────────────────────────── */
  async renderOverview() {
    const el = document.getElementById('overviewContent');
    if (!el) return;
    el.innerHTML = `
      <div class="ov-skel">
        <div class="skel-block" style="height:150px"></div>
        <div class="skel-row">
          <div class="skel-block" style="height:92px"></div><div class="skel-block" style="height:92px"></div>
          <div class="skel-block" style="height:92px"></div><div class="skel-block" style="height:92px"></div>
        </div>
        <div class="skel-row"><div class="skel-block" style="height:280px"></div><div class="skel-block" style="height:280px"></div></div>
      </div>`;

    const hasFin   = this.hasAccess('finance');
    const hasStats = this.hasAccess('stats');
    const hasSite  = this.hasAccess('site');
    const hasTerm  = this.hasAccess('terminal');
    const [sales, payments, empPayments, orders, tasks, perks, logs, rates, visits] = await Promise.all([
      (hasStats || hasFin) ? this.db.getSales() : Promise.resolve([]),
      hasFin ? this.db.getPayments() : Promise.resolve([]),
      (hasFin && this.owners.length) ? this.db.getEmployeePayments() : Promise.resolve([]),
      hasSite ? this.db.getOrders() : Promise.resolve([]),
      this.db.getTasks(),
      this.db.getPerks(),
      hasTerm ? this.db.getLogs(12) : Promise.resolve([]),
      this.db.getRates(),
      hasStats ? this.db.getSiteVisits() : Promise.resolve(null),
    ]);
    if (this.currentView !== 'overview') return;   // пока грузили — ушли на другую вкладку

    const items    = this.items.filter(i => i.orderStatus !== 'done');
    const totalVal = items.reduce((s, i) => s + (i.total || 0), 0);
    const totalQty = items.reduce((s, i) => s + (i.quantity || 0), 0);
    const inStock  = items.filter(i => i.orderStatus === 'in_stock').reduce((s, i) => s + (i.quantity || 0), 0);
    const newWeek  = items.filter(i => new Date(i.createdAt || 0).getTime() > Date.now() - 7 * 864e5).length;

    // Баланс компании — та же формула, что на «Счёте»
    const payBalance  = payments.reduce((s, p) => p.type === 'deposit' ? s + (p.amount || 0) : s - (p.amount || 0), 0);
    const salesProfit = sales.reduce((s, x) => s + (x.netProfit || 0), 0);
    const paidDebt    = empPayments.reduce((s, p) => (p.isExpense && p.reimbursed) ? s + (p.amount || 0) : s, 0);
    const balance     = payBalance + salesProfit - paidDebt;

    // Продажи за 30 дней и дельта к предыдущим 30 — честный тренд
    const now   = Date.now();
    const tOf   = s => new Date(s.soldAt || 0).getTime();
    const cur30  = sales.filter(s => tOf(s) > now - 30 * 864e5).reduce((s, x) => s + (x.salePrice || 0), 0);
    const prev30 = sales.filter(s => { const t = tOf(s); return t <= now - 30 * 864e5 && t > now - 60 * 864e5; })
                        .reduce((s, x) => s + (x.salePrice || 0), 0);
    const salesDelta = prev30 ? Math.round((cur30 - prev30) / prev30 * 100) : null;

    const newOrders = orders.filter(o => o.status === 'new').length;
    const active    = tasks.filter(t => !t.done);

    /* ── Hero: приветствие + живые часы ── */
    const d    = new Date();
    const hour = d.getHours();
    const greet = hour < 6 ? 'Доброй ночи' : hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер';
    const name  = this.currentUser?.name || this.currentUser?.login || '';
    const p2    = n => String(n).padStart(2, '0');
    const WDAYS  = ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];
    const MONTHS = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];

    /* ── Стат-карточки (по доступам, максимум 4) ── */
    const ic = {
      box:   `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`,
      check: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
      card:  `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
      trend: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
      inbox: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>`,
    };
    const cards = [];
    cards.push({ icon: ic.box, label: 'Стоимость склада', val: fmtMoney(totalVal),
                 sub: `${items.length} позиций`, delta: newWeek ? `+${newWeek} за неделю` : '' });
    cards.push({ icon: ic.check, label: 'В наличии', val: `${inStock} шт`, sub: `из ${totalQty} всего` });
    // Баланс компании — только root: у сотрудников доступ к «Счёту» есть
    // ради их собственного заработка, деньги компании им не показываем
    if (hasFin && this.currentUser?.role === 'root')
      cards.push({ icon: ic.card, label: 'Баланс компании', val: fmtMoney(balance),
                   cls: balance >= 0 ? '' : 'neg' });
    if ((hasStats || hasFin) && sales.length)
      cards.push({ icon: ic.trend, label: 'Продажи · 30 дней', val: fmtMoney(cur30),
                   delta: salesDelta === null ? '' : `${salesDelta >= 0 ? '↗ +' : '↘ '}${salesDelta}%`,
                   deltaCls: salesDelta >= 0 ? 'pos' : 'neg' });
    if (hasSite) cards.push({ icon: ic.inbox, label: 'Заявки с сайта', val: String(newOrders),
                              sub: newOrders ? 'ждут обработки' : 'новых нет', nav: 'site' });
    const cardsHtml = cards.slice(0, 4).map(c => `
      <div class="ov-stat${c.nav ? ' clickable' : ''}"${c.nav ? ` data-nav="${c.nav}"` : ''}>
        <div class="ov-stat-top">${c.icon}<span>${c.label}</span></div>
        <div class="ov-stat-val ${c.cls || ''}">${c.val}</div>
        ${c.delta ? `<div class="ov-stat-delta ${c.deltaCls || 'pos'}">${c.delta}</div>`
                  : (c.sub ? `<div class="ov-stat-sub">${c.sub}</div>` : '')}
      </div>`).join('');

    /* ── Задачи (до 5 активных) ── */
    const isRoot = this.currentUser?.role === 'root';
    const nameOf = id => this.users.find(u => u.id === id)?.name || this.owners.find(o => o.id === id)?.name || '';
    const KINDC  = { urgent: '#f87171', duty: '#a1a1aa', goal: '#38bdf8' };
    const tasksHtml = active.length ? `<div class="ov-task-list">${active.slice(0, 4).map(t => `
        <div class="ov-task">
          <span class="ov-task-dot" style="background:${KINDC[t.kind || 'duty'] || KINDC.duty}"></span>
          <span class="ov-task-title">${this.esc(t.title || t.text || '')}</span>
          ${t.assigneeId ? `<span class="ov-task-who">${this.esc(nameOf(t.assigneeId))}</span>` : ''}
        </div>`).join('')}</div>`
      : `<div class="ov-empty">Все задачи закрыты 🎉</div>`;

    /* ── Insights: три кольца ── */
    const pctStock = totalQty ? Math.round(inStock / totalQty * 100) : 0;
    const pctSite  = items.length ? Math.round(items.filter(i => i.showOnSite).length / items.length * 100) : 0;
    const pctTasks = tasks.length ? Math.round(tasks.filter(t => t.done).length / tasks.length * 100) : 0;
    const ring = (r, pct, color) => {
      const C = 2 * Math.PI * r;
      return `<circle cx="70" cy="70" r="${r}" fill="none" stroke="var(--fill2)" stroke-width="8"/>
        <circle cx="70" cy="70" r="${r}" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round"
          stroke-dasharray="${(C * pct / 100).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 70 70)"/>`;
    };
    const legend = (color, label, val) => `
      <div class="ov-leg"><span class="ov-leg-dot" style="background:${color}"></span>
        <span class="ov-leg-label">${label}</span><span class="ov-leg-val">${val}%</span></div>`;

    /* ── Корпоративные ресурсы: плюшки команды ── */
    this._perks = perks;
    const PERK_IC = { ai: 'spark', vpn: 'shield', sub: 'star', key: 'key', link: 'link', other: 'gift' };
    const perkRows = perks.map(pk => `
      <div class="ov-perk" data-perk-id="${pk.id}">
        <span class="ov-perk-ic">${uiIcon(PERK_IC[pk.kind] || 'gift', 14)}</span>
        <div class="ov-perk-info">
          <b>${this.esc(pk.title)}</b>
          ${pk.note ? `<i>${this.esc(pk.note)}</i>` : ''}
        </div>
        ${pk.value ? `<button class="ov-perk-act perk-copy" data-id="${pk.id}" title="Скопировать доступ">${uiIcon('key', 12)}</button>` : ''}
        ${pk.url ? `<a class="ov-perk-act" href="${this.esc(pk.url)}" target="_blank" rel="noopener" title="Открыть">${uiIcon('link', 12)}</a>` : ''}
        ${isRoot ? `
          <button class="ov-perk-act perk-edit" data-id="${pk.id}" title="Изменить">${uiIcon('edit', 11)}</button>
          <button class="ov-perk-act perk-del" data-id="${pk.id}" title="Удалить">${uiIcon('trash', 11)}</button>` : ''}
      </div>`).join('');
    const perksHtml = `
      <div class="ov-card">
        <div class="ov-card-head"><span>Корпоративные ресурсы</span>
          ${isRoot ? `<button class="ov-add" id="ovAddPerk" title="Добавить ресурс">＋</button>` : ''}
        </div>
        ${perks.length
          ? `<div class="ov-perk-list">${perkRows}</div>`
          : `<div class="ov-empty">${isRoot ? 'Добавьте плюшки команды —<br>ChatGPT Plus, VPN, подписки…' : 'Плюшек пока нет'}</div>`}
      </div>`;

    this._calOff = 0;
    el.innerHTML = `
      <div class="ov-grid">
        <div class="ov-main">
          <div class="ov-hero">
            <div class="ov-hero-left">
              <div class="ov-greet">${greet}, ${this.esc(name)}!</div>
              <div class="ov-clock" id="ovClock">${p2(d.getHours())}:${p2(d.getMinutes())}</div>
            </div>
            ${(() => {
              // Курсы ЦБ в шапке: $, €, ¥ со стрелкой к вчерашнему
              if (!rates || (!rates.USD && !rates.EUR && !rates.CNY)) return '';
              const chip = (sym, r) => {
                if (!r) return '';
                const dir = r.value > r.prev ? '↗' : r.value < r.prev ? '↘' : '→';
                const cls = r.value > r.prev ? 'neg' : r.value < r.prev ? 'pos' : '';
                return `<div class="ov-rate" title="ЦБ РФ, вчера ${String(r.prev.toFixed(2)).replace('.', ',')}">
                  <span class="ov-rate-cur">${sym}</span>
                  <span class="ov-rate-val">${String(r.value.toFixed(2)).replace('.', ',')}</span>
                  <span class="ov-rate-dir ${cls}">${dir}</span></div>`;
              };
              return `<div class="ov-rates">${chip('$', rates.USD)}${chip('€', rates.EUR)}${chip('¥', rates.CNY)}</div>`;
            })()}
            <div class="ov-hero-right">
              <div class="ov-date-day">${WDAYS[d.getDay()]}</div>
              <div class="ov-date">${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}</div>
              ${active.length ? `<div class="ov-hero-tag">${active.length} акт. ${active.length === 1 ? 'задача' : active.length < 5 ? 'задачи' : 'задач'}</div>` : ''}
            </div>
          </div>
          <div class="ov-stats">${cardsHtml}</div>
          ${(() => {
            /* Виджеты — две независимые вертикальные стопки, чтобы карточки
               паковались плотно и не оставляли дыр при разной высоте:
               слева Задачи + Лента, справа Ресурсы + Посещаемость */
            const tasksCard = `
            <div class="ov-card">
              <div class="ov-card-head"><span>Задачи</span>
                <button class="ov-add" id="ovAddTask" title="Новая задача">＋</button>
              </div>
              ${tasksHtml}
              <button class="ov-link" id="ovAllTasks">Все задачи →</button>
            </div>`;
            const feedCard = hasTerm && logs.length ? `
            <div class="ov-card">
              <div class="ov-card-head"><span>Лента активности</span>
                <button class="ov-add" id="ovAllLogs" title="Весь журнал">→</button>
              </div>
              <div class="ov-feed">
                ${logs.slice(0, 5).map(lg => {
                  const m = LOG_META[lg.type] || { icon: '•', color: 'var(--fill2)' };
                  return `<div class="ov-feed-row">
                    <span class="ov-feed-ic" style="background:${m.color}">${m.icon}</span>
                    <div class="ov-feed-info">
                      <span class="ov-feed-desc">${this.esc(lg.desc || '')}</span>
                      <span class="ov-feed-meta">${this.fmtDate(lg.ts)}${lg.user ? ` · ${this.esc(lg.user)}` : ''}</span>
                    </div>
                  </div>`;
                }).join('')}
              </div>
            </div>` : '';
            const visitsCard = visits ? (() => {
              // 14 дней, даты локальные (МСК) — совпадают с ключами сервера
              const byDate = Object.fromEntries((visits.days || []).map(x => [x.date, x]));
              const key = dt => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
              const series = [...Array(14)].map((_, i) => {
                const dt = new Date(Date.now() - (13 - i) * 864e5);
                const v = byDate[key(dt)] || { hits: 0, uniq: 0 };
                return { label: `${dt.getDate()}.${String(dt.getMonth() + 1).padStart(2, '0')}`, hits: v.hits, uniq: v.uniq };
              });
              const max = Math.max(...series.map(s => s.hits), 1);
              const bars = series.map((s, i) => `<div class="ov-visit-bar${i === 13 ? ' today' : ''}"
                style="height:${Math.max(4, Math.round(s.hits / max * 100))}%"
                title="${s.label}: ${s.hits} просмотров · ${s.uniq} уник."></div>`).join('');
              return `
            <div class="ov-card">
              <div class="ov-card-head"><span>Посещаемость сайта</span>
                <span class="ov-visit-now" title="Сегодня: просмотры · уникальные">${visits.today.hits} · ${visits.today.uniq} уник.</span>
                <button class="ov-add" id="ovToStats" title="Статистика">→</button>
              </div>
              <div class="ov-visit-bars">${bars}</div>
            </div>`;
            })() : '';
            return `<div class="ov-widgets">
              <div class="ov-stack">${tasksCard}${feedCard}</div>
              <div class="ov-stack">${perksHtml}${visitsCard}</div>
            </div>`;
          })()}
        </div>
        <div class="ov-side">
          <div class="ov-card">
            <div class="ov-card-head"><span>Показатели</span></div>
            <div class="ov-donut-wrap">
              <svg width="140" height="140" viewBox="0 0 140 140">
                ${ring(58, pctStock, '#4ade80')}${ring(46, pctSite, '#38bdf8')}${ring(34, pctTasks, '#a1a1aa')}
              </svg>
              <div class="ov-donut-center">${pctStock}%</div>
            </div>
            ${legend('#4ade80', 'Товар в наличии', pctStock)}
            ${legend('#38bdf8', 'Выставлено на сайт', pctSite)}
            ${legend('#a1a1aa', 'Задачи закрыты', pctTasks)}
          </div>
          <div class="ov-card">
            <div class="ov-card-head"><span>Календарь</span>
              <span class="ov-cal-nav"><button id="ovCalPrev">‹</button><button id="ovCalNext">›</button></span>
            </div>
            <div id="ovCalWrap">${this._ovCalHtml()}</div>
          </div>
        </div>
      </div>`;

    /* Живые часы — обновляются, пока вкладка открыта */
    clearInterval(this._ovTimer);
    this._ovTimer = setInterval(() => {
      const c = document.getElementById('ovClock');
      if (!c) { clearInterval(this._ovTimer); return; }
      const n = new Date();
      c.textContent = `${p2(n.getHours())}:${p2(n.getMinutes())}`;
    }, 15000);

    /* Бинды */
    document.getElementById('ovAddTask')?.addEventListener('click', () => this.openTaskModal());
    document.getElementById('ovAddPerk')?.addEventListener('click', () => this.openPerkModal());
    el.querySelectorAll('.ov-perk').forEach(row => row.addEventListener('click', (e) => {
      if (e.target.closest('.ov-perk-act')) return;   // кнопки строки — сами по себе
      const pk = this._perks.find(x => x.id === row.dataset.perkId);
      if (pk) this.openPerkViewModal(pk);
    }));
    el.querySelectorAll('.perk-copy').forEach(b2 => b2.addEventListener('click', async () => {
      const pk = this._perks.find(x => x.id === b2.dataset.id);
      try { await navigator.clipboard.writeText(pk.value); this.toast('Доступ скопирован ✓'); }
      catch { this.toast('Не удалось скопировать'); }
    }));
    el.querySelectorAll('.perk-edit').forEach(b2 => b2.addEventListener('click', () =>
      this.openPerkModal(this._perks.find(x => x.id === b2.dataset.id))));
    el.querySelectorAll('.perk-del').forEach(b2 => b2.addEventListener('click', async () => {
      const pk = this._perks.find(x => x.id === b2.dataset.id);
      if (!await this.confirm(`Удалить ресурс «${pk.title}»?`)) return;
      await this.db.deletePerk(pk.id);
      this.toast('Ресурс удалён ✓');
      this.renderOverview();
    }));
    document.getElementById('ovAllTasks')?.addEventListener('click', () => this.renderView(isRoot ? 'project' : 'profile'));
    document.getElementById('ovAllLogs')?.addEventListener('click', () => this.renderView('settings'));
    document.getElementById('ovToStats')?.addEventListener('click', () => this.renderView('stats'));
    const reCal = () => { const w = document.getElementById('ovCalWrap'); if (w) w.innerHTML = this._ovCalHtml(); };
    document.getElementById('ovCalPrev')?.addEventListener('click', () => { this._calOff--; reCal(); });
    document.getElementById('ovCalNext')?.addEventListener('click', () => { this._calOff++; reCal(); });
    el.querySelectorAll('.ov-stat[data-nav]').forEach(c =>
      c.addEventListener('click', () => this.renderView(c.dataset.nav)));
  }

  /* ── Корпоративный ресурс: просмотр данных (все сотрудники) ── */
  openPerkViewModal(pk) {
    const KINDS = { ai: 'Нейросети / ИИ', vpn: 'VPN', sub: 'Подписка', key: 'Доступ / аккаунт', link: 'Ссылка / сервис', other: 'Другое' };
    const isRoot = this.currentUser?.role === 'root';
    document.getElementById('perkViewTitle').textContent = pk.title;
    const editBtn = document.getElementById('perkViewEdit');
    editBtn.style.visibility = isRoot ? '' : 'hidden';
    document.getElementById('perkViewBody').innerHTML = `
      <div class="form-card">
        <div class="form-group total-row">
          <span class="form-label" style="margin:0">Тип</span>
          <span style="font-size:13px;color:var(--text2)">${KINDS[pk.kind] || 'Другое'}</span>
        </div>
        ${pk.note ? `<div class="form-divider"></div>
        <div class="form-group">
          <label class="form-label">Описание</label>
          <div style="font-size:13.5px;line-height:1.5">${this.esc(pk.note)}</div>
        </div>` : ''}
      </div>
      ${pk.value ? `
      <div class="form-card">
        <div class="form-group">
          <label class="form-label">Доступ</label>
          <div class="perk-view-value">${this.esc(pk.value)}</div>
        </div>
        <div class="form-divider"></div>
        <div class="form-group">
          <button type="button" class="btn-line" id="perkViewCopy">Скопировать доступ</button>
        </div>
      </div>` : ''}
      ${pk.url ? `
      <div class="form-card">
        <div class="form-group">
          <a class="btn-line" style="display:inline-flex;align-items:center;gap:7px;text-decoration:none" href="${this.esc(pk.url)}" target="_blank" rel="noopener">
            ${uiIcon('link', 12)} Открыть ${this.esc(pk.url.replace(/^https?:\/\//, '').split('/')[0])}
          </a>
        </div>
      </div>` : ''}`;
    if (!this._perkViewBound) {
      this._perkViewBound = true;
      document.getElementById('perkViewClose').addEventListener('click', () => this.closeModal('perkViewModal'));
      editBtn.addEventListener('click', () => {
        this.closeModal('perkViewModal');
        const cur = this._perks.find(x => x.id === this._viewingPerkId);
        if (cur) this.openPerkModal(cur);
      });
    }
    this._viewingPerkId = pk.id;
    document.getElementById('perkViewBody').querySelector('#perkViewCopy')?.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(pk.value); this.toast('Доступ скопирован ✓'); }
      catch { this.toast('Не удалось скопировать'); }
    });
    this.openModal('perkViewModal');
  }

  /* ── Корпоративные ресурсы: модалка (root) ── */
  openPerkModal(perk = null) {
    this._editingPerkId = perk?.id || null;
    document.getElementById('perkModalTitle').textContent = perk ? 'Ресурс' : 'Новый ресурс';
    document.getElementById('perkModalSave').textContent  = perk ? 'Сохранить' : 'Добавить';
    document.getElementById('perkKind').value  = perk?.kind  || 'ai';
    document.getElementById('perkTitle').value = perk?.title || '';
    document.getElementById('perkNote').value  = perk?.note  || '';
    document.getElementById('perkValue').value = perk?.value || '';
    document.getElementById('perkUrl').value   = perk?.url   || '';
    document.getElementById('perkPaidUntil').value = perk?.paidUntil || '';
    if (!this._perkModalBound) {
      this._perkModalBound = true;
      document.getElementById('perkModalClose').addEventListener('click', () => this.closeModal('perkModal'));
      document.getElementById('perkModalSave').addEventListener('click', async () => {
        const data = {
          kind:  document.getElementById('perkKind').value,
          title: document.getElementById('perkTitle').value.trim(),
          note:  document.getElementById('perkNote').value.trim(),
          value: document.getElementById('perkValue').value.trim(),
          url:   document.getElementById('perkUrl').value.trim(),
          paidUntil: document.getElementById('perkPaidUntil').value || '',
        };
        if (!data.title) { this.toast('Введите название'); return; }
        try {
          if (this._editingPerkId) {
            await this.db.updatePerk(this._editingPerkId, data);
            this.toast('Ресурс обновлён ✓');
          } else {
            await this.db.addPerk(data);
            this.toast('Ресурс добавлен ✓');
          }
          this.closeModal('perkModal');
          this.renderOverview();
        } catch (e) { this.toast(e.message); }
      });
    }
    this.openModal('perkModal');
    if (!perk) setTimeout(() => document.getElementById('perkTitle')?.focus(), 150);
  }

  /* Календарь месяца: пн-вс, сегодня — белая точка */
  _ovCalHtml() {
    const MON = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
    const today = new Date();
    const view  = new Date(today.getFullYear(), today.getMonth() + (this._calOff || 0), 1);
    const y = view.getFullYear(), m = view.getMonth();
    const firstDow = (view.getDay() + 6) % 7;              // пн = 0
    const daysIn   = new Date(y, m + 1, 0).getDate();
    const isToday  = d => !this._calOff && d === today.getDate();
    let cells = '';
    for (let i = 0; i < firstDow; i++) cells += `<span class="ov-cal-day dim"></span>`;
    for (let d = 1; d <= daysIn; d++)
      cells += `<span class="ov-cal-day${isToday(d) ? ' today' : ''}">${d}</span>`;
    return `
      <div class="ov-cal-month">${MON[m]} ${y}</div>
      <div class="ov-cal-grid">
        ${['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(w => `<span class="ov-cal-wd">${w}</span>`).join('')}
        ${cells}
      </div>`;
  }

  /* ──────────────────────────────────────────
     КАЛЕНДАРЬ-НАПОМИНАЛКА (личный, root)
     Дела с датой живут в сетке месяца, дела-«когда-нибудь» — в колонке
     «Без даты». Повторы разворачиваются виртуально, отметка выполнения
     у повторяющихся хранится по дням (doneDates).
     ────────────────────────────────────────── */
  _dstr(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  _remOccursOn(r, day) {
    if (!r.date || day < r.date) return false;
    if (!r.repeat || r.repeat === 'none') return day === r.date;
    const [by, bm, bd] = r.date.split('-').map(Number);
    const [ty, tm, td] = day.split('-').map(Number);
    if (r.repeat === 'weekly')
      return (Date.UTC(ty, tm - 1, td) - Date.UTC(by, bm - 1, bd)) / 86400000 % 7 === 0;
    const last = new Date(Date.UTC(ty, tm, 0)).getUTCDate();   // 31-е в коротком месяце → последний день
    return td === Math.min(bd, last);
  }
  _remDone(r, day) {
    return (r.repeat && r.repeat !== 'none') ? (r.doneDates || []).includes(day) : !!r.done;
  }
  _remsOn(day) {
    return (this._reminders || []).filter(r => this._remOccursOn(r, day))
      .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
  }
  _perksOn(day) {
    return (this._calPerks || []).filter(pk => pk.paidUntil === day);
  }

  async renderCalendar() {
    const el = document.getElementById('calendarContent');
    if (!el) return;
    el.innerHTML = `<div class="ov-skel">
      <div class="skel-block" style="height:380px"></div>
      <div class="skel-row"><div class="skel-block" style="height:150px"></div><div class="skel-block" style="height:150px"></div></div>
    </div>`;
    const [reminders, perks] = await Promise.all([this.db.getReminders(), this.db.getPerks()]);
    if (this.currentView !== 'calendar') return;
    this._reminders = reminders;
    this._calPerks  = perks;
    const now = new Date();
    if (!this._calSel)   this._calSel   = this._dstr(now);
    if (!this._calMonth) this._calMonth = { y: now.getFullYear(), m: now.getMonth() };
    this._calPaint();
  }

  _calPaint() {
    const el = document.getElementById('calendarContent');
    if (!el) return;
    const MON   = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
    const MON_G = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
    const WDAY  = ['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'];
    const today = this._dstr(new Date());
    const { y, m } = this._calMonth;

    /* ── Сетка месяца: всегда 6 недель, чтобы блок не прыгал по высоте ── */
    const firstDow = (new Date(y, m, 1).getDay() + 6) % 7;      // пн = 0
    const start    = new Date(y, m, 1 - firstDow);
    let cells = '';
    for (let i = 0; i < 42; i++) {
      const dt   = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const day  = this._dstr(dt);
      const rems = this._remsOn(day);
      const undone  = rems.filter(r => !this._remDone(r, day));
      const perksOn = this._perksOn(day);
      const dots = [
        ...undone.slice(0, 3).map(() => `<i class="cal-dot${day < today ? ' over' : ''}"></i>`),
        ...(undone.length ? [] : rems.slice(0, 2).map(() => '<i class="cal-dot done"></i>')),
        ...perksOn.slice(0, 1).map(() => '<i class="cal-dot perk"></i>'),
      ].join('');
      const cls = [
        dt.getMonth() !== m ? 'other' : '',
        day === today ? 'today' : '',
        day === this._calSel ? 'sel' : '',
        // Обводка дня: есть незакрытые дела (или оплата подписки)
        (undone.length || perksOn.length) ? 'has' : '',
        (undone.length && day < today) ? 'has-over' : '',
      ].filter(Boolean).join(' ');
      cells += `<button type="button" class="cal-cell ${cls}" data-day="${day}">
        <span class="cal-num">${dt.getDate()}</span>
        <span class="cal-dots">${dots}</span>
      </button>`;
    }

    /* ── Сводка: сегодня и просроченное ── */
    const todayCnt = this._remsOn(today).filter(r => !this._remDone(r, today)).length;
    const overdue  = (this._reminders || []).filter(r =>
      r.date && r.date < today && (!r.repeat || r.repeat === 'none') && !r.done).length;

    /* ── Строка дела ── */
    const remRow = (r, day) => {
      const done = this._remDone(r, day);
      return `<div class="cal-item${done ? ' done' : ''}" data-rem="${r.id}" data-day="${day || ''}">
        <button type="button" class="cal-check" data-check="${r.id}" data-day="${day || ''}" aria-label="Выполнено">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </button>
        <div class="cal-item-info">
          <div class="cal-item-title">${r.time ? `<b>${this.esc(r.time)}</b> ` : ''}${this.esc(r.title)}</div>
          ${r.note ? `<div class="cal-item-note">${this.esc(r.note)}</div>` : ''}
        </div>
        ${r.repeat && r.repeat !== 'none'
          ? `<span class="cal-repeat" title="${r.repeat === 'weekly' ? 'Каждую неделю' : 'Каждый месяц'}">${uiIcon('repeat', 11)}</span>` : ''}
      </div>`;
    };

    /* ── Выбранный день ── */
    const sel     = this._calSel;
    const selDate = new Date(sel + 'T00:00:00');
    const selRems = this._remsOn(sel);
    const selPerks = this._perksOn(sel);
    const left    = selRems.filter(r => !this._remDone(r, sel)).length;
    const dayCard = `
      <div class="cal-card">
        <div class="cal-card-head">
          <div>
            <div class="cal-card-title">${selDate.getDate()} ${MON_G[selDate.getMonth()]}${sel === today ? ' · сегодня' : ''}</div>
            <div class="cal-card-sub">${WDAY[selDate.getDay()]}${selRems.length ? ` · ${left} из ${selRems.length}` : ''}</div>
          </div>
          <button class="ov-add" id="calAddDay" title="Дело на этот день">＋</button>
        </div>
        ${selRems.length || selPerks.length
          ? `<div class="cal-list">
               ${selRems.map(r => remRow(r, sel)).join('')}
               ${selPerks.map(pk => `
                 <div class="cal-item perk-row" data-perk="${pk.id}">
                   <span class="cal-perk-ic">${uiIcon('creditCard', 12)}</span>
                   <div class="cal-item-info">
                     <div class="cal-item-title">${this.esc(pk.title)}</div>
                     <div class="cal-item-note">оплачен до этого дня</div>
                   </div>
                 </div>`).join('')}
             </div>`
          : `<div class="cal-empty">На этот день дел нет</div>`}
      </div>`;

    /* ── Дела без даты ── */
    const free = (this._reminders || []).filter(r => !r.date && !r.done);
    const freeDone = (this._reminders || []).filter(r => !r.date && r.done);
    const freeCard = `
      <div class="cal-card">
        <div class="cal-card-head">
          <div>
            <div class="cal-card-title">Без даты</div>
            <div class="cal-card-sub">${free.length ? `${free.length} ${this._plural(free.length, 'дело', 'дела', 'дел')}` : 'пусто'}</div>
          </div>
          <button class="ov-add" id="calAddFree" title="Дело без даты">＋</button>
        </div>
        ${free.length || freeDone.length
          ? `<div class="cal-list">
               ${free.map(r => remRow(r, '')).join('')}
               ${freeDone.length ? `<div class="cal-done-sep">выполнено</div>${freeDone.slice(0, 5).map(r => remRow(r, '')).join('')}` : ''}
             </div>`
          : `<div class="cal-empty">Сюда попадают дела, у которых нет срока</div>`}
      </div>`;

    el.innerHTML = `
      <div class="cal-wrap">
        <div class="cal-main">
          <div class="cal-head">
            <div>
              <div class="cal-month">${MON[m]} <span>${y}</span></div>
              <div class="cal-summary">${todayCnt ? `${todayCnt} ${this._plural(todayCnt, 'дело', 'дела', 'дел')} сегодня` : 'на сегодня дел нет'}${overdue ? ` · <b class="cal-over">${overdue} просрочено</b>` : ''}</div>
            </div>
            <div class="cal-nav">
              <button type="button" class="cal-nav-btn" id="calPrev" aria-label="Прошлый месяц">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <button type="button" class="cal-today-btn" id="calToday">Сегодня</button>
              <button type="button" class="cal-nav-btn" id="calNext" aria-label="Следующий месяц">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </div>
          <div class="cal-grid">
            ${['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(w => `<span class="cal-wd">${w}</span>`).join('')}
            ${cells}
          </div>
        </div>
        <div class="cal-side">${dayCard}${freeCard}
          <div class="cal-card cal-sub" id="calSubCard">
            <div class="cal-card-head">
              <div>
                <div class="cal-card-title">Календарь на телефоне</div>
                <div class="cal-card-sub">Подписка для iPhone, Mac и Google — дела появятся в системном календаре и его виджете</div>
              </div>
              <button class="ov-add" id="calSubToggle" title="Показать ссылку">＋</button>
            </div>
            <div id="calSubBody" class="hidden"></div>
          </div>
        </div>
      </div>`;

    /* ── Бинды ── */
    document.getElementById('calPrev')?.addEventListener('click', () => {
      this._calMonth = { y: m === 0 ? y - 1 : y, m: (m + 11) % 12 };
      this._calPaint();
    });
    document.getElementById('calNext')?.addEventListener('click', () => {
      this._calMonth = { y: m === 11 ? y + 1 : y, m: (m + 1) % 12 };
      this._calPaint();
    });
    document.getElementById('calToday')?.addEventListener('click', () => {
      const n = new Date();
      this._calMonth = { y: n.getFullYear(), m: n.getMonth() };
      this._calSel = this._dstr(n);
      this._calPaint();
    });
    el.querySelectorAll('.cal-cell').forEach(c => c.addEventListener('click', () => {
      this._calSel = c.dataset.day;
      const [cy, cm] = c.dataset.day.split('-').map(Number);
      if (cm - 1 !== m) this._calMonth = { y: cy, m: cm - 1 };   // клик по «чужому» дню листает месяц
      this._calPaint();
    }));
    document.getElementById('calAddDay')?.addEventListener('click', () => this.openReminderModal(null, this._calSel));
    document.getElementById('calAddFree')?.addEventListener('click', () => this.openReminderModal(null, null));
    el.querySelectorAll('.cal-check').forEach(b => b.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        await this.db.toggleReminder(b.dataset.check, b.dataset.day || null);
        this._reminders = await this.db.getReminders();
        this._calPaint();
      } catch (err) { this.toast(err.message || 'Ошибка'); }
    }));
    el.querySelectorAll('.cal-item[data-rem]').forEach(row => row.addEventListener('click', (e) => {
      if (e.target.closest('.cal-check')) return;
      const rem = (this._reminders || []).find(r => r.id === row.dataset.rem);
      if (rem) this.openReminderModal(rem);
    }));
    /* Подписка на календарь: ссылка + QR для телефона */
    document.getElementById('calSubToggle')?.addEventListener('click', async () => {
      const body = document.getElementById('calSubBody');
      if (!body.classList.contains('hidden')) { body.classList.add('hidden'); return; }
      body.classList.remove('hidden');
      body.innerHTML = `<div class="cal-empty">Готовим ссылку…</div>`;
      try {
        const { url, webcal } = await this.db.getCalendarLink();
        this._calSubUrl = { url, webcal };
        body.innerHTML = `
          <div class="cal-sub-steps">
            1. Отсканируйте QR камерой iPhone (или откройте ссылку на телефоне)<br>
            2. iOS предложит подписаться на календарь — согласитесь<br>
            3. На экране «Домой» добавьте виджет «Календарь» любого размера
          </div>
          <img class="cal-sub-qr" src="/qr.svg?d=${encodeURIComponent(webcal)}" alt="QR подписки">
          <div class="cal-sub-url">${this.esc(url)}</div>
          <div class="cal-sub-acts">
            <button class="chip" id="calSubCopy">Скопировать ссылку</button>
            <button class="chip" id="calSubReset">Перевыпустить</button>
          </div>`;
        document.getElementById('calSubCopy').addEventListener('click', async () => {
          try { await navigator.clipboard.writeText(this._calSubUrl.url); this.toast('Ссылка скопирована ✓'); }
          catch { this.toast(this._calSubUrl.url); }
        });
        document.getElementById('calSubReset').addEventListener('click', async () => {
          if (!await this.confirm('Перевыпустить ссылку? Старая перестанет работать — подписку на телефоне придётся добавить заново.', 'Перевыпустить', false)) return;
          try {
            await this.db.getCalendarLink(true);
            this.toast('Ссылка перевыпущена ✓');
            body.classList.add('hidden');
            document.getElementById('calSubToggle').click();
          } catch (e) { this.toast(e.message || 'Ошибка'); }
        });
      } catch (e) { body.innerHTML = `<div class="cal-empty">${this.esc(e.message || 'Ошибка')}</div>`; }
    });

    el.querySelectorAll('.cal-item[data-perk]').forEach(row => row.addEventListener('click', () => {
      const pk = (this._calPerks || []).find(x => x.id === row.dataset.perk);
      if (pk) this.openPerkModal(pk);
    }));
  }

  _plural(n, one, few, many) {
    const n10 = n % 10, n100 = n % 100;
    if (n10 === 1 && n100 !== 11) return one;
    if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return few;
    return many;
  }

  openReminderModal(rem = null, presetDate = null) {
    this._editingRemId = rem?.id || null;
    document.getElementById('reminderModalTitle').textContent = rem ? 'Дело' : 'Новое дело';
    document.getElementById('reminderModalSave').textContent  = rem ? 'Сохранить' : 'Добавить';
    document.getElementById('remTitle').value  = rem?.title || '';
    document.getElementById('remNote').value   = rem?.note  || '';
    const noDate = rem ? !rem.date : !presetDate;
    document.getElementById('remNoDate').checked = noDate;
    document.getElementById('remDate').value   = rem?.date || presetDate || this._dstr(new Date());
    document.getElementById('remTime').value   = rem?.time || '';
    document.getElementById('remRepeat').value = rem?.repeat || 'none';
    document.getElementById('remDateFields').classList.toggle('hidden', noDate);
    document.getElementById('remDeleteBtn').classList.toggle('hidden', !rem);

    if (!this._remModalBound) {
      this._remModalBound = true;
      document.getElementById('reminderModalClose').addEventListener('click', () => this.closeModal('reminderModal'));
      document.getElementById('remNoDate').addEventListener('change', (e) =>
        document.getElementById('remDateFields').classList.toggle('hidden', e.target.checked));
      document.getElementById('remDeleteBtn').addEventListener('click', async () => {
        if (!this._editingRemId) return;
        if (!await this.confirm('Удалить это дело?')) return;
        await this.db.deleteReminder(this._editingRemId);
        this.closeModal('reminderModal');
        this.toast('Дело удалено');
        this.renderCalendar();
      });
      document.getElementById('reminderModalSave').addEventListener('click', async () => {
        const noDateNow = document.getElementById('remNoDate').checked;
        const data = {
          title:  document.getElementById('remTitle').value.trim(),
          note:   document.getElementById('remNote').value.trim(),
          date:   noDateNow ? null : document.getElementById('remDate').value,
          time:   noDateNow ? null : document.getElementById('remTime').value,
          repeat: noDateNow ? 'none' : document.getElementById('remRepeat').value,
        };
        if (!data.title) { this.toast('Введите название'); return; }
        if (!noDateNow && !data.date) { this.toast('Выберите дату'); return; }
        try {
          if (this._editingRemId) {
            await this.db.updateReminder(this._editingRemId, data);
            this.toast('Сохранено ✓');
          } else {
            await this.db.addReminder(data);
            this.toast('Дело добавлено ✓');
          }
          if (data.date) {
            const [ny, nm] = data.date.split('-').map(Number);
            this._calMonth = { y: ny, m: nm - 1 };
            this._calSel   = data.date;
          }
          this.closeModal('reminderModal');
          this.renderCalendar();
        } catch (e) { this.toast(e.message || 'Ошибка сохранения'); }
      });
    }
    this.openModal('reminderModal');
    setTimeout(() => document.getElementById('remTitle').focus(), 350);
  }

  /* Вывод со счёта компании: списание с бюджета + пополнение сотруднику
     одной операцией — обе записи связаны по описанию */
  openWithdrawModal() {
    const sel = document.getElementById('withdrawOwner');
    sel.innerHTML = `<option value="">— Выберите сотрудника —</option>` +
      (this.owners || []).map(o => `<option value="${o.id}">${this.esc(o.name)}</option>`).join('');
    document.getElementById('withdrawAmount').value = '';
    document.getElementById('withdrawNote').value   = '';
    if (!this._withdrawBound) {
      this._withdrawBound = true;
      document.getElementById('withdrawModalClose').addEventListener('click', () => this.closeModal('withdrawModal'));
      document.getElementById('withdrawModalSave').addEventListener('click', () => this._saveWithdraw());
    }
    this.openModal('withdrawModal');
    setTimeout(() => sel.focus(), 350);
  }

  async _saveWithdraw() {
    const ownerId = document.getElementById('withdrawOwner').value;
    const amount  = parseFloat(document.getElementById('withdrawAmount').value) || 0;
    const note    = document.getElementById('withdrawNote').value.trim();
    if (!ownerId)    { this.toast('Выберите сотрудника'); return; }
    if (amount <= 0) { this.toast('Укажите сумму'); return; }
    const owner = this.owners.find(o => o.id === ownerId);
    if (!await this.confirm(`Вывести ${fmtMoney(amount)} со счёта компании — ${owner?.name}?`, 'Вывести', false)) return;
    // Защита от двойного клика
    if (this._savingWithdraw) return;
    this._savingWithdraw = true;
    try {
      await this.db.addPayment({ type: 'charge', amount, desc: `Вывод — ${owner?.name}${note ? ` · ${note}` : ''}` });
      await this.db.addEmployeePayment({ ownerId, type: 'credit', amount, desc: note || 'Вывод со счёта компании' });
      await this.db.logAction('finance', `Вывод ${fmtMoney(amount)} со счёта компании — ${owner?.name}`, { level: 'warn' });
      this.closeModal('withdrawModal');
      this.toast(`Выведено ${fmtMoney(amount)} — ${owner?.name} ✓`);
      this.renderFinance();
    } catch (e) {
      this.toast(e.message || 'Ошибка — проверьте соединение');
    } finally { this._savingWithdraw = false; }
  }

  /* «Счёт» глазами сотрудника: карточка с заработком, история
     начислений/выплат и продажи его вещей (если он владелец-инвестор).
     Суммы начисляет root на вкладке «Счёт» → Сотрудники. */
  async _renderFinanceEmployee() {
    const el = document.getElementById('financeContent');
    const u  = this.currentUser || {};
    document.querySelector('#view-finance .view-title').textContent = 'Мой счёт';
    // Пользователь ↔ участник — по совпадению имени (как в задачах и Личном)
    const owner = (this.owners || []).find(o =>
      (o.name || '').toLowerCase() === (u.name || '').toLowerCase());

    const [payments, sales] = await Promise.all([
      owner ? this.db.getEmployeePayments(owner.id) : Promise.resolve([]),
      owner ? this.db.getSales() : Promise.resolve([]),
    ]);
    if (this.currentView !== 'finance') return;

    const credits  = payments.filter(p => !p.isExpense && p.type === 'credit').reduce((s, p) => s + (p.amount || 0), 0);
    const debits   = payments.filter(p => !p.isExpense && p.type === 'debit').reduce((s, p) => s + (p.amount || 0), 0);
    const expenses = payments.filter(p => p.isExpense && !p.reimbursed).reduce((s, p) => s + (p.amount || 0), 0);
    const balance  = credits - debits;
    const pos      = balance >= 0;

    const pct     = owner?.profitPercent || 0;
    const mySales = owner ? sales.filter(s => s.ownerId === owner.id) : [];
    const shareOf = s => ((s.buyPrice || 0) + (s.deliveryCost || 0)) * (s.qty || 1) + (s.netProfit || 0) * pct / 100;

    const cardNum = String(owner?.id || u.id || '00000000').slice(-8).toUpperCase().match(/.{1,4}/g).join('&nbsp;');
    // Обёртка со своим скроллом: на вебе view-body финансов — flex с overflow
    // hidden (раскладка root-версии), без неё блоки сжимаются в полоски
    el.innerHTML = `
      <div class="fin-emp-wrap">
      <div class="bank-card">
        <div class="bank-guilloche" aria-hidden="true"></div>
        <div class="bank-holo" aria-hidden="true"></div>
        <div class="bank-card-top">
          <span class="bank-card-brand">MASQUCERADE&nbsp;<b>·&nbsp;INC</b></span>
          <span class="bank-card-icons">
            <svg class="bank-chip" width="26" height="20" viewBox="0 0 26 20" fill="none" stroke="currentColor" stroke-width="1.3">
              <rect x="1" y="1" width="24" height="18" rx="4"/>
              <path d="M9 1v6a2 2 0 0 1-2 2H1M17 1v6a2 2 0 0 0 2 2h6M9 19v-6a2 2 0 0 0-2-2H1M17 19v-6a2 2 0 0 1 2-2h6"/>
            </svg>
            <svg class="bank-nfc" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
              <path d="M6 8.5a7 7 0 0 1 0 7M9.5 6a11 11 0 0 1 0 12M13 3.5a15 15 0 0 1 0 17"/>
            </svg>
          </span>
        </div>
        <div class="bank-card-mid">
          <span class="bank-card-label">Мой заработок</span>
          <div class="bank-card-amount">${pos ? '' : '−'}<span data-count="${Math.abs(balance)}" data-fmt="money">0 ₽</span></div>
        </div>
        <div class="bank-card-row">
          <span class="bank-card-num">${cardNum}</span>
          <span class="bank-card-holder">${this.esc((u.name || u.login || '').toUpperCase())}</span>
        </div>
      </div>
      ${(credits || debits || expenses) ? `
      <div class="bank-breakdown">
        ${credits ? `<div class="budget-row"><span>Всего начислено</span><span class="pos">+${fmtMoney(credits)}</span></div>` : ''}
        ${debits ? `<div class="budget-row"><span>Выплачено</span><span class="neg">−${fmtMoney(debits)}</span></div>` : ''}
        ${expenses ? `<div class="budget-row"><span>Компания должна за мои расходы</span><span class="pos">+${fmtMoney(expenses)}</span></div>` : ''}
      </div>` : ''}

      <div class="section-title" style="margin-top:18px">История операций</div>
      ${payments.length ? `<div class="pay-list">${payments.map(p => {
          const isCredit = p.type === 'credit';
          const cls  = p.isExpense ? 'expense' : (isCredit ? 'deposit' : 'charge');
          const icon = p.isExpense ? uiIcon('receipt', 12) : (isCredit ? '+' : '−');
          const defaultDesc = p.isExpense ? 'Расход из своих' : (isCredit ? 'Пополнение' : 'Списание');
          return `<div class="pay-entry">
            <div class="pay-icon ${cls}">${icon}</div>
            <div class="pay-info">
              <div class="pay-desc">${this.esc(p.desc || defaultDesc)}</div>
              <div class="pay-time">${this.fmtDate(p.ts)}</div>
            </div>
            ${p.isExpense
              ? `<div class="pay-amount-col"><div class="pay-amount expense">${fmtMoney(p.amount)}</div><div class="pay-return-label">${p.reimbursed ? 'возвращено ✓' : 'долг компании'}</div></div>`
              : `<div class="pay-amount ${cls}">${isCredit ? '+' : '−'}${fmtMoney(p.amount)}</div>`}
          </div>`;
        }).join('')}</div>`
        : `<div class="plan-empty">Операций пока нет — здесь появятся начисления и выплаты</div>`}

      ${owner ? `
      <div class="section-title" style="margin-top:18px">Продажи моих вещей${pct ? ` <em style="font-style:normal;font-size:11px;color:var(--text3)">· доля: закуп + ${pct}% прибыли</em>` : ''}</div>
      ${mySales.length ? `<div class="sales-list">${mySales.map(s => `
          <div class="sale-entry">
            <div class="sale-entry-info">
              <div class="sale-entry-name">${this.esc(s.itemName)}${s.size ? ` · ${this.esc(s.size)}` : ''}</div>
              <div class="sale-entry-meta">${this.fmtDate(s.soldAt)} · продано за ${fmtMoney(s.salePrice || 0)}</div>
            </div>
            <div class="sale-entry-right">
              <div class="sale-entry-profit pos">+${fmtMoney(s.shareAmount || Math.round(shareOf(s)))}</div>
              <div class="sale-entry-revenue">${s.shareAuto ? 'начислено ✓' : s.sharePaid ? 'рассчитано ✓' : 'моя доля'}</div>
            </div>
          </div>`).join('')}</div>`
        : `<div class="plan-empty">Ваши вещи ещё не продавались</div>`}` : ''}
      </div>
    `;
    runCountUps(el);
  }

  /* ──────────────────────────────────────────
     TELEGRAM — канал, публикация товаров, история постов
     ────────────────────────────────────────── */
  async renderTgView() {
    const el = document.getElementById('tgContent');
    if (!el) return;
    el.innerHTML = `<div class="ov-skel">
      <div class="skel-block" style="height:64px"></div>
      <div class="skel-block" style="height:64px"></div>
      <div class="skel-block" style="height:64px"></div>
    </div>`;
    const [status, logs] = await Promise.all([this.db.getTgChannelStatus(), this.db.getLogs(300)]);
    if (this.currentView !== 'tg') return;

    const posts = logs.filter(l => l.type === 'tg_post').slice(0, 12);
    this._tgItems = (this.items || [])
      .filter(i => i.showOnSite && i.orderStatus !== 'done' && (parseInt(i.quantity) || 0) > 0)
      .sort((a, b) => (a.tgPostedAt ? 1 : 0) - (b.tgPostedAt ? 1 : 0));   // непубликованные сверху

    const statusHtml = status.configured
      ? `<div class="settings-row" style="cursor:default">
           <div class="settings-row-icon" style="background:rgba(74,222,128,.12)">${uiIcon('megaphone', 14)}</div>
           <div class="settings-row-info">
             <div class="settings-row-title">Канал подключён<span class="promo-badge on" style="margin-left:8px">${this.esc(status.channel)}</span></div>
             <div class="settings-row-sub">Пост: альбом всех фото · название · размеры · цена · «Купить» → @${this.esc(status.buyUser)} · «Актуальное наличие» → сайт</div>
           </div>
         </div>`
      : `<div class="settings-row" style="cursor:default">
           <div class="settings-row-icon" style="background:rgba(251,146,60,.13)">${uiIcon('alert', 14)}</div>
           <div class="settings-row-info">
             <div class="settings-row-title">Канал не подключён<span class="promo-badge dead" style="margin-left:8px">Нет TG_CHANNEL</span></div>
             <div class="settings-row-sub">В Railway добавьте переменную TG_CHANNEL (@имя_канала или -100…id) и сделайте бота админом канала с правом публиковать</div>
           </div>
         </div>`;

    el.innerHTML = `
      <div class="site-sec-head">
        <div>
          <div class="site-sec-title">Канал</div>
          <div class="site-sec-hint">Публикация — опасная зона: при заданном пароле спросим подтверждение</div>
        </div>
      </div>
      <div class="settings-section">${statusHtml}</div>

      <div class="site-sec-head" style="margin-top:22px">
        <div>
          <div class="site-sec-title">Группа сотрудников</div>
          <div class="site-sec-hint">Уведомления о продажах — по галочке «Сообщить команде» при записи продажи</div>
        </div>
      </div>
      <div class="settings-section" id="tgTeamSection">
        <div class="settings-row" style="cursor:default">
          <div class="settings-row-icon" style="background:${status.teamChat ? 'rgba(74,222,128,.12)' : 'var(--fill2)'}">${uiIcon(status.teamChat ? 'checkCircle' : 'msg', 14)}</div>
          <div class="settings-row-info">
            <div class="settings-row-title">${status.teamChat
              ? `Группа подключена<span class="promo-badge on" style="margin-left:8px">${this.esc(status.teamChatTitle || status.teamChat)}</span>`
              : 'Группа не выбрана'}</div>
            <div class="settings-row-sub">${status.teamChat
              ? 'В группу уходят название, размер, цена и владелец — без закупа и прибыли'
              : 'Добавьте бота в группу, напишите там любое сообщение и нажмите «Найти группы»'}</div>
          </div>
          <div class="tg-team-acts">
            <button class="chip" id="tgTeamFind">Найти группы</button>
            ${status.teamChat ? `<button class="chip" id="tgTeamTest">Тест</button>
              <button class="chip" id="tgTeamOff">Отключить</button>` : ''}
          </div>
        </div>
        <div id="tgTeamList"></div>
      </div>

      <div class="site-sec-head" style="margin-top:22px">
        <div>
          <div class="site-sec-title">Опубликовать товар</div>
          <div class="site-sec-hint">Показаны товары с сайта в наличии; непубликованные — сверху</div>
        </div>
      </div>
      <div class="tg-pub-tools">
        <div class="search-wrap tg-pub-searchwrap">
          <svg class="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" id="tgPubSearch" class="search-input" placeholder="Найти товар: название, бренд, категория…" autocomplete="off">
          <button class="search-clear hidden" id="tgPubClear" type="button">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="chips-scroll" id="tgPubChips">
          <button class="chip active" data-tgf="all">Все</button>
          <button class="chip" data-tgf="new">Не публиковались</button>
          <button class="chip" data-tgf="posted">Уже были</button>
        </div>
        <div class="chips-scroll" id="tgBrandChips">
          <button class="chip active" data-tgb="all">Оба бренда</button>
          <button class="chip" data-tgb="monarc">Monarc</button>
          <button class="chip" data-tgb="type">Type</button>
        </div>
      </div>
      <div class="settings-section" id="tgPubList"></div>

      <div class="site-sec-head" style="margin-top:22px">
        <div>
          <div class="site-sec-title">История публикаций</div>
          <div class="site-sec-hint">Последние посты из журнала</div>
        </div>
      </div>
      ${posts.length
        ? `<div class="settings-section">${posts.map(pst => `
             <div class="settings-row" style="cursor:default">
               <div class="settings-row-icon" style="background:var(--fill2)">${uiIcon('megaphone', 13)}</div>
               <div class="settings-row-info">
                 <div class="settings-row-title">${this.esc(String(pst.desc || '').replace(/^Пост в канал: /, ''))}</div>
                 <div class="settings-row-sub">${this.fmtDate(pst.ts)}${pst.user ? ` · ${this.esc(pst.user)}` : ''}</div>
               </div>
             </div>`).join('')}</div>`
        : `<div class="faq-empty"><div style="opacity:.5">${uiIcon('megaphone', 30)}</div>
             <p>Пока ничего не публиковали.<br>Выберите товар выше — пост уйдёт в канал альбомом.</p></div>`}`;

    this._tgFilter = 'all';
    this._tgBrand  = 'all';
    this._renderTgPubList('');
    /* ── Группа сотрудников: поиск, выбор, тест, отключение ── */
    document.getElementById('tgTeamFind')?.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.textContent = 'Ищу…';
      try {
        const groups = await this.db.getTgGroups();
        const list = document.getElementById('tgTeamList');
        list.innerHTML = groups.length
          ? groups.map(g => `
            <div class="settings-row tg-group-pick" data-gid="${this.esc(g.id)}" data-gtitle="${this.esc(g.title)}">
              <div class="settings-row-icon" style="background:var(--fill2)">${uiIcon('msg', 13)}</div>
              <div class="settings-row-info">
                <div class="settings-row-title">${this.esc(g.title)}</div>
                <div class="settings-row-sub">id ${this.esc(g.id)} — нажмите, чтобы выбрать</div>
              </div>
            </div>`).join('')
          : `<div class="settings-row" style="cursor:default"><div class="settings-row-info">
               <div class="settings-row-sub">Групп не видно. Добавьте бота в группу и напишите там любое сообщение, затем повторите поиск.</div>
             </div></div>`;
        list.querySelectorAll('.tg-group-pick').forEach(row =>
          row.addEventListener('click', async () => {
            try {
              await this.db.setTgTeamChat(row.dataset.gid, row.dataset.gtitle);
              this.toast(`Группа «${row.dataset.gtitle}» подключена ✓`);
              this.renderTgView();
            } catch (err) { this.toast(err.message || 'Ошибка'); }
          })
        );
      } catch (err) { this.toast(err.message || 'Ошибка'); }
      finally { btn.textContent = 'Найти группы'; }
    });
    document.getElementById('tgTeamTest')?.addEventListener('click', async () => {
      try { await this.db.testTgTeamChat(); this.toast('Тестовое сообщение отправлено ✓'); }
      catch (err) { this.toast(err.message || 'Ошибка'); }
    });
    document.getElementById('tgTeamOff')?.addEventListener('click', async () => {
      if (!await this.confirm('Отключить уведомления о продажах в группу?', 'Отключить', false)) return;
      try {
        await this.db.setTgTeamChat('', '');
        this.toast('Группа отключена');
        this.renderTgView();
      } catch (err) { this.toast(err.message || 'Ошибка'); }
    });

    const sInp = document.getElementById('tgPubSearch');
    const sClr = document.getElementById('tgPubClear');
    sInp?.addEventListener('input', () => {
      sClr.classList.toggle('hidden', !sInp.value);
      this._renderTgPubList(sInp.value.trim().toLowerCase());
    });
    sClr?.addEventListener('click', () => {
      sInp.value = '';
      sClr.classList.add('hidden');
      this._renderTgPubList('');
      sInp.focus();
    });
    document.getElementById('tgPubChips')?.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      this._tgFilter = chip.dataset.tgf;
      document.querySelectorAll('#tgPubChips .chip').forEach(c => c.classList.toggle('active', c === chip));
      this._renderTgPubList((sInp?.value || '').trim().toLowerCase());
    });
    document.getElementById('tgBrandChips')?.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      this._tgBrand = chip.dataset.tgb;
      document.querySelectorAll('#tgBrandChips .chip').forEach(c => c.classList.toggle('active', c === chip));
      this._renderTgPubList((sInp?.value || '').trim().toLowerCase());
    });
    // Делегирование: кнопки «Опубликовать» в списке
    document.getElementById('tgPubList')?.addEventListener('click', async (e) => {
      const btn = e.target.closest('.tg-pub-btn');
      if (!btn) return;
      const item = this._tgItems.find(i => i.id === btn.dataset.id);
      if (item) await this._publishItemToChannel(item, btn);
    });
  }

  _renderTgPubList(query) {
    const el = document.getElementById('tgPubList');
    if (!el) return;
    const catName = id => (this.categories.find(c => c.id === id)?.name || '').toLowerCase();
    let items = this._tgItems.filter(i =>
      !query
      || (i.name || '').toLowerCase().includes(query)
      || (i.brand || '').toLowerCase().includes(query)
      || catName(i.categoryId).includes(query));
    if (this._tgFilter === 'new')    items = items.filter(i => !i.tgPostedAt);
    if (this._tgFilter === 'posted') items = items.filter(i => i.tgPostedAt);
    if (this._tgBrand === 'monarc')  items = items.filter(i => i.isMonarc);
    if (this._tgBrand === 'type')    items = items.filter(i => !i.isMonarc);
    if (!items.length) {
      el.innerHTML = `<div class="settings-row" style="cursor:default">
        <div class="settings-row-info"><div class="settings-row-sub">${query || this._tgFilter !== 'all' ? 'Ничего не найдено — поменяйте запрос или фильтр' : 'Нет товаров на сайте в наличии — включите «На сайте» в карточке товара'}</div></div>
      </div>`;
      return;
    }
    el.innerHTML = items.map(i => {
      const cover = i.thumbs?.[0] || i.photos?.[0] || i.photo;
      const nPhotos = (i.photos || []).length || (i.photo ? 1 : 0);
      return `<div class="settings-row" style="cursor:default" data-row-id="${i.id}">
        <div class="settings-row-icon tg-pub-thumb">${cover ? `<img src="${this.esc(cover)}" alt="" loading="lazy">` : uiIcon('image', 14)}</div>
        <div class="settings-row-info">
          <div class="settings-row-title">${this.esc(i.name)}${i.tgPostedAt ? `<span class="promo-badge off" style="margin-left:8px">пост ${this.fmtDate(i.tgPostedAt)}</span>` : `<span class="promo-badge on" style="margin-left:8px">не публиковался</span>`}</div>
          <div class="settings-row-sub">${i.price ? fmtMoney(i.price) : '—'}${i.brand ? ` · ${this.esc(i.brand)}` : ''} · фото: ${nPhotos}</div>
        </div>
        <div class="block-row-actions">
          <button class="btn-line tg-pub-btn" data-id="${i.id}" style="height:26px;padding:0 10px;font-size:11.5px;font-weight:600;white-space:nowrap">${i.tgPostedAt ? 'Ещё раз' : 'Опубликовать'}</button>
        </div>
      </div>`;
    }).join('');
  }

  /* Публикация с подтверждением и опасной зоной; обновляет строку списка */
  async _publishItemToChannel(item, btn) {
    const again = item.tgPostedAt ? ' ещё раз' : '';
    if (!await this.confirm(`Опубликовать «${item.name}» в Telegram-канал${again}?`, 'Опубликовать', false)) return;
    btn.disabled = true;
    try {
      const done = await this._withDanger('Публикация поста в Telegram-канал', dp => this.db.tgPostItem(item.id, dp));
      if (done !== null) {
        item.tgPostedAt = new Date().toISOString();
        this.toast('Пост опубликован в канал ✓');
        if (this.currentView === 'tg') this.renderTgView();
      }
    } catch (e) {
      this.toast(e.message);
    } finally { btn.disabled = false; }
  }

  /* ──────────────────────────────────────────
     СКИДКИ И ПРОМОКОДЫ
     ────────────────────────────────────────── */
  async renderPromos() {
    const el = document.getElementById('promosContent');
    if (!el) return;
    el.innerHTML = `<div class="ov-skel">
      <div class="skel-block" style="height:64px"></div>
      <div class="skel-block" style="height:64px"></div>
      <div class="skel-block" style="height:64px"></div>
    </div>`;
    const promos = await this.db.getPromos();
    if (this.currentView !== 'promos') return;
    this._promos = promos;

    const fmtD = d => new Date(d + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
    const state = p => {
      if (p.expiresAt && new Date(p.expiresAt + 'T23:59:59') < new Date()) return ['dead', 'Истёк'];
      if (p.maxUses && (p.uses || 0) >= p.maxUses) return ['dead', 'Лимит исчерпан'];
      return p.enabled ? ['on', 'Активен'] : ['off', 'Выключен'];
    };
    const activeN = promos.filter(p => state(p)[0] === 'on').length;
    const usesN   = promos.reduce((s, p) => s + (p.uses || 0), 0);

    const rows = promos.map(p => {
      const [cls, label] = state(p);
      const parts = [
        p.type === 'percent' ? `−${p.value}%` : `−${fmtMoney(p.value)}`,
        p.minTotal ? `от ${fmtMoney(p.minTotal)}` : '',
        p.expiresAt ? `до ${fmtD(p.expiresAt)}` : '',
        `исп.: ${p.uses || 0}${p.maxUses ? `/${p.maxUses}` : ''}`,
        p.note ? this.esc(p.note) : '',
      ].filter(Boolean).join(' · ');
      return `<div class="settings-row promo-row${cls === 'on' ? '' : ' off'}" data-promo-id="${p.id}">
        <div class="settings-row-icon" style="background:rgba(74,222,128,.12)">${uiIcon('tag', 14)}</div>
        <div class="settings-row-info">
          <div class="settings-row-title"><span class="promo-code">${this.esc(p.code)}</span><span class="promo-badge ${cls}">${label}</span></div>
          <div class="settings-row-sub">${parts}</div>
        </div>
        <div class="block-row-actions">
          <button class="block-toggle promo-toggle" data-id="${p.id}" title="${p.enabled ? 'Выключить' : 'Включить'}">${p.enabled ? uiIcon('eye', 13) : uiIcon('eyeOff', 13)}</button>
          <button class="block-toggle promo-edit" data-id="${p.id}" title="Изменить">${uiIcon('edit', 12)}</button>
          <button class="block-delete-btn promo-del" data-id="${p.id}" title="Удалить">${uiIcon('trash', 13)}</button>
        </div>
      </div>`;
    }).join('');

    el.innerHTML = `
      <div class="site-sec-head">
        <div>
          <div class="site-sec-title">Промокоды</div>
          <div class="site-sec-hint">${promos.length ? `Активных: ${activeN} · применений всего: ${usesN}` : 'Покупатель вводит код в корзине — скидка применится к сумме заявки'}</div>
        </div>
        <div class="site-sec-actions">
          <button class="site-mini-add" id="promoAddBtn">＋ Промокод</button>
        </div>
      </div>
      ${promos.length
        ? `<div class="settings-section">${rows}</div>`
        : `<div class="faq-empty">
             <div style="opacity:.5">${uiIcon('tag', 30)}</div>
             <p>Промокодов пока нет.<br>Создайте первый — например, −10% для подписчиков Telegram.</p>
           </div>`}`;

    document.getElementById('promoAddBtn')?.addEventListener('click', () => this.openPromoModal());
    el.querySelectorAll('.promo-toggle').forEach(b => b.addEventListener('click', async () => {
      const p = this._promos.find(x => x.id === b.dataset.id);
      await this.db.patchPromo(p.id, { enabled: !p.enabled });
      this.toast(p.enabled ? `Промокод ${p.code} выключен` : `Промокод ${p.code} включён ✓`);
      this.renderPromos();
    }));
    el.querySelectorAll('.promo-edit').forEach(b => b.addEventListener('click', () =>
      this.openPromoModal(this._promos.find(x => x.id === b.dataset.id))));
    el.querySelectorAll('.promo-del').forEach(b => b.addEventListener('click', async () => {
      const p = this._promos.find(x => x.id === b.dataset.id);
      if (!await this.confirm(`Удалить промокод ${p.code}?`)) return;
      await this.db.deletePromo(p.id);
      this.toast('Промокод удалён ✓');
      this.renderPromos();
    }));
  }

  openPromoModal(promo = null) {
    this._editingPromoId = promo?.id || null;
    this._promoType = promo?.type || 'percent';
    document.getElementById('promoModalTitle').textContent = promo ? 'Промокод' : 'Новый промокод';
    document.getElementById('promoModalSave').textContent  = promo ? 'Сохранить' : 'Создать';
    document.getElementById('promoCode').value     = promo?.code || '';
    document.getElementById('promoCode').disabled  = !!promo;   // код после создания не меняем — по нему уже могли делиться
    document.getElementById('promoValue').value    = promo?.value || '';
    document.getElementById('promoMinTotal').value = promo?.minTotal || '';
    document.getElementById('promoMaxUses').value  = promo?.maxUses || '';
    document.getElementById('promoExpires').value  = promo?.expiresAt || '';
    document.getElementById('promoNote').value     = promo?.note || '';
    this._syncPromoTypeSeg();
    this._bindPromoModal();
    this.openModal('promoModal');
    if (!promo) setTimeout(() => document.getElementById('promoCode')?.focus(), 150);
  }

  _syncPromoTypeSeg() {
    document.querySelectorAll('#promoTypeSeg button').forEach(b =>
      b.classList.toggle('on', b.dataset.type === this._promoType));
    document.getElementById('promoValueLabel').innerHTML =
      `Размер скидки (${this._promoType === 'percent' ? '%' : '₽'}) <span class="required">*</span>`;
  }

  _bindPromoModal() {
    if (this._promoModalBound) return;
    this._promoModalBound = true;
    document.getElementById('promoModalClose').addEventListener('click', () => this.closeModal('promoModal'));
    document.querySelectorAll('#promoTypeSeg button').forEach(b =>
      b.addEventListener('click', () => { this._promoType = b.dataset.type; this._syncPromoTypeSeg(); }));
    // Генератор: без похожих символов (0/O, 1/I), чтобы код легко диктовался
    document.getElementById('promoGenBtn').addEventListener('click', () => {
      const A = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
      document.getElementById('promoCode').value =
        Array.from({ length: 8 }, () => A[Math.floor(Math.random() * A.length)]).join('');
    });
    document.getElementById('promoCode').addEventListener('input', (e) => {
      e.target.value = e.target.value.toUpperCase().replace(/\s+/g, '');
    });
    document.getElementById('promoModalSave').addEventListener('click', async () => {
      const code  = document.getElementById('promoCode').value.trim();
      const value = parseInt(document.getElementById('promoValue').value) || 0;
      if (!this._editingPromoId && !code) { this.toast('Введите код'); return; }
      if (!value) { this.toast('Укажите размер скидки'); return; }
      if (this._promoType === 'percent' && value > 100) { this.toast('Процент не может быть больше 100'); return; }
      const data = {
        type: this._promoType, value,
        minTotal:  parseInt(document.getElementById('promoMinTotal').value) || 0,
        maxUses:   parseInt(document.getElementById('promoMaxUses').value)  || 0,
        expiresAt: document.getElementById('promoExpires').value || '',
        note:      document.getElementById('promoNote').value.trim(),
      };
      try {
        if (this._editingPromoId) {
          await this.db.patchPromo(this._editingPromoId, data);
          this.toast('Промокод обновлён ✓');
        } else {
          await this.db.addPromo({ ...data, code });
          this.toast(`Промокод ${code} создан ✓`);
        }
        this.closeModal('promoModal');
        this.renderPromos();
      } catch (err) { this.toast(err.message); }
    });
  }

  /* ──────────────────────────────────────────
     TERMINAL — журнал всех действий в проекте
     ────────────────────────────────────────── */
  async renderTerminal() {
    await this._renderTerminalInto(document.getElementById('terminalContent'));
  }

  async _renderTerminalInto(el) {
    if (!el) return;
    const logs = (await this.db.getLogs(300)).slice().reverse();   // старые сверху, как в терминале
    const me   = (this.currentUser?.name || this.currentUser?.login || 'user').toLowerCase();

    const fmtT = (ts) => {
      if (!ts) return '--.-- --:--';
      const d = new Date(ts);
      const p = n => String(n).padStart(2, '0');
      return `${p(d.getDate())}.${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`;
    };

    /* Уровень записи: danger — разрушительное (удаления, восстановление,
       очистка), warn — важное (финансы, витрина, пользователи).
       Клиент может задать уровень явно через meta.level. */
    const levelOf = (l) => {
      if (l.meta?.level) return l.meta.level;
      const t = l.type || '';
      if (/_delete$/.test(t) || t === 'restore' || t === 'clear') return 'danger';
      if (['payment', 'emp_payment', 'sale', 'plan'].includes(t) || t.startsWith('site_') || t.startsWith('user_')) return 'warn';
      return '';
    };
    const flag = (lvl) => lvl === 'danger' ? '<span class="term-flag danger">‼</span>'
                        : lvl === 'warn'   ? '<span class="term-flag warn">!</span>' : '';

    el.innerHTML = `
      <div class="term-window">
        <div class="term-bar">
          <i></i><i></i><i></i>
          <span>masqucerade — журнал действий · ${logs.length}</span>
        </div>
        <div class="term-body" id="termBody">
          <div class="term-line term-boot">MASQUCERADE INC. · PANEL LOG · ${new Date().getFullYear()}</div>
          <div class="term-line term-boot"><span class="term-flag warn">!</span> важное · <span class="term-flag danger">‼</span> опасное</div>
          ${logs.length ? logs.map(l => {
            const lvl = levelOf(l);
            return `
            <div class="term-line${lvl ? ' term-' + lvl : ''}">
              <span class="term-time">[${fmtT(l.ts)}]</span>
              <span class="term-user">${this.esc((l.user || 'system').toLowerCase())}$</span>
              ${flag(lvl)}
              <span class="term-text">${this.esc(l.desc || l.type || '')}</span>
            </div>`;
          }).join('')
          : '<div class="term-line term-boot">— журнал пуст —</div>'}
          <div class="term-line">
            <span class="term-user">${this.esc(me)}$</span>
            <i class="term-caret"></i>
          </div>
        </div>
      </div>`;

    // Как в настоящем терминале — курсор внизу, скроллим к последней записи
    const body = el.querySelector('#termBody');
    if (body) body.scrollTop = body.scrollHeight;
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
    this.renderCatFilterChips();
  }

  // id категории + все её подкатегории (для фильтра по поддереву)
  _catSubtreeIds(id) {
    const set = new Set(), stack = [id];
    while (stack.length) {
      const x = stack.pop(); if (set.has(x)) continue; set.add(x);
      this.categories.filter(c => c.parentId === x).forEach(c => stack.push(c.id));
    }
    return set;
  }

  renderCatFilterChips() {
    const el = document.getElementById('catFilterChips');
    const toggle = document.getElementById('catFilterToggle');
    const tops = this.categories.filter(c => !c.parentId).sort((a, b) => (a.order || 0) - (b.order || 0));
    const GARM = [{ id: 'top', name: 'Верх' }, { id: 'bottom', name: 'Низ' }, { id: 'shoes', name: 'Обувь' }, { id: 'outerwear', name: 'Верхняя одежда' }];
    const gShown = GARM.filter(g => this.items.some(i => i.garment === g.id));
    const hasAny = tops.length || gShown.length;
    // Кнопка-фильтр видна, если есть категории или типы одежды; подсвечена при активном фильтре
    if (toggle) {
      toggle.classList.toggle('hidden', !hasAny);
      toggle.classList.toggle('has-filter', !!this._filterCat || !!this._filterGarment);
      toggle.classList.toggle('active', this._catFilterOpen && !!hasAny);
    }
    // Сама строка чипов скрыта, пока не открыта кнопкой
    if (!hasAny || !this._catFilterOpen) { el.style.display = 'none'; return; }
    el.style.display = '';
    let html = `<button class="chip ${!this._filterCat && !this._filterGarment ? 'active' : ''}" data-clear>Все</button>`;
    if (gShown.length) html += gShown.map(g => `<button class="chip ${this._filterGarment === g.id ? 'active' : ''}" data-garment="${g.id}">${this.esc(g.name)}</button>`).join('');
    if (gShown.length && tops.length) html += `<span class="chip-sep"></span>`;
    if (tops.length) html += tops.map(c => `<button class="chip ${this._filterCat === c.id ? 'active' : ''}" data-cat="${c.id}">${this.esc(c.name)}</button>`).join('');
    el.innerHTML = html;
    el.querySelectorAll('button').forEach(btn =>
      btn.addEventListener('click', () => {
        if (btn.dataset.clear !== undefined) { this._filterCat = null; this._filterGarment = null; }
        else if (btn.dataset.garment !== undefined) this._filterGarment = this._filterGarment === btn.dataset.garment ? null : btn.dataset.garment;
        else this._filterCat = this._filterCat === btn.dataset.cat ? null : btn.dataset.cat;
        this.renderCatFilterChips();
        this.renderInventoryList();
      })
    );
  }

  toggleCatFilter() {
    this._catFilterOpen = !this._catFilterOpen;
    this.renderCatFilterChips();
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
    } else if (this._sortBy === 'status') {
      const rank = id => { const i = STATUSES.findIndex(s => s.id === id); return i < 0 ? 99 : i; };
      items.sort((a, b) => sd * (rank(a.orderStatus) - rank(b.orderStatus)));
    } else if (this._sortBy === 'date') {
      // «Добавлен»: ручной порядок (pos задаётся перетаскиванием карточек),
      // товары без pos — новые, идут сверху по дате добавления
      const t = i => new Date(i.createdAt || 0).getTime();
      items.sort((a, b) => {
        const ap = a.pos != null, bp = b.pos != null;
        const r = ap && bp ? a.pos - b.pos : ap !== bp ? (ap ? 1 : -1) : t(b) - t(a);
        return (this._sortDir === 'desc' ? 1 : -1) * r;
      });
    }

    // Monarc isolation
    if (this._filterMonarc) {
      items = items.filter(i => i.isMonarc);
    } else {
      items = items.filter(i => !i.isMonarc);
    }

    // Category filter — по выбранной категории и всем её подкатегориям
    if (this._filterCat) {
      const ids = this._catSubtreeIds(this._filterCat);
      items = items.filter(i => ids.has(i.categoryId));
    }
    // Тип одежды
    if (this._filterGarment) items = items.filter(i => i.garment === this._filterGarment);

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

    // Табличный вид — только веб-раскладка; на мобиле всегда карточки
    const asTable = this._invMode === 'table'
      && document.documentElement.classList.contains('is-web')
      && window.matchMedia('(min-width: 1000px)').matches;
    const tableHead = `<div class="item-row-head">
      <span class="row-check"></span><span class="row-thumb"></span>
      <span>Товар</span><span>Бренд</span><span>Владелец</span><span>Размеры</span>
      <span>Статус</span><span class="row-qty">Шт</span><span class="row-price">Цена</span><span class="row-total">Итого</span>
    </div>`;
    const listHtml = arr => asTable
      ? `<div class="items-table">${tableHead}${arr.map(i => this._itemRowHtml(i, ownerMap)).join('')}</div>`
      : `<div class="items-list">${arr.map((item, idx) => this._itemCardHtml(item, idx, ownerMap)).join('')}</div>`;

    let html = '';

    if (activeItems.length) {
      html += listHtml(activeItems);
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
            ${listHtml(archivedItems)}
          </div>
        </div>`;
    }

    list.innerHTML = html;
    this._bindCardDrag();

    document.getElementById('archiveToggle')?.addEventListener('click', () => {
      this._archiveOpen = !this._archiveOpen;
      document.getElementById('archiveListWrap')?.classList.toggle('hidden', !this._archiveOpen);
      document.querySelector('#archiveToggle .archive-chevron')?.classList.toggle('open', this._archiveOpen);
    });
  }

  /* ── Перетаскивание карточек в списке «Товары»: мышью сразу, на таче —
     long-press. Карточка «поднимается» из списка (fixed + скейл + тень),
     на её месте — слот-превью, соседи раздвигаются FLIP-анимацией,
     при отпускании карточка мягко приземляется в слот. Работает в
     сортировке «Добавлен» вне режима выделения; порядок хранится в pos. ── */
  _bindCardDrag() {
    // Только активный список (прямой ребёнок) — архив не тасуем
    const wrap = document.querySelector('#inventoryList > .items-list');
    if (!wrap || wrap._dragBound) return;
    wrap._dragBound = true;
    wrap._justDragged = false;
    // Нативный drag картинки (десктоп) перехватывает жест и обрывает наш
    wrap.addEventListener('dragstart', (e) => e.preventDefault());

    let el = null, ph = null, pid = null, startX = 0, startY = 0,
        grabDX = 0, grabDY = 0, dragging = false, landing = false, longT = null,
        flipLockUntil = 0;   // пока соседи разъезжаются, их rect'ы врут — не перецеливаемся
    const canDrag  = () => this._sortBy === 'date' && !this._selectMode;
    const cards    = () => [...wrap.querySelectorAll('.item-card')];
    const scroller = document.querySelector('#view-inventory .view-body') || document.scrollingElement;

    const startDrag = () => {
      if (!el || dragging) return;
      dragging = true;
      // Инлайном, не классом: возврат animation после снятия класса
      // перезапускал бы cellIn — карточки «мигали» после дропа
      for (const c of cards()) c.style.animation = 'none';
      const r = el.getBoundingClientRect();
      grabDX = startX - r.left; grabDY = startY - r.top;
      // Слот держит место и показывает, куда ляжет карточка
      ph = document.createElement('div');
      ph.className = 'item-card-ph';
      ph.style.height = (r.height - 4) + 'px';       // -4: вертикальные поля слота
      el.after(ph);
      // Карточка выходит из потока и следует за пальцем.
      // Координаты — относительно списка (absolute), не вьюпорта: см. CSS .drag
      const wr = wrap.getBoundingClientRect();
      el.style.width = r.width + 'px';
      el.style.left  = (r.left - wr.left) + 'px';
      el.style.top   = (r.top - wr.top) + 'px';
      el.classList.add('drag');                      // absolute + скейл + тень (анимируется)
      wrap.classList.add('dragging');
      try { el.setPointerCapture(pid); } catch (_) {}
      if (navigator.vibrate) navigator.vibrate(10);
    };

    // FLIP: соседи плавно съезжают на новые места после перестановки слота
    // (по обеим осям — в веб-версии на ПК список свёрстан сеткой)
    const flipMove = (mutate) => {
      const others = cards().filter(c => c !== el);
      const before = new Map(others.map(c => { const r = c.getBoundingClientRect(); return [c, { left: r.left, top: r.top }]; }));
      mutate();
      const moved = [];
      for (const c of others) {
        const b = before.get(c), r = c.getBoundingClientRect();
        const dx = b.left - r.left, dy = b.top - r.top;
        if (!dx && !dy) continue;
        c.style.transition = 'none';
        c.style.transform  = `translate(${dx}px, ${dy}px)`;
        moved.push(c);
      }
      // setTimeout, не rAF: rAF замирает в свёрнутой вкладке (Telegram сворачивают
      // посреди жеста) — transform остался бы навсегда и карточки бы «слиплись»
      if (moved.length) setTimeout(() => {
        for (const c of moved) {
          c.style.transition = 'transform .18s ease';
          c.style.transform  = '';
        }
        setTimeout(() => { for (const c of moved) c.style.transition = ''; }, 240);
      }, 20);
    };

    const cleanup = () => {
      if (el) {
        el.classList.remove('drag');
        el.style.cssText = '';
        el.style.animation = 'none';   // иначе cellIn перезапустится — карточка мигнёт
      }
      ph?.remove(); ph = null;
      wrap.classList.remove('dragging');
      // Страховка: если FLIP-таймеры не дожили (вкладку свернули посреди
      // жеста), снять зависшие transform у соседей
      for (const c of cards()) { c.style.transform = ''; c.style.transition = ''; }
      dragging = false; landing = false; el = null; pid = null;
    };

    const stop = (commit) => {
      clearTimeout(longT); longT = null;
      if (!dragging || !el || landing) { if (!landing) { el = null; pid = null; } return; }
      wrap._justDragged = true;                      // подавить click-«открыть карточку»
      setTimeout(() => { wrap._justDragged = false; }, 80);
      if (!commit || !ph) { cleanup(); return; }
      // Приземление: карточка доезжает до слота, потом встаёт в поток
      landing = true;
      const grabbed = el, slot = ph;
      const pr = slot.getBoundingClientRect();
      const wr = wrap.getBoundingClientRect();
      grabbed.style.transition = 'left .16s ease, top .16s ease, transform .16s ease, box-shadow .16s ease';
      grabbed.style.left = (pr.left - wr.left - 6) + 'px';   // компенсация полей слота
      grabbed.style.top  = (pr.top - wr.top - 2) + 'px';
      grabbed.style.transform = 'scale(1)';
      grabbed.style.boxShadow = '0 2px 10px rgba(0,0,0,.25)';
      setTimeout(() => {
        slot.replaceWith(grabbed);
        cleanup();
        // Порядок из DOM; pos хранится в порядке вида «сверху вниз» при ↓
        let ids = cards().map(c => c.dataset.id);
        if (this._sortDir === 'asc') ids = ids.reverse();
        const posById = new Map(ids.map((id, i) => [id, i]));
        this.items.forEach(i => { if (posById.has(i.id)) i.pos = posById.get(i.id); });
        this.db.reorderItems(ids).catch(() => this.toast('Не удалось сохранить порядок'));
        clearTimeout(this._itemReorderLogT);
        this._itemReorderLogT = setTimeout(() =>
          this.db.logAction('item_edit', 'Порядок товаров изменён'), 4000);
      }, 175);
    };

    wrap.addEventListener('pointerdown', (e) => {
      if (!canDrag() || landing || dragging || el) return;   // второй палец не влезает в жест
      const c = e.target.closest('.item-card');
      if (!c) return;
      el = c; pid = e.pointerId; startX = e.clientX; startY = e.clientY;
      if (e.pointerType === 'mouse') return;         // мышь: drag начнётся от движения
      longT = setTimeout(startDrag, 300);            // тач: удержание, чтобы не мешать скроллу
    });

    wrap.addEventListener('pointermove', (e) => {
      if (!el || landing || e.pointerId !== pid) return;
      if (!dragging) {
        const d = Math.hypot(e.clientX - startX, e.clientY - startY);
        if (e.pointerType === 'mouse' && d > 6) startDrag();
        else if (d > 10) { clearTimeout(longT); longT = null; el = null; return; }  // это скролл списка
        if (!dragging) return;
      }
      e.preventDefault();
      // У краёв экрана — подкручиваем список (координаты ниже считаем уже
      // после скролла, чтобы карточка осталась под пальцем)
      const sr = scroller.getBoundingClientRect ? scroller.getBoundingClientRect() : { top: 0, bottom: innerHeight };
      if (e.clientY < sr.top + 90) scroller.scrollTop -= 9;
      else if (e.clientY > sr.bottom - 90) scroller.scrollTop += 9;
      const wr = wrap.getBoundingClientRect();
      el.style.left = (e.clientX - grabDX - wr.left) + 'px';
      el.style.top  = (e.clientY - grabDY - wr.top) + 'px';
      // Целимся центром самой карточки, а не пальцем: пользователь судит по
      // тому, где карточка, — если схватить её за край, палец может ещё не
      // дойти до середины соседа, хотя карточка уже «на его месте».
      if (Date.now() < flipLockUntil) return;
      const er = el.getBoundingClientRect();
      const ex = er.left + er.width / 2, ey = er.top + er.height / 2;
      let target;
      if (getComputedStyle(wrap).display === 'grid') {
        // Веб-версия на ПК: сетка в несколько колонок. Ищем ближайшую к центру
        // карточку; до/после — в своём ряду по горизонтали, между рядами по вертикали
        let best = null, bestD = Infinity;
        for (const c of cards()) {
          if (c === el) continue;
          const r = c.getBoundingClientRect();
          const dx = Math.max(r.left - ex, ex - r.right, 0);
          const dy = Math.max(r.top - ey, ey - r.bottom, 0);
          // Вертикаль весит больше: в пустом углу ряда сосед по ряду и карточка
          // из соседнего ряда равноудалены — слот метался бы между ними
          const d = dx * dx + dy * dy * 4;
          if (d < bestD) { bestD = d; best = { c, r }; }
        }
        if (!best) return;
        const bcx = best.r.left + best.r.width / 2, bcy = best.r.top + best.r.height / 2;
        const sameRow = Math.abs(ey - bcy) < best.r.height / 2;
        const before  = sameRow ? ex < bcx : ey < bcy;
        target = before ? best.c : best.c.nextSibling;
      } else {
        // Телефон: один столбец — слот перед первым соседом, чья середина ниже
        target = null;                               // null = в самый конец
        for (const c of cards()) {
          if (c === el) continue;
          const r = c.getBoundingClientRect();
          if (ey < r.top + r.height / 2) { target = c; break; }
        }
      }
      if (target !== ph && ph.nextSibling !== target) {
        flipMove(() => wrap.insertBefore(ph, target));
        flipLockUntil = Date.now() + 190;
      }
    });
    wrap.addEventListener('pointerup',     (e) => { if (!el || e.pointerId === pid) stop(true); });
    wrap.addEventListener('pointercancel', (e) => { if (!el || e.pointerId === pid) stop(false); });
    /* Тач: нативный скролл шлёт pointercancel и обрывает drag — во время
       перетаскивания глушим touchmove (non-passive, иначе preventDefault нем) */
    wrap.addEventListener('touchmove', (e) => {
      if (dragging) e.preventDefault();
    }, { passive: false });
  }

  _itemCardHtml(item, idx, ownerMap) {
    const st    = statusById(item.orderStatus);
    const owner = ownerMap[item.ownerId];
    const cover = item.thumbs?.[0] || item.photos?.[0] || item.photo;
    const thumb = cover
      ? `<img src="${cover}" loading="lazy" alt="">`
      : `<div class="item-thumb-placeholder">
           <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
             <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
             <polyline points="21 15 16 10 5 21"/>
           </svg>
         </div>`;

    const sizesArr  = item.sizes?.length > 0 ? item.sizes : (item.size ? [{size: item.size, qty: item.quantity||0}] : []);
    const sizePills = sizesArr.filter(s => s.qty > 0 || s.size)
      .map(s => `<span class="size-pill${this.rsvQty(s) ? ' res' : ''}">${this.esc(s.size||'?')}${s.qty !== 1 ? ' ×'+s.qty : ''}${this.rsvLabel(s)}</span>`).join('');

    // Разделение по владельцам: собираем уникальных владельцев размеров
    const splitOwners = [...new Set(sizesArr.map(s => s.ownerId || item.ownerId).filter(Boolean))]
      .map(oid => this.owners.find(o => o.id === oid)).filter(Boolean);
    const isSplit = sizesArr.some(s => s.ownerId && s.ownerId !== item.ownerId) && splitOwners.length > 1;
    const ownerTag = isSplit
      ? `<span class="item-owner-tag item-owner-split" title="Разделён между: ${splitOwners.map(o => this.esc(o.name)).join(', ')}">
           <span class="owner-dot-stack">${splitOwners.slice(0, 3).map(o => `<span class="owner-dot" style="background:${o.color}"></span>`).join('')}</span>
           ${splitOwners.length} ${(n => (n % 10 === 1 && n % 100 !== 11) ? 'владелец' : ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) ? 'владельца' : 'владельцев')(splitOwners.length)}
         </span>`
      : (owner ? `<span class="item-owner-tag"><span class="owner-dot" style="background:${owner.color}"></span>${this.esc(owner.name)}</span>` : '');

    return `<div class="item-card${this._selectMode && this._selectedIds.has(item.id) ? ' selected' : ''}" data-id="${item.id}" style="animation-delay:${Math.min(idx*28,200)}ms">
      <div class="item-thumb">${thumb}</div>
      <div class="item-info">
        <div class="item-top">
          <div style="min-width:0">
            <div class="item-name">${this.esc(item.name)}</div>
            <div class="item-type-size">${this.esc(this.categories.find(c => c.id === item.categoryId)?.name || '')}</div>
          </div>
          <div class="item-top-badges">
            <span class="status-badge ${item.orderStatus}">${st.label}</span>${(() => { const r = (item.sizes || []).reduce((s, x) => s + this.rsvQty(x), 0); return r ? `<span class="status-badge processing" title="Штук в заказе (забронированы под клиентов)">В заказе ×${r}</span>` : ''; })()}${item.parcel && (item.orderStatus === 'ordered' || item.orderStatus === 'at_warehouse') ? `<span class="parcel-badge" title="Посылка">#${this.esc(String(item.parcel))}</span>` : ''}${item.showOnSite ? `<span class="site-tag" title="Виден на сайте">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg></span>` : ''}
          </div>
        </div>
        <div class="item-meta">
          ${ownerTag}
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

  /* Строка товара в табличном виде (веб) */
  _itemRowHtml(item, ownerMap) {
    const st    = statusById(item.orderStatus);
    const owner = ownerMap[item.ownerId];
    const cover = item.thumbs?.[0] || item.photos?.[0] || item.photo;
    const sizesArr = item.sizes?.length > 0 ? item.sizes : (item.size ? [{ size: item.size, qty: item.quantity || 0 }] : []);
    const sizes = sizesArr.filter(s => s.size || s.qty)
      .map(s => `${this.esc(s.size || '?')}${s.qty !== 1 ? '×' + s.qty : ''}${this.rsvQty(s) ? `(${this.rsvQty(s) < (s.qty || 0) ? this.rsvQty(s) + ' ' : ''}в заказе)` : ''}`).join(' · ');
    const siteTag = item.showOnSite
      ? `<svg class="row-site" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" title="На сайте"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`
      : '';
    return `<div class="item-row${this._selectMode && this._selectedIds.has(item.id) ? ' selected' : ''}" data-id="${item.id}">
      <span class="row-check"></span>
      <span class="row-thumb">${cover ? `<img src="${cover}" loading="lazy" alt="">` : ''}</span>
      <span class="row-name"><b>${this.esc(item.name)}${siteTag}</b><i>${this.esc(this.categories.find(c => c.id === item.categoryId)?.name || '')}</i></span>
      <span class="row-brand">${this.esc(item.brand || '—')}</span>
      <span class="row-owner">${owner ? `<span class="owner-dot" style="background:${owner.color}"></span>${this.esc(owner.name)}` : '—'}</span>
      <span class="row-sizes">${sizes || '—'}</span>
      <span><span class="status-badge ${item.orderStatus}">${st.label}</span>${(() => { const r = (item.sizes || []).reduce((s, x) => s + this.rsvQty(x), 0); return r ? ` <span class="status-badge processing" title="Штук в заказе">В заказе ×${r}</span>` : ''; })()}</span>
      <span class="row-qty">${item.quantity || 0}</span>
      <span class="row-price">${item.price ? fmtMoney(item.price) : '—'}</span>
      <span class="row-total">${item.total ? fmtMoney(item.total) : '—'}</span>
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
    // владелец у размера: свой (s.ownerId) или, если не задан, — владелец объявления
    const ownerOfSize = s => this.owners.find(o => o.id === (s.ownerId || item.ownerId)) || null;
    const mixedOwners = sizesArr.some(s => s.ownerId && s.ownerId !== item.ownerId);

    let sizesCard = '';
    if (sizesArr.length > 0 && mixedOwners) {
      // Разделение между владельцами — группируем размеры по владельцу
      const groups = new Map();
      sizesArr.forEach(s => {
        const o   = ownerOfSize(s);
        const key = o?.id || '__none__';
        if (!groups.has(key)) groups.set(key, { owner: o, sizes: [], qty: 0 });
        const g = groups.get(key);
        g.sizes.push(s);
        g.qty += (parseInt(s.qty) || 0);
      });
      sizesCard = `
        <div class="detail-card owner-split-card">
          <div class="owner-split-head">
            <span>Владельцы по размерам</span>
            <span class="owner-split-badge">${groups.size}</span>
          </div>
          ${[...groups.values()].map(g => `
            <div class="owner-split-group">
              <div class="owner-split-owner">
                <span class="owner-avatar" style="background:${g.owner?.color || 'var(--fill)'}">${g.owner ? this.esc(g.owner.name.trim()[0].toUpperCase()) : '?'}</span>
                <span class="owner-split-name">${g.owner ? this.esc(g.owner.name) : 'Без владельца'}</span>
                <span class="owner-split-qty">${g.qty} шт</span>
              </div>
              <div class="owner-split-sizes">
                ${g.sizes.map(s => `<span class="size-pill${this.rsvQty(s) ? ' res' : ''}">${this.esc(s.size || '—')}${(parseInt(s.qty) || 0) !== 1 ? ' ×' + (parseInt(s.qty) || 0) : ''}${this.rsvLabel(s)}</span>`).join('')}
              </div>
            </div>`).join('')}
        </div>`;
    } else if (sizesArr.length > 0) {
      sizesCard = `
        <div class="detail-card">
          ${sizesArr.map(s => `<div class="detail-row">
            <span class="detail-key">${this.esc(s.size || 'Без размера')}</span>
            <span class="detail-val">${s.qty} шт</span>
          </div>`).join('')}
        </div>`;
    }

    const margin    = (item.price && item.buyPrice) ? item.price - item.buyPrice : null;
    const marginStr = margin !== null
      ? `<span style="color:${margin >= 0 ? '#34d399' : '#f87171'}">${margin >= 0 ? '+' : ''}${fmtMoney(margin)}</span>`
      : '—';

    const hideCosts = !!this.currentUser?.hideCosts && this.currentUser?.role !== 'root';
    const priceRows = (hideCosts
      ? [
          ['Категория',    this.categories.find(c => c.id === item.categoryId)?.name || '—'],
          ['Цена',         item.price ? fmtMoney(item.price) : '—'],
          ['Итого',        fmtMoney(item.total), 'big'],
        ]
      : [
          ['Категория',    this.categories.find(c => c.id === item.categoryId)?.name || '—'],
          ['Цена закупа',  item.buyPrice     ? fmtMoney(item.buyPrice)     : '—'],
          ['Доставка',     item.deliveryCost ? fmtMoney(item.deliveryCost) : '—'],
          ['Цена продажи', item.price        ? fmtMoney(item.price)        : '—'],
          ...(item.oldPrice > item.price ? [['Скидка на сайте', `<s>${fmtMoney(item.oldPrice)}</s> · −${Math.round((1 - item.price / item.oldPrice) * 100)}%`]] : []),
          ['Маржа / шт',   marginStr],
          ['Итого',        fmtMoney(item.total), 'big'],
        ]
    ).map(([k,v,c]) =>
      `<div class="detail-row"><span class="detail-key">${k}</span><span class="detail-val ${c||''}">${v}</span></div>`
    ).join('');

    const metaRows = [
      ['Владелец', mixedOwners
        ? `<span class="owner-split-tag">разделён по размерам ↑</span>`
        : (owner
          ? `<span style="display:flex;align-items:center;gap:6px;justify-content:flex-end">
               <span style="width:8px;height:8px;border-radius:50%;background:${owner.color};display:inline-block;flex-shrink:0"></span>
               ${this.esc(owner.name)}</span>`
          : '—')],
      ['Создан', this.fmtDate(item.createdAt)],
      ...(item.showOnSite ? [
        ['Просмотры на сайте', `${item.views || 0}`],
        ['Заявки в Telegram', `${item.tgClicks || 0}`],
      ] : []),
    ].map(([k,v]) =>
      `<div class="detail-row"><span class="detail-key">${k}</span><span class="detail-val">${v}</span></div>`
    ).join('');

    document.getElementById('detailModalTitle').textContent = item.name;
    document.getElementById('detailModalBody').innerHTML = `
      ${(() => {
        const ph = Array.isArray(item.photos) && item.photos.length ? item.photos : (item.photo ? [item.photo] : []);
        if (!ph.length) return '';
        return `<div class="detail-gallery">
          <div class="detail-photo-main" title="Открыть на весь экран"><img id="detailPhotoMain" src="${ph[0]}" alt=""></div>
          ${ph.length > 1 ? `<div class="detail-thumbs">${ph.map((p, i) =>
            `<button type="button" class="detail-thumb${i === 0 ? ' active' : ''}" data-src="${p}"><img src="${p}" alt=""></button>`).join('')}</div>` : ''}
        </div>`;
      })()}
      <div class="detail-main">
      ${sizesCard}
      <div class="detail-card">${priceRows}</div>
      <div class="detail-card">
        <div class="detail-row detail-status-row" id="detailStatusRow" style="cursor:pointer">
          <span class="detail-key">Статус</span>
          <span class="detail-val" style="display:flex;align-items:center;gap:8px">
            <span class="status-badge ${item.orderStatus}" id="detailStatusBadge">${st.label}</span>${(() => { const r = (item.sizes || []).reduce((s, x) => s + this.rsvQty(x), 0); return r ? `<span class="status-badge processing" title="Штук в заказе (забронированы под клиентов)">В заказе ×${r}</span>` : ''; })()}
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
      ${this._itemHistoryHtml(item)}
      <button class="detail-sell-btn" id="detailSellBtn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
          <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none"/>
        </svg>Продать товар
      </button>
      <button class="detail-delete-btn" id="detailDeleteBtn">Удалить товар</button>
      </div>
    `;

    /* Галерея: миниатюры переключают главное фото, клик по фото — на весь экран */
    const dBody = document.getElementById('detailModalBody');
    dBody.querySelectorAll('.detail-thumb').forEach(t =>
      t.addEventListener('click', () => {
        const main = document.getElementById('detailPhotoMain');
        if (main) main.src = t.dataset.src;
        dBody.querySelectorAll('.detail-thumb').forEach(x => x.classList.toggle('active', x === t));
      })
    );
    document.getElementById('detailPhotoMain')?.addEventListener('click', (e) =>
      this._openImage(e.currentTarget.src));

    document.getElementById('detailSellBtn').addEventListener('click', () => {
      this.closeModal('detailModal');
      this.openSaleModal(id);
    });


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
    try {
      const done = await this._withDanger('Удаление товара', dp => this.db.deleteItem(id, dp));
      if (done === null) return;   // отменили ввод пароля
    } catch (e) { this.toast(e.message || 'Ошибка'); return; }
    await this.db.logAction('item_delete', `Удалён товар: «${item?.name || id}»`, { id, name: item?.name });
    await this.loadData();
    this.closeModal('detailModal');
    this.renderInventoryList();
    this.toast('Товар удалён ✓');
  }

  /* ──────────────────────────────────────────
     ITEM FORM
     ────────────────────────────────────────── */
  async openItemModal(id = null) {
    this.editingItemId = id;
    this._photos       = [];
    this._selOwner     = null;
    this._selStatus    = 'ordered';
    this._sizes        = [{ size: '', qty: 1 }];

    /* Reset */
    ['fieldName','fieldNotes','fieldPrice','fieldOldPrice','fieldBuyPrice','fieldDeliveryCost','fieldSiteDesc','fieldMeasurements','fieldGarment','fieldBrand','fieldCondition','fieldSex'].forEach(k => document.getElementById(k).value = '');
    this._garmentManual = false;   // автоподбор снова разрешён
    this._brandManual   = false;
    this._catManual     = false;
    document.getElementById('fieldIsMonarc').checked   = false;
    document.getElementById('fieldShowOnSite').checked = false;
    document.getElementById('fieldShowOnAvito').checked = false;
    document.getElementById('siteDescGroup').style.display = 'none';

    /* hideCosts: скрываем закупочные поля в форме */
    const hideCosts = !!this.currentUser?.hideCosts && this.currentUser?.role !== 'root';
    document.querySelectorAll('#itemModal .cost-field').forEach(el =>
      el.classList.toggle('hidden', hideCosts));
    document.getElementById('totalDisplay').textContent = '0 ₽';
    document.getElementById('marginDisplay').textContent = '—';
    document.getElementById('marginDisplay').style.color = 'var(--text2)';
    this._renderPhotoStrip();

    /* Category select */
    const catSel = document.getElementById('fieldCategory');
    const byOrd = (a, b) => (a.order || 0) - (b.order || 0);
    const topCats = this.categories.filter(c => !c.parentId).sort(byOrd);
    const catOpts = topCats.map(top => {
      const subs = this.categories.filter(c => c.parentId === top.id).sort(byOrd);
      return `<option value="${top.id}">${this.esc(top.name)}</option>` +
        subs.map(s => `<option value="${s.id}">  — ${this.esc(s.name)}</option>`).join('');
    }).join('');
    catSel.innerHTML = `<option value="">— Без категории —</option>` + catOpts;

    /* Подсказки брендов: шаблоны из меню + бренды уже заведённых товаров */
    const brands = [...new Set([
      ...(this.brands || []).map(b => b.name),
      ...this.items.map(i => (i.brand || '').trim()),
    ].filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru'));
    document.getElementById('brandsList').innerHTML =
      brands.map(b => `<option value="${this.esc(b)}">`).join('');
    const hasCats = this.categories.length > 0;
    document.getElementById('categoryGroup').style.display   = hasCats ? '' : 'none';
    document.getElementById('categoryDivider').style.display = hasCats ? '' : 'none';

    document.getElementById('itemModalTitle').textContent = id ? 'Изменить товар' : 'Новый товар';

    if (id) {
      const item = this.items.find(i => i.id === id) || await this.db.getItem(id);
      if (item) {
        document.getElementById('fieldName').value          = item.name         || '';
        document.getElementById('fieldPrice').value         = item.price        || '';
        document.getElementById('fieldOldPrice').value      = item.oldPrice     || '';
        document.getElementById('fieldBuyPrice').value      = item.buyPrice     || '';
        document.getElementById('fieldDeliveryCost').value  = item.deliveryCost || '';
        document.getElementById('fieldNotes').value = item.notes || '';
        document.getElementById('fieldIsMonarc').checked   = !!item.isMonarc;
        document.getElementById('fieldShowOnSite').checked = !!item.showOnSite;
        document.getElementById('fieldShowOnAvito').checked = !!item.showOnAvito;
        document.getElementById('fieldSiteDesc').value      = item.description || '';
        document.getElementById('fieldMeasurements').value  = item.measurements || '';
        document.getElementById('siteDescGroup').style.display = item.showOnSite ? '' : 'none';
        catSel.value    = item.categoryId  || '';
        document.getElementById('fieldGarment').value   = item.garment   || '';
        document.getElementById('fieldBrand').value     = item.brand     || '';
        document.getElementById('fieldCondition').value = item.condition || '';
        document.getElementById('fieldSex').value       = item.sex       || '';
        this._selOwner  = item.ownerId     || null;
        this._selStatus = item.orderStatus || 'ordered';
        this._sizes = item.sizes?.length > 0
          ? item.sizes.map(s => ({ size: s.size || '', qty: s.qty || 0, ownerId: s.ownerId || null,
              // Старый булев флаг брони читаем как «вся штука в брони»
              reservedQty: Math.min(s.qty || 0, s.reservedQty != null ? s.reservedQty : (s.reserved ? (s.qty || 0) : 0)) }))
          : [{ size: item.size || '', qty: item.quantity || 1 }];
        this._photos = Array.isArray(item.photos) && item.photos.length
          ? item.photos.map((full, i) => ({ full, thumb: item.thumbs?.[i] || full }))
          : (item.photo ? [{ full: item.photo, thumb: item.photo }] : []);
        this._renderPhotoStrip();
      }
    }

    this.refreshOwnerChips();
    this.refreshStatusChips();
    this.renderSizes();
    this.openModal('itemModal');
  }

  /* ── Перетаскивание фото в ленте: мышью сразу, на таче — long-press.
     Та же механика, что у карточек товаров: фото «поднимается» (absolute,
     за пальцем), его место держит слот-плейсхолдер, соседи разъезжаются
     FLIP-анимацией. Старый вариант без слота дёргал раскладку на каждой
     вставке и фото «мигало» между позициями на границах строк сетки.
     Порядок в ленте = порядок фото на сайте; тап без движения по-прежнему
     делает фото главным. ── */
  _bindPhotoDrag() {
    const strip = document.getElementById('photoStrip');
    if (!strip || strip._dragBound) return;
    strip._dragBound = true;
    strip._justDragged = false;

    let el = null, ph = null, pid = null, startX = 0, startY = 0,
        grabDX = 0, grabDY = 0, dragging = false, landing = false, longT = null,
        finalRects = new Map(), finalAt = 0;   // финальные rect'ы соседей во время FLIP
    const thumbs = () => [...strip.querySelectorAll('.photo-thumb')];

    const startDrag = () => {
      if (!el || dragging) return;
      dragging = true;
      const r = el.getBoundingClientRect(), sr = strip.getBoundingClientRect();
      grabDX = startX - r.left; grabDY = startY - r.top;
      ph = document.createElement('div');
      ph.className = 'photo-thumb-ph';
      // Телефон (горизонтальная лента): слот повторяет размер кадра.
      // Веб (сетка): размер задаёт ячейка — инлайн сломал бы раскладку,
      // особенно у крупного главного фото на всю ширину
      if (getComputedStyle(strip).display !== 'grid') {
        ph.style.width  = r.width + 'px';
        ph.style.height = r.height + 'px';
      }
      el.after(ph);
      el.style.width  = r.width + 'px';
      el.style.height = r.height + 'px';
      el.style.left = (r.left - sr.left + strip.scrollLeft) + 'px';
      el.style.top  = (r.top - sr.top + strip.scrollTop) + 'px';
      el.classList.add('drag');
      strip.classList.add('dragging');
      try { el.setPointerCapture(pid); } catch (_) {}
      if (navigator.vibrate) navigator.vibrate(10);   // лёгкий отклик на таче
    };

    // FLIP по обеим осям: в вебе лента — сетка, кадры съезжают и по вертикали.
    // Rect'ы после mutate (до inverted-transform) — финальные: запоминаем их,
    // чтобы прицел не смотрел на анимируемые позиции
    const flipMove = (mutate) => {
      const others = thumbs().filter(t => t !== el);
      const before = new Map(others.map(t => { const r = t.getBoundingClientRect(); return [t, { l: r.left, t: r.top }]; }));
      mutate();
      const moved = [];
      finalRects = new Map(); finalAt = Date.now();
      for (const t of others) {
        const b = before.get(t), r = t.getBoundingClientRect();
        finalRects.set(t, r);
        const dx = b.l - r.left, dy = b.t - r.top;
        if (!dx && !dy) continue;
        t.style.transition = 'none';
        t.style.transform  = `translate(${dx}px, ${dy}px)`;
        moved.push(t);
      }
      // setTimeout, не rAF: rAF замирает в свёрнутой вкладке
      if (moved.length) setTimeout(() => {
        for (const t of moved) { t.style.transition = 'transform .16s ease'; t.style.transform = ''; }
        setTimeout(() => { for (const t of moved) t.style.transition = ''; }, 200);
      }, 20);
    };

    const stop = (commit) => {
      clearTimeout(longT); longT = null;
      if (!dragging || !el || landing) { if (!landing) { el = null; pid = null; } return; }
      strip._justDragged = true;                       // подавить click-«сделать главным»
      setTimeout(() => { strip._justDragged = false; }, 80);
      const finish = () => {
        // Новый порядок — из DOM (data-idx хранят исходные индексы)
        if (commit) this._photos = thumbs().map(t => this._photos[+t.dataset.idx]);
        strip.classList.remove('dragging');
        this._renderPhotoStrip();                      // полный перерендер чистит все стили
        dragging = false; landing = false; el = null; ph = null; pid = null;
      };
      if (!commit || !ph) { finish(); return; }
      // Приземление в слот, затем фиксация порядка
      landing = true;
      const grabbed = el, slot = ph;
      const pr = slot.getBoundingClientRect(), sr = strip.getBoundingClientRect();
      grabbed.style.transition = 'left .15s ease, top .15s ease, transform .15s ease';
      grabbed.style.left = (pr.left - sr.left + strip.scrollLeft) + 'px';
      grabbed.style.top  = (pr.top - sr.top + strip.scrollTop) + 'px';
      grabbed.style.transform = 'scale(1)';
      setTimeout(() => { slot.replaceWith(grabbed); finish(); }, 165);
    };

    strip.addEventListener('pointerdown', (e) => {
      if (dragging || landing || el) return;           // второй палец не влезает в жест
      const t = e.target.closest('.photo-thumb');
      if (!t || e.target.closest('.photo-thumb-remove')) return;
      el = t; pid = e.pointerId; startX = e.clientX; startY = e.clientY;
      if (e.pointerType === 'mouse') return;           // мышь: drag начнётся от движения
      longT = setTimeout(startDrag, 260);              // тач: удержание, чтобы не мешать скроллу
    });

    strip.addEventListener('pointermove', (e) => {
      if (!el || landing || e.pointerId !== pid) return;
      if (!dragging) {
        const d = Math.hypot(e.clientX - startX, e.clientY - startY);
        if (e.pointerType === 'mouse' && d > 6) startDrag();
        else if (d > 10) { clearTimeout(longT); longT = null; el = null; return; }   // это скролл ленты
        if (!dragging) return;
      }
      e.preventDefault();
      const sr = strip.getBoundingClientRect();
      el.style.left = (e.clientX - grabDX - sr.left + strip.scrollLeft) + 'px';
      el.style.top  = (e.clientY - grabDY - sr.top + strip.scrollTop) + 'px';
      // Целимся центром фото. Во время FLIP живые rect'ы соседей врут
      // (transform едет) — берём их финальные позиции из flipMove
      const er = el.getBoundingClientRect();
      const ex = er.left + er.width / 2, ey = er.top + er.height / 2;
      const fresh = Date.now() - finalAt < 260;
      let best = null, bestD = Infinity;
      for (const t of thumbs()) {
        if (t === el) continue;
        const r = (fresh && finalRects.get(t)) || t.getBoundingClientRect();
        const ddx = Math.max(r.left - ex, ex - r.right, 0);
        const ddy = Math.max(r.top - ey, ey - r.bottom, 0);
        const d = ddx * ddx + ddy * ddy * 4;   // вертикаль весит больше — не прыгать между строками
        if (d < bestD) { bestD = d; best = { t, r }; }
      }
      if (!best) return;
      const bcx = best.r.left + best.r.width / 2, bcy = best.r.top + best.r.height / 2;
      const sameRow = Math.abs(ey - bcy) < best.r.height / 2;
      const before  = sameRow ? ex < bcx : ey < bcy;
      const anchor  = before ? best.t : best.t.nextElementSibling;   // может быть «＋ Фото» — слот встанет перед ней
      if (anchor !== ph && ph.nextElementSibling !== anchor)
        flipMove(() => strip.insertBefore(ph, anchor));
    });
    strip.addEventListener('pointerup',     (e) => { if (!el || e.pointerId === pid) stop(true); });
    strip.addEventListener('pointercancel', (e) => { if (!el || e.pointerId === pid) stop(false); });
    /* Тач: как только нативный скролл ленты стартует, браузер шлёт pointercancel
       и drag обрывается — «фото не переставляются». Во время drag глушим
       touchmove: скролл не начинается и жест доживает до pointerup. До старта
       drag не вмешиваемся — палец при long-press неподвижен, а быстрый свайп
       должен скроллить ленту как обычно. Non-passive обязателен для preventDefault. */
    strip.addEventListener('touchmove', (e) => {
      if (dragging) e.preventDefault();
    }, { passive: false });
  }

  _renderPhotoStrip() {
    const el = document.getElementById('photoStrip');
    if (!el) return;
    el.innerHTML = this._photos.map((p, i) => `
      <div class="photo-thumb${i === 0 ? ' main' : ''}" data-idx="${i}" title="${i === 0 ? 'Главное фото' : 'Сделать главным'}">
        <img src="${p.thumb}" alt="">
        ${i === 0 ? '<span class="photo-main-badge">Главное</span>' : ''}
        <button type="button" class="photo-thumb-remove" data-idx="${i}">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>`).join('') + `
      <button type="button" class="photo-add-tile" title="Добавить фото">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
          <rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        <span>Фото</span>
      </button>`;
  }

  /* Сколько штук размера в заказе (старый булев флаг = весь размер) */
  rsvQty(s) {
    return Math.min(s.qty || 0,
      s.reservedQty != null ? (s.reservedQty || 0) : (s.reserved ? (s.qty || 0) : 0));
  }
  /* Подпись на чипе размера: «· в заказе» (всё) или «· 1 в заказе» (часть) */
  rsvLabel(s) {
    const rq = this.rsvQty(s);
    if (!rq) return '';
    return rq >= (s.qty || 0) ? ' · в заказе' : ` · ${rq} в заказе`;
  }

  renderSizes() {
    const list = document.getElementById('sizesList');
    if (!list) return;
    list.innerHTML = this._sizes.map((s, i) => `
      <div class="size-item">
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
        </div>
        <div class="size-extra">
          ${this.owners.length ? `
          <select class="size-owner-select" data-idx="${i}">
            <option value="">Владелец — как у объявления</option>
            ${this.owners.map(o => `<option value="${o.id}"${s.ownerId === o.id ? ' selected' : ''}>${this.esc(o.name)}</option>`).join('')}
          </select>` : ''}
          <div class="size-reserve-ctl${(s.reservedQty || 0) > 0 ? ' on' : ''}"
               title="Столько штук уже в заказе у клиентов — на сайте их купить нельзя">
            <span>В заказе</span>
            <button type="button" class="rsv-dec" data-idx="${i}">−</button>
            <b>${s.reservedQty || 0}</b>
            <button type="button" class="rsv-inc" data-idx="${i}">+</button>
          </div>
        </div>
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
    document.body.classList.add('select-mode');   // нижнее меню уступает место панели
    document.getElementById('deliveryBar').classList.remove('hidden');
    // hideCosts-сотрудник не может менять доставку — сервер её всё равно не примет
    const hideCosts = !!this.currentUser?.hideCosts && this.currentUser?.role !== 'root';
    document.getElementById('bulkDeliveryBtn').style.display = hideCosts ? 'none' : '';
    document.getElementById('selectModeBtn')?.classList.add('active');
    this.renderInventoryList();
    this.updateDeliveryBar();
    this.toast('Нажмите на товары для выбора');
  }

  exitSelectMode() {
    this._selectMode  = false;
    this._selectedIds = new Set();
    document.body.classList.remove('select-mode');
    document.getElementById('deliveryBar').classList.add('hidden');
    document.getElementById('selectModeBtn')?.classList.remove('active');
    this.renderInventoryList();
  }

  toggleSelectItem(id) {
    if (this._selectedIds.has(id)) this._selectedIds.delete(id);
    else this._selectedIds.add(id);
    const card = document.querySelector(`.item-card[data-id="${id}"], .item-row[data-id="${id}"]`);
    if (card) card.classList.toggle('selected', this._selectedIds.has(id));
    this.updateDeliveryBar();
  }

  updateDeliveryBar() {
    const n = this._selectedIds.size;
    const word = n === 1 ? 'товар' : n > 1 && n < 5 ? 'товара' : 'товаров';
    document.getElementById('deliveryBarCount').textContent =
      n === 0 ? 'Выберите товары' : `${n} ${word}`;
    ['bulkStatusBtn', 'bulkParcelBtn', 'bulkDeliveryBtn', 'bulkOwnerBtn', 'bulkParamsBtn', 'bulkFlagsBtn', 'bulkLabelsBtn', 'bulkDeleteBtn'].forEach(id => {
      const b = document.getElementById(id);
      if (b) b.disabled = n === 0;
    });
    // «Выбрать все» ↔ «Снять всё» — по состоянию текущего списка.
    // Пока список перерисовывается (скелетон, карточек нет) — подпись не трогаем.
    const saBtn = document.getElementById('selectAllBtn');
    if (saBtn) {
      const ids = [...document.querySelectorAll('#inventoryList .item-card')]
        .map(c => c.dataset.id).filter(Boolean);
      if (ids.length) saBtn.textContent =
        ids.every(id => this._selectedIds.has(id)) ? 'Снять всё' : 'Выбрать все';
    }
  }

  /* Bulk: печать QR-этикеток для склада. Скан QR открывает карточку в панели.
     Формат 58×40 мм — стандартный стикер термопринтера; на обычном принтере
     печатается сеткой. */
  bulkLabels() {
    const ids = [...this._selectedIds];
    if (!ids.length) return;
    const items = ids.map(id => this.items.find(i => i.id === id)).filter(Boolean);
    const w = window.open('', '_blank');
    if (!w) { this.toast('Откройте панель в браузере — вебвью не даёт открыть окно печати'); return; }
    const esc = s => this.esc(s);
    w.document.write(`<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>Этикетки · ${items.length} шт</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&display=swap"><style>
      body{font-family:-apple-system,'Segoe UI',Arial,sans-serif;margin:0;padding:8mm;padding-top:22mm;
           display:flex;flex-wrap:wrap;gap:3mm;background:#fff;color:#000}
      .lbl{width:58mm;height:40mm;border:.3mm dashed #bbb;border-radius:2mm;padding:2.4mm 3mm 2.2mm;box-sizing:border-box;
           display:flex;flex-direction:column;page-break-inside:avoid;break-inside:avoid}
      /* Внутренняя обёртка: в обычных форматах просто заполняет этикетку,
         в 60×40 (альбомной) — поворачивается на 90° */
      .li{display:flex;flex-direction:column;flex:1;min-width:0;min-height:0}
      /* Шильдик: серифный логотип как на витрине, тонкие линии по бокам */
      .brand{display:flex;align-items:center;gap:2mm;white-space:nowrap;
             font-family:'Cormorant Garamond',Georgia,'Times New Roman',serif;
             font-size:3.9mm;font-weight:600;letter-spacing:.3em;text-transform:uppercase}
      .brand::before,.brand::after{content:'';flex:1;min-width:1.5mm;border-top:.25mm solid #000}
      .mid{flex:1;min-height:0;display:flex;gap:2.6mm;align-items:center}
      .mid img{width:24mm;height:24mm;flex-shrink:0}
      .in{min-width:0;flex:1;display:flex;flex-direction:column;justify-content:center}
      .n{font-size:3.3mm;font-weight:700;line-height:1.25;max-height:16mm;overflow:hidden}
      .s{font-size:2.8mm;margin-top:1.1mm}
      .s span{font-size:2mm;font-weight:600;letter-spacing:.18em;text-transform:uppercase;margin-right:.8mm}
      /* Размеры-чипы: клик оставляет один (продаваемый) размер на этикетке */
      .szc{font-weight:400;cursor:pointer;margin-right:1.2mm}
      .szc.off{opacity:.2;text-decoration:line-through}
      @media print{.szc.off{display:none}}
      .n.pn{font-size:2.9mm}
      .list{font-size:2.5mm;line-height:1.4;margin-top:.8mm;max-height:15mm;overflow:hidden}
      .site{text-align:center;font-size:2mm;font-weight:600;letter-spacing:.24em;text-transform:uppercase;margin-top:1mm}

      /* Термопринтер (Xprinter XP-365B и похожие): одна этикетка = одна страница,
         без полей, рамок и скруглений */
      body.thermo{padding:0;padding-top:18mm;display:block}
      @media print{body.thermo{padding:0}}
      body.thermo .lbl{border:none;border-radius:0;margin:0;page-break-after:always}
      body.t4030 .lbl{width:40mm;height:30mm;padding:1.8mm 2.2mm 1.6mm}
      body.t4030 .brand{font-size:2.7mm;letter-spacing:.22em;gap:1.4mm}
      body.t4030 .mid{gap:1.8mm}
      body.t4030 .mid img{width:17mm;height:17mm}
      body.t4030 .n{font-size:2.5mm;max-height:11mm}
      body.t4030 .s{font-size:2.1mm;margin-top:.7mm}
      body.t4030 .s span{font-size:1.6mm}
      body.t4030 .n.pn{font-size:1.9mm}
      body.t4030 .list{font-size:1.9mm;max-height:9mm}
      body.t4030 .site{font-size:1.5mm;letter-spacing:.18em;margin-top:.6mm}

      /* 60×40 альбомная на ленте 40×60: принтер печатает книжно, поэтому
         макет 60×40 поворачивается на 90° внутри страницы 40×60 */
      body.t4060 .lbl{width:40mm;height:60mm;padding:0;position:relative;overflow:hidden;display:block}
      body.t4060 .li{
        position:absolute;left:0;top:0;box-sizing:border-box;
        width:60mm;height:40mm;padding:2.6mm 3mm 2.2mm;
        transform:rotate(90deg) translateY(-40mm);transform-origin:top left;
      }
      body.t4060 .mid img{width:26mm;height:26mm}

      .bar{position:fixed;top:0;left:0;right:0;z-index:10;background:#111;color:#fff;
           display:flex;gap:10px;align-items:center;padding:10px 14px;font-size:14px}
      .bar select{padding:7px 10px;border-radius:8px;border:1px solid #444;background:#222;color:#fff;font-size:14px}
      .bar button{padding:8px 22px;border-radius:8px;border:none;background:#7c6dfa;color:#fff;font-weight:700;font-size:14px;cursor:pointer}
      @media print{.bar{display:none}body{padding:0}.lbl{border-color:transparent}}
    </style><style id="pageStyle">@page{size:58mm 40mm;margin:0}</style></head><body class="thermo t5840">
    <div class="bar">
      <span>Формат:</span>
      <select id="fmt">
        <option value="t5840" selected>Термопринтер 58×40 (XP-365B)</option>
        <option value="t4060">Термопринтер 60×40 — альбомная на ленте 40×60</option>
        <option value="t4030">Термопринтер 40×30</option>
        <option value="a4">Обычный принтер — сетка на листе</option>
      </select>
      <button onclick="print()">Печать</button>
      <span style="opacity:.6">${items.length} шт</span>
      ${items.some(i => (i.sizes || []).filter(s => s.size).length > 1)
        ? '<span style="opacity:.6">· Клик по размеру — оставить только его</span>' : ''}
    </div>` + items.map(i => {
      // /q/<id>: товар с витрины откроется на сайте (удобно на ПВЗ), скрытый — в панели
      const url = location.origin + '/q/' + encodeURIComponent(i.id);
      const sizes = (i.sizes || []).filter(s => s.size).map(s => s.size);
      return `<div class="lbl"><div class="li">
        <div class="brand">Masqucerade</div>
        <div class="mid">
          <img src="/qr.svg?d=${encodeURIComponent(url)}" alt="QR">
          <div class="in">
            <div class="n">${esc(i.name || '')}</div>
            ${sizes.length ? `<div class="s"><span>Размер</span>${sizes.map(sz =>
              `<b class="szc" onclick="pick(this)">${esc(sz)}</b>`).join('')}</div>` : ''}
          </div>
        </div>
        <div class="site">masqucerade.com</div>
      </div></div>`;
    }).join('') + (items.length > 1 ? (() => {
      // Сводная этикетка посылки: скан выделяет все её товары в панели
      const purl = location.origin + '/admin#items=' + items.map(i => i.id).join(',');
      const line = i => {
        const sz = (i.sizes || []).filter(s => s.size).map(s => s.size).join('/');
        return `• ${esc(i.name)}${sz ? ` (${esc(sz)})` : ''}`;
      };
      const shown = items.slice(0, 5);
      return `<div class="lbl" style="border-style:solid"><div class="li">
        <div class="brand">Masqucerade</div>
        <div class="mid">
          <img src="/qr.svg?d=${encodeURIComponent(purl)}" alt="QR">
          <div class="in">
            <div class="n pn">Посылка&nbsp;·&nbsp;${items.length}&nbsp;шт</div>
            <div class="list">${shown.map(line).join('<br>')}${items.length > 5 ? `<br>…и ещё ${items.length - 5}` : ''}</div>
          </div>
        </div>
        <div class="site">masqucerade.com</div>
      </div></div>`;
    })() : '') + `<script>
      // Клик по размеру: оставить только его; клик по единственному оставшемуся — вернуть все
      function pick(el){
        var all = el.parentNode.querySelectorAll('.szc');
        if (all.length < 2) return;
        var solo = !el.classList.contains('off') &&
                   el.parentNode.querySelectorAll('.szc.off').length === all.length - 1;
        all.forEach(function(b){ b.classList.toggle('off', !solo && b !== el); });
      }
      document.getElementById('fmt').onchange = function(){
        var v = this.value;
        document.body.className = v === 'a4' ? '' : 'thermo ' + v;
        document.getElementById('pageStyle').textContent =
          v === 't5840' ? '@page{size:58mm 40mm;margin:0}' :
          v === 't4060' ? '@page{size:40mm 60mm;margin:0}' :
          v === 't4030' ? '@page{size:40mm 30mm;margin:0}' :
          '@page{size:auto;margin:8mm}';
      };
    <\/script></body></html>`);
    w.document.close();
  }

  /* ── Сканер QR ──
     1) Telegram новых версий (API ≥6.4) — нативный сканер;
     2) иначе — своя камера: getUserMedia + BarcodeDetector / jsQR (работает
        в старых TG-вебвью и любом браузере);
     3) камера недоступна — ручной ввод ссылки. */
  scanQr() {
    const tg = window.Telegram?.WebApp;
    if (tg?.showScanQrPopup && tg.isVersionAtLeast?.('6.4')) {
      try {
        tg.showScanQrPopup({ text: 'Наведите камеру на QR этикетки' }, (data) => {
          this._handleScan(data);
          return true;   // true = закрыть сканер
        });
        return;
      } catch (_) {}
    }
    this._openCamScanner();
  }

  // Декодер jsQR подгружается лениво — только при первом открытии сканера
  _loadJsQR() {
    if (window.jsQR) return Promise.resolve();
    return this._jsqrP || (this._jsqrP = new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'js/jsqr.js?v=1';
      s.onload = res; s.onerror = () => { this._jsqrP = null; rej(); };
      document.head.appendChild(s);
    }));
  }

  async _openCamScanner() {
    const video = document.getElementById('qrScanVideo');
    // Модалку показываем сразу — пользователь видит, что сканер запускается
    this.openModal('qrScanModal');
    this._qrStop = () => this.closeModal('qrScanModal');   // ✕ работает и на этапе запроса
    let stream;
    try {
      stream = await Promise.race([
        navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 } }, audio: false,
        }),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 8000)),
      ]);
    } catch (_) {
      this.closeModal('qrScanModal');
      const v = await this._prompt('Скан QR', '', 'Камера недоступна — вставьте ссылку с этикетки');
      if (v) this._handleScan(v);
      return;
    }
    if (!document.getElementById('qrScanModal').classList.contains('open')) {
      // Закрыли крестиком, пока ждали разрешение — глушим камеру
      stream.getTracks().forEach(t => t.stop());
      return;
    }
    video.srcObject = stream;
    await video.play().catch(() => {});

    // Распознавание: нативный BarcodeDetector, иначе jsQR по кадрам canvas
    let detector = null;
    try { if ('BarcodeDetector' in window) detector = new BarcodeDetector({ formats: ['qr_code'] }); } catch (_) {}
    if (!detector) await this._loadJsQR().catch(() => {});

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const stop = () => {
      clearInterval(this._qrTimer);
      stream.getTracks().forEach(t => t.stop());
      video.srcObject = null;
      this.closeModal('qrScanModal');
    };
    this._qrStop = stop;

    let busy = false;
    this._qrTimer = setInterval(async () => {
      if (busy || video.readyState < 2) return;
      busy = true;
      try {
        let text = null;
        if (detector) {
          const codes = await detector.detect(video);
          text = codes[0]?.rawValue || null;
        } else if (window.jsQR) {
          canvas.width = video.videoWidth; canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          text = window.jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' })?.data || null;
        }
        if (text) {
          if (navigator.vibrate) navigator.vibrate(30);
          stop();
          this._handleScan(text);
        }
      } catch (_) {}
      busy = false;
    }, 250);
  }

  _handleScan(data) {
    const s = String(data || '').trim();
    // Посылка: #items=id1,id2,… → выделить все её товары
    const multi = /#items=([\w,-]+)/.exec(s);
    if (multi) { this._selectScanned(multi[1].split(',')); return; }
    // Товар: /q/<id>, /product/<id>, #item=<id> или голый id
    const one = /(?:#item=|\/q\/|\/product\/)([\w-]+)/.exec(s) || /^([\w-]{8,})$/.exec(s);
    const id  = one && decodeURIComponent(one[1]);
    if (id && this.items.some(i => i.id === id)) {
      this.renderView('inventory');
      this.openDetailModal(id);   // превью товара; «Изменить» — внутри него
    } else {
      this.toast('Товар по QR не найден');
    }
  }

  async _selectScanned(ids) {
    const found = ids.filter(id => this.items.some(i => i.id === id));
    if (!found.length) { this.toast('Товары посылки не найдены'); return; }
    // Сбрасываем фильтры списка — все вещи посылки должны быть видны
    this.filterOwnerId = null; this._filterMonarc = false; this.filterStatus = '';
    const si = document.getElementById('searchInput');
    if (si) si.value = '';
    this.renderOwnerFilterChips();
    this.renderView('inventory');
    if (!this._selectMode) this.enterSelectMode();
    this._selectedIds = new Set(found);
    await this.renderInventoryList();
    this.updateDeliveryBar();
    const names = found.map(id => this.items.find(i => i.id === id)?.name).filter(Boolean);
    this.toast(`${found.length} тов.: ${names.join(', ').slice(0, 120)}${names.join(', ').length > 120 ? '…' : ''}`);
  }

  /* Bulk: удаление выбранных — одним запросом, с подтверждением */
  async bulkDelete() {
    const ids = [...this._selectedIds];
    if (!ids.length) return;
    const ok = await this.confirm(`Удалить выбранные товары (${ids.length} шт.)? Это действие нельзя отменить.`);
    if (!ok) return;
    try {
      const done = await this._withDanger(`Удаление товаров (${ids.length} шт.)`, dp => this.db.bulkDeleteItems(ids, dp));
      if (done === null) return;   // отменили ввод пароля
    } catch (e) {
      this.toast(e.message || 'Ошибка — проверьте соединение');
      return;
    }
    await this.db.logAction('item_delete', `Удалено ${ids.length} тов.: ${this._namesFor(ids, 5)}`, { level: 'danger' });
    await this.loadData();
    this.exitSelectMode();
    this.toast(`Удалено: ${ids.length} ✓`);
  }

  _bulkDesc() {
    const n = this._selectedIds.size;
    return `Применить к ${n} ${n === 1 ? 'товару' : 'товарам'}`;
  }

  /* Bulk: бренд / состояние / пол — меняются только заполненные поля */
  async applyBulkParams() {
    const patch = {};
    const b = document.getElementById('bulkBrand').value.trim();
    if (b === '—' || b === '-') patch.brand = null;
    else if (b) patch.brand = b;
    const c = document.getElementById('bulkCondition').value;
    if (c === '__clear__') patch.condition = null;
    else if (c) patch.condition = c;
    const s = document.getElementById('bulkSex').value;
    if (s === '__clear__') patch.sex = null;
    else if (s) patch.sex = s;
    if (!Object.keys(patch).length) { this.toast('Выберите, что изменить'); return; }
    this.closeModal('bulkParamsModal');
    await this.applyBulk(patch, 'Параметры товаров обновлены', 'Параметры обновлены ✓');
  }

  // Имена товаров для журнала: первые 3 + «и ещё N»
  _namesFor(ids, max = 3) {
    const names = ids.map(id => this.items.find(i => i.id === id)?.name).filter(Boolean);
    return names.slice(0, max).map(n => `«${n}»`).join(', ') +
      (names.length > max ? ` и ещё ${names.length - max}` : '');
  }

  /* Патч по всем выбранным товарам — одним запросом (bulk API) */
  async applyBulk(patch, logDesc, toastMsg) {
    const ids = [...this._selectedIds];
    try {
      await this.db.bulkPatchItems(ids, patch);
    } catch (e) {
      this.toast('Ошибка — проверьте соединение');
      return;
    }
    await this.db.logAction('item_edit', `${logDesc} — ${ids.length} тов.: ${this._namesFor(ids)}`);
    await this.loadData();
    this.exitSelectMode();
    this.toast(toastMsg);
  }

  openDeliveryModal() {
    if (!this._selectedIds.size) return;
    if (this.currentUser?.hideCosts && this.currentUser?.role !== 'root') {
      this.toast('Недостаточно прав для изменения доставки');
      return;
    }
    document.getElementById('deliveryModalDesc').textContent = this._bulkDesc();
    document.getElementById('deliveryCostInput').value = '';
    this.openModal('deliveryModal');
    setTimeout(() => document.getElementById('deliveryCostInput').focus(), 350);
  }

  async applyDelivery() {
    const cost = parseFloat(document.getElementById('deliveryCostInput').value) || 0;
    this.closeModal('deliveryModal');
    await this.applyBulk({ deliveryCost: cost },
      `Доставка ${fmtMoney(cost)} установлена`,
      `Доставка ${fmtMoney(cost)} установлена ✓`);
  }

  /* Bulk: владелец */
  openBulkOwnerModal() {
    if (!this._selectedIds.size) return;
    this._bulkOwnerId = null;
    document.getElementById('bulkOwnerDesc').textContent = this._bulkDesc();
    const wrap = document.getElementById('bulkOwnerChips');
    wrap.innerHTML = [
      `<button type="button" class="owner-chip selected" data-owner-id="">
         <span class="owner-chip-dot" style="background:#6b7280">—</span>Без владельца
       </button>`,
      ...this.owners.map(o =>
        `<button type="button" class="owner-chip" data-owner-id="${o.id}">
           <span class="owner-chip-dot" style="background:${o.color}">${o.name[0].toUpperCase()}</span>
           ${this.esc(o.name)}
         </button>`),
    ].join('');
    this.openModal('bulkOwnerModal');
  }

  async applyBulkOwner() {
    const ownerId = this._bulkOwnerId || null;
    const name    = ownerId ? (this.owners.find(o => o.id === ownerId)?.name || '') : 'Без владельца';
    this.closeModal('bulkOwnerModal');
    await this.applyBulk({ ownerId },
      `Владелец «${name}» установлен`,
      `Владелец: ${name} ✓`);
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

  /* ── Тип одежды по смыслу: «худи» — всегда верх, «штаны» — низ ── */
  static GARMENT_RULES = [
    ['shoes', ['кроссовк', 'кед', 'обув', 'ботинк', 'туфл', 'сандал', 'сланц', 'тапк', 'лофер', 'дерби', 'мокасин', 'угг',
               'sneaker', 'shoe', 'boot', 'loafer', 'slide', 'runner']],
    ['outerwear', ['куртк', 'пуховик', 'пальто', 'плащ', 'ветровк', 'бомбер', 'парка', 'анорак', 'тренч', 'шуб', 'дублёнк', 'дубленк', 'жилет',
                   'jacket', 'coat', 'puffer', 'parka', 'windbreaker', 'bomber', 'trench', 'vest']],
    ['bottom', ['штан', 'брюк', 'джинс', 'шорт', 'юбк', 'леггинс', 'тайтс', 'бридж',
                'pants', 'jeans', 'denim', 'shorts', 'trousers', 'sweatpants', 'skirt', 'joggers']],
    ['top', ['худи', 'зип', 'свитшот', 'футболк', 'лонгслив', 'лонг слив', 'рубашк', 'поло', 'майк', 'свитер', 'джемпер', 'кофт', 'водолазк', 'гольф', 'топ ',
             'hoodie', 'zip', 'sweatshirt', 'tee', 't-shirt', 'tshirt', 'shirt', 'polo', 'longsleeve', 'long sleeve', 'sweater', 'knit', 'crewneck', 'top']],
  ];
  static guessGarment(...texts) {
    const s = ' ' + texts.filter(Boolean).join(' ').toLowerCase() + ' ';
    for (const [g, keys] of App.GARMENT_RULES)
      if (keys.some(k => s.includes(k))) return g;
    return '';
  }

  /* ── Бренд по названию: свои шаблоны + известные бренды + алиасы ── */
  static BRAND_LIST = [
    'Balenciaga', 'Vetements', 'Rick Owens', 'Chrome Hearts', 'MM6 Maison Margiela', 'Maison Margiela',
    'Raf Simons', 'Undercover', 'Yohji Yamamoto', 'Y-3', 'Comme des Garçons', 'Junya Watanabe',
    'Issey Miyake', 'Helmut Lang', 'Number (N)ine', 'Enfants Riches Déprimés', 'Saint Laurent',
    'Y/Project', 'Jean Paul Gaultier', 'Dries Van Noten', 'Ann Demeulemeester', 'Kiko Kostadinov',
    'Martine Rose', 'JW Anderson', 'Boris Bidjan Saberi', 'Julius', 'Guidi',
    'Stone Island', 'C.P. Company', 'Off-White', 'Supreme', 'Palace', 'Stussy', 'Stüssy',
    'A Bathing Ape', 'Bape', 'Kapital', 'Needles', 'Visvim', 'Acne Studios', 'Our Legacy',
    "Arc'teryx", 'Salomon', 'Diesel', 'Amiri', 'Gallery Dept', 'Denim Tears', 'Cactus Jack',
    'Corteiz', 'Trapstar', 'Represent', 'Cole Buxton', 'Fear of God', 'Essentials',
    'Prada', 'Gucci', 'Dior', 'Givenchy', 'Celine', 'Bottega Veneta', 'Louis Vuitton',
    'Burberry', 'Versace', 'Fendi', 'Loewe', 'Miu Miu', 'Moncler', 'Canada Goose',
    'Nike', 'Jordan', 'Adidas', 'New Balance', 'Asics', 'Converse', 'Vans', 'Carhartt', 'The North Face',
  ];
  static BRAND_ALIASES = {
    'drkshdw':    'Rick Owens',
    'рик оуэнс':  'Rick Owens',
    'баленсиага': 'Balenciaga',
    'ветементс':  'Vetements',
    'марджела':   'Maison Margiela',
    'cdg':        'Comme des Garçons',
    'erd':        'Enfants Riches Déprimés',
    'ysl':        'Saint Laurent',
    'tnf':        'The North Face',
    'nb':         'New Balance',
    'mm6':        'MM6 Maison Margiela',
    'fog':        'Fear of God',
  };

  _autoBrand() {
    const el = document.getElementById('fieldBrand');
    if (!el || el.value.trim() || this._brandManual) return;
    const name = ' ' + (document.getElementById('fieldName')?.value || '').toLowerCase() + ' ';
    if (!name.trim()) return;
    const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const bound = kw => new RegExp(`(^|[^a-zа-яё0-9])${escRe(kw.toLowerCase())}([^a-zа-яё0-9]|$)`, 'i');
    // Свои шаблоны и бренды товаров — приоритетнее общего списка;
    // длинные раньше коротких («MM6 Maison Margiela» прежде «Maison Margiela»)
    const known = [...new Set([
      ...(this.brands || []).map(b => b.name),
      ...this.items.map(i => (i.brand || '').trim()).filter(Boolean),
      ...App.BRAND_LIST,
    ])].sort((a, b) => b.length - a.length);
    let hit = known.find(b => bound(b).test(name));
    if (!hit) {
      for (const [alias, brand] of Object.entries(App.BRAND_ALIASES))
        if (bound(alias).test(name)) { hit = brand; break; }
    }
    if (hit) el.value = hit;
  }

  /* ── Категория по названию: ключевые слова (en+ru) ↔ имя заведённой категории ── */
  static CAT_KEYWORDS = {
    'зип':      ['zip', 'зип'],
    'худи':     ['hoodie', 'hoody', 'худи'],
    'свитшот':  ['sweatshirt', 'crewneck', 'свитшот'],
    'футболк':  ['tee', 't-shirt', 'tshirt', 'футболк'],
    'лонгслив': ['longsleeve', 'long sleeve', 'лонгслив'],
    'рубашк':   ['shirt', 'рубашк'],
    'поло':     ['polo', 'поло'],
    'свитер':   ['sweater', 'knit', 'свитер'],
    'джемпер':  ['jumper', 'джемпер'],
    'штан':     ['pants', 'trousers', 'sweatpants', 'штан'],
    'брюк':     ['pants', 'trousers', 'брюк'],
    'джинс':    ['jeans', 'denim', 'джинс'],
    'шорт':     ['shorts', 'шорт'],
    'юбк':      ['skirt', 'юбк'],
    'курт':     ['jacket', 'курт'],
    'бомбер':   ['bomber', 'бомбер'],
    'пухов':    ['puffer', 'пухов'],
    'пальто':   ['coat', 'пальто'],
    'ветровк':  ['windbreaker', 'ветровк'],
    'жилет':    ['vest', 'жилет'],
    'кроссовк': ['sneaker', 'runner', 'кроссовк'],
    'ботинк':   ['boot', 'ботинк'],
    'кед':      ['кед'],
    'кепк':     ['cap', 'кепк'],
    'шапк':     ['beanie', 'шапк'],
    'носк':     ['socks', 'носк'],
    'сумк':     ['bag', 'сумк'],
    'рюкзак':   ['backpack', 'рюкзак'],
    'ремен':    ['belt', 'ремен'],
    'ремн':     ['belt', 'ремн'],
    'очк':      ['sunglasses', 'очк'],
    'цеп':      ['chain', 'цеп'],
    'кольц':    ['кольц'],
  };

  _autoCategory() {
    const sel = document.getElementById('fieldCategory');
    if (!sel || sel.value || this._catManual) return;
    const name = ' ' + (document.getElementById('fieldName')?.value || '').toLowerCase() + ' ';
    if (!name.trim()) return;
    let best = null, bestScore = 0;
    for (const c of this.categories || []) {
      const cn = (c.name || '').toLowerCase();
      if (!cn) continue;
      let score = 0;
      if (name.includes(cn)) score += 100 + cn.length;   // имя категории прямо в названии
      for (const [stem, kws] of Object.entries(App.CAT_KEYWORDS)) {
        if (!cn.includes(stem)) continue;
        if (kws.some(k => name.includes(k))) score += 10 + stem.length;
      }
      if (c.parentId) score += 1;   // «Зип-худи» точнее, чем родительская «Худи»
      if (score > bestScore) { bestScore = score; best = c; }
    }
    if (best && bestScore >= 10) {
      sel.value = best.id;
      this._autoGarment();   // выбранная категория уточняет и тип одежды
    }
  }

  /* Автопроставление в форме: только пока тип пуст и не выбирался вручную */
  _autoGarment() {
    const sel = document.getElementById('fieldGarment');
    if (!sel || sel.value || this._garmentManual) return;
    const catSel  = document.getElementById('fieldCategory');
    const catName = catSel?.options[catSel.selectedIndex]?.text || '';
    const guess   = App.guessGarment(catName, document.getElementById('fieldName')?.value);
    if (guess) sel.value = guess;
  }

  // Человекочитаемая подпись контент-блока для журнала
  _blockLabel(b) {
    const TYPE = { banner: 'баннер', weekly: 'товары недели', duo: 'двойной баннер',
                   statement: 'слоган', marquee: 'бегущая строка', text: 'текст', promo: 'промо-полоса', popup: 'попап при входе', cover: 'обложка раздела' };
    const label = String(b.heading || b.text || '').replace(/\n/g, ' ').trim().slice(0, 40);
    return `Блок (${TYPE[b.type] || b.type})${label ? ` «${label}»` : ''}`;
  }

  async saveItem() {
    if (this._saving) return;
    const name = document.getElementById('fieldName').value.trim();
    if (!name) { this.toast('Укажите наименование товара'); return; }
    this._saving = true;

    const isNew  = !this.editingItemId;
    const oldShowOnSite = !isNew && !!this.items.find(i => i.id === this.editingItemId)?.showOnSite;
    const sizes  = this._sizes.filter(s => s.size.trim() || (s.qty || 0) > 0);
    const totQty = sizes.reduce((s, r) => s + (parseInt(r.qty) || 0), 0);
    const item   = {
      ...(isNew ? {} : { id: this.editingItemId }),
      name,
      sizes,
      quantity:    totQty,
      price:        parseFloat(document.getElementById('fieldPrice').value)        || 0,
      oldPrice:     parseFloat(document.getElementById('fieldOldPrice').value)     || 0,
      buyPrice:     parseFloat(document.getElementById('fieldBuyPrice').value)     || 0,
      deliveryCost: parseFloat(document.getElementById('fieldDeliveryCost').value) || 0,
      notes:       document.getElementById('fieldNotes').value.trim(),
      ownerId:     this._selOwner  || null,
      orderStatus: this._selStatus || 'ordered',
      isMonarc:    document.getElementById('fieldIsMonarc').checked,
      showOnSite:   document.getElementById('fieldShowOnSite').checked,
      showOnAvito:  document.getElementById('fieldShowOnAvito').checked,
      description:  document.getElementById('fieldSiteDesc').value.trim(),
      measurements: document.getElementById('fieldMeasurements').value.trim(),
      photos:       this._photos.map(p => p.full),
      thumbs:       this._photos.map(p => p.thumb),
      photo:        this._photos[0]?.full || null,
      categoryId:  document.getElementById('fieldCategory').value || null,
      // Тип одежды: не выбран — определяем по категории и названию
      garment:     document.getElementById('fieldGarment').value ||
                   App.guessGarment(
                     document.getElementById('fieldCategory').selectedOptions[0]?.text,
                     name) || null,
      brand:       document.getElementById('fieldBrand').value.trim() || null,
      condition:   document.getElementById('fieldCondition').value || null,
      sex:         document.getElementById('fieldSex').value || null,
      _updatedBy:  null,
    };

    try {
      const saved = await this.db.saveItem(item);
      // Редактирование логирует сервер — с точным диффом «что изменилось».
      // Здесь — только создание, сразу с ключевыми параметрами.
      if (isNew) {
        const st = STATUSES.find(s => s.id === item.orderStatus)?.label || '';
        await this.db.logAction('item_add',
          `Добавлен товар: «${name}» · ${fmtMoney(item.price)}${totQty ? ` · ${totQty} шт` : ''}${st ? ` · ${st}` : ''}${item.brand ? ` · ${item.brand}` : ''}`,
          { id: saved.id, name, quantity: totQty, price: item.price });
      }
      // Появление/уход товара с публичной витрины — отдельная строка в журнале
      if (!!item.showOnSite !== oldShowOnSite) {
        await this.db.logAction('site_item', item.showOnSite
          ? `Товар «${name}» показан на витрине сайта`
          : `Товар «${name}» скрыт с витрины сайта`);
      }
      await this.loadData();
      this.closeModal('itemModal');
      this.renderInventoryList();
      this.toast(isNew ? 'Товар добавлен ✓' : 'Товар обновлён ✓');
    } catch (e) {
      this.toast('Ошибка сохранения — проверьте соединение');
    } finally {
      this._saving = false;   // иначе после ошибки кнопка «Сохранить» умирает
    }
  }

  /* ──────────────────────────────────────────
     FINANCE VIEW
     ────────────────────────────────────────── */
  async renderFinance() {
    const el = document.getElementById('financeContent');
    el.innerHTML = `<div class="ov-skel">
      <div class="skel-block" style="height:190px"></div>
      <div class="skel-row"><div class="skel-block" style="height:70px"></div><div class="skel-block" style="height:70px"></div><div class="skel-block" style="height:70px"></div></div>
      <div class="skel-block" style="height:140px"></div>
    </div>`;
    // Сотрудник видит только свой счёт: карточка-зарплата + операции + продажи
    if (this.currentUser?.role !== 'root') return this._renderFinanceEmployee();
    document.querySelector('#view-finance .view-title').textContent = 'Счёт компании';
    const [payments, empPayments, plans, sales] = await Promise.all([
      this.db.getPayments(),
      this.owners.length ? this.db.getEmployeePayments() : Promise.resolve([]),
      this.db.getPlans(),
      this.db.getSales(),
    ]);
    if (this.currentView !== 'finance') return;

    const payBalance   = payments.reduce((s, p) =>
      p.type === 'deposit' ? s + (p.amount || 0) : s - (p.amount || 0), 0);
    const salesProfit  = sales.reduce((s, x) => s + (x.netProfit || 0), 0);
    // Расходы сотрудников из своих = долг компании перед ними.
    // Пока не погашен — это просто задолженность (в бюджет НЕ вычитается).
    // Когда «Погасить долги» — помечаются reimbursed и вычитаются из бюджета.
    const pendingDebt = empPayments.reduce((s, p) => (p.isExpense && !p.reimbursed) ? s + (p.amount || 0) : s, 0);
    const paidDebt    = empPayments.reduce((s, p) => (p.isExpense &&  p.reimbursed) ? s + (p.amount || 0) : s, 0);
    const balance = payBalance + salesProfit - paidDebt;
    const pos = balance >= 0;

    // Остаток средств сотрудника = пополнения (начисления) − выплаты.
    // Расходы из своих в остаток не входят — они идут в бюджет компании.
    const empBals = {};
    empPayments.forEach(p => {
      if (p.isExpense) return;
      empBals[p.ownerId] = (empBals[p.ownerId] || 0) +
        (p.type === 'credit' ? (p.amount || 0) : -(p.amount || 0));
    });

    const payHistHtml = payments.length
      ? `<div class="section-title">Операции</div>
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

    // Нерассчитанные доли с продаж: сколько компания должна каждому за его
    // проданные вещи (закуп + доставка + % прибыли; продажи без sharePaid)
    const dueByOwner = {};
    sales.forEach(s => {
      if (!s.ownerId || s.sharePaid) return;
      const o = this.owners.find(x => x.id === s.ownerId);
      if (!o) return;
      const share = ((s.buyPrice || 0) + (s.deliveryCost || 0)) * (s.qty || 1) +
                    (s.netProfit || 0) * (o.profitPercent || 0) / 100;
      const d = dueByOwner[s.ownerId] || (dueByOwner[s.ownerId] = { sum: 0, cnt: 0 });
      d.sum += share; d.cnt++;
    });

    // Сколько компания должна сотрудникам: остатки на их счетах (начислено,
    // но не выплачено) + ещё не рассчитанные доли с продаж их вещей
    const empOwed  = Object.values(empBals).reduce((s, v) => s + Math.max(0, v), 0);
    const dueTotal = Math.round(Object.values(dueByOwner).reduce((s, d) => s + d.sum, 0));

    const empSectionHtml = this.owners.length
      ? `<div class="section-title">Сотрудники</div>
         <div class="emp-bal-list">${this.owners.map(o => {
           const bal = empBals[o.id] || 0;
           const ep  = bal >= 0;
           const due = dueByOwner[o.id];
           const dueSum = due ? Math.round(due.sum) : 0;
           return `<div class="emp-bal-card" data-owner-id="${o.id}">
             <div class="emp-bal-avatar" style="background:${o.color}">${o.name[0].toUpperCase()}</div>
             <div class="emp-bal-info">
               <div class="emp-bal-name">${this.esc(o.name)}</div>
               ${dueSum > 0 ? `<div class="emp-bal-due" title="Старые продажи, сделанные до автоначисления — откройте карточку сотрудника">Не начислено со старых продаж: <b>${fmtMoney(dueSum)}</b> · ${due.cnt} прод.</div>` : ''}
             </div>
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

    const totalRevenue  = sales.reduce((s, x) => s + (x.salePrice     || 0), 0);
    const totalCosts    = sales.reduce((s, x) => s + (x.buyPrice || 0) + (x.deliveryCost || 0), 0);
    const totalProfit   = sales.reduce((s, x) => s + (x.netProfit    || 0), 0);
    const profitPos     = totalProfit >= 0;

    const salesListHtml = sales.length
      ? `<div class="sales-list">${sales.map(s => `
          <div class="sale-entry">
            <div class="sale-entry-info">
              <div class="sale-entry-name">${this.esc(s.itemName)}${s.size ? ` · ${this.esc(s.size)}` : ''}</div>
              <div class="sale-entry-meta">${this.fmtDate(s.soldAt)}${s.note ? ` · ${this.esc(s.note)}` : ''}</div>
            </div>
            <div class="sale-entry-right">
              <div class="sale-entry-profit ${(s.netProfit||0) >= 0 ? 'pos' : 'neg'}">${(s.netProfit||0) >= 0 ? '+' : ''}${fmtMoney(s.netProfit||0)}</div>
              <div class="sale-entry-revenue">${fmtMoney(s.salePrice||0)}</div>
            </div>
            <button class="pay-del" data-sale-id="${s.id}">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>`).join('')}
        </div>`
      : `<div class="plan-empty">Нет записей продаж</div>`;

    const salesStatsHtml = `
      <div class="sales-summary">
        <div class="sales-stat-card">
          <div class="sales-stat-label">Выручка</div>
          <div class="sales-stat-val" data-count="${totalRevenue}" data-fmt="money">0 ₽</div>
        </div>
        <div class="sales-stat-card">
          <div class="sales-stat-label">Издержки</div>
          <div class="sales-stat-val neg">−<span data-count="${totalCosts}" data-fmt="money">0 ₽</span></div>
        </div>
        <div class="sales-stat-card profit">
          <div class="sales-stat-label">Чистая прибыль</div>
          <div class="sales-stat-val ${profitPos ? 'pos' : 'neg'}">${profitPos ? '+' : '−'}<span data-count="${Math.abs(totalProfit)}" data-fmt="money">0 ₽</span></div>
        </div>
      </div>`;

    /* Детальный список непогашенных долгов — свёрнут, раскрывается по тапу */
    const debtEntries = empPayments.filter(p => p.isExpense && !p.reimbursed);
    const debtDetailHtml = debtEntries.map(p => {
      const o = this.owners.find(x => x.id === p.ownerId);
      return `<div class="debt-detail-row">
        <span class="owner-dot" style="background:${o?.color || '#666'}"></span>
        <div class="debt-detail-info">
          <span class="debt-detail-name">${this.esc(o?.name || p.ownerName || '—')}</span>
          <span class="debt-detail-meta">${p.desc ? this.esc(p.desc) + ' · ' : ''}${this.fmtDate(p.ts)}</span>
        </div>
        <span class="neg">−${fmtMoney(p.amount)}</span>
      </div>`;
    }).join('');

    /* Банковская карта: машинная строка и бинарный след — детерминированы от баланса */
    const binStr = Math.abs(Math.round(balance)).toString(2).padStart(24, '0').slice(-24);
    const mrz1 = 'MASQUCERADE&lt;&lt;INC&lt;&lt;BALANCE&lt;&lt;ACCOUNT&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;';
    const mrz2 = `${binStr}&lt;&lt;${String(new Date().getFullYear())}&lt;RU&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;`;

    el.innerHTML = `
      <div class="fin-hero">
      <div class="fin-hero-main">
      <div class="bank-card">
        <div class="bank-guilloche" aria-hidden="true"></div>
        <div class="bank-holo" aria-hidden="true"></div>
        <div class="bank-card-top">
          <span class="bank-card-brand">MASQUCERADE&nbsp;<b>·&nbsp;INC</b></span>
          <span class="bank-card-icons">
            <svg class="bank-chip" width="26" height="20" viewBox="0 0 26 20" fill="none" stroke="currentColor" stroke-width="1.3">
              <rect x="1" y="1" width="24" height="18" rx="4"/>
              <path d="M9 1v6a2 2 0 0 1-2 2H1M17 1v6a2 2 0 0 0 2 2h6M9 19v-6a2 2 0 0 0-2-2H1M17 19v-6a2 2 0 0 1 2-2h6"/>
            </svg>
            <svg class="bank-nfc" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
              <path d="M6 8.5a7 7 0 0 1 0 7M9.5 6a11 11 0 0 1 0 12M13 3.5a15 15 0 0 1 0 17"/>
            </svg>
          </span>
        </div>
        <div class="bank-card-mid">
          <span class="bank-card-label">Баланс компании</span>
          <div class="bank-card-amount">${pos ? '' : '−'}<span data-count="${Math.abs(balance)}" data-fmt="money">0 ₽</span></div>
        </div>
        <div class="bank-card-row">
          <span class="bank-card-num">01&nbsp;01&nbsp;0001</span>
          <span class="bank-card-holder">ROOT&nbsp;·&nbsp;MONARC</span>
        </div>
        <div class="bank-mrz">${mrz1}<br>${mrz2}</div>
      </div>

      ${(salesProfit || pendingDebt || paidDebt || empOwed || dueTotal) ? `
      <div class="bank-breakdown">
        ${salesProfit ? `<div class="budget-row"><span>Прибыль с продаж</span><span class="pos">+${fmtMoney(salesProfit)}</span></div>` : ''}
        ${paidDebt ? `<div class="budget-row"><span>Погашено сотрудникам</span><span class="neg">−${fmtMoney(paidDebt)}</span></div>` : ''}
        ${empOwed ? `<div class="budget-row"><span title="Начислено сотрудникам, но ещё не выплачено (из бюджета уже вычтено)">На счетах сотрудников · к выплате</span><span class="neg">${fmtMoney(empOwed)}</span></div>` : ''}
        ${dueTotal ? `<div class="budget-row"><span title="Доли сотрудников с продаж их вещей, по которым ещё не нажато «Рассчитать»">Доли с продаж · не рассчитано</span><span class="neg">${fmtMoney(dueTotal)}</span></div>` : ''}
        ${pendingDebt ? `
          <div class="budget-row debt debt-toggle" id="debtToggle">
            <span>Долг сотрудникам
              <svg class="debt-chevron" id="debtChevron" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </span>
            <span class="neg">−${fmtMoney(pendingDebt)}</span>
          </div>
          <div class="debt-details hidden" id="debtDetails">
            ${debtDetailHtml}
            <button class="debt-pay-btn" id="payDebtsBtn">Погасить долги…</button>
          </div>
        ` : ''}
      </div>` : ''}
      </div>
      <div class="fin-hero-side">
        <div class="finance-actions">
          <button class="fin-btn deposit" id="depositBtn">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>Депозит
          </button>
          <button class="fin-btn charge" id="chargeBtn">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>Списание
          </button>
          <button class="fin-btn sell" id="withdrawBtn">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
            </svg>Вывод
          </button>
        </div>
        <div class="section-title">Продажи</div>
        ${salesStatsHtml}
      </div>
      </div>
      <div class="fin-cols">
        <div class="fin-col">
          <div class="section-title">Записи продаж</div>
          ${salesListHtml}
        </div>
        <div class="fin-col">
          ${payHistHtml || '<div class="section-title">Операции</div><div class="plan-empty">Операций пока нет</div>'}
        </div>
        <div class="fin-col">
          ${empSectionHtml}
          ${plansSectionHtml}
        </div>
      </div>
    `;

    runCountUps(el);
    animateSection(el);

    document.getElementById('depositBtn').addEventListener('click', () => this.openPaymentModal('deposit'));
    document.getElementById('chargeBtn').addEventListener('click',  () => this.openPaymentModal('charge'));
    document.getElementById('withdrawBtn').addEventListener('click', () => this.openWithdrawModal());
    document.getElementById('addPlanBtn').addEventListener('click', () => this.openPlanModal());

    /* Тап по строке долга — раскрыть/свернуть детали */
    document.getElementById('debtToggle')?.addEventListener('click', () => {
      const det = document.getElementById('debtDetails');
      const chv = document.getElementById('debtChevron');
      const open = det.classList.toggle('hidden');
      chv.style.transform = open ? '' : 'rotate(180deg)';
    });

    /* Погасить долги — открыть модалку выбора */
    document.getElementById('payDebtsBtn')?.addEventListener('click', () =>
      this.openDebtModal(debtEntries));

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

    el.querySelectorAll('.pay-del[data-sale-id]').forEach(btn =>
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const ok = await this.confirm('Удалить запись продажи?');
        if (!ok) return;
        await this.db.deleteSale(btn.dataset.saleId);
        this.renderFinance();
      })
    );
  }

  /* ──────────────────────────────────────────
     DEBT PAYOFF — выбор долгов для погашения
     ────────────────────────────────────────── */
  openDebtModal(debts) {
    this._debtSelection = new Set(debts.map(d => d.id));   // по умолчанию все
    const list = document.getElementById('debtSelectList');

    list.innerHTML = debts.map(p => {
      const o = this.owners.find(x => x.id === p.ownerId);
      return `<div class="debt-select-row selected" data-debt-id="${p.id}">
        <div class="debt-select-check">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <span class="owner-dot" style="background:${o?.color || '#666'}"></span>
        <div class="debt-detail-info">
          <span class="debt-detail-name">${this.esc(o?.name || p.ownerName || '—')}</span>
          <span class="debt-detail-meta">${p.desc ? this.esc(p.desc) + ' · ' : ''}${this.fmtDate(p.ts)}</span>
        </div>
        <span class="debt-select-amount">−${fmtMoney(p.amount)}</span>
      </div>`;
    }).join('');

    const updateTotal = () => {
      const total = debts.filter(d => this._debtSelection.has(d.id))
                         .reduce((s, d) => s + (Number(d.amount) || 0), 0);
      const btn = document.getElementById('debtModalPay');
      btn.textContent = this._debtSelection.size
        ? `Погасить ${fmtMoney(total)}`
        : 'Выберите долги';
      btn.disabled = !this._debtSelection.size;
    };

    list.onclick = (e) => {
      const row = e.target.closest('[data-debt-id]');
      if (!row) return;
      const id = row.dataset.debtId;
      this._debtSelection.has(id) ? this._debtSelection.delete(id) : this._debtSelection.add(id);
      row.classList.toggle('selected', this._debtSelection.has(id));
      updateTotal();
    };

    document.getElementById('debtModalPay').onclick = async () => {
      if (!this._debtSelection.size) return;
      const ids   = [...this._debtSelection];
      const total = debts.filter(d => ids.includes(d.id))
                         .reduce((s, d) => s + (Number(d.amount) || 0), 0);
      const ok = await this.confirm(`Погасить выбранные долги на ${fmtMoney(total)}? Сумма спишется из бюджета компании.`, 'Погасить', false);
      if (!ok) return;
      try {
        const r = await this.db.reimburseExpenses(ids);
        this.closeModal('debtModal');
        this.toast(`Погашено ${fmtMoney(r.total || 0)} ✓`);
        this.renderFinance();
      } catch (e) { this.toast(e.message || 'Ошибка'); }
    };

    updateTotal();
    this.openModal('debtModal');
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
    const owner    = this.owners.find(o => o.id === ownerId);
    const [payments, allSales] = await Promise.all([
      this.db.getEmployeePayments(ownerId), this.db.getSales()]);
    const empSales = allSales.filter(s => s.ownerId === ownerId)
      .sort((a, b) => new Date(b.soldAt || 0) - new Date(a.soldAt || 0));
    const pct     = owner?.profitPercent || 0;
    const shareOf = s => Math.round(((s.buyPrice || 0) + (s.deliveryCost || 0)) * (s.qty || 1) +
      (s.netProfit || 0) * pct / 100);

    const salary   = payments.reduce((s, p) => p.type === 'credit' && !p.isExpense ? s + (p.amount || 0) : s, 0);
    const debits   = payments.reduce((s, p) => p.type === 'debit'                  ? s + (p.amount || 0) : s, 0);
    const expPending = payments.reduce((s, p) => (p.isExpense && !p.reimbursed) ? s + (p.amount || 0) : s, 0);
    const expPaid    = payments.reduce((s, p) => (p.isExpense &&  p.reimbursed) ? s + (p.amount || 0) : s, 0);
    // Остаток = начисления − выплаты. Расходы из своих — отдельный долг компании.
    const balance  = salary - debits;
    const pos      = balance >= 0;

    const balanceExtra = (expPending || expPaid)
      ? `<div class="emp-bal-split">
           ${expPending ? `<span>${uiIcon('receipt', 11)} ${fmtMoney(expPending)} долг (из своих)</span>` : ''}
           ${expPaid ? `<span>${uiIcon('checkCircle', 11)} ${fmtMoney(expPaid)} возвращено</span>` : ''}
         </div>`
      : '';

    const histHtml = payments.length
      ? `<div class="section-title">История</div>
         <div class="pay-list">${payments.map((p, idx) => {
           const isCredit  = p.type === 'credit';
           const isExpense = p.isExpense;
           const cls = isExpense ? 'expense' : (isCredit ? 'deposit' : 'charge');
           const icon = isExpense ? uiIcon('receipt', 12) : (isCredit ? '+' : '−');
           const defaultDesc = isExpense ? 'Расход из своих' : (isCredit ? 'Пополнение' : 'Списание');
           return `<div class="pay-entry" style="animation-delay:${Math.min(idx*20,180)}ms">
             <div class="pay-icon ${cls}">${icon}</div>
             <div class="pay-info">
               <div class="pay-desc">${this.esc(p.desc || defaultDesc)}</div>
               <div class="pay-time">${this.fmtDate(p.ts)}</div>
             </div>
             ${isExpense
               ? `<div class="pay-amount-col">
                    <div class="pay-amount expense">${fmtMoney(p.amount)}</div>
                    <div class="pay-return-label">${p.reimbursed ? 'возвращено ✓' : 'долг'}</div>
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
        <div class="balance-label">Остаток средств</div>
        <div class="balance-amount ${pos ? 'pos' : 'neg'}">${pos ? '' : '−'}<span data-count="${Math.abs(balance)}" data-fmt="money">0 ₽</span></div>
        ${balanceExtra}
      </div>
      <div class="finance-actions" style="grid-template-columns:1fr 1fr">
        <button class="fin-btn deposit" id="empCreditBtn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>Пополнение
        </button>
        <button class="fin-btn charge" id="empDebitBtn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>Списание
        </button>
      </div>
      ${empSales.length ? (() => {
        const pending = empSales.filter(s => !s.sharePaid);   // старые продажи до автоначисления
        const done    = empSales.filter(s => s.sharePaid);
        const row = s => `
          <div class="emp-sale-row${s.sharePaid ? ' settled' : ''}" data-sale="${s.id}">
            <div class="emp-sale-info">
              <div class="emp-sale-name">${this.esc(s.itemName)}${s.size ? ` · ${this.esc(s.size)}` : ''}</div>
              <div class="emp-sale-meta">${this.fmtDate(s.soldAt)} · за ${fmtMoney(s.salePrice || 0)}${
                s.shareAuto ? ' · начислено ✓' : s.sharePaid ? ' · рассчитано ✓' : ' · не начислено'}</div>
            </div>
            <div class="emp-sale-share">${fmtMoney(s.shareAmount || shareOf(s))}</div>
            ${s.shareAuto ? '' : `<button class="emp-sale-mark" data-mark="${s.id}" data-paid="${s.sharePaid ? 0 : 1}"
              title="${s.sharePaid ? 'Вернуть в «не начислено»' : 'Пометить рассчитанной — если за эту продажу уже платили вне панели'}">
              ${s.sharePaid
                ? '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.5 15a9 9 0 1 0 2.1-9.4L1 10"/></svg>'
                : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'}
            </button>`}
          </div>`;
        return `
      <div class="section-title" style="margin-top:16px">Продажи${pct ? ` <em style="font-style:normal;font-size:11px;color:var(--text3)">· доля: закуп + ${pct}% прибыли</em>` : ''}</div>
      <div class="emp-sale-list">
        ${pending.length ? `<div class="emp-sale-hint">Старые продажи (до автоначисления): доля не попала на счёт — отметьте ✓, если уже платили вне панели</div>` : ''}
        ${pending.map(row).join('')}
        ${done.length ? `<div class="emp-sale-divider">начислено</div>${done.map(row).join('')}` : ''}
      </div>` ;
      })() : ''}
      ${histHtml}
    `;

    el.querySelectorAll('.emp-sale-mark').forEach(btn =>
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const toPaid = btn.dataset.paid === '1';
        const s = empSales.find(x => x.id === btn.dataset.mark);
        const q = toPaid
          ? `Пометить «${s?.itemName}» рассчитанной БЕЗ выплаты? Доля ${fmtMoney(shareOf(s))} не будет начислена — только если вы уже платили вне панели.`
          : `Вернуть «${s?.itemName}» в «к выплате»? Доля ${fmtMoney(shareOf(s))} снова станет доступна для расчёта — проверьте, что она не была выплачена.`;
        if (!await this.confirm(q, toPaid ? 'Пометить' : 'Вернуть', false)) return;
        try {
          await this.db.markSaleShare(s.id, toPaid);
          this.toast(toPaid ? 'Помечена рассчитанной (без выплаты)' : 'Возвращена в «к выплате»');
          await this.renderEmpModal(ownerId);
          this.renderFinance();
        } catch (err) { this.toast(err.message || 'Ошибка'); }
      })
    );

    runCountUps(el);
    animateSection(el);

    document.getElementById('empCreditBtn').addEventListener('click', () =>
      this.openPaymentModal('credit', ownerId)
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
    const titles = { deposit: 'Депозит', charge: 'Выставить счёт', credit: 'Пополнение', debit: 'Списание', expense: 'Расход из своих' };
    const saves  = { deposit: 'Добавить', charge: 'Выставить',      credit: 'Пополнить', debit: 'Списать', expense: 'Записать' };
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
    if (this._savingPay) return;   // дабл-клик = дубль записи
    this._savingPay = true;
    const desc = document.getElementById('paymentDesc').value.trim();
    const isExpense = this._currentPayType === 'expense';
    const sign = (this._currentPayType === 'deposit' || this._currentPayType === 'credit' || isExpense) ? '+' : '−';

    try {
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
    } catch (e) {
      this.toast('Ошибка — проверьте соединение');
    } finally {
      this._savingPay = false;
    }
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
          <div class="owner-sub">${cntMap[o.id] || 0} шт · ${fmtMoney(valMap[o.id] || 0)}${o.profitPercent ? ` · ${o.profitPercent}% с продажи` : ''}</div>
        </div>
        <div class="owner-card-actions">
          <button class="btn-icon-sm edit-owner" data-id="${o.id}">${uiIcon('edit', 13)}</button>
          <button class="btn-icon-sm danger del-owner" data-id="${o.id}">${uiIcon('trash', 13)}</button>
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
    document.getElementById('ownerPercent').value                  = '';
    document.getElementById('ownerAvatarPreview').textContent      = 'А';
    document.getElementById('ownerAvatarPreview').style.background = DEFAULT_COLOR;
    document.getElementById('ownerModalTitle').textContent         = id ? 'Изменить сотрудника' : 'Новый сотрудник';

    document.getElementById('colorPicker').innerHTML = OWNER_COLORS.map(c =>
      `<div class="color-dot ${c === DEFAULT_COLOR ? 'selected' : ''}" data-color="${c}" style="background:${c}"></div>`
    ).join('');

    if (id) {
      const owner = this.owners.find(o => o.id === id);
      if (owner) {
        document.getElementById('ownerName').value                     = owner.name;
        document.getElementById('ownerPercent').value                  = owner.profitPercent ?? '';
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
    if (!name) { this.toast('Введите имя сотрудника'); return; }
    const isNew = !this.editingOwnerId;
    const pct   = Math.min(100, Math.max(0, parseFloat(document.getElementById('ownerPercent').value) || 0));
    const owner = {
      ...(isNew ? {} : { id: this.editingOwnerId }),
      name,
      color: this._selColor,
      profitPercent: pct,
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
    el.innerHTML = `<div class="ov-skel">
      <div class="skel-block" style="height:96px"></div>
      <div class="skel-row"><div class="skel-block" style="height:76px"></div><div class="skel-block" style="height:76px"></div></div>
      <div class="skel-block" style="height:180px"></div>
    </div>`;
    const [allItems, sales, visits] = await Promise.all([
      this.db.getItems(), this.db.getSales(), this.db.getSiteVisits()]);
    if (this.currentView !== 'stats') return;
    // Завершённые (проданные) товары не учитываются в деньгах и складе —
    // их выручка живёт в «Продажах». В статистике остаются только активные.
    const items = allItems.filter(i => i.orderStatus !== 'done');

    if (!allItems.length) {
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

    const hideCosts = !!this.currentUser?.hideCosts && this.currentUser?.role !== 'root';
    const byStatus = {}, byOwner = {}, byType = {};
    // Бар «по статусам» — по всем товарам (штуки, «Завершено» отдельной строкой).
    // Забронированные штуки учитываются как «В заказе» — они уже заняты клиентами
    allItems.forEach(i => {
      const rsv = (i.sizes || []).reduce((s, x) => s + this.rsvQty(x), 0);
      byStatus[i.orderStatus] = (byStatus[i.orderStatus] || 0) + Math.max(0, (i.quantity || 0) - rsv);
      if (rsv) byStatus.processing = (byStatus.processing || 0) + rsv;
    });
    items.forEach(i => {
      const qty = i.quantity || 0;
      // Товары бренда Monarc без владельца — отдельной строкой «Monarc»
      const k = i.ownerId || (i.isMonarc ? '__monarc__' : '__none__');
      if (!byOwner[k]) byOwner[k] = { qty: 0, val: 0, cnt: 0, share: 0, cost: 0 };
      byOwner[k].qty += qty;
      byOwner[k].val += (i.total || 0);
      byOwner[k].cnt++;
      // Деньги владельца: тело (закуп + доставка) + его % от чистой прибыли.
      // Вещи бренда Monarc — целиком владельцу, без дележа.
      if (i.ownerId) {
        const cost = (i.buyPrice || 0) + (i.deliveryCost || 0);
        byOwner[k].cost += qty * cost;                      // чистый закуп инвестора
        if (i.isMonarc) {
          byOwner[k].share += (i.total || 0);
        } else {
          const pct = this.owners.find(o => o.id === i.ownerId)?.profitPercent || 0;
          byOwner[k].share += qty * (cost + ((i.price || 0) - cost) * pct / 100);
        }
      }
      const catName = this.categories.find(c => c.id === i.categoryId)?.name;
      if (catName) {
        if (!byType[catName]) byType[catName] = { qty: 0, val: 0 };
        byType[catName].qty += qty;
        byType[catName].val += (i.total || 0);
      }
    });

    /* У владельца показываем его деньги (тело + % прибыли); «Monarc» и
       «Без владельца» — полная стоимость (это вещи компании).
       Пользователям без закупа — как раньше. */
    const ownerDisp = (oid, v) =>
      (oid !== '__none__' && oid !== '__monarc__' && !hideCosts) ? v.share : v.val;
    const maxSt  = Math.max(...Object.values(byStatus), 1);
    const maxOwV = Math.max(...Object.entries(byOwner).map(([k, v]) => ownerDisp(k, v)), 1);
    const maxTyQ = Math.max(...Object.values(byType).map(v => v.qty), 1);

    const noData = '<span style="font-size:14px;color:var(--hint)">Нет данных</span>';

    const statusBars = STATUSES.filter(s => byStatus[s.id]).map(s => {
      const qty = byStatus[s.id];
      return `<div class="bar-row">
        <span class="bar-label">${s.icon} ${s.label}</span>
        <div class="bar-track"><div class="bar-fill" data-w="${Math.round(qty/maxSt*100)}" style="width:0;background:${s.color}"></div></div>
        <span class="bar-count">${qty} шт</span>
      </div>`;
    }).join('') || noData;

    const ownerRows = Object.entries(byOwner)
      .sort((a, b) => ownerDisp(b[0], b[1]) - ownerDisp(a[0], a[1]))
      .map(([oid, v]) => {
        const o = this.owners.find(o => o.id === oid);
        const n = o ? o.name : (oid === '__monarc__' ? 'Monarc' : 'Без владельца');
        const c = o ? o.color : (oid === '__monarc__' ? '#a1a1aa' : '#6b7280');
        const pct  = o?.profitPercent || 0;
        const disp = ownerDisp(oid, v);
        return `<div class="owner-stat-row">
          <div class="owner-stat-avatar" style="background:${c}">${n[0].toUpperCase()}</div>
          <div class="owner-stat-info">
            <div class="owner-stat-name">${this.esc(n)}${pct ? ` <em style="font-style:normal;font-size:11px;color:var(--text3)">· ${pct}%</em>` : ''}</div>
            <div class="bar-track" style="margin-top:5px">
              <div class="bar-fill" data-w="${Math.round(disp/maxOwV*100)}" style="width:0;background:${c}"></div>
            </div>
          </div>
          <div style="text-align:right;flex-shrink:0">
            <div style="font-size:14px;font-weight:700;color:var(--text)">${o && !hideCosts
              ? `<span title="Чистый закуп: ${fmtMoney(Math.round(v.cost))}">${fmtMoney(Math.round(disp))}</span>${Math.round(disp) !== Math.round(v.val)
                  ? ` <span style="font-weight:500;font-size:12px;color:var(--text3)">/ ${fmtMoney(v.val)}</span>` : ''}`
              : fmtMoney(Math.round(disp))}</div>
            <div style="font-size:11px;color:var(--hint)">${v.qty} шт · ${v.cnt} поз</div>
          </div>
        </div>`;
      }).join('') || noData;

    const typeSorted = Object.entries(byType).sort((a, b) => b[1].qty - a[1].qty);
    const typeRows   = typeSorted.map(([t, v]) =>
      `<div class="bar-row">
        <span class="bar-label">${this.esc(t)}</span>
        <div class="bar-track"><div class="bar-fill" data-w="${Math.round(v.qty/maxTyQ*100)}" style="width:0;background:var(--accent)"></div></div>
        <span class="bar-count">${v.qty} шт / ${fmtMoney(v.val)}</span>
      </div>`
    ).join('');

    /* ── Продажи в разрезах: категория и владелец (снимок из продажи, иначе — по товару) ──
       Ищем и среди завершённых: старые продажи ссылаются на проданные товары */
    const itemById = Object.fromEntries(allItems.map(i => [i.id, i]));
    const saleCat  = s => s.categoryId !== undefined ? s.categoryId : (itemById[s.itemId]?.categoryId ?? null);
    const saleOwn  = s => s.ownerId    !== undefined ? s.ownerId    : (itemById[s.itemId]?.ownerId    ?? null);
    const group = (keyFn, nameFn, pctFn = null) => {
      const m = {};
      const isOwnerGroup = !!pctFn;
      sales.forEach(s => {
        const k = keyFn(s) || '__none__';
        if (!m[k]) {
          const pct = pctFn ? pctFn(k) : 0;
          m[k] = { name: nameFn(k), pct, cnt: 0, revenue: 0, profit: 0, share: 0 };
        }
        m[k].cnt     += Math.max(1, parseInt(s.qty) || 1);
        m[k].revenue += s.salePrice || 0;
        m[k].profit  += s.netProfit || 0;
        // Владельцу вещи: возврат вложений (закуп + доставка) сразу
        // + его % от чистой прибыли
        if (isOwnerGroup && k !== '__none__')
          m[k].share += (s.buyPrice || 0) + (s.deliveryCost || 0) +
                        (s.netProfit || 0) * m[k].pct / 100;
      });
      return Object.values(m).sort((a, b) => b.revenue - a.revenue);
    };
    const salesByCat = group(saleCat, k =>
      k === '__none__' ? 'Без категории' : (this.categories.find(c => c.id === k)?.name || 'Удалённая категория'));
    const salesByOwn = group(saleOwn,
      k => k === '__none__' ? 'Без владельца' : (this.owners.find(o => o.id === k)?.name || '—'),
      k => this.owners.find(o => o.id === k)?.profitPercent || 0);
    const salesRows = list => {
      const maxR = Math.max(...list.map(v => v.revenue), 1);
      return list.map(v => `<div class="bar-row">
        <span class="bar-label">${this.esc(v.name)}${v.pct ? ` <em style="font-style:normal;color:var(--text3);font-size:11px">· ${v.pct}%</em>` : ''}</span>
        <div class="bar-track"><div class="bar-fill" data-w="${Math.round(v.revenue/maxR*100)}" style="width:0;background:var(--accent2)"></div></div>
        <span class="bar-count">${v.cnt} шт · ${fmtMoney(v.revenue)}${v.profit ? ` · +${fmtMoney(v.profit)}` : ''}${v.share ? ` · доля ${fmtMoney(Math.round(v.share))}` : ''}</span>
      </div>`).join('');
    };
    // Сводная доля всех участников — видно, сколько причитается команде
    const totalShare = salesByOwn.reduce((s, v) => s + (v.share || 0), 0);

    el.innerHTML = `
      <div class="stats-hero">
        <div class="stat-label">Общая стоимость склада</div>
        <div class="stats-hero-value" data-count="${totalVal}" data-fmt="money">0 ₽</div>
      </div>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value" data-count="${items.length}">0</div>
          <div class="stat-label">Позиций</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" data-count="${totalQty}">0</div>
          <div class="stat-label">Штук всего</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" data-count="${items.filter(i => i.orderStatus === 'in_stock').reduce((s, i) => s + (i.quantity || 0), 0)}">0</div>
          <div class="stat-label">В наличии, шт</div>
        </div>
        ${(() => {
          // Воронка сайта — по всем товарам: у проданных просмотры тоже копятся (архив)
          const views  = allItems.reduce((s, i) => s + (i.views || 0), 0);
          const clicks = allItems.reduce((s, i) => s + (i.tgClicks || 0), 0);
          const conv   = views ? Math.round(clicks / views * 1000) / 10 : 0;
          return `
        <div class="stat-card">
          <div class="stat-value" data-count="${views}">0</div>
          <div class="stat-label">Просмотры на сайте</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" data-count="${clicks}">0</div>
          <div class="stat-label">Заявки в TG${views && clicks ? ` · ${conv}%` : ''}</div>
        </div>`;
        })()}
        ${visits ? `
        <div class="stat-card">
          <div class="stat-value" data-count="${visits.today.hits}">0</div>
          <div class="stat-label">Просмотры сегодня</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" data-count="${visits.today.uniq}">0</div>
          <div class="stat-label">Уникальные сегодня</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" data-count="${visits.total30.uniq}">0</div>
          <div class="stat-label">Уникальные · 30 дней</div>
        </div>` : ''}
        <div class="stat-card wide">
          <div class="stat-value" data-count="${avgPrice}" data-fmt="money">0 ₽</div>
          <div class="stat-label">Средняя цена за штуку</div>
        </div>
      </div>
      <div class="section-title">По статусам</div>
      <div class="stats-section">${statusBars}</div>
      <div class="section-title">По владельцам</div>
      <div class="stats-section">${ownerRows}</div>
      ${typeSorted.length ? `<div class="section-title">По категориям</div><div class="stats-section">${typeRows}</div>` : ''}
      ${sales.length ? `
        <div class="section-title">Продажи · по категориям</div>
        <div class="stats-section">${salesRows(salesByCat)}</div>
        <div class="section-title">Продажи · по владельцам</div>
        <div class="stats-section">${salesRows(salesByOwn)}
          ${totalShare ? `<div class="bar-row" style="border-top:1px solid var(--sep2);padding-top:10px;margin-top:6px">
            <span class="bar-label" style="color:var(--text2)">Доля участников итого</span>
            <div class="bar-track" style="visibility:hidden"></div>
            <span class="bar-count" style="font-weight:700;color:var(--text)">${fmtMoney(Math.round(totalShare))}</span>
          </div>` : ''}
        </div>` : ''}
    `;

    runCountUps(el);
    animateSection(el);
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
     PROFILE — личная страница пользователя:
     профиль + смена пароля + свои финансы;
     сотрудникам сюда же переезжает «Проект»
     ────────────────────────────────────────── */
  async renderProfile() {
    const head = document.getElementById('profileHead');
    if (!head) return;
    const u = this.currentUser || {};
    const isRoot = u.role === 'root';
    const hideCosts = !!u.hideCosts && !isRoot;

    // Финансы: пользователь ↔ участник по совпадению имени (как в задачах)
    const owner = (this.owners || []).find(o =>
      (o.name || '').toLowerCase() === (u.name || '').toLowerCase());
    let finHtml = '';
    if (owner && !hideCosts) {
      const pct = owner.profitPercent || 0;
      let cost = 0, share = 0, val = 0;
      (this.items || []).filter(i => i.ownerId === owner.id && i.orderStatus !== 'done').forEach(i => {
        const qty = i.quantity || 0;
        const c   = (i.buyPrice || 0) + (i.deliveryCost || 0);
        cost += qty * c;
        val  += (i.total || 0);
        share += i.isMonarc ? (i.total || 0) : qty * (c + ((i.price || 0) - c) * pct / 100);
      });
      const sales = (await this.db.getSales()).filter(s => s.ownerId === owner.id);
      const soldSum   = sales.reduce((s, x) => s + (x.salePrice || 0) * (x.qty || 1), 0);
      const soldShare = sales.reduce((s, x) => s + ((x.buyPrice || 0) + (x.deliveryCost || 0)) * (x.qty || 1)
        + (x.netProfit || 0) * pct / 100, 0);
      finHtml = `
        <div class="section-title">Мои финансы${pct ? ` <em style="font-style:normal;font-size:11px;color:var(--text3)">· ${pct}% от прибыли</em>` : ''}</div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value" data-count="${Math.round(share)}" data-fmt="money">0 ₽</div>
            <div class="stat-label">Получу при продаже всего</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" data-count="${Math.round(val)}" data-fmt="money">0 ₽</div>
            <div class="stat-label">На витрине по ценам продажи</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" data-count="${Math.round(soldShare)}" data-fmt="money">0 ₽</div>
            <div class="stat-label">Заработано с продаж (${sales.length} шт на ${fmtMoney(soldSum)})</div>
          </div>
        </div>`;
    }

    head.innerHTML = `
      <div class="account-hero" style="margin-bottom:14px">
        <div class="account-hero-avatar">${(u.name || u.login || '?')[0].toUpperCase()}</div>
        <div class="account-hero-info">
          <div class="account-hero-name">${this.esc(u.name || '')}</div>
          <div class="account-hero-role">
            <span class="account-badge ${isRoot ? 'root' : ''}">${isRoot ? 'Root-админ' : 'Сотрудник'}</span>
            <span>@${this.esc(u.login || '')}</span>
          </div>
        </div>
        <div class="hero-actions">
          <button class="btn-line" id="profChangePassBtn">Сменить пароль</button>
          <button class="btn-line danger" id="profLogoutBtn">Выйти</button>
        </div>
        ${isRoot ? `<div class="prof-tools" id="profTools">
          <button class="icon-btn" data-act="tg" title="Бэкап в Telegram · авто раз в 24 ч, последний: ${this.backup.getLastTimeStr()}"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button>
          <button class="icon-btn" data-act="json" title="Скачать JSON"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></button>
          <button class="icon-btn" data-act="digest" title="Сводка задач в Telegram">${uiIcon('bell', 15)}</button>
          <button class="icon-btn" data-act="restore" title="Восстановить из файла"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></button>
          <button class="icon-btn" data-act="theme" title="Переключить тему">${uiIcon((localStorage.getItem('inv_theme') || 'dark') === 'dark' ? 'sun' : 'moon', 15)}</button>
          <span class="prof-tools-sep"></span>
          <button class="icon-btn" data-sec="owners" title="Участники"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></button>
          <button class="icon-btn" data-sec="cats" title="Категории"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg></button>
          <button class="icon-btn" data-sec="brands" title="Бренды"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></button>
        </div>` : ''}
      </div>
      ${isRoot ? '<div id="profileMenuMount" class="prof-mount"></div>' : ''}
      ${finHtml}
      <div class="section-title">Мои заметки <em style="font-style:normal;font-size:11px;color:var(--text3)">· видны только вам</em></div>
      <div class="mynote-add">
        <textarea id="myNoteInput" class="form-input form-textarea" rows="2" placeholder="Написать себе: сделать то-то, не забыть, важная инфа…"></textarea>
        <button class="btn-line" id="myNoteAddBtn">Добавить</button>
      </div>
      <div id="myNotesList" class="mynotes-grid"></div>`;

    document.getElementById('profChangePassBtn')?.addEventListener('click', async () => {
      const np = await this._prompt('Новый пароль', '', 'Введите новый пароль');
      if (!np) return;
      try { await this.db.changeMyPassword(np); this.toast('Пароль изменён ✓'); }
      catch (e) { this.toast(e.message || 'Ошибка'); }
    });
    document.getElementById('profLogoutBtn')?.addEventListener('click', async () => {
      if (!await this.confirm('Выйти из аккаунта?', 'Выйти')) return;
      await this.db.logout();
      this.currentUser = null;
      this.showLogin();
    });
    // Тулбар-значки: действия сразу, справочники раскрываются под рядом
    document.getElementById('profTools')?.addEventListener('click', async (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      const act = b.dataset.act, sec = b.dataset.sec;
      if (act === 'tg') {
        this.toast('Отправляю в Telegram…');
        try {
          const r = await fetch('/api/backup/send', { method: 'POST' });
          const d = await r.json();
          this.toast(d.ok ? '✓ Бэкап отправлен в Telegram' : '✗ Не удалось — настройте TG_LOG_TOKEN');
        } catch { this.toast('✗ Ошибка отправки'); }
      } else if (act === 'json') {
        this.doManualSave();
      } else if (act === 'digest') {
        this.toast('Отправляю сводку…');
        try {
          const r = await fetch('/api/tasks/digest', { method: 'POST' });
          const d = await r.json();
          this.toast(d.ok ? `✓ Сводка отправлена (получателей: ${d.sent})` : '✗ Не удалось отправить');
        } catch { this.toast('✗ Ошибка отправки'); }
      } else if (act === 'restore') {
        document.getElementById('restoreFileInput').click();
      } else if (act === 'theme') {
        const next = (localStorage.getItem('inv_theme') || 'dark') === 'dark' ? 'light' : 'dark';
        this.applyTheme(next);
        b.innerHTML = uiIcon(next === 'dark' ? 'sun' : 'moon', 15);
      } else if (sec) {
        const mount = document.getElementById('profileMenuMount');
        const target = mount.querySelector(`.menu-acc[data-acc="${sec}"]`);
        if (!target) return;
        const wasShown = target.classList.contains('shown');
        mount.querySelectorAll('.menu-acc').forEach(a => a.classList.remove('shown', 'open'));
        document.querySelectorAll('#profTools [data-sec]').forEach(x => x.classList.remove('active'));
        if (!wasShown) { target.classList.add('shown', 'open'); b.classList.add('active'); }
      }
    });

    // Справочники (Пользователи/Участники/Категории/Бренды) — из бывшего
    // бургер-меню: рендерим сюда, дубли профильных блоков вычищаем, секции
    // скрыты до клика по значку в тулбаре
    const mount = document.getElementById('profileMenuMount');
    if (mount) {
      this.renderMenuPanel(mount);
      mount.querySelectorAll('.account-hero, .menu-grid, .menu-theme-row, .menu-foot')
        .forEach(n => n.remove());
    }

    const noteInput = document.getElementById('myNoteInput');
    const addNote = async () => {
      const text = noteInput.value.trim();
      if (!text) return;
      const note = await this.db.saveMyNote({ text });
      (this._myNotes = this._myNotes || []).push(note);
      noteInput.value = '';
      this._renderMyNotes();
    };
    document.getElementById('myNoteAddBtn').addEventListener('click', addNote);
    noteInput.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') addNote();
    });
    document.getElementById('myNotesList').addEventListener('click', (e) => this._onMyNoteClick(e));
    this._myNotes = await this.db.getMyNotes();
    this._renderMyNotes();

    runCountUps(head);

    // Сотрудник: ниже — задачи/заметки/доступы (узлы проекта уже перенесены)
    if (!isRoot) {
      this._mountProjectInProfile();
      await this.renderProject();
    }
  }

  /* ── Мои заметки: закреплённые сверху, дальше по свежести ── */
  _renderMyNotes() {
    const el = document.getElementById('myNotesList');
    if (!el) return;
    const notes = [...(this._myNotes || [])].sort((a, b) =>
      ((b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)) ||
      (new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)));
    el.innerHTML = notes.length ? notes.map(n => `
      <div class="mynote${n.pinned ? ' pinned' : ''}" data-note-id="${n.id}">
        <div class="mynote-text">${this.esc(n.text)}</div>
        <div class="mynote-meta">
          <span>${this.fmtDate(n.updatedAt || n.createdAt)}</span>
          <span class="spacer"></span>
          <button class="mynote-btn mn-pin" title="${n.pinned ? 'Открепить' : 'Закрепить'}">${uiIcon('pin', 12)}</button>
          <button class="mynote-btn mn-del" title="Удалить">✕</button>
        </div>
      </div>`).join('')
    : '<div class="mynotes-empty">Пока пусто — запишите первое: планы, ссылки, важное.</div>';
  }

  async _onMyNoteClick(e) {
    const card = e.target.closest('.mynote');
    if (!card) return;
    const id   = card.dataset.noteId;
    const note = (this._myNotes || []).find(n => n.id === id);
    if (!note) return;
    if (e.target.closest('.mn-del')) {
      if (!await this.confirm('Удалить заметку?')) return;
      await this.db.deleteMyNote(id);
      this._myNotes = this._myNotes.filter(n => n.id !== id);
      this._renderMyNotes();
      return;
    }
    if (e.target.closest('.mn-pin')) {
      const upd = await this.db.saveMyNote({ id, pinned: !note.pinned });
      Object.assign(note, upd);
      this._renderMyNotes();
      return;
    }
    if (e.target.closest('.mn-save')) {
      const text = card.querySelector('textarea').value.trim();
      if (text) {
        const upd = await this.db.saveMyNote({ id, text });
        Object.assign(note, upd);
      }
      this._renderMyNotes();
      return;
    }
    if (e.target.closest('.mn-cancel')) { this._renderMyNotes(); return; }
    if (e.target.closest('textarea')) return;   // клики в редакторе не перерисовывают
    // Клик по карточке — редактирование на месте
    card.classList.add('editing');
    card.innerHTML = `
      <textarea class="form-input form-textarea" rows="3">${this.esc(note.text)}</textarea>
      <div class="mynote-meta">
        <span class="spacer"></span>
        <button class="btn-line mn-save">Сохранить</button>
        <button class="mynote-btn mn-cancel">Отмена</button>
      </div>`;
    card.querySelector('textarea').focus();
  }

  /* ──────────────────────────────────────────
     PROJECT — sub-tabs
     ────────────────────────────────────────── */
  async renderProject() {
    const [tasks, notes, quick, owners] = await Promise.all([
      this.db.getTasks(), this.db.getProjectNotes(), this.db.getQuickItems(), this.db.getOwners(),
    ]);
    // Legacy: раньше задачи назначались на владельцев вещей — учитываем совпадение по имени
    const myLegacyOwnerId = owners.find(o =>
      (o.name || '').toLowerCase() === (this.currentUser?.name || '').toLowerCase())?.id || null;
    const isMineTask = t => t.assigneeId &&
      (t.assigneeId === this.currentUser?.id || t.assigneeId === myLegacyOwnerId);

    const total  = tasks.length;
    const done   = tasks.filter(t => t.done).length;
    const active = total - done;
    const hero   = document.getElementById('projHero');
    const isRoot = this.currentUser?.role === 'root';
    hero?.classList.toggle('emp', !isRoot);

    const plural = (n) => { const m = n % 100, d = n % 10; if (m > 10 && m < 20) return 'задач'; if (d > 1 && d < 5) return 'задачи'; if (d === 1) return 'задача'; return 'задач'; };

    const pct    = total ? done / total : 0;
    const urgent = tasks.filter(t => !t.done && (t.kind || 'duty') === 'urgent').length;
    const goals  = tasks.filter(t => !t.done && (t.kind || 'duty') === 'goal').length;
    const pendingN = tasks.filter(t => !t.done && t.doneRequested && !t.personal).length;

    /* Компактная шапка: одна строка + прогресс — задачи видны сразу */
    let heroTitle, heroSub;
    if (isRoot) {
      heroTitle = 'Панель управления';
      heroSub = [
        pendingN ? `⏳ на подтверждении: ${pendingN}` : '',
        urgent ? `срочных: ${urgent}` : '',
        goals ? `целей: ${goals}` : '',
        `готово ${done} из ${total}`,
      ].filter(Boolean).join(' · ');
    } else {
      const name  = this.currentUser?.name || '';
      const h     = new Date().getHours();
      const greet = h >= 5 && h < 12 ? 'Доброе утро' : h >= 12 && h < 17 ? 'Добрый день' : h >= 17 && h < 23 ? 'Добрый вечер' : 'Доброй ночи';
      const mine       = tasks.filter(t => !t.done && isMineTask(t)).length;
      const mineUrgent = tasks.filter(t => !t.done && isMineTask(t) && (t.kind || 'duty') === 'urgent').length;
      heroTitle = `${greet}, ${this.esc(name)}`;
      heroSub = mine ? `Для тебя: ${mine} ${plural(mine)}${mineUrgent ? ` · срочных: ${mineUrgent}` : ''}` : 'Для тебя задач нет';
    }
    if (hero) hero.innerHTML = `
      <div class="proj-hero-inner ph-compact">
        <div class="ph-c-left">
          <div class="ph-label">Проект · Masqucerade</div>
          <div class="ph-c-title">${heroTitle}</div>
          <div class="ph-c-sub">${heroSub}</div>
        </div>
        <div class="ph-c-right">
          <div class="ph-c-pct">${Math.round(pct * 100)}%</div>
          <div class="ph-c-frac">${done}/${total}</div>
        </div>
        <div class="ph-bar"><i style="width:${Math.round(pct * 100)}%"></i></div>
      </div>`;

    /* ── Счётчики на вкладках ── */
    const setCnt = (id, n) => {
      const c = document.getElementById(id);
      if (c) { c.textContent = n || ''; c.style.display = n ? '' : 'none'; }
    };
    setCnt('cntTasks', total - done);
    setCnt('cntNotes', notes.length);
    setCnt('cntQuick', quick.length);

    /* ── Вкладки со скользящим глайдером ── */
    document.querySelectorAll('.proj-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.subtab === this._projectSubTab);
      btn.onclick = () => {
        if (this._projectSubTab === btn.dataset.subtab) return;
        this._projectSubTab = btn.dataset.subtab;
        document.querySelectorAll('.proj-tab').forEach(b =>
          b.classList.toggle('active', b === btn));
        this._moveProjGlider();
        this._renderProjectPane(true);
      };
    });
    requestAnimationFrame(() => requestAnimationFrame(() => this._moveProjGlider()));
    setTimeout(() => this._moveProjGlider(), 120);   // страховка: шрифты/layout
    if (!this._gliderResizeBound) {
      this._gliderResizeBound = true;
      window.addEventListener('resize', () => this._moveProjGlider());
    }
    this._renderProjectPane();
  }

  _moveProjGlider() {
    const bar = document.getElementById('projTabs');
    const act = bar?.querySelector('.proj-tab.active');
    const gl  = bar?.querySelector('.proj-tabs-glider');
    if (!bar || !act || !gl) return;
    bar.dataset.tab    = this._projectSubTab;   // для цвета глайдера по разделу
    gl.style.width     = act.offsetWidth + 'px';
    gl.style.transform = `translateX(${act.offsetLeft - 4}px)`;
  }

  async _renderProjectPane(animate = false) {
    if (this._projectSubTab === 'tasks')      await this.renderProjectTasks();
    else if (this._projectSubTab === 'notes') await this.renderProjectNotes();
    else                                      await this.renderProjectQuick();
    if (animate) {
      const el = document.getElementById('projectContent');
      if (el) { el.classList.remove('pane-in'); void el.offsetWidth; el.classList.add('pane-in'); }
    }
  }

  /* ── Задачи ── */
  async renderProjectTasks() {
    const el     = document.getElementById('projectContent');
    if (!el) return;
    const [tasks, team, owners] = await Promise.all([
      this.db.getTasks(), this.db.getTeam(), this.db.getOwners(),
    ]);

    if (!tasks.length) {
      el.innerHTML = `<div class="faq-empty">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
        <p>Нет задач — нажмите + чтобы добавить</p>
      </div>`;
      return;
    }

    const svgEdit = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
    const svgDel  = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`;

    /* Исполнитель — сотрудник (user); старые задачи могли быть назначены
       на владельца вещей — имя ищем и там (legacy) */
    const ownerName = id =>
      team.find(u => u.id === id)?.name || owners.find(o => o.id === id)?.name || '';

    /* «Мои» задачи сотрудника — наверх и с меткой */
    const isRoot    = this.currentUser?.role === 'root';
    const myName    = (this.currentUser?.name || '').toLowerCase();
    const myLegacy  = owners.find(o => (o.name || '').toLowerCase() === myName)?.id || null;
    const isMine    = t => !!t.assigneeId &&
      (t.assigneeId === this.currentUser?.id || t.assigneeId === myLegacy);

    /* Задачи подвязаны к людям: выбранный в дашборде человек фильтрует колонки.
       «Общие» — задачи без исполнителя (общие цели и планы). */
    const legacyIdOf = u => owners.find(o =>
      (o.name || '').toLowerCase() === (u.name || '').toLowerCase())?.id || null;
    // Сотрудник видит только свои задачи: в дашборде — «Общие» и он сам
    const staff = isRoot
      ? [...team].sort((a, b) => (a.role === 'root') - (b.role === 'root'))
      : team.filter(u => u.id === this.currentUser?.id);
    if (this._projPerson === undefined ||
        (this._projPerson !== '__common__' && !team.some(u => u.id === this._projPerson)))
      this._projPerson = isRoot ? '__common__' : (this.currentUser?.id || '__common__');
    const selPerson  = this._projPerson;
    const selLegacy  = selPerson !== '__common__'
      ? legacyIdOf(team.find(u => u.id === selPerson) || {}) : null;
    const belongsSel = t => selPerson === '__common__'
      ? !t.assigneeId
      : (t.assigneeId === selPerson || (selLegacy && t.assigneeId === selLegacy));

    const kindOf   = t => t.kind || 'duty';
    const isPend   = t => !t.done && !!t.doneRequested;
    // Ждущие подтверждения — отдельным блоком сверху (не зависят от выбранного человека)
    const pending  = tasks.filter(t => !t.personal && isPend(t));
    const personal = tasks.filter(t => t.personal && !t.done);
    const doneP    = tasks.filter(t => t.personal && t.done);
    const byKind   = k => tasks.filter(t => !t.personal && !t.done && !isPend(t) && kindOf(t) === k && belongsSel(t));
    const doneBy   = k => tasks.filter(t => !t.personal &&  t.done && kindOf(t) === k && belongsSel(t));
    const lists = { urgent: byKind('urgent'), duty: byKind('duty'), goal: byKind('goal') };

    const svgLock = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;

    const renderList = list => list.map(t => {
      const assignee = t.assigneeId ? ownerName(t.assigneeId) : '';
      const title = t.title || t.text || '';
      const desc  = t.description || '';
      const mine  = isMine(t) && !t.done;
      const pend  = isPend(t);
      const checkTitle = t.done ? 'Вернуть'
        : pend ? (isRoot ? 'Подтвердить выполнение' : 'Снять отметку')
        : 'Выполнено';
      const doneBy = pend && t.doneRequestedBy ? ownerName(t.doneRequestedBy) : '';
      return `
      <div class="task-item${t.done ? ' done' : ''}${pend ? ' pending' : ''}${mine ? ' task-mine' : ''}${t.personal ? ' task-personal' : ''}" data-task-id="${t.id}">
        <button class="task-check${pend ? ' pending' : ''}" data-task-id="${t.id}" title="${checkTitle}">
          ${t.done ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`
            : pend ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></svg>` : ''}
        </button>
        <div class="task-body">
          <span class="task-text">${this.esc(title)}</span>
          ${desc ? `<span class="task-desc">${this.esc(desc)}</span>` : ''}
          ${t.photo ? `<img class="task-photo-thumb" src="${t.photo}" alt="фото задачи">` : ''}
          <span class="task-meta-row">${pend ? `<span class="task-pending-badge">⏳ ${doneBy ? `${this.esc(doneBy)}: выполнено` : 'Выполнено'} · ждёт подтверждения</span>` : ''}${t.personal ? `<span class="task-personal-badge">${svgLock} Личная</span>` : ''}${mine ? `<span class="task-mine-badge">Для тебя</span>` : ''}${assignee && !mine ? `<span class="task-assignee"><i>${this.esc(assignee.trim()[0].toUpperCase())}</i>${this.esc(assignee)}</span>` : ''}${t.createdAt ? `<span class="task-date">${this.fmtDate(t.createdAt)}</span>` : ''}${this._visBadge(t)}</span>
          ${pend && isRoot ? `<span class="task-confirm-row">
            <button class="task-confirm-btn" data-task-id="${t.id}">Подтвердить ✓</button>
            <button class="task-reject-btn" data-task-id="${t.id}">Вернуть в работу</button>
          </span>` : ''}
        </div>
        <div class="task-btns">
          <button class="task-edit" data-task-id="${t.id}" title="Изменить">${svgEdit}</button>
          <button class="task-del"  data-task-id="${t.id}" title="Удалить">${svgDel}</button>
        </div>
      </div>`;
    }).join('');

    /* Мини-дашборд: компактные чипы «Общие» + сотрудники (горизонтальная лента).
       Клик выбирает, чьи задачи показывать; бейдж — активные (красный при срочных). */
    const dashCard = (pid, avatar, name, my) => {
      const urg = my.filter(t => (t.kind || 'duty') === 'urgent').length;
      return `<div class="td-card${selPerson === pid ? ' sel' : ''}" data-person="${pid}">
        <i class="td-av">${avatar}</i>
        <b class="td-name">${this.esc(name)}</b>
        ${my.length ? `<span class="td-cnt${urg ? ' urg' : ''}">${my.length}</span>` : ''}
        ${isRoot ? `<button class="td-add" data-owner-id="${pid === '__common__' ? '' : pid}" title="Выдать задачу">＋</button>` : ''}
      </div>`;
    };
    const commonTasks = tasks.filter(t => !t.personal && !t.done && !t.assigneeId);
    const teamDash = `<div class="team-dash">
      ${dashCard('__common__', '✦', 'Общие', commonTasks)}
      ${staff.map(u => {
        const legacy = legacyIdOf(u);
        const my = tasks.filter(t => !t.personal && !t.done &&
          (t.assigneeId === u.id || (legacy && t.assigneeId === legacy)));
        return dashCard(u.id, this.esc((u.name || '?').trim()[0].toUpperCase()), u.name, my);
      }).join('')}
    </div>`;

    /* Колонка типа: только активные — выполненные спрятаны за кнопкой внизу */
    const column = (kind, title) => {
      const act = lists[kind];
      return `<div class="proj-col${act.length ? '' : ' empty'}">
        <div class="ptask-head ${kind}"><i></i><span>${title}</span><em>${act.length || ''}</em></div>
        <div class="task-list">
          ${act.length ? renderList(act) : '<div class="ptask-empty">Пока пусто</div>'}
        </div>
      </div>`;
    };

    const doneAll = [...doneBy('urgent'), ...doneBy('duty'), ...doneBy('goal'), ...doneP];

    el.innerHTML = `
      ${teamDash}
      ${pending.length ? `<div class="proj-pending">
        <div class="ptask-head pending"><i></i><span>Ждут подтверждения</span><em>${pending.length}</em></div>
        <div class="task-list">${renderList(pending)}</div>
      </div>` : ''}
      ${personal.length ? `<div class="proj-personal">
        <div class="ptask-head personal"><i></i><span>Личное</span><em>${personal.length}</em></div>
        <div class="task-list">${renderList(personal)}</div>
      </div>` : ''}
      <div class="proj-cols">
        ${column('urgent', 'Срочные')}
        ${column('duty', 'Обязанности')}
        ${column('goal', 'Цели и планы')}
      </div>
      ${doneAll.length ? `<div class="done-wrap" id="doneWrap">
        <button class="done-toggle" id="doneToggle">
          Выполненные · ${doneAll.length}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="task-list hidden" id="doneList">${renderList(doneAll)}</div>
      </div>` : ''}`;

    /* Выполненные — раскрываются по кнопке */
    document.getElementById('doneToggle')?.addEventListener('click', () => {
      const w = document.getElementById('doneWrap');
      const open = w.classList.toggle('open');
      document.getElementById('doneList').classList.toggle('hidden', !open);
    });

    /* «+» у участника — новая задача сразу на него (у «Общих» — без исполнителя) */
    el.querySelectorAll('.td-add').forEach(btn =>
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openTaskModal(null, btn.dataset.ownerId || null);
      }));

    /* Клик по карточке — показать задачи этого человека */
    el.querySelectorAll('.td-card').forEach(card =>
      card.addEventListener('click', () => {
        if (this._projPerson === card.dataset.person) return;
        this._projPerson = card.dataset.person;
        this.renderProjectTasks();
      }));

    /* Чекбокс: root закрывает сразу; сотрудник отправляет на подтверждение.
       У задачи «в ожидании»: root — подтверждает, сотрудник — снимает отметку. */
    const toggleTask = async (t) => {
      if (t.done) {
        await this.db.patchTask(t.id, { done: false });
      } else if (isPend(t)) {
        if (isRoot) { await this.db.patchTask(t.id, { done: true }); this.toast('Выполнение подтверждено ✓'); }
        else        { await this.db.patchTask(t.id, { doneRequested: false }); this.toast('Отметка снята'); }
      } else {
        await this.db.patchTask(t.id, { done: true });
        if (!isRoot && !t.personal) this.toast('Отправлено на подтверждение ⏳');
      }
      this.renderProject();
    };
    el.querySelectorAll('.task-check').forEach(btn =>
      btn.addEventListener('click', async () => {
        const t = tasks.find(x => x.id === btn.dataset.taskId);
        if (t) await toggleTask(t);
      })
    );
    el.querySelectorAll('.task-confirm-btn').forEach(btn =>
      btn.addEventListener('click', async () => {
        await this.db.patchTask(btn.dataset.taskId, { done: true });
        this.toast('Выполнение подтверждено ✓');
        this.renderProject();
      })
    );
    el.querySelectorAll('.task-reject-btn').forEach(btn =>
      btn.addEventListener('click', async () => {
        await this.db.patchTask(btn.dataset.taskId, { doneRequested: false });
        this.toast('Задача возвращена в работу');
        this.renderProject();
      })
    );
    el.querySelectorAll('.task-edit').forEach(btn =>
      btn.addEventListener('click', () => {
        const t = tasks.find(x => x.id === btn.dataset.taskId);
        if (t) this.openTaskModal(t);
      })
    );
    el.querySelectorAll('.task-del').forEach(btn =>
      btn.addEventListener('click', async () => {
        const ok = await this.confirm('Удалить задачу?');
        if (!ok) return;
        await this.db.deleteTask(btn.dataset.taskId);
        this.renderProject();
      })
    );
    el.querySelectorAll('.task-photo-thumb').forEach(img =>
      img.addEventListener('click', (e) => { e.stopPropagation(); this._openImage(img.src); })
    );
  }

  // Простой просмотрщик фото на весь экран.
  // На телефоне долгое нажатие по фото открывает системное меню
  // «Сохранить изображение» — такой жест не должен закрывать просмотрщик,
  // закрываем только коротким тапом.
  _openImage(src) {
    const ov = document.createElement('div');
    ov.className = 'image-viewer';
    ov.innerHTML = `<img src="${src}" alt="">`;
    let t0 = 0;
    ov.addEventListener('pointerdown', () => { t0 = Date.now(); });
    ov.addEventListener('click', () => { if (Date.now() - t0 < 450) ov.remove(); });
    document.body.appendChild(ov);
  }

  async openTaskModal(task = null, presetAssigneeId = null) {
    this._editingTaskId = task?.id || null;
    document.getElementById('taskModalTitle').textContent    = task ? 'Редактировать задачу' : 'Новая задача';
    document.getElementById('taskModalSave').textContent     = task ? 'Сохранить' : 'Добавить';
    // back-compat: старые задачи хранили всё в .text
    document.getElementById('taskTitle').value       = task?.title || task?.text || '';
    document.getElementById('taskDescription').value = task?.description || '';
    this._setTaskKind(task?.kind || 'duty');
    this._setTaskPersonal(!!task?.personal);
    this._setTaskPhoto(task?.photo || null);
    /* Ответственный — сотрудник (пользователь панели), не владелец вещей */
    const sel  = document.getElementById('taskAssignee');
    const team = await this.db.getTeam();
    let opts = `<option value="">— Не назначен —</option>` +
      team.map(u => `<option value="${u.id}"${task?.assigneeId === u.id ? ' selected' : ''}>${this.esc(u.name)}</option>`).join('');
    /* Legacy: задача назначена на владельца вещей — показываем его, чтобы не потерять */
    if (task?.assigneeId && !team.some(u => u.id === task.assigneeId)) {
      const legacyName = (await this.db.getOwners()).find(o => o.id === task.assigneeId)?.name;
      if (legacyName) opts += `<option value="${task.assigneeId}" selected>${this.esc(legacyName)}</option>`;
    }
    sel.innerHTML = opts;
    if (!task && presetAssigneeId) sel.value = presetAssigneeId;   // «+» из дашборда сотрудника

    const isRoot = this.currentUser?.role === 'root';
    document.getElementById('taskVisGroup').style.display = (isRoot && !this._taskPersonal) ? '' : 'none';
    if (isRoot) this._renderVisChips('taskVisChips', task?.visibility || []);

    this.openModal('taskModal');
    setTimeout(() => document.getElementById('taskTitle').focus(), 350);
  }

  _setTaskKind(kind) {
    this._taskKind = kind;
    const seg = document.getElementById('taskKindSeg');
    if (!seg) return;
    seg.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.kind === kind));
    if (!seg._bound) {
      seg._bound = true;
      seg.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-kind]');
        if (b) this._setTaskKind(b.dataset.kind);
      });
    }
  }

  _setTaskPersonal(on) {
    this._taskPersonal = on;
    const track = document.getElementById('taskPersonalToggle');
    const row   = document.getElementById('taskPersonalRow');
    if (!track) return;
    track.style.background = on ? 'var(--accent)' : 'var(--muted)';
    track.querySelector('.toggle-thumb').style.transform = `translateX(${on ? 18 : 0}px)`;
    row?.classList.toggle('on', on);
    /* «Кому видно» не имеет смысла для личной задачи */
    const vis = document.getElementById('taskVisGroup');
    if (vis) vis.style.display = (this.currentUser?.role === 'root' && !on) ? '' : 'none';
  }

  _setTaskPhoto(b64) {
    this._taskPhoto = b64 || null;
    const prev = document.getElementById('taskPhotoPreview');
    const ph   = document.getElementById('taskPhotoPlaceholder');
    const rm   = document.getElementById('taskPhotoRemove');
    if (!prev || !ph || !rm) return;
    if (b64) {
      prev.src = b64; prev.classList.remove('hidden');
      ph.classList.add('hidden'); rm.classList.remove('hidden');
    } else {
      prev.src = ''; prev.classList.add('hidden');
      ph.classList.remove('hidden'); rm.classList.add('hidden');
    }
  }

  async saveTask() {
    const title       = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const assigneeId  = document.getElementById('taskAssignee').value || null;
    if (!title) { this.toast('Введите название задачи'); return; }
    // text дублируем названием — для обратной совместимости
    const payload = { title, text: title, description, assigneeId, kind: this._taskKind || 'duty', photo: this._taskPhoto || null, personal: !!this._taskPersonal };
    if (this.currentUser?.role === 'root') payload.visibility = this._readVis('taskVisChips');
    if (this._editingTaskId) {
      await this.db.patchTask(this._editingTaskId, payload);
      this.toast('Задача обновлена ✓');
    } else {
      await this.db.addTask(payload);
    }
    this._editingTaskId = null;
    this._taskPhoto = null;
    this.closeModal('taskModal');
    this.renderProject();
  }

  /* ── Быстрый доступ ── */
  _quickTypeIcon(type) {
    const map = { card:'creditCard', phone:'phone', address:'mapPin', password:'key', link:'link', other:'clipboard' };
    return uiIcon(map[type] || 'clipboard', 14);
  }

  async renderProjectQuick() {
    const el    = document.getElementById('projectContent');
    if (!el) return;
    const raw = await this.db.getQuickItems();

    if (!raw.length) {
      el.innerHTML = `<div class="faq-empty">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
        <p>Нет реквизитов — нажмите + чтобы добавить</p>
      </div>`;
      return;
    }

    const items = [...raw.filter(i => i.pinned), ...raw.filter(i => !i.pinned)];

    const svgPin  = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
    const svgCopy = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
    const svgEdit = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
    const svgDel  = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`;
    const svgEye  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
    const svgEyeOff = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

    const mask = (s) => '●'.repeat(Math.min(String(s).length, 12));

    el.innerHTML = `<div class="quick-list">${items.map(item => {
      const isPassword = item.type === 'password';
      const value = String(item.value ?? '');
      const lines = value.split('\n').map(l => l.trim()).filter(Boolean);
      // Короткие строки («Логин: … / Пароль: …») — рядами с копированием
      // каждой; длинный текст (инструкции) — сворачиваемым абзацем.
      const rowMode = lines.length > 0 && lines.length <= 6 && lines.every(l => l.length <= 80);
      const long    = !rowMode && (lines.length > 5 || value.length > 260);

      let body;
      if (rowMode) {
        body = `<div class="quick-rows">${lines.map(l => {
          const m   = l.match(/^([^:：]{1,24})[:：]\s*(.+)$/);   // «Ключ: значение»
          const key = m ? m[1].trim() : '';
          const val = m ? m[2].trim() : l;
          return `<div class="quick-row" data-val="${this.esc(val)}">
            ${key ? `<span class="quick-row-key">${this.esc(key)}</span>` : ''}
            <span class="quick-row-val${isPassword ? ' masked' : ''}">${isPassword ? mask(val) : this.esc(val)}</span>
            <button class="quick-row-copy" type="button" title="Скопировать">${svgCopy}</button>
          </div>`;
        }).join('')}</div>`;
      } else {
        body = `<div class="quick-text${long ? ' clamped' : ''}${isPassword ? ' masked' : ''}">${isPassword ? mask(value) : this.esc(value)}</div>` +
          (long ? `<button class="quick-expand" type="button">Развернуть</button>` : '');
      }

      return `
      <div class="quick-item${item.pinned ? ' pinned' : ''}" data-quick-id="${item.id}">
        <div class="quick-head">
          <div class="quick-type-icon">${this._quickTypeIcon(item.type)}</div>
          <span class="quick-label">${this.esc(item.label)}${this._visBadge(item)}</span>
          <div class="quick-actions">
            ${isPassword ? `<button class="quick-eye" title="Показать/скрыть">${svgEyeOff}</button>` : ''}
            <button class="quick-copy" title="Скопировать всё">${svgCopy}</button>
            <button class="quick-pin ${item.pinned ? 'active' : ''}" title="${item.pinned ? 'Открепить' : 'Закрепить'}">${svgPin}</button>
            <button class="quick-edit" title="Изменить">${svgEdit}</button>
            <button class="quick-del" title="Удалить">${svgDel}</button>
          </div>
          <button class="quick-more" type="button" title="Действия">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/>
            </svg>
          </button>
        </div>
        <div class="quick-body">${body}</div>
      </div>`;
    }).join('')}
    </div>`;

    const copyText = (val, btn) => {
      (navigator.clipboard?.writeText(val) || Promise.reject())
        .catch(() => { const ta = document.createElement('textarea'); ta.value = val; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); });
      btn.classList.add('copied');
      setTimeout(() => btn.classList.remove('copied'), 1400);
      this.toast('Скопировано');
    };
    const itemOf = (node) => raw.find(x => x.id === node.closest('.quick-item')?.dataset.quickId);

    /* «⋯» раскрывает действия карточки; открыта только одна за раз */
    el.querySelectorAll('.quick-more').forEach(btn =>
      btn.addEventListener('click', () => {
        const card = btn.closest('.quick-item');
        const open = !card.classList.contains('acts-open');
        el.querySelectorAll('.quick-item.acts-open').forEach(c => c.classList.remove('acts-open'));
        card.classList.toggle('acts-open', open);
      }));
    if (!this._quickActsCloseBound) {
      this._quickActsCloseBound = true;
      // Тап вне карточки сворачивает раскрытые действия
      document.addEventListener('click', (e) => {
        if (e.target.closest('.quick-item')) return;
        document.querySelectorAll('.quick-item.acts-open').forEach(c => c.classList.remove('acts-open'));
      });
    }

    el.querySelectorAll('.quick-row-copy').forEach(btn =>
      btn.addEventListener('click', () => copyText(btn.closest('.quick-row').dataset.val, btn)));
    // «Скопировать всё»: у построчных реквизитов склеиваем значения через
    // двоеточие — «Логин: a / Пароль: b» копируется как «a:b» (login:password)
    const copyValueOf = (item) => {
      const value = String(item.value ?? '');
      const lines = value.split('\n').map(l => l.trim()).filter(Boolean);
      const rowMode = lines.length > 1 && lines.length <= 6 && lines.every(l => l.length <= 80);
      if (!rowMode) return value;
      return lines.map(l => {
        const m = l.match(/^([^:：]{1,24})[:：]\s*(.+)$/);
        return (m ? m[2] : l).trim();
      }).join(':');
    };
    el.querySelectorAll('.quick-copy').forEach(btn =>
      btn.addEventListener('click', () => {
        const item = itemOf(btn);
        if (item) copyText(copyValueOf(item), btn);
      }));
    el.querySelectorAll('.quick-eye').forEach(btn =>
      btn.addEventListener('click', () => {
        const card     = btn.closest('.quick-item');
        const item     = itemOf(btn);
        const revealed = card.dataset.revealed === 'true';
        card.dataset.revealed = String(!revealed);
        card.querySelectorAll('.quick-row').forEach(row => {
          const v = row.querySelector('.quick-row-val');
          v.textContent = revealed ? mask(row.dataset.val) : row.dataset.val;
          v.classList.toggle('masked', revealed);
        });
        const txt = card.querySelector('.quick-text');
        if (txt && item) {
          txt.textContent = revealed ? mask(item.value) : String(item.value ?? '');
          txt.classList.toggle('masked', revealed);
        }
        btn.innerHTML = revealed ? svgEyeOff : svgEye;
      }));
    el.querySelectorAll('.quick-expand').forEach(btn =>
      btn.addEventListener('click', () => {
        const txt  = btn.closest('.quick-body').querySelector('.quick-text');
        const open = !txt.classList.toggle('clamped');
        btn.textContent = open ? 'Свернуть' : 'Развернуть';
      }));
    el.querySelectorAll('.quick-pin').forEach(btn =>
      btn.addEventListener('click', async () => {
        const item = itemOf(btn);
        if (!item) return;
        await this.db.patchQuickItem(item.id, { pinned: !item.pinned });
        this.renderProjectQuick();
      })
    );
    el.querySelectorAll('.quick-edit').forEach(btn =>
      btn.addEventListener('click', () => {
        const item = itemOf(btn);
        if (item) this.openQuickModal(item);
      })
    );
    el.querySelectorAll('.quick-del').forEach(btn =>
      btn.addEventListener('click', async () => {
        const ok = await this.confirm('Удалить реквизит?');
        if (!ok) return;
        await this.db.deleteQuickItem(btn.closest('.quick-item').dataset.quickId);
        this.renderProject();
      })
    );
  }

  /* ── Заметки проекта ── */
  async renderProjectNotes() {
    const el = document.getElementById('projectContent');
    if (!el) return;
    const notes = await this.db.getProjectNotes();

    if (!notes.length) {
      el.innerHTML = `<div class="faq-empty">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <path d="M14 3v4a2 2 0 0 0 2 2h4"/>
          <path d="M20 9v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8l6 6z"/>
          <line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/>
        </svg>
        <p>Нет заметок — нажмите + чтобы добавить</p>
      </div>`;
      return;
    }

    const svgEdit = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
    const svgDel  = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`;
    const svgMore = `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>`;

    const list = notes.slice().reverse();
    el.innerHTML = `<div class="quick-list note-list">${list.map(n => {
      const color = n.color || '#7c6dfa';
      const text  = String(n.text ?? '');
      // У старых заметок нет заголовка — берём первую строку текста
      const hasTitle  = !!(n.title || '').trim();
      const firstLine = text.split('\n')[0].trim();
      const title = hasTitle ? n.title.trim()
        : (firstLine.length > 48 ? firstLine.slice(0, 48) + '…' : firstLine) || 'Заметка';
      const body  = hasTitle ? text : text.split('\n').slice(1).join('\n').trim();
      const long  = body.length > 260 || body.split('\n').length > 5;
      return `
      <div class="quick-item note-item" data-note-id="${n.id}">
        <div class="quick-head">
          <div class="quick-type-icon" style="background:color-mix(in srgb, ${color} 24%, transparent)">${uiIcon('fileText', 14)}</div>
          <span class="note-title">${this.esc(title)}${this._visBadge(n)}</span>
          <div class="quick-actions">
            <button class="quick-edit note-edit" title="Изменить">${svgEdit}</button>
            <button class="quick-del note-del" title="Удалить">${svgDel}</button>
          </div>
          <button class="quick-more" type="button" title="Действия">${svgMore}</button>
        </div>
        ${body ? `<div class="quick-body"><div class="quick-text${long ? ' clamped' : ''}">${this.esc(body)}</div>${long ? `<button class="quick-expand" type="button">Развернуть</button>` : ''}</div>` : ''}
        <span class="note-date">${this.fmtDate(n.createdAt)}</span>
      </div>`;
    }).join('')}
    </div>`;

    el.querySelectorAll('.quick-more').forEach(btn =>
      btn.addEventListener('click', () => {
        const card = btn.closest('.quick-item');
        const open = !card.classList.contains('acts-open');
        el.querySelectorAll('.quick-item.acts-open').forEach(c => c.classList.remove('acts-open'));
        card.classList.toggle('acts-open', open);
      }));
    el.querySelectorAll('.quick-expand').forEach(btn =>
      btn.addEventListener('click', () => {
        const txt  = btn.closest('.quick-body').querySelector('.quick-text');
        const open = !txt.classList.toggle('clamped');
        btn.textContent = open ? 'Свернуть' : 'Развернуть';
      }));
    el.querySelectorAll('.note-edit').forEach(btn =>
      btn.addEventListener('click', () => {
        const n = notes.find(x => x.id === btn.closest('.note-item').dataset.noteId);
        if (n) this.openNoteModal(n);
      })
    );
    el.querySelectorAll('.note-del').forEach(btn =>
      btn.addEventListener('click', async () => {
        const ok = await this.confirm('Удалить заметку?');
        if (!ok) return;
        await this.db.deleteProjectNote(btn.closest('.note-item').dataset.noteId);
        this.renderProject();
      })
    );
  }

  openNoteModal(note = null) {
    this._editingNoteId = note?.id || null;
    this._noteColor     = note?.color || '#7c6dfa';
    document.getElementById('noteModalTitle').textContent = note ? 'Редактировать' : 'Новая заметка';
    document.getElementById('noteModalSave').textContent  = note ? 'Сохранить' : 'Добавить';
    document.getElementById('noteTitle').value            = note?.title || '';
    document.getElementById('noteText').value             = note?.text || '';

    // Область видимости — настраивает только root (все / только я / выбранные)
    const isRoot = this.currentUser?.role === 'root';
    document.getElementById('noteVisGroup').style.display = isRoot ? '' : 'none';
    if (isRoot) this._renderVisChips('noteVisChips', note?.visibility || []);

    const COLORS = ['#7c6dfa', '#38bdf8', '#4ade80', '#fbbf24', '#f87171', '#f472b6'];
    document.getElementById('noteColorPicker').innerHTML = COLORS.map(c =>
      `<div class="color-dot ${c === this._noteColor ? 'selected' : ''}" data-color="${c}" style="background:${c}"></div>`
    ).join('');

    this.openModal('noteModal');
    setTimeout(() => document.getElementById('noteText').focus(), 350);
  }

  async saveNoteItem() {
    const title = document.getElementById('noteTitle').value.trim();
    const text  = document.getElementById('noteText').value.trim();
    if (!title && !text) { this.toast('Введите заголовок или текст'); return; }
    const isRoot = this.currentUser?.role === 'root';
    const vis    = isRoot ? this._readVis('noteVisChips') : undefined;
    if (this._editingNoteId) {
      const patch = { title, text, color: this._noteColor };
      if (vis !== undefined) patch.visibility = vis;
      await this.db.patchProjectNote(this._editingNoteId, patch);
      this.toast('Заметка обновлена ✓');
    } else {
      await this.db.addProjectNote({ title, text, color: this._noteColor,
        ...(vis !== undefined ? { visibility: vis } : {}) });
      this.toast('Заметка добавлена ✓');
    }
    this._editingNoteId = null;
    this.closeModal('noteModal');
    this.renderProject();
  }

  openQuickModal(item = null) {
    this._editingQuickId = item?.id || null;
    document.getElementById('quickModalTitle').textContent = item ? 'Редактировать' : 'Новый реквизит';
    document.getElementById('quickType').value       = item?.type       || 'other';
    document.getElementById('quickLabel').value      = item?.label      || '';
    document.getElementById('quickValue').value      = item?.value      || '';

    const isRoot = this.currentUser?.role === 'root';
    document.getElementById('quickVisGroup').style.display = isRoot ? '' : 'none';
    if (isRoot) this._renderVisChips('quickVisChips', item?.visibility || []);

    this.openModal('quickModal');
    setTimeout(() => document.getElementById('quickLabel').focus(), 350);
  }

  async saveQuickItem() {
    const type  = document.getElementById('quickType').value;
    const label = document.getElementById('quickLabel').value.trim();
    const value = document.getElementById('quickValue').value.trim();
    if (!label) { this.toast('Введите название'); return; }
    if (!value) { this.toast('Введите значение'); return; }
    const isRoot = this.currentUser?.role === 'root';
    const vis    = isRoot ? this._readVis('quickVisChips') : undefined;
    if (this._editingQuickId) {
      const patch = { type, label, value };
      if (vis !== undefined) patch.visibility = vis;
      await this.db.patchQuickItem(this._editingQuickId, patch);
      this.toast('Обновлено ✓');
    } else {
      await this.db.addQuickItem({ type, label, value, pinned: false, ...(vis !== undefined ? { visibility: vis } : {}) });
      this.toast('Добавлено ✓');
    }
    this._editingQuickId = null;
    this.closeModal('quickModal');
    this.renderProject();
  }

  /* ──────────────────────────────────────────
     SALE MODAL
     ────────────────────────────────────────── */
  async openSaleModal(prefillId = null) {
    const items = await this.db.getItems();
    const sel   = document.getElementById('saleItemSelect');
    sel.innerHTML = `<option value="">— Выберите товар —</option>` +
      items.map(i => `<option value="${i.id}" data-buy="${i.buyPrice||0}" data-price="${i.price||0}" data-delivery="${i.deliveryCost||0}" data-qty="${i.quantity||0}" data-sizes="${encodeURIComponent(JSON.stringify(i.sizes||[]))}">${this.esc(i.name)}</option>`).join('');

    document.getElementById('saleSalePrice').value    = '';
    document.getElementById('saleBuyPrice').value     = '';
    document.getElementById('saleDeliveryCost').value = '0';
    document.getElementById('saleNote').value         = '';
    document.getElementById('saleSizeGroup').style.display   = 'none';
    document.getElementById('saleSizeDivider').style.display = 'none';

    // Галочка «Сообщить команде» — только если группа сотрудников настроена
    // (вкладка Telegram). Состояние запоминается между продажами.
    const nCard = document.getElementById('saleNotifyCard');
    const nBox  = document.getElementById('saleNotifyTeam');
    nCard.classList.add('hidden');
    this.db.getTgChannelStatus().then(st => {
      if (!st?.teamChat) return;
      nCard.classList.remove('hidden');
      nBox.checked = localStorage.getItem('saleNotifyTeam') !== '0';
      document.getElementById('saleNotifyHint').textContent =
        `Отправить в группу${st.teamChatTitle ? ` «${st.teamChatTitle}»` : ''}: название, размер и цена`;
    }).catch(() => {});

    if (prefillId) {
      sel.value = prefillId;
      this._onSaleItemChange();   // подставит закуп/доставку/размеры выбранного товара
    } else {
      this._updateSalePreview();
    }
    this.openModal('saleModal');
    setTimeout(() => document.getElementById('saleSalePrice').focus(), 350);
  }

  _onSaleItemChange() {
    const sel  = document.getElementById('saleItemSelect');
    const opt  = sel.options[sel.selectedIndex];
    if (!opt || !opt.value) {
      document.getElementById('saleSizeGroup').style.display   = 'none';
      document.getElementById('saleSizeDivider').style.display = 'none';
      return;
    }
    // Дефолты из объявления — все поля можно поправить руками
    const p = opt.dataset.price;
    document.getElementById('saleSalePrice').value    = (p && p !== '0') ? p : '';
    document.getElementById('saleBuyPrice').value     = opt.dataset.buy      || '0';
    document.getElementById('saleDeliveryCost').value = opt.dataset.delivery || '0';

    let sizes = [];
    try { sizes = JSON.parse(decodeURIComponent(opt.dataset.sizes || '')); } catch {}
    const hasSizes = sizes.length > 1 || (sizes.length === 1 && sizes[0].size);
    document.getElementById('saleSizeGroup').style.display   = hasSizes ? '' : 'none';
    document.getElementById('saleSizeDivider').style.display = hasSizes ? '' : 'none';
    if (hasSizes) {
      document.getElementById('saleSizeSelect').innerHTML =
        sizes.map(s => { const r = this.rsvQty(s); const free = Math.max(0, (s.qty || 0) - r);
          return `<option value="${this.esc(s.size)}">${this.esc(s.size)} — ${s.qty} шт${r ? ` (свободно ${free}, в заказе ${r})` : ''}</option>`; }).join('');
    }
    this._updateSalePreview();
  }

  _updateSalePreview() {
    const revenue  = parseFloat(document.getElementById('saleSalePrice').value)    || 0;
    const buyPrice = parseFloat(document.getElementById('saleBuyPrice').value)     || 0;
    const delivery = parseFloat(document.getElementById('saleDeliveryCost').value) || 0;
    const costs    = buyPrice + delivery;
    const profit   = revenue - costs;
    const profPos  = profit >= 0;

    document.getElementById('previewRevenue').textContent = fmtMoney(revenue);
    document.getElementById('previewCosts').textContent   = fmtMoney(costs);
    const profEl = document.getElementById('previewProfit');
    profEl.textContent = (profPos ? '+' : '−') + fmtMoney(Math.abs(profit));
    profEl.className   = 'sale-profit-val bold ' + (profPos ? 'pos' : 'neg');
  }

  async saveSale() {
    const sel       = document.getElementById('saleItemSelect');
    const itemId    = sel.value;
    const itemName  = sel.options[sel.selectedIndex]?.text || '';
    const salePrice = parseFloat(document.getElementById('saleSalePrice').value)    || 0;
    const buyPrice  = parseFloat(document.getElementById('saleBuyPrice').value)     || 0;
    const delivery  = parseFloat(document.getElementById('saleDeliveryCost').value) || 0;
    const note      = document.getElementById('saleNote').value.trim();

    if (!itemId)    { this.toast('Выберите товар');        return; }
    if (!salePrice) { this.toast('Укажите сумму продажи'); return; }

    const sizeEl = document.getElementById('saleSizeSelect');
    const size   = document.getElementById('saleSizeGroup').style.display !== 'none' ? sizeEl.value : '';

    // Проверка наличия на складе
    const opt = sel.options[sel.selectedIndex];
    let inStock = 0;
    try {
      const sizes = JSON.parse(decodeURIComponent(opt?.dataset.sizes || ''));
      inStock = sizes.length
        ? (parseInt((sizes.find(s => (s.size || '') === (size || '')) || sizes[0])?.qty) || 0)
        : (parseInt(opt?.dataset.qty) || 0);
    } catch { inStock = parseInt(opt?.dataset.qty) || 0; }
    if (inStock <= 0) { this.toast(`Нет в наличии${size ? ` · размер ${size}` : ''}`); return; }

    // Защита от двойного нажатия — иначе продажа запишется дважды
    // и остаток спишется два раза
    if (this._savingSale) return;
    this._savingSale = true;
    const notifyCard = document.getElementById('saleNotifyCard');
    const notifyTeam = !notifyCard.classList.contains('hidden') &&
                       document.getElementById('saleNotifyTeam').checked;
    localStorage.setItem('saleNotifyTeam', notifyTeam ? '1' : '0');
    try {
      await this.db.addSale({ itemId, itemName, size, salePrice, buyPrice, deliveryCost: delivery, note, notifyTeam });
      await this.db.logAction('sale', `Продажа: «${itemName}»${size ? ` (${size})` : ''} — ${fmtMoney(salePrice)}`, { salePrice, buyPrice, deliveryCost: delivery });
      this.closeModal('saleModal');
      await this.loadData();          // обновить остатки в кэше
      this.renderInventoryList();     // отразить списание в списке товаров
      this.renderFinance();
      this.toast(`Продажа записана · +${fmtMoney(salePrice - buyPrice - delivery)} ₽${notifyTeam ? ' · команде отправлено' : ''}`);
    } catch (e) {
      this.toast('Ошибка записи продажи — проверьте соединение');
    } finally {
      this._savingSale = false;
    }
  }

  /* ──────────────────────────────────────────
     ГАЙДЫ (внутренняя база для сотрудников, Markdown)
     ────────────────────────────────────────── */
  /* Вкладка «Терминал» = консоль (журнал) + блок Авито + гайды ниже */
  async renderGuides() {
    const wrap = document.getElementById('settingsContent');
    if (!wrap) return;
    const showTerm  = this.hasAccess('terminal');
    const showAvito = this.hasAccess('site');
    wrap.innerHTML =
      `${showTerm ? '<div class="term-half" id="termHalf"></div>' : ''}` +
      `${showAvito ? '<div id="avitoPane" style="margin-bottom:16px"></div>' : ''}` +
      `<div id="guidesList"></div>`;
    if (showTerm)  this._renderTerminalInto(document.getElementById('termHalf'));   // параллельно
    if (showAvito) this._renderSiteAvito(document.getElementById('avitoPane'));
    await this._renderGuidesInto(document.getElementById('guidesList'));
  }

  async _renderGuidesInto(el) {
    if (!el) return;
    const isRoot = this.currentUser?.role === 'root';
    const guides = await this.db.getGuides();

    if (!guides.length) {
      el.innerHTML = `
        <div class="faq-empty">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          <p>${isRoot ? 'Пока нет гайдов — нажмите + чтобы написать первый' : 'Пока нет гайдов'}</p>
        </div>`;
      return;
    }

    const svgDel  = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`;
    const svgEdit = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;

    el.innerHTML = `<div class="guide-list">${guides.map(g => {
      const isHtml = g.format === 'html';
      const content = isHtml
        ? `<iframe class="guide-html-frame" data-guide-id="${g.id}"></iframe>`
        : `<div class="md-body">${this._mdRender(g.body || '')}</div>`;
      return `
      <div class="guide-item${isHtml ? ' guide-item--html' : ''}" data-guide-id="${g.id}">
        <div class="guide-head">
          <span class="guide-title">${this.esc(g.title || 'Без названия')}${isHtml ? '<span class="guide-html-tag">HTML</span>' : ''}</span>
          <svg class="faq-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
        <div class="guide-body">
          ${content}
          ${isRoot ? `<div class="faq-actions">
            <button class="guide-edit" data-guide-id="${g.id}">${svgEdit} Изменить</button>
            <button class="guide-delete" data-guide-id="${g.id}">${svgDel} Удалить</button>
          </div>` : ''}
        </div>
      </div>`;
    }).join('')}
    </div>`;

    // Смонтировать HTML-гайды в песочницу
    guides.filter(g => g.format === 'html').forEach(g => {
      const frame = el.querySelector(`iframe.guide-html-frame[data-guide-id="${g.id}"]`);
      if (frame) this._mountGuideHtml(frame, g.body || '');
    });

    el.querySelectorAll('.guide-head').forEach(head => {
      head.addEventListener('click', () => head.closest('.guide-item').classList.toggle('open'));
    });
    el.querySelectorAll('.guide-edit').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const g = guides.find(x => x.id === btn.dataset.guideId);
        if (g) this.openGuideModal(g);
      });
    });
    el.querySelectorAll('.guide-delete').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); this.deleteGuide(btn.dataset.guideId); });
    });
  }

  /* Мини-рендер Markdown (безопасный: сначала эскейпим, потом размечаем) */
  _mdRender(raw) {
    const esc = this.esc(raw);
    const lines = esc.split('\n');
    let html = '', listType = null;
    const closeList = () => { if (listType) { html += `</${listType}>`; listType = null; } };
    const inline = t => t
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\n]+?)\*/g, '$1<em>$2</em>')
      .replace(/`([^`]+?)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    for (let line of lines) {
      const h = line.match(/^(#{1,3})\s+(.*)$/);
      const ul = line.match(/^\s*[-*]\s+(.*)$/);
      const ol = line.match(/^\s*\d+\.\s+(.*)$/);
      if (h) {
        closeList();
        const lvl = h[1].length;
        html += `<h${lvl + 2} class="md-h md-h${lvl}">${inline(h[2])}</h${lvl + 2}>`;
      } else if (ul) {
        if (listType !== 'ul') { closeList(); html += '<ul>'; listType = 'ul'; }
        html += `<li>${inline(ul[1])}</li>`;
      } else if (ol) {
        if (listType !== 'ol') { closeList(); html += '<ol>'; listType = 'ol'; }
        html += `<li>${inline(ol[1])}</li>`;
      } else if (line.trim() === '') {
        closeList();
      } else {
        closeList();
        html += `<p>${inline(line)}</p>`;
      }
    }
    closeList();
    return html;
  }

  openGuideModal(guide = null) {
    if (this.currentUser?.role !== 'root') { this.toast('Только администратор может писать гайды'); return; }
    this._editingGuideId = guide?.id || null;
    this._guideFormat = guide?.format === 'html' ? 'html' : 'markdown';
    document.querySelector('#guideModal .modal-title').textContent = guide ? 'Редактировать гайд' : 'Новый гайд';
    document.getElementById('guideTitle').value = guide?.title || '';
    const ta = document.getElementById('guideBody');
    ta.value = guide?.body || '';
    ta.placeholder = this._guideFormat === 'html'
      ? 'Вставьте HTML-страницу целиком…'
      : '# Заголовок\n\nТекст гайда в **Markdown**…';
    // Переключатель формата
    document.querySelectorAll('#guideModal .guide-fmt').forEach(b => b.classList.toggle('active', b.dataset.fmt === this._guideFormat));
    // Сброс на вкладку «Текст»
    document.querySelectorAll('#guideModal .guide-tab').forEach(t => t.classList.toggle('active', t.dataset.gtab === 'edit'));
    ta.style.display = '';
    document.getElementById('guidePreview').style.display = 'none';
    this.openModal('guideModal');
    setTimeout(() => document.getElementById('guideTitle').focus(), 350);
  }

  /* Отрисовать превью редактора по текущему формату */
  _renderGuidePreview() {
    const ta = document.getElementById('guideBody');
    const pv = document.getElementById('guidePreview');
    if (this._guideFormat === 'html') {
      pv.classList.remove('md-body');
      pv.innerHTML = '';
      const frame = document.createElement('iframe');
      frame.className = 'guide-html-frame';
      pv.appendChild(frame);
      this._mountGuideHtml(frame, ta.value);
    } else {
      pv.classList.add('md-body');
      pv.innerHTML = this._mdRender(ta.value);
    }
  }

  /* Отрендерить произвольный HTML в песочнице (скрипты не исполняются),
     подогнать высоту iframe под контент. */
  _mountGuideHtml(frame, html) {
    frame.setAttribute('sandbox', 'allow-same-origin');
    const fit = () => {
      try {
        const d = frame.contentDocument;
        if (d) frame.style.height = Math.max(d.documentElement.scrollHeight, d.body?.scrollHeight || 0) + 'px';
      } catch {}
    };
    frame.addEventListener('load', () => { fit(); setTimeout(fit, 120); });
    frame.srcdoc = html || '';
  }

  async saveGuide() {
    const title = document.getElementById('guideTitle').value.trim();
    const body  = document.getElementById('guideBody').value;
    const format = this._guideFormat === 'html' ? 'html' : 'markdown';
    if (!title) { this.toast('Введите заголовок'); return; }
    if (this._editingGuideId) {
      await this.db.patchGuide(this._editingGuideId, { title, body, format });
      this.toast('Гайд обновлён ✓');
    } else {
      await this.db.addGuide({ title, body, format });
      this.toast('Гайд добавлен ✓');
    }
    this._editingGuideId = null;
    this.closeModal('guideModal');
    this.renderGuides();
  }

  async deleteGuide(id) {
    const ok = await this.confirm('Удалить этот гайд?');
    if (!ok) return;
    await this.db.deleteGuide(id);
    this.renderGuides();
  }

  /* ──────────────────────────────────────────
     FAQ-ТОПИКИ ВИТРИНЫ (управление во вкладке «Сайт»)
     ────────────────────────────────────────── */
  async renderFaqManageInto(el) {
    if (!el) return;
    const items = await this.db.getFaqItems();

    if (!items.length) {
      el.innerHTML = `<div class="site-mgmt-empty"><span>${uiIcon('msg', 16)}</span>Пока нет топиков — добавьте первый</div>`;
      return;
    }

    const svgCopy = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
    const svgDel  = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`;
    const svgEdit = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;

    this._faqCache = items;
    const ids    = new Set(items.map(i => i.id));
    const kidsOf = id => items.filter(i => i.parentId === id);
    // Вкладыш без видимой группы показываем на верхнем уровне
    const tops   = items.filter(i => !i.parentId || !ids.has(i.parentId));

    // isSub: вкладыш внутри топика-группы (вкладыши не вкладываются глубже)
    const itemHtml = (item, isSub = false) => {
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

      const siteBadge = item.showOnSite ? `<span class="site-tag" title="Виден на сайте">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg></span>` : '';
      const kids = isSub ? [] : kidsOf(item.id);
      return `
      <div class="faq-item${item.showOnSite ? ' faq-on-site' : ''}${isSub ? ' faq-subitem-adm' : ''}" data-faq-id="${item.id}">
        <div class="faq-head">
          <span class="faq-title">${this.esc(item.title)}${siteBadge}${this._visBadge(item)}${kids.length ? `<span class="faq-kids-count">${kids.length}</span>` : ''}</span>
          <svg class="faq-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
        <div class="faq-body">
          ${item.body ? `<div class="faq-text">${this.esc(item.body).replace(/\n/g, '<br>')}</div>` : ''}
          ${linesHtml}
          ${kids.length ? `<div class="faq-sublist">${kids.map(k => itemHtml(k, true)).join('')}</div>` : ''}
          <div class="faq-actions">
            ${isSub ? '' : `<button class="faq-addsub" data-faq-id="${item.id}">＋ Вкладыш</button>`}
            <button class="faq-edit" data-faq-id="${item.id}">${svgEdit} Изменить</button>
            <button class="faq-delete" data-faq-id="${item.id}">${svgDel} Удалить</button>
          </div>
        </div>
      </div>`;
    };

    el.innerHTML = `<div class="faq-list">${tops.map(t => itemHtml(t)).join('')}</div>`;

    el.querySelectorAll('.faq-head').forEach(head => {
      head.addEventListener('click', () => head.closest('.faq-item').classList.toggle('open'));
    });

    el.querySelectorAll('.faq-addsub').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        this.openFaqModal(null, btn.dataset.faqId);
      });
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

  openFaqModal(item = null, parentId = null) {
    this._editingFaqId = item?.id || null;
    // Вкладыш: parentId либо от существующей записи, либо от кнопки «＋ Вкладыш»
    this._faqParentId  = item ? (item.parentId || null) : (parentId || null);
    document.querySelector('#faqModal .modal-title').textContent =
      item ? 'Редактировать' : (this._faqParentId ? 'Новый вкладыш' : 'Новый топик');
    document.getElementById('faqTitle').value = item?.title || '';
    document.getElementById('faqBody').value  = item?.body  || '';
    // Новые топики по умолчанию видны на сайте
    document.getElementById('faqShowOnSite').checked = item ? !!item.showOnSite : true;
    const list = document.getElementById('faqLinesList');
    list.innerHTML = '';
    (item?.lines || []).forEach(l => this._addFaqLine(l.label, l.text));

    const isRoot = this.currentUser?.role === 'root';
    document.getElementById('faqVisGroup').style.display = isRoot ? '' : 'none';
    if (isRoot) this._renderVisChips('faqVisChips', item?.visibility || []);

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

    const isRoot = this.currentUser?.role === 'root';
    const vis    = isRoot ? this._readVis('faqVisChips') : undefined;
    const showOnSite = document.getElementById('faqShowOnSite').checked;
    const isNewFaq   = !this._editingFaqId;
    if (this._editingFaqId) {
      const patch = { title, body, lines, showOnSite };
      if (vis !== undefined) patch.visibility = vis;
      await this.db.patchFaqItem(this._editingFaqId, patch);
      this.toast('Топик обновлён ✓');
    } else {
      await this.db.addFaqItem({ title, body, lines, showOnSite,
        ...(this._faqParentId ? { parentId: this._faqParentId } : {}),
        ...(vis !== undefined ? { visibility: vis } : {}) });
      this.toast(this._faqParentId ? 'Вкладыш добавлен ✓' : 'Топик добавлен ✓');
    }
    this.db.logAction('site_faq', `FAQ-топик «${title}» ${isNewFaq ? 'добавлен' : 'изменён'}${showOnSite ? ' · виден на сайте' : ''}`);
    this._editingFaqId = null;
    this.closeModal('faqModal');
    this._refreshFaqManage();
  }

  async deleteFaqItem(id) {
    const ok = await this.confirm('Удалить этот топик?');
    if (!ok) return;
    const title = (this._faqCache || []).find(f => f.id === id)?.title;
    await this.db.deleteFaqItem(id);
    this.db.logAction('site_faq', `FAQ-топик «${title || '—'}» удалён`, { level: 'danger' });
    this._refreshFaqManage();
  }

  _refreshFaqManage() {
    const el = document.getElementById('faqManageList');
    if (el) this.renderFaqManageInto(el);
  }

  /* ──────────────────────────────────────────
     ПОДБОРКИ НА САЙТЕ
     ────────────────────────────────────────── */
  async openCollectionsModal() {
    await this.renderCollectionsList();
    this.openModal('collectionsModal');
  }

  async renderCollectionsList() {
    this._collections = await this.db.getCollections();
    const el = document.getElementById('collectionsList');
    if (!this._collections.length) {
      el.innerHTML = `<div class="faq-empty">
        <div style="opacity:.5">${uiIcon('folder', 30)}</div>
        <p>Подборок пока нет.<br>Создайте блок товаров — он появится на сайте.</p>
      </div>`;
      return;
    }
    el.innerHTML = `<div class="settings-section">` + this._collections.map(c => `
      <div class="settings-row" data-col-id="${c.id}">
        <div class="settings-row-icon" style="background:rgba(52,211,153,.12)">${uiIcon('folder', 14)}</div>
        <div class="settings-row-info">
          <div class="settings-row-title">${this.esc(c.title)}</div>
          <div class="settings-row-sub">${(c.itemIds || []).length} тов.${c.description ? ' · ' + this.esc(c.description) : ''}</div>
        </div>
        <button class="col-delete-btn" data-id="${c.id}" title="Удалить">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>`).join('') + `</div>`;
  }

  openCollectionModal(col = null) {
    this._editingColId = col?.id || null;
    // Удалённые, завершённые, распроданные и снятые с сайта товары на витрине
    // не видны — вычищаем их и из состава подборки (порядок показывал «призраков»)
    const alive = new Set((this.items || [])
      .filter(i => i.showOnSite && i.orderStatus !== 'done' && (parseInt(i.quantity) || 0) > 0)
      .map(i => i.id));
    this._colPicked    = new Set((col?.itemIds || []).filter(id => alive.has(id)));
    this._colLogo      = col?.logo || '';
    this._renderColLogo();
    document.getElementById('collectionModalTitle').textContent = col ? 'Изменить подборку' : 'Новая подборка';
    document.getElementById('colTitle').value = col?.title || '';
    document.getElementById('colDesc').value  = col?.description || '';
    this._renderColPicker();
    this._renderColOrder();
    this.openModal('collectionModal');
    if (!col) setTimeout(() => document.getElementById('colTitle').focus(), 350);
  }

  _renderColPicker() {
    const el    = document.getElementById('colItemsPicker');
    // То же правило, что и на витрине: без завершённых и распроданных
    const items = this.items.filter(i => i.showOnSite && i.orderStatus !== 'done' && (parseInt(i.quantity) || 0) > 0);
    if (!items.length) {
      el.innerHTML = `<div style="padding:14px;font-size:13px;color:var(--text3)">Нет товаров с галочкой «На сайте»</div>`;
      this._updateColCount();
      return;
    }
    el.innerHTML = items.map(i => `
      <div class="col-pick-row${this._colPicked.has(i.id) ? ' picked' : ''}" data-item-id="${i.id}">
        <div class="col-pick-thumb">${i.photo ? `<img src="${i.photo}" alt="">` : uiIcon('image', 15)}</div>
        <div class="col-pick-info">
          <div class="col-pick-name">${this.esc(i.name)}</div>
          <div class="col-pick-sub">${i.isMonarc ? 'Monarc' : 'Type'}${i.price ? ' · ' + fmtMoney(i.price) : ''}</div>
        </div>
        <div class="col-pick-check">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
      </div>`).join('');
    this._updateColCount();
  }

  _updateColCount() {
    document.getElementById('colPickerCount').textContent =
      this._colPicked?.size ? `· выбрано ${this._colPicked.size}` : '';
  }

  /* Порядок выбранных товаров: как в Set (порядок добавления),
     стрелки переставляют — так товары идут на сайте */
  _renderColOrder() {
    const grp = document.getElementById('colOrderGroup');
    const el  = document.getElementById('colOrderList');
    if (!grp || !el) return;
    const rows = [...this._colPicked]
      .map(id => this.items.find(i => i.id === id)).filter(Boolean);
    grp.hidden = rows.length < 2;
    if (grp.hidden) { el.innerHTML = ''; return; }
    el.innerHTML = rows.map((i, k) => {
      const cover = i.thumbs?.[0] || i.photos?.[0] || i.photo;
      return `<div class="settings-row col-ord-row" data-ord-id="${i.id}">
        <div class="col-pick-thumb">${cover ? `<img src="${this.esc(cover)}" alt="">` : uiIcon('image', 15)}</div>
        <div class="settings-row-info">
          <div class="settings-row-title">${this.esc(i.name)}</div>
        </div>
        <div class="block-row-actions">
          <button class="block-move col-ord-move" data-id="${i.id}" data-dir="up" title="Выше"${k === 0 ? ' disabled' : ''}>↑</button>
          <button class="block-move col-ord-move" data-id="${i.id}" data-dir="down" title="Ниже"${k === rows.length - 1 ? ' disabled' : ''}>↓</button>
        </div>
      </div>`;
    }).join('');
  }

  _renderColLogo() {
    const thumb = document.getElementById('colLogoThumb');
    const clear = document.getElementById('colLogoClear');
    const btn   = document.getElementById('colLogoBtn');
    if (!thumb) return;
    thumb.innerHTML = this._colLogo
      ? `<img src="${this.esc(this._colLogo)}" alt="" style="object-fit:contain">`
      : '<span>Нет лого</span>';
    clear?.classList.toggle('hidden', !this._colLogo);
    if (btn) btn.textContent = this._colLogo ? 'Заменить' : 'Загрузить';
  }

  _moveColItem(id, dir) {
    const arr = [...this._colPicked];
    const i = arr.indexOf(id);
    const j = dir === 'up' ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    this._colPicked = new Set(arr);
    this._renderColOrder();
  }

  async saveCollectionForm() {
    const title = document.getElementById('colTitle').value.trim();
    if (!title) { this.toast('Введите название подборки'); return; }
    const isNewCol = !this._editingColId;
    await this.db.saveCollection({
      ...(this._editingColId ? { id: this._editingColId } : { order: this._nextStreamOrder() }),
      title,
      description: document.getElementById('colDesc').value.trim(),
      logo:        this._colLogo || '',
      itemIds:     [...this._colPicked],
    });
    this.db.logAction('site_col', `Подборка «${title}» ${isNewCol ? 'создана' : 'изменена'} (${this._colPicked.size} тов.)`);
    this.closeModal('collectionModal');
    this.toast(isNewCol ? 'Подборка создана ✓' : 'Подборка обновлена ✓');
    this._editingColId = null;
    await this._refreshCollections();
  }

  /* ──────────────────────────────────────────
     БЛОКИ НА САЙТЕ (баннер / текст / промо)
     ────────────────────────────────────────── */
  async openBlocksModal() {
    await this.renderBlocksList();
    this.openModal('blocksModal');
  }

  async renderBlocksList() {
    this._blocks = (await this.db.getBlocks()).sort((a, b) => (a.order || 0) - (b.order || 0));
    const el = document.getElementById('blocksList');
    if (!this._blocks.length) {
      el.innerHTML = `<div class="faq-empty">
        <div style="opacity:.5">${uiIcon('layers', 30)}</div>
        <p>Блоков пока нет.<br>Добавьте баннер, текст или промо-полосу — они появятся на сайте.</p>
      </div>`;
      return;
    }
    const TYPE = {
      banner: { t: 'Баннер', e: uiIcon('image') }, weekly: { t: 'Товары недели', e: uiIcon('star') },
      duo: { t: 'Двойной баннер (старый)', e: uiIcon('image') }, statement: { t: 'Слоган', e: '✦' },
      marquee: { t: 'Бегущая строка', e: uiIcon('repeat', 13) },
      text: { t: 'Текст', e: uiIcon('fileText') }, promo: { t: 'Промо-полоса', e: uiIcon('megaphone') },
      popup: { t: 'Попап при входе', e: uiIcon('bell') }, cover: { t: 'Обложка раздела', e: uiIcon('image') },
    };
    const SEC  = { all: 'Оба сайта', monarc: 'Masqucerade', type: 'Type-clothes' };
    el.innerHTML = `<div class="settings-section">` + this._blocks.map((b, i) => {
      const meta  = TYPE[b.type] || { t: b.type, e: uiIcon('layers') };
      const label = b.type === 'promo' ? b.text : (b.heading || 'Без заголовка');
      return `<div class="settings-row block-row${b.enabled ? '' : ' off'}" data-block-id="${b.id}">
        ${this._blockThumb(b, meta.e)}
        <div class="settings-row-info">
          <div class="settings-row-title">${this.esc(label || meta.t)}</div>
          <div class="settings-row-sub">${meta.t} · ${SEC[b.section] || b.section}${b.enabled ? '' : ' · скрыт'}</div>
        </div>
        <div class="block-row-actions">
          <button class="block-move" data-id="${b.id}" data-dir="up" title="Выше"${i === 0 ? ' disabled' : ''}>↑</button>
          <button class="block-move" data-id="${b.id}" data-dir="down" title="Ниже"${i === this._blocks.length - 1 ? ' disabled' : ''}>↓</button>
          <button class="block-toggle" data-id="${b.id}" title="${b.enabled ? 'Скрыть' : 'Показать'}">${b.enabled ? uiIcon('eye', 13) : uiIcon('eyeOff', 13)}</button>
          <button class="block-delete-btn" data-id="${b.id}" title="Удалить">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>`;
    }).join('') + `</div>`;
  }

  async moveBlock(id, dir) {
    const arr = [...(this._blocks || [])];
    const i = arr.findIndex(b => b.id === id);
    const j = dir === 'up' ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    // Нормализуем порядок 0..n и сохраняем только сдвинувшиеся
    await Promise.all(arr.map((b, idx) => b.order === idx ? null : this.db.saveBlock({ id: b.id, order: idx })));
    this._logReorder();
    await this._refreshBlocks();
  }

  openBlockModal(block = null) {
    this._blockIsNew = !block;
    this._cropView = 'd';
    this._block = block ? { ...block } : { type: 'banner', section: 'all', enabled: true, linkType: 'none' };
    document.getElementById('blockModalTitle').textContent = block ? 'Изменить блок' : 'Новый блок';
    this._renderBlockForm();
    this.openModal('blockModal');
  }

  _renderBlockForm() {
    const b = this._block;
    const esc = s => this.esc(s);
    const seg = (name, opts) => `<div class="blk-seg" data-seg="${name}">` +
      opts.map(o => `<button type="button" class="${b[name] === o.v ? 'on' : ''}" data-val="${o.v}">${o.t}</button>`).join('') + `</div>`;
    const g = (label, inner) => `<div class="form-group"><label class="form-label">${label}</label>${inner}</div>`;
    // Универсальная загрузка картинки в поле field
    const imgField = (field, label) => g(label, `
      <div class="blk-banner-upload" data-imgfield="${field}">
        <div class="blk-thumb">${b[field] ? `<img src="${esc(b[field])}" alt="">` : '<span>Нет фото</span>'}</div>
        <div class="blk-upload-actions">
          <button type="button" class="btn-line blk-img-btn">${b[field] ? 'Заменить' : 'Загрузить'}</button>
          ${b[field] ? `<button type="button" class="btn-line danger blk-img-clear">Убрать</button>` : ''}
        </div>
        <input type="file" class="blk-img-input" accept="image/*" hidden>
      </div>`);
    // Универсальный выбор ссылки (typeKey/valueKey — куда пишем)
    const linkField = (typeKey, valueKey, label) => g(label, `
      <div class="blk-linkgroup">
        <select class="form-input blk-linktype" data-typekey="${typeKey}" data-valkey="${valueKey}">
          ${[['none', 'Без ссылки'], ['monarc', 'Раздел Monarc'], ['type', 'Раздел Type'], ['tg', 'Telegram'], ['url', 'Своя ссылка']]
            .map(([v, t]) => `<option value="${v}"${(b[typeKey] || 'none') === v ? ' selected' : ''}>${t}</option>`).join('')}
        </select>
        <input type="text" class="form-input blk-linkvalue" value="${esc(b[valueKey] || '')}" placeholder="https://…" style="margin-top:8px;${b[typeKey] === 'url' ? '' : 'display:none'}">
      </div>`);
    // Несколько картинок в поле-массиве field
    const imagesField = (field, label) => {
      const arr = b[field] || [];
      return g(label, `
        <div class="blk-images" data-imgsfield="${field}">
          ${arr.map((src, idx) => `<div class="blk-img-tile"><img src="${esc(src)}" alt="">${idx === 0 ? '<span class="blk-img-main">Главное</span>' : ''}<button type="button" class="blk-img-del" data-idx="${idx}" title="Убрать">×</button></div>`).join('')}
          <button type="button" class="blk-imgs-add" title="Добавить фото">＋</button>
          <input type="file" class="blk-imgs-input" accept="image/*" hidden multiple>
        </div>`);
    };

    let html = '';
    if (this._blockIsNew) {
      // Выбор типа — карточки с мини-схемой «как это выглядит на сайте»:
      // по одним названиям тип не вспомнить
      const sw = `fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"`;
      const TYPES = [
        { v: 'banner', t: 'Баннер', d: 'Крупное фото в потоке витрины',
          s: `<svg viewBox="0 0 54 36" ${sw}><rect x="3" y="6" width="48" height="24" rx="3"/><circle cx="13" cy="14" r="2.4"/><path d="M7 25l9-7 7 5 6-4 10 6"/></svg>` },
        { v: 'cover', t: 'Обложка', d: 'Первый экран раздела, во всю высоту',
          s: `<svg viewBox="0 0 54 36" ${sw}><rect x="12" y="2" width="30" height="32" rx="3"/><path d="M17 20l7-6 5 4 8-5"/><path d="M24 28l3 3 3-3"/></svg>` },
        { v: 'weekly', t: 'Товары', d: 'Полка выбранных товаров',
          s: `<svg viewBox="0 0 54 36" ${sw}><rect x="4" y="8" width="13" height="20" rx="2"/><rect x="20.5" y="8" width="13" height="20" rx="2"/><rect x="37" y="8" width="13" height="20" rx="2"/></svg>` },
        { v: 'statement', t: 'Слоган', d: 'Крупная фраза по центру',
          s: `<svg viewBox="0 0 54 36" ${sw}><path d="M13 15h28" stroke-width="3"/><path d="M18 22h18" stroke-width="3"/></svg>` },
        { v: 'text', t: 'Текст', d: 'Заголовок и абзац текста',
          s: `<svg viewBox="0 0 54 36" ${sw}><path d="M8 10h22" stroke-width="2.6"/><path d="M8 17h38M8 23h32"/></svg>` },
        { v: 'marquee', t: 'Строка', d: 'Бегущая строка через экран',
          s: `<svg viewBox="0 0 54 36" ${sw}><path d="M4 18h40"/><path d="M40 13l7 5-7 5"/></svg>` },
        { v: 'promo', t: 'Промо', d: 'Тонкая полоса-объявление сверху',
          s: `<svg viewBox="0 0 54 36" ${sw}><rect x="3" y="4" width="48" height="7" rx="3.5"/><rect x="7" y="17" width="40" height="15" rx="2" opacity=".35"/></svg>` },
        { v: 'popup', t: 'Попап', d: 'Окно при входе на сайт',
          s: `<svg viewBox="0 0 54 36" ${sw}><rect x="4" y="4" width="46" height="28" rx="3" opacity=".35"/><rect x="16" y="10" width="22" height="16" rx="3"/></svg>` },
      ];
      html += g('Тип блока', `<div class="blk-seg blk-type-grid" data-seg="type">` + TYPES.map(o =>
        `<button type="button" class="${b.type === o.v ? 'on' : ''}" data-val="${o.v}">
          <span class="btg-scheme">${o.s}</span>
          <span class="btg-name">${o.t}</span>
          <span class="btg-desc">${o.d}</span>
        </button>`).join('') + `</div>`);
    }
    html += g('Сайт', seg('section', [{ v: 'all', t: 'Оба сайта' }, { v: 'monarc', t: 'Masqucerade' }, { v: 'type', t: 'Type-clothes' }]));

    if (b.type === 'banner') {
      // Дефолты нового баннера
      b.height = b.height || 'm'; b.fit = b.fit || 'cover'; b.pos = b.pos || 'center center';
      html += `<div class="blk-hint">Большое фото на витрине. Высоту, кадрирование и фокус можно подстроить — предпросмотр покажет, как будет на сайте.</div>`;
      html += imgField('image', 'Фото');
      if (b.image) html += g('Предпросмотр', `
        <div class="blk-banner-preview h-${b.height}">
          <img src="${esc(b.image)}" alt="" style="object-fit:${b.fit};object-position:${esc(b.pos)}">
          ${b.heading ? `<div class="blk-preview-cap">${esc(b.heading)}</div>` : ''}
        </div>`);
      html += g('Высота баннера', seg('height', [
        { v: 's', t: 'Низкий' }, { v: 'm', t: 'Средний' }, { v: 'l', t: 'Высокий' }, { v: 'xl', t: 'Экран' },
      ]));
      html += g('Кадрирование', seg('fit', [
        { v: 'cover', t: 'Заполнить' }, { v: 'contain', t: 'Фото целиком' },
      ]));
      if (b.fit === 'cover') html += g('Фокус фото — какая часть в кадре', `
        <div class="blk-seg blk-pos-grid" data-seg="pos">
          ${['left top','center top','right top','left center','center center','right center','left bottom','center bottom','right bottom']
            .map(v => `<button type="button" class="${b.pos === v ? 'on' : ''}" data-val="${v}" title="${v}"><i></i></button>`).join('')}
        </div>`);
      html += g('Заголовок (необязательно)', `<input type="text" class="form-input" id="blkHeading" value="${esc(b.heading || '')}" placeholder="Например: Новая коллекция">`);
      html += g('Подпись (необязательно)', `<input type="text" class="form-input" id="blkSub" value="${esc(b.sub || '')}" placeholder="Короткий текст под заголовком">`);
      html += linkField('linkType', 'linkValue', 'Ссылка');
    } else if (b.type === 'duo') {
      html += `<div class="blk-hint">Две картинки рядом (на мобильном — друг под другом). Заголовок и ссылка у каждой — по желанию.</div>`;
      html += imgField('imageA', 'Картинка 1');
      html += g('Заголовок 1 (необязательно)', `<input type="text" class="form-input" id="blkCaptionA" value="${esc(b.captionA || '')}" placeholder="Например: Новинки">`);
      html += linkField('linkTypeA', 'linkValueA', 'Ссылка 1');
      html += `<div class="blk-divider"></div>`;
      html += imgField('imageB', 'Картинка 2');
      html += g('Заголовок 2 (необязательно)', `<input type="text" class="form-input" id="blkCaptionB" value="${esc(b.captionB || '')}" placeholder="Например: Sale">`);
      html += linkField('linkTypeB', 'linkValueB', 'Ссылка 2');
    } else if (b.type === 'statement') {
      html += `<div class="blk-hint">Крупное центрированное заявление — как разворот в лукбуке.</div>`;
      html += g('Надзаголовок (необязательно)', `<input type="text" class="form-input" id="blkKicker" value="${esc(b.kicker || '')}" placeholder="Например: Новый сезон">`);
      html += g('Текст <span style="color:var(--text3);font-weight:400">— Enter для новой строки</span>',
        `<textarea class="form-input form-textarea" id="blkStatement" rows="3" placeholder="Например: Сделано\nдля тех, кто\nвыбирает лучшее">${esc(b.text || '')}</textarea>`);
    } else if (b.type === 'text') {
      html += g('Заголовок <span style="color:var(--text3);font-weight:400">— Enter для новой строки</span>',
        `<textarea class="form-input form-textarea" id="blkHeading" rows="2" placeholder="Например: Условия\nдоставки">${esc(b.heading || '')}</textarea>`);
      html += g('Текст', `<textarea class="form-input form-textarea" id="blkBody" rows="5" placeholder="Текст блока…">${esc(b.body || '')}</textarea>`);
    } else if (b.type === 'marquee') {
      html += `<div class="blk-hint">Бегущая строка — фраза плавно едет по экрану.</div>`;
      html += g('Текст строки', `<input type="text" class="form-input" id="blkMarquee" value="${esc(b.text || '')}" placeholder="Например: Новая коллекция уже здесь">`);
    } else if (b.type === 'cover') {
      b.pos = b.pos || 'center center'; b.fit = b.fit || 'cover';
      html += `<div class="blk-hint">Заглавный кадр на самом верху раздела, ниже посетитель листает к товарам. Несколько включённых обложек раздела показываются по очереди.</div>`;
      const dim = t => `<span style="color:var(--text3);font-weight:400">${t}</span>`;
      html += imgField('image', `Фото — десктоп ${dim('· горизонтальное, лучше 2560×1440 (16:9)')}`);
      html += imgField('imageM', `Фото — телефон ${dim('· вертикальное, лучше 1080×1920 (9:16)')}`);
      if (!b.imageM) html += `<div class="blk-hint" style="margin-top:-6px">Телефонное фото не задано — на мобильных покажется обрезанное десктопное. Вертикальная версия смотрится заметно лучше.</div>`;
      html += g('Кадр', seg('fit', [
        { v: 'cover', t: 'На весь экран' }, { v: 'auto', t: 'Фото целиком' },
      ]));
      if (b.image && b.fit !== 'auto') {
        // Интерактивный кадр: рамка = экран посетителя, тянешь фото — выбираешь,
        // что видно. Десктоп и телефон кадрируются отдельно (pos / posM);
        // вкладка «Телефон» показывает своё фото, если оно задано
        const view = this._cropView === 'm' ? 'm' : 'd';
        const stageSrc = view === 'm' && b.imageM ? b.imageM : b.image;
        html += g('Как будет на сайте — потяните фото, чтобы выбрать кадр', `
          <div class="blk-seg blk-crop-tabs" style="margin-bottom:8px">
            <button type="button" class="blk-crop-tab${view === 'd' ? ' on' : ''}" data-crop="d">Десктоп</button>
            <button type="button" class="blk-crop-tab${view === 'm' ? ' on' : ''}" data-crop="m">Телефон${b.imageM ? ' · своё фото' : ''}</button>
          </div>
          <div class="blk-crop-stage${view === 'm' ? ' m' : ''}" id="blkCropStage">
            <img src="${esc(stageSrc)}" alt="" draggable="false">
          </div>`);
      } else if (b.image) {
        html += g('Предпросмотр', `
          <div class="blk-banner-preview h-xl">
            <img src="${esc(b.image)}" alt="" style="object-fit:contain">
          </div>`);
      }
      html += g('Название <span style="color:var(--text3);font-weight:400">— видно только в панели</span>',
        `<input type="text" class="form-input" id="blkHeading" value="${esc(b.heading || '')}" placeholder="Например: Обложка SS26">`);
    } else if (b.type === 'popup') {
      b.repeat = b.repeat || 'once';
      html += `<div class="blk-hint">Всплывающее окно при заходе на сайт — анонс, акция или приветствие. «Один раз» — после закрытия посетителя больше не беспокоим.</div>`;
      html += imgField('image', 'Картинка (необязательно)');
      html += g('Заголовок', `<input type="text" class="form-input" id="blkHeading" value="${esc(b.heading || '')}" placeholder="Например: Новый дроп уже на сайте">`);
      html += g('Текст', `<textarea class="form-input form-textarea" id="blkPopupText" rows="3" placeholder="Пара предложений для посетителя…">${esc(b.text || '')}</textarea>`);
      html += linkField('linkType', 'linkValue', 'Кнопка (куда ведёт)');
      html += g('Надпись на кнопке (необязательно)', `<input type="text" class="form-input" id="blkBtnLabel" value="${esc(b.btnLabel || '')}" placeholder="Смотреть / Написать нам…">`);
      html += g('Показывать', seg('repeat', [{ v: 'once', t: 'Один раз' }, { v: 'always', t: 'Каждый заход' }]));
    } else if (b.type === 'weekly') {
      html += `<div class="blk-hint">Витрина выбранных товаров с заголовком. Показываются только товары с галочкой «На сайте».</div>`;
      html += g('Заголовок', `<input type="text" class="form-input" id="blkHeading" value="${esc(b.heading || 'Товары недели')}" placeholder="Товары недели">`);
      const picks = new Set(b.itemIds || []);
      const pickable = this.items.filter(i => i.showOnSite && i.orderStatus !== 'done');
      const pickRows = pickable.length ? pickable.map(i => {
        const cover = i.thumbs?.[0] || i.photos?.[0] || i.photo;
        return `<div class="col-pick-row${picks.has(i.id) ? ' picked' : ''}" data-pick-id="${i.id}">
          <div class="col-pick-thumb">${cover ? `<img src="${esc(cover)}" alt="">` : uiIcon('image', 15)}</div>
          <div class="col-pick-info"><div class="col-pick-name">${esc(i.name)}</div><div class="col-pick-sub">${i.isMonarc ? 'Monarc' : 'Type'}${i.price ? ' · ' + fmtMoney(i.price) : ''}</div></div>
          <div class="col-pick-check"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div>
        </div>`;
      }).join('') : `<div style="padding:14px;font-size:13px;color:var(--text3)">Нет товаров с галочкой «На сайте»</div>`;
      html += g(`Товары <span id="blkPickCount" style="color:var(--text3);font-weight:400">· выбрано ${picks.size}</span>`, `<div class="col-items-picker">${pickRows}</div>`);
    } else {
      html += g('Текст полосы', `<input type="text" class="form-input" id="blkText" value="${esc(b.text || '')}" placeholder="Например: Бесплатная доставка от 5000 ₽">`);
    }
    document.getElementById('blockFormBody').innerHTML = html;
    this._initCropDrag();
  }

  /* Перетаскивание фото в кадре обложки: объект-позиция в процентах.
     Десктоп пишет в pos, телефон — в posM (сайт возьмёт его в мобильной вёрстке). */
  _initCropDrag() {
    const stage = document.getElementById('blkCropStage');
    if (!stage) return;
    const img = stage.querySelector('img');
    const key = this._cropView === 'm' ? 'posM' : 'pos';
    const parse = v => {
      const m = /^([\d.]+)%\s+([\d.]+)%$/.exec(v || '');
      if (m) return [parseFloat(m[1]), parseFloat(m[2])];
      const map = { left: 0, top: 0, center: 50, right: 100, bottom: 100 };
      const p = String(v || 'center center').split(/\s+/);
      return [map[p[0]] ?? 50, map[p[1]] ?? 50];
    };
    // Телефон без своего кадра наследует десктопный
    let [px, py] = parse(this._block[key] || this._block.pos);
    img.style.objectPosition = `${px}% ${py}%`;
    let drag = null;
    stage.onpointerdown = (e) => {
      if (!img.naturalWidth) return;
      e.preventDefault();
      try { stage.setPointerCapture(e.pointerId); } catch {}
      const scale = Math.max(stage.clientWidth / img.naturalWidth, stage.clientHeight / img.naturalHeight);
      drag = { x: e.clientX, y: e.clientY, px, py,
               ox: img.naturalWidth * scale - stage.clientWidth,
               oy: img.naturalHeight * scale - stage.clientHeight };
    };
    stage.onpointermove = (e) => {
      if (!drag) return;
      // Сдвиг фото вправо = показываем левую часть (процент меньше)
      if (drag.ox > 1) px = Math.min(100, Math.max(0, drag.px - (e.clientX - drag.x) / drag.ox * 100));
      if (drag.oy > 1) py = Math.min(100, Math.max(0, drag.py - (e.clientY - drag.y) / drag.oy * 100));
      img.style.objectPosition = `${px}% ${py}%`;
      this._block[key] = `${Math.round(px)}% ${Math.round(py)}%`;
    };
    stage.onpointerup = stage.onpointercancel = () => { drag = null; };
  }

  _readBlockForm() {
    const b = this._block;
    const set = (id, key, trim = true) => { const el = document.getElementById(id); if (el) b[key] = trim ? el.value.trim() : el.value; };
    if (b.type === 'text')            { set('blkHeading', 'heading'); set('blkBody', 'body', false); }
    else if (b.type === 'promo')      { set('blkText', 'text'); }
    else if (b.type === 'marquee')    { set('blkMarquee', 'text'); }
    else if (b.type === 'popup')      { set('blkHeading', 'heading'); set('blkPopupText', 'text', false); set('blkBtnLabel', 'btnLabel'); }
    else if (b.type === 'cover')      { set('blkHeading', 'heading'); }   // имя для панели, на сайт не идёт
    else if (b.type === 'statement')  { set('blkKicker', 'kicker'); set('blkStatement', 'text', false); }
    else if (b.type === 'weekly')     { set('blkHeading', 'heading'); }
    else if (b.type === 'banner')     { set('blkHeading', 'heading'); set('blkSub', 'sub'); }
    else if (b.type === 'duo')        { set('blkCaptionA', 'captionA'); set('blkCaptionB', 'captionB'); }
    // ссылки — общий механизм
    document.querySelectorAll('#blockFormBody .blk-linkgroup').forEach(gp => {
      const sel = gp.querySelector('.blk-linktype'), inp = gp.querySelector('.blk-linkvalue');
      if (sel) { b[sel.dataset.typekey] = sel.value; if (inp) b[sel.dataset.valkey] = inp.value.trim(); }
    });
  }

  _onBlockFormClick(e) {
    // Вкладки кадра (десктоп/телефон) — раньше общего .blk-seg: у них нет data-seg
    const cropTab = e.target.closest('.blk-crop-tab');
    if (cropTab) {
      this._readBlockForm();
      this._cropView = cropTab.dataset.crop;
      this._renderBlockForm();
      return;
    }
    const seg = e.target.closest('.blk-seg button');
    if (seg) {
      this._readBlockForm();
      this._block[seg.parentElement.dataset.seg] = seg.dataset.val;
      this._renderBlockForm();
      return;
    }
    const pick = e.target.closest('.col-pick-row');
    if (pick) {
      const id = pick.dataset.pickId;
      const ids = this._block.itemIds = this._block.itemIds || [];
      const at = ids.indexOf(id);
      if (at >= 0) ids.splice(at, 1); else ids.push(id);
      pick.classList.toggle('picked', at < 0);
      const cnt = document.getElementById('blkPickCount');
      if (cnt) cnt.textContent = '· выбрано ' + ids.length;
      return;
    }
    const btn = e.target.closest('.blk-img-btn');
    if (btn) { btn.closest('[data-imgfield]').querySelector('.blk-img-input').click(); return; }
    const clr = e.target.closest('.blk-img-clear');
    if (clr) { this._readBlockForm(); this._block[clr.closest('[data-imgfield]').dataset.imgfield] = ''; this._renderBlockForm(); return; }
    const addImgs = e.target.closest('.blk-imgs-add');
    if (addImgs) { addImgs.closest('[data-imgsfield]').querySelector('.blk-imgs-input').click(); return; }
    const delImg = e.target.closest('.blk-img-del');
    if (delImg) {
      this._readBlockForm();
      const field = delImg.closest('[data-imgsfield]').dataset.imgsfield;
      (this._block[field] = this._block[field] || []).splice(+delImg.dataset.idx, 1);
      this._renderBlockForm();
    }
  }

  _onBlockFormChange(e) {
    if (e.target.classList.contains('blk-img-input')) {
      const field = e.target.closest('[data-imgfield]').dataset.imgfield;
      const f = e.target.files[0];
      // Обложка тянется на всю ширину больших мониторов — ей нужен запас;
      // телефонной версии хватает 1600 по длинной стороне
      const maxSide = field === 'imageM' ? 1600 : this._block?.type === 'cover' ? 2560 : 1920;
      if (f) resizeImage(f, maxSide, maxSide, 0.88)
        .then(url => { this._readBlockForm(); this._block[field] = url; this._renderBlockForm(); })
        .catch(() => this.toast('Ошибка загрузки фото'));
      return;
    }
    if (e.target.classList.contains('blk-imgs-input')) {
      const field = e.target.closest('[data-imgsfield]').dataset.imgsfield;
      const files = [...e.target.files];
      if (files.length) Promise.all(files.map(f => resizeImage(f, 1600, 1600, 0.85)))
        .then(urls => { this._readBlockForm(); this._block[field] = [...(this._block[field] || []), ...urls]; this._renderBlockForm(); })
        .catch(() => this.toast('Ошибка загрузки фото'));
      return;
    }
    if (e.target.classList.contains('blk-linktype')) {
      const lv = e.target.parentElement.querySelector('.blk-linkvalue');
      if (lv) lv.style.display = e.target.value === 'url' ? '' : 'none';
    }
  }

  async saveBlockForm() {
    this._readBlockForm();
    const b = this._block;
    if (b.type === 'promo'     && !b.text)                { this.toast('Введите текст полосы'); return; }
    if (b.type === 'marquee'   && !b.text)                { this.toast('Введите текст строки'); return; }
    if (b.type === 'statement' && !b.text)                { this.toast('Введите текст слогана'); return; }
    if (b.type === 'text'      && !b.heading && !b.body)  { this.toast('Заполните заголовок или текст'); return; }
    if (b.type === 'banner'    && !b.image)               { this.toast('Добавьте фото баннера'); return; }
    if (b.type === 'duo'       && !b.imageA && !b.imageB) { this.toast('Добавьте хотя бы одну картинку'); return; }
    if (b.type === 'weekly'    && !(b.itemIds && b.itemIds.length)) { this.toast('Выберите хотя бы один товар'); return; }
    if (b.type === 'popup'     && !b.heading && !b.text)  { this.toast('Заполните заголовок или текст попапа'); return; }
    if (b.type === 'cover'     && !b.image)               { this.toast('Добавьте фото обложки'); return; }
    if (this._blockIsNew && this.currentView === 'site') b.order = this._nextStreamOrder();  // в конец потока
    await this.db.saveBlock(b);
    this.db.logAction('site_block', `${this._blockLabel(b)} ${this._blockIsNew ? 'создан' : 'изменён'} на витрине`);
    this.closeModal('blockModal');
    this.toast(this._blockIsNew ? 'Блок создан ✓' : 'Блок обновлён ✓');
    await this._refreshBlocks();
  }

  _refreshBlocks()      { return this.currentView === 'site' ? this.renderSiteView() : this.renderBlocksList(); }
  _refreshCollections() { return this.currentView === 'site' ? this.renderSiteView() : this.renderCollectionsList(); }

  /* ──────────────────────────────────────────
     ВКЛАДКА «САЙТ» — витрина как в окне браузера
     Hero-превью + скользящие вкладки Витрина / Товары / FAQ
     ────────────────────────────────────────── */
  async renderSiteView() {
    const el = document.getElementById('siteContent');
    if (!this._siteSubTab) this._siteSubTab = 'showcase';

    const [blocks, cols, faq, orders] = await Promise.all([
      this.db.getBlocks(), this.db.getCollections(), this.db.getFaqItems(), this.db.getOrders(),
    ]);
    this._blocks = blocks;
    this._collections = cols;
    this._faqCache = faq;
    this._orders = orders;

    // Единый порядок: блоки и подборки в одной последовательности, чтобы их
    // можно было чередовать. Старые независимые нумерации могли пересекаться —
    // само-исцеляем: раз нормализуем в 0..n.
    let stream = [
      ...blocks.map(b => ({ kind: 'block', id: b.id, order: b.order ?? 0, ref: b })),
      ...cols.map(c   => ({ kind: 'col',   id: c.id, order: c.order ?? 0, ref: c })),
    ].sort((a, b) => (a.order - b.order) || (a.kind === 'col' ? 1 : -1) || (a.id < b.id ? -1 : 1));
    if (stream.some((x, i) => x.order !== i)) {
      await Promise.all(stream.map((x, i) => x.order === i ? null :
        (x.kind === 'block' ? this.db.saveBlock({ id: x.id, order: i }) : this.db.saveCollection({ id: x.id, order: i }))));
      stream.forEach((x, i) => { x.order = i; x.ref.order = i; });
    }
    this._stream = stream;

    const onSite = (this.items || []).filter(i => i.showOnSite);
    const views  = onSite.reduce((s, i) => s + (i.views || 0), 0);
    const plur = (n, f) => { const m = n % 100, d = n % 10; if (m > 10 && m < 20) return f[2]; if (d > 1 && d < 5) return f[1]; if (d === 1) return f[0]; return f[2]; };

    /* ── Компактная панель: открыть сайт + счётчики (без декораций) ── */
    const host = (location.host || 'masqucerade.com').replace(/^www\./, '');
    const extSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7"/><path d="M8 7h9v9"/></svg>`;
    const eyeSvg = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>`;

    const hero = `
      <div class="site-topbar">
        <div class="site-topbar-left">
          <a class="site-open-btn" href="/" target="_blank" rel="noopener">Открыть сайт ${extSvg}</a>
          <span class="site-topbar-host">${this.esc(host)}</span>
        </div>
        <div class="site-topbar-stats">
          <span class="sb-stat"><b>${onSite.length}</b> ${plur(onSite.length, ['товар', 'товара', 'товаров'])}</span>
          <span class="sb-stat"><b>${blocks.length}</b> ${plur(blocks.length, ['блок', 'блока', 'блоков'])}</span>
          <span class="sb-stat"><b>${cols.length}</b> ${plur(cols.length, ['подборка', 'подборки', 'подборок'])}</span>
          <span class="sb-stat sb-stat-views">${eyeSvg}<b>${fmtNum(views)}</b></span>
        </div>
      </div>`;

    /* ── Скользящие вкладки ── */
    const tabBtn = (sub, label, n) =>
      `<button class="proj-tab${this._siteSubTab === sub ? ' active' : ''}" data-sub="${sub}">${label}<span class="proj-tab-count">${n || ''}</span></button>`;
    const tabs = `
      <div class="proj-tabs site-tabs" id="siteTabs">
        <div class="proj-tabs-glider"></div>
        ${tabBtn('showcase', 'Витрина', stream.length)}
        ${tabBtn('items', 'Товары', onSite.length)}
        ${tabBtn('orders', 'Заявки', orders.filter(o => o.status === 'new').length)}
        ${tabBtn('faq', 'FAQ', faq.length)}
        ${tabBtn('lang', 'Языки', '')}
      </div>`;

    el.innerHTML = hero + tabs + `<div id="sitePane"></div>`;

    document.querySelectorAll('#siteTabs .proj-tab').forEach(btn => {
      btn.onclick = () => {
        if (this._siteSubTab === btn.dataset.sub) return;
        this._siteSubTab = btn.dataset.sub;
        document.querySelectorAll('#siteTabs .proj-tab').forEach(b => b.classList.toggle('active', b === btn));
        this._moveSiteGlider();
        this._renderSitePane(true);
      };
    });
    requestAnimationFrame(() => requestAnimationFrame(() => this._moveSiteGlider()));
    setTimeout(() => this._moveSiteGlider(), 120);
    if (!this._siteGliderResizeBound) {
      this._siteGliderResizeBound = true;
      window.addEventListener('resize', () => { if (this.currentView === 'site') this._moveSiteGlider(); });
    }
    this._renderSitePane();
  }

  _moveSiteGlider() {
    const bar = document.getElementById('siteTabs');
    const act = bar?.querySelector('.proj-tab.active');
    const gl  = bar?.querySelector('.proj-tabs-glider');
    if (!bar || !act || !gl) return;
    bar.dataset.tab    = this._siteSubTab;
    gl.style.width     = act.offsetWidth + 'px';
    gl.style.transform = `translateX(${act.offsetLeft - 4}px)`;
  }

  _renderSitePane(animate = false) {
    const pane = document.getElementById('sitePane');
    if (!pane) return;
    if (this._siteSubTab === 'items')       this._renderSiteItems(pane);
    else if (this._siteSubTab === 'faq')    this._renderSiteFaq(pane);
    else if (this._siteSubTab === 'orders') this._renderSiteOrders(pane);
    else if (this._siteSubTab === 'lang')   this._renderSiteLang(pane);
    else                                    this._renderSiteShowcase(pane);
    if (animate) { pane.classList.remove('pane-in'); void pane.offsetWidth; pane.classList.add('pane-in'); }
  }

  /* К какому сайту относится элемент потока: блок — по полю section,
     подборка — по товарам внутри (все Monarc → masqucerade, все Type → type) */
  _streamSite(x) {
    if (x.kind === 'block') {
      const s = x.ref.section;
      return s === 'monarc' ? 'monarc' : s === 'type' ? 'type' : 'both';
    }
    const ids = new Set(x.ref.itemIds || []);
    const its = (this.items || []).filter(i => ids.has(i.id));
    if (its.length && its.every(i => i.isMonarc))  return 'monarc';
    if (its.length && its.every(i => !i.isMonarc)) return 'type';
    return 'both';
  }

  /* ── Вкладка «Витрина»: два сайта, у каждого свой список блоков и подборок.
     Блок «Оба сайта» виден в обеих колонках; стрелки двигают в рамках сайта. ── */
  _renderSiteShowcase(pane) {
    const stream = this._stream || [];
    const group = site => stream.filter(x => { const s = this._streamSite(x); return s === site || s === 'both'; });
    const listHtml = arr => arr.length
      ? arr.map((x, i) => x.kind === 'block'
          ? this._blockRowHtml(x.ref, i, arr.length)
          : this._colRowHtml(x.ref, i, arr.length)).join('')
      : `<div class="site-mgmt-empty"><span>${uiIcon('layers', 16)}</span>Пока пусто — добавьте блок</div>`;
    pane.innerHTML = `
      <div class="site-sec-head">
        <div><div class="site-sec-title">Блоки и подборки</div><div class="site-sec-hint">У каждого сайта свой список; блок «Оба сайта» виден на обоих. Порядок — стрелками</div></div>
        <div class="site-sec-actions">
          <button class="site-mini-add block-add">＋ Блок</button>
          <button class="site-mini-add col-add">＋ Подборку</button>
        </div>
      </div>
      <div class="site-split">
        <div class="site-split-col" data-site="monarc">
          <div class="site-split-head">masqucerade.com</div>
          <div class="settings-section">${listHtml(group('monarc'))}</div>
        </div>
        <div class="site-split-col" data-site="type">
          <div class="site-split-head">type-clothes.com</div>
          <div class="settings-section">${listHtml(group('type'))}</div>
        </div>
      </div>`;
  }

  /* ── Вкладка «Товары»: что сейчас на витрине ── */
  _renderSiteItems(pane) {
    const onSite = (this.items || []).filter(i => i.showOnSite)
      .sort((a, b) => (b.views || 0) - (a.views || 0));
    if (!onSite.length) {
      pane.innerHTML = `<div class="site-empty-card">
        <div class="site-empty-emoji">${uiIcon('package', 30)}</div>
        <div class="site-empty-title">На витрине пока нет товаров</div>
        <div class="site-empty-sub">Откройте карточку товара и включите тумблер «На сайте» — он появится в каталоге витрины.</div>
      </div>`;
      return;
    }
    const eyeSvg = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>`;
    pane.innerHTML = `<div class="site-items-grid">${onSite.map(it => {
      const cov  = it.thumbs?.[0] || it.photos?.[0] || it.photo;
      const sold = it.orderStatus === 'done' || (it.quantity || 0) <= 0;
      return `<button class="site-item-card${sold ? ' sold' : ''}" data-site-item="${it.id}">
        <div class="site-item-thumb">
          ${cov ? `<img src="${cov}" loading="lazy" alt="">` : `<span class="site-item-ph">${uiIcon('image', 15)}</span>`}
          <span class="site-item-views">${eyeSvg}${fmtNum(it.views || 0)}${it.tgClicks ? ` · ${uiIcon('msg', 10)} ${fmtNum(it.tgClicks)}` : ''}</span>
          ${sold ? `<span class="site-item-sold">Продано</span>` : ''}
        </div>
        <div class="site-item-name">${this.esc(it.name || '—')}</div>
        <div class="site-item-price">${it.price ? fmtMoney(it.price) : '—'}</div>
      </button>`;
    }).join('')}</div>`;
  }

  /* ── Вкладка «Языки»: английские версии текстов витрины ──
     Строки собираются из данных панели (товары, категории, подборки, блоки,
     FAQ). Пустой перевод = на английской витрине показывается оригинал. */
  async _renderSiteLang(pane) {
    pane.innerHTML = `<div class="site-mgmt-empty"><span>${uiIcon('fileText', 16)}</span>Собираем тексты витрины…</div>`;
    const { groups, map } = await this.db.getI18n();
    this._i18nMap = { ...map };

    const total = groups.reduce((a, g) => a + g.strings.length, 0);
    const done  = groups.reduce((a, g) => a + g.strings.filter(x => (map[x] || '').trim()).length, 0);

    pane.innerHTML = `
      <div class="site-sec-head">
        <div>
          <div class="site-sec-title">Английские тексты витрины</div>
          <div class="site-sec-hint">Переведено ${done} из ${total} · пустые строки на сайте останутся на русском</div>
        </div>
        <button class="site-mini-add" id="i18nSave">Сохранить</button>
      </div>
      ${groups.map(g => `
        <div class="lang-group">
          <div class="lang-group-title">${this.esc(g.label)}</div>
          ${g.strings.map(str => `
            <div class="lang-row">
              <div class="lang-src" title="${this.esc(str)}">${this.esc(str)}</div>
              <input class="lang-input" type="text" data-src="${this.esc(str)}"
                     value="${this.esc(map[str] || '')}" placeholder="English…" maxlength="1000">
            </div>`).join('')}
        </div>`).join('') || `<div class="site-mgmt-empty"><span>${uiIcon('fileText', 16)}</span>Пока нечего переводить — добавьте товары и блоки витрины</div>`}`;

    pane.querySelectorAll('.lang-input').forEach(inp =>
      inp.addEventListener('input', () => { this._i18nMap[inp.dataset.src] = inp.value; }));

    document.getElementById('i18nSave')?.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.textContent = 'Сохраняю…'; btn.disabled = true;
      try {
        const r = await this.db.saveI18n(this._i18nMap);
        this.toast(`Переводы сохранены ✓ (${r.count})`);
        this._renderSiteLang(pane);
      } catch (err) { this.toast(err.message || 'Ошибка'); }
      finally { btn.textContent = 'Сохранить'; btn.disabled = false; }
    });
  }

  /* ── Вкладка «Авито»: статус связки, заказы, объявления со статистикой ── */
  async _renderSiteAvito(pane) {
    pane.innerHTML = `<div class="site-mgmt-empty"><span>${uiIcon('tag', 16)}</span>Подключаемся к Авито…</div>`;
    const status = await this.db.getAvitoStatus();

    if (!status.configured) {
      pane.innerHTML = `
        <div class="avito-setup">
          <div class="site-sec-title">Авито не подключено</div>
          <div class="site-sec-hint" style="margin-top:8px;line-height:1.6">
            1. Получите ключи API: avito.ru → Личный кабинет → Настройки → Интеграции<br>
            2. В Railway добавьте переменные <b>AVITO_CLIENT_ID</b> и <b>AVITO_CLIENT_SECRET</b><br>
            3. Второй кабинет — переменные <b>AVITO2_CLIENT_ID</b> и <b>AVITO2_CLIENT_SECRET</b> (для сверки наличия по обоим)<br>
            4. Через минуту эта вкладка оживёт: заказы, объявления, фид Автозагрузки, сверка наличия
          </div>
        </div>`;
      return;
    }
    if (status.error) {
      pane.innerHTML = `<div class="avito-setup">
        <div class="site-sec-title">Авито: ошибка подключения</div>
        <div class="site-sec-hint" style="margin-top:8px">${this.esc(status.error)} — проверьте ключи в Railway</div>
      </div>`;
      return;
    }

    const AV_ORDER_ST = {
      on_confirmation: ['Ждёт подтверждения', '#fbbf24'], ready_to_ship: ['Собрать и отправить', '#fb923c'],
      in_transit: ['В пути', '#93c5fd'], delivered: ['Доставлен', '#4ade80'], canceled: ['Отменён', '#f87171'],
      on_return: ['Возврат', '#f87171'], in_dispute: ['Спор', '#f87171'], closed: ['Закрыт', '#9ca3af'],
    };
    const AV_ITEM_ST = { active: ['Активно', '#4ade80'], old: ['Завершено', '#9ca3af'],
      blocked: ['Заблокировано', '#f87171'], rejected: ['Отклонено', '#f87171'], removed: ['Удалено', '#9ca3af'] };

    pane.innerHTML = `
      <div class="site-sec-head">
        <div>
          <div class="site-sec-title">Авито · ${this.esc(status.account?.name || '')}</div>
          <div class="site-sec-hint">В фиде: ${(this.items || []).filter(i => i.showOnAvito).length} тов. — включается тумблером «На Авито» в карточке</div>
        </div>
        <div style="display:flex;gap:8px;flex-shrink:0">
          <button class="site-mini-add" id="avitoSyncBtn">Сверить наличие</button>
          <button class="site-mini-add" id="avitoFeedCopy">Скопировать URL фида</button>
        </div>
      </div>
      <div id="avitoSyncWrap"></div>
      <div id="avitoOrdersWrap"><div class="site-mgmt-empty"><span>${uiIcon('package', 16)}</span>Загружаем заказы…</div></div>
      <div id="avitoItemsWrap" style="margin-top:14px"><div class="site-mgmt-empty"><span>${uiIcon('clipboard', 16)}</span>Загружаем объявления…</div></div>`;

    /* ── Сверка наличия: что висит на Авито, а в панели уже продано ── */
    document.getElementById('avitoSyncBtn')?.addEventListener('click', async (e) => {
      const btn  = e.currentTarget;
      const wrap = document.getElementById('avitoSyncWrap');
      btn.textContent = 'Сверяю…'; btn.disabled = true;
      wrap.innerHTML = `<div class="site-mgmt-empty"><span>${uiIcon('repeat', 16)}</span>Сравниваем объявления с панелью…</div>`;
      try {
        const d = await this.db.avitoSyncCheck();
        const LBL = {
          sold:    ['Продано в панели — снимите с Авито', 'bad'],
          off:     ['В панели выключен тумблер «На Авито»', 'warn'],
          unknown: ['Нет такого товара в панели', 'warn'],
          price:   ['Цена расходится с панелью', 'warn'],
        };
        const rows = [];
        d.accounts.forEach(acc => {
          const head = `${this.esc(acc.label)}${acc.name ? ` · ${this.esc(acc.name)}` : ''}`;
          if (acc.error) {
            rows.push(`<div class="avito-sync-group">${head} — <span class="sync-bad">${this.esc(acc.error)}</span></div>`);
            return;
          }
          rows.push(`<div class="avito-sync-group">${head} — активных объявлений: ${acc.ads}${acc.issues.length ? `, расхождений: <b>${acc.issues.length}</b>` : ' · всё сходится ✓'}</div>`);
          acc.issues.forEach(is => {
            const [text, cls] = LBL[is.type] || ['Расхождение', 'warn'];
            const extra = is.type === 'price'
              ? ` · Авито ${fmtMoney(is.adPrice)} vs панель ${fmtMoney(is.panelPrice)}` : '';
            rows.push(`<div class="avito-sync-row ${cls}">
              <div class="avito-sync-info">
                <div class="avito-sync-title">${this.esc(is.title)}</div>
                <div class="avito-sync-sub">${text}${extra}</div>
              </div>
              ${is.adUrl ? `<a class="avito-sync-link" href="${this.esc(is.adUrl)}" target="_blank" rel="noopener">Объявление →</a>` : ''}
            </div>`);
          });
        });
        if (d.missing.length) {
          rows.push(`<div class="avito-sync-group">Нет активного объявления, хотя в панели «На Авито»: <b>${d.missing.length}</b></div>`);
          d.missing.forEach(mi => rows.push(`<div class="avito-sync-row warn">
            <div class="avito-sync-info">
              <div class="avito-sync-title">${this.esc(mi.title)}</div>
              <div class="avito-sync-sub">В наличии ${mi.qty} шт — объявление не найдено ни в одном кабинете</div>
            </div>
          </div>`));
        }
        const total = d.accounts.reduce((a, x) => a + x.issues.length, 0) + d.missing.length;
        wrap.innerHTML = `<div class="avito-sync">
          <div class="avito-sync-head">${total ? `Расхождений: ${total}` : 'Расхождений нет — наличие совпадает ✓'}</div>
          ${rows.join('')}
        </div>`;
        this.toast(total ? `Сверка: ${total} расхождений` : 'Сверка: всё сходится ✓');
      } catch (err) {
        wrap.innerHTML = `<div class="avito-sync"><div class="avito-sync-head sync-bad">${this.esc(err.message || 'Ошибка сверки')}</div></div>`;
      } finally { btn.textContent = 'Сверить наличие'; btn.disabled = false; }
    });

    document.getElementById('avitoFeedCopy')?.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(status.feedUrl); this.toast('URL фида скопирован ✓ — вставьте в Авито → Автозагрузка'); }
      catch { this.toast(status.feedUrl); }
    });

    /* Заказы и объявления грузим параллельно и независимо */
    this.db.getAvitoOrders().then(d => {
      const orders = d.orders || d.result || [];
      const el = document.getElementById('avitoOrdersWrap');
      if (!el) return;
      if (!orders.length) { el.innerHTML = `<div class="site-mgmt-empty"><span>${uiIcon('package', 16)}</span>Заказов Авито Доставки пока нет</div>`; return; }
      el.innerHTML = `<div class="settings-section">${orders.map(o => {
        const st = AV_ORDER_ST[o.status] || [o.status || '—', '#9ca3af'];
        const title = (o.items || []).map(x => x.title || x.name).filter(Boolean).join(', ') || `Заказ ${o.id ?? ''}`;
        const price = o.prices?.total ?? o.price ?? o.totalPrice ?? null;
        const when  = o.createdAt ? new Date((o.createdAt < 1e12 ? o.createdAt * 1000 : o.createdAt)).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
        return `<div class="settings-row" style="cursor:default">
          <div class="settings-row-icon" style="background:color-mix(in srgb, ${st[1]} 22%, transparent)">${uiIcon('package', 14)}</div>
          <div class="settings-row-info">
            <div class="settings-row-title">${this.esc(title)}</div>
            <div class="settings-row-sub" style="color:${st[1]}">${st[0]}${when ? ` · ${when}` : ''}</div>
          </div>
          ${price != null ? `<b style="flex-shrink:0;font-size:13px">${fmtMoney(price)}</b>` : ''}
        </div>`;
      }).join('')}</div>`;
    }).catch(e => {
      const el = document.getElementById('avitoOrdersWrap');
      if (el) el.innerHTML = `<div class="site-mgmt-empty"><span>${uiIcon('package', 16)}</span>Заказы: ${this.esc(e.message)}</div>`;
    });

    this.db.getAvitoItems().then(d => {
      const el = document.getElementById('avitoItemsWrap');
      if (!el) return;
      const items = d.items || [];
      if (!items.length) { el.innerHTML = `<div class="site-mgmt-empty"><span>${uiIcon('clipboard', 16)}</span>Объявлений нет — включите товары в фид и настройте Автозагрузку</div>`; return; }
      el.innerHTML = `<div class="site-sec-title" style="margin-bottom:8px">Объявления · ${items.length} <span style="font-weight:400;font-size:11px;color:var(--text3)">просмотры/контакты/избранное за 30 дней</span></div>
      <div class="settings-section">${items.map(it => {
        const st = AV_ITEM_ST[it.status] || [it.status || '—', '#9ca3af'];
        const s = d.stats?.[it.id];
        return `<div class="settings-row" style="cursor:default">
          <div class="settings-row-icon" style="background:color-mix(in srgb, ${st[1]} 22%, transparent)">${uiIcon('tag', 13)}</div>
          <div class="settings-row-info">
            <div class="settings-row-title">${it.url ? `<a href="${this.esc(it.url)}" target="_blank" rel="noopener" style="color:inherit">${this.esc(it.title || '—')}</a>` : this.esc(it.title || '—')}</div>
            <div class="settings-row-sub"><span style="color:${st[1]}">${st[0]}</span>${it.price ? ` · ${fmtMoney(it.price)}` : ''}${s ? ` · ${uiIcon('eye', 10)} ${s.views} · ${uiIcon('msg', 10)} ${s.contacts} · ${uiIcon('heart', 10)} ${s.favorites}` : ''}</div>
          </div>
        </div>`;
      }).join('')}</div>`;
    }).catch(e => {
      const el = document.getElementById('avitoItemsWrap');
      if (el) el.innerHTML = `<div class="site-mgmt-empty"><span>${uiIcon('clipboard', 16)}</span>Объявления: ${this.esc(e.message)}</div>`;
    });
  }

  /* ── Вкладка «Заявки»: корзина с сайта ── */
  _renderSiteOrders(pane) {
    const orders = this._orders || [];
    if (!orders.length) {
      pane.innerHTML = `<div class="site-mgmt-empty"><span>${uiIcon('package', 16)}</span>Заявок пока нет — они появятся здесь и придут в Telegram</div>`;
      return;
    }
    const fmtD = ts => new Date(ts).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    const isTg = c => /^@|t\.me/i.test(c);
    pane.innerHTML = `<div class="orders-list">${orders.map(o => {
      const total = (o.items || []).reduce((s, i) => s + (i.price || 0), 0);
      const disc  = o.promo?.discount || 0;
      const contactLink = isTg(o.contact)
        ? `<a href="https://t.me/${this.esc(o.contact.replace(/^@/, '').replace(/^.*t\.me\//i, ''))}" target="_blank" rel="noopener">${this.esc(o.contact)}</a>`
        : this.esc(o.contact);
      return `
      <div class="order-card${o.status === 'done' ? ' done' : ''}" data-order-id="${o.id}">
        <div class="order-head">
          <span class="order-status-dot${o.status === 'done' ? ' ok' : ''}"></span>
          <b>${this.esc(o.name || 'Без имени')}</b>
          <span class="order-contact">${contactLink}</span>
          <span class="order-date">${fmtD(o.createdAt)}</span>
        </div>
        <div class="order-items">
          ${(o.items || []).map(i => `<div class="order-item">
            <span>${this.esc(i.name)}${i.size ? ` <em>· ${this.esc(i.size)}</em>` : ''}</span>
            <b>${i.price != null ? fmtMoney(i.price) : '—'}</b>
          </div>`).join('')}
          ${disc ? `<div class="order-item order-promo"><span>Промокод ${this.esc(o.promo.code)}</span><b>−${fmtMoney(disc)}</b></div>` : ''}
          <div class="order-item order-total"><span>Итого</span><b>${disc ? `<span class="order-total-old">${fmtMoney(total)}</span>` : ''}${fmtMoney(total - disc)}</b></div>
        </div>
        ${o.comment ? `<div class="order-comment">${this.esc(o.comment)}</div>` : ''}
        <div class="order-actions">
          <button class="order-toggle" data-id="${o.id}">${o.status === 'done' ? 'Вернуть в новые' : 'Обработано ✓'}</button>
          <button class="order-del" data-id="${o.id}">Удалить</button>
        </div>
      </div>`;
    }).join('')}</div>`;

    pane.querySelectorAll('.order-toggle').forEach(btn =>
      btn.addEventListener('click', async () => {
        const o = orders.find(x => x.id === btn.dataset.id);
        await this.db.patchOrder(o.id, { status: o.status === 'done' ? 'new' : 'done' });
        this.renderSiteView();
      }));
    pane.querySelectorAll('.order-del').forEach(btn =>
      btn.addEventListener('click', async () => {
        const ok = await this.confirm('Удалить заявку?');
        if (!ok) return;
        await this.db.deleteOrder(btn.dataset.id);
        this.renderSiteView();
      }));
  }

  /* ── Вкладка «FAQ» ── */
  _renderSiteFaq(pane) {
    pane.innerHTML = `
      <div class="site-sec-head">
        <div><div class="site-sec-title">FAQ на витрине</div><div class="site-sec-hint">Вопросы-ответы для сайта и внутренние скрипты</div></div>
        <div class="site-sec-actions">
          <button class="site-mini-add faq-topic-add">＋ Топик</button>
        </div>
      </div>
      <div id="faqManageList"></div>`;
    pane.querySelector('.faq-topic-add')?.addEventListener('click', () => this.openFaqModal());
    this.renderFaqManageInto(document.getElementById('faqManageList'));
  }

  _trashSvg() {
    return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
  }

  _streamMoves(i, n) {
    return `<button class="stream-move" data-dir="up" title="Выше"${i === 0 ? ' disabled' : ''}>↑</button>
      <button class="stream-move" data-dir="down" title="Ниже"${i === n - 1 ? ' disabled' : ''}>↓</button>`;
  }

  /* Иконка строки блока: фото блока, если есть (обложку/баннер видно сразу),
     иначе эмодзи типа */
  _blockThumb(b, emoji) {
    const s = v => (typeof v === 'string' ? v : '');   // не-строки — битые фото старого бага
    const img = s(b.image) || s(b.imageA) || s(b.imageB);
    return img
      ? `<div class="settings-row-icon block-thumb"><img src="${this.esc(img)}" alt="" loading="lazy"></div>`
      : `<div class="settings-row-icon" style="background:rgba(167,139,250,.14)">${emoji}</div>`;
  }

  _blockRowHtml(b, i, n) {
    const TYPE = {
      banner: { t: 'Баннер', e: uiIcon('image') }, weekly: { t: 'Товары недели', e: uiIcon('star') },
      duo: { t: 'Двойной баннер (старый)', e: uiIcon('image') },
      statement: { t: 'Слоган', e: '✦' }, text: { t: 'Текст', e: uiIcon('fileText') },
      marquee: { t: 'Бегущая строка', e: uiIcon('repeat', 13) }, promo: { t: 'Промо-полоса', e: uiIcon('megaphone') },
      popup: { t: 'Попап при входе', e: uiIcon('bell') }, cover: { t: 'Обложка раздела', e: uiIcon('image') },
    };
    const SEC  = { all: 'Оба сайта', monarc: 'Masqucerade', type: 'Type-clothes' };
    const meta  = TYPE[b.type] || { t: b.type, e: uiIcon('layers') };
    const label = (b.type === 'promo' || b.type === 'marquee' || b.type === 'statement') ? b.text
      : b.type === 'duo' ? (b.captionA || b.captionB || 'Двойной баннер')
      : b.type === 'banner' ? (b.heading || 'Баннер')
      : b.type === 'weekly' ? `${b.heading || 'Товары недели'} · ${(b.itemIds || []).length} тов.`
      : (b.heading || 'Без заголовка');
    const sub = `${meta.t} · ${SEC[b.section] || b.section}${b.type === 'promo' ? ' · сверху' : ''}${b.enabled ? '' : ' · скрыт'}`;
    return `<div class="settings-row block-row${b.enabled ? '' : ' off'}" data-block-id="${b.id}" data-kind="block">
      ${this._blockThumb(b, meta.e)}
      <div class="settings-row-info">
        <div class="settings-row-title">${this.esc((label || meta.t).replace(/\n/g, ' '))}</div>
        <div class="settings-row-sub">${sub}</div>
      </div>
      <div class="block-row-actions">
        ${this._streamMoves(i, n)}
        <button class="block-toggle" data-id="${b.id}" title="${b.enabled ? 'Скрыть' : 'Показать'}">${b.enabled ? uiIcon('eye', 13) : uiIcon('eyeOff', 13)}</button>
        <button class="block-delete-btn" data-id="${b.id}" title="Удалить">${this._trashSvg()}</button>
      </div>
    </div>`;
  }

  _colRowHtml(c, i, n) {
    return `<div class="settings-row col-row" data-col-id="${c.id}" data-kind="col">
      <div class="settings-row-icon" style="background:rgba(52,211,153,.12)">${uiIcon('folder', 14)}</div>
      <div class="settings-row-info">
        <div class="settings-row-title">${this.esc(c.title || 'Без названия')} <span class="row-tag">подборка</span></div>
        <div class="settings-row-sub">${(c.itemIds || []).length} тов.${c.description ? ' · ' + this.esc(c.description) : ''}</div>
      </div>
      <div class="block-row-actions">
        ${this._streamMoves(i, n)}
        <button class="col-delete-btn" data-id="${c.id}" title="Удалить">${this._trashSvg()}</button>
      </div>
    </div>`;
  }

  _nextStreamOrder() {
    return (this._stream || []).reduce((m, x) => Math.max(m, x.order || 0), -1) + 1;
  }

  async moveStreamItem(row, dir) {
    const arr = [...(this._stream || [])];
    const i = arr.findIndex(x => x.kind === row.dataset.kind &&
      (x.id === row.dataset.blockId || x.id === row.dataset.colId));
    if (i < 0) return;
    // Колонка сайта: сосед — ближайший элемент этого же сайта, чужие пропускаем
    const site = row.closest('[data-site]')?.dataset.site;
    const step = dir === 'up' ? -1 : 1;
    let j = i + step;
    if (site) {
      const inGroup = k => { const s = this._streamSite(arr[k]); return s === site || s === 'both'; };
      while (j >= 0 && j < arr.length && !inGroup(j)) j += step;
    }
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    await Promise.all(arr.map((x, idx) => x.order === idx ? null :
      (x.kind === 'block' ? this.db.saveBlock({ id: x.id, order: idx }) : this.db.saveCollection({ id: x.id, order: idx }))));
    this._logReorder();
    await this.renderSiteView();
  }

  // Серия кликов стрелками = одна запись в журнале, а не спам
  _logReorder() {
    clearTimeout(this._reorderLogT);
    this._reorderLogT = setTimeout(() =>
      this.db.logAction('site_block', 'Порядок блоков и подборок на витрине изменён'), 4000);
  }

  async _onSiteClick(e) {
    if (e.target.closest('.block-add')) { this.openBlockModal(); return; }
    if (e.target.closest('.col-add'))   { this.openCollectionModal(); return; }

    const siteItem = e.target.closest('.site-item-card');
    if (siteItem) { this.openItemModal(siteItem.dataset.siteItem); return; }

    const mv = e.target.closest('.stream-move');
    if (mv) { const row = mv.closest('[data-kind]'); if (row) this.moveStreamItem(row, mv.dataset.dir); return; }

    const bDel = e.target.closest('.block-delete-btn');
    if (bDel) {
      if (!await this.confirm('Удалить блок?')) return;
      const b = (this._blocks || []).find(x => x.id === bDel.dataset.id);
      await this.db.deleteBlock(bDel.dataset.id);
      this.db.logAction('site_block', `${b ? this._blockLabel(b) : 'Блок'} удалён с витрины`, { level: 'danger' });
      this.toast('Блок удалён'); this.renderSiteView(); return;
    }
    const bTog = e.target.closest('.block-toggle');
    if (bTog) {
      const b = (this._blocks || []).find(x => x.id === bTog.dataset.id);
      if (b) {
        await this.db.saveBlock({ id: b.id, enabled: !b.enabled });
        this.db.logAction('site_block', `${this._blockLabel(b)} ${!b.enabled ? 'показан' : 'скрыт'} на витрине`);
        this.renderSiteView();
      }
      return;
    }
    const cDel = e.target.closest('.col-delete-btn');
    if (cDel) {
      if (!await this.confirm('Удалить подборку? Товары останутся на сайте.')) return;
      const c = (this._collections || []).find(x => x.id === cDel.dataset.id);
      await this.db.deleteCollection(cDel.dataset.id);
      this.db.logAction('site_col', `Подборка «${c?.title || '—'}» удалена с витрины`, { level: 'danger' });
      this.toast('Подборка удалена'); this.renderSiteView(); return;
    }

    const bRow = e.target.closest('[data-block-id]');
    if (bRow) { const b = (this._blocks || []).find(x => x.id === bRow.dataset.blockId); if (b) this.openBlockModal(b); return; }
    const cRow = e.target.closest('[data-col-id]');
    if (cRow) { const c = (this._collections || []).find(x => x.id === cRow.dataset.colId); if (c) this.openCollectionModal(c); }
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
    const ok = await this.confirm('Очистить всю историю изменений?', 'Очистить');
    if (!ok) return;
    await this.db.clearLogs();
    await this.renderLogs();
    this.toast('История очищена');
  }

  /* ──────────────────────────────────────────
     BACKUP
     ────────────────────────────────────────── */
  async doManualSave() {
    // Кнопки #saveBtn больше нет в разметке — бэкап запускается из меню
    const ok = await this.backup.manualSave();   // no arg needed
    if (ok) await this.db.logAction('backup', 'Создан бэкап вручную');
    this.toast(ok ? 'Бэкап сохранён ✓' : 'Ошибка бэкапа');
  }

  /* ──────────────────────────────────────────
     MODAL HELPERS
     ────────────────────────────────────────── */
  openModal(id) {
    const el = document.getElementById(id);
    // Флаг гасит гонку: если closeModal успел раньше отложенного rAF,
    // класс 'open' уже не добавляем — иначе модалка «залипает» открытой
    el._closing = false;
    requestAnimationFrame(() => { if (!el._closing) el.classList.add('open'); });
  }

  closeModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el._closing = true;
    el.classList.remove('open');
  }

  /* ──────────────────────────────────────────
     TOAST
     ────────────────────────────────────────── */
  /* Тосты: стопка справа внизу, иконка по типу сообщения (✓ / ! / i) */
  toast(msg, ms = 2600) {
    const stack = document.getElementById('toastStack');
    if (!stack) return;
    const ok  = /✓/.test(msg);
    const err = /ошибк|не удалось|нельзя|не найден|нет в наличии|укажите|выберите|введите|заполните/i.test(msg);
    const text = String(msg).replace(/\s*✓\s*$/, '');
    const t = document.createElement('div');
    t.className = 'toast-item';
    t.innerHTML = `<span class="toast-ic ${ok ? 'ok' : err ? 'err' : ''}">${uiIcon(ok ? 'checkCircle' : err ? 'alert' : 'info', 15)}</span><span>${this.esc(text)}</span>`;
    stack.appendChild(t);
    while (stack.children.length > 4) stack.firstElementChild.remove();
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => {
      t.classList.remove('show');
      t.classList.add('hide');
      setTimeout(() => t.remove(), 300);
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
    // Экранируем и кавычки: значения попадают в атрибуты (data-val="…")
    if (str == null || str === '') return '';
    return String(str).replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('ru-RU', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  }

  _itemHistoryHtml(item) {
    const hist = item.history;
    if (!hist?.length) return '';
    const FIELD_LABELS = { status: 'Статус', orderStatus: 'Статус', ownerId: 'Владелец', name: 'Название', price: 'Цена', buyPrice: 'Закуп', categoryId: 'Категория' };
    const ownerName = id => this.owners.find(o => o.id === id)?.name || id || '—';
    const catName   = id => this.categories.find(c => c.id === id)?.name || id || '—';
    const statusName= id => STATUSES.find(s => s.id === id)?.label || id || '—';
    const fmtVal    = (field, val) => {
      if (val == null || val === '') return '—';
      let out;
      if (field === 'ownerId')         out = ownerName(val);
      else if (field === 'categoryId') out = catName(val);
      else if (field === 'status' || field === 'orderStatus') out = statusName(val);
      else out = String(val);
      return this.esc(out);   // значения приходят из пользовательского ввода
    };
    const entries = [...hist].reverse().slice(0, 10);
    return `
      <div class="item-history">
        <div class="item-history-title">История изменений</div>
        ${entries.map(h => {
          const byOwner = h.by ? this.owners.find(o => o.id === h.by) : null;
          const byLabel = byOwner?.name || h.byName || '';
          const fields  = Object.entries(h.changes).map(([f, {from, to}]) =>
            `<span class="hist-change">${FIELD_LABELS[f]||f}: <s>${fmtVal(f,from)}</s> → <b>${fmtVal(f,to)}</b></span>`
          ).join('');
          return `
            <div class="hist-entry">
              <div class="hist-dot"></div>
              <div class="hist-body">
                <div class="hist-meta">${this.fmtDate(h.ts)}${byLabel ? ` · ${this.esc(byLabel)}` : ''}</div>
                <div class="hist-fields">${fields}</div>
              </div>
            </div>`;
        }).join('')}
      </div>`;
  }
}

/* ──────────────────────────────────────────
   BOOT
   ────────────────────────────────────────── */
const app = new App();
document.addEventListener('DOMContentLoaded', () => app.init());
