(function(){
  'use strict';
  const REV='v15.5-masterdb-6';

  function clone(v){return JSON.parse(JSON.stringify(v));}
  function garage(){return state.garageV15;}
  function profiles(){return garage()?.profiles||[];}
  function activeProfile(){return profiles().find(p=>p.id===garage()?.activeProfileId)||profiles()[0]||null;}
  function profileData(p){
    if(!p)return null;
    if(p.legacy)return garage().legacy[p.type];
    p.data=p.data||{records:[],registration:'',theme:p.type==='bike'?'honda':'generic',odometer:{value:null,updatedAt:null}};
    return p.data;
  }
  function emitDataChange(action,p){
    document.dispatchEvent(new CustomEvent('fueltracker:datachange',{detail:{action,profileId:p?.id||null,type:p?.type||state.mode}}));
    const btn=[...document.querySelectorAll('[data-profile-switch]')].find(x=>x.dataset.profileSwitch===p?.id);
    if(btn)setTimeout(()=>btn.click(),0);
  }
  function cleanName(v){return String(v||'').trim().replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,48);}
  function defaultDbName(p){
    if(!p)return 'FuelData.json';
    if(p.id==='bike-primary')return 'BikeFuelData.json';
    if(p.id==='car-primary')return 'CarFuelData.json';
    const d=profileData(p)||{};
    const base=cleanName(d.registration)||cleanName(p.name)||cleanName(p.id)||'Vehicle';
    return `${base}FuelData.json`;
  }
  function ensureMeta(p){
    if(!p)return null;
    p.masterDb=p.masterDb||{};
    if(!p.masterDb.filename)p.masterDb.filename=defaultDbName(p);
    if(!('lastImportedAt' in p.masterDb))p.masterDb.lastImportedAt=null;
    if(!('lastExportedAt' in p.masterDb))p.masterDb.lastExportedAt=null;
    if(!('lastRecordCount' in p.masterDb))p.masterDb.lastRecordCount=(profileData(p)?.records||[]).length;
    p.masterDb.revision=REV;
    return p.masterDb;
  }
  function normalizeEntry(e){
    const volume=Number(e.volume);
    return {
      id:e.id||((crypto.randomUUID&&crypto.randomUUID())||('id-'+Date.now()+'-'+Math.random().toString(36).slice(2))),
      dateTime:e.dateTime||'',location:e.location||e.station||'',volume:Number.isFinite(volume)?Math.round(volume*1000)/1000:0,cost:Number(e.cost)||0,
      currency:String(e.currency||'').toUpperCase(),fxRateSGDMYR:Number(e.fxRateSGDMYR)>0?Number(e.fxRateSGDMYR):null,
      mileage:Number(e.mileage)||0,fuelType:e.fuelType||e.fuelGrade||'',notes:e.notes||''
    };
  }
  function syncActiveSlot(p){
    const d=profileData(p);if(!p||!d)return;
    state.records=state.records||{};state.registrations=state.registrations||{};state.selected=state.selected||{};state.currentOdometer=state.currentOdometer||{};
    state.mode=p.type;state.records[p.type]=clone(d.records||[]);state.registrations[p.type]=d.registration||'';
    state.selected[p.type]=d.theme||(p.type==='bike'?'honda':'generic');state.currentOdometer[p.type]=clone(d.odometer||{value:null,updatedAt:null});
  }
  function saveActiveBack(){
    const p=activeProfile();if(!p)return;const d=profileData(p);if(!d)return;
    d.records=clone(state.records?.[p.type]||[]);d.registration=state.registrations?.[p.type]||d.registration||'';
    d.theme=state.selected?.[p.type]||d.theme||(p.type==='bike'?'honda':'generic');
    d.odometer=clone(state.currentOdometer?.[p.type]||d.odometer||{value:null,updatedAt:null});ensureMeta(p).lastRecordCount=d.records.length;
  }
  function profileMeta(p,d){
    return {
      id:p.id,type:p.type,name:p.name||'',registration:d.registration||'',make:p.make||'',model:p.model||'',year:p.year||'',
      tankCapacity:Number(p.tankCapacity)>0?Number(p.tankCapacity):null,notes:p.notes||'',theme:d.theme||'',
      odometer:clone(d.odometer||{value:null,updatedAt:null})
    };
  }
  function applyProfileMeta(p,d,meta){
    if(!meta||typeof meta!=='object')return;
    if(typeof meta.name==='string'&&meta.name.trim())p.name=meta.name.trim();
    if(typeof meta.registration==='string')d.registration=meta.registration.trim().toUpperCase();
    if(typeof meta.make==='string')p.make=meta.make.trim();
    if(typeof meta.model==='string')p.model=meta.model.trim();
    if(meta.year!=null){const y=parseInt(meta.year,10);p.year=Number.isFinite(y)&&y>=1900&&y<=2100?String(y):'';}
    const tank=Number(meta.tankCapacity);p.tankCapacity=Number.isFinite(tank)&&tank>0?tank:null;
    if(typeof meta.notes==='string')p.notes=meta.notes.trim();
    if(typeof meta.theme==='string'&&meta.theme.trim())d.theme=meta.theme.trim();
    const odo=meta.odometer;
    if(odo&&typeof odo==='object'){
      const value=Number(odo.value);
      d.odometer=Number.isFinite(value)&&value>=0?{value,updatedAt:odo.updatedAt||null}:{value:null,updatedAt:null};
    }
  }
  function payloadFor(p){
    saveActiveBack();const d=profileData(p);const meta=ensureMeta(p);
    return {app:'Fuel Tracker Garage',version:15.5,database:meta.filename,profile:profileMeta(p,d),exportedAt:new Date().toISOString(),entries:(d.records||[]).map(normalizeEntry)};
  }
  function downloadBlob(content,name,type){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),300);}
  function exportActiveDb(){
    const p=activeProfile();if(!p)return;const payload=payloadFor(p);const meta=ensureMeta(p);
    downloadBlob(JSON.stringify(payload,null,2),meta.filename,'application/json');meta.lastExportedAt=payload.exportedAt;meta.lastRecordCount=payload.entries.length;saveState();renderMasterDbUi();
  }
  function importActiveDb(file){
    const p=activeProfile();if(!p||!file)return;const reader=new FileReader();
    reader.onload=()=>{try{
      const raw=JSON.parse(reader.result);const entries=Array.isArray(raw)?raw:(Array.isArray(raw.entries)?raw.entries:null);if(!entries)throw new Error('No entries array');
      const backupType=raw?.profile?.type;
      if(backupType&&backupType!==p.type){
        alert(`This backup belongs to a ${backupType==='bike'?'Bike':'Car'} profile, but the selected Garage vehicle is a ${p.type==='bike'?'Bike':'Car'}. Select the correct vehicle and try again.`);
        return;
      }
      const rows=entries.map(normalizeEntry);const label=profileData(p)?.registration||p.name||p.type;
      if(!confirm(`Replace ${label} with ${rows.length} records from ${file.name}?`))return;
      const d=profileData(p);d.records=rows;applyProfileMeta(p,d,raw?.profile);
      const valid=rows.filter(r=>r.mileage>0&&r.dateTime).sort((a,b)=>new Date(b.dateTime)-new Date(a.dateTime));
      const importedOdo=raw?.profile?.odometer;const importedValue=Number(importedOdo?.value);
      if(!(importedOdo&&Number.isFinite(importedValue)&&importedValue>=0))d.odometer=valid[0]?{value:Number(valid[0].mileage),updatedAt:valid[0].dateTime}:{value:null,updatedAt:null};
      const meta=ensureMeta(p);meta.filename=file.name&&file.name.toLowerCase().endsWith('.json')?file.name:meta.filename;meta.lastImportedAt=new Date().toISOString();meta.lastRecordCount=rows.length;
      syncActiveSlot(p);saveState();renderAll();resetForm?.();renderMasterDbUi();emitDataChange('import',p);alert(`MasterDB loaded for ${d.registration||p.name||p.type}.`);
    }catch(err){console.error('MasterDB import failed',err);alert('Invalid Fuel Tracker MasterDB file.');}};reader.readAsText(file);
  }
  function clearAllGarageData(){
    const all=profiles();if(!all.length)return;
    const totalRecords=all.reduce((sum,p)=>sum+(profileData(p)?.records||[]).length,0);
    if(!confirm(`Clear fuel history and Current Odometer data for ALL ${all.length} Garage vehicles? This will remove ${totalRecords} fuel records and cannot be undone unless you exported your MasterDB files. Vehicle profiles, registration, themes and vehicle details will be kept.`))return;
    const current=activeProfile();
    all.forEach(p=>{
      const d=profileData(p);if(!d)return;
      d.records=[];d.odometer={value:null,updatedAt:null};
      ensureMeta(p).lastRecordCount=0;
    });
    state.records=state.records||{};state.currentOdometer=state.currentOdometer||{};
    state.records.bike=[];state.records.car=[];
    state.currentOdometer.bike={value:null,updatedAt:null};
    state.currentOdometer.car={value:null,updatedAt:null};
    if(current)syncActiveSlot(current);
    saveState();renderAll();resetForm?.();renderMasterDbUi();emitDataChange('clear-all',current);
  }
  function newActiveDb(){
    const p=activeProfile();if(!p)return;const d=profileData(p);const label=d.registration||p.name||p.type;
    if(!confirm(`Create a new empty MasterDB for ${label}? This clears this vehicle's fuel records and Current Odometer but keeps its Garage profile.`))return;
    d.records=[];d.odometer={value:null,updatedAt:null};const meta=ensureMeta(p);meta.lastImportedAt=null;meta.lastExportedAt=null;meta.lastRecordCount=0;
    syncActiveSlot(p);saveState();renderAll();resetForm?.();renderMasterDbUi();emitDataChange('newdb',p);
  }
  function fmt(v){if(!v)return 'Never';const d=new Date(v);return Number.isNaN(d.getTime())?'Never':d.toLocaleString();}
  function renderMasterDbUi(){
    const p=activeProfile();if(!p)return;saveActiveBack();const d=profileData(p);const meta=ensureMeta(p);
    const db=document.getElementById('dbName');if(db)db.textContent=meta.filename;
    const setting=db?.closest('.setting');if(setting){
      let status=setting.querySelector('.v15-db-status');if(!status){status=document.createElement('div');status.className='v15-db-status';const actions=setting.querySelector('.actions');actions?.insertAdjacentElement('beforebegin',status);}
      const next=`<div><span>Profile</span><strong>${String(d.registration||p.name||p.type)}</strong></div><div><span>Records</span><strong>${(d.records||[]).length}</strong></div><div><span>Last Import</span><strong>${fmt(meta.lastImportedAt)}</strong></div><div><span>Last Export</span><strong>${fmt(meta.lastExportedAt)}</strong></div>`;
      if(status.innerHTML!==next)status.innerHTML=next;
      const copy=setting.querySelector('p');if(copy)copy.textContent='This Garage vehicle owns an independent MasterDB. v15.5 backups include profile details, theme, current odometer and fuel records.';
    }
    document.querySelectorAll('.garage-profile').forEach((card,i)=>{const prof=profiles()[i];const node=card.querySelector('.garage-profile-db');if(prof&&node)node.textContent=ensureMeta(prof).filename;});
    saveState();
  }
  function bindControls(){
    const save=document.getElementById('saveDbBtn');if(save){save.textContent='EXPORT DB';save.onclick=exportActiveDb;}
    const input=document.getElementById('loadDbInput');if(input)input.onchange=e=>{importActiveDb(e.target.files?.[0]);e.target.value='';};
    const newBtn=document.getElementById('newDbBtn');if(newBtn)newBtn.onclick=newActiveDb;
    const clear=document.getElementById('clearBtn');if(clear){clear.textContent='CLEAR ALL DATA';clear.onclick=clearAllGarageData;}
    const locate=document.querySelector(`button[onclick*="loadDbInput"]`);if(locate)locate.textContent='IMPORT DB';
  }
  function installStyles(){
    if(document.getElementById('v15MasterDbStyles'))return;const s=document.createElement('style');s.id='v15MasterDbStyles';
    s.textContent=`.v15-db-status{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin:11px 0}.v15-db-status>div{padding:8px;border:1px solid #28343e;border-radius:8px;background:#091017;min-width:0}.v15-db-status span{display:block;font-size:8px;color:#7f8b96;text-transform:uppercase;letter-spacing:.06em}.v15-db-status strong{display:block;margin-top:4px;font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}@media(max-width:580px){.v15-db-status{grid-template-columns:1fr 1fr}}`;document.head.appendChild(s);
  }

  if(!garage()?.profiles?.length)return;profiles().forEach(ensureMeta);state.garageV15.revision=REV;saveState();installStyles();bindControls();renderMasterDbUi();
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-profile-switch],[data-profile-open],#garageModalSave,#garageAddProfile,#garageHeaderAdd,#settingsBtn'))setTimeout(()=>{bindControls();renderMasterDbUi();},30);
  });
})();