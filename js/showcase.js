(function () {
  const SCRIPT = document.currentScript;
  const ROOT = SCRIPT ? new URL('../', SCRIPT.src) : new URL('../../', window.location.href);

  const SECTION_LABELS = {
    community: 'Community',
    lifestyle: 'Lifestyle & Culture',
    social: 'Social & Connection',
    security: 'Security Company',
  };

  const SISTER_NAMES = {
    strainverse: 'StrainVerse',
    spiritsverse: 'SpiritsVerse',
    cookverse: 'Cookverse',
  };

  function asset(rel) {
    return new URL(String(rel || '').replace(/^\//, ''), ROOT).href;
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

  function normalizeScreenshots(list, fallback = []) {
    const source = Array.isArray(list) && list.length ? list : fallback;
    return source.map((shot, i) => {
      if (typeof shot === 'string') return { src: shot, caption: `Screen ${i + 1}` };
      return {
        src: shot.src,
        caption: shot.caption || `Screen ${i + 1}`,
        device: shot.device,
        framed: Boolean(shot.framed),
      };
    });
  }

  function normalize(raw) {
    const phoneShots = normalizeScreenshots(raw.screenshots);
    const tabletShots = normalizeScreenshots(raw.screenshotsTablet);
    const desktopShots = normalizeScreenshots(raw.screenshotsDesktop);

    return {
      ...raw,
      theme: raw.theme || 'default',
      screenshots: phoneShots,
      screenshotsTablet: tabletShots,
      screenshotsDesktop: desktopShots,
      features: Array.isArray(raw.features) ? raw.features : [],
      steps: Array.isArray(raw.steps) ? raw.steps : [],
      layers: Array.isArray(raw.layers) ? raw.layers : [],
      roles: Array.isArray(raw.roles) ? raw.roles : [],
      sisters: Array.isArray(raw.sisters) ? raw.sisters : [],
      readDetails: Array.isArray(raw.readDetails) ? raw.readDetails : [],
      platforms: Array.isArray(raw.platforms) ? raw.platforms : ['phone', 'tablet', 'chromebook'],
    };
  }

  function deviceScreen(shot, type) {
    if (!shot) return '';
    const wrapClass =
      type === 'tablet'
        ? 'sc-tablet-screen-wrap'
        : type === 'chromebook'
          ? 'sc-chromebook-screen-wrap'
          : 'sc-phone-screen-wrap';
    return `
      <div class="${wrapClass} sc-device-screen">
        ${type === 'phone' ? '<span class="sc-phone-camera" aria-hidden="true"></span>' : ''}
        ${type === 'tablet' ? '<span class="sc-tablet-camera" aria-hidden="true"></span>' : ''}
        ${type === 'chromebook' ? '<span class="sc-chromebook-webcam" aria-hidden="true"></span>' : ''}
        <img src="${escapeHtml(asset(shot.src))}" alt="${escapeHtml(shot.caption)}" loading="lazy">
      </div>`;
  }

  function shotDeviceType(shot) {
    if (!shot) return 'phone';
    if (shot.device === 'desktop') return 'chromebook';
    return shot.device || 'phone';
  }

  function renderShot(shot, opts = {}) {
    if (!shot) return '';
    if (shot.framed) {
      const cls = opts.className ? ` ${opts.className}` : '';
      const loading = opts.eager ? 'eager' : 'lazy';
      const caption = opts.hideCaption ? '' : `<figcaption>${escapeHtml(shot.caption)}</figcaption>`;
      return `
        <figure class="sc-framed-shot${cls}">
          <img src="${escapeHtml(asset(shot.src))}" alt="${escapeHtml(shot.caption)}" width="900" height="640" loading="${loading}">
          ${caption}
        </figure>`;
    }
    const type = opts.type || shotDeviceType(shot);
    return device(shot, { ...opts, type });
  }

  function device(shot, opts = {}) {
    if (!shot) return '';
    const type = opts.type || 'phone';
    const cls = opts.className ? ` ${opts.className}` : '';
    const loading = opts.eager ? 'eager' : 'lazy';
    const caption = opts.hideCaption ? '' : `<figcaption>${escapeHtml(shot.caption)}</figcaption>`;

    if (type === 'tablet') {
      return `
        <figure class="sc-tablet sc-device${cls}">
          <div class="sc-tablet-body">
            ${deviceScreen(shot, 'tablet')}
          </div>
          ${caption}
        </figure>`;
    }

    if (type === 'chromebook') {
      return `
        <figure class="sc-chromebook sc-device${cls}">
          <div class="sc-chromebook-lid">
            ${deviceScreen(shot, 'chromebook')}
          </div>
          <div class="sc-chromebook-base" aria-hidden="true"></div>
          ${caption}
        </figure>`;
    }

    return `
      <figure class="sc-phone sc-device${cls}">
        <div class="sc-phone-body">
          ${deviceScreen(shot, 'phone').replace('loading="lazy"', `loading="${loading}"`)}
          <div class="sc-phone-chin" aria-hidden="true"></div>
        </div>
        ${caption}
      </figure>`;
  }

  function phone(shot, opts = {}) {
    return renderShot(shot, { ...opts, type: 'phone' });
  }

  function isSecurity(project) {
    return project.section === 'security';
  }

  function catalogHref(project) {
    return isSecurity(project) ? '../../security/' : '../';
  }

  function catalogLabel(project) {
    return isSecurity(project) ? 'Security' : 'The Classifieds';
  }

  function actions(project) {
    return `
      <div class="btn-row sc-actions">
        <a class="btn btn-primary" href="${escapeHtml(project.url)}" target="_blank" rel="noopener">Open live app</a>
        <a class="btn" href="../../download/">Downloads</a>
        <a class="btn" href="${catalogHref(project)}">Back to ${catalogLabel(project)}</a>
      </div>`;
  }

  function breadcrumb(project) {
    return `
      <p class="breadcrumb">
        <a href="../../index.html">Front Page</a> /
        <a href="${catalogHref(project)}">${catalogLabel(project)}</a> /
        ${escapeHtml(project.name)}
      </p>`;
  }

  function readDetails(project) {
    const paragraphs = project.readDetails.length
      ? project.readDetails
      : [project.description, project.heroLine].filter(Boolean);

    if (!paragraphs.length) return '';

    const bullets = project.highlights?.length
      ? `<ul>${project.highlights.map((h) => `<li>${escapeHtml(h)}</li>`).join('')}</ul>`
      : '';

    return `
      <section class="sc-read-details">
        <div class="section-head">
          <p class="kicker">Read the listing</p>
          <h2>What this app is — and why it exists</h2>
        </div>
        <div class="prose">
          ${paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('')}
          ${bullets}
        </div>
      </section>`;
  }

  function devicePlatforms(project, shotIndex = 0) {
    const platforms = [];

    if (project.screenshots.length && project.platforms.includes('phone')) {
      platforms.push({
        key: 'phone',
        label: 'Google Pixel 6',
        shot: project.screenshots[shotIndex] || project.screenshots[0],
        type: 'phone',
      });
    }
    if (project.screenshotsTablet.length && project.platforms.includes('tablet')) {
      platforms.push({
        key: 'tablet',
        label: 'Galaxy Tab S7',
        shot: project.screenshotsTablet[shotIndex] || project.screenshotsTablet[0],
        type: 'tablet',
      });
    }
    if (project.screenshotsDesktop.length && project.platforms.includes('chromebook')) {
      platforms.push({
        key: 'chromebook',
        label: 'Chromebook / desktop',
        shot: project.screenshotsDesktop[shotIndex] || project.screenshotsDesktop[0],
        type: 'chromebook',
      });
    }

    if (!platforms.length) return '';

    return `
      <section class="sc-platforms">
        <div class="section-head">
          <p class="kicker">Works on your devices</p>
          <h2>Phone, tablet, and Chromebook</h2>
          <p class="sc-platform-note">Captured with <a href="https://www.webmobilefirst.com/en/" target="_blank" rel="noopener">Mobile FIRST</a> device presets — each view matches its screen size.</p>
        </div>
        <div class="sc-device-platforms">
          ${platforms
            .map(
              (p) => `
            <div class="sc-device-platform">
              <h4>${escapeHtml(p.label)}</h4>
              ${renderShot(p.shot, { type: p.type, hideCaption: true, eager: p.key === 'phone' })}
            </div>`
            )
            .join('')}
        </div>
      </section>`;
  }

  function featureRows(project) {
    return project.features
      .map((feature, i) => {
        const shot = project.screenshots[feature.shot ?? i] || project.screenshots[i % project.screenshots.length];
        const flip = i % 2 === 1 ? ' is-flip' : '';
        return `
          <article class="sc-feature-row${flip}">
            <div class="sc-feature-copy">
              <span class="sc-feature-num">${String(i + 1).padStart(2, '0')}</span>
              <h3>${escapeHtml(feature.title || feature)}</h3>
              <p>${escapeHtml(feature.blurb || '')}</p>
            </div>
            <div class="sc-feature-device">${phone(shot, { hideCaption: true })}</div>
          </article>`;
      })
      .join('');
  }

  function gallery(project, title = 'Application screens') {
    if (!project.screenshots.length) return '';
    return `
      <section class="sc-gallery">
        <div class="section-head">
          <p class="kicker">Interface show</p>
          <h2>${escapeHtml(title)}</h2>
        </div>
        <div class="sc-device-rail">
          ${project.screenshots.map((s, i) => phone(s, { eager: i < 2 })).join('')}
        </div>
      </section>`;
  }

  function sisters(project) {
    if (!project.sisters.length) return '';
    return `
      <section class="sc-sisters">
        <p class="kicker">Sister apps in the Verse</p>
        <div class="sc-sister-row">
          ${project.sisters
            .map(
              (slug) => `
            <a class="sc-sister-link" href="./?app=${escapeHtml(slug)}">
              <img src="${escapeHtml(asset(`icons/apps/${slug}.png`))}" width="40" height="40" alt="">
              <span>${escapeHtml(SISTER_NAMES[slug] || slug)}</span>
            </a>`
            )
            .join('')}
        </div>
      </section>`;
  }

  function coverCta() {
    return `
      <div class="cover-cta">
        <p>Want something in this lane built for you?</p>
        <div class="btn-row">
          <a class="btn btn-primary" href="../../request/">Hire Me</a>
          <a class="btn" href="../../support/">Support</a>
        </div>
      </div>`;
  }

  function guardrTabs(project) {
    const defaultRoles = [
      { id: 'guard', title: 'Guard', blurb: 'Browse jobs, clock shifts, get paid direct — independent licensed pros.', shot: 1 },
      { id: 'client', title: 'Client', blurb: 'Post coverage, schedule shifts, hire licensed guards on demand.', shot: 3 },
      { id: 'staff', title: 'Staff', blurb: 'Operations dashboard — dispatch, verify licenses, manage active posts.', shot: 0 },
    ];

    const roles = (project.roles.length >= 3 ? project.roles : defaultRoles).slice(0, 3).map((role, i) => ({
      id: role.id || ['guard', 'client', 'staff'][i],
      title: role.title,
      blurb: role.blurb || '',
      shot: role.shot ?? [1, 3, 0][i],
    }));

    const tabId = `gu-tabs-${project.slug}`;

    return `
      <section class="sc-gu-tabs" id="${tabId}">
        <div class="section-head">
          <p class="kicker">Three doors in</p>
          <h2>Guard · Client · Staff</h2>
        </div>
        <div class="sc-gu-tablist" role="tablist" aria-label="Guardr user roles">
          ${roles
            .map(
              (role, i) => `
            <button
              type="button"
              class="sc-gu-tab"
              role="tab"
              id="${tabId}-tab-${role.id}"
              aria-selected="${i === 0 ? 'true' : 'false'}"
              aria-controls="${tabId}-panel-${role.id}"
              data-tab="${role.id}"
            >${escapeHtml(role.title)}</button>`
            )
            .join('')}
        </div>
        ${roles
          .map((role, i) => {
            const shotIdx = role.shot;
            const phoneShot = project.screenshots[shotIdx] || project.screenshots[0];
            const tabletShot = project.screenshotsTablet[shotIdx] || project.screenshotsTablet[0];
            const desktopShot = project.screenshotsDesktop[shotIdx] || project.screenshotsDesktop[0];
            const deviceShots = [
              phoneShot && renderShot(phoneShot, { hideCaption: true, eager: i === 0, type: 'phone' }),
              tabletShot && renderShot(tabletShot, { hideCaption: true, type: 'tablet' }),
              desktopShot && renderShot(desktopShot, { hideCaption: true, type: 'chromebook' }),
            ].filter(Boolean);
            return `
          <div
            class="sc-gu-tabpanel${i === 0 ? ' is-active' : ''}"
            role="tabpanel"
            id="${tabId}-panel-${role.id}"
            aria-labelledby="${tabId}-tab-${role.id}"
            data-panel="${role.id}"
            ${i === 0 ? '' : 'hidden'}
          >
            <h3>${escapeHtml(role.title)} view</h3>
            <p>${escapeHtml(role.blurb)}</p>
            <div class="sc-gu-tab-devices">${deviceShots.join('')}</div>
          </div>`;
          })
          .join('')}
      </section>`;
  }

  function bindGuardrTabs(root) {
    root.querySelectorAll('.sc-gu-tabs').forEach((section) => {
      const tabs = section.querySelectorAll('.sc-gu-tab');
      const panels = section.querySelectorAll('.sc-gu-tabpanel');
      tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
          const id = tab.dataset.tab;
          tabs.forEach((t) => t.setAttribute('aria-selected', t.dataset.tab === id ? 'true' : 'false'));
          panels.forEach((p) => {
            const active = p.dataset.panel === id;
            p.classList.toggle('is-active', active);
            if (active) p.removeAttribute('hidden');
            else p.setAttribute('hidden', '');
          });
        });
      });
    });
  }

  /* —— Theme renderers —— */

  function renderVerse(project) {
    const shots = project.screenshots;
    return `
      <div class="sc sc-verse">
        ${breadcrumb(project)}
        <section class="sc-verse-hero">
          <div class="sc-verse-copy">
            <p class="sc-kicker">The Verse family · ${escapeHtml(SECTION_LABELS[project.section] || '')}</p>
            <div class="sc-brand-row">
              <img class="sc-logo" src="${escapeHtml(asset(`icons/apps/${project.slug}.png`))}" width="72" height="72" alt="">
              <div>
                <h2 class="sc-name">${escapeHtml(project.name)}</h2>
                <p class="sc-tag">${escapeHtml(project.tagline)}</p>
              </div>
            </div>
            <p class="sc-hero-line">${escapeHtml(project.heroLine || '')}</p>
            <p class="sc-blurb">${escapeHtml(project.description)}</p>
            <p class="ad-status live">● ${escapeHtml(project.statusLabel || 'Active · Free')}</p>
            ${actions(project)}
          </div>
          <div class="sc-verse-cluster" aria-hidden="false">
            ${phone(shots[1] || shots[0], { className: 'is-back', hideCaption: true, eager: true })}
            ${phone(shots[0], { className: 'is-front', hideCaption: true, eager: true })}
            ${phone(shots[2] || shots[0], { className: 'is-side', hideCaption: true, eager: true })}
          </div>
        </section>
        ${readDetails(project)}
        ${devicePlatforms(project, 0)}
        <section class="sc-deep">
          <div class="section-head">
            <p class="kicker">Inside the product</p>
            <h2>Features you'll actually use</h2>
          </div>
          ${featureRows(project)}
        </section>
        ${gallery(project, 'More screens from inside the Verse')}
        ${sisters(project)}
        ${coverCta()}
      </div>`;
  }

  function renderBuyNothing(project) {
    const shots = project.screenshots;
    return `
      <div class="sc sc-buynothing">
        ${breadcrumb(project)}
        <section class="sc-bn-hero">
          <div class="sc-bn-copy">
            <p class="sc-kicker">Community · free on purpose</p>
            <div class="sc-brand-row">
              <img class="sc-logo" src="${escapeHtml(asset(`icons/apps/${project.slug}.png`))}" width="72" height="72" alt="">
              <div>
                <h2 class="sc-name">${escapeHtml(project.name)}</h2>
                <p class="sc-tag">${escapeHtml(project.tagline)}</p>
              </div>
            </div>
            <p class="sc-hero-line">${escapeHtml(project.heroLine || '')}</p>
            <p class="sc-blurb">${escapeHtml(project.description)}</p>
            ${actions(project)}
          </div>
          <div class="sc-bn-phones">
            ${phone(shots[0], { className: 'is-main', eager: true })}
            ${phone(shots[1], { className: 'is-stack', eager: true })}
          </div>
        </section>
        ${readDetails(project)}
        ${devicePlatforms(project, 0)}
        <section class="sc-bn-steps">
          <div class="section-head">
            <p class="kicker">How neighbors use it</p>
            <h2>Three taps to a free pickup</h2>
          </div>
          <ol class="sc-bn-step-grid">
            ${(project.steps.length ? project.steps : project.features)
              .slice(0, 3)
              .map(
                (step, i) => `
              <li>
                <span class="sc-bn-step-num">${i + 1}</span>
                <h3>${escapeHtml(step.title)}</h3>
                <p>${escapeHtml(step.blurb || '')}</p>
                ${phone(shots[i], { hideCaption: true })}
              </li>`
              )
              .join('')}
          </ol>
        </section>
        ${gallery(project, 'More from the board')}
        ${coverCta()}
      </div>`;
  }

  function renderFriendr(project) {
    const shots = project.screenshots;
    return `
      <div class="sc sc-friendr">
        ${breadcrumb(project)}
        <section class="sc-fr-hero">
          <div class="sc-fr-copy">
            <p class="sc-kicker">Free forever · 18+ verified · no ads</p>
            <div class="sc-brand-row">
              <img class="sc-logo" src="${escapeHtml(asset(`icons/apps/${project.slug}.png`))}" width="72" height="72" alt="">
              <div>
                <h2 class="sc-name">${escapeHtml(project.name)}</h2>
                <p class="sc-tag">${escapeHtml(project.tagline)}</p>
              </div>
            </div>
            <p class="sc-hero-line">${escapeHtml(project.heroLine || '')}</p>
            <p class="sc-blurb">${escapeHtml(project.description)}</p>
            ${actions(project)}
          </div>
          <div class="sc-fr-device">${phone(shots[0], { className: 'is-hero', eager: true })}</div>
        </section>
        ${readDetails(project)}
        ${devicePlatforms(project, 0)}
        <section class="sc-fr-layers">
          <div class="section-head">
            <p class="kicker">Connection layers</p>
            <h2>Opt in — never opt you in</h2>
          </div>
          <div class="sc-fr-layer-grid">
            ${(project.layers.length ? project.layers : project.features)
              .map(
                (layer, i) => `
              <article class="sc-fr-layer">
                <span>${String(i + 1).padStart(2, '0')}</span>
                <h3>${escapeHtml(layer.title)}</h3>
                <p>${escapeHtml(layer.blurb || '')}</p>
              </article>`
              )
              .join('')}
          </div>
        </section>
        <section class="sc-deep sc-fr-deep">
          <div class="section-head">
            <p class="kicker">What it looks like</p>
            <h2>From landing to verified</h2>
          </div>
          ${featureRows(project)}
        </section>
        ${gallery(project)}
        ${coverCta()}
      </div>`;
  }

  function renderFindr(project) {
    const shots = project.screenshots;
    return `
      <div class="sc sc-findr">
        ${breadcrumb(project)}
        <section class="sc-fi-hero">
          <div class="sc-fi-copy">
            <p class="sc-kicker">Location · trust circle only</p>
            <div class="sc-brand-row">
              <img class="sc-logo" src="${escapeHtml(asset(`icons/apps/${project.slug}.png`))}" width="72" height="72" alt="">
              <div>
                <h2 class="sc-name">${escapeHtml(project.name)}</h2>
                <p class="sc-tag">${escapeHtml(project.tagline)}</p>
              </div>
            </div>
            <p class="sc-hero-line">${escapeHtml(project.heroLine || '')}</p>
            <p class="sc-blurb">${escapeHtml(project.description)}</p>
            ${actions(project)}
          </div>
          <div class="sc-fi-device">${phone(shots[0], { className: 'is-hero', eager: true })}</div>
        </section>
        ${readDetails(project)}
        ${devicePlatforms(project, 0)}
        <section class="sc-fi-tools">
          <div class="section-head">
            <p class="kicker">Account tools</p>
            <h2>Everything before you open the map</h2>
          </div>
          <div class="sc-fi-tool-grid">
            ${project.features
              .map((f, i) => {
                const shot = shots[f.shot ?? i] || shots[0];
                return `
                <article class="sc-fi-tool">
                  ${phone(shot, { hideCaption: true })}
                  <h3>${escapeHtml(f.title)}</h3>
                  <p>${escapeHtml(f.blurb || '')}</p>
                </article>`;
              })
              .join('')}
          </div>
        </section>
        ${gallery(project, 'Account & setup screens')}
        ${coverCta()}
      </div>`;
  }

  function renderChatr(project) {
    const shots = project.screenshots;
    return `
      <div class="sc sc-chatr">
        ${breadcrumb(project)}
        <section class="sc-ch-hero">
          <div class="sc-ch-copy">
            <p class="sc-kicker">Private bulletin board</p>
            <div class="sc-brand-row">
              <img class="sc-logo" src="${escapeHtml(asset(`icons/apps/${project.slug}.png`))}" width="72" height="72" alt="">
              <div>
                <h2 class="sc-name">${escapeHtml(project.name)}</h2>
                <p class="sc-tag">${escapeHtml(project.tagline)}</p>
              </div>
            </div>
            <p class="sc-hero-line">${escapeHtml(project.heroLine || '')}</p>
            <p class="sc-blurb">${escapeHtml(project.description)}</p>
            ${actions(project)}
          </div>
          <div class="sc-ch-device">${phone(shots[1] || shots[0], { className: 'is-hero', eager: true })}</div>
        </section>
        ${readDetails(project)}
        ${devicePlatforms(project, 1)}
        <section class="sc-ch-notes">
          <div class="section-head">
            <p class="kicker">On the board</p>
            <h2>What you see after you pin your name</h2>
          </div>
          <div class="sc-ch-note-grid">
            ${project.features
              .map((f, i) => {
                const shot = shots[f.shot ?? i] || shots[0];
                return `
                <article class="sc-ch-note">
                  <h3>${escapeHtml(f.title)}</h3>
                  <p>${escapeHtml(f.blurb || '')}</p>
                  ${phone(shot, { hideCaption: true })}
                </article>`;
              })
              .join('')}
          </div>
        </section>
        ${gallery(project, 'Sticky-note screens')}
        ${coverCta()}
      </div>`;
  }

  function renderGuardr(project) {
    const shots = project.screenshots;
    return `
      <div class="sc sc-guardr">
        ${breadcrumb(project)}
        <section class="sc-gu-hero">
          <div class="sc-gu-copy">
            <p class="sc-kicker">Security marketplace</p>
            <div class="sc-brand-row">
              <img class="sc-logo" src="${escapeHtml(asset(`icons/apps/${project.slug}.png`))}" width="72" height="72" alt="">
              <div>
                <h2 class="sc-name">${escapeHtml(project.name)}</h2>
                <p class="sc-tag">${escapeHtml(project.tagline)}</p>
              </div>
            </div>
            <p class="sc-hero-line">${escapeHtml(project.heroLine || '')}</p>
            <p class="sc-blurb">${escapeHtml(project.description)}</p>
            ${actions(project)}
          </div>
          <div class="sc-gu-device">${phone(shots[0], { className: 'is-hero', eager: true })}</div>
        </section>
        ${readDetails(project)}
        ${guardrTabs(project)}
        <section class="sc-deep">
          <div class="section-head">
            <p class="kicker">Product walkthrough</p>
            <h2>From home to account</h2>
          </div>
          ${featureRows(project)}
        </section>
        ${gallery(project)}
        ${coverCta()}
      </div>`;
  }

  function renderSss(project) {
    const shots = project.screenshots;
    return `
      <div class="sc sc-sss">
        ${breadcrumb(project)}
        <section class="sc-sss-hero">
          <div class="sc-sss-copy">
            <p class="sc-kicker">Security company · in development</p>
            <div class="sc-brand-row">
              <img class="sc-logo" src="${escapeHtml(asset(`icons/apps/${project.slug}.png`))}" width="72" height="72" alt="">
              <div>
                <h2 class="sc-name">${escapeHtml(project.name)}</h2>
                <p class="sc-tag">${escapeHtml(project.tagline)}</p>
              </div>
            </div>
            <p class="sc-hero-line">${escapeHtml(project.heroLine || '')}</p>
            <p class="sc-blurb">${escapeHtml(project.description)}</p>
            <p class="ad-status dev">● ${escapeHtml(project.statusLabel || 'In Development')}</p>
            ${actions(project)}
          </div>
          <div class="sc-sss-device">${phone(shots[0], { className: 'is-hero', eager: true })}</div>
        </section>
        ${readDetails(project)}
        ${devicePlatforms(project, 0)}
        <section class="sc-deep sc-sss-deep">
          <div class="section-head">
            <p class="kicker">Company surface</p>
            <h2>Training, ops, and the story</h2>
          </div>
          ${featureRows(project)}
        </section>
        ${gallery(project, 'Site screens')}
        ${coverCta()}
      </div>`;
  }

  function renderDefault(project) {
    return renderVerse({ ...project });
  }

  const RENDERERS = {
    verse: renderVerse,
    buynothing: renderBuyNothing,
    friendr: renderFriendr,
    findr: renderFindr,
    chatr: renderChatr,
    guardr: renderGuardr,
    sss: renderSss,
    default: renderDefault,
  };

  function renderMissing(root, slug) {
    root.innerHTML = `
      <p class="breadcrumb"><a href="../">The Classifieds</a> / Showcase</p>
      <div class="prose">
        <h2>Listing not found</h2>
        <p>No showcase for <code>${escapeHtml(slug || '(missing app)')}</code>.</p>
        <p><a class="btn btn-primary" href="../">Back to The Classifieds</a></p>
      </div>`;
  }

  function render(project) {
    const root = document.getElementById('showcase-root');
    if (!root) return;
    document.title = `${project.name} Showcase — The Markk Brandon Collective`;
    const titleEl = document.getElementById('showcase-title');
    const tagEl = document.getElementById('showcase-tagline');
    const editionEl = document.getElementById('showcase-edition');
    if (titleEl) titleEl.textContent = project.name;
    if (tagEl) tagEl.textContent = project.heroLine || project.tagline || 'Screenshots & features';
    if (editionEl) editionEl.textContent = project.name;
    document.body.dataset.showcaseTheme = project.theme;
    document.querySelectorAll('.nav-links a').forEach((a) => a.classList.remove('active'));
    const navHref = isSecurity(project) ? '../../security/' : '../';
    const navMatch = document.querySelector(`.nav-links a[href="${navHref}"]`);
    if (navMatch) navMatch.classList.add('active');
    const renderer = RENDERERS[project.theme] || RENDERERS.default;
    root.innerHTML = renderer(project);
    bindGuardrTabs(root);
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
      render(normalize(match));
    } catch (err) {
      root.innerHTML = `
        <p class="breadcrumb"><a href="../">The Classifieds</a> / Showcase</p>
        <div class="prose">
          <h2>Couldn't load showcase</h2>
          <p>${escapeHtml(err.message || err)}</p>
          <p><a class="btn btn-primary" href="../">Back to The Classifieds</a></p>
        </div>`;
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
