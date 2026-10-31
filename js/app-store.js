(function () {
  const THEME_KEY = 'mbc-store-theme';
  const TAB_KEY = 'mbc-store-tab';

  const CATEGORY_LABELS = {
    navigation: 'Navigation & Auto',
    community: 'Community',
    lifestyle: 'Lifestyle & Culture',
    social: 'Social',
    security: 'Security',
    productivity: 'Productivity',
    games: 'Games',
  };

  let catalog = null;
  let route = parseRoute();
  let activeTab = 'home';
  let categoryFilter = 'all';
  let searchQuery = '';

  const els = {
    main: document.getElementById('store-main'),
    header: document.getElementById('store-header'),
    back: document.getElementById('store-back'),
    title: document.getElementById('store-header-title'),
    search: document.getElementById('store-search'),
    nav: document.getElementById('store-bottom-nav'),
  };

  function asset(path) {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return new URL(path.replace(/^\//, ''), document.baseURI).href;
  }

  function escapeHtml(text) {
    return String(text ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatBytes(bytes) {
    if (!bytes || Number.isNaN(Number(bytes))) return '—';
    const n = Number(bytes);
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatDate(iso) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return iso;
    }
  }

  function categoryLabel(id) {
    return catalog?.categories?.find((c) => c.id === id)?.label || CATEGORY_LABELS[id] || id || 'App';
  }

  function appBySlug(slug) {
    return (catalog?.apps || []).find((a) => a.slug === slug);
  }

  function androidStatus(app) {
    const st = app?.android?.status;
    if (st === 'available') return 'available';
    if (st === 'coming-soon' || st === 'web-only') return 'soon';
    return 'soon';
  }

  function hasApk(app) {
    return androidStatus(app) === 'available' && app.android?.downloadUrl;
  }

  function downloadHref(app) {
    const url = app?.android?.downloadUrl;
    if (!url) return '#';
    return asset(url);
  }

  function normalizeApps() {
    return (catalog?.apps || []).map((app) => ({
      ...app,
      category: app.category || app.section || 'lifestyle',
    }));
  }

  function filterApps(apps) {
    let list = apps;
    if (categoryFilter !== 'all') {
      list = list.filter((a) => a.category === categoryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.tagline || '').toLowerCase().includes(q) ||
          (a.description || '').toLowerCase().includes(q)
      );
    }
    return list;
  }

  function parseRoute() {
    const hash = window.location.hash.replace(/^#/, '') || '/';
    const detail = hash.match(/^\/app\/([^/?]+)/);
    if (detail) return { view: 'detail', slug: decodeURIComponent(detail[1]) };
    if (hash.startsWith('/categories')) return { view: 'categories' };
    if (hash.startsWith('/settings')) return { view: 'settings' };
    if (hash.startsWith('/apps')) return { view: 'apps' };
    return { view: 'home' };
  }

  function navigate(path) {
    window.location.hash = path;
  }

  function setTab(tab) {
    activeTab = tab;
    try {
      localStorage.setItem(TAB_KEY, tab);
    } catch {
      /* ignore */
    }
    syncNav();
  }

  function syncNav() {
    if (!els.nav) return;
    els.nav.querySelectorAll('[data-tab]').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === activeTab);
    });
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore */
    }
  }

  function initTheme() {
    let theme = 'light';
    try {
      theme = localStorage.getItem(THEME_KEY) || '';
    } catch {
      theme = '';
    }
    if (!theme) {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    setTheme(theme);
  }

  function iconSrc(app) {
    return asset(app.icon || 'icons/icon-192.png');
  }

  function renderFeatureCard(app) {
    return `<a class="store-feature-card" href="#/app/${encodeURIComponent(app.slug)}" data-slug="${escapeHtml(app.slug)}">
      <div class="store-feature-top">
        <img class="store-icon" src="${iconSrc(app)}" alt="" width="56" height="56" loading="lazy">
        <div>
          <strong>${escapeHtml(app.name)}</strong>
          <p style="margin:.2rem 0 0;font-size:.82rem;color:var(--store-text-muted)">${escapeHtml(app.tagline || '')}</p>
        </div>
      </div>
      <span class="store-category-tag">${escapeHtml(categoryLabel(app.category))}</span>
    </a>`;
  }

  function renderGridItem(app) {
    return `<a class="store-grid-item" href="#/app/${encodeURIComponent(app.slug)}">
      <img class="store-icon store-icon-grid" src="${iconSrc(app)}" alt="" width="64" height="64" loading="lazy">
      <span>${escapeHtml(app.name)}</span>
    </a>`;
  }

  function renderListRow(app) {
    const ver = app.android?.version ? `v${app.android.version}` : hasApk(app) ? 'APK' : 'Coming soon';
    return `<a class="store-list-row" href="#/app/${encodeURIComponent(app.slug)}">
      <img class="store-icon store-icon-sm" src="${iconSrc(app)}" alt="" width="48" height="48" loading="lazy">
      <div class="store-list-meta" style="flex:1;min-width:0">
        <h3>${escapeHtml(app.name)}</h3>
        <p>${escapeHtml(app.tagline || categoryLabel(app.category))} · ${escapeHtml(ver)}</p>
      </div>
    </a>`;
  }

  function renderHome() {
    const apps = normalizeApps();
    const featuredSlugs = catalog?.featuredSlugs?.length
      ? catalog.featuredSlugs
      : apps.filter((a) => a.featured).map((a) => a.slug);
    const newSlugs = catalog?.newUpdatedSlugs?.length
      ? catalog.newUpdatedSlugs
      : apps.filter((a) => a.newUpdated).map((a) => a.slug);

    const featured = featuredSlugs.map(appBySlug).filter(Boolean);
    const fresh = newSlugs.map(appBySlug).filter(Boolean);
    const categories = catalog?.categories || Object.keys(CATEGORY_LABELS).map((id) => ({
      id,
      label: CATEGORY_LABELS[id],
    }));

    const chips = categories
      .map(
        (c) =>
          `<button type="button" class="store-chip${categoryFilter === c.id ? ' active' : ''}" data-cat="${escapeHtml(c.id)}">${escapeHtml(c.label)}</button>`
      )
      .join('');

    const filtered = filterApps(apps);

    return `
      <section aria-label="Featured">
        <h2 class="store-section-title">Featured</h2>
        <div class="store-carousel">${featured.length ? featured.map(renderFeatureCard).join('') : '<p class="store-empty">No featured apps yet.</p>'}</div>
      </section>
      <section aria-label="New and updated">
        <h2 class="store-section-title">New &amp; updated</h2>
        <div class="store-carousel">${fresh.length ? fresh.map(renderFeatureCard).join('') : apps.slice(0, 6).map(renderFeatureCard).join('')}</div>
      </section>
      <section aria-label="Categories">
        <h2 class="store-section-title">Categories</h2>
        <div class="store-chip-row">
          <button type="button" class="store-chip${categoryFilter === 'all' ? ' active' : ''}" data-cat="all">All</button>
          ${chips}
        </div>
      </section>
      <section aria-label="All apps">
        <h2 class="store-section-title">${categoryFilter === 'all' ? 'All apps' : escapeHtml(categoryLabel(categoryFilter))}</h2>
        <div class="store-grid">${filtered.length ? filtered.map(renderGridItem).join('') : '<p class="store-empty">No apps match.</p>'}</div>
      </section>`;
  }

  function renderApps() {
    const apps = filterApps(normalizeApps()).sort((a, b) => a.name.localeCompare(b.name));
    return `
      <h2 class="store-section-title">All apps</h2>
      <div>${apps.length ? apps.map(renderListRow).join('') : '<p class="store-empty">No apps match your search.</p>'}</div>`;
  }

  function renderCategories() {
    const apps = normalizeApps();
    const categories = catalog?.categories || [];
    return categories
      .map((cat) => {
        const inCat = apps.filter((a) => a.category === cat.id);
        if (!inCat.length) return '';
        return `<section>
          <h2 class="store-section-title">${escapeHtml(cat.label)}</h2>
          <div class="store-grid">${inCat.map(renderGridItem).join('')}</div>
        </section>`;
      })
      .join('');
  }

  function renderSettings() {
    const theme = document.documentElement.getAttribute('data-theme') || 'light';
    return `
      <h2 class="store-section-title">Settings</h2>
      <div class="store-settings-group">
        <div class="store-settings-row">
          <span>Appearance</span>
          <button type="button" class="store-theme-toggle" id="store-theme-toggle">${theme === 'dark' ? 'Dark' : 'Light'} mode</button>
        </div>
        <div class="store-settings-row">
          <span>Install MBC Store APK</span>
          <a href="${asset(catalog?.storeApp?.downloadUrl || 'apks/mbc-store/MBC-Store-v1.0.0.apk')}" download rel="noopener">Download</a>
        </div>
        <div class="store-settings-row">
          <span>About the collective</span>
          <a href="about/">Open</a>
        </div>
        <div class="store-settings-row">
          <span>Support &amp; hire</span>
          <a href="support/">Support</a>
        </div>
      </div>
      <p style="font-size:.78rem;color:var(--store-text-muted);line-height:1.45">Catalog updated ${escapeHtml(formatDate(catalog?.generatedAt))}. Sideload APKs from trusted sources only — these builds are from The Markk Brandon Collective, not Google Play.</p>`;
  }

  function screenshotHtml(app) {
    const shots = app.screenshots?.length ? app.screenshots : [];
    if (shots.length) {
      return shots
        .map(
          (src) =>
            `<img class="store-screenshot" src="${asset(src)}" alt="" loading="lazy">`
        )
        .join('');
    }
    return `<div class="store-screenshot placeholder">Screenshots coming soon</div>
      <div class="store-screenshot placeholder" style="background:linear-gradient(145deg,var(--store-surface-2),var(--store-surface))">${escapeHtml(app.name)}</div>`;
  }

  function renderDetail(slug) {
    const app = appBySlug(slug);
    if (!app) {
      return `<p class="store-empty">App not found. <a href="#/">Back to store</a></p>`;
    }
    const android = app.android || {};
    const available = hasApk(app);
    const installBtn = available
      ? `<a class="store-btn store-btn-install" href="${downloadHref(app)}" download="${escapeHtml(android.downloadName || '')}" rel="noopener">Install / Download APK</a>`
      : `<span class="store-btn store-btn-soon">${android.status === 'coming-soon' ? 'Coming soon' : 'No APK yet'}</span>`;
    const webBtn =
      app.webUrl && app.webUrl.startsWith('http')
        ? `<a class="store-btn store-btn-secondary" href="${escapeHtml(app.webUrl)}" target="_blank" rel="noopener noreferrer">Open web app</a>`
        : '';

    return `
      <article class="store-detail">
        <div class="store-detail-hero">
          <img class="store-detail-icon" src="${iconSrc(app)}" alt="" width="88" height="88">
          <div class="store-detail-title">
            <h1>${escapeHtml(app.name)}</h1>
            <p>${escapeHtml(app.tagline || '')}</p>
            <span class="store-category-tag">${escapeHtml(categoryLabel(app.category || app.section))}</span>
          </div>
        </div>
        <div class="store-detail-actions">${installBtn}${webBtn}</div>
        <div class="store-meta-grid">
          <div class="store-meta-cell"><span>Version</span><strong>${escapeHtml(android.version || '—')}</strong></div>
          <div class="store-meta-cell"><span>Size</span><strong>${formatBytes(android.fileSize)}</strong></div>
          <div class="store-meta-cell"><span>Updated</span><strong>${formatDate(android.updatedAt || catalog?.generatedAt)}</strong></div>
          <div class="store-meta-cell"><span>Category</span><strong>${escapeHtml(categoryLabel(app.category || app.section))}</strong></div>
        </div>
        <h2 class="store-section-title">Screenshots</h2>
        <div class="store-screenshots">${screenshotHtml(app)}</div>
        <h2 class="store-section-title">About this app</h2>
        <p class="store-description">${escapeHtml(app.description || app.tagline || 'No description yet.')}</p>
        ${android.releaseNotes ? `<p class="store-description" style="margin-top:1rem;color:var(--store-text-muted)">${escapeHtml(android.releaseNotes)}</p>` : ''}
      </article>`;
  }

  function bindHomeEvents() {
    els.main?.querySelectorAll('[data-cat]').forEach((btn) => {
      btn.addEventListener('click', () => {
        categoryFilter = btn.getAttribute('data-cat') || 'all';
        render();
      });
    });
  }

  function bindSettingsEvents() {
    document.getElementById('store-theme-toggle')?.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      setTheme(current === 'dark' ? 'light' : 'dark');
      render();
    });
  }

  function updateChrome() {
    route = parseRoute();
    const isDetail = route.view === 'detail';
    els.header?.classList.toggle('has-back', isDetail);
    if (els.back) els.back.hidden = !isDetail;
    if (els.title) {
      if (isDetail) {
        const app = appBySlug(route.slug);
        els.title.textContent = app?.name || 'App';
      } else {
        els.title.textContent = 'MBC Store';
      }
    }
    if (els.search) {
      els.search.parentElement.style.display = isDetail ? 'none' : '';
    }

    if (route.view === 'home') setTab('home');
    else if (route.view === 'apps') setTab('apps');
    else if (route.view === 'categories') setTab('categories');
    else if (route.view === 'settings') setTab('settings');
    else if (route.view === 'detail') setTab('home');
  }

  function render() {
    if (!catalog || !els.main) return;
    updateChrome();

    switch (route.view) {
      case 'detail':
        els.main.innerHTML = renderDetail(route.slug);
        break;
      case 'apps':
        els.main.innerHTML = renderApps();
        break;
      case 'categories':
        els.main.innerHTML = renderCategories();
        break;
      case 'settings':
        els.main.innerHTML = renderSettings();
        bindSettingsEvents();
        break;
      case 'home':
      default:
        els.main.innerHTML = renderHome();
        bindHomeEvents();
        break;
    }
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }

  async function loadCatalog() {
    if (els.main) els.main.innerHTML = '<p class="store-loading">Loading apps…</p>';
    try {
      const res = await fetch(asset('apk-catalog.json'), { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      catalog = await res.json();
      render();
    } catch (err) {
      if (els.main) {
        els.main.innerHTML = `<p class="store-empty">Could not load catalog (${escapeHtml(err.message)}).</p>`;
      }
    }
  }

  function initNav() {
    els.nav?.querySelectorAll('[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        if (tab === 'home') navigate('/');
        else if (tab === 'apps') navigate('/apps');
        else if (tab === 'categories') navigate('/categories');
        else if (tab === 'settings') navigate('/settings');
      });
    });

    try {
      const saved = localStorage.getItem(TAB_KEY);
      if (saved) activeTab = saved;
    } catch {
      /* ignore */
    }
    syncNav();
  }

  els.back?.addEventListener('click', () => {
    if (window.history.length > 1) window.history.back();
    else navigate('/');
  });

  els.search?.addEventListener('input', () => {
    searchQuery = els.search.value;
    if (route.view === 'home' || route.view === 'apps') render();
    else if (searchQuery.trim()) navigate('/apps');
  });

  window.addEventListener('hashchange', () => {
    route = parseRoute();
    render();
  });

  initTheme();
  initNav();
  loadCatalog();
})();
