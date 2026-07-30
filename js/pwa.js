(function () {
  const VERSION_FALLBACK = '1.2.0';

  function showSplashVersion(version) {
    const el = document.getElementById('mbc-splash-version');
    if (el) el.textContent = 'MBC v' + version;
  }

  function hideSplash() {
    const splash = document.getElementById('mbc-splash');
    if (!splash) return;
    splash.classList.add('is-done');
    window.setTimeout(() => splash.remove(), 420);
  }

  function showUpdateChip(message) {
    let chip = document.getElementById('mbc-update-chip');
    if (!chip) {
      chip = document.createElement('div');
      chip.id = 'mbc-update-chip';
      chip.className = 'mbc-update-chip';
      document.body.appendChild(chip);
    }
    chip.textContent = message;
    chip.hidden = false;
  }

  function hideUpdateChip() {
    const chip = document.getElementById('mbc-update-chip');
    if (chip) chip.hidden = true;
  }

  // Version stamp on splash + auto-hide after first paint
  fetch('/version.json', { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      showSplashVersion((data && data.version) || VERSION_FALLBACK);
    })
    .catch(() => showSplashVersion(VERSION_FALLBACK))
    .finally(() => {
      window.requestAnimationFrame(() => {
        window.setTimeout(hideSplash, 650);
      });
    });

  // Soft auto-refresh: revalidate when tab becomes visible
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg) void reg.update();
    });
  });

  if (!('serviceWorker' in navigator)) return;

  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    showUpdateChip('Updating MBC…');
    window.setTimeout(() => window.location.reload(), 400);
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        reg.addEventListener('updatefound', () => {
          const worker = reg.installing;
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdateChip('Updating MBC…');
              worker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
        // Periodic update checks while the PWA / TWA is open
        window.setInterval(() => void reg.update(), 5 * 60 * 1000);
      })
      .catch(() => {
        hideUpdateChip();
      });
  });
})();
