const CACHE_NAME='fueltracker-dev-v16-4-7-mgw-boot-3';
const APP_SHELL=[
  './','./index.html','./app.css','./dashboard-restored.css','./bike-alignment.css','./mobile-header-fix.css','./garage-v15.css','./floating-bottom-nav-v16.css','./collapsible-sections-v16.css','./pwa-branding-dev.css',
  './config.js','./app.js','./masterdb-compat.js','./dashboard-restored.js','./masterdb-seed.js','./schema-native.js','./bike-alignment.js','./garage-v15.js','./v15-hotfix.js','./masterdb-v15.js','./vehicle-model-v15.js','./user-guide-v15.js','./odometer-live-v15.js','./garage-overview-v15.js','./garage-analytics-v15.js','./garage-maintenance-v16.js','./maintenance-trial-v16.js','./maintenance-type-v16.js','./garage-backup-v15.js','./backup-integrity-v16.js','./data-context-v16.js','./masterdb-current-v16.js','./icloud-backup-target-v16.js','./stabilization-v15.js','./download-compat-v15.js','./navigation-v15-8.js','./automation-dwell-v16.js','./smart-stations-v16.js','./update-status-v16.js','./version-owner-v16.js','./runtime-recovery-v16.js','./pwa-branding-dev.js','./manifest.webmanifest','./assets/branding/fueltracker-dev-icon-192.png','./assets/branding/fueltracker-dev-loading.jpg'
];

async function precache(){
  const cache=await caches.open(CACHE_NAME);
  const results=await Promise.allSettled(APP_SHELL.map(async url=>{
    const response=await fetch(url,{cache:'reload'});
    if(!response.ok)throw new Error(url+' '+response.status);
    await cache.put(url,response);
  }));
  const failed=results.filter(x=>x.status==='rejected');
  if(failed.length)console.warn('Fuel Tracker precache skipped unavailable assets:',failed.length);
}
self.addEventListener('install',event=>event.waitUntil(precache().then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME&&key.startsWith('fueltracker-dev-')).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('notificationclick',event=>{event.notification.close();const target=event.notification?.data?.url||'./#maintenance';event.waitUntil((async()=>{const absolute=new URL(target,self.registration.scope).href;const windows=await clients.matchAll({type:'window',includeUncontrolled:true});for(const client of windows){if('navigate' in client){await client.navigate(absolute);await client.focus();return;}}if(clients.openWindow)await clients.openWindow(absolute);})());});
function offlineResponse(){return new Response('Fuel Tracker is offline. Open it once while online to complete the local cache.',{status:503,headers:{'content-type':'text/plain; charset=utf-8'}});}
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const request=event.request;
  if(request.mode==='navigate'){
    event.respondWith((async()=>{try{const fresh=await fetch(request,{cache:'no-store'});if(fresh?.ok){const cache=await caches.open(CACHE_NAME);await cache.put('./index.html',fresh.clone());return fresh;}}catch(e){}return (await caches.match('./index.html'))||offlineResponse();})());
    return;
  }
  event.respondWith((async()=>{const cached=await caches.match(request,{cacheName:CACHE_NAME});if(cached)return cached;try{const response=await fetch(request);if(response?.ok){const cache=await caches.open(CACHE_NAME);await cache.put(request,response.clone());}return response;}catch(e){return cached||Response.error();}})());
});