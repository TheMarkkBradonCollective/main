(function () {
  const SCRIPT = document.currentScript;
  const ROOT = SCRIPT ? new URL('../', SCRIPT.src) : new URL('../../', window.location.href);

  const SECTION_LABELS = {
    community: 'Community',
    lifestyle: 'Lifestyle & Culture',
    social: 'Social & Connection',
    security: 'Security Company',
  };

  function asset(rel) {
    return new URL(rel.replace(/^\//, ''), ROOT).href;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getSlug() {
    const params = new URLSearchParams(window.location.search);
    return (params.get('app') || params.get('slug') || '').trim().toLowerCase();
  }

  function normalizeProject(raw) {
    const screenshots = Array.isArray(raw.screenshots) && raw.screenshots.length
      ? raw.screenshots
      : raw.screenshot
        ? [{ src: raw.screenshot, caption: 'App screen' }]
        : [];

    return {
      ...raw,
      screenshots: screenshots.map((shot, i) =>
        typeof shot === 'string'
          ? { src: shot, caption: `Screen ${i + 1}` }
          : { src: shot.src, caption: shot.caption || `Screen ${i + 1}` }
      ),
      features: Array.isArray(raw.features) ? raw.features : [],
    };
  }

  function phoneFrame(shot, opts = {}) {
    const cls = opts.className ? ` ${opts.className}` : '';
    const loading = opts.eager ? 'eager' : 'lazy';
    return `
      <figure class="phone-frame${cls}">
        <div class="phone-frame-bezel" aria-hidden="true">
          <span class="phone-frame-notch"></span>
        </div>
        <div class="phone-frame-screen">
          <img src="${escapeHtml(asset(shot.src))}" alt="${escapeHtml(shot.caption)}" width="390" height="844" loading="${loading}">
        </div>
        <figcaption>${escapeHtml(shot.caption)}</figcaption>
      </figure>
    `;
  }

  function renderMissing(root, slug) {
    root.innerHTML = `
      <p class="breadcrumb"><a href="../">The Classifieds</a> / Showcase</p>
      <div class="prose">
        <h2>Listing not found</h2>
        <p>No showcase for <code>${escapeHtml(slug || '(missing app)')}</code>. Head back to the classifieds and pick a listing.</p>
        <p><a class="btn btn-primary" href="../">Back to The Classifieds</a></p>
      </div>
    `;
  }

  function render(project) {
    const root = document.getElementById('showcase-root');
    if (!root) return;

    const primary = project.screenshots[0];
    const gallery = project.screenshots;
    const section = SECTION_LABELS[project.section] || project.section || 'Classifieds';
    const statusClass = project.status === 'dev' ? 'dev' : 'live';
    const statusLabel = project.statusLabel || (project.status === 'dev' ? 'In Development' : 'Active · Free');
    const listing = project.listing || '';

    document.title = `${project.name} Showcase — The Markk Brandon Collective`;
    const titleEl = document.getElementById('showcase-title');
    const tagEl = document.getElementById('showcase-tagline');
    const editionEl = document.getElementById('showcase-edition');
    if (titleEl) titleEl.textContent = project.name;
    if (tagEl) tagEl.textContent = project.tagline || 'Screenshots, features, and the live product';
    if (editionEl) editionEl.textContent = project.name;

    const featuresHtml = project.features.length
      ? `
        <section class="showcase-features">
          <div class="section-head">
            <p class="kicker">What you get</p>
            <h2>Popular pieces of the product</h2>
          </div>
          <ol class="showcase-feature-list">
            ${project.features
              .map(
                (feature, i) => `
              <li>
                <span class="feature-num">${String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3>${escapeHtml(feature.title || feature)}</h3>
                  ${feature.blurb ? `<p>${escapeHtml(feature.blurb)}</p>` : ''}
                </div>
              </li>`
              )
              .join('')}
          </ol>
        </section>`
      : '';

    const galleryHtml = gallery.length
      ? `
        <section class="showcase-gallery">
          <div class="section-head">
            <p class="kicker">Interface show</p>
            <h2>Application screens</h2>
          </div>
          <div class="phone-gallery">
            ${gallery.map((shot, i) => phoneFrame(shot, { eager: i === 0 })).join('')}
          </div>
        </section>`
      : '';

    root.innerHTML = `
      <p class="breadcrumb">
        <a href="../../index.html">Front Page</a> /
        <a href="../">The Classifieds</a> /
        ${escapeHtml(project.name)}
      </p>

      <section class="showcase-hero${project.section === 'security' ? ' is-security' : ''}">
        <div class="showcase-hero-copy">
          <p class="showcase-kicker">${escapeHtml(section)}${listing ? ` · ${escapeHtml(listing)}` : ''}</p>
          <div class="showcase-brand-row">
            <img class="showcase-logo" src="${escapeHtml(asset(`icons/apps/${project.slug}.png`))}" width="72" height="72" alt="">
            <div>
              <h2 class="showcase-name">${escapeHtml(project.name)}</h2>
              <p class="showcase-tag">${escapeHtml(project.tagline || '')}</p>
            </div>
          </div>
          <p class="showcase-blurb">${escapeHtml(project.description || '')}</p>
          <p class="ad-status ${statusClass}">● ${escapeHtml(statusLabel)}</p>
          <div class="btn-row showcase-actions">
            <a class="btn btn-primary" href="${escapeHtml(project.url)}" target="_blank" rel="noopener">Open live app</a>
            <a class="btn" href="../../download/">Downloads</a>
            <a class="btn" href="../">Back to Classifieds</a>
          </div>
        </div>
        <div class="showcase-hero-device">
          ${primary ? phoneFrame(primary, { className: 'is-hero', eager: true }) : '<p class="showcase-empty">Screenshot coming soon.</p>'}
        </div>
      </section>

      ${featuresHtml}
      ${galleryHtml}

      <div class="cover-cta">
        <p>Want something in this lane built for you?</p>
        <div class="btn-row">
          <a class="btn btn-primary" href="../../request/">Hire Me</a>
          <a class="btn" href="../../support/">Support</a>
        </div>
      </div>
    `;
  }

  async function init() {
    const root = document.getElementById('showcase-root');
    if (!root) return;
    const slug = getSlug();
    if (!slug) {
      renderMissing(root, '');
      return;
    }

    try {
      const res = await fetch(asset('My-Projects.json'), { cache: 'no-store' });
      if (!res.ok) throw new Error('catalog fetch failed');
      const projects = await res.json();
      const match = (Array.isArray(projects) ? projects : []).find((p) => p.slug === slug);
      if (!match) {
        renderMissing(root, slug);
        return;
      }
      render(normalizeProject(match));
    } catch (err) {
      root.innerHTML = `
        <p class="breadcrumb"><a href="../">The Classifieds</a> / Showcase</p>
        <div class="prose">
          <h2>Couldn’t load showcase</h2>
          <p>${escapeHtml(err.message || err)}</p>
          <p><a class="btn btn-primary" href="../">Back to The Classifieds</a></p>
        </div>
      `;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
