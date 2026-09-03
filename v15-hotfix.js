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

  async function refreshV15(){
    const btn=document.getElementById('refreshBtn');
    if(!btn||btn.disabled)return;
    btn.disabled=true;
    setRefreshLabel(btn,'Checking…','App update');
    try{ if(typeof saveState==='function') saveState(); }catch(e){}

    let reloadTimer=null;
    const doReload=()=>{
      if(reloadTimer)return;
      setRefreshLabel(btn,'Refreshing…','Reloading','#5add76');
      reloadTimer=setTimeout(()=>window.location.reload(),250);
    };

    try{
      if('serviceWorker' in navigator){
        const reg=await navigator.serviceWorker.getRegistration('./') || await navigator.serviceWorker.ready;
        if(reg){
          await reg.update();
          if(reg.waiting){
            setRefreshLabel(btn,'Updating…','New version found','#5add76');
            let changed=false;
            navigator.serviceWorker.addEventListener('controllerchange',()=>{
              if(changed)return;changed=true;doReload();
            },{once:true});
            reg.waiting.postMessage({type:'SKIP_WAITING'});
            setTimeout(doReload,900);
            return;
          }
          if(reg.installing){
            setRefreshLabel(btn,'Updating…','Installing','#5add76');
            const worker=reg.installing;
            const waitForInstall=new Promise(resolve=>{
              const done=()=>{if(worker.state==='installed'||worker.state==='activated'||worker.state==='redundant')resolve();};
              worker.addEventListener('statechange',done);done();
              setTimeout(resolve,1800);
            });
            await waitForInstall;
            if(reg.waiting)reg.waiting.postMessage({type:'SKIP_WAITING'});
            doReload();
            return;
          }
        }
      }
      try{
        if(typeof loadState==='function'){state=loadState();if(typeof renderAll==='function')renderAll();}
      }catch(e){}
      setRefreshLabel(btn,'Updated','Reloading','#5add76');
      setTimeout(doReload,350);
    }catch(err){
      try{if(typeof renderAll==='function')renderAll();}catch(e){}
      setRefreshLabel(btn,'Refresh','Retry','#f2bd54');
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
    @media(max-width:580px){.v15-health-grid{grid-template-columns:1fr 1fr}}
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