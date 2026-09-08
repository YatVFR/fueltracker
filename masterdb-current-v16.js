(function(){
  'use strict';
  if(window.FuelTrackerMasterDbCurrentV16)return;
  const REV='v16.3.7-masterdb-current-1';
  const DISPLAY='16.3.7';
  const clone=v=>JSON.parse(JSON.stringify(v));
  function garage(){try{return state?.garageV15||null;}catch(e){return null;}}
  function profiles(){return garage()?.profiles||[];}
  function activeProfile(){const g=garage();return profiles().find(p=>p.id===g?.activeProfileId)||profiles()[0]||null;}
  function data(p){if(!p)return null;return p.legacy?garage()?.legacy?.[p.type]:p.data;}
  function cleanName(v){return String(v||'').trim().replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,48);}
  function filename(p){p.masterDb=p.masterDb||{};if(!p.masterDb.filename){const d=data(p)||{},base=cleanName(d.registration)||cleanName(p.name)||cleanName(p.id)||'Vehicle';p.masterDb.filename=(p.id==='bike-primary'?'BikeFuelData':p.id==='car-primary'?'CarFuelData':base+'FuelData')+'.json';}return p.masterDb.filename;}
  function normalize(r){return {id:r?.id||'',dateTime:r?.dateTime||'',location:r?.location||r?.station||'',volume:Number(r?.volume)||0,cost:Number(r?.cost)||0,currency:String(r?.currency||'').toUpperCase(),fxRateSGDMYR:Number(r?.fxRateSGDMYR)>0?Number(r.fxRateSGDMYR):null,mileage:Number(r?.mileage)||0,fuelType:r?.fuelType||r?.fuelGrade||'',notes:r?.notes||''};}
  function profileMeta(p,d){return {id:p.id,type:p.type,name:p.name||'',registration:d.registration||'',make:p.make||'',model:p.model||'',year:p.year||'',tankCapacity:Number(p.tankCapacity)>0?Number(p.tankCapacity):null,notes:p.notes||'',theme:d.theme||'',odometer:clone(d.odometer||{value:null,updatedAt:null})};}
  async function exportDb(){
    const p=activeProfile(),d=data(p);if(!p||!d)return;
    const name=filename(p),payload={app:'Fuel Tracker Garage MasterDB',version:DISPLAY,schema:2,database:name,profile:profileMeta(p,d),exportedAt:new Date().toISOString(),entries:(d.records||[]).map(normalize)};
    try{
      const json=JSON.stringify(payload,null,2);let result;
      if(typeof window.FuelTrackerExportFile==='function')result=await window.FuelTrackerExportFile(json,name,'application/json');
      else{const blob=new Blob([json],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(url);},2500);result={method:'download'};}
      p.masterDb=p.masterDb||{};p.masterDb.lastExportedAt=payload.exportedAt;p.masterDb.lastRecordCount=payload.entries.length;p.masterDb.revision=REV;saveState?.();
      window.FuelTrackerToast?.(result?.method==='share'?`MasterDB ready to save/share · v${DISPLAY}`:`MasterDB download started · v${DISPLAY}`,'ok');
      render();
    }catch(err){console.error('MasterDB export failed',err);window.FuelTrackerToast?.('MasterDB export failed.','warn');}
  }
  function render(){
    const p=activeProfile();if(!p)return;const db=document.getElementById('dbName');if(db){db.textContent=filename(p);let badge=db.parentElement?.querySelector('.v1637-db-format');if(!badge){badge=document.createElement('div');badge.className='v1637-db-format';badge.style.cssText='margin-top:4px;color:#69aef8;font-size:8px;font-weight:850;letter-spacing:.05em';db.insertAdjacentElement('afterend',badge);}badge.textContent='MasterDB format · v'+DISPLAY;}
    const setting=db?.closest('.setting'),copy=setting?.querySelector('p');if(copy)copy.textContent=`This Garage vehicle owns an independent MasterDB. Current exports use v${DISPLAY} and include profile details, theme, odometer and fuel records.`;
    const old=document.getElementById('saveDbBtn');if(old&&!old.dataset.v1637Current){const b=old.cloneNode(true);b.dataset.v1637Current='1';old.replaceWith(b);b.textContent='EXPORT DB';b.onclick=exportDb;}
  }
  [120,500,1200].forEach(ms=>setTimeout(render,ms));document.addEventListener('fueltracker:pagechange',e=>{if(e.detail?.page==='settings')setTimeout(render,60);});document.addEventListener('fueltracker:datachange',()=>setTimeout(render,70));document.addEventListener('click',e=>{if(e.target.closest('[data-profile-switch],[data-profile-open],#bikeBtn,#carBtn'))setTimeout(render,100);});
  window.FuelTrackerMasterDbCurrentV16={revision:REV,version:DISPLAY,exportDb,render};
})();