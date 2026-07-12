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
    const startView = ['inventory','stats','finance','project','site','settings'].find(v => this.hasAccess(v)) || 'inventory';
    this.renderView(startView);
    this._applyAccess();
    this.backup.checkAutoBackup();
  }

  /* ── Доступ к разделам ── */
  hasAccess(section) {
    if (section === 'settings') section = 'faq';   // вкладка FAQ = view "settings"
    const u = this.currentUser;
    if (!u) return false;
    if (u.role === 'root') return true;
    if (!Array.isArray(u.access)) return true;   // не настроено = полный доступ
    return u.access.includes(section);
  }

  // Скрыть вкладки, к которым нет доступа; уйти с запрещённого экрана
  _applyAccess() {
    document.querySelectorAll('.nav-btn').forEach(b =>
      b.classList.toggle('hidden', !this.hasAccess(b.dataset.view)));
    if (!this.hasAccess(this.currentView)) {
      const first = ['inventory','stats','finance','project','site','settings'].find(v => this.hasAccess(v));
      if (first) this.renderView(first);
    }
  }

  // Аватар текущего профиля справа вверху
  _updateProfileBadge() {
    const el = document.getElementById('profileInitial');
    const btn = document.getElementById('profileBtn');
    if (!el || !btn) return;
    const u = this.currentUser || {};
    el.textContent = (u.name || u.login || '?')[0].toUpperCase();
    btn.title = `${u.name || ''}${u.role === 'root' ? ' · root' : ''}`;
    btn.classList.toggle('is-root', u.role === 'root');
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
    const svgLogout   = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`;
    const svgUserAdd  = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>`;

    const isRoot = this.currentUser?.role === 'root';
    const u      = this.currentUser || {};

    const svgKey = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;

    const chevron = `<svg class="menu-acc-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="6 9 12 15 18 9"/></svg>`;
    const plus    = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;

    el.innerHTML = `
      <div class="account-hero">
        <div class="account-hero-avatar">${(u.name || u.login || '?')[0].toUpperCase()}</div>
        <div class="account-hero-info">
          <div class="account-hero-name">${this.esc(u.name || '')}</div>
          <div class="account-hero-role">
            <span class="account-badge ${isRoot ? 'root' : ''}">${isRoot ? 'Root-админ' : 'Сотрудник'}</span>
            <span>@${this.esc(u.login || '')}</span>
          </div>
        </div>
        <div class="hero-actions">
          <button class="hero-action-btn" id="mChangePassBtn" title="Сменить пароль">${svgKey}</button>
          <button class="hero-action-btn danger" id="mLogoutBtn" title="Выйти">${svgLogout}</button>
        </div>
      </div>

      <div class="menu-grid">
        <button class="menu-tile" id="mBtnTgBackup">
          <div class="menu-tile-icon" style="background:rgba(56,189,248,.12);color:#38bdf8">${svgSend}</div>
          <span>Бэкап<br>в Telegram</span>
        </button>
        <button class="menu-tile" id="mBtnBackup">
          <div class="menu-tile-icon" style="background:var(--fill2);color:var(--text2)">${svgDownload}</div>
          <span>Скачать<br>JSON</span>
        </button>
        <button class="menu-tile" id="mBtnRestore">
          <div class="menu-tile-icon" style="background:rgba(251,146,60,.12);color:#fb923c">${svgUpload}</div>
          <span>Восстановить<br>из файла</span>
        </button>
      </div>

      <div class="menu-theme-row">
        <span class="menu-theme-label">Тема оформления</span>
        <div class="menu-theme-toggle" id="menuThemeToggle">
          <button class="menu-theme-btn${theme === 'dark'  ? ' active' : ''}" data-t="dark">🌙</button>
          <button class="menu-theme-btn${theme === 'light' ? ' active' : ''}" data-t="light">☀️</button>
        </div>
      </div>

      ${isRoot ? `
      <div class="menu-acc" data-acc="users">
        <button class="menu-acc-head">
          <span class="menu-acc-title">Пользователи</span>
          <span class="menu-acc-count">${(this.users || []).length}</span>
          <span class="menu-acc-add" id="mAddUserBtn" title="Добавить пользователя">${plus}</span>
          ${chevron}
        </button>
        <div class="menu-acc-body"><div id="menuUsersList"></div></div>
      </div>` : ''}

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

      <div class="menu-foot">
        <span>Авто-бэкап каждые 24 ч · последний: ${lastBk}</span>
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

    document.getElementById('menuThemeToggle').addEventListener('click', e => {
      const btn = e.target.closest('.menu-theme-btn');
      if (!btn) return;
      this.applyTheme(btn.dataset.t);
      document.querySelectorAll('.menu-theme-btn').forEach(b =>
        b.classList.toggle('active', b === btn)
      );
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
    document.getElementById('mAddCatBtn').addEventListener('click', () => this._openCatPrompt());

    document.getElementById('mLogoutBtn').addEventListener('click', async () => {
      const ok = await this.confirm('Выйти из аккаунта?');
      if (!ok) return;
      await this.db.logout();
      this.currentUser = null;
      this.closeMenu();
      this.showLogin();
    });

    document.getElementById('mAddUserBtn')?.addEventListener('click', () => this.openUserModal());

    document.getElementById('mChangePassBtn')?.addEventListener('click', async () => {
      const np = await this._prompt('Новый пароль', '', 'Введите новый пароль');
      if (!np) return;
      try { await this.db.changeMyPassword(np); this.toast('Пароль изменён ✓'); }
      catch (e) { this.toast(e.message || 'Ошибка'); }
    });

    this.renderOwners('menuOwnersList');
    this._renderMenuCats();
    if (this.currentUser?.role === 'root') this.renderUsersList();
  }

  /* ──────────────────────────────────────────
     USERS (root)
     ────────────────────────────────────────── */
  renderUsersList() {
    const el = document.getElementById('menuUsersList');
    if (!el) return;
    const users  = this.users || [];
    const svgDel  = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`;
    const svgEdit = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;

    el.innerHTML = `<div class="settings-section">${users.map(usr => `
      <div class="settings-row" style="cursor:default">
        <div class="settings-row-icon" style="background:rgba(124,109,250,.12);color:var(--accent);font-weight:700">${(usr.name || usr.login || '?')[0].toUpperCase()}</div>
        <div class="settings-row-info">
          <div class="settings-row-title">${this.esc(usr.name || usr.login)}${usr.role === 'root' ? ' · root' : ''}</div>
          <div class="settings-row-sub">@${this.esc(usr.login)}${usr.role === 'root' ? '' : ` · ${!Array.isArray(usr.access) || usr.access.length >= 6 ? 'все разделы' : `разделов: ${usr.access.length}/6`}${usr.hideCosts ? ' · без закупа' : ''}${usr.notify?.length ? ` · 🔔 ${usr.notify.length}` : ''}`}</div>
        </div>
        ${usr.role === 'root' ? '' : `
          <button class="menu-del-btn user-edit-btn" data-uid="${usr.id}">${svgEdit}</button>
          <button class="menu-del-btn user-del-btn" data-uid="${usr.id}">${svgDel}</button>`}
      </div>`).join('')}
    </div>`;

    el.querySelectorAll('.user-edit-btn').forEach(btn =>
      btn.addEventListener('click', () => {
        const usr = users.find(x => x.id === btn.dataset.uid);
        if (usr) this.openUserModal(usr);
      })
    );
    el.querySelectorAll('.user-del-btn').forEach(btn =>
      btn.addEventListener('click', async () => {
        const usr = users.find(x => x.id === btn.dataset.uid);
        const ok  = await this.confirm(`Удалить пользователя «${usr?.name || usr?.login}»?`);
        if (!ok) return;
        try {
          await this.db.deleteUser(btn.dataset.uid);
          await this.loadData();
          this.renderUsersList();
          this.toast('Пользователь удалён ✓');
        } catch (e) { this.toast(e.message || 'Ошибка'); }
      })
    );
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
      item_add:    '➕ Новый товар',
      item_edit:   '✏️ Изменение товара',
      item_delete: '🗑 Удаление товара',
      finance:     '💳 Финансы',
      owners:      '👥 Сотрудники',
      system:      '⚙️ Система / бэкапы',
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
  _renderAccessChips(access) {
    const el = document.getElementById('userAccessChips');
    if (!el) return;
    const LABELS = { inventory: '📦 Товары', stats: '📊 Статистика', finance: '💳 Счёт', project: '📁 Проект', site: '🌐 Сайт', faq: '💬 FAQ' };
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
    const payload = { name, login, access, hideCosts, tgChatId, notify };
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
      this.renderUsersList();
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
    el.innerHTML =
      `<button type="button" class="vis-chip${allActive ? ' active' : ''}" data-vis="all">Все</button>` +
      (users.length
        ? users.map(u => `<button type="button" class="vis-chip${selected?.includes(u.id) ? ' active' : ''}" data-vis="${u.id}">${this.esc(u.name || u.login)}</button>`).join('')
        : `<span class="vis-empty">Нет пользователей — добавьте их в меню</span>`);
    el.onclick = (e) => {
      const chip = e.target.closest('.vis-chip');
      if (!chip) return;
      const allChip = el.querySelector('[data-vis="all"]');
      if (chip.dataset.vis === 'all') {
        el.querySelectorAll('.vis-chip').forEach(c => c.classList.toggle('active', c === allChip));
      } else {
        chip.classList.toggle('active');
        allChip.classList.remove('active');
        const anyUser = [...el.querySelectorAll('.vis-chip')].some(c => c.dataset.vis !== 'all' && c.classList.contains('active'));
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

  _prompt(title, defaultVal = '', placeholder = '') {
    return new Promise(resolve => {
      const val = window.prompt(title, defaultVal);
      resolve(val === null ? null : val.trim());
    });
  }

  async loadData() {
    const isRoot = this.currentUser?.role === 'root';
    [this.items, this.owners, this.categories, this.users] = await Promise.all([
      this.db.getItems(),
      this.db.getOwners(),
      this.db.getCategories(),
      isRoot ? this.db.getUsers() : Promise.resolve([]),
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
      if (this.currentView === 'project') {
        if (this._projectSubTab === 'quick')      this.openQuickModal();
        else if (this._projectSubTab === 'notes') this.openNoteModal();
        else this.openTaskModal();
      } else if (this.currentView === 'settings') this.openFaqModal();
      else this.openItemModal();
    });

    /* Hamburger menu */
    document.getElementById('menuBtn').addEventListener('click', () => this.toggleMenu());
    document.getElementById('profileBtn')?.addEventListener('click', () => this.toggleMenu());
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
      const card = e.target.closest('.item-card');
      if (!card) return;
      if (this._selectMode) this.toggleSelectItem(card.dataset.id);
      else this.openDetailModal(card.dataset.id);
    });

    /* Delivery */
    document.getElementById('bulkDeliveryBtn').addEventListener('click', () => this.openDeliveryModal());
    document.getElementById('bulkOwnerBtn').addEventListener('click', () => this.openBulkOwnerModal());
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
        await this.db.deleteCollection(del.dataset.id);
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
        await this.db.deleteBlock(del.dataset.id);
        this.toast('Блок удалён');
        this.renderBlocksList();
        return;
      }
      const mv = e.target.closest('.block-move');
      if (mv) { this.moveBlock(mv.dataset.id, mv.dataset.dir); return; }
      const tg = e.target.closest('.block-toggle');
      if (tg) {
        const b = (this._blocks || []).find(x => x.id === tg.dataset.id);
        if (b) { await this.db.saveBlock({ id: b.id, enabled: !b.enabled }); this.renderBlocksList(); }
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

    /* Тумблер «На сайте» раскрывает описание для витрины */
    document.getElementById('fieldShowOnSite').addEventListener('change', (e) => {
      document.getElementById('siteDescGroup').style.display = e.target.checked ? '' : 'none';
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
    document.getElementById('fabBtn').classList.toggle('hidden', !['inventory','project','settings'].includes(view));

    switch (view) {
      case 'inventory': this.renderInventoryView(); break;
      case 'stats':     this.renderStats();         break;
      case 'finance':   this.renderFinance();       break;
      case 'project':   this.renderProject();       break;
      case 'site':      this.renderSiteView();      break;
      case 'settings':  this.renderFaq();           break;
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
    // Кнопка-фильтр видна, только если есть категории; подсвечена при активном фильтре
    if (toggle) {
      toggle.classList.toggle('hidden', !tops.length);
      toggle.classList.toggle('has-filter', !!this._filterCat);
      toggle.classList.toggle('active', this._catFilterOpen && !!tops.length);
    }
    // Сама строка чипов скрыта, пока не открыта кнопкой
    if (!tops.length || !this._catFilterOpen) { el.style.display = 'none'; return; }
    el.style.display = '';
    el.innerHTML =
      `<button class="chip ${!this._filterCat ? 'active' : ''}" data-cat="">Все</button>` +
      tops.map(c =>
        `<button class="chip ${this._filterCat === c.id ? 'active' : ''}" data-cat="${c.id}">${this.esc(c.name)}</button>`
      ).join('');
    el.querySelectorAll('[data-cat]').forEach(btn =>
      btn.addEventListener('click', () => {
        this._filterCat = btn.dataset.cat || null;
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
      // по дате добавления в панель (createdAt)
      items.sort((a, b) => sd * (new Date(a.createdAt || 0) - new Date(b.createdAt || 0)));
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
      .map(s => `<span class="size-pill">${this.esc(s.size||'?')}${s.qty !== 1 ? ' ×'+s.qty : ''}</span>`).join('');

    return `<div class="item-card${this._selectMode && this._selectedIds.has(item.id) ? ' selected' : ''}" data-id="${item.id}" style="animation-delay:${Math.min(idx*28,200)}ms">
      <div class="item-thumb">${thumb}</div>
      <div class="item-info">
        <div class="item-top">
          <div style="min-width:0">
            <div class="item-name">${this.esc(item.name)}</div>
            <div class="item-type-size">${this.esc(this.categories.find(c => c.id === item.categoryId)?.name || '')}</div>
          </div>
          <div class="item-top-badges">
            <span class="status-badge ${item.orderStatus}">${st.label}</span>${item.showOnSite ? `<span class="site-tag" title="Виден на сайте">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
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
          ['Маржа / шт',   marginStr],
          ['Итого',        fmtMoney(item.total), 'big'],
        ]
    ).map(([k,v,c]) =>
      `<div class="detail-row"><span class="detail-key">${k}</span><span class="detail-val ${c||''}">${v}</span></div>`
    ).join('');

    const metaRows = [
      ['Владелец', owner
        ? `<span style="display:flex;align-items:center;gap:6px;justify-content:flex-end">
             <span style="width:8px;height:8px;border-radius:50%;background:${owner.color};display:inline-block;flex-shrink:0"></span>
             ${this.esc(owner.name)}</span>`
        : '—'],
      ['Создан', this.fmtDate(item.createdAt)],
    ].map(([k,v]) =>
      `<div class="detail-row"><span class="detail-key">${k}</span><span class="detail-val">${v}</span></div>`
    ).join('');

    document.getElementById('detailModalTitle').textContent = item.name;
    document.getElementById('detailModalBody').innerHTML = `
      ${(() => {
        const ph = Array.isArray(item.photos) && item.photos.length ? item.photos : (item.photo ? [item.photo] : []);
        if (!ph.length) return '';
        if (ph.length === 1) return `<img src="${ph[0]}" class="detail-photo" alt="">`;
        return `<div class="detail-photos">${ph.map(p => `<img src="${p}" class="detail-photo" alt="">`).join('')}</div>`;
      })()}
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
      ${this._itemHistoryHtml(item)}
      <button class="detail-sell-btn" id="detailSellBtn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
          <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none"/>
        </svg>Продать товар
      </button>
      <button class="detail-delete-btn" id="detailDeleteBtn">Удалить товар</button>
    `;

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
    this._photos       = [];
    this._selOwner     = null;
    this._selStatus    = 'ordered';
    this._sizes        = [{ size: '', qty: 1 }];

    /* Reset */
    ['fieldName','fieldNotes','fieldPrice','fieldBuyPrice','fieldDeliveryCost','fieldSiteDesc','fieldMeasurements'].forEach(k => document.getElementById(k).value = '');
    document.getElementById('fieldIsMonarc').checked   = false;
    document.getElementById('fieldShowOnSite').checked = false;
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
    const hasCats = this.categories.length > 0;
    document.getElementById('categoryGroup').style.display   = hasCats ? '' : 'none';
    document.getElementById('categoryDivider').style.display = hasCats ? '' : 'none';

    document.getElementById('itemModalTitle').textContent = id ? 'Изменить товар' : 'Новый товар';

    if (id) {
      const item = this.items.find(i => i.id === id) || await this.db.getItem(id);
      if (item) {
        document.getElementById('fieldName').value          = item.name         || '';
        document.getElementById('fieldPrice').value         = item.price        || '';
        document.getElementById('fieldBuyPrice').value      = item.buyPrice     || '';
        document.getElementById('fieldDeliveryCost').value  = item.deliveryCost || '';
        document.getElementById('fieldNotes').value = item.notes || '';
        document.getElementById('fieldIsMonarc').checked   = !!item.isMonarc;
        document.getElementById('fieldShowOnSite').checked = !!item.showOnSite;
        document.getElementById('fieldSiteDesc').value      = item.description || '';
        document.getElementById('fieldMeasurements').value  = item.measurements || '';
        document.getElementById('siteDescGroup').style.display = item.showOnSite ? '' : 'none';
        catSel.value    = item.categoryId  || '';
        this._selOwner  = item.ownerId     || null;
        this._selStatus = item.orderStatus || 'ordered';
        this._sizes = item.sizes?.length > 0
          ? item.sizes.map(s => ({ size: s.size || '', qty: s.qty || 0 }))
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
    document.getElementById('deliveryBar').classList.add('hidden');
    document.getElementById('selectModeBtn')?.classList.remove('active');
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
      n === 0 ? 'Выберите товары' : `${n} ${word}`;
    ['bulkDeliveryBtn', 'bulkOwnerBtn', 'bulkFlagsBtn'].forEach(id => {
      const b = document.getElementById(id);
      if (b) b.disabled = n === 0;
    });
  }

  _bulkDesc() {
    const n = this._selectedIds.size;
    return `Применить к ${n} ${n === 1 ? 'товару' : 'товарам'}`;
  }

  /* Общий проход: патч по всем выбранным товарам */
  async applyBulk(patch, logDesc, toastMsg) {
    const ids = [...this._selectedIds];
    for (const id of ids) {
      const item = this.items.find(i => i.id === id);
      if (!item) continue;
      await this.db.saveItem({ ...item, ...patch });
    }
    await this.db.logAction('item_edit', `${logDesc} (${ids.length} тов.)`);
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

  async saveItem() {
    if (this._saving) return;
    const name = document.getElementById('fieldName').value.trim();
    if (!name) { this.toast('Укажите наименование товара'); return; }
    this._saving = true;

    const isNew  = !this.editingItemId;
    const sizes  = this._sizes.filter(s => s.size.trim() || (s.qty || 0) > 0);
    const totQty = sizes.reduce((s, r) => s + (parseInt(r.qty) || 0), 0);
    const item   = {
      ...(isNew ? {} : { id: this.editingItemId }),
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
      showOnSite:   document.getElementById('fieldShowOnSite').checked,
      description:  document.getElementById('fieldSiteDesc').value.trim(),
      measurements: document.getElementById('fieldMeasurements').value.trim(),
      photos:       this._photos.map(p => p.full),
      thumbs:       this._photos.map(p => p.thumb),
      photo:        this._photos[0]?.full || null,
      categoryId:  document.getElementById('fieldCategory').value || null,
      _updatedBy:  null,
    };

    const saved = await this.db.saveItem(item);
    await this.db.logAction(
      isNew ? 'item_add' : 'item_edit',
      isNew ? `Добавлен товар: «${name}»` : `Изменён товар: «${name}»`,
      { id: saved.id, name, quantity: totQty, price: item.price }
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
    const [payments, empPayments, plans, sales] = await Promise.all([
      this.db.getPayments(),
      this.owners.length ? this.db.getEmployeePayments() : Promise.resolve([]),
      this.db.getPlans(),
      this.db.getSales(),
    ]);

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

    const salesSectionHtml = `
      <div class="section-title">Продажи</div>
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
      </div>
      ${salesListHtml}`;

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

    el.innerHTML = `
      <div class="balance-card">
        <div class="balance-label">Бюджет компании</div>
        <div class="balance-amount ${pos ? 'pos' : 'neg'}">${pos ? '' : '−'}<span data-count="${Math.abs(balance)}" data-fmt="money">0 ₽</span></div>
        ${(salesProfit || pendingDebt || paidDebt) ? `
        <div class="budget-breakdown">
          ${salesProfit ? `<div class="budget-row"><span>Прибыль с продаж</span><span class="pos">+${fmtMoney(salesProfit)}</span></div>` : ''}
          ${paidDebt ? `<div class="budget-row"><span>Погашено сотрудникам</span><span class="neg">−${fmtMoney(paidDebt)}</span></div>` : ''}
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
        <button class="fin-btn sell" id="sellBtn">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
            <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none"/>
          </svg>Продать
        </button>
      </div>
      ${salesSectionHtml}
      ${payHistHtml}
      ${empSectionHtml}
      ${plansSectionHtml}
    `;

    runCountUps(el);
    animateSection(el);

    document.getElementById('depositBtn').addEventListener('click', () => this.openPaymentModal('deposit'));
    document.getElementById('chargeBtn').addEventListener('click',  () => this.openPaymentModal('charge'));
    document.getElementById('sellBtn').addEventListener('click',    () => this.openSaleModal());
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
      const ok = await this.confirm(`Погасить выбранные долги на ${fmtMoney(total)}? Сумма спишется из бюджета компании.`);
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
    const payments = await this.db.getEmployeePayments(ownerId);

    const salary   = payments.reduce((s, p) => p.type === 'credit' && !p.isExpense ? s + (p.amount || 0) : s, 0);
    const debits   = payments.reduce((s, p) => p.type === 'debit'                  ? s + (p.amount || 0) : s, 0);
    const expPending = payments.reduce((s, p) => (p.isExpense && !p.reimbursed) ? s + (p.amount || 0) : s, 0);
    const expPaid    = payments.reduce((s, p) => (p.isExpense &&  p.reimbursed) ? s + (p.amount || 0) : s, 0);
    // Остаток = начисления − выплаты. Расходы из своих — отдельный долг компании.
    const balance  = salary - debits;
    const pos      = balance >= 0;

    const balanceExtra = (expPending || expPaid)
      ? `<div class="emp-bal-split">
           ${expPending ? `<span>🧾 ${fmtMoney(expPending)} долг (из своих)</span>` : ''}
           ${expPaid ? `<span>✅ ${fmtMoney(expPaid)} возвращено</span>` : ''}
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
                    <div class="pay-amount expense">${fmtMoney(p.amount)}</div>
                    <div class="pay-return-label">${p.reimbursed ? '✅ возвращено' : 'долг'}</div>
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

    runCountUps(el);
    animateSection(el);

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
    document.getElementById('ownerModalTitle').textContent         = id ? 'Изменить сотрудника' : 'Новый сотрудник';

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
    if (!name) { this.toast('Введите имя сотрудника'); return; }
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
      const catName = this.categories.find(c => c.id === i.categoryId)?.name;
      if (catName) {
        if (!byType[catName]) byType[catName] = { qty: 0, val: 0 };
        byType[catName].qty += qty;
        byType[catName].val += (i.total || 0);
      }
    });

    const maxSt  = Math.max(...Object.values(byStatus), 1);
    const maxOwV = Math.max(...Object.values(byOwner).map(v => v.val), 1);
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
              <div class="bar-fill" data-w="${Math.round(v.val/maxOwV*100)}" style="width:0;background:${c}"></div>
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
        <div class="bar-track"><div class="bar-fill" data-w="${Math.round(v.qty/maxTyQ*100)}" style="width:0;background:var(--accent)"></div></div>
        <span class="bar-count">${v.qty} шт / ${fmtMoney(v.val)}</span>
      </div>`
    ).join('');

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
     PROJECT — sub-tabs
     ────────────────────────────────────────── */
  async renderProject() {
    const [tasks, notes, quick, owners] = await Promise.all([
      this.db.getTasks(), this.db.getProjectNotes(), this.db.getQuickItems(), this.db.getOwners(),
    ]);

    const total  = tasks.length;
    const done   = tasks.filter(t => t.done).length;
    const active = total - done;
    const hero   = document.getElementById('projHero');
    const isRoot = this.currentUser?.role === 'root';
    hero?.classList.toggle('emp', !isRoot);

    const plural = (n) => { const m = n % 100, d = n % 10; if (m > 10 && m < 20) return 'задач'; if (d > 1 && d < 5) return 'задачи'; if (d === 1) return 'задача'; return 'задач'; };

    if (isRoot) {
      /* ── Root: сводка с прогресс-кольцом ── */
      const C   = 2 * Math.PI * 24;                       // длина окружности кольца
      const pct = total ? done / total : 0;
      if (hero) hero.innerHTML = `
        <div class="proj-hero-inner">
          <div class="proj-hero-row">
            <div class="proj-ring">
              <svg width="62" height="62" viewBox="0 0 62 62">
                <circle cx="31" cy="31" r="24" class="proj-ring-track"/>
                <circle cx="31" cy="31" r="24" class="proj-ring-bar"
                  stroke-dasharray="${C.toFixed(1)}"
                  stroke-dashoffset="${(C * (1 - pct)).toFixed(1)}"/>
              </svg>
              <span class="proj-ring-num">${Math.round(pct * 100)}%</span>
            </div>
            <div class="proj-hero-info">
              <div class="proj-hero-label">Сейчас в работе</div>
              <div class="proj-hero-pct">${active}<span> ${plural(active)}</span></div>
              <div class="proj-hero-done">${done} из ${total} выполнено</div>
            </div>
          </div>
          <div class="proj-hero-chips">
            <span class="proj-chip note">📝 <b>${notes.length}</b> ${notes.length === 1 ? 'заметка' : 'заметок'}</span>
            <span class="proj-chip access">🔑 <b>${quick.length}</b> ${quick.length === 1 ? 'доступ' : 'доступов'}</span>
          </div>
        </div>`;
    } else {
      /* ── Сотрудник: личное приветствие, только активные ── */
      const name  = this.currentUser?.name || '';
      const h     = new Date().getHours();
      const greet = h >= 5 && h < 12 ? 'Доброе утро' : h >= 12 && h < 17 ? 'Добрый день' : h >= 17 && h < 23 ? 'Добрый вечер' : 'Доброй ночи';
      const myOwnerId = owners.find(o => (o.name || '').toLowerCase() === name.toLowerCase())?.id || null;
      const mine = myOwnerId ? tasks.filter(t => !t.done && t.assigneeId === myOwnerId).length : 0;

      if (hero) hero.innerHTML = `
        <div class="emp-hero">
          <div class="emp-hero-greet">${greet}, ${this.esc(name)}</div>
          <div class="emp-hero-sub">${active
            ? `Сейчас <b>${active}</b> ${plural(active)} в работе${mine ? ` · <b>${mine}</b> для тебя` : ''}`
            : 'Активных задач нет'}</div>
        </div>`;
    }

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
    const [tasks, owners] = await Promise.all([this.db.getTasks(), this.db.getOwners()]);

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

    const ownerName = id => owners.find(o => o.id === id)?.name || '';

    /* «Мои» задачи сотрудника — наверх и с меткой */
    const isRoot    = this.currentUser?.role === 'root';
    const myName    = (this.currentUser?.name || '').toLowerCase();
    const myOwnerId = !isRoot ? (owners.find(o => (o.name || '').toLowerCase() === myName)?.id || null) : null;
    const isMine    = t => myOwnerId && t.assigneeId === myOwnerId;

    const personal = tasks.filter(t => t.personal && !t.done);
    const todo     = tasks.filter(t => !t.personal && !t.done);
    const done     = tasks.filter(t =>  t.done);
    if (myOwnerId) todo.sort((a, b) => isMine(b) - isMine(a));

    const svgLock = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;

    const renderList = list => list.map(t => {
      const assignee = t.assigneeId ? ownerName(t.assigneeId) : '';
      const title = t.title || t.text || '';
      const desc  = t.description || '';
      const mine  = isMine(t) && !t.done;
      return `
      <div class="task-item${t.done ? ' done' : ''}${mine ? ' task-mine' : ''}${t.personal ? ' task-personal' : ''}" data-task-id="${t.id}">
        <button class="task-check" data-task-id="${t.id}" title="${t.done ? 'Вернуть' : 'Выполнено'}">
          ${t.done ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>` : ''}
        </button>
        <div class="task-body">
          <span class="task-text">${this.esc(title)}</span>
          ${desc ? `<span class="task-desc">${this.esc(desc)}</span>` : ''}
          ${t.photo ? `<img class="task-photo-thumb" src="${t.photo}" alt="фото задачи">` : ''}
          <span class="task-meta-row">${t.personal ? `<span class="task-personal-badge">${svgLock} Личная</span>` : ''}${mine ? `<span class="task-mine-badge">Для тебя</span>` : ''}${assignee && !mine ? `<span class="task-assignee">${this.esc(assignee)}</span>` : ''}${t.createdAt ? `<span class="task-date">${this.fmtDate(t.createdAt)}</span>` : ''}${this._visBadge(t)}</span>
        </div>
        <div class="task-btns">
          <button class="task-edit" data-task-id="${t.id}" title="Изменить">${svgEdit}</button>
          <button class="task-del"  data-task-id="${t.id}" title="Удалить">${svgDel}</button>
        </div>
      </div>`;
    }).join('');

    el.innerHTML = `<div class="task-list">
      ${personal.length ? `
        <div class="task-section-head personal">${svgLock}<span>Личное</span><em>видно только вам</em></div>
        ${renderList(personal)}
        ${todo.length ? '<div class="task-section-head team"><span>Команда</span></div>' : ''}
      ` : ''}
      ${renderList(todo)}
      ${done.length && (todo.length || personal.length) ? `<div class="task-divider"><span>Выполнено · ${done.length}</span></div>` : ''}
      ${renderList(done)}
    </div>`;

    el.querySelectorAll('.task-check').forEach(btn =>
      btn.addEventListener('click', async () => {
        const t = tasks.find(x => x.id === btn.dataset.taskId);
        if (!t) return;
        await this.db.patchTask(t.id, { done: !t.done });
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

  // Простой просмотрщик фото на весь экран
  _openImage(src) {
    const ov = document.createElement('div');
    ov.className = 'image-viewer';
    ov.innerHTML = `<img src="${src}" alt="">`;
    ov.addEventListener('click', () => ov.remove());
    document.body.appendChild(ov);
  }

  async openTaskModal(task = null) {
    this._editingTaskId = task?.id || null;
    document.getElementById('taskModalTitle').textContent    = task ? 'Редактировать задачу' : 'Новая задача';
    document.getElementById('taskModalSave').textContent     = task ? 'Сохранить' : 'Добавить';
    // back-compat: старые задачи хранили всё в .text
    document.getElementById('taskTitle').value       = task?.title || task?.text || '';
    document.getElementById('taskDescription').value = task?.description || '';
    this._setTaskPersonal(!!task?.personal);
    this._setTaskPhoto(task?.photo || null);
    const sel    = document.getElementById('taskAssignee');
    const owners = await this.db.getOwners();
    sel.innerHTML = `<option value="">— Не назначен —</option>` +
      owners.map(o => `<option value="${o.id}"${task?.assigneeId === o.id ? ' selected' : ''}>${this.esc(o.name)}</option>`).join('');

    const isRoot = this.currentUser?.role === 'root';
    document.getElementById('taskVisGroup').style.display = (isRoot && !this._taskPersonal) ? '' : 'none';
    if (isRoot) this._renderVisChips('taskVisChips', task?.visibility || []);

    this.openModal('taskModal');
    setTimeout(() => document.getElementById('taskTitle').focus(), 350);
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
    const payload = { title, text: title, description, assigneeId, photo: this._taskPhoto || null, personal: !!this._taskPersonal };
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
    return { card:'💳', phone:'📞', address:'📍', password:'🔑', link:'🔗', other:'📋' }[type] || '📋';
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

    el.innerHTML = `<div class="quick-list">${items.map(item => {
      const isPassword = item.type === 'password';
      const maskedVal  = '●'.repeat(Math.min(item.value.length, 12));
      return `
      <div class="quick-item${item.pinned ? ' pinned' : ''}" data-quick-id="${item.id}">
        <div class="quick-type-icon">${this._quickTypeIcon(item.type)}</div>
        <div class="quick-main">
          <span class="quick-label">${this.esc(item.label)}${this._visBadge(item)}</span>
          <span class="quick-value${isPassword ? ' masked' : ''}" data-revealed="false" data-val="${this.esc(item.value)}">
            ${isPassword ? maskedVal : this.esc(item.value)}
          </span>
        </div>
        <div class="quick-actions">
          ${isPassword ? `<button class="quick-eye" data-quick-id="${item.id}" title="Показать/скрыть">${svgEyeOff}</button>` : ''}
          <button class="quick-copy" data-val="${this.esc(item.value)}" title="Скопировать">${svgCopy}</button>
          <button class="quick-pin ${item.pinned ? 'active' : ''}" data-quick-id="${item.id}" title="${item.pinned ? 'Открепить' : 'Закрепить'}">${svgPin}</button>
          <button class="quick-edit" data-quick-id="${item.id}" title="Изменить">${svgEdit}</button>
          <button class="quick-del"  data-quick-id="${item.id}" title="Удалить">${svgDel}</button>
        </div>
      </div>`;
    }).join('')}
    </div>`;

    el.querySelectorAll('.quick-eye').forEach(btn =>
      btn.addEventListener('click', () => {
        const valEl    = btn.closest('.quick-item').querySelector('.quick-value');
        const revealed = valEl.dataset.revealed === 'true';
        valEl.dataset.revealed = !revealed;
        valEl.textContent = revealed
          ? '●'.repeat(Math.min(valEl.dataset.val.length, 12))
          : valEl.dataset.val;
        btn.innerHTML = revealed ? svgEyeOff : svgEye;
      })
    );
    el.querySelectorAll('.quick-copy').forEach(btn =>
      btn.addEventListener('click', () => {
        const val = btn.dataset.val;
        (navigator.clipboard?.writeText(val) || Promise.reject())
          .catch(() => { const ta = document.createElement('textarea'); ta.value = val; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); });
        btn.classList.add('copied');
        setTimeout(() => btn.classList.remove('copied'), 1400);
        this.toast('Скопировано');
      })
    );
    el.querySelectorAll('.quick-pin').forEach(btn =>
      btn.addEventListener('click', async () => {
        const item = raw.find(x => x.id === btn.dataset.quickId);
        if (!item) return;
        await this.db.patchQuickItem(item.id, { pinned: !item.pinned });
        this.renderProjectQuick();
      })
    );
    el.querySelectorAll('.quick-edit').forEach(btn =>
      btn.addEventListener('click', () => {
        const item = raw.find(x => x.id === btn.dataset.quickId);
        if (item) this.openQuickModal(item);
      })
    );
    el.querySelectorAll('.quick-del').forEach(btn =>
      btn.addEventListener('click', async () => {
        const ok = await this.confirm('Удалить реквизит?');
        if (!ok) return;
        await this.db.deleteQuickItem(btn.dataset.quickId);
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

    const list = notes.slice().reverse();
    el.innerHTML = `<div class="note-grid">${list.map((n, idx) => `
      <div class="note-card" style="--nc:${n.color || '#7c6dfa'};animation-delay:${Math.min(idx * 35, 240)}ms" data-note-id="${n.id}">
        <div class="note-text">${this.esc(n.text)}</div>
        <div class="note-foot">
          <span class="note-date">${this.fmtDate(n.createdAt)}</span>
          <span class="note-btns">
            <button class="note-edit" data-note-id="${n.id}" title="Изменить">${svgEdit}</button>
            <button class="note-del"  data-note-id="${n.id}" title="Удалить">${svgDel}</button>
          </span>
        </div>
      </div>`).join('')}
    </div>`;

    el.querySelectorAll('.note-edit').forEach(btn =>
      btn.addEventListener('click', () => {
        const n = notes.find(x => x.id === btn.dataset.noteId);
        if (n) this.openNoteModal(n);
      })
    );
    el.querySelectorAll('.note-del').forEach(btn =>
      btn.addEventListener('click', async () => {
        const ok = await this.confirm('Удалить заметку?');
        if (!ok) return;
        await this.db.deleteProjectNote(btn.dataset.noteId);
        this.renderProject();
      })
    );
  }

  openNoteModal(note = null) {
    this._editingNoteId = note?.id || null;
    this._noteColor     = note?.color || '#7c6dfa';
    document.getElementById('noteModalTitle').textContent = note ? 'Редактировать' : 'Новая заметка';
    document.getElementById('noteModalSave').textContent  = note ? 'Сохранить' : 'Добавить';
    document.getElementById('noteText').value             = note?.text || '';

    const COLORS = ['#7c6dfa', '#38bdf8', '#4ade80', '#fbbf24', '#f87171', '#f472b6'];
    document.getElementById('noteColorPicker').innerHTML = COLORS.map(c =>
      `<div class="color-dot ${c === this._noteColor ? 'selected' : ''}" data-color="${c}" style="background:${c}"></div>`
    ).join('');

    this.openModal('noteModal');
    setTimeout(() => document.getElementById('noteText').focus(), 350);
  }

  async saveNoteItem() {
    const text = document.getElementById('noteText').value.trim();
    if (!text) { this.toast('Введите текст заметки'); return; }
    if (this._editingNoteId) {
      await this.db.patchProjectNote(this._editingNoteId, { text, color: this._noteColor });
      this.toast('Заметка обновлена ✓');
    } else {
      await this.db.addProjectNote({ text, color: this._noteColor });
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
    document.getElementById('saleBuyPrice').value     = opt.dataset.buy      || '0';
    document.getElementById('saleDeliveryCost').value = opt.dataset.delivery || '0';

    let sizes = [];
    try { sizes = JSON.parse(decodeURIComponent(opt.dataset.sizes || '')); } catch {}
    const hasSizes = sizes.length > 1 || (sizes.length === 1 && sizes[0].size);
    document.getElementById('saleSizeGroup').style.display   = hasSizes ? '' : 'none';
    document.getElementById('saleSizeDivider').style.display = hasSizes ? '' : 'none';
    if (hasSizes) {
      document.getElementById('saleSizeSelect').innerHTML =
        sizes.map(s => `<option value="${this.esc(s.size)}">${this.esc(s.size)} (${s.qty} шт)</option>`).join('');
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

    await this.db.addSale({ itemId, itemName, size, salePrice, buyPrice, deliveryCost: delivery, note });
    await this.db.logAction('sale', `Продажа: «${itemName}»${size ? ` (${size})` : ''}`, { salePrice, buyPrice, deliveryCost: delivery });
    this.closeModal('saleModal');
    await this.loadData();          // обновить остатки в кэше
    this.renderInventoryList();     // отразить списание в списке товаров
    this.renderFinance();
    this.toast(`Продажа записана · +${fmtMoney(salePrice - buyPrice - delivery)} ₽`);
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

      const siteBadge = item.showOnSite ? `<span class="site-tag" title="Виден на сайте">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg></span>` : '';
      return `
      <div class="faq-item${item.showOnSite ? ' faq-on-site' : ''}" data-faq-id="${item.id}">
        <div class="faq-head">
          <span class="faq-title">${this.esc(item.title)}${siteBadge}${this._visBadge(item)}</span>
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
    document.getElementById('faqShowOnSite').checked = !!item?.showOnSite;
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
    if (this._editingFaqId) {
      const patch = { title, body, lines, showOnSite };
      if (vis !== undefined) patch.visibility = vis;
      await this.db.patchFaqItem(this._editingFaqId, patch);
      this.toast('Топик обновлён ✓');
    } else {
      await this.db.addFaqItem({ title, body, lines, showOnSite, ...(vis !== undefined ? { visibility: vis } : {}) });
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
        <div style="font-size:28px">🗂</div>
        <p>Подборок пока нет.<br>Создайте блок товаров — он появится на сайте.</p>
      </div>`;
      return;
    }
    el.innerHTML = `<div class="settings-section">` + this._collections.map(c => `
      <div class="settings-row" data-col-id="${c.id}">
        <div class="settings-row-icon" style="background:rgba(52,211,153,.12)">🗂</div>
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
    this._colPicked    = new Set(col?.itemIds || []);
    document.getElementById('collectionModalTitle').textContent = col ? 'Изменить подборку' : 'Новая подборка';
    document.getElementById('colTitle').value = col?.title || '';
    document.getElementById('colDesc').value  = col?.description || '';
    this._renderColPicker();
    this.openModal('collectionModal');
    if (!col) setTimeout(() => document.getElementById('colTitle').focus(), 350);
  }

  _renderColPicker() {
    const el    = document.getElementById('colItemsPicker');
    const items = this.items.filter(i => i.showOnSite && i.orderStatus !== 'done');
    if (!items.length) {
      el.innerHTML = `<div style="padding:14px;font-size:13px;color:var(--text3)">Нет товаров с галочкой «На сайте»</div>`;
      this._updateColCount();
      return;
    }
    el.innerHTML = items.map(i => `
      <div class="col-pick-row${this._colPicked.has(i.id) ? ' picked' : ''}" data-item-id="${i.id}">
        <div class="col-pick-thumb">${i.photo ? `<img src="${i.photo}" alt="">` : '📦'}</div>
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

  async saveCollectionForm() {
    const title = document.getElementById('colTitle').value.trim();
    if (!title) { this.toast('Введите название подборки'); return; }
    await this.db.saveCollection({
      ...(this._editingColId ? { id: this._editingColId } : { order: this._nextStreamOrder() }),
      title,
      description: document.getElementById('colDesc').value.trim(),
      itemIds:     [...this._colPicked],
    });
    this.closeModal('collectionModal');
    this.toast(this._editingColId ? 'Подборка обновлена ✓' : 'Подборка создана ✓');
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
        <div style="font-size:28px">🧱</div>
        <p>Блоков пока нет.<br>Добавьте баннер, текст или промо-полосу — они появятся на сайте.</p>
      </div>`;
      return;
    }
    const TYPE = { banner: { t: 'Фото-баннер', e: '🖼' }, text: { t: 'Текст', e: '📝' }, promo: { t: 'Промо-полоса', e: '📣' } };
    const SEC  = { all: 'Везде', monarc: 'Monarc', type: 'Type' };
    el.innerHTML = `<div class="settings-section">` + this._blocks.map((b, i) => {
      const meta  = TYPE[b.type] || { t: b.type, e: '🧩' };
      const label = b.type === 'promo' ? b.text : (b.heading || (b.type === 'banner' ? 'Баннер без заголовка' : 'Без заголовка'));
      return `<div class="settings-row block-row${b.enabled ? '' : ' off'}" data-block-id="${b.id}">
        <div class="settings-row-icon" style="background:rgba(167,139,250,.14)">${meta.e}</div>
        <div class="settings-row-info">
          <div class="settings-row-title">${this.esc(label || meta.t)}</div>
          <div class="settings-row-sub">${meta.t} · ${SEC[b.section] || b.section}${b.enabled ? '' : ' · скрыт'}</div>
        </div>
        <div class="block-row-actions">
          <button class="block-move" data-id="${b.id}" data-dir="up" title="Выше"${i === 0 ? ' disabled' : ''}>↑</button>
          <button class="block-move" data-id="${b.id}" data-dir="down" title="Ниже"${i === this._blocks.length - 1 ? ' disabled' : ''}>↓</button>
          <button class="block-toggle" data-id="${b.id}" title="${b.enabled ? 'Скрыть' : 'Показать'}">${b.enabled ? '👁' : '🚫'}</button>
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
    await this._refreshBlocks();
  }

  openBlockModal(block = null) {
    this._blockIsNew = !block;
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
    if (this._blockIsNew)
      html += g('Тип блока', seg('type', [
        { v: 'weekly', t: 'Товары' }, { v: 'banner', t: 'Баннер' }, { v: 'duo', t: 'Двойной' },
        { v: 'statement', t: 'Слоган' }, { v: 'text', t: 'Текст' }, { v: 'marquee', t: 'Строка' }, { v: 'promo', t: 'Промо' },
      ]));
    html += g('Раздел', seg('section', [{ v: 'all', t: 'Везде' }, { v: 'monarc', t: 'Monarc' }, { v: 'type', t: 'Type' }]));

    if (b.type === 'banner') {
      if (!b.size) b.size = 'md';
      if (!b.images && b.image) b.images = [b.image];   // миграция одиночной картинки
      html += g('Размер', seg('size', [{ v: 'sm', t: 'Компактный' }, { v: 'md', t: 'Обычный' }, { v: 'lg', t: 'Крупный' }]));
      html += imagesField('images', 'Фото (можно несколько — будут листаться)');
      html += g('Заголовок (необязательно)', `<input type="text" class="form-input" id="blkHeading" value="${esc(b.heading || '')}" placeholder="Например: Новая коллекция">`);
      html += g('Подпись (необязательно)', `<textarea class="form-input form-textarea" id="blkSubtext" rows="2" placeholder="Короткий текст под заголовком…">${esc(b.subtext || '')}</textarea>`);
      html += linkField('linkType', 'linkValue', 'Ссылка при клике');
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
    } else if (b.type === 'weekly') {
      html += `<div class="blk-hint">Витрина выбранных товаров с заголовком. Показываются только товары с галочкой «На сайте».</div>`;
      html += g('Заголовок', `<input type="text" class="form-input" id="blkHeading" value="${esc(b.heading || 'Товары недели')}" placeholder="Товары недели">`);
      const picks = new Set(b.itemIds || []);
      const pickable = this.items.filter(i => i.showOnSite && i.orderStatus !== 'done');
      const pickRows = pickable.length ? pickable.map(i => {
        const cover = i.thumbs?.[0] || i.photos?.[0] || i.photo;
        return `<div class="col-pick-row${picks.has(i.id) ? ' picked' : ''}" data-pick-id="${i.id}">
          <div class="col-pick-thumb">${cover ? `<img src="${esc(cover)}" alt="">` : '📦'}</div>
          <div class="col-pick-info"><div class="col-pick-name">${esc(i.name)}</div><div class="col-pick-sub">${i.isMonarc ? 'Monarc' : 'Type'}${i.price ? ' · ' + fmtMoney(i.price) : ''}</div></div>
          <div class="col-pick-check"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div>
        </div>`;
      }).join('') : `<div style="padding:14px;font-size:13px;color:var(--text3)">Нет товаров с галочкой «На сайте»</div>`;
      html += g(`Товары <span id="blkPickCount" style="color:var(--text3);font-weight:400">· выбрано ${picks.size}</span>`, `<div class="col-items-picker">${pickRows}</div>`);
    } else {
      html += g('Текст полосы', `<input type="text" class="form-input" id="blkText" value="${esc(b.text || '')}" placeholder="Например: Бесплатная доставка от 5000 ₽">`);
    }
    document.getElementById('blockFormBody').innerHTML = html;
  }

  _readBlockForm() {
    const b = this._block;
    const set = (id, key, trim = true) => { const el = document.getElementById(id); if (el) b[key] = trim ? el.value.trim() : el.value; };
    if (b.type === 'banner')          { set('blkHeading', 'heading'); set('blkSubtext', 'subtext'); }
    else if (b.type === 'text')       { set('blkHeading', 'heading'); set('blkBody', 'body', false); }
    else if (b.type === 'promo')      { set('blkText', 'text'); }
    else if (b.type === 'marquee')    { set('blkMarquee', 'text'); }
    else if (b.type === 'statement')  { set('blkKicker', 'kicker'); set('blkStatement', 'text', false); }
    else if (b.type === 'weekly')     { set('blkHeading', 'heading'); }
    else if (b.type === 'duo')        { set('blkCaptionA', 'captionA'); set('blkCaptionB', 'captionB'); }
    // ссылки — общий механизм
    document.querySelectorAll('#blockFormBody .blk-linkgroup').forEach(gp => {
      const sel = gp.querySelector('.blk-linktype'), inp = gp.querySelector('.blk-linkvalue');
      if (sel) { b[sel.dataset.typekey] = sel.value; if (inp) b[sel.dataset.valkey] = inp.value.trim(); }
    });
  }

  _onBlockFormClick(e) {
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
      if (f) resizeImage(f, 1400, 1400, 0.85)
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
    if (b.type === 'banner'    && !(b.images && b.images.length) && !b.heading) { this.toast('Добавьте фото или заголовок'); return; }
    if (b.type === 'duo'       && !b.imageA && !b.imageB) { this.toast('Добавьте хотя бы одну картинку'); return; }
    if (b.type === 'weekly'    && !(b.itemIds && b.itemIds.length)) { this.toast('Выберите хотя бы один товар'); return; }
    if (this._blockIsNew && this.currentView === 'site') b.order = this._nextStreamOrder();  // в конец потока
    await this.db.saveBlock(b);
    this.closeModal('blockModal');
    this.toast(this._blockIsNew ? 'Блок создан ✓' : 'Блок обновлён ✓');
    await this._refreshBlocks();
  }

  _refreshBlocks()      { return this.currentView === 'site' ? this.renderSiteView() : this.renderBlocksList(); }
  _refreshCollections() { return this.currentView === 'site' ? this.renderSiteView() : this.renderCollectionsList(); }

  /* ──────────────────────────────────────────
     ВКЛАДКА «САЙТ» — наглядное управление витриной
     ────────────────────────────────────────── */
  async renderSiteView() {
    const el = document.getElementById('siteContent');
    const [blocks, cols] = await Promise.all([this.db.getBlocks(), this.db.getCollections()]);
    this._blocks = blocks;
    this._collections = cols;

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

    const rows = stream.map((x, i) => x.kind === 'block'
      ? this._blockRowHtml(x.ref, i, stream.length)
      : this._colRowHtml(x.ref, i, stream.length)).join('');

    el.innerHTML = `
      <p class="site-mgmt-intro">Всё, что видно на витрине (Monarc и Type). Порядок — стрелками, клик по строке — редактировать. Блоки и подборки можно чередовать.</p>
      <div class="site-mgmt-card">
        <div class="site-mgmt-head">
          <div><div class="site-mgmt-title">Блоки и подборки</div><div class="site-mgmt-hint">Баннеры, текст, промо и подборки товаров</div></div>
          <div class="site-mgmt-addrow">
            <button class="site-mgmt-add block-add">＋ Блок</button>
            <button class="site-mgmt-add col-add">＋ Подборку</button>
          </div>
        </div>
        <div class="settings-section">${stream.length ? rows : '<div class="site-mgmt-empty"><span>🧱</span>Пока пусто — добавьте блок или подборку</div>'}</div>
      </div>`;
  }

  _trashSvg() {
    return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
  }

  _streamMoves(i, n) {
    return `<button class="stream-move" data-dir="up" title="Выше"${i === 0 ? ' disabled' : ''}>↑</button>
      <button class="stream-move" data-dir="down" title="Ниже"${i === n - 1 ? ' disabled' : ''}>↓</button>`;
  }

  _blockRowHtml(b, i, n) {
    const TYPE = {
      weekly: { t: 'Товары недели', e: '⭐' },
      banner: { t: 'Фото-баннер', e: '🖼' }, duo: { t: 'Двойной баннер', e: '🖼' },
      statement: { t: 'Слоган', e: '✦' }, text: { t: 'Текст', e: '📝' },
      marquee: { t: 'Бегущая строка', e: '➰' }, promo: { t: 'Промо-полоса', e: '📣' },
    };
    const SEC  = { all: 'Везде', monarc: 'Monarc', type: 'Type' };
    const meta  = TYPE[b.type] || { t: b.type, e: '🧩' };
    const label = (b.type === 'promo' || b.type === 'marquee' || b.type === 'statement') ? b.text
      : b.type === 'duo' ? (b.captionA || b.captionB || 'Двойной баннер')
      : b.type === 'weekly' ? `${b.heading || 'Товары недели'} · ${(b.itemIds || []).length} тов.`
      : (b.heading || (b.type === 'banner' ? 'Баннер без заголовка' : 'Без заголовка'));
    const sub = `${meta.t} · ${SEC[b.section] || b.section}${b.type === 'promo' ? ' · сверху' : ''}${b.enabled ? '' : ' · скрыт'}`;
    return `<div class="settings-row block-row${b.enabled ? '' : ' off'}" data-block-id="${b.id}" data-kind="block">
      <div class="settings-row-icon" style="background:rgba(167,139,250,.14)">${meta.e}</div>
      <div class="settings-row-info">
        <div class="settings-row-title">${this.esc((label || meta.t).replace(/\n/g, ' '))}</div>
        <div class="settings-row-sub">${sub}</div>
      </div>
      <div class="block-row-actions">
        ${this._streamMoves(i, n)}
        <button class="block-toggle" data-id="${b.id}" title="${b.enabled ? 'Скрыть' : 'Показать'}">${b.enabled ? '👁' : '🚫'}</button>
        <button class="block-delete-btn" data-id="${b.id}" title="Удалить">${this._trashSvg()}</button>
      </div>
    </div>`;
  }

  _colRowHtml(c, i, n) {
    return `<div class="settings-row col-row" data-col-id="${c.id}" data-kind="col">
      <div class="settings-row-icon" style="background:rgba(52,211,153,.12)">🗂</div>
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
    const j = dir === 'up' ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    await Promise.all(arr.map((x, idx) => x.order === idx ? null :
      (x.kind === 'block' ? this.db.saveBlock({ id: x.id, order: idx }) : this.db.saveCollection({ id: x.id, order: idx }))));
    await this.renderSiteView();
  }

  async _onSiteClick(e) {
    if (e.target.closest('.block-add')) { this.openBlockModal(); return; }
    if (e.target.closest('.col-add'))   { this.openCollectionModal(); return; }

    const mv = e.target.closest('.stream-move');
    if (mv) { const row = mv.closest('[data-kind]'); if (row) this.moveStreamItem(row, mv.dataset.dir); return; }

    const bDel = e.target.closest('.block-delete-btn');
    if (bDel) {
      if (!await this.confirm('Удалить блок?')) return;
      await this.db.deleteBlock(bDel.dataset.id); this.toast('Блок удалён'); this.renderSiteView(); return;
    }
    const bTog = e.target.closest('.block-toggle');
    if (bTog) {
      const b = (this._blocks || []).find(x => x.id === bTog.dataset.id);
      if (b) { await this.db.saveBlock({ id: b.id, enabled: !b.enabled }); this.renderSiteView(); }
      return;
    }
    const cDel = e.target.closest('.col-delete-btn');
    if (cDel) {
      if (!await this.confirm('Удалить подборку? Товары останутся на сайте.')) return;
      await this.db.deleteCollection(cDel.dataset.id); this.toast('Подборка удалена'); this.renderSiteView(); return;
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

  _itemHistoryHtml(item) {
    const hist = item.history;
    if (!hist?.length) return '';
    const FIELD_LABELS = { status: 'Статус', orderStatus: 'Статус', ownerId: 'Владелец', name: 'Название', price: 'Цена', buyPrice: 'Закуп', categoryId: 'Категория' };
    const ownerName = id => this.owners.find(o => o.id === id)?.name || id || '—';
    const catName   = id => this.categories.find(c => c.id === id)?.name || id || '—';
    const statusName= id => STATUSES.find(s => s.id === id)?.label || id || '—';
    const fmtVal    = (field, val) => {
      if (val == null || val === '') return '—';
      if (field === 'ownerId')    return ownerName(val);
      if (field === 'categoryId') return catName(val);
      if (field === 'status' || field === 'orderStatus') return statusName(val);
      return String(val);
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
