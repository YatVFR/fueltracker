const CACHE_NAME = 'astinafuel-offline-v12';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  '../dashboard-upgrade.css',
  '../dashboard-upgrade.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('message', event => {
  if(event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function decorateHtmlResponse(response){
  if(!response) return response;
  const html = await response.text();
  let upgraded = html;
  if(!upgraded.includes('dashboard-upgrade.css')){
    upgraded = upgraded.replace('</head>', '<link rel="stylesheet" href="../dashboard-upgrade.css">\n</head>');
  }
  if(!upgraded.includes('dashboard-upgrade.js')){
    upgraded = upgraded.replace('</body>', '<script src="../dashboard-upgrade.js"></script>\n</body>');
  }
  const headers = new Headers(response.headers);
  headers.set('Content-Type', 'text/html; charset=utf-8');
  return new Response(upgraded, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET') return;

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

  if(request.mode === 'navigate'){
    event.respondWith((async () => {
      try{
        const network = await fetch(request, {cache:'no-store'});
        if(network && network.ok){
          const copy = network.clone();
          const cache = await caches.open(CACHE_NAME);
          await cache.put('./index.html', copy);
          return decorateHtmlResponse(network);
        }
      }catch(error){
        // Offline: use the cached app shell below.
      }
      const cached = await caches.match('./index.html');
      return cached ? decorateHtmlResponse(cached) : new Response('Fuel Tracker is unavailable offline until it has been opened once.', {status:503});
    })());
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if(cached) return cached;
      return fetch(request).then(response => {
        if(response && response.ok){
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
