(function(){
  'use strict';

  // v15 compatibility hotfix:
  // The legacy renderer still expects #bikeBtn and #carBtn to exist.
  function restoreLegacySwitchIds(){
    const primaryBike=document.querySelector('[data-profile-switch="bike-primary"]');
    const primaryCar=document.querySelector('[data-profile-switch="car-primary"]');
    if(primaryBike && primaryBike.id!=='bikeBtn') primaryBike.id='bikeBtn';
    if(primaryCar && primaryCar.id!=='carBtn') primaryCar.id='carBtn';
  }

  restoreLegacySwitchIds();
  const switchRoot=document.querySelector('.vehicle-switch');
  if(switchRoot){
    new MutationObserver(restoreLegacySwitchIds).observe(switchRoot,{childList:true,subtree:true});
  }

  function validDateLocal(v){
    const d=new Date(v);
    return Number.isNaN(d.getTime())?null:d;
  }

  function buildHealthDetails(){
    const health=document.querySelector('.health');
    if(!health)return;
    let details=document.getElementById('v15HealthDetails');
    if(!details){
      details=document.createElement('div');
      details.id='v15HealthDetails';
      details.className='v15-health-details';
      details.hidden=true;
      health.insertAdjacentElement('afterend',details);
    }

    const rows=[...(typeof currentRecords==='function'?currentRecords():[])];
    const seen=new Set();
    let invalid=0,duplicates=0,regressions=0;
    rows.forEach(r=>{
      const location=r.location||r.station||'';
      if(!validDateLocal(r.dateTime)||!(Number(r.mileage)>=0)||!(Number(r.volume)>0)||!(Number(r.cost)>=0)||!location) invalid++;
      const fp=[r.dateTime,r.mileage,r.volume,r.cost,r.currency,location].join('|');
      if(seen.has(fp)) duplicates++; else seen.add(fp);
    });
    const odo=rows.filter(r=>Number(r.mileage)>0&&validDateLocal(r.dateTime)).sort((a,b)=>new Date(a.dateTime)-new Date(b.dateTime));
    for(let i=1;i<odo.length;i++) if(Number(odo[i].mileage)<Number(odo[i-1].mileage)) regressions++;
    const latest=rows.filter(r=>validDateLocal(r.dateTime)).sort((a,b)=>new Date(b.dateTime)-new Date(a.dateTime))[0];

    details.innerHTML=`
      <div class="v15-health-grid">
        <div><span>Records</span><strong>${rows.length}</strong></div>
        <div><span>Latest Record</span><strong>${latest?new Date(latest.dateTime).toLocaleDateString():'—'}</strong></div>
        <div><span>Duplicates</span><strong>${duplicates}</strong></div>
        <div><span>Odo Issues</span><strong>${regressions}</strong></div>
      </div>
      <div class="v15-health-message ${invalid||duplicates||regressions?'warn':'ok'}">
        ${invalid||duplicates||regressions
          ? `${invalid} invalid • ${duplicates} duplicate • ${regressions} odometer sequence issue${regressions===1?'':'s'}`
          : 'No integrity issues detected for the active vehicle.'}
      </div>`;

    const btn=health.querySelector('button');
    if(btn && !btn.dataset.v15HealthBound){
      btn.dataset.v15HealthBound='true';
      btn.setAttribute('aria-expanded','false');
      btn.onclick=()=>{
        buildHealthDetails();
        const panel=document.getElementById('v15HealthDetails');
        const open=panel.hidden;
        panel.hidden=!open;
        btn.setAttribute('aria-expanded',open?'true':'false');
        btn.textContent=open?'Hide Details':'View Details';
      };
    }
  }

  function setRefreshLabel(btn,title,sub,color='#89949d'){
    if(!btn)return;
    btn.innerHTML=`${title}<br><span style="font-size:11px;color:${color}">${sub}</span>`;
  }

  function ensureRefreshOverlay(){
    let overlay=document.getElementById('v156RefreshOverlay');
    if(overlay)return overlay;
    overlay=document.createElement('div');
    overlay.id='v156RefreshOverlay';
    overlay.setAttribute('aria-live','polite');
    overlay.innerHTML=`<div class="v156-refresh-card">
      <div class="v156-refresh-ring" aria-hidden="true"></div>
      <div class="v156-refresh-copy"><strong id="v156RefreshTitle">Checking for update</strong><span id="v156RefreshSub">Preparing Fuel Tracker…</span></div>
      <div class="v156-refresh-track"><i id="v156RefreshProgress"></i></div>
    </div>`;
    document.body.appendChild(overlay);
    return overlay;
  }

  function showRefreshStage(title,sub,progress=18,mode='working'){
    const overlay=ensureRefreshOverlay();
    const t=overlay.querySelector('#v156RefreshTitle'),s=overlay.querySelector('#v156RefreshSub'),bar=overlay.querySelector('#v156RefreshProgress');
    if(t)t.textContent=title;if(s)s.textContent=sub;if(bar)bar.style.width=`${Math.max(4,Math.min(100,progress))}%`;
    overlay.classList.toggle('ready',mode==='ready');
    overlay.classList.add('show');
    document.documentElement.classList.add('v156-refreshing');
  }

  function hideRefreshOverlay(){
    document.getElementById('v156RefreshOverlay')?.classList.remove('show','ready');
    document.documentElement.classList.remove('v156-refreshing');
  }

  async function refreshV15(){
    const btn=document.getElementById('refreshBtn');
    if(!btn||btn.disabled)return;
    btn.disabled=true;
    setRefreshLabel(btn,'Checking…','App update');
    showRefreshStage('Checking for update','Saving your local Garage first…',16);
    try{ if(typeof saveState==='function') saveState(); }catch(e){}

    await new Promise(resolve=>setTimeout(resolve,220));
    let reloadTimer=null;
    const doReload=()=>{
      if(reloadTimer)return;
      setRefreshLabel(btn,'Ready','Reloading','#5add76');
      showRefreshStage('Update ready','Reloading Fuel Tracker…',100,'ready');
      document.body.classList.add('v156-refresh-fade');
      reloadTimer=setTimeout(()=>window.location.reload(),700);
    };

    try{
      showRefreshStage('Checking app files','Looking for a newer version…',34);
      if('serviceWorker' in navigator){
        const reg=await navigator.serviceWorker.getRegistration('./') || await navigator.serviceWorker.ready;
        if(reg){
          await reg.update();
          if(reg.waiting){
            setRefreshLabel(btn,'Updating…','New version found','#5add76');
            showRefreshStage('Installing update','A newer Fuel Tracker is ready…',68);
            let changed=false;
            navigator.serviceWorker.addEventListener('controllerchange',()=>{
              if(changed)return;changed=true;doReload();
            },{once:true});
            reg.waiting.postMessage({type:'SKIP_WAITING'});
            setTimeout(doReload,1050);
            return;
          }
          if(reg.installing){
            setRefreshLabel(btn,'Updating…','Installing','#5add76');
            showRefreshStage('Installing update','Updating offline app files…',68);
            const worker=reg.installing;
            const waitForInstall=new Promise(resolve=>{
              const done=()=>{if(worker.state==='installed'||worker.state==='activated'||worker.state==='redundant')resolve();};
              worker.addEventListener('statechange',done);done();
              setTimeout(resolve,1900);
            });
            await waitForInstall;
            showRefreshStage('Finishing update','Refreshing your Garage…',88);
            if(reg.waiting)reg.waiting.postMessage({type:'SKIP_WAITING'});
            doReload();
            return;
          }
        }
      }
      try{
        showRefreshStage('Refreshing data','Rebuilding the current dashboard…',78);
        if(typeof loadState==='function'){state=loadState();if(typeof renderAll==='function')renderAll();}
      }catch(e){}
      setRefreshLabel(btn,'Updated','Reloading','#5add76');
      showRefreshStage('Everything is current','Reloading Fuel Tracker…',96,'ready');
      setTimeout(doReload,380);
    }catch(err){
      try{if(typeof renderAll==='function')renderAll();}catch(e){}
      setRefreshLabel(btn,'Refresh','Retry','#f2bd54');
      showRefreshStage('Refresh interrupted','Tap Refresh to try again.',100,'ready');
      setTimeout(hideRefreshOverlay,1200);
      btn.disabled=false;
    }
  }

  function bindRefresh(){
    const btn=document.getElementById('refreshBtn');
    if(!btn)return;
    btn.onclick=refreshV15;
    btn.disabled=false;
    if(!btn.dataset.v15RefreshReady){
      btn.dataset.v15RefreshReady='true';
      setRefreshLabel(btn,'Refresh','Check update');
    }
  }

  const style=document.createElement('style');
  style.id='v15HotfixStyles';
  style.textContent=`
    .v15-health-details{margin-top:8px;padding:12px;border:1px solid #2b3742;border-radius:10px;background:#0a1117}
    .v15-health-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
    .v15-health-grid>div{padding:9px;border:1px solid #26313b;border-radius:8px;background:#0d151c;min-width:0}
    .v15-health-grid span{display:block;font-size:9px;color:#87939e;text-transform:uppercase;letter-spacing:.06em}
    .v15-health-grid strong{display:block;margin-top:5px;font-size:12px;color:#f2f5f7;overflow:hidden;text-overflow:ellipsis}
    .v15-health-message{margin-top:9px;padding:9px 10px;border-radius:8px;font-size:10px;line-height:1.4}
    .v15-health-message.ok{border:1px solid #255e38;background:#07150c;color:#65df82}
    .v15-health-message.warn{border:1px solid #6a511f;background:#231b0d;color:#f2bd54}
    #refreshBtn:disabled{opacity:.72;cursor:wait}
    #v156RefreshOverlay{position:fixed;inset:0;z-index:30000;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(3,6,9,.2);backdrop-filter:blur(0);-webkit-backdrop-filter:blur(0);opacity:0;visibility:hidden;transition:opacity .22s ease,backdrop-filter .28s ease,-webkit-backdrop-filter .28s ease,background .28s ease}
    #v156RefreshOverlay.show{opacity:1;visibility:visible;background:rgba(3,6,9,.62);backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px)}
    .v156-refresh-card{width:min(330px,88vw);border:1px solid color-mix(in srgb,var(--accent,#137fe8) 42%,#27343f);border-radius:16px;padding:18px;background:rgba(8,15,21,.94);box-shadow:0 22px 60px rgba(0,0,0,.48);transform:translateY(8px) scale(.98);transition:transform .28s ease,border-color .25s ease}
    #v156RefreshOverlay.show .v156-refresh-card{transform:translateY(0) scale(1)}
    .v156-refresh-ring{width:34px;height:34px;border-radius:50%;border:3px solid #26333e;border-top-color:var(--accent,#137fe8);margin-bottom:13px;animation:v156spin .82s linear infinite}
    #v156RefreshOverlay.ready .v156-refresh-ring{animation:none;border-color:var(--accent,#5add76);position:relative}
    #v156RefreshOverlay.ready .v156-refresh-ring:after{content:'✓';position:absolute;inset:0;display:grid;place-items:center;color:var(--accent,#5add76);font-size:19px;font-weight:900}
    .v156-refresh-copy strong{display:block;font-size:14px;letter-spacing:.02em}.v156-refresh-copy span{display:block;margin-top:4px;font-size:10px;color:#8f9aa4;line-height:1.35}
    .v156-refresh-track{height:4px;margin-top:14px;border-radius:999px;background:#17212a;overflow:hidden}.v156-refresh-track i{display:block;width:10%;height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--accent2,#0d62d9),var(--accent,#137fe8));transition:width .38s ease}
    body.v156-refresh-fade .app{opacity:.72;transform:scale(.996);transition:opacity .45s ease,transform .45s ease}
    @keyframes v156spin{to{transform:rotate(360deg)}}
    @media(prefers-reduced-motion:reduce){.v156-refresh-ring{animation:none!important}.v156-refresh-card,#v156RefreshOverlay,.v156-refresh-track i,body.v156-refresh-fade .app{transition:none!important}}
    @media(max-width:580px){.v15-health-grid{grid-template-columns:1fr 1fr}.v156-refresh-card{padding:16px}}
  `;
  if(!document.getElementById('v15HotfixStyles'))document.head.appendChild(style);

  buildHealthDetails();
  bindRefresh();

  // Keep hotfix bindings current after vehicle/profile rerenders.
  const main=document.querySelector('main');
  if(main){
    let timer;
    new MutationObserver(()=>{
      clearTimeout(timer);
      timer=setTimeout(()=>{restoreLegacySwitchIds();buildHealthDetails();bindRefresh();},0);
    }).observe(main,{childList:true,subtree:true});
  }
})();