const CACHE_NAME='fueltracker-dev-v16-4-2-data-sanitization-1';
const APP_SHELL=[
  './','./index.html','./app.css','./dashboard-restored.css','./bike-alignment.css','./mobile-header-fix.css','./garage-v15.css','./maintenance-form-fix-v16.css',
  './config.js','./app.js','./masterdb-compat.js','./dashboard-restored.js','./masterdb-seed.js','./schema-native.js','./bike-alignment.js','./garage-v15.js','./v15-hotfix.js','./masterdb-v15.js','./vehicle-model-v15.js','./user-guide-v15.js','./odometer-live-v15.js','./garage-overview-v15.js','./garage-analytics-v15.js','./garage-maintenance-v16.js','./maintenance-trial-v16.js','./maintenance-type-v16.js','./refuel-smart-capture-v16.js','./station-reliability-v16.js','./onboarding-v16.js','./garage-backup-v15.js','./backup-integrity-v16.js','./data-context-v16.js','./masterdb-current-v16.js','./icloud-backup-target-v16.js','./stabilization-v15.js','./download-compat-v15.js','./navigation-v15-8.js','./automation-v16.js','./automation-dwell-v16.js','./smart-stations-v16.js','./update-status-v16.js','./version-owner-v16.js','./runtime-recovery-v16.js','./manifest.webmanifest'
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>{
    if(key===CACHE_NAME)return false;
    return key.startsWith('fueltracker-dev-')||key.includes('smart-refuel-capture-dev')||key.includes('guided-setup-station-reliability-dev');
  }).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});

self.addEventListener('message',event=>{
  if(event.data&&event.data.type==='SKIP_WAITING')self.skipWaiting();
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const target=event.notification?.data?.url||'./?page=refuel';
  event.waitUntil((async()=>{
    const absolute=new URL(target,self.registration.scope).href;
    const windows=await clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of windows){
      if('navigate' in client){await client.navigate(absolute);await client.focus();return;}
    }
    if(clients.openWindow)await clients.openWindow(absolute);
  })());
});

function offlineResponse(){return new Response('Fuel Tracker unavailable offline until opened once.',{status:503,headers:{'content-type':'text/plain; charset=utf-8'}});}

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const request=event.request;
  if(request.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        const fresh=await fetch(request,{cache:'no-store'});
        if(fresh&&fresh.ok){
          const cache=await caches.open(CACHE_NAME);
          const clean=await fetch('./index.html',{cache:'no-store'}).catch(()=>null);
          if(clean&&clean.ok)await cache.put('./index.html',clean.clone());
          return fresh;
        }
      }catch(e){}
      return (await caches.match('./index.html'))||offlineResponse();
    })());
    return;
  }
  event.respondWith((async()=>{
    const cached=await caches.match(request,{cacheName:CACHE_NAME});
    if(cached)return cached;
    try{
      const response=await fetch(request);
      if(response&&response.ok){const cache=await caches.open(CACHE_NAME);cache.put(request,response.clone());}
      return response;
    }catch(e){return cached||Response.error();}
  })());
});
