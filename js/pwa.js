(function () {
  const VERSION_FALLBACK = '1.5.7';
  const VERSION_KEY = 'mbc_seen_version';
  const VERSION_POLL_MS = 60 * 1000;
  const SW_POLL_MS = 60 * 1000;

  const SCRIPT = document.currentScript;
  const ROOT = SCRIPT ? new URL('../', SCRIPT.src) : new URL('./', window.location.href);

  function asset(path) {
    return new URL(path.replace(/^\//, ''), ROOT).href;
  }

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

  let reloading = false;

  function reloadForUpdate(message) {
    if (reloading) return;
    reloading = true;
    showUpdateChip(message || 'Updating MBC…');
    window.setTimeout(() => window.location.reload(), 300);
  }

  async function fetchLiveVersion() {
    const res = await fetch(asset('version.json'), { cache: 'no-store' });
    if (!res.ok) throw new Error('version fetch failed');
    const data = await res.json();
    return data && data.version ? String(data.version) : VERSION_FALLBACK;
  }

  async function checkDeployVersion() {
    try {
      const remote = await fetchLiveVersion();
      let seen = null;
      try {
        seen = localStorage.getItem(VERSION_KEY);
      } catch {
        /* ignore */
      }

      if (seen && seen !== remote) {
        try {
          localStorage.setItem(VERSION_KEY, remote);
        } catch {
          /* ignore */
        }
        reloadForUpdate('New edition — refreshing…');
        return remote;
      }

      if (!seen) {
        try {
          localStorage.setItem(VERSION_KEY, remote);
        } catch {
          /* ignore */
        }
      }

      return remote;
    } catch {
      return VERSION_FALLBACK;
    }
  }

  fetchLiveVersion()
    .then((version) => showSplashVersion(version))
    .catch(() => showSplashVersion(VERSION_FALLBACK))
    .finally(() => {
      window.requestAnimationFrame(() => {
        window.setTimeout(hideSplash, 650);
      });
    });

  checkDeployVersion();
  window.setInterval(() => void checkDeployVersion(), VERSION_POLL_MS);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    void checkDeployVersion();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) void reg.update();
      });
    }
  });

  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    reloadForUpdate('Updating MBC…');
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(asset('sw.js'), { scope: ROOT.href })
      .then((reg) => {
        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        reg.addEventListener('updatefound', () => {
          const worker = reg.installing;
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              worker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });

        window.setInterval(() => void reg.update(), SW_POLL_MS);
      })
      .catch(() => {
        hideUpdateChip();
      });
  });
})();
