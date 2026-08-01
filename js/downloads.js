(function () {
  const SCRIPT = document.currentScript;
  const ROOT = SCRIPT ? new URL('../', SCRIPT.src) : new URL('./', window.location.href);
  const SORT_KEY = 'mbc-download-sort';

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

  const MARKET_ORDER = [
    'buynothing',
    'strainverse',
    'spiritsverse',
    'cookverse',
    'friendr',
    'findr',
    'chatr',
    'guardr',
    'sss',
  ];

  const SECTION_ORDER = ['community', 'lifestyle', 'social', 'security'];

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

  function sortApps(apps, mode) {
    const list = [...apps];
    const marketRank = Object.fromEntries(MARKET_ORDER.map((slug, index) => [slug, index]));
    const sectionRank = Object.fromEntries(SECTION_ORDER.map((section, index) => [section, index]));

    switch (mode) {
      case 'name':
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case 'available':
        return list.sort((a, b) => {
          const aReady = a.android?.status === 'available' ? 0 : 1;
          const bReady = b.android?.status === 'available' ? 0 : 1;
          if (aReady !== bReady) return aReady - bReady;
          return (marketRank[a.slug] ?? 999) - (marketRank[b.slug] ?? 999);
        });
      case 'section':
        return list.sort((a, b) => {
          const sectionDiff =
            (sectionRank[a.section] ?? 999) - (sectionRank[b.section] ?? 999);
          if (sectionDiff !== 0) return sectionDiff;
          return a.name.localeCompare(b.name);
        });
      case 'version':
        return list.sort((a, b) => {
          const versionDiff = compareVersions(b.android?.version, a.android?.version);
          if (versionDiff !== 0) return versionDiff;
          return a.name.localeCompare(b.name);
        });
      case 'site':
      default:
        return list.sort((a, b) => (marketRank[a.slug] ?? 999) - (marketRank[b.slug] ?? 999));
    }
  }

  function sectionLabel(section) {
    const map = {
      community: 'Community',
      lifestyle: 'Lifestyle & Culture',
      social: 'Social & Connection',
      security: 'Security',
    };
    return map[section] || section;
  }

  function renderArchive(archive) {
    const size = formatBytes(archive.fileSize);
    return `
      <li>
        <a href="${downloadHref(archive.downloadUrl)}" download="${archive.downloadName || ''}" rel="noopener">
          ${archive.label || archive.version || 'Archive'}
          ${size ? ` <span class="dl-size">(${size})</span>` : ''}
        </a>
      </li>`;
  }

  function renderCard(app) {
    const android = app.android || {};
    const isAvailable = android.status === 'available';
    const versionLine = isAvailable
      ? `Android v${android.version || '?'}${android.versionCode ? ` · build ${android.versionCode}` : ''}`
      : app.webVersion
        ? `Coming soon · web v${app.webVersion}`
        : 'Coming soon';

    const size = formatBytes(android.fileSize);
    const notes =
      isAvailable && android.releaseNotes
        ? `<p class="dl-notes">${android.releaseNotes}</p>`
        : !isAvailable
          ? `<p class="dl-notes">Android APK not published yet — use the browser version for now.</p>`
          : '';

    const archives =
      isAvailable && android.archives?.length
        ? `<details class="dl-archives">
            <summary>Older builds (${android.archives.length})</summary>
            <ul>${android.archives.map(renderArchive).join('')}</ul>
          </details>`
        : '';

    const actions = isAvailable
      ? `<div class="ad-links">
          <a class="btn btn-primary" href="${downloadHref(android.downloadUrl)}" download="${android.downloadName || ''}" rel="noopener">Download APK</a>
          <a class="btn" href="${app.webUrl}" target="_blank" rel="noopener">Open in Browser</a>
        </div>`
      : `<div class="ad-links">
          <span class="btn btn-soon" aria-disabled="true">Coming Soon</span>
          <a class="btn btn-primary" href="${app.webUrl}" target="_blank" rel="noopener">Open in Browser</a>
        </div>`;

    const sha = android.sha256
      ? `<p class="dl-sha mono" title="SHA-256">SHA-256: ${android.sha256.slice(0, 16)}…</p>`
      : '';

    return `
      <article class="classified-ad dl-card" data-slug="${app.slug}" data-status="${android.status}">
        <p class="ad-number">${sectionLabel(app.section)}</p>
        <img class="ad-thumb" src="../${app.icon}" width="64" height="64" alt="" loading="lazy">
        <h4>${app.name}</h4>
        <p class="ad-tagline">${app.tagline || ''}</p>
        <p class="dl-meta">${versionLine}${size ? ` · ${size}` : ''}</p>
        ${notes}
        ${sha}
        <p class="ad-status ${isAvailable ? 'live' : 'dev'}">${isAvailable ? '● APK ready' : '○ Coming soon'}</p>
        ${actions}
        ${archives}
      </article>`;
  }

  let currentCatalog = null;

  function getSortMode() {
    const select = document.getElementById('download-sort');
    return select?.value || 'site';
  }

  function renderCatalog(catalog) {
    const grid = document.getElementById('download-grid');
    const stamp = document.getElementById('download-stamp');
    if (!grid) return;

    currentCatalog = catalog;
    const mode = getSortMode();
    const apps = sortApps(catalog.apps || [], mode);
    const available = apps.filter((a) => a.android?.status === 'available').length;

    grid.innerHTML = apps.map(renderCard).join('');

    if (stamp) {
      const when = catalog.generatedAt ? new Date(catalog.generatedAt) : new Date();
      stamp.textContent = `Listings refreshed ${when.toLocaleString()} · ${available} APK${available === 1 ? '' : 's'} ready`;
    }
  }

  function setLoading(message) {
    const grid = document.getElementById('download-grid');
    if (grid) {
      grid.innerHTML = `<p class="dl-loading">${message}</p>`;
    }
  }

  async function loadCatalog() {
    setLoading('Checking the wire for latest APK listings…');
    try {
      const res = await fetch(asset('apk-catalog.json'), { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const catalog = await res.json();
      renderCatalog(catalog);
    } catch (err) {
      setLoading(`Could not load APK catalog (${err.message}). Try Refresh listings.`);
    }
  }

  function initSort() {
    const select = document.getElementById('download-sort');
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
      if (currentCatalog) renderCatalog(currentCatalog);
    });
  }

  document.getElementById('download-refresh')?.addEventListener('click', (e) => {
    e.preventDefault();
    loadCatalog();
  });

  initSort();
  loadCatalog();
})();
