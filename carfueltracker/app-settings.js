(() => {
  'use strict';
  if(window.__fuelSettingsV13Loaded) return;
  window.__fuelSettingsV13Loaded=true;

  const THEME_KEY='fuelTrackerTheme';
  const ONBOARDING_KEY='fuelTrackerMasterDbOnboarded';
  const IDB_NAME='FuelTrackerSettings';
  const IDB_STORE='handles';
  const HANDLE_KEY='masterDb';
  const THEMES=[
    {id:'honda',label:'Honda',swatch:'#e40521'},
    {id:'yamaha',label:'Yamaha',swatch:'#2457d6'},
    {id:'zontes',label:'Zontes',swatch:'#63d3c4'},
    {id:'ducati',label:'Ducati',swatch:'#d71920'},
    {id:'ktm',label:'KTM',swatch:'#f57c00'}
  ];
  const $=id=>document.getElementById(id);
  const storageKey=()=>typeof STORAGE_KEY==='string'?STORAGE_KEY:'fuelTrackerData';
  const masterFile=()=>typeof MASTER_FILE==='string'?MASTER_FILE:(document.getElementById('backupFileName')?.textContent?.trim()||'FuelTrackerData.json');
  const hasWorkingDb=()=>localStorage.getItem(storageKey())!==null;

  function applyTheme(theme){
    const valid=THEMES.some(t=>t.id===theme)?theme:'honda';
    document.body.dataset.theme=valid;
    localStorage.setItem(THEME_KEY,valid);
    document.querySelectorAll('.theme-option').forEach(btn=>btn.classList.toggle('active',btn.dataset.theme===valid));
    const badge=$('settingsThemeBadge'); if(badge) badge.textContent=THEMES.find(t=>t.id===valid).label.toUpperCase()+' INSPIRED';
  }

  function openDb(){
    return new Promise((resolve,reject)=>{
      if(!('indexedDB' in window)){reject(new Error('IndexedDB unavailable'));return;}
      const req=indexedDB.open(IDB_NAME,1);
      req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(IDB_STORE))db.createObjectStore(IDB_STORE);};
      req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error('Unable to open settings database'));
    });
  }
  async function saveHandle(handle){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(IDB_STORE,'readwrite');tx.objectStore(IDB_STORE).put(handle,HANDLE_KEY);tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>{db.close();reject(tx.error);};});}
  async function getHandle(){try{const db=await openDb();return await new Promise((resolve,reject)=>{const tx=db.transaction(IDB_STORE,'readonly');const req=tx.objectStore(IDB_STORE).get(HANDLE_KEY);req.onsuccess=()=>{db.close();resolve(req.result||null);};req.onerror=()=>{db.close();reject(req.error);};});}catch(e){return null;}}

  function payload(){
    if(typeof buildBackupPayload==='function') return buildBackupPayload();
    let entries=[];try{const parsed=JSON.parse(localStorage.getItem(storageKey())||'[]');if(Array.isArray(parsed))entries=parsed;}catch(e){}
    return {app:'Fuel Tracker',version:13,database:masterFile(),exportedAt:new Date().toISOString(),entries};
  }
  function toast(text){const old=$('masterDbToast');if(old)old.remove();const el=document.createElement('div');el.className='masterdb-toast';el.id='masterDbToast';el.textContent=text;document.body.appendChild(el);setTimeout(()=>el.remove(),2600);}
  function markOnboarded(){localStorage.setItem(ONBOARDING_KEY,'1');const modal=$('masterDbOnboarding');if(modal)modal.remove();refreshMasterStatus();}
  function updateMetaForFile(fileName,exportedAt){try{if(typeof loadMeta==='function'&&typeof saveMeta==='function'){const meta=loadMeta();meta.fileName=fileName||masterFile();meta.lastBackup=exportedAt||new Date().toISOString();meta.pendingChanges=0;saveMeta(meta);if(typeof updateBackupStatus==='function')updateBackupStatus();}}catch(e){}}

  async function permission(handle,mode='readwrite',request=true){
    if(!handle) return false;
    const opts={mode};
    if(typeof handle.queryPermission==='function' && await handle.queryPermission(opts)==='granted') return true;
    if(request && typeof handle.requestPermission==='function') return (await handle.requestPermission(opts))==='granted';
    return false;
  }
  async function writeHandle(handle){
    if(!await permission(handle,'readwrite',true)) throw new Error('File permission not granted');
    const writable=await handle.createWritable();await writable.write(JSON.stringify(payload(),null,2));await writable.close();
    updateMetaForFile(handle.name,new Date().toISOString());localStorage.setItem(ONBOARDING_KEY,'1');toast('MasterDB saved and linked.');refreshMasterStatus();
  }
  async function importHandle(handle){
    if(!await permission(handle,'read',true)) throw new Error('File permission not granted');
    const file=await handle.getFile();const parsed=JSON.parse(await file.text());const incoming=Array.isArray(parsed)?parsed:parsed.entries;if(!Array.isArray(incoming))throw new Error('Invalid Fuel Tracker database');
    if(hasWorkingDb() && !confirm(`Replace the current working copy with ${incoming.length} entries from ${file.name}?`)) return false;
    const cleaned=typeof normalizeEntry==='function'?incoming.map(normalizeEntry):incoming;
    localStorage.setItem(storageKey(),JSON.stringify(cleaned));updateMetaForFile(file.name,parsed.exportedAt||new Date().toISOString());localStorage.setItem(ONBOARDING_KEY,'1');if(typeof displayEntries==='function')displayEntries();toast(`${cleaned.length} records loaded from MasterDB.`);return true;
  }

  async function locateMasterDb(){
    try{
      if(typeof window.showOpenFilePicker==='function'){
        const [handle]=await window.showOpenFilePicker({multiple:false,types:[{description:'Fuel Tracker JSON',accept:{'application/json':['.json']}}]});
        if(!handle)return;await importHandle(handle);await saveHandle(handle);markOnboarded();
      }else{
        const input=$('replaceFileInput');if(!input)throw new Error('File import control unavailable');input.click();
      }
    }catch(error){if(error?.name!=='AbortError'){toast('Unable to open MasterDB. Use Restore / Replace below.');scrollToBackup();}}
  }
  async function createMasterDb(){
    if(!hasWorkingDb())localStorage.setItem(storageKey(),'[]');
    localStorage.setItem(ONBOARDING_KEY,'1');
    try{
      if(typeof window.showSaveFilePicker==='function'){
        const handle=await window.showSaveFilePicker({suggestedName:masterFile(),types:[{description:'Fuel Tracker JSON',accept:{'application/json':['.json']}}]});
        await saveHandle(handle);await writeHandle(handle);markOnboarded();
      }else{
        if(typeof saveJsonBackup==='function')saveJsonBackup();else downloadPayload();markOnboarded();toast(`New ${masterFile()} generated. Keep it in a safe folder.`);
      }
    }catch(error){if(error?.name!=='AbortError'){markOnboarded();toast('Working database created. Use Save Master DB to export the file.');}}
    if(typeof displayEntries==='function')displayEntries();
  }
  function downloadPayload(){const blob=new Blob([JSON.stringify(payload(),null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=masterFile();document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);}
  async function syncMasterDb(){const handle=await getHandle();if(handle){try{await writeHandle(handle);return;}catch(e){}}if(typeof saveJsonBackup==='function'){saveJsonBackup();toast('MasterDB exported.');}else downloadPayload();}
  async function reloadMasterDb(){const handle=await getHandle();if(handle){try{if(await importHandle(handle)){markOnboarded();return;}}catch(e){}}locateMasterDb();}
  function scrollToBackup(){const panel=document.querySelector('.backup-panel');if(panel){panel.scrollIntoView({behavior:'smooth',block:'center'});panel.style.outline='2px solid var(--theme-accent,#00a3e0)';setTimeout(()=>panel.style.outline='',1800);}}

  async function refreshMasterStatus(){
    const status=$('masterDbStatus'),sub=$('masterDbStatusSub');if(!status||!sub)return;
    const handle=await getHandle();
    if(handle){const granted=await permission(handle,'readwrite',false);status.textContent=granted?`Linked: ${handle.name}`:`Remembered: ${handle.name}`;sub.textContent=granted?'Direct file access available. Save/Reload can use this MasterDB.':'Tap Locate / Reload to re-authorize file access.';return;}
    if(hasWorkingDb()){status.textContent=`Working copy active • ${masterFile()}`;sub.textContent='Browser storage is active. Use Locate to restore an existing MasterDB or Save/Sync to export updates.';}
    else{status.textContent='MasterDB not configured';sub.textContent='Locate an existing database or create a new one.';}
  }

  function buildSettings(){
    if($('appSettingsPanel'))return;
    const anchor=$('installPanel')||document.querySelector('.backup-panel');if(!anchor)return;
    const panel=document.createElement('section');panel.className='app-settings-panel';panel.id='appSettingsPanel';
    panel.innerHTML=`<div class="app-settings-head"><div class="app-settings-title">App Settings</div><div class="app-settings-badge" id="settingsThemeBadge">THEME</div></div><div class="masterdb-row"><div class="masterdb-card"><div class="setting-label">Master Database</div><div class="setting-value" id="masterDbStatus">Checking…</div><div class="setting-sub" id="masterDbStatusSub">Checking browser file capability.</div><div class="masterdb-actions"><button type="button" class="setting-btn primary" id="locateMasterDbBtn">LOCATE / RELOAD</button><button type="button" class="setting-btn" id="syncMasterDbBtn">SAVE / SYNC</button><button type="button" class="setting-btn" id="createMasterDbBtn">NEW DB</button></div></div><div class="theme-card"><div class="setting-label">Dashboard Theme</div><div class="setting-value">Choose your machine-inspired look</div><div class="setting-sub">Visual styling only. Fuel records and calculations are unchanged.</div><div class="theme-picker">${THEMES.map(t=>`<button type="button" class="theme-option" data-theme="${t.id}" style="--swatch:${t.swatch}"><span class="theme-swatch"></span>${t.label}<br>Inspired</button>`).join('')}</div></div></div>`;
    anchor.parentNode.insertBefore(panel,anchor);
    $('locateMasterDbBtn').addEventListener('click',reloadMasterDb);$('syncMasterDbBtn').addEventListener('click',syncMasterDb);$('createMasterDbBtn').addEventListener('click',()=>{if(confirm('Create a new empty MasterDB? Your current browser records will not be deleted.'))createMasterDb();});
    panel.querySelectorAll('.theme-option').forEach(btn=>btn.addEventListener('click',()=>applyTheme(btn.dataset.theme)));
    applyTheme(localStorage.getItem(THEME_KEY)||'honda');refreshMasterStatus();
  }

  function showOnboarding(){
    if(hasWorkingDb()||localStorage.getItem(ONBOARDING_KEY)==='1'||$('masterDbOnboarding'))return;
    const modal=document.createElement('div');modal.className='masterdb-onboarding';modal.id='masterDbOnboarding';modal.innerHTML=`<div class="masterdb-dialog" role="dialog" aria-modal="true" aria-labelledby="masterDbTitle"><h2 id="masterDbTitle">Set up your MasterDB</h2><p>Fuel Tracker needs a master database for your fuel history. Locate an existing JSON database, or create a new empty database for first-time use.</p><div class="masterdb-choice"><button type="button" id="onboardLocate"><strong>📂 Locate MasterDB</strong><span>Choose an existing Fuel Tracker JSON file and load its records.</span></button><button type="button" id="onboardCreate"><strong>＋ Create New DB</strong><span>Start clean and generate ${masterFile()} for safekeeping.</span></button></div><div class="masterdb-note">The app keeps a working copy in browser storage. Where supported, Fuel Tracker also remembers the selected file handle. Otherwise Save / Sync exports the latest MasterDB for you.</div></div>`;document.body.appendChild(modal);
    $('onboardLocate').addEventListener('click',locateMasterDb);$('onboardCreate').addEventListener('click',createMasterDb);
  }

  function watchFallbackImport(){const input=$('replaceFileInput');if(!input)return;input.addEventListener('change',()=>{setTimeout(()=>{if(input.files?.length){localStorage.setItem(ONBOARDING_KEY,'1');$('masterDbOnboarding')?.remove();refreshMasterStatus();}},700);});}
  function init(){applyTheme(localStorage.getItem(THEME_KEY)||'honda');buildSettings();watchFallbackImport();showOnboarding();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
