const CACHE_NAME = 'astinafuel-offline-v11';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('message', event => {
  if(event.data && event.data.type === 'SKIP_WAITING'){
    self.skipWaiting();
  }
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET') return;

  // health-check-network-only:
  // A ?health= request intentionally bypasses the PWA cache so the UI
  // can tell whether the local iSH Python server is actually running.
  const healthURL = new URL(event.request.url);
  if(healthURL.searchParams.has('health')){
    event.respondWith(
      fetch(event.request, {cache:'no-store'}).catch(() =>
        new Response('', {status:503, statusText:'Local server offline'})
      )
    );
    return;
  }

  const request = event.request;

  // Navigation always falls back to the cached app shell.
  if(request.mode === 'navigate'){
    event.respondWith(
      caches.match('./index.html').then(cached => {
        if(cached) return cached;

        return fetch(request).then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy));
          return response;
        });
      })
    );
    return;
  }

  // Static assets are cache-first.
  event.respondWith(
    caches.match(request).then(cached => {
      if(cached) return cached;

      return fetch(request).then(response => {
        if(response && response.ok){
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
