(function () {
  const SCRIPT = document.currentScript;
  const ROOT = SCRIPT ? new URL('../', SCRIPT.src) : new URL('./', window.location.href);

  function asset(path) {
    return new URL(path.replace(/^\//, ''), ROOT).href;
  }

  function formatBytes(bytes) {
    if (!bytes || Number.isNaN(bytes)) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
        <a href="${archive.downloadUrl}" download="${archive.downloadName || ''}" rel="noopener">
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
          <a class="btn btn-primary" href="${android.downloadUrl}" download="${android.downloadName || ''}" rel="noopener">Download APK</a>
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

  function renderCatalog(catalog) {
    const grid = document.getElementById('download-grid');
    const stamp = document.getElementById('download-stamp');
    if (!grid) return;

    const apps = catalog.apps || [];
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

  document.getElementById('download-refresh')?.addEventListener('click', (e) => {
    e.preventDefault();
    loadCatalog();
  });

  loadCatalog();
})();
