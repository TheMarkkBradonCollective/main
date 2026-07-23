const CACHE_NAME = 'mbc-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/news.html',
  '/apps/',
  '/apps/index.html',
  '/apps/cookbook.html',
  '/apps/friendr.html',
  '/apps/guardr.html',
  '/apps/sacramento-buy-nothing.html',
  '/apps/signature-security.html',
  '/apps/spiritsverse.html',
  '/apps/strainverse.html',
  '/servers/',
  '/servers/index.html',
  '/servers/co-op-metaverse.html',
  '/servers/mis-development.html',
  '/servers/racen-rollenspel.html',
  '/features/',
  '/features/index.html',
  '/features/photography.html',
  '/features/comics.html',
  '/features/crossword.html',
  '/features/wordsearch.html',
  '/css/style.css',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/icons/favicon-32.png',
  '/js/pwa.js',
  '/js/puzzle-data.js',
  '/js/crossword.js',
  '/js/wordsearch.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});
