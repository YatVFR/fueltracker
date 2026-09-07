const CACHE_NAME='fueltracker-v16-2-recovery-1';
const APP_SHELL=['./','./index.html','./app.css','./dashboard-restored.css','./bike-alignment.css','./mobile-header-fix.css','./garage-v15.css','./config.js','./app.js','./masterdb-compat.js','./dashboard-restored.js','./masterdb-seed.js','./schema-native.js','./bike-alignment.js','./garage-v15.js','./v15-hotfix.js','./masterdb-v15.js','./vehicle-model-v15.js','./user-guide-v15.js','./odometer-live-v15.js','./garage-overview-v15.js','./garage-analytics-v15.js','./garage-backup-v15.js','./stabilization-v15.js','./download-compat-v15.js','./navigation-v15-8.js','./automation-v16.js','./automation-dwell-v16.js','./smart-stations-v16.js','./smart-refuel-inbox-v16.js','./manifest.webmanifest'];
const FRESH_ON_INSTALL=new Set(['./','./index.html','./smart-stations-v16.js','./smart-refuel-inbox-v16.js']);

async function buildAppShell(){
  const next=await caches.open(CACHE_NAME);

  // Install is atomic: this promise must complete before the new worker can
  // activate. Existing Fuel Tracker caches remain available until activation.
  for(const asset of APP_SHELL){
    let response=null;

    // Reuse proven unchanged assets to keep updates light, but always fetch
    // version-sensitive files fresh. Store every response under the exact URL
    // used by index.html so normal launches never depend on the network.
    if(!FRESH_ON_INSTALL.has(asset))response=await caches.match(asset);
    if(!response){
      response=await fetch(asset,{cache:'no-store'});
      if(!response||!response.ok)throw new Error('Unable to cache '+asset);
    }
    await next.put(asset,response.clone());
  }
}

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    await buildAppShell();
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    // Only remove old caches after the complete new app shell installed.
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message',event=>{
  if(event.data&&event.data.type==='SKIP_WAITING') self.skipWaiting();
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

async function refreshCurtainResponse(response,request){
  if(!response)return response;
  const url=new URL(request.url);
  if(url.searchParams.get('ft-refresh')!=='1')return response;
  const html=await response.text();
  const curtain=`<style id="ftRefreshArrivalStyle">
    #ftRefreshArrival{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:#05080b;color:#f4f7f9;opacity:1;transition:opacity .42s ease;overscroll-behavior:none}
    #ftRefreshArrival.out{opacity:0;pointer-events:none}
    #ftRefreshArrival .card{width:min(310px,84vw);text-align:center;padding:22px 18px;border:1px solid #263541;border-radius:16px;background:#0a1218;box-shadow:0 24px 70px rgba(0,0,0,.5)}
    #ftRefreshArrival .ring{width:34px;height:34px;margin:0 auto 13px;border-radius:50%;border:3px solid #263541;border-top-color:#5aa2ff;animation:ftSpin .8s linear infinite}
    #ftRefreshArrival strong{display:block;font:800 14px/1.2 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;letter-spacing:.02em}
    #ftRefreshArrival span{display:block;margin-top:5px;color:#8997a2;font:500 10px/1.35 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
    #ftRefreshArrival .track{height:4px;margin-top:15px;border-radius:999px;background:#17222b;overflow:hidden}
    #ftRefreshArrival .track i{display:block;width:100%;height:100%;background:linear-gradient(90deg,#0d62d9,#5aa2ff)}
    @keyframes ftSpin{to{transform:rotate(360deg)}}
    @media(prefers-reduced-motion:reduce){#ftRefreshArrival,#ftRefreshArrival .ring{transition:none;animation:none}}
  </style>`;
  const body=`<div id="ftRefreshArrival"><div class="card"><div class="ring"></div><strong>Fuel Tracker updated</strong><span>Restoring your Garage…</span><div class="track"><i></i></div></div></div><script>(function(){var c=document.getElementById('ftRefreshArrival');function done(){setTimeout(function(){if(c)c.classList.add('out');setTimeout(function(){if(c)c.remove();var s=document.getElementById('ftRefreshArrivalStyle');if(s)s.remove();},480);try{var u=new URL(location.href);u.searchParams.delete('ft-refresh');history.replaceState(null,'',u.pathname+(u.search||'')+(u.hash||''));}catch(e){}},260)}if(document.readyState==='complete')done();else addEventListener('load',done,{once:true});})();<\/script>`;
  const injected=html.replace('<head>','<head>'+curtain).replace('<body>','<body>'+body);
  const headers=new Headers(response.headers);headers.delete('content-length');headers.set('content-type','text/html; charset=utf-8');
  return new Response(injected,{status:response.status,statusText:response.statusText,headers});
}

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const request=event.request;

  if(request.mode==='navigate'){
    event.respondWith((async()=>{
      // Installed PWA launches entirely from the complete cached shell.
      const cached=await caches.match('./index.html');
      if(cached)return refreshCurtainResponse(cached,request);

      // First run / recovery only.
      try{
        const fresh=await fetch(request,{cache:'no-store'});
        if(fresh&&fresh.ok)return refreshCurtainResponse(fresh,request);
      }catch(e){}
      return new Response('Fuel Tracker unavailable offline until opened once.',{status:503});
    })());
    return;
  }

  // App-shell resources are cache-first. Because cache keys now exactly match
  // index.html, a normal launch cannot become partially network-dependent.
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{
    if(response&&response.ok)caches.open(CACHE_NAME).then(cache=>cache.put(request,response.clone()));
    return response;
  })));
});