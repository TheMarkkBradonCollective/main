(function () {
  const SCRIPT = document.currentScript;
  const ROOT = SCRIPT ? new URL('../', SCRIPT.src) : new URL('../', window.location.href);
  const CATALOG_URL = new URL('../My-Projects.json', ROOT).href;
  const MODE = SCRIPT?.dataset?.mode || 'classifieds';

  const CLASSIFIED_SECTIONS = [
    { id: 'community', label: 'Community' },
    { id: 'lifestyle', label: 'Lifestyle & Culture' },
    { id: 'social', label: 'Social & Connection' },
  ];

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function iconSrc(slug) {
    return new URL(`icons/apps/${slug}.png`, ROOT).href;
  }

  function downloadHref(slug) {
    return new URL(`download/#download-${encodeURIComponent(slug)}`, ROOT).href;
  }

  function showcaseHref(slug) {
    return new URL(`apps/showcase/?app=${encodeURIComponent(slug)}`, ROOT).href;
  }

  function statusClass(app) {
    return app.status === 'dev' ? 'dev' : 'live';
  }

  function renderCard(app, opts = {}) {
    const extraClass = opts.security ? ' security-ad' : '';
    const idAttr = app.slug ? ` id="${escapeHtml(app.slug)}"` : '';
    return `
      <article class="classified-ad${extraClass}"${idAttr}>
        <p class="ad-number">${escapeHtml(app.listing || app.slug)}</p>
        <img class="ad-thumb" src="${escapeHtml(iconSrc(app.slug))}" width="64" height="64" alt="" loading="lazy">
        <h4>${escapeHtml(app.name)}</h4>
        <p class="ad-tagline">${escapeHtml(app.tagline || '')}</p>
        <p>${escapeHtml(app.description || app.heroLine || '')}</p>
        <p class="ad-status ${statusClass(app)}">● ${escapeHtml(app.statusLabel || 'Active · APK')}</p>
        <div class="ad-links">
          <a class="btn btn-primary" href="${escapeHtml(showcaseHref(app.slug))}">View details</a>
          <a class="btn" href="${escapeHtml(downloadHref(app.slug))}">Get APK</a>
        </div>
      </article>`;
  }

  async function init() {
    try {
      const res = await fetch(CATALOG_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const apps = await res.json();

      if (MODE === 'security') {
        const grid = document.querySelector('#companies .classified-grid');
        if (grid) {
          const items = apps.filter((app) => app.section === 'security');
          grid.innerHTML = items.map((app) => renderCard(app, { security: true })).join('');
        }
        return;
      }

      for (const section of CLASSIFIED_SECTIONS) {
        const grid = document.querySelector(`#${section.id} .classified-grid`);
        if (!grid) continue;
        const items = apps.filter((app) => app.section === section.id);
        grid.innerHTML = items.map((app) => renderCard(app)).join('');
      }
    } catch (err) {
      console.error('classifieds.js:', err);
    }
  }

  init();
})();
