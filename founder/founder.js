(function () {
  const PIN = 'founder';
  const PIN_KEY = 'mbc-founder-ok';
  const METRICS_URL = '../founder-metrics.json';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function unlocked() {
    try {
      return sessionStorage.getItem(PIN_KEY) === '1';
    } catch {
      return false;
    }
  }

  function formatDate(iso) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  }

  function healthLabel(health) {
    const map = {
      healthy: 'Healthy',
      partial: 'Partial',
      'version-only': 'Version only',
      down: 'Down',
      unknown: 'Unknown',
    };
    return map[health] || health || 'Unknown';
  }

  function iconForApp(slug) {
    if (slug === 'mbc-site' || slug === 'mbc-store') {
      return '../icons/logo.png';
    }
    return `../icons/apps/${slug}.png`;
  }

  let activeFilter = 'all';
  let metrics = null;

  function renderSummary(summary, generatedAt, githubTokenUsed) {
    const el = $('#founder-summary');
    if (!el || !summary) return;
    el.innerHTML = `
      <article class="founder-stat">
        <p>Portfolio</p>
        <strong>${summary.total}</strong>
        <span>${summary.live} live</span>
      </article>
      <article class="founder-stat">
        <p>Healthy</p>
        <strong>${summary.healthy}</strong>
        <span>version + site OK</span>
      </article>
      <article class="founder-stat">
        <p>Android APKs</p>
        <strong>${summary.apkAvailable}</strong>
        <span>installable builds</span>
      </article>
      <article class="founder-stat">
        <p>Admin portals</p>
        <strong>${summary.withAdmin}</strong>
        <span>staff / ops links</span>
      </article>
      <article class="founder-stat">
        <p>Last sync</p>
        <strong style="font-size:1rem;line-height:1.3">${escapeHtml(formatDate(generatedAt))}</strong>
        <span>${githubTokenUsed ? 'GitHub stats on' : 'GitHub stats off'}</span>
      </article>`;
  }

  function renderFilters(sectionLabels, apps) {
    const el = $('#founder-filters');
    if (!el) return;

    const counts = {};
    for (const app of apps) {
      counts[app.section] = (counts[app.section] || 0) + 1;
    }

    const sections = [
      ['all', `All (${apps.length})`],
      ...Object.entries(sectionLabels || {}).map(([key, label]) => [
        key,
        `${label} (${counts[key] || 0})`,
      ]),
    ];

    el.innerHTML = sections
      .filter(([, label]) => !label.endsWith('(0)'))
      .map(
        ([key, label]) =>
          `<button type="button" class="founder-filter${activeFilter === key ? ' active' : ''}" data-filter="${escapeHtml(key)}">${escapeHtml(label)}</button>`
      )
      .join('');

    el.querySelectorAll('[data-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeFilter = btn.dataset.filter;
        renderFilters(sectionLabels, apps);
        renderCards(apps);
      });
    });
  }

  function renderCard(app) {
    const health = app.health?.health || 'unknown';
    const apkStatus = app.apk?.status || 'unknown';
    const apkVersion = app.apk?.version || '—';
    const webVersion = app.health?.version || '—';
    const pushed = app.githubStats?.pushedAt
      ? formatDate(app.githubStats.pushedAt)
      : '—';
    const openIssues =
      app.githubStats?.openIssues != null ? String(app.githubStats.openIssues) : '—';

    const links = [];
    if (app.url) {
      links.push(`<a href="${escapeHtml(app.url)}" target="_blank" rel="noopener">Live site</a>`);
    }
    if (app.showcaseUrl) {
      links.push(`<a href="${escapeHtml(app.showcaseUrl)}">Showcase</a>`);
    }
    if (app.github) {
      links.push(`<a href="${escapeHtml(app.github)}" target="_blank" rel="noopener">GitHub</a>`);
    }
    if (app.admin?.url) {
      links.push(
        `<a class="admin-link" href="${escapeHtml(app.admin.url)}" target="_blank" rel="noopener">${escapeHtml(app.admin.label)}</a>`
      );
    }

    const roles = app.roles?.length
      ? `<p class="founder-roles">Roles: ${escapeHtml(app.roles.join(' · '))}</p>`
      : '';

    return `
      <article class="founder-card" data-section="${escapeHtml(app.section)}">
        <div class="founder-card-head">
          <img class="founder-card-icon" src="${escapeHtml(iconForApp(app.slug))}" width="44" height="44" alt="" loading="lazy">
          <div>
            <h3 class="founder-card-title">${escapeHtml(app.name)}</h3>
            <p class="founder-card-tagline">${escapeHtml(app.tagline || '')}</p>
          </div>
        </div>
        <div class="founder-badges">
          <span class="founder-badge health-${escapeHtml(health)}">${escapeHtml(healthLabel(health))}</span>
          <span class="founder-badge status-${escapeHtml(app.status)}">${escapeHtml(app.statusLabel || app.status)}</span>
          <span class="founder-badge">${escapeHtml(app.sectionLabel || app.section)}</span>
          ${app.internal ? '<span class="founder-badge">Internal</span>' : ''}
        </div>
        <dl class="founder-meta-grid">
          <dt>Web version</dt><dd>${escapeHtml(webVersion)}</dd>
          <dt>APK</dt><dd>${escapeHtml(apkStatus)}${apkVersion !== '—' ? ` · v${escapeHtml(apkVersion)}` : ''}</dd>
          <dt>Last deploy</dt><dd>${escapeHtml(formatDate(app.health?.updatedAt))}</dd>
          <dt>GitHub push</dt><dd>${escapeHtml(pushed)}</dd>
          <dt>Open issues</dt><dd>${escapeHtml(openIssues)}</dd>
          <dt>Repo</dt><dd>${escapeHtml(app.githubStats?.visibility || (app.githubPrivate ? 'private' : app.github ? 'public' : '—'))}</dd>
        </dl>
        ${roles}
        <div class="founder-links">${links.join('')}</div>
      </article>`;
  }

  function renderCards(apps) {
    const el = $('#founder-grid');
    if (!el) return;

    const filtered =
      activeFilter === 'all' ? apps : apps.filter((a) => a.section === activeFilter);

    if (!filtered.length) {
      el.innerHTML = '<p class="founder-empty">No apps in this section.</p>';
      return;
    }

    el.innerHTML = filtered.map(renderCard).join('');
  }

  async function loadMetrics() {
    const loading = $('#founder-loading');
    const app = $('#founder-app');
    if (loading) loading.classList.remove('founder-hidden');
    if (app) app.classList.add('founder-hidden');

    try {
      const res = await fetch(METRICS_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      metrics = await res.json();
      renderSummary(metrics.summary, metrics.generatedAt, metrics.githubTokenUsed);
      renderFilters(metrics.sectionLabels, metrics.apps);
      renderCards(metrics.apps);
      if (loading) loading.classList.add('founder-hidden');
      if (app) app.classList.remove('founder-hidden');
    } catch (err) {
      if (loading) {
        loading.innerHTML = `<p>Could not load founder metrics. Run <code>npm run sync-founder-bridge</code> on the main repo, then refresh.</p><p class="founder-card-tagline">${escapeHtml(err.message)}</p>`;
      }
    }
  }

  function showGate(show) {
    const gate = $('#founder-gate');
    const app = $('#founder-app');
    if (gate) gate.classList.toggle('founder-hidden', !show);
    if (app) app.classList.toggle('founder-hidden', show);
  }

  function initGate() {
    const form = $('#founder-pin-form');
    const err = $('#founder-pin-error');
    if (!form) return;

    if (unlocked()) {
      showGate(false);
      loadMetrics();
      return;
    }

    showGate(true);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const pin = new FormData(form).get('pin');
      if (pin === PIN) {
        try {
          sessionStorage.setItem(PIN_KEY, '1');
        } catch {
          /* continue */
        }
        if (err) err.hidden = true;
        showGate(false);
        loadMetrics();
      } else if (err) {
        err.hidden = false;
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initGate();
    const refresh = $('#founder-refresh');
    if (refresh) {
      refresh.addEventListener('click', () => loadMetrics());
    }
    const lock = $('#founder-lock');
    if (lock) {
      lock.addEventListener('click', () => {
        try {
          sessionStorage.removeItem(PIN_KEY);
        } catch {
          /* ignore */
        }
        showGate(true);
      });
    }
  });
})();
