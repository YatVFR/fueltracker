(function(){
  'use strict';
  if(window.FuelTrackerICloudBackupTargetV16)return;

  const REV='v16.4.1-icloud-backup-target-2';
  const PREF_KEY='fueltrackerV164BackupPreference';
  const DEFAULT_PATH='Apps/GitHub/Fuel_Tracker';
  const DEFAULT_LABEL='iCloud Drive → Apps → GitHub → Fuel_Tracker';
  const LATEST_FILE='FuelTracker-Garage-Latest.json';

  function garage(){try{return typeof state!=='undefined'?state.garageV15||null:null;}catch(e){return null;}}
  function pad(n){return String(n).padStart(2,'0');}
  function archiveName(){const d=new Date();return `FuelTracker-Garage-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.json`;}
  function normalizePath(v){return String(v||'').trim().replace(/^iCloud Drive\s*[→/>-]*\s*/i,'').replace(/\\/g,'/').replace(/^\/+|\/+$/g,'')||DEFAULT_PATH;}
  function displayPath(path){return 'iCloud Drive → '+normalizePath(path).split('/').filter(Boolean).join(' → ');}
  function readPref(){
    let local=null;try{local=JSON.parse(localStorage.getItem(PREF_KEY)||'null');}catch(e){}
    const g=garage(),existing=g?.backupTarget||{};const path=normalizePath(local?.path||existing.path||DEFAULT_PATH);
    return {provider:'iCloud Drive',path,displayPath:local?.displayPath||existing.displayPath||displayPath(path),latestFile:LATEST_FILE,mode:'user-mediated-files-save'};
  }
  function saveTarget(){const g=garage(),pref=readPref();if(!g)return pref;g.backupTarget={...(g.backupTarget||{}),...pref,updatedAt:new Date().toISOString()};try{saveState?.();}catch(e){}return pref;}
  function setPreference(path){const p=normalizePath(path),pref={provider:'iCloud Drive',path:p,displayPath:displayPath(p),latestFile:LATEST_FILE,mode:'user-mediated-files-save',updatedAt:new Date().toISOString()};localStorage.setItem(PREF_KEY,JSON.stringify(pref));const g=garage();if(g){g.backupTarget={...(g.backupTarget||{}),...pref};try{saveState?.();}catch(e){}}hook();return pref;}
  function payload(){const pref=saveTarget();const api=window.FuelTrackerGarageBackupV16;if(!api?.buildBackup)throw new Error('Garage backup module unavailable');const out=api.buildBackup();out.version=16.41;out.backupTarget={provider:'iCloud Drive',path:pref.path,preferredFile:LATEST_FILE};return out;}
  async function exportTo(name){
    let p;try{p=payload();}catch(err){console.error(err);alert('Garage backup is not ready yet. Please try again.');return;}
    const pref=readPref(),text=JSON.stringify(p,null,2),exporter=window.FuelTrackerExportFile;setStatus(`Preparing ${name}…`);
    try{
      if(typeof exporter==='function'){
        const result=await exporter(text,name,'application/json');
        setStatus(result?.method==='share'?`Share Sheet opened · Save to ${pref.path}`:`Download started · move/save to ${pref.path}`);
      }else{
        const blob=new Blob([text],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(url);},3000);setStatus(`Download started · save to ${pref.path}`);
      }
      const g=garage();if(g){g.lastGarageBackupAt=p.exportedAt;g.lastGarageBackupFile=name;g.lastGarageBackupTarget=pref.path;g.backupRevision=REV;try{saveState?.();}catch(e){}}
    }catch(err){console.error('iCloud-target Garage export failed',err);setStatus('Export failed. Please try again.',true);alert('Unable to prepare the Garage backup.');}
  }
  function setStatus(text,error){const el=document.getElementById('v1638ICloudStatus');if(!el)return;el.textContent=text;el.style.color=error?'#e88989':'#8f9aa3';}
  function installStyles(){
    if(document.getElementById('v1638ICloudStyles'))return;const s=document.createElement('style');s.id='v1638ICloudStyles';s.textContent=`
      .v1638-icloud{margin:10px 0;padding:10px;border:1px solid #2e4050;border-radius:10px;background:#09121a}.v1638-icloud-label{font-size:7px;color:#7f8b96;text-transform:uppercase;letter-spacing:.08em}.v1638-icloud-path{display:block;margin-top:5px;color:#8fc6ff;font-size:10px;line-height:1.4;word-break:break-word}.v1638-icloud-note{margin-top:6px;color:#7f8b96;font-size:8px;line-height:1.45}.v1638-icloud-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:8px}.v1638-icloud-actions button{padding:9px;border-radius:8px;font-size:8px;font-weight:900}.v1638-icloud-actions .latest{border:1px solid #315d86;background:var(--accent,#137fe8);color:#fff}.v1638-icloud-actions .archive{border:1px solid #35434e;background:#0d151c;color:#a9b2b9}.v1638-icloud-status{margin-top:7px;font-size:8px;line-height:1.4}.v1641-target-edit{display:flex;gap:6px;margin-top:8px}.v1641-target-edit input{flex:1;min-width:0}.v1641-target-edit button{font-size:7px;padding:7px 8px}@media(max-width:520px){.v1638-icloud-actions{grid-template-columns:1fr}.v1641-target-edit{display:grid;grid-template-columns:1fr}}
    `;document.head.appendChild(s);
  }
  function hook(){
    installStyles();const pref=saveTarget(),card=document.getElementById('garageBackupSetting');if(!card)return false;
    let box=document.getElementById('v1638ICloudTarget');if(!box){
      box=document.createElement('div');box.id='v1638ICloudTarget';box.className='v1638-icloud';const actions=card.querySelector('.actions');actions?.insertAdjacentElement('beforebegin',box);
    }
    box.innerHTML=`<div class="v1638-icloud-label">Preferred iCloud Backup Folder</div><strong class="v1638-icloud-path">${pref.displayPath}</strong><div class="v1641-target-edit"><input id="v1641BackupPath" value="${pref.path}" placeholder="Apps/GitHub/Fuel_Tracker"><button type="button" class="secondary" id="v1641SaveTarget">SAVE TARGET</button></div><div class="v1638-icloud-note">iOS requires you to confirm the destination in the Share/Save to Files sheet. Fuel Tracker remembers this preference but cannot silently write to an arbitrary iCloud folder.</div><div class="v1638-icloud-actions"><button type="button" class="latest" id="v1638SaveLatest">SAVE LATEST TO ICLOUD</button><button type="button" class="archive" id="v1638SaveArchive">SAVE DATED ARCHIVE</button></div><div class="v1638-icloud-status" id="v1638ICloudStatus">Latest file: ${LATEST_FILE}</div>`;
    box.querySelector('#v1641SaveTarget').onclick=()=>setPreference(box.querySelector('#v1641BackupPath').value);
    box.querySelector('#v1638SaveLatest').onclick=()=>exportTo(LATEST_FILE);box.querySelector('#v1638SaveArchive').onclick=()=>exportTo(archiveName());
    const old=card.querySelector('#garageBackupExport');if(old){old.textContent='EXPORT GARAGE';old.title='Standard Garage export. Preferred iCloud buttons are shown above.';}return true;
  }

  saveTarget();hook();[120,500,1200].forEach(ms=>setTimeout(hook,ms));document.addEventListener('fueltracker:pagechange',e=>{if(e.detail?.page==='settings')setTimeout(hook,60);});document.addEventListener('fueltracker:datachange',()=>setTimeout(hook,80));document.addEventListener('fueltracker:backuptargetchange',()=>setTimeout(hook,40));
  window.FuelTrackerICloudBackupTargetV16={revision:REV,get target(){return readPref().path;},latestFile:LATEST_FILE,hook,setPreference,exportLatest:()=>exportTo(LATEST_FILE),exportArchive:()=>exportTo(archiveName())};
})();