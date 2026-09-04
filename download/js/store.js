(function () {
  const SCRIPT = document.currentScript;
  const ROOT = SCRIPT ? new URL('../../', SCRIPT.src) : new URL('../', window.location.href);
  const SORT_KEY = 'mbc-store-sort';
  const SECTION_KEY = 'mbc-store-section';

  const MARKET_ORDER = [
    'navigate',
    'buynothing',
    'strainverse',
    'spiritsverse',
    'cookverse',
    'gigos',
    'friendr',
    'chatr',
    'guardr',
    'sss',
    'findr',
  ];

  const SECTION_ORDER = ['all', 'navigation', 'community', 'lifestyle', 'social', 'security'];
  const SECTION_LABELS = {
    all: 'All apps',
    navigation: 'Navigation & Drive',
    community: 'Community',
    lifestyle: 'Lifestyle & Culture',
    social: 'Social & Connection',
    security: 'Security',
  };

  let catalog = null;
  let installedMap = {};
  let activeSection = 'all';
  let searchQuery = '';
  let installingSlug = null;

  function asset(path) {
    return new URL(path.replace(/^\//, ''), ROOT).href;
  }

  function downloadHref(url) {
    if (!url) return '#';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return asset(url);
  }

  function formatBytes(bytes) {
    if (!bytes || Number.isNaN(bytes)) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function compareVersions(a, b) {
    const pa = String(a || '0').split('.').map(Number);
    const pb = String(b || '0').split('.').map(Number);
    const len = Math.max(pa.length, pb.length);
    for (let i = 0; i < len; i++) {
      const diff = (pa[i] || 0) - (pb[i] || 0);
      if (diff !== 0) return diff;
    }
    return 0;
  }

  const nativeBridge = window.MbcStoreNative;

  function isStoreApp() {
    try {
      return nativeBridge && nativeBridge.isStoreApp && nativeBridge.isStoreApp() === 'true';
    } catch {
      return false;
    }
  }

  function canInstallPackages() {
    try {
      return nativeBridge && nativeBridge.canInstallPackages && nativeBridge.canInstallPackages() === 'true';
    } catch {
      return false;
    }
  }

  function requestInstallPermission() {
    try {
      nativeBridge?.requestInstallPermission?.();
    } catch {
      /* ignore */
    }
  }

  function getInstalledInfo(packageId) {
    if (!packageId || !nativeBridge?.getInstalledVersion) return null;
    try {
      const raw = nativeBridge.getInstalledVersion(packageId);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function showToast(message, isError) {
    const existing = document.querySelector('.store-toast');
    if (existing) existing.remove();
    const el = document.createElement('div');
    el.className = 'store-toast' + (isError ? ' error' : '');
    el.textContent = message;
    document.body.appendChild(el);
    window.setTimeout(() => el.remove(), 4500);
  }

  window.MbcStore = window.MbcStore || {
    _onProgress(slug, percent) {
      const bar = document.querySelector(`[data-progress-slug="${slug}"] .store-progress-bar`);
      if (bar) bar.style.width = `${Math.min(100, percent)}%`;
    },
    _onComplete(slug, success, message) {
      installingSlug = null;
      if (success) {
        showToast(message || 'Install finished — confirm in the system prompt if shown.');
        refreshInstalled();
      } else {
        showToast(message || 'Install failed.', true);
      }
      if (catalog) render();
    },
  };

  function olderBuilds(android, slug) {
    if (!android?.archives?.length || slug === 'sss') return [];
    return android.archives.filter((archive) => compareVersions(android.version, archive.version) > 0);
  }

  function flattenCatalog(apps) {
    // One card per app. Old APKs stay nested; SSS companion shells are omitted.
    return (apps || []).map((app) => {
      const android = app.android || {};
      return {
        slug: app.slug,
        installKey: app.slug,
        name: app.name,
        tagline: app.tagline,
        section: app.section,
        webUrl: app.webUrl,
        icon: app.icon,
        android: {
          ...android,
          archives: olderBuilds(android, app.slug),
        },
      };
    });
  }

  function pinFindrLast(list) {
    const findr = [];
    const rest = [];
    for (const item of list) {
      if (item.slug === 'findr') findr.push(item);
      else rest.push(item);
    }
    return [...rest, ...findr];
  }

  function getInstallState(item) {
    const android = item.android || {};
    if (android.status !== 'available') return 'soon';
    const packageId = android.packageId;
    const installed = packageId ? installedMap[packageId] : null;
    if (!installed) return 'install';
    const catalogCode = Number(android.versionCode) || 0;
    const installedCode = Number(installed.versionCode) || 0;
    if (catalogCode > installedCode) return 'update';
    if (catalogCode === installedCode && compareVersions(android.version, installed.versionName) > 0) {
      return 'update';
    }
    return 'installed';
  }

  function refreshInstalled() {
    installedMap = {};
    if (!isStoreApp() || !catalog) return;
    const items = flattenCatalog(catalog.apps || []);
    for (const item of items) {
      const packageId = item.android?.packageId;
      if (!packageId) continue;
      const info = getInstalledInfo(packageId);
      if (info) installedMap[packageId] = info;
    }
    updateStats();
  }

  function updateStats() {
    const items = flattenCatalog(catalog?.apps || []);
    const available = items.filter((i) => i.android?.status === 'available').length;
    let installed = 0;
    let updates = 0;
    for (const item of items) {
      const state = getInstallState(item);
      if (state === 'installed') installed += 1;
      if (state === 'update') updates += 1;
    }
    const elAvail = document.getElementById('store-stat-available');
    const elInstalled = document.getElementById('store-stat-installed');
    const elUpdates = document.getElementById('store-stat-updates');
    if (elAvail) elAvail.textContent = String(available);
    if (elInstalled) elInstalled.textContent = isStoreApp() ? String(installed) : '—';
    if (elUpdates) elUpdates.textContent = isStoreApp() ? String(updates) : '—';
  }

  function sortItems(items, mode) {
    const list = [...items];
    const marketRank = Object.fromEntries(MARKET_ORDER.map((slug, index) => [slug, index]));

    switch (mode) {
      case 'name':
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'available':
        list.sort((a, b) => {
          const rank = (item) => {
            const s = getInstallState(item);
            if (s === 'update') return 0;
            if (s === 'install') return 1;
            if (s === 'installed') return 2;
            return 3;
          };
          const diff = rank(a) - rank(b);
          if (diff !== 0) return diff;
          return (marketRank[a.slug] ?? 999) - (marketRank[b.slug] ?? 999);
        });
        break;
      case 'section': {
        const sectionRank = Object.fromEntries(
          SECTION_ORDER.map((section, index) => [section, index])
        );
        list.sort((a, b) => {
          const sectionDiff =
            (sectionRank[a.section] ?? 999) - (sectionRank[b.section] ?? 999);
          if (sectionDiff !== 0) return sectionDiff;
          return a.name.localeCompare(b.name);
        });
        break;
      }
      case 'version':
        list.sort((a, b) => {
          const versionDiff = compareVersions(b.android?.version, a.android?.version);
          if (versionDiff !== 0) return versionDiff;
          return a.name.localeCompare(b.name);
        });
        break;
      case 'site':
      default:
        list.sort((a, b) => (marketRank[a.slug] ?? 999) - (marketRank[b.slug] ?? 999));
        break;
    }

    return pinFindrLast(list);
  }

  function filterItems(items) {
    let list = items;
    if (activeSection !== 'all') {
      list = list.filter((item) => item.section === activeSection);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          (item.tagline || '').toLowerCase().includes(q) ||
          (item.android?.releaseNotes || '').toLowerCase().includes(q)
      );
    }
    return list;
  }

  function renderArchive(archive) {
    const size = formatBytes(archive.fileSize);
    return `
      <li>
        <a href="${downloadHref(archive.downloadUrl)}" download="${archive.downloadName || ''}" rel="noopener">
          ${archive.label || archive.version || 'Archive'}
          ${size ? ` <span class="store-size">(${size})</span>` : ''}
        </a>
      </li>`;
  }

  function renderCard(item) {
    const android = item.android || {};
    const isAvailable = android.status === 'available';
    const state = isAvailable ? getInstallState(item) : 'soon';
    const isInstalling = installingSlug === item.installKey;
    const size = formatBytes(android.fileSize);
    const versionLine = isAvailable
      ? `v${android.version || '?'}${android.versionCode ? ` · build ${android.versionCode}` : ''}`
      : 'Coming soon';

    const statusLabels = {
      install: '● Ready to install',
      update: '● Update available',
      installed: '● Installed',
      soon: '○ Coming soon',
      progress: '… Installing',
    };

    const notes =
      isAvailable && android.releaseNotes
        ? `<p class="store-card-notes">${android.releaseNotes}</p>`
        : !isAvailable
          ? `<p class="store-card-notes">Android build not published yet — try the web app from The Classifieds.</p>`
          : '';

    let actions = '';
    if (isInstalling) {
      actions = `<div class="store-progress" data-progress-slug="${item.installKey}"><div class="store-progress-bar"></div></div>`;
    }

    if (isAvailable && isStoreApp()) {
      if (state === 'installed') {
        actions += `<div class="store-card-actions">
          <span class="btn btn-soon" aria-disabled="true">Installed</span>
          ${android.packageId ? `<button type="button" class="btn-ghost" data-open="${android.packageId}">Open app</button>` : ''}
        </div>`;
      } else if (state === 'update') {
        actions += `<div class="store-card-actions">
          <button type="button" class="btn btn-primary" data-install="${item.installKey}">Update</button>
          ${android.packageId ? `<button type="button" class="btn-ghost" data-open="${android.packageId}">Open</button>` : ''}
        </div>`;
      } else {
        actions += `<div class="store-card-actions">
          <button type="button" class="btn btn-primary" data-install="${item.installKey}">Install</button>
        </div>`;
      }
      if (!android.packageId && isAvailable) {
        actions += `<p class="store-card-notes" style="margin-top:.5rem;font-size:.72rem">Package ID missing — install works, but update detection may be limited.</p>`;
      }
    } else if (isAvailable) {
      actions += `<div class="store-card-actions">
        <a class="btn btn-primary" href="${downloadHref(android.downloadUrl)}" download="${android.downloadName || ''}" rel="noopener">Download APK</a>
      </div>`;
    } else {
      actions += `<div class="store-card-actions"><span class="btn btn-soon" aria-disabled="true">Coming Soon</span></div>`;
    }

    const archives =
      isAvailable && android.archives?.length
        ? `<details class="store-archives">
            <summary>Older builds (${android.archives.length})</summary>
            <ul>${android.archives.map(renderArchive).join('')}</ul>
          </details>`
        : '';

    return `
      <article class="store-card" data-slug="${item.slug}" data-install-key="${item.installKey}">
        <div class="store-card-head">
          <img class="store-card-icon" src="${asset(item.icon)}" width="56" height="56" alt="" loading="lazy">
          <div class="store-card-title">
            <h3>${item.name}</h3>
            <p class="store-tagline">${item.tagline || ''}</p>
          </div>
        </div>
        <p class="store-card-meta">${SECTION_LABELS[item.section] || item.section} · ${versionLine}${size ? ` · ${size}` : ''}</p>
        ${notes}
        <span class="store-card-status status-${isInstalling ? 'progress' : state}">${isInstalling ? statusLabels.progress : statusLabels[state]}</span>
        ${actions}
        ${archives}
      </article>`;
  }

  function render() {
    const grid = document.getElementById('store-grid');
    const stamp = document.getElementById('store-stamp');
    if (!grid || !catalog) return;

    const mode = document.getElementById('store-sort')?.value || 'site';
    const items = sortItems(filterItems(flattenCatalog(catalog.apps || [])), mode);
    grid.innerHTML = items.length
      ? items.map(renderCard).join('')
      : '<p class="store-empty">No apps match your search.</p>';

    if (stamp) {
      const when = catalog.generatedAt ? new Date(catalog.generatedAt) : new Date();
      stamp.textContent = `Catalog refreshed ${when.toLocaleString()} · ${items.length} listing${items.length === 1 ? '' : 's'}`;
    }

    updateStats();
    bindCardActions();
  }

  function bindCardActions() {
    document.querySelectorAll('[data-install]').forEach((btn) => {
      btn.addEventListener('click', () => handleInstall(btn.getAttribute('data-install')));
    });
    document.querySelectorAll('[data-open]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const packageId = btn.getAttribute('data-open');
        try {
          nativeBridge?.openApp?.(packageId);
        } catch {
          showToast('Could not open app.', true);
        }
      });
    });
  }

  function findItemByKey(key) {
    return flattenCatalog(catalog.apps || []).find((item) => item.installKey === key);
  }

  function handleInstall(installKey) {
    if (!isStoreApp()) {
      showToast('Install from the MBC Store app for one-tap installs.', true);
      return;
    }
    if (!canInstallPackages()) {
      showToast('Allow installs from MBC Store in Android settings.', true);
      requestInstallPermission();
      return;
    }
    const item = findItemByKey(installKey);
    if (!item?.android?.downloadUrl) return;

    installingSlug = installKey;
    render();

    const url = downloadHref(item.android.downloadUrl);
    const sha = item.android.sha256 || '';
    try {
      nativeBridge.installApk(url, sha, installKey);
      showToast(`Downloading ${item.name}…`);
    } catch (err) {
      installingSlug = null;
      showToast(err.message || 'Install failed.', true);
      render();
    }
  }

  function handleUpdateAll() {
    if (!isStoreApp()) return;
    const items = flattenCatalog(catalog.apps || []);
    const pending = items.filter((item) => getInstallState(item) === 'update');
    if (!pending.length) {
      showToast('No updates pending.');
      return;
    }
    showToast(`${pending.length} update${pending.length === 1 ? '' : 's'} — starting first…`);
    handleInstall(pending[0].installKey);
  }

  function renderSectionTabs() {
    const host = document.getElementById('store-section-tabs');
    if (!host) return;
    host.innerHTML = SECTION_ORDER.map((section) => {
      const active = section === activeSection ? ' active' : '';
      return `<button type="button" class="store-tab${active}" data-section="${section}">${SECTION_LABELS[section]}</button>`;
    }).join('');
    host.querySelectorAll('.store-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        activeSection = tab.getAttribute('data-section');
        try {
          localStorage.setItem(SECTION_KEY, activeSection);
        } catch {
          /* ignore */
        }
        renderSectionTabs();
        render();
      });
    });
  }

  function renderBanner() {
    const banner = document.getElementById('store-banner');
    if (!banner) return;

    const storeApp = catalog?.storeApp;
    if (isStoreApp()) {
      banner.className = 'store-banner is-native';
      banner.innerHTML = `
        <div class="store-banner-text">
          <h2>MBC Store is running</h2>
          <p>Tap Install or Update on any app below. Android may show a confirmation screen — that's normal for apps outside the Play Store.</p>
        </div>
        <div class="store-banner-actions">
          <button type="button" class="btn btn-primary" id="store-update-all">Update all</button>
          <button type="button" class="btn" id="store-refresh-installed">Refresh status</button>
        </div>`;
      document.getElementById('store-update-all')?.addEventListener('click', handleUpdateAll);
      document.getElementById('store-refresh-installed')?.addEventListener('click', () => {
        refreshInstalled();
        render();
        showToast('Install status refreshed.');
      });
      return;
    }

    banner.className = 'store-banner';
    const storeUrl = storeApp?.downloadUrl ? downloadHref(storeApp.downloadUrl) : '#';
    const storeName = storeApp?.downloadName || 'MBC-Store.apk';
    banner.innerHTML = `
      <div class="store-banner-text">
        <h2>Get the MBC Store app</h2>
        <p>Install the store once, then install and update every MBC app from here — no hunting through Downloads for APK files.</p>
      </div>
      <div class="store-banner-actions">
        <a class="btn btn-primary" href="${storeUrl}" download="${storeName}" rel="noopener">Get MBC Store</a>
        <a class="btn" href="#store-grid">Browse catalog</a>
      </div>`;
  }

  async function loadCatalog() {
    const grid = document.getElementById('store-grid');
    if (grid) grid.innerHTML = '<p class="store-loading">Loading app catalog…</p>';
    try {
      const res = await fetch(asset('apk-catalog.json'), { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      catalog = await res.json();
      refreshInstalled();
      renderBanner();
      renderSectionTabs();
      render();
    } catch (err) {
      if (grid) {
        grid.innerHTML = `<p class="store-loading">Could not load catalog (${err.message}). Try Refresh.</p>`;
      }
    }
  }

  function initSort() {
    const select = document.getElementById('store-sort');
    if (!select) return;
    try {
      const saved = localStorage.getItem(SORT_KEY);
      if (saved && [...select.options].some((opt) => opt.value === saved)) {
        select.value = saved;
      }
    } catch {
      /* ignore */
    }
    select.addEventListener('change', () => {
      try {
        localStorage.setItem(SORT_KEY, select.value);
      } catch {
        /* ignore */
      }
      render();
    });
  }

  function initSearch() {
    const input = document.getElementById('store-search');
    if (!input) return;
    input.addEventListener('input', () => {
      searchQuery = input.value.trim();
      render();
    });
  }

  try {
    const savedSection = localStorage.getItem(SECTION_KEY);
    if (savedSection && SECTION_ORDER.includes(savedSection)) activeSection = savedSection;
  } catch {
    /* ignore */
  }

  document.getElementById('store-refresh')?.addEventListener('click', (e) => {
    e.preventDefault();
    loadCatalog();
  });

  initSort();
  initSearch();
  loadCatalog();
})();
