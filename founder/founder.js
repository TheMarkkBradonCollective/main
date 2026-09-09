(function () {
  const PIN = 'founder';
  const PIN_KEY = 'mbc-founder-ok';
  const METRICS_URL = '../founder-metrics.json';
  const SEARCH_URL = '../founder-search-index.json';

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
  let activeTypeFilter = 'all';
  let metrics = null;
  let searchIndex = null;
  let searchQuery = '';
  let searchTimer = null;
  let searchReady = false;

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

  function tokenize(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/[^a-z0-9@.+#-]+/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 1);
  }

  function uniqueTokens(text) {
    return [...new Set(tokenize(text))];
  }

  function highlightSnippet(text, terms) {
    const raw = String(text || '').trim();
    if (!raw) return '';
    const lower = raw.toLowerCase();
    let start = 0;
    for (const term of terms) {
      const idx = lower.indexOf(term);
      if (idx >= 0) {
        start = Math.max(0, idx - 60);
        break;
      }
    }
    let snippet = raw.slice(start, start + 220);
    if (start > 0) snippet = `…${snippet}`;
    if (start + 220 < raw.length) snippet = `${snippet}…`;

    let html = escapeHtml(snippet);
    for (const term of terms) {
      if (term.length < 2) continue;
      const re = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      html = html.replace(re, '<mark>$1</mark>');
    }
    return html;
  }

  function scoreDocument(doc, terms) {
    if (!terms.length) return 0;
    const title = String(doc.title || '').toLowerCase();
    const body = String(doc.body || '').toLowerCase();
    const tags = (doc.tags || []).join(' ').toLowerCase();
    const appName = String(doc.appName || '').toLowerCase();
    let score = 0;

    for (const term of terms) {
      if (title.includes(term)) score += 12;
      if (appName.includes(term)) score += 8;
      if (tags.includes(term)) score += 5;
      if (body.includes(term)) score += 3;
      if (title.startsWith(term)) score += 4;
    }
    return score;
  }

  function searchDocuments(query, typeFilter = 'all') {
    if (!searchIndex?.documents?.length || !query.trim()) return [];
    const terms = uniqueTokens(query);
    if (!terms.length) return [];

    return searchIndex.documents
      .map((doc) => ({ doc, score: scoreDocument(doc, terms) }))
      .filter((row) => row.score > 0)
      .filter((row) => typeFilter === 'all' || row.doc.type === typeFilter)
      .sort((a, b) => b.score - a.score)
      .slice(0, 80)
      .map((row) => row.doc);
  }

  function renderTypeFilters() {
    const el = $('#founder-type-filters');
    if (!el || !searchIndex) return;

    const counts = {};
    const terms = uniqueTokens(searchQuery);
    const baseResults = searchIndex.documents
      .map((doc) => ({ doc, score: scoreDocument(doc, terms) }))
      .filter((row) => row.score > 0);

    for (const row of baseResults) {
      counts[row.doc.type] = (counts[row.doc.type] || 0) + 1;
    }

    const types = [
      ['all', `All (${baseResults.length})`],
      ...Object.entries(searchIndex.typeLabels || {}).map(([key, label]) => [
        key,
        `${label} (${counts[key] || 0})`,
      ]),
    ];

    el.innerHTML = types
      .filter(([, label]) => !label.endsWith('(0)') || label.startsWith('All'))
      .map(
        ([key, label]) =>
          `<button type="button" class="founder-type-filter${activeTypeFilter === key ? ' active' : ''}" data-type="${escapeHtml(key)}">${escapeHtml(label)}</button>`
      )
      .join('');

    el.querySelectorAll('[data-type]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeTypeFilter = btn.dataset.type;
        renderTypeFilters();
        renderSearchResults();
      });
    });
  }

  function renderSearchResults() {
    const panel = $('#founder-search-results');
    const browse = $('#founder-browse');
    const summary = $('#founder-summary');
    const typeFilters = $('#founder-type-filters');
    const clearBtn = $('#founder-search-clear');
    const q = searchQuery.trim();

    if (!panel) return;

    if (!q) {
      panel.hidden = true;
      if (typeFilters) typeFilters.hidden = true;
      if (clearBtn) clearBtn.hidden = true;
      if (browse) browse.classList.remove('founder-browse-hidden');
      if (summary) summary.classList.remove('founder-browse-hidden');
      return;
    }

    if (clearBtn) clearBtn.hidden = false;
    if (typeFilters) typeFilters.hidden = false;
    if (browse) browse.classList.add('founder-browse-hidden');
    if (summary) summary.classList.add('founder-browse-hidden');
    panel.hidden = false;

    const results = searchDocuments(q, activeTypeFilter);
    const terms = uniqueTokens(q);

    if (!results.length) {
      panel.innerHTML = `<p class="founder-search-meta">No matches for “${escapeHtml(q)}”</p><p class="founder-empty">Try a different keyword — app name, feature, cert, APK package, or page content.</p>`;
      return;
    }

    panel.innerHTML = `
      <p class="founder-search-meta">${results.length} result${results.length === 1 ? '' : 's'} for “${escapeHtml(q)}”${activeTypeFilter !== 'all' ? ` · ${escapeHtml(searchIndex.typeLabels?.[activeTypeFilter] || activeTypeFilter)}` : ''}</p>
      <div class="founder-result-list">
        ${results
          .map((doc) => {
            const href = doc.url || (doc.app ? `../apps/showcase/?app=${doc.app}` : null);
            const title = href
              ? `<a href="${escapeHtml(href)}"${href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${escapeHtml(doc.title)}</a>`
              : escapeHtml(doc.title);
            return `
              <article class="founder-result">
                <div class="founder-result-head">
                  <h3 class="founder-result-title">${title}</h3>
                  <span class="founder-badge">${escapeHtml(doc.typeLabel || doc.type)}</span>
                  ${doc.appName ? `<span class="founder-badge">${escapeHtml(doc.appName)}</span>` : ''}
                </div>
                <p class="founder-result-snippet">${highlightSnippet(doc.body, terms)}</p>
                <div class="founder-result-foot">
                  ${doc.source ? `<span>${escapeHtml(doc.source)}</span>` : ''}
                  ${doc.section ? `<span>${escapeHtml(doc.section)}</span>` : ''}
                </div>
              </article>`;
          })
          .join('')}
      </div>`;
  }

  function setSearchQuery(value) {
    searchQuery = value;
    const input = $('#founder-search-input');
    if (input && input.value !== value) input.value = value;
    activeTypeFilter = 'all';
    renderTypeFilters();
    renderSearchResults();
  }

  function initSearch() {
    if (searchReady) return;
    const form = $('#founder-search-form');
    const input = $('#founder-search-input');
    const clearBtn = $('#founder-search-clear');
    if (!form || !input) return;
    searchReady = true;

    input.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => setSearchQuery(input.value), 120);
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      setSearchQuery(input.value);
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        input.value = '';
        setSearchQuery('');
        input.focus();
      });
    }

    document.addEventListener('keydown', (e) => {
      const tag = (e.target && e.target.tagName) || '';
      if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(tag)) {
        e.preventDefault();
        input.focus();
      }
      if (e.key === 'Escape' && document.activeElement === input && searchQuery) {
        input.value = '';
        setSearchQuery('');
      }
    });
  }

  async function loadSearchIndex() {
    try {
      const res = await fetch(SEARCH_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      searchIndex = await res.json();
    } catch {
      searchIndex = { documents: [], typeLabels: {} };
    }
  }

  async function loadMetrics() {
    const loading = $('#founder-loading');
    const app = $('#founder-app');
    if (loading) loading.classList.remove('founder-hidden');
    if (app) app.classList.add('founder-hidden');

    try {
      const [metricsRes] = await Promise.all([
        fetch(METRICS_URL, { cache: 'no-store' }),
        loadSearchIndex(),
      ]);
      if (!metricsRes.ok) throw new Error(`HTTP ${metricsRes.status}`);
      metrics = await metricsRes.json();
      renderSummary(metrics.summary, metrics.generatedAt, metrics.githubTokenUsed);
      renderFilters(metrics.sectionLabels, metrics.apps);
      renderCards(metrics.apps);
      initSearch();
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
      refresh.addEventListener('click', async () => {
        await loadSearchIndex();
        await loadMetrics();
      });
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
