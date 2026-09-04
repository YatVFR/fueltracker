(function(){
  'use strict';

  const REV='v15.7-stabilization-4';
  const APP_VERSION='v15.7 Garage';
  const APP_NUMBER='15.7';
  const LEGACY_MONTH_KEY='fueltrackerV14SelectedMonth';
  const PROFILE_MONTH_KEY='fueltrackerV157ProfileMonths';
  const VALID_TYPES=new Set(['bike','car']);

  function clone(v){return JSON.parse(JSON.stringify(v));}
  function garage(){return state?.garageV15||null;}
  function profiles(){return Array.isArray(garage()?.profiles)?garage().profiles:[];}
  function activeProfile(){
    const g=garage();
    return profiles().find(p=>p?.id===g?.activeProfileId)||profiles().find(p=>VALID_TYPES.has(p?.type))||profiles()[0]||null;
  }
  function defaultTheme(type){return type==='bike'?'honda':'generic';}
  function validTheme(type,id){
    const list=type==='bike'?(typeof bikeThemes!=='undefined'?bikeThemes:[]):(typeof carThemes!=='undefined'?carThemes:[]);
    return list.some(t=>t.id===id)?id:defaultTheme(type);
  }
  function emptyData(type){return {records:[],registration:'',theme:defaultTheme(type),odometer:{value:null,updatedAt:null}};}
  function normalizeData(type,input){
    const d=input&&typeof input==='object'?input:emptyData(type);
    if(!Array.isArray(d.records))d.records=[];
    d.registration=String(d.registration||'').trim().toUpperCase();
    d.theme=validTheme(type,String(d.theme||''));
    const n=Number(d.odometer?.value);
    if(!d.odometer||typeof d.odometer!=='object'||!Number.isFinite(n)||n<0)d.odometer={value:null,updatedAt:null};
    else d.odometer={value:n,updatedAt:d.odometer.updatedAt||null};
    return d;
  }

  function repairGarageState(){
    const g=garage();
    if(!g||!Array.isArray(g.profiles)||!g.profiles.length)return {changed:false,repairs:0,issues:0};
    let changed=false,repairs=0,issues=0;
    g.legacy=g.legacy&&typeof g.legacy==='object'?g.legacy:{};

    for(const type of ['bike','car']){
      const before=JSON.stringify(g.legacy[type]||null);
      g.legacy[type]=normalizeData(type,g.legacy[type]);
      if(JSON.stringify(g.legacy[type])!==before){changed=true;repairs++;}
    }

    const seen=new Set();
    g.profiles.forEach(p=>{
      if(!p||typeof p!=='object'){issues++;return;}
      if(!VALID_TYPES.has(p.type)){issues++;return;}
      if(!p.id||seen.has(p.id)){
        p.id='vehicle-'+Date.now()+'-'+Math.random().toString(36).slice(2,8);
        changed=true;repairs++;
      }
      seen.add(p.id);
      const oldName=p.name;
      p.name=String(p.name||((p.type==='bike')?'Bike':'Car')).trim()||((p.type==='bike')?'Bike':'Car');
      if(p.name!==oldName){changed=true;repairs++;}
      if(!p.legacy)p.data=normalizeData(p.type,p.data);
      if(typeof p.make!=='string'){p.make='';changed=true;repairs++;}
      if(typeof p.model!=='string'){p.model='';changed=true;repairs++;}
      if(typeof p.year!=='string'){p.year='';changed=true;repairs++;}
      if(typeof p.notes!=='string'){p.notes='';changed=true;repairs++;}
      if(!('tankCapacity' in p)){p.tankCapacity=null;changed=true;repairs++;}
    });

    let active=g.profiles.find(p=>p?.id===g.activeProfileId&&VALID_TYPES.has(p?.type));
    if(!active){
      active=g.profiles.find(p=>VALID_TYPES.has(p?.type));
      if(active){g.activeProfileId=active.id;changed=true;repairs++;}
      else issues++;
    }

    state.records=state.records&&typeof state.records==='object'?state.records:{};
    state.registrations=state.registrations&&typeof state.registrations==='object'?state.registrations:{};
    state.selected=state.selected&&typeof state.selected==='object'?state.selected:{};
    state.currentOdometer=state.currentOdometer&&typeof state.currentOdometer==='object'?state.currentOdometer:{};

    for(const type of ['bike','car']){
      if(!Array.isArray(state.records[type])){state.records[type]=clone(g.legacy[type].records);changed=true;repairs++;}
      if(typeof state.registrations[type]!=='string'){state.registrations[type]=g.legacy[type].registration;changed=true;repairs++;}
      const theme=validTheme(type,state.selected[type]);
      if(state.selected[type]!==theme){state.selected[type]=theme;changed=true;repairs++;}
      const odo=state.currentOdometer[type];
      const n=Number(odo?.value);
      if(!odo||typeof odo!=='object'||(!Number.isFinite(n)&&odo?.value!=null)||n<0){state.currentOdometer[type]=clone(g.legacy[type].odometer);changed=true;repairs++;}
    }

    if(active)state.mode=active.type;
    g.stabilizationRevision=REV;
    g.lastIntegrityCheckAt=new Date().toISOString();
    g.lastIntegrityRepairs=repairs;
    g.lastIntegrityIssues=issues;
    saveState?.();
    return {changed,repairs,issues};
  }

  function setVersion(){
    window.FUEL_TRACKER_VERSION=APP_VERSION;
    window.FUEL_TRACKER_VERSION_NUMBER=APP_NUMBER;
    const badge=document.querySelector('.brand small');
    if(badge&&badge.textContent!==APP_VERSION)badge.textContent=APP_VERSION;
    const title='Fuel Tracker v'+APP_NUMBER;
    if(document.title!==title)document.title=title;
  }

  function monthMap(){
    try{return JSON.parse(localStorage.getItem(PROFILE_MONTH_KEY)||'{}')||{};}catch(e){return {};}
  }
  function legacyMonths(){
    try{return JSON.parse(localStorage.getItem(LEGACY_MONTH_KEY)||'{}')||{};}catch(e){return {};}
  }
  function writeLegacyMonths(v){localStorage.setItem(LEGACY_MONTH_KEY,JSON.stringify(v));}
  function saveMonthFor(p){
    if(!p||!VALID_TYPES.has(p.type))return;
    const legacy=legacyMonths(),value=legacy[p.type];if(!value)return;
    const map=monthMap();map[p.id]=value;localStorage.setItem(PROFILE_MONTH_KEY,JSON.stringify(map));
  }
  function saveActiveMonth(){saveMonthFor(activeProfile());}
  function applyActiveMonth(){
    const p=activeProfile();if(!p||!VALID_TYPES.has(p.type))return;
    const map=monthMap(),value=map[p.id];if(!value)return;
    const legacy=legacyMonths();legacy[p.type]=value;writeLegacyMonths(legacy);
  }
  function migrateMonths(){
    const legacy=legacyMonths(),map=monthMap();let changed=false;
    profiles().forEach(p=>{if(VALID_TYPES.has(p?.type)&&p.id&&!map[p.id]&&legacy[p.type]){map[p.id]=legacy[p.type];changed=true;}});
    if(changed)localStorage.setItem(PROFILE_MONTH_KEY,JSON.stringify(map));
    applyActiveMonth();
  }

  function wrapGarageRestoreValidation(){
    const input=document.getElementById('garageBackupInput');
    if(!input||input.dataset.v157Guarded==='1'||typeof input.onchange!=='function')return;
    const original=input.onchange;
    input.dataset.v157Guarded='1';
    input.onchange=function(e){
      const file=e.target.files?.[0];
      if(!file){return original.call(this,e);}
      const reader=new FileReader();
      reader.onload=()=>{
        try{
          const raw=JSON.parse(reader.result);
          if(raw?.kind!=='garage-backup'||!raw?.state?.garageV15?.profiles?.length)throw new Error('invalid');
          const schema=Number(raw.schema||1),version=Number(raw.version||0);
          if(!Number.isFinite(schema)||schema>1){
            alert(`This Garage backup uses schema ${raw.schema}, which is newer than Fuel Tracker v${APP_NUMBER} supports. Update Fuel Tracker before restoring it.`);
            e.target.value='';return;
          }
          if(Number.isFinite(version)&&version>15.7){
            alert(`This backup was created by Fuel Tracker v${raw.version}. Update this app before restoring a newer-version Garage backup.`);
            e.target.value='';return;
          }
          const ids=new Set();
          for(const p of raw.state.garageV15.profiles){
            if(!p||!VALID_TYPES.has(p.type)||!p.id||ids.has(p.id))throw new Error('profile');
            ids.add(p.id);
          }
          original.call(this,e);
        }catch(err){
          console.error('v15.7 Garage backup guard',err);
          alert('This file does not contain a compatible Fuel Tracker Garage backup.');
          e.target.value='';
        }
      };
      reader.onerror=()=>{alert('Unable to read this Garage backup file.');e.target.value='';};
      reader.readAsText(file);
    };
  }

  function installHealthBadge(result){
    const settings=document.querySelector('#settingsBox .settings');if(!settings)return;
    let card=document.getElementById('v157StabilityCard');
    if(!card){
      card=document.createElement('div');card.className='setting';card.id='v157StabilityCard';
      card.innerHTML='<div class="label">Stability</div><strong id="v157StabilityTitle">v15.7 Runtime Check</strong><p id="v157StabilityText"></p>';
      settings.appendChild(card);
    }
    const text=card.querySelector('#v157StabilityText');
    if(!text)return;
    if(result.issues)text.textContent=`${result.repairs} safe ${result.repairs===1?'repair':'repairs'} applied. ${result.issues} integrity ${result.issues===1?'issue requires':'issues require'} review; no profile data was deleted.`;
    else if(result.repairs)text.textContent=`${result.repairs} safe state ${result.repairs===1?'repair':'repairs'} applied at startup. Garage is ready for validation.`;
    else text.textContent='Startup integrity check passed with no repairs required.';
  }

  const result=repairGarageState();
  migrateMonths();
  setVersion();
  wrapGarageRestoreValidation();
  installHealthBadge(result);

  let lastProfileId=activeProfile()?.id||'';
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-profile-switch]'))saveActiveMonth();
  },true);
  document.addEventListener('click',()=>{
    setTimeout(()=>{
      const now=activeProfile()?.id||'';
      if(now&&now!==lastProfileId){lastProfileId=now;applyActiveMonth();}
      saveActiveMonth();setVersion();wrapGarageRestoreValidation();
    },90);
  });
  document.addEventListener('change',()=>setTimeout(()=>{saveActiveMonth();setVersion();},30));
  document.addEventListener('fueltracker:datachange',()=>setTimeout(()=>{setVersion();wrapGarageRestoreValidation();},80));

  const observer=new MutationObserver(()=>setVersion());
  const brand=document.querySelector('.brand');if(brand)observer.observe(brand,{childList:true,subtree:true});
  const titleEl=document.querySelector('title');if(titleEl)observer.observe(titleEl,{childList:true});

  window.FuelTrackerStabilization={revision:REV,version:APP_VERSION,integrity:result,runIntegrityCheck:repairGarageState};
})();
