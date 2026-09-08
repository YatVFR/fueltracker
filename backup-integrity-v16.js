(function(){
  'use strict';
  if(window.FuelTrackerBackupIntegrityV16)return;
  const REV='v16.3.7-backup-integrity-1';
  const AUDIT_KEY='fueltrackerV1637LastRestoreAudit';
  const MONTH_KEY='fueltrackerV14SelectedMonth';
  const clone=v=>JSON.parse(JSON.stringify(v));
  function api(){return window.FuelTrackerGarageBackupV16||null;}
  function toast(msg,tone='info'){if(window.FuelTrackerToast)return window.FuelTrackerToast(msg,tone);alert(msg);}
  function backupName(){const d=new Date(),p=n=>String(n).padStart(2,'0');return `FuelTracker-Garage-v16.3.7-${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.json`;}
  function sameSummary(a,b){return ['vehicles','records','maintenance','upgrades','review','verified','photos'].every(k=>Number(a?.[k]||0)===Number(b?.[k]||0));}
  async function exportGarage(){
    const a=api();if(!a?.buildBackup){toast('Garage backup is not ready yet.','warn');return;}
    const payload=a.buildBackup();payload.version=16.37;payload.exportedBy='v16.3.7 Backup & Context';
    const name=backupName(),json=JSON.stringify(payload,null,2);
    try{
      let result;
      if(typeof window.FuelTrackerExportFile==='function')result=await window.FuelTrackerExportFile(json,name,'application/json');
      else{const blob=new Blob([json],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;document.body.appendChild(link);link.click();setTimeout(()=>{link.remove();URL.revokeObjectURL(url);},2500);result={method:'download'};}
      try{if(state?.garageV15){state.garageV15.lastGarageBackupAt=payload.exportedAt;state.garageV15.backupRevision=REV;saveState?.();}}catch(e){}
      toast(result?.method==='share'?`Garage backup ready to save/share: ${name}`:`Download started: ${name}`,'ok');
    }catch(err){console.error('Garage export failed',err);toast('Garage backup could not be exported.','warn');}
  }
  function validate(raw){if(!raw||raw.kind!=='garage-backup'||!raw.state?.garageV15?.profiles?.length)throw new Error('Invalid Garage backup');return raw;}
  function restoreFile(file){
    if(!file)return;const reader=new FileReader();reader.onload=()=>{
      try{
        const raw=validate(JSON.parse(reader.result)),a=api();if(!a?.normalizeRestoredState||!a?.summaryFromState)throw new Error('Restore engine unavailable');
        const expected=a.summaryFromState(raw.state);
        const msg=`Restore ${file.name}?\n\n${expected.vehicles} vehicles · ${expected.records} fuel records · ${expected.maintenance} maintenance · ${expected.upgrades} upgrades · ${expected.verified} verified · ${expected.review} review`;
        if(!confirm(msg))return;
        const restored=a.normalizeRestoredState(raw.state),actual=a.summaryFromState(restored);
        if(!sameSummary(expected,actual)){console.error('Restore integrity mismatch',{expected,actual});alert('Restore stopped because the backup totals did not match after validation. Your current Garage was not replaced.');return;}
        state=restored;
        if(raw.localPreferences?.selectedMonth!=null)localStorage.setItem(MONTH_KEY,raw.localPreferences.selectedMonth);else localStorage.removeItem(MONTH_KEY);
        localStorage.setItem(AUDIT_KEY,JSON.stringify({at:new Date().toISOString(),file:file.name,expected:clone(expected)}));
        saveState?.();window.location.reload();
      }catch(err){console.error('Garage restore failed',err);alert('Unable to restore this Garage backup.');}
    };reader.readAsText(file);
  }
  function hook(){
    const card=document.getElementById('garageBackupSetting');if(!card||card.dataset.v1637Hook)return false;card.dataset.v1637Hook='1';
    const oldExport=card.querySelector('#garageBackupExport');if(oldExport){const b=oldExport.cloneNode(true);oldExport.replaceWith(b);b.onclick=exportGarage;}
    const oldImport=card.querySelector('#garageBackupImport'),oldInput=card.querySelector('#garageBackupInput');
    if(oldImport&&oldInput){const b=oldImport.cloneNode(true),i=oldInput.cloneNode(true);oldImport.replaceWith(b);oldInput.replaceWith(i);b.onclick=()=>i.click();i.onchange=e=>{restoreFile(e.target.files?.[0]);e.target.value='';};}
    return true;
  }
  function audit(){
    const raw=localStorage.getItem(AUDIT_KEY);if(!raw)return;try{const info=JSON.parse(raw),a=api();if(!a?.summaryFromState)return;const now=a.summaryFromState(state);if(sameSummary(info.expected,now)){localStorage.removeItem(AUDIT_KEY);toast(`Garage restored successfully · ${now.verified} verified · ${now.review} review`,'ok');}else{localStorage.removeItem(AUDIT_KEY);console.error('Post-restore audit mismatch',{expected:info.expected,actual:now});alert(`Garage restored, but the post-restore audit found a mismatch. Expected ${info.expected.verified} verified records; found ${now.verified}.`);}}catch(e){localStorage.removeItem(AUDIT_KEY);}
  }
  [100,400,1000,1800].forEach(ms=>setTimeout(()=>{hook();audit();},ms));
  document.addEventListener('fueltracker:pagechange',e=>{if(e.detail?.page==='settings')setTimeout(()=>{hook();audit();},80);});
  window.FuelTrackerBackupIntegrityV16={revision:REV,exportGarage,restoreFile,hook,audit};
})();