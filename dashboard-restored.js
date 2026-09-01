(function(){
  function ensureCurrentOdometer(){
    if(!state.currentOdometer) state.currentOdometer={};
    for(const mode of ['bike','car']){
      if(!state.currentOdometer[mode]){
        const rows=[...(state.records[mode]||[])].filter(r=>validDate(r.dateTime)).sort((a,b)=>new Date(b.dateTime)-new Date(a.dateTime));
        const latest=rows[0];
        state.currentOdometer[mode]={value:latest?+latest.mileage:null,updatedAt:latest?latest.dateTime:null};
      }
    }
    saveState();
  }
  function rowsAsc(){return [...currentRecords()].filter(r=>validDate(r.dateTime)).sort((a,b)=>new Date(a.dateTime)-new Date(b.dateTime));}
  function latestRefuel(){const rows=rowsAsc();return rows.length?rows[rows.length-1]:null;}
  function previousRefuel(){const rows=rowsAsc();return rows.length>1?rows[rows.length-2]:null;}
  function currentOdo(){ensureCurrentOdometer();return state.currentOdometer[state.mode];}
  function fmtDate(v){const d=validDate(v);return d?d.toLocaleString():'—';}
  function summary(){
    const latest=latestRefuel(),prev=previousRefuel(),cur=currentOdo();
    const currentValue=Number.isFinite(+cur.value)?+cur.value:(latest?+latest.mileage:null);
    const latestOdo=latest?+latest.mileage:null;
    const distance=(currentValue!=null&&latestOdo!=null)?Math.max(0,currentValue-latestOdo):null;
    let lasted=null,currentTank=null;
    if(latest&&prev){const n=Math.round((new Date(latest.dateTime)-new Date(prev.dateTime))/86400000);if(Number.isFinite(n))lasted=n;}
    if(latest){const n=Math.max(0,Math.floor((Date.now()-new Date(latest.dateTime).getTime())/86400000));if(Number.isFinite(n))currentTank=n;}
    return {latest,prev,cur,currentValue,latestOdo,distance,lasted,currentTank};
  }
  function renderOdometer(){
    const el=document.getElementById('odometerGrid');if(!el)return;
    const s=summary();
    el.innerHTML=`
      <div class="odo-card"><h3>Current Odometer</h3><div class="odo-value">${s.currentValue!=null?Number(s.currentValue).toLocaleString():'—'}</div><div class="odo-sub">${s.currentValue!=null?'km • updated '+fmtDate(s.cur.updatedAt):'No odometer set'}</div><div class="odo-action"><button id="updateOdoBtn" type="button">UPDATE ODOMETER</button></div></div>
      <div class="odo-card"><h3>Latest Refuel Odo</h3><div class="odo-value">${s.latestOdo!=null?Number(s.latestOdo).toLocaleString():'—'}</div><div class="odo-sub">${s.latestOdo!=null?'km at last refuel':'No refuel data yet'}</div></div>
      <div class="odo-card"><h3>Distance Since Refuel</h3><div class="odo-value">${s.distance!=null?Number(s.distance).toLocaleString():'—'}<span class="odo-unit"> km</span></div><div class="odo-sub">tap Update Odometer after riding / driving</div></div>
      <div class="odo-card"><h3>Fuel Lasted</h3><div class="odo-value">${s.lasted!=null?s.lasted:'—'}<span class="odo-unit"> days</span></div><div class="odo-sub">current tank: ${s.currentTank!=null?s.currentTank:'—'} days so far</div></div>`;
    document.getElementById('updateOdoBtn')?.addEventListener('click',openOdoModal);
  }
  function renderEfficiencyDetails(){
    const el=document.getElementById('efficiencyList');if(!el)return;
    const s=summary();
    if(!s.latest||!s.prev){el.innerHTML='<div class="eff-card"><h3>Latest Fuel Economy</h3><div class="eff-value">—</div><div class="eff-sub">At least two refuel records are required.</div></div>';return;}
    const distance=(+s.latest.mileage)-(+s.prev.mileage), volume=+s.latest.volume;
    const economy=(distance>0&&volume>0)?distance/volume:null;
    el.innerHTML=`
      <div class="eff-card"><h3>Latest Fuel Economy</h3><div class="eff-value">${economy?economy.toFixed(1):'—'}<span class="eff-unit"> km/L</span></div><div class="eff-sub">latest completed refuel interval</div></div>
      <div class="eff-card"><h3>Distance Travelled</h3><div class="eff-value">${distance>0?Number(distance).toLocaleString():'—'}<span class="eff-unit"> km</span></div><div class="eff-sub">current odo − previous odo</div></div>
      <div class="eff-card"><h3>Current Refuel Volume</h3><div class="eff-value">${volume>0?Number(volume).toFixed(2):'—'}<span class="eff-unit"> L</span></div><div class="eff-sub">litres used in formula</div></div>
      <div class="eff-card"><h3>Previous Odometer</h3><div class="eff-value">${Number(s.prev.mileage).toLocaleString()}<span class="eff-unit"> km</span></div><div class="eff-sub">previous refuel</div></div>
      <div class="eff-card"><h3>Current Odometer</h3><div class="eff-value">${Number(s.latest.mileage).toLocaleString()}<span class="eff-unit"> km</span></div><div class="eff-sub">current refuel</div></div>`;
  }
  function renderRestored(){renderOdometer();renderEfficiencyDetails();}
  function openOdoModal(){const m=document.getElementById('odoModal');if(!m)return;document.getElementById('odoInput').value=currentOdo().value??'';m.hidden=false;}
  function closeOdoModal(){const m=document.getElementById('odoModal');if(m)m.hidden=true;}
  function saveOdo(){const input=document.getElementById('odoInput');const value=Number(input.value);if(!(value>=0)){alert('Please enter a valid odometer value.');return;}state.currentOdometer[state.mode]={value,updatedAt:new Date().toISOString()};saveState();renderRestored();closeOdoModal();}
  ensureCurrentOdometer();
  const originalRenderAll=renderAll;
  renderAll=function(){originalRenderAll();renderRestored();};
  const originalSaveRecord=saveRecord;
  saveRecord=function(e){
    const before=latestRefuel()?.mileage??null;
    originalSaveRecord(e);
    const latest=latestRefuel();
    if(latest&&(!state.currentOdometer[state.mode]||state.currentOdometer[state.mode].value==null||+latest.mileage>+state.currentOdometer[state.mode].value)){
      state.currentOdometer[state.mode]={value:+latest.mileage,updatedAt:latest.dateTime};saveState();renderRestored();
    }
  };
  document.getElementById('odoCancelBtn')?.addEventListener('click',closeOdoModal);
  document.getElementById('odoSaveBtn')?.addEventListener('click',saveOdo);
  document.getElementById('odoModal')?.addEventListener('click',e=>{if(e.target.id==='odoModal')closeOdoModal();});
  renderRestored();
})();