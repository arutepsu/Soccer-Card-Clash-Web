const CACHE_NAME = 'soccer-card-clash-cache-v1';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', event => {
  console.log('[SW] Install event, caching offline page:', OFFLINE_URL);
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      try {
        // offline.html cachen
        const response = await fetch(OFFLINE_URL, {cache: 'reload'});
        if (!response.ok) throw new Error('Offline page not found: ' + OFFLINE_URL);
        await cache.put(OFFLINE_URL, response);

      } catch (err) {

      }
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Activate event');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;


  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.ok) return response;
          return caches.match(OFFLINE_URL);
        })
        .catch(err => {
          console.warn('Network failed, show offline.html:', err);
          return caches.match(OFFLINE_URL).then(response => {
            if (response) return response;
            return new Response('<h1>Offline</h1><p>Die Seite ist nicht verfügbar.</p>', {
              headers: {'Content-Type': 'text/html'}
            });
          });
        })
    );
    return;
  }

  event.respondWith(
    fetch(event.request).catch(err => {
      console.warn('GET failed:', event.request.url, err);
      return caches.match(event.request).then(response => {
        return response || caches.match(OFFLINE_URL);
      });
    })
  );
});
