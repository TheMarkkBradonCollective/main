/* MBC Store founder/admin pages: login form + read-only dashboard. */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---- Login page ----
  const form = $('adm-login-form');
  if (form) {
    const msg = $('adm-msg');
    const q = new URLSearchParams(location.search);
    if (q.get('error')) { msg.textContent = 'Wrong email or password.'; msg.className = 'adm-msg err'; }
    if (q.get('signedout')) { msg.textContent = 'You are signed out.'; msg.className = 'adm-msg ok'; }
    fetch('/api/admin/me', { credentials: 'same-origin' }).then((r) => { if (r.ok) location.replace('/admin/'); }).catch(() => {});
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = $('adm-submit');
      btn.disabled = true; msg.textContent = 'Signing in…'; msg.className = 'adm-msg';
      try {
        const r = await fetch('/api/admin/login', {
          method: 'POST', credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: $('adm-email').value, password: $('adm-password').value }),
        });
        const j = await r.json().catch(() => ({}));
        if (r.ok && j.ok) { location.replace(j.redirect || '/admin/'); return; }
        msg.textContent = j.error || 'Sign-in failed.'; msg.className = 'adm-msg err';
        $('adm-password').value = '';
      } catch (_) {
        msg.textContent = 'Network error. Try again.'; msg.className = 'adm-msg err';
      }
      btn.disabled = false;
    });
    return;
  }

  // ---- Dashboard ----
  if (!$('adm-dashboard')) return;
  const fmtSize = (n) => (n ? (n / 1048576).toFixed(1) + ' MB' : '—');
  let apps = [];

  async function init() {
    const me = await fetch('/api/admin/me', { credentials: 'same-origin' });
    if (!me.ok) { location.replace('/admin/login/'); return; }
    const who = await me.json();
    $('adm-email-out').textContent = who.email;
    $('adm-role').textContent = who.role === 'founder' ? 'Founder' : (who.role || 'Admin');

    const cat = await fetch('/apk-catalog.json', { cache: 'no-store' }).then((r) => r.json());
    apps = cat.apps || [];
    const withApk = apps.filter((a) => a.android && a.android.downloadUrl);
    const statuses = {};
    apps.forEach((a) => { const s = (a.android && a.android.status) || 'none'; statuses[s] = (statuses[s] || 0) + 1; });
    $('adm-stats').innerHTML = [
      ['Apps listed', apps.length],
      ['Android downloads', withApk.length],
      ['Coming soon', statuses['coming-soon'] || statuses['coming_soon'] || 0],
      ['Store app', cat.storeApp ? 'v' + cat.storeApp.version : '—'],
    ].map(([k, v]) => `<div class="adm-stat"><b>${esc(v)}</b><span>${esc(k)}</span></div>`).join('');
    $('adm-rows').innerHTML = apps.map((a) => {
      const an = a.android || {};
      const st = an.status || (a.webUrl ? 'web' : 'none');
      const cls = st === 'available' ? 'good' : '';
      const options = [
        ['available', 'Available'],
        ['request-to-download', 'Request to Download'],
        ['coming-soon', 'Coming soon'],
        ['web-only', 'Web only'],
      ];
      return `<tr data-slug="${esc(a.slug)}">
        <td class="app"><img src="/${esc(a.icon || 'icons/icon-192.png')}" alt="" loading="lazy">${esc(a.name)}</td>
        <td>${esc(a.category || '')}</td>
        <td><span class="pill ${cls}">${esc(st)}</span></td>
        <td>${esc(an.version || '—')}</td>
        <td>${esc(an.updatedAt || '—')}</td>
        <td>${esc(fmtSize(an.fileSize))}</td>
        <td class="dl">${an.downloadUrl ? `<a href="${esc(an.downloadUrl)}" rel="noopener">APK</a> <span class="pill">not checked</span>` : '—'}</td>
        <td class="availability">
          <label class="sr-only" for="status-${esc(a.slug)}">Availability for ${esc(a.name)}</label>
          <select id="status-${esc(a.slug)}" class="adm-status" data-status>${options.map(([v, label]) => `<option value="${v}" ${st === v ? 'selected' : ''}>${label}</option>`).join('')}</select>
          <button class="adm-btn small" type="button" data-save-status>Save</button>
          <span class="adm-status-msg" role="status" aria-live="polite"></span>
        </td>
      </tr>`;
    }).join('');
    $('adm-foot').textContent = `Catalog generated ${cat.generatedAt || 'unknown'} · Founder controls enabled`;
    $('adm-rows').querySelectorAll('[data-save-status]').forEach((button) => {
      button.addEventListener('click', async () => {
        const row = button.closest('tr');
        const select = row.querySelector('[data-status]');
        const msg = row.querySelector('.adm-status-msg');
        button.disabled = true; msg.textContent = 'Saving…';
        try {
          const r = await fetch('/api/admin/set-app-status', {
            method: 'POST', credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug: row.dataset.slug, status: select.value }),
          });
          const result = await r.json().catch(() => ({}));
          if (r.status === 401) { location.replace('/admin/login/'); return; }
          if (!r.ok) throw new Error(result.error || 'Could not save status.');
          const app = apps.find((item) => item.slug === row.dataset.slug);
          if (app) { app.android = app.android || {}; app.android.status = select.value; }
          row.querySelector('.pill').textContent = select.value;
          row.querySelector('.pill').className = 'pill ' + (select.value === 'available' ? 'good' : '');
          msg.textContent = 'Saved';
        } catch (err) {
          msg.textContent = err.message || 'Save failed';
        } finally { button.disabled = false; }
      });
    });
  }

  async function checkLinks() {
    const btn = $('adm-check');
    btn.disabled = true; btn.textContent = 'Checking…';
    const slugs = apps.filter((a) => a.android && a.android.downloadUrl).map((a) => a.slug);
    let ok = 0, bad = 0;
    for (let i = 0; i < slugs.length; i += 20) {
      const r = await fetch('/api/admin/download-status?slugs=' + encodeURIComponent(slugs.slice(i, i + 20).join(',')), { credentials: 'same-origin' });
      if (r.status === 401) { location.replace('/admin/login/'); return; }
      const j = await r.json();
      (j.results || []).forEach((x) => {
        const cell = document.querySelector(`tr[data-slug="${CSS.escape(x.slug)}"] td.dl .pill`);
        const good = x.status === 200;
        good ? ok++ : bad++;
        if (cell) { cell.textContent = x.status ? String(x.status) : 'error'; cell.className = 'pill ' + (good ? 'good' : 'bad'); }
      });
    }
    btn.disabled = false; btn.textContent = `Checked: ${ok} OK, ${bad} failing`;
  }

  $('adm-check').addEventListener('click', checkLinks);
  init().catch(() => { $('adm-rows').innerHTML = '<tr><td colspan="7">Could not load the catalog.</td></tr>'; });
})();
