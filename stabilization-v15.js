(function(){
  'use strict';

  const REV='v15.7-stabilization-5';
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

  function escHealth(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function healthIssues(){
    const rows=[...(typeof currentRecords==='function'?currentRecords():[])];
    const issues=[],seen=new Map();
    rows.forEach(r=>{
      const location=r.location||r.station||'';
      const reasons=[];
      if(!validDate(r.dateTime))reasons.push('Invalid date/time');
      if(!(Number(r.mileage)>=0))reasons.push('Invalid odometer');
      if(!(Number(r.volume)>0))reasons.push('Invalid fuel volume');
      if(!(Number(r.cost)>=0))reasons.push('Invalid cost');
      if(!location)reasons.push('Missing fuel station');
      if(reasons.length)issues.push({id:r.id,type:'invalid',title:'Invalid refuel record',detail:reasons.join(' • '),row:r});
      const fp=[r.dateTime,r.mileage,r.volume,r.cost,r.currency,location].join('|');
      if(seen.has(fp))issues.push({id:r.id,type:'duplicate',title:'Possible duplicate',detail:'Matches another refuel with the same date, odometer, fuel, cost, currency and station.',row:r});
      else seen.set(fp,r.id);
    });
    const odo=rows.filter(r=>Number(r.mileage)>0&&validDate(r.dateTime)).sort((a,b)=>new Date(a.dateTime)-new Date(b.dateTime));
    for(let i=1;i<odo.length;i++){
      const prev=odo[i-1],cur=odo[i];
      if(Number(cur.mileage)<Number(prev.mileage)){
        issues.push({id:cur.id,type:'odometer',title:'Odometer sequence issue',detail:`${Number(cur.mileage).toLocaleString()} km is lower than the previous ${Number(prev.mileage).toLocaleString()} km record.`,row:cur,previous:prev});
      }
    }
    return issues;
  }

  function annotateHealthRows(){
    const body=document.getElementById('historyBody');if(!body)return;
    const sorted=[...(typeof currentRecords==='function'?currentRecords():[])].sort((a,b)=>new Date(b.dateTime)-new Date(a.dateTime));
    const suspect=new Set(healthIssues().map(x=>String(x.id||'')));
    [...body.querySelectorAll('tr')].forEach((tr,i)=>{
      const r=sorted[i];if(!r)return;
      tr.dataset.healthRecordId=String(r.id||'');
      tr.classList.toggle('v157-health-suspect',suspect.has(String(r.id||'')));
      const first=tr.querySelector('td');
      first?.querySelector('.v157-health-pin')?.remove();
      if(first&&suspect.has(String(r.id||''))){
        const pin=document.createElement('span');pin.className='v157-health-pin';pin.textContent='⚠ REVIEW';first.prepend(pin);
      }
    });
  }

  function locateHealthRecord(id){
    annotateHealthRows();
    const row=[...document.querySelectorAll('#historyBody tr')].find(tr=>tr.dataset.healthRecordId===String(id));
    if(!row)return;
    row.scrollIntoView({behavior:'smooth',block:'center'});
    row.classList.remove('v157-health-pulse');
    void row.offsetWidth;
    row.classList.add('v157-health-pulse');
    setTimeout(()=>row.classList.remove('v157-health-pulse'),2600);
  }

  function renderHealthIssueList(){
    const panel=document.getElementById('v15HealthDetails');if(!panel)return;
    let list=panel.querySelector('#v157HealthIssueList');
    if(!list){list=document.createElement('div');list.id='v157HealthIssueList';panel.appendChild(list);}
    const issues=healthIssues();
    if(!issues.length){list.innerHTML='';annotateHealthRows();return;}
    list.innerHTML=`<div class="v157-health-issue-head"><strong>Records requiring review</strong><span>${issues.length} ${issues.length===1?'issue':'issues'}</span></div>${issues.map(x=>{
      const d=validDate(x.row?.dateTime);
      const when=d?d.toLocaleString():'Invalid date';
      return `<div class="v157-health-issue"><div class="v157-health-issue-copy"><b>${escHealth(x.title)}</b><span>${escHealth(when)} • ${Number(x.row?.mileage||0).toLocaleString()} km</span><small>${escHealth(x.detail)}</small></div><button type="button" data-health-locate="${escHealth(x.id)}">LOCATE RECORD</button></div>`;
    }).join('')}`;
    annotateHealthRows();
  }

  function installIssueStyles(){
    if(document.getElementById('v157HealthIssueStyles'))return;
    const s=document.createElement('style');s.id='v157HealthIssueStyles';
    s.textContent=`
      #v157HealthIssueList{margin-top:10px}.v157-health-issue-head{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:7px}.v157-health-issue-head strong{font-size:10px;letter-spacing:.06em;text-transform:uppercase}.v157-health-issue-head span{font-size:8px;color:#f2bd54}
      .v157-health-issue{display:flex;align-items:center;justify-content:space-between;gap:9px;padding:9px 10px;margin-top:6px;border:1px solid #6a511f;border-radius:8px;background:#17130b}.v157-health-issue-copy{min-width:0}.v157-health-issue-copy b{display:block;font-size:10px;color:#f2bd54}.v157-health-issue-copy span{display:block;margin-top:2px;font-size:8px;color:#a8b0b7}.v157-health-issue-copy small{display:block;margin-top:4px;font-size:8px;line-height:1.35;color:#d1b36a}.v157-health-issue button{flex:0 0 auto;border:1px solid #7a5c20;border-radius:7px;background:#0d151c;color:#f2bd54;padding:7px 8px;font-size:8px;font-weight:900}
      #historyBody tr.v157-health-suspect td{background:color-mix(in srgb,#f2bd54 8%,transparent);border-top-color:#6a511f;border-bottom-color:#6a511f}#historyBody tr.v157-health-suspect td:first-child{box-shadow:inset 3px 0 0 #f2bd54}.v157-health-pin{display:inline-block;margin:0 6px 5px 0;padding:3px 5px;border:1px solid #7a5c20;border-radius:5px;background:#231b0d;color:#f2bd54;font-size:7px;font-weight:900;letter-spacing:.06em}
      #historyBody tr.v157-health-pulse td{animation:v157HealthPulse .65s ease 3}@keyframes v157HealthPulse{0%,100%{box-shadow:inset 0 0 0 0 rgba(242,189,84,0)}50%{box-shadow:inset 0 0 0 2px rgba(242,189,84,.9),0 0 18px rgba(242,189,84,.16)}}
      @media(max-width:580px){.v157-health-issue{align-items:flex-start;flex-direction:column}.v157-health-issue button{width:100%}}
    `;
    document.head.appendChild(s);
  }

  installIssueStyles();
  const baseRenderHistory=typeof renderHistory==='function'?renderHistory:null;
  if(baseRenderHistory){
    renderHistory=function(){baseRenderHistory();annotateHealthRows();setTimeout(renderHealthIssueList,0);};
  }
  document.addEventListener('click',e=>{
    const btn=e.target.closest('[data-health-locate]');
    if(btn){e.preventDefault();locateHealthRecord(btn.dataset.healthLocate);}
  });

  const result=repairGarageState();
  migrateMonths();
  setVersion();
  wrapGarageRestoreValidation();
  installHealthBadge(result);
  annotateHealthRows();
  renderHealthIssueList();

  let lastProfileId=activeProfile()?.id||'';
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-profile-switch]'))saveActiveMonth();
  },true);
  document.addEventListener('click',()=>{
    setTimeout(()=>{
      const now=activeProfile()?.id||'';
      if(now&&now!==lastProfileId){lastProfileId=now;applyActiveMonth();}
      saveActiveMonth();setVersion();wrapGarageRestoreValidation();annotateHealthRows();renderHealthIssueList();
    },90);
  });
  document.addEventListener('change',()=>setTimeout(()=>{saveActiveMonth();setVersion();annotateHealthRows();renderHealthIssueList();},30));
  document.addEventListener('fueltracker:datachange',()=>setTimeout(()=>{setVersion();wrapGarageRestoreValidation();annotateHealthRows();renderHealthIssueList();},80));

  const observer=new MutationObserver(()=>{setVersion();renderHealthIssueList();});
  const brand=document.querySelector('.brand');if(brand)observer.observe(brand,{childList:true,subtree:true});
  const titleEl=document.querySelector('title');if(titleEl)observer.observe(titleEl,{childList:true});
  const healthPanel=document.getElementById('v15HealthDetails');if(healthPanel)observer.observe(healthPanel,{childList:true,subtree:false});

  window.FuelTrackerStabilization={revision:REV,version:APP_VERSION,integrity:result,runIntegrityCheck:repairGarageState,healthIssues,locateHealthRecord};
})();
