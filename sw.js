const CACHE_NAME = 'mbc-v1-5-7';

const PRECACHE_URLS = [
  './',
  './index.html',
  './about/',
  './about/index.html',
  './apps/',
  './apps/index.html',
  './support/',
  './support/index.html',
  './request/',
  './request/index.html',
  './download/',
  './download/index.html',
  './apk-catalog.json',
  './css/style.css',
  './manifest.webmanifest',
  './version.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
  './icons/logo.png',
  './icons/wordmark.png',
  './icons/apps/buynothing.png',
  './icons/apps/strainverse.png',
  './icons/apps/spiritsverse.png',
  './icons/apps/cookverse.png',
  './icons/apps/friendr.png',
  './icons/apps/findr.png',
  './icons/apps/chatr.png',
  './icons/apps/guardr.png',
  './icons/apps/sss.png',
  './js/pwa.js',
  './js/timeline.js',
  './js/downloads.js',
  './js/version.js',
];

function isNetworkFirst(url) {
  const path = url.pathname;
  if (path.endsWith('/sw.js') || path.endsWith('/version.json')) return true;
  if (path.endsWith('.html') || path.endsWith('/') || !/\.[a-z0-9]+$/i.test(path)) return true;
  if (/\.(css|js|json)$/i.test(path)) return true;
  if (path.includes('/images/')) return true;
  return false;
}

function cachePut(request, response) {
  if (response && response.status === 200 && response.type === 'basic') {
    const copy = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
  }
}

function networkFirst(request) {
  return fetch(request)
    .then((response) => {
      cachePut(request, response);
      return response;
    })
    .catch(() => caches.match(request));
}

function staleWhileRevalidate(request) {
  return caches.match(request).then((cached) => {
    const networkFetch = fetch(request)
      .then((response) => {
        cachePut(request, response);
        return response;
      })
      .catch(() => cached);

    return cached || networkFetch;
  });
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (isNetworkFirst(url)) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(staleWhileRevalidate(event.request));
});
