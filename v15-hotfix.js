(function(){
  'use strict';

  // v15.1 compatibility hotfix:
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
    @media(max-width:580px){.v15-health-grid{grid-template-columns:1fr 1fr}}
  `;
  if(!document.getElementById('v15HotfixStyles'))document.head.appendChild(style);

  buildHealthDetails();

  // Keep details data current after vehicle/profile rerenders.
  const main=document.querySelector('main');
  if(main){
    let timer;
    new MutationObserver(()=>{
      clearTimeout(timer);
      timer=setTimeout(()=>{restoreLegacySwitchIds();buildHealthDetails();},0);
    }).observe(main,{childList:true,subtree:true});
  }
})();