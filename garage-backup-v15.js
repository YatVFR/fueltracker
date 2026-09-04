(function(){
  'use strict';
  const REV='v15.6-garage-backup-1';
  const APP_VERSION='v15.6 Garage';
  const MONTH_KEY='fueltrackerV14SelectedMonth';
  let pendingBackup=null;
  let pendingFileName='';

  function clone(v){return JSON.parse(JSON.stringify(v));}
  function garage(){return state.garageV15||null;}
  function profiles(){return garage()?.profiles||[];}
  function activeProfile(){return profiles().find(p=>p.id===garage()?.activeProfileId)||profiles()[0]||null;}
  function profileData(g,p){
    if(!p)return null;
    if(p.legacy)return g?.legacy?.[p.type]||null;
    return p.data||null;
  }
  function escLocal(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function validDate(v){const d=new Date(v);return Number.isNaN(d.getTime())?null:d;}
  function normalizeEntry(e){
    const volume=Number(e?.volume);
    return {
      id:e?.id||((crypto.randomUUID&&crypto.randomUUID())||('id-'+Date.now()+'-'+Math.random().toString(36).slice(2))),
      dateTime:e?.dateTime||'',location:e?.location||e?.station||'',volume:Number.isFinite(volume)?Math.round(volume*1000)/1000:0,
      cost:Number(e?.cost)||0,currency:String(e?.currency||'').toUpperCase(),fxRateSGDMYR:Number(e?.fxRateSGDMYR)>0?Number(e.fxRateSGDMYR):null,
      mileage:Number(e?.mileage)||0,fuelType:e?.fuelType||e?.fuelGrade||'',notes:e?.notes||''
    };
  }
  function emptyData(type){return {records:[],registration:'',theme:type==='bike'?'honda':'generic',odometer:{value:null,updatedAt:null}};}
  function normalizeData(type,d){
    const out=d&&typeof d==='object'?clone(d):emptyData(type);
    out.records=Array.isArray(out.records)?out.records.map(normalizeEntry):[];
    out.registration=String(out.registration||'').trim().toUpperCase();
    out.theme=String(out.theme||'').trim()||(type==='bike'?'honda':'generic');
    const value=Number(out.odometer?.value);
    out.odometer=Number.isFinite(value)&&value>=0?{value,updatedAt:out.odometer?.updatedAt||null}:{value:null,updatedAt:null};
    return out;
  }

  function syncActiveIntoGarage(){
    const g=garage(),p=activeProfile();if(!g||!p)return;
    const live={
      records:clone(state.records?.[p.type]||[]),
      registration:state.registrations?.[p.type]||'',
      theme:state.selected?.[p.type]||(p.type==='bike'?'honda':'generic'),
      odometer:clone(state.currentOdometer?.[p.type]||{value:null,updatedAt:null})
    };
    if(p.legacy){g.legacy=g.legacy||{};g.legacy[p.type]=live;}else p.data=live;
  }

  function summaryFromState(s){
    const g=s?.garageV15;if(!g?.profiles?.length)return {vehicles:0,records:0};
    let records=0;
    g.profiles.forEach(p=>{const d=profileData(g,p);records+=(d?.records||[]).length;});
    return {vehicles:g.profiles.length,records};
  }
  function fmtDate(v){const d=validDate(v);return d?d.toLocaleString():'Unknown';}
  function backupFileName(){
    const d=new Date(),pad=n=>String(n).padStart(2,'0');
    return `FuelTracker-Garage-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.json`;
  }
  function download(content,name){
    const blob=new Blob([content],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),300);
  }

  function buildBackup(){
    syncActiveIntoGarage();saveState?.();
    const snapshot=clone(state),summary=summaryFromState(snapshot);
    return {
      app:'Fuel Tracker Garage Backup',kind:'garage-backup',version:15.6,schema:1,exportedAt:new Date().toISOString(),
      summary,
      state:snapshot,
      localPreferences:{selectedMonth:localStorage.getItem(MONTH_KEY)}
    };
  }
  function exportGarage(){
    const payload=buildBackup();
    download(JSON.stringify(payload,null,2),backupFileName());
    if(garage()){garage().lastGarageBackupAt=payload.exportedAt;garage().backupRevision=REV;saveState?.();}
    renderStatus();
  }

  function validateBackup(raw){
    if(!raw||typeof raw!=='object')throw new Error('Invalid backup');
    if(raw.kind!=='garage-backup'||!raw.state?.garageV15?.profiles?.length)throw new Error('Not a Garage backup');
    const g=raw.state.garageV15;
    if(!Array.isArray(g.profiles)||!g.profiles.length)throw new Error('No Garage profiles');
    g.profiles.forEach(p=>{if(!p||!['bike','car'].includes(p.type))throw new Error('Invalid vehicle profile');});
    return raw;
  }

  function normalizeRestoredState(source){
    const restored=clone(source),g=restored.garageV15;
    restored.records=restored.records&&typeof restored.records==='object'?restored.records:{};
    restored.registrations=restored.registrations&&typeof restored.registrations==='object'?restored.registrations:{};
    restored.selected=restored.selected&&typeof restored.selected==='object'?restored.selected:{};
    restored.currentOdometer=restored.currentOdometer&&typeof restored.currentOdometer==='object'?restored.currentOdometer:{};
    g.legacy=g.legacy&&typeof g.legacy==='object'?g.legacy:{};

    ['bike','car'].forEach(type=>{
      g.legacy[type]=normalizeData(type,g.legacy[type]);
      restored.records[type]=clone(g.legacy[type].records);
      restored.registrations[type]=g.legacy[type].registration;
      restored.selected[type]=g.legacy[type].theme;
      restored.currentOdometer[type]=clone(g.legacy[type].odometer);
    });

    g.profiles.forEach(p=>{
      if(!p.legacy)p.data=normalizeData(p.type,p.data);
      if(typeof p.make!=='string')p.make='';if(typeof p.model!=='string')p.model='';if(typeof p.year!=='string')p.year='';
      if(typeof p.notes!=='string')p.notes='';if(!('tankCapacity' in p))p.tankCapacity=null;
    });

    let active=g.profiles.find(p=>p.id===g.activeProfileId)||g.profiles[0];
    g.activeProfileId=active.id;
    const d=profileData(g,active)||emptyData(active.type);
    restored.mode=active.type;
    restored.records[active.type]=clone(d.records||[]);
    restored.registrations[active.type]=d.registration||'';
    restored.selected[active.type]=d.theme||(active.type==='bike'?'honda':'generic');
    restored.currentOdometer[active.type]=clone(d.odometer||{value:null,updatedAt:null});
    return restored;
  }

  function closePreview(){pendingBackup=null;pendingFileName='';const p=document.getElementById('garageRestorePreview');if(p)p.hidden=true;}
  function showPreview(raw,fileName){
    pendingBackup=raw;pendingFileName=fileName||'Garage backup';
    const preview=document.getElementById('garageRestorePreview');if(!preview)return;
    const s=summaryFromState(raw.state);
    preview.innerHTML=`<div class="gb-preview-head"><strong>Restore Preview</strong><span>${escLocal(pendingFileName)}</span></div>
      <div class="gb-preview-grid"><div><small>Vehicles</small><strong>${s.vehicles}</strong></div><div><small>Fuel Records</small><strong>${s.records}</strong></div><div><small>Backup Version</small><strong>v${escLocal(raw.version||'—')}</strong></div><div><small>Exported</small><strong>${escLocal(fmtDate(raw.exportedAt))}</strong></div></div>
      <div class="gb-warning">Restoring replaces the entire local Garage, including every vehicle profile, theme, odometer, MasterDB metadata and fuel record.</div>
      <div class="actions"><button type="button" class="secondary" id="garageRestoreCancel">CANCEL</button><button type="button" class="danger" id="garageRestoreConfirm">RESTORE GARAGE</button></div>`;
    preview.hidden=false;
    preview.querySelector('#garageRestoreCancel').onclick=closePreview;
    preview.querySelector('#garageRestoreConfirm').onclick=restorePending;
  }
  function restorePending(){
    if(!pendingBackup)return;
    const s=summaryFromState(pendingBackup.state);
    if(!confirm(`Replace this entire local Fuel Tracker Garage with ${s.vehicles} vehicles and ${s.records} fuel records from ${pendingFileName}? Current local data will be replaced.`))return;
    try{
      const restored=normalizeRestoredState(pendingBackup.state);
      state=restored;
      if(pendingBackup.localPreferences?.selectedMonth!=null)localStorage.setItem(MONTH_KEY,pendingBackup.localPreferences.selectedMonth);
      else localStorage.removeItem(MONTH_KEY);
      saveState?.();
      window.location.reload();
    }catch(err){console.error('Garage restore failed',err);alert('Unable to restore this Garage backup.');}
  }
  function importGarageFile(file){
    if(!file)return;const reader=new FileReader();
    reader.onload=()=>{try{showPreview(validateBackup(JSON.parse(reader.result)),file.name);}catch(err){console.error('Garage backup validation failed',err);alert('This is not a valid Fuel Tracker Garage backup.');}};
    reader.readAsText(file);
  }

  function installStyles(){
    if(document.getElementById('v156GarageBackupStyles'))return;
    const s=document.createElement('style');s.id='v156GarageBackupStyles';
    s.textContent=`.garage-backup-setting{grid-column:1/-1}.gb-status{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:11px 0}.gb-status>div,.gb-preview-grid>div{padding:8px;border:1px solid #28343e;border-radius:8px;background:#091017;min-width:0}.gb-status small,.gb-preview-grid small{display:block;font-size:8px;color:#7f8b96;text-transform:uppercase;letter-spacing:.06em}.gb-status strong,.gb-preview-grid strong{display:block;margin-top:4px;font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.gb-preview{margin-top:10px;padding:10px;border:1px solid #6a511f;border-radius:9px;background:#17130b}.gb-preview-head{display:flex;justify-content:space-between;gap:8px;align-items:center}.gb-preview-head span{font-size:8px;color:#89949d;max-width:55%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.gb-preview-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin:9px 0}.gb-warning{padding:9px;border-radius:8px;background:#231b0d;color:#f2bd54;font-size:9px;line-height:1.45}@media(max-width:650px){.garage-backup-setting{grid-column:auto}.gb-status{grid-template-columns:1fr 1fr}.gb-status>div:last-child{grid-column:1/-1}.gb-preview-grid{grid-template-columns:1fr 1fr}}`;
    document.head.appendChild(s);
  }
  function ensureCard(){
    const settings=document.querySelector('#settingsBox .settings');if(!settings)return null;
    let card=document.getElementById('garageBackupSetting');if(card)return card;
    card=document.createElement('div');card.className='setting garage-backup-setting';card.id='garageBackupSetting';
    card.innerHTML=`<div class="label">Backup &amp; Recovery</div><strong>Whole Garage Backup</strong><p>Export every Garage vehicle and restore the complete local Fuel Tracker state from one backup file.</p><div class="gb-status" id="garageBackupStatus"></div><div class="actions"><button type="button" class="primary" id="garageBackupExport">EXPORT GARAGE</button><button type="button" class="secondary" id="garageBackupImport">RESTORE GARAGE</button><input type="file" id="garageBackupInput" accept=".json,application/json" hidden></div><div class="gb-preview" id="garageRestorePreview" hidden></div>`;
    settings.appendChild(card);
    card.querySelector('#garageBackupExport').onclick=exportGarage;
    card.querySelector('#garageBackupImport').onclick=()=>card.querySelector('#garageBackupInput').click();
    card.querySelector('#garageBackupInput').onchange=e=>{importGarageFile(e.target.files?.[0]);e.target.value='';};
    return card;
  }
  function renderStatus(){
    const card=ensureCard(),status=card?.querySelector('#garageBackupStatus');if(!status)return;
    const s=summaryFromState(state);
    status.innerHTML=`<div><small>Vehicles</small><strong>${s.vehicles}</strong></div><div><small>Fuel Records</small><strong>${s.records}</strong></div><div><small>Last Garage Backup</small><strong>${garage()?.lastGarageBackupAt?escLocal(fmtDate(garage().lastGarageBackupAt)):'Never'}</strong></div>`;
  }
  function setVersion(){const badge=document.querySelector('.brand small');if(badge)badge.textContent=APP_VERSION;document.title='Fuel Tracker v15.6';}
  function refresh(){installStyles();ensureCard();renderStatus();setVersion();}

  if(!garage()?.profiles?.length)return;
  garage().backupRevision=REV;saveState?.();refresh();
  document.addEventListener('click',e=>{if(e.target.closest('[data-profile-switch],[data-profile-open],#garageModalSave,#garageAddProfile,#garageHeaderAdd,#odoSaveBtn,#newDbBtn,#clearBtn,#settingsBtn'))setTimeout(refresh,80);});
  document.getElementById('fuelForm')?.addEventListener('submit',()=>setTimeout(refresh,100));
  document.addEventListener('fueltracker:datachange',()=>setTimeout(refresh,80));
})();
