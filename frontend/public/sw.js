const CACHE_NAME = 'soccer-card-clash-v1';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    // Cache offline + the SPA shell route
    await cache.addAll([OFFLINE_URL, '/']);
  })());

  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // cleanup old caches (optional but good)
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const req = event.request;

  // 1) Navigations: network-first, fallback offline
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        // keep latest shell cached
        cache.put('/', fresh.clone());
        return fresh;
      } catch {
        const cached = await caches.match('/');
        return cached || (await caches.match(OFFLINE_URL));
      }
    })());
    return;
  }

  // 2) Assets: cache-first, then network, and store for next time
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;

    try {
      const res = await fetch(req);
      // only cache successful basic/same-origin responses
      if (res && res.ok && res.type === 'basic') {
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, res.clone());
      }
      return res;
    } catch {
      // if offline and asset missing, just fail gracefully
      return new Response('', { status: 504 });
    }
  })());
});