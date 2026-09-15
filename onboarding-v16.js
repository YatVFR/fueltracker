(function(){
  'use strict';
  if(window.FuelTrackerOnboardingV16)return;

  const REV='v16.4.1-onboarding-3';
  const KEY='fueltrackerV164Onboarding';
  const BACKUP_KEY='fueltrackerV164BackupPreference';
  const AUTOMATION_KEY='fueltrackerV160AutomationSettings';
  const DEFAULT_PATH='Apps/GitHub/Fuel_Tracker';

  const field=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null');}catch(e){return null;}};
  const save=v=>localStorage.setItem(KEY,JSON.stringify(v));
  const activeProfile=()=>{try{const g=state?.garageV15;return g?.profiles?.find(p=>p.id===g.activeProfileId)||g?.profiles?.[0]||null;}catch(e){return null;}};
  const profileData=p=>{try{if(!p)return null;return p.legacy?state.garageV15.legacy[p.type]:p.data;}catch(e){return null;}};
  function automationSettings(){try{return Object.assign({enabled:false,radius:150,dwellMinutes:3,notifications:false},JSON.parse(localStorage.getItem(AUTOMATION_KEY)||'{}'));}catch(e){return {enabled:false,radius:150,dwellMinutes:3,notifications:false};}}

  function installStyles(){
    if(field('v1641OnboardingStyles'))return;
    const s=document.createElement('style');s.id='v1641OnboardingStyles';s.textContent=`
      .ft-onboard{position:fixed;inset:0;z-index:2147483600;background:rgba(3,7,10,.84);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:14px}.ft-onboard-card{width:min(480px,100%);max-height:92vh;overflow:auto;border:1px solid #30414d;border-radius:18px;background:#091118;padding:16px;box-shadow:0 28px 90px rgba(0,0,0,.65)}.ft-onboard-card h2{margin:0;font-size:18px}.ft-onboard-card>p{margin:6px 0 13px;color:#8d9aa4;font-size:10px;line-height:1.5}.ft-ob-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ft-ob-grid .field{margin:0}.ft-ob-note{margin-top:9px;padding:9px;border:1px solid #293844;border-radius:9px;background:#0b151c;color:#84919b;font-size:8px;line-height:1.45}.ft-ob-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px}.ft-ob-actions button{padding:11px;border-radius:9px;font-size:9px;font-weight:900}.ft-ob-actions .primary{background:var(--accent,#137fe8);border:1px solid #315d86;color:white}.ft-ob-actions .secondary{background:#0d151c;border:1px solid #35434e;color:#a9b2b9}.ft-tour{position:fixed;inset:0;z-index:2147483650;background:rgba(0,0,0,.58);pointer-events:auto}.ft-tour-card{position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));margin:auto;max-width:430px;border:1px solid #30414d;border-radius:15px;background:#091118;padding:14px;box-shadow:0 22px 70px rgba(0,0,0,.62)}.ft-tour-card small{color:#6f7f8a;font-size:7px;text-transform:uppercase;letter-spacing:.08em}.ft-tour-card h3{margin:5px 0 4px;font-size:14px}.ft-tour-card p{margin:0;color:#8d9aa4;font-size:9px;line-height:1.45}.ft-tour-actions{display:flex;justify-content:space-between;gap:7px;margin-top:11px}.ft-tour-actions button{padding:8px 10px;border-radius:8px;font-size:8px;font-weight:900}.ft-tour-target{position:relative!important;z-index:2147483651!important;box-shadow:0 0 0 3px rgba(90,162,255,.75),0 0 0 9999px rgba(0,0,0,.18)!important;border-radius:10px}.ft-tour-restart{margin-top:8px;width:100%;padding:8px;border:1px solid #35434e;border-radius:8px;background:#0d151c;color:#a9b2b9;font-size:8px;font-weight:850}@media(max-width:560px){.ft-ob-grid{grid-template-columns:1fr}.ft-ob-actions{grid-template-columns:1fr}}
    `;document.head.appendChild(s);
  }

  function backupPreference(path){
    const p=String(path||DEFAULT_PATH).trim().replace(/^iCloud Drive\s*[→/>-]*\s*/i,'')||DEFAULT_PATH;
    const pref={provider:'iCloud Drive',path:p,displayPath:'iCloud Drive → '+p.split('/').filter(Boolean).join(' → '),mode:'user-mediated-files-save',updatedAt:new Date().toISOString()};
    localStorage.setItem(BACKUP_KEY,JSON.stringify(pref));
    try{const g=state?.garageV15;if(g){g.backupTarget={...(g.backupTarget||{}),...pref};saveState?.();}}catch(e){}
    document.dispatchEvent(new CustomEvent('fueltracker:backuptargetchange',{detail:pref}));return pref;
  }

  function currentDefaults(){
    const p=activeProfile(),d=profileData(p)||{};let odo='';try{odo=state?.currentOdometer?.[p?.type||state?.mode]?.value??d?.odometer?.value??'';}catch(e){}
    let bp;try{bp=JSON.parse(localStorage.getItem(BACKUP_KEY)||'null');}catch(e){}
    const a=automationSettings();return {type:p?.type||state?.mode||'bike',registration:d.registration||state?.registrations?.[p?.type||state?.mode]||'',name:p?.name||'',make:p?.make||'',model:p?.model||'',odometer:odo,currency:localStorage.getItem('fueltrackerDefaultCurrency')||'SGD',backupPath:bp?.path||DEFAULT_PATH,autoDetect:!!a.enabled};
  }

  function showSetup(force=false){
    installStyles();if(field('ftOnboarding'))return;const existing=load();if(existing?.completed&&!force)return;const d=currentDefaults(),wrap=document.createElement('div');wrap.id='ftOnboarding';wrap.className='ft-onboard';
    wrap.innerHTML=`<div class="ft-onboard-card"><h2>Welcome to Fuel Tracker</h2><p>Set up your vehicle, refuel defaults and backup preference. You can change these later.</p><div class="ft-ob-grid"><div class="field"><label>Vehicle Type</label><select id="ftObType"><option value="bike" ${d.type==='bike'?'selected':''}>Bike</option><option value="car" ${d.type==='car'?'selected':''}>Car</option></select></div><div class="field"><label>Registration</label><input id="ftObReg" value="${esc(d.registration)}" placeholder="e.g. FXX1234A"></div><div class="field"><label>Vehicle Name</label><input id="ftObName" value="${esc(d.name)}" placeholder="e.g. My Bike"></div><div class="field"><label>Make / Model</label><input id="ftObModel" value="${esc([d.make,d.model].filter(Boolean).join(' '))}" placeholder="e.g. BMW R1250 GS"></div><div class="field"><label>Current Odometer (KM)</label><input id="ftObOdo" type="number" min="0" step="1" value="${esc(d.odometer)}" placeholder="Optional"></div><div class="field"><label>Default Currency</label><select id="ftObCurrency"><option value="SGD" ${d.currency==='SGD'?'selected':''}>SGD</option><option value="MYR" ${d.currency==='MYR'?'selected':''}>MYR</option></select></div><div class="field"><label>Auto Detect Stations</label><select id="ftObAuto"><option value="0" ${!d.autoDetect?'selected':''}>Off</option><option value="1" ${d.autoDetect?'selected':''}>On</option></select></div></div><div class="field" style="margin-top:9px"><label>Preferred iCloud Backup Folder</label><input id="ftObBackup" value="${esc(d.backupPath)}" placeholder="Apps/GitHub/Fuel_Tracker"></div><div class="ft-ob-note"><strong>Auto Detect:</strong> Fuel Tracker can monitor saved station geofences while the app is active. Turning it on requests Location permission. A station must be saved once before it can be recognized automatically.</div><div class="ft-ob-note"><strong>iCloud:</strong> On iPhone/iPad, Fuel Tracker remembers this preferred path but you still confirm the destination in Share/Save to Files.</div><div class="ft-ob-actions"><button type="button" class="secondary" id="ftObSkip">SKIP FOR NOW</button><button type="button" class="primary" id="ftObSave">SAVE & START TOUR</button></div></div>`;
    document.body.appendChild(wrap);field('ftObSkip').onclick=()=>{save({completed:true,skipped:true,completedAt:new Date().toISOString()});wrap.remove();};field('ftObSave').onclick=completeSetup;
  }

  function chooseProfile(type){try{const g=state?.garageV15,p=g?.profiles?.find(x=>x.type===type);if(p){g.activeProfileId=p.id;return p;}}catch(e){}return activeProfile();}
  function applyDefaultCurrency(){const c=localStorage.getItem('fueltrackerDefaultCurrency')||'SGD',el=field('currency');if(el){el.value=c;el.dispatchEvent(new Event('change',{bubbles:true}));}}
  function hookDefaultCurrency(){if(window.__ftCurrencyResetHook)return;const base=window.resetForm;if(typeof base!=='function')return;window.__ftCurrencyResetHook=true;window.resetForm=function(){base();applyDefaultCurrency();};applyDefaultCurrency();}

  function completeSetup(){
    const type=field('ftObType').value,reg=field('ftObReg').value.trim().toUpperCase(),name=field('ftObName').value.trim(),modelText=field('ftObModel').value.trim(),odoRaw=field('ftObOdo').value,currency=field('ftObCurrency').value,path=field('ftObBackup').value.trim()||DEFAULT_PATH,auto=field('ftObAuto').value==='1';
    try{
      const p=chooseProfile(type);state.mode=type;state.registrations=state.registrations||{};state.registrations[type]=reg;if(p){if(name)p.name=name;const parts=modelText.split(/\s+/).filter(Boolean);if(parts.length){p.make=parts.shift()||p.make||'';p.model=parts.join(' ')||p.model||'';}const d=profileData(p);if(d)d.registration=reg;}
      const odo=odoRaw===''?null:Number(odoRaw);if(odo!=null&&Number.isFinite(odo)&&odo>=0){state.currentOdometer=state.currentOdometer||{};state.currentOdometer[type]={value:odo,updatedAt:new Date().toISOString()};const d=profileData(p);if(d)d.odometer={value:odo,updatedAt:new Date().toISOString()};}
      localStorage.setItem('fueltrackerDefaultCurrency',currency);const a=automationSettings();a.enabled=auto;localStorage.setItem(AUTOMATION_KEY,JSON.stringify(a));saveState?.();renderAll?.();applyDefaultCurrency();
      if(auto&&navigator.geolocation)navigator.geolocation.getCurrentPosition(()=>window.FuelTrackerStationReliabilityV16?.restart?.(),()=>{}, {enableHighAccuracy:true,timeout:12000,maximumAge:0});
    }catch(e){console.warn('Onboarding profile save',e);}
    backupPreference(path);save({completed:true,completedAt:new Date().toISOString(),type,registration:reg,currency,autoDetect:auto});field('ftOnboarding')?.remove();setTimeout(()=>startTour(),120);
  }

  const STEPS=[
    {page:'dashboard',sel:'.vehicle-switch',title:'Your Garage',text:'Switch between Bike and Car profiles here.'},
    {page:'dashboard',sel:'.dashboard',title:'Fuel Dashboard',text:'Review efficiency, spending and your selected reporting period.'},
    {page:'refuel',sel:'.refuel-card',title:'Add a Refuel',text:'Enter manually or use Scan & Prefill for pump and odometer photos.'},
    {page:'settings',sel:'#v160AutoIndicator',title:'Auto Detect',text:'Monitors saved station geofences while Fuel Tracker is active. Save each station once first.'},
    {page:'settings',sel:'[data-v158-page="settings"]',title:'Settings & Backups',text:'Manage Garage profiles, detection health and your preferred iCloud backup target.'}
  ];
  let tourIndex=0,tourTarget=null;
  function clearTarget(){tourTarget?.classList.remove('ft-tour-target');tourTarget=null;}
  function startTour(){installStyles();tourIndex=0;renderTour();}
  function renderTour(){
    clearTarget();field('ftTour')?.remove();if(tourIndex>=STEPS.length){finishTour();return;}const step=STEPS[tourIndex];if(step.page)window.FuelTrackerNavigation?.showPage?.(step.page,false);setTimeout(()=>{const target=document.querySelector(step.sel);if(target){tourTarget=target;target.classList.add('ft-tour-target');target.scrollIntoView?.({behavior:'smooth',block:'center'});}const wrap=document.createElement('div');wrap.id='ftTour';wrap.className='ft-tour';wrap.innerHTML=`<div class="ft-tour-card"><small>App Tour · ${tourIndex+1}/${STEPS.length}</small><h3>${esc(step.title)}</h3><p>${esc(step.text)}</p><div class="ft-tour-actions"><button type="button" class="secondary" id="ftTourSkip">SKIP TOUR</button><button type="button" class="primary" id="ftTourNext">${tourIndex===STEPS.length-1?'FINISH':'NEXT'}</button></div></div>`;document.body.appendChild(wrap);field('ftTourSkip').onclick=finishTour;field('ftTourNext').onclick=()=>{tourIndex++;renderTour();};},60);
  }
  function finishTour(){clearTarget();field('ftTour')?.remove();const x=load()||{};x.tourCompleted=true;x.tourCompletedAt=new Date().toISOString();save(x);window.FuelTrackerNavigation?.showPage?.('dashboard',false);}
  function addRestartButton(){const root=document.querySelector('#settingsBox .settings');if(!root||field('ftTourRestart'))return;const b=document.createElement('button');b.id='ftTourRestart';b.type='button';b.className='ft-tour-restart';b.textContent='RUN APP TOUR / STARTUP SETUP';b.onclick=()=>showSetup(true);root.appendChild(b);}

  installStyles();[200,700,1500].forEach(ms=>setTimeout(()=>{hookDefaultCurrency();addRestartButton();showSetup(false);},ms));document.addEventListener('fueltracker:pagechange',e=>{if(e.detail?.page==='settings')setTimeout(addRestartButton,80);});window.FuelTrackerOnboardingV16={revision:REV,showSetup,startTour,backupPreference,applyDefaultCurrency};
})();