const CACHE_NAME='fueltracker-v15-4-volume-3dp-2';
const APP_SHELL=['./','./index.html','./app.css','./dashboard-restored.css','./bike-alignment.css','./mobile-header-fix.css','./garage-v15.css','./config.js','./app.js','./masterdb-compat.js','./dashboard-restored.js','./masterdb-seed.js','./schema-native.js','./bike-alignment.js','./garage-v15.js','./v15-hotfix.js','./masterdb-v15.js','./vehicle-model-v15.js','./user-guide-v15.js','./odometer-live-v15.js','./garage-overview-v15.js','./manifest.webmanifest'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

self.addEventListener('message',event=>{
  if(event.data&&event.data.type==='SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const request=event.request;
  if(request.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        const fresh=await fetch(request,{cache:'no-store'});
        if(fresh&&fresh.ok){
          const cache=await caches.open(CACHE_NAME);
          cache.put('./index.html',fresh.clone());
          return fresh;
        }
      }catch(e){}
      return (await caches.match('./index.html'))||new Response('Fuel Tracker unavailable offline until opened once.',{status:503});
    })());
    return;
  }
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{
    if(response&&response.ok){caches.open(CACHE_NAME).then(cache=>cache.put(request,response.clone()));}
    return response;
  })));
});