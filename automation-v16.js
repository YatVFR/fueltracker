(function(){
  'use strict';
  if(window.FuelTrackerAutomation)return;

  const REV='v16.0-refuel-automation-2';
  const APP_VERSION='v16.0 Automation';
  const APP_NUMBER='16.0';
  const SETTINGS_KEY='fueltrackerV160AutomationSettings';
  const STATIONS_KEY='fueltrackerV160Stations';
  const INBOX_KEY='fueltrackerV160PossibleRefuels';
  const DEFAULTS={enabled:false,radius:150,dwellMinutes:3,notifications:false};
  let watchId=null,currentVisit=null,dwellTimer=null;
  let confirmingKey='',ignoredAreaKey='';

  const clone=v=>JSON.parse(JSON.stringify(v));
  const load=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key));return v??clone(fallback);}catch(e){return clone(fallback);}};
  const save=(key,v)=>localStorage.setItem(key,JSON.stringify(v));
  const settings=()=>Object.assign({},DEFAULTS,load(SETTINGS_KEY,DEFAULTS));
  const stations=()=>Array.isArray(load(STATIONS_KEY,[]))?load(STATIONS_KEY,[]):[];
  const inbox=()=>Array.isArray(load(INBOX_KEY,[]))?load(INBOX_KEY,[]):[];
  const uid=()=>`pr-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function installStyles(){
    if(document.getElementById('v160AutomationStyles'))return;
    const s=document.createElement('style');s.id='v160AutomationStyles';s.textContent=`
      .v160-auto{border:1px solid #2a3945!important;background:linear-gradient(180deg,#0e171e,#091017)!important}.v160-auto-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.v160-auto-head b{display:block;font-size:12px}.v160-auto-head small{display:block;margin-top:3px;color:#7f8b96;font-size:8px}.v160-pill{font-size:7px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;border:1px solid #30414f;border-radius:999px;padding:5px 7px;color:#8fa1ae}.v160-pill.on{color:#69db82;border-color:#315d3b;background:#102218}
      .v160-auto-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:11px}.v160-auto-control{border:1px solid #26343f;border-radius:9px;padding:8px;background:#081016;min-width:0}.v160-auto-control label{display:block;color:#87939e;font-size:7px;text-transform:uppercase;letter-spacing:.07em;margin-bottom:5px}.v160-auto-control select,.v160-auto-control input{width:100%;min-width:0}.v160-status{margin-top:9px;padding:8px 9px;border:1px solid #26343f;border-radius:9px;background:#081016;font-size:8px;color:#8d9aa4;line-height:1.45}.v160-status strong{color:#e7edf1}.v160-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}.v160-actions button{font-size:8px;padding:8px 10px}.v160-station-add{display:grid;grid-template-columns:1.2fr 1fr auto;gap:6px;margin-top:9px}.v160-stations,.v160-inbox{display:grid;gap:6px;margin-top:8px}.v160-station,.v160-detection{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;border:1px solid #25333e;border-radius:8px;background:#080f15;padding:8px}.v160-station b,.v160-detection b{display:block;font-size:9px}.v160-station small,.v160-detection small{display:block;margin-top:2px;color:#7d8a94;font-size:7px}.v160-station button,.v160-detection button{font-size:7px;padding:6px 7px}.v160-detection-actions{display:flex;gap:4px}.v160-empty{font-size:8px;color:#74818b;padding:4px 0}.v160-section-label{margin-top:12px;font-size:7px;color:#87939e;text-transform:uppercase;letter-spacing:.08em;font-weight:900}
      .v160-auto-indicator{min-width:66px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4px 8px;border:1px solid #33424d;border-radius:8px;background:#091017;color:#9ba8b1;line-height:1;text-align:center;box-sizing:border-box;cursor:pointer}.v160-auto-indicator strong{font-size:16px;line-height:1;font-weight:950;letter-spacing:.02em}.v160-auto-indicator span{margin-top:4px;font-size:6.5px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.v160-auto-indicator.on{border-color:#315d3b;background:#0d1b13;color:#69db82}.v160-auto-indicator.off{color:#8a97a1}
      .v160-station-confirm{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:flex-end;justify-content:center;padding:18px;background:rgba(0,0,0,.62);backdrop-filter:blur(5px)}.v160-station-confirm-card{width:min(430px,100%);border:1px solid #30414d;border-radius:16px;background:#091118;padding:14px;box-shadow:0 24px 70px rgba(0,0,0,.58)}.v160-station-confirm-card h3{margin:0;font-size:14px}.v160-station-confirm-card p{margin:5px 0 10px;color:#8d9aa4;font-size:9px;line-height:1.45}.v160-station-choice{display:flex;width:100%;justify-content:space-between;align-items:center;gap:10px;text-align:left;margin-top:6px;padding:10px;border:1px solid #293844;border-radius:10px;background:#0d171f;color:#eef3f6}.v160-station-choice b{font-size:10px}.v160-station-choice small{font-size:8px;color:#8c9aa4}.v160-station-cancel{width:100%;margin-top:8px;padding:9px;border:1px solid #3a4650;border-radius:9px;background:transparent;color:#9aa6ae;font-size:9px;font-weight:850}
      @media(max-width:560px){.v160-auto-grid{grid-template-columns:1fr 1fr}.v160-station-add{grid-template-columns:1fr 1fr}.v160-station-add button{grid-column:1/-1}.v160-detection{grid-template-columns:1fr}.v160-detection-actions{justify-content:flex-start}.v160-auto-indicator{min-width:60px;padding:4px 6px}.v160-auto-indicator strong{font-size:15px}.v160-station-confirm{padding:10px}}
    `;document.head.appendChild(s);
  }

  function ownVersion(){
    window.FUEL_TRACKER_VERSION=APP_VERSION;window.FUEL_TRACKER_VERSION_NUMBER=APP_NUMBER;
    const brand=document.querySelector('.brand');
    if(brand&&!brand.dataset.v160Owned){const next=brand.cloneNode(true);next.dataset.v160Owned='1';brand.replaceWith(next);}
    const title=document.querySelector('title');
    if(title&&!title.dataset.v160Owned){const next=document.createElement('title');next.dataset.v160Owned='1';title.replaceWith(next);}
    const badge=document.querySelector('.brand small');if(badge)badge.textContent=APP_VERSION;
    document.title='Fuel Tracker v'+APP_NUMBER;
  }

  function notificationState(){return typeof Notification==='undefined'?'Unavailable':Notification.permission;}
  function geoStateText(){return !navigator.geolocation?'Unavailable':watchId!=null?'Monitoring while app is open':'Ready when enabled';}

  function ensureAutoIndicator(){
    const actions=document.querySelector('.head-actions');if(!actions)return null;
    let indicator=document.getElementById('v160AutoIndicator');
    if(!indicator){
      indicator=document.createElement('button');indicator.type='button';indicator.id='v160AutoIndicator';indicator.className='v160-auto-indicator off';
      indicator.innerHTML='<strong>OFF</strong><span>Auto Detect</span>';
      indicator.addEventListener('click',openAutomationSettings);
      actions.appendChild(indicator);
    }
    return indicator;
  }

  function updateAutoIndicator(){
    const indicator=ensureAutoIndicator();if(!indicator)return;
    const on=!!settings().enabled;
    indicator.classList.toggle('on',on);indicator.classList.toggle('off',!on);
    const text=indicator.querySelector('strong');if(text)text.textContent=on?'ON':'OFF';
    indicator.title=on?'Refuel auto detection is on':'Refuel auto detection is off';
    indicator.setAttribute('aria-label',`Refuel auto detection ${on?'on':'off'}. Open automation settings.`);
  }

  function openAutomationSettings(){
    window.FuelTrackerNavigation?.showPage?.('settings',true);
    setTimeout(()=>document.getElementById('v160AutomationCard')?.scrollIntoView({behavior:'smooth',block:'center'}),90);
  }

  function stationOptions(){
    const select=document.getElementById('station');if(!select)return ['Other'];
    return [...select.options].map(o=>o.value).filter(Boolean);
  }

  function ensureCard(){
    const root=document.querySelector('#settingsBox .settings');if(!root)return null;
    let card=document.getElementById('v160AutomationCard');if(card)return card;
    card=document.createElement('div');card.className='setting v160-auto';card.id='v160AutomationCard';root.appendChild(card);return card;
  }

  function renderCard(){
    installStyles();updateAutoIndicator();const card=ensureCard();if(!card)return;const cfg=settings(),saved=stations(),pending=inbox().filter(x=>x.status==='pending');
    card.innerHTML=`
      <div class="v160-auto-head"><div><div class="label">Refuel Automation</div><b>Petrol Station Detection</b><small>Foreground geofence foundation for v16.0</small></div><span class="v160-pill ${cfg.enabled?'on':''}">${cfg.enabled?'Enabled':'Off'}</span></div>
      <p>When Fuel Tracker is open, monitor saved petrol-station geofences. When a station area is detected, confirm the correct station before the dwell timer starts.</p>
      <div class="v160-auto-grid">
        <div class="v160-auto-control"><label>Detection</label><select id="v160Enabled"><option value="0" ${!cfg.enabled?'selected':''}>Off</option><option value="1" ${cfg.enabled?'selected':''}>On</option></select></div>
        <div class="v160-auto-control"><label>Station Radius</label><select id="v160Radius">${[100,150,250].map(v=>`<option value="${v}" ${cfg.radius===v?'selected':''}>${v} m</option>`).join('')}</select></div>
        <div class="v160-auto-control"><label>Minimum Stop</label><input id="v160Dwell" type="number" min="1" max="60" step="1" inputmode="numeric" value="${Math.min(60,Math.max(1,Number(cfg.dwellMinutes)||3))}"><div class="v160-dwell-help" style="margin-top:4px;font-size:7px;color:#72808a">1–60 min</div></div>
      </div>
      <div class="v160-status"><strong>Automation Status</strong><br>Location: ${esc(geoStateText())} · Notifications: ${esc(notificationState())}<br>${cfg.enabled?'Detection runs while Fuel Tracker remains active. Station confirmation is required before dwell timing starts.':'Turn Detection on when you want foreground monitoring.'}</div>
      <div class="v160-actions"><button type="button" class="primary" id="v160NotifyBtn">ENABLE NOTIFICATIONS</button><button type="button" class="secondary" id="v160TestBtn">TEST NOTIFICATION</button></div>
      <div class="v160-section-label">Save Petrol Station Geofence</div>
      <div class="v160-station-add"><input id="v160StationName" placeholder="e.g. Petronas Tebrau"><select id="v160StationType">${stationOptions().map(v=>`<option>${esc(v)}</option>`).join('')}</select><button type="button" class="secondary" id="v160SaveHereBtn">SAVE THIS LOCATION</button></div>
      <div class="v160-stations">${saved.length?saved.map(s=>`<div class="v160-station"><div><b>${esc(s.name)}</b><small>${esc(s.station)} · ${Number(s.lat).toFixed(5)}, ${Number(s.lng).toFixed(5)}</small></div><button type="button" class="danger" data-v160-remove="${esc(s.id)}">REMOVE</button></div>`).join(''):'<div class="v160-empty">No petrol-station geofences saved yet.</div>'}</div>
      <div class="v160-section-label">Possible Refuels</div>
      <div class="v160-inbox">${pending.length?pending.map(renderDetection).join(''):'<div class="v160-empty">No pending detected refuels.</div>'}</div>`;
    bindCard();
  }

  function renderDetection(x){
    const when=new Date(x.detectedAt).toLocaleString();
    return `<div class="v160-detection"><div><b>⛽ ${esc(x.name||x.station||'Petrol station')}</b><small>${esc(when)} · ${esc(x.dwellMinutes)} min stop</small></div><div class="v160-detection-actions"><button type="button" class="primary" data-v160-confirm="${esc(x.id)}">ENTER REFUEL</button><button type="button" class="secondary" data-v160-dismiss="${esc(x.id)}">DISMISS</button></div></div>`;
  }

  function bindCard(){
    document.getElementById('v160Enabled')?.addEventListener('change',e=>{const cfg=settings();cfg.enabled=e.target.value==='1';save(SETTINGS_KEY,cfg);cfg.enabled?startMonitoring():stopMonitoring();updateAutoIndicator();renderCard();});
    document.getElementById('v160Radius')?.addEventListener('change',e=>{const cfg=settings();cfg.radius=Number(e.target.value)||150;save(SETTINGS_KEY,cfg);restartMonitoring();renderCard();});
    const dwell=document.getElementById('v160Dwell');
    const saveDwell=()=>{if(!dwell)return;const cfg=settings();const n=Math.round(Number(dwell.value));cfg.dwellMinutes=Number.isFinite(n)?Math.min(60,Math.max(1,n)):3;dwell.value=String(cfg.dwellMinutes);save(SETTINGS_KEY,cfg);if(currentVisit)restartMonitoring();};
    dwell?.addEventListener('change',saveDwell);dwell?.addEventListener('blur',saveDwell);
    document.getElementById('v160NotifyBtn')?.addEventListener('click',requestNotifications);
    document.getElementById('v160TestBtn')?.addEventListener('click',()=>notify('⛽ Fuel Tracker Automation','Notifications are ready for Possible Refuel reminders.','test'));
    document.getElementById('v160SaveHereBtn')?.addEventListener('click',saveCurrentStation);
    cardClickBindings();
  }

  function cardClickBindings(){
    const card=document.getElementById('v160AutomationCard');if(!card)return;
    card.querySelectorAll('[data-v160-remove]').forEach(b=>b.onclick=()=>{save(STATIONS_KEY,stations().filter(s=>s.id!==b.dataset.v160Remove));renderCard();restartMonitoring();});
    card.querySelectorAll('[data-v160-confirm]').forEach(b=>b.onclick=()=>openDetection(b.dataset.v160Confirm));
    card.querySelectorAll('[data-v160-dismiss]').forEach(b=>b.onclick=()=>dismissDetection(b.dataset.v160Dismiss));
  }

  async function requestNotifications(){
    if(typeof Notification==='undefined'){alert('Notifications are not supported in this browser.');return;}
    try{const permission=await Notification.requestPermission();const cfg=settings();cfg.notifications=permission==='granted';save(SETTINGS_KEY,cfg);renderCard();if(permission==='granted')notify('Fuel Tracker Automation','Refuel reminders are enabled.','permission');}catch(e){alert('Unable to request notification permission.');}
  }

  async function notify(title,body,id){
    if(typeof Notification==='undefined'||Notification.permission!=='granted')return false;
    try{
      const reg=await navigator.serviceWorker?.ready;
      if(reg?.showNotification){await reg.showNotification(title,{body,tag:'fueltracker-refuel-'+id,data:{url:`./?page=refuel&possibleRefuel=${encodeURIComponent(id)}`}});return true;}
      new Notification(title,{body});return true;
    }catch(e){return false;}
  }

  function saveCurrentStation(){
    if(!navigator.geolocation){alert('Location is not available on this device.');return;}
    const name=String(document.getElementById('v160StationName')?.value||'').trim();
    const station=String(document.getElementById('v160StationType')?.value||'Other');
    if(!name){alert('Enter a name for this petrol station first.');return;}
    navigator.geolocation.getCurrentPosition(pos=>{
      const list=stations();list.push({id:'st-'+Date.now(),name,station,lat:pos.coords.latitude,lng:pos.coords.longitude,createdAt:new Date().toISOString()});save(STATIONS_KEY,list);renderCard();restartMonitoring();
    },()=>alert('Unable to save this location. Check Location permission for Fuel Tracker.'),{enableHighAccuracy:true,timeout:12000,maximumAge:0});
  }

  function distanceM(a,b){
    const R=6371000,toRad=v=>v*Math.PI/180,dLat=toRad(b.lat-a.lat),dLon=toRad(b.lng-a.lng),lat1=toRad(a.lat),lat2=toRad(b.lat);
    const x=Math.sin(dLat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;return 2*R*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
  }

  function areaKey(candidates){return candidates.map(x=>x.s.id).sort().join('|');}

  function closeStationConfirmation(){document.getElementById('v160StationConfirm')?.remove();confirmingKey='';}

  function beginVisit(station){
    closeStationConfirmation();clearVisit();ignoredAreaKey='';
    currentVisit={stationId:station.id,enteredAt:Date.now(),station};
    const cfg=settings();dwellTimer=setTimeout(()=>completeDwell(currentVisit),cfg.dwellMinutes*60000);
    renderCard();
  }

  function showStationConfirmation(candidates,key){
    if(confirmingKey===key&&document.getElementById('v160StationConfirm'))return;
    closeStationConfirmation();confirmingKey=key;
    const wrap=document.createElement('div');wrap.id='v160StationConfirm';wrap.className='v160-station-confirm';wrap.setAttribute('role','dialog');wrap.setAttribute('aria-modal','true');wrap.setAttribute('aria-label','Confirm petrol station');
    wrap.innerHTML=`<div class="v160-station-confirm-card"><h3>Confirm petrol station</h3><p>GPS can place nearby stations inside the same radius. Choose the station you are actually at before Fuel Tracker starts the dwell timer.</p>${candidates.map(x=>`<button type="button" class="v160-station-choice" data-v160-station-choice="${esc(x.s.id)}"><b>${esc(x.s.name)}</b><small>${Math.round(x.d)} m away</small></button>`).join('')}<button type="button" class="v160-station-cancel" id="v160StationNotHere">Not at a petrol station</button></div>`;
    document.body.appendChild(wrap);
    wrap.querySelectorAll('[data-v160-station-choice]').forEach(btn=>btn.onclick=()=>{const chosen=candidates.find(x=>x.s.id===btn.dataset.v160StationChoice);if(chosen)beginVisit(chosen.s);});
    document.getElementById('v160StationNotHere').onclick=()=>{ignoredAreaKey=key;clearVisit();closeStationConfirmation();};
  }

  function onPosition(pos){
    const cfg=settings();if(!cfg.enabled)return;const here={lat:pos.coords.latitude,lng:pos.coords.longitude};
    const nearby=stations().map(s=>({s,d:distanceM(here,s)})).filter(x=>x.d<=cfg.radius).sort((a,b)=>a.d-b.d);
    if(!nearby.length){ignoredAreaKey='';closeStationConfirmation();clearVisit();return;}
    if(currentVisit&&nearby.some(x=>x.s.id===currentVisit.stationId))return;
    const key=areaKey(nearby);if(ignoredAreaKey===key)return;
    clearVisit();showStationConfirmation(nearby,key);
  }

  function completeDwell(visit){
    if(!visit||currentVisit?.stationId!==visit.stationId)return;const cfg=settings();
    const x={id:uid(),status:'pending',stationId:visit.stationId,name:visit.station.name,station:visit.station.station,lat:visit.station.lat,lng:visit.station.lng,detectedAt:new Date().toISOString(),enteredAt:new Date(visit.enteredAt).toISOString(),dwellMinutes:cfg.dwellMinutes};
    const list=inbox();list.unshift(x);save(INBOX_KEY,list.slice(0,50));renderCard();notify('⛽ Possible Refuel',`You have been at ${visit.station.name} for ${cfg.dwellMinutes} minutes. Tap to enter refuel details.`,x.id);
  }

  function clearVisit(){if(dwellTimer){clearTimeout(dwellTimer);dwellTimer=null;}currentVisit=null;}
  function startMonitoring(){
    updateAutoIndicator();if(watchId!=null||!navigator.geolocation||!settings().enabled||!stations().length)return;
    watchId=navigator.geolocation.watchPosition(onPosition,()=>{}, {enableHighAccuracy:true,maximumAge:15000,timeout:20000});renderCard();
  }
  function stopMonitoring(){if(watchId!=null&&navigator.geolocation){navigator.geolocation.clearWatch(watchId);watchId=null;}clearVisit();closeStationConfirmation();ignoredAreaKey='';updateAutoIndicator();}
  function restartMonitoring(){stopMonitoring();if(settings().enabled)startMonitoring();}

  function dismissDetection(id){const list=inbox();const x=list.find(v=>v.id===id);if(x)x.status='dismissed';save(INBOX_KEY,list);renderCard();}
  function localDateTime(iso){const d=new Date(iso);const pad=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;}
  function openDetection(id){
    const x=inbox().find(v=>v.id===id);if(!x)return;
    window.FuelTrackerNavigation?.showPage?.('refuel',true);
    const dt=document.getElementById('dateTime');if(dt)dt.value=localDateTime(x.detectedAt);
    const station=document.getElementById('station');if(station){const exists=[...station.options].some(o=>o.value===x.station);station.value=exists?x.station:'Other';station.dispatchEvent(new Event('change',{bubbles:true}));}
    const notes=document.getElementById('notes');if(notes&&!notes.value)notes.value=`Possible refuel detected at ${x.name}.`;
    const list=inbox();const item=list.find(v=>v.id===id);if(item)item.status='opened';save(INBOX_KEY,list);renderCard();
    setTimeout(()=>document.querySelector('.refuel-card')?.scrollIntoView({behavior:'smooth',block:'start'}),80);
  }

  function receiveDetection(payload){
    const cfg=settings(),x={id:payload?.id||uid(),status:'pending',stationId:payload?.stationId||null,name:payload?.name||payload?.station||'Petrol station',station:payload?.station||'Other',lat:payload?.lat??null,lng:payload?.lng??null,detectedAt:payload?.detectedAt||new Date().toISOString(),enteredAt:payload?.enteredAt||null,dwellMinutes:Number(payload?.dwellMinutes||cfg.dwellMinutes)};
    const list=inbox();if(!list.some(v=>v.id===x.id)){list.unshift(x);save(INBOX_KEY,list.slice(0,50));}renderCard();notify('⛽ Possible Refuel',`Possible refuel detected at ${x.name}. Tap to enter details.`,x.id);return x;
  }

  function handleLaunch(){const q=new URLSearchParams(location.search),page=q.get('page'),id=q.get('possibleRefuel');if(page&&window.FuelTrackerNavigation?.showPage)window.FuelTrackerNavigation.showPage(page,false);if(id)setTimeout(()=>openDetection(id),100);}

  function refresh(){ownVersion();renderCard();updateAutoIndicator();if(settings().enabled)startMonitoring();}
  installStyles();ownVersion();renderCard();updateAutoIndicator();handleLaunch();if(settings().enabled)startMonitoring();
  document.addEventListener('fueltracker:datachange',()=>setTimeout(refresh,80));
  document.addEventListener('fueltracker:pagechange',e=>{if(e.detail?.page==='settings')setTimeout(renderCard,30);});
  document.addEventListener('click',e=>{if(e.target.closest('[data-profile-switch],#bikeBtn,#carBtn'))setTimeout(renderCard,60);});

  window.FuelTrackerAutomation={revision:REV,version:APP_VERSION,settings,stations,inbox,startMonitoring,stopMonitoring,receiveDetection,openDetection,openAutomationSettings,updateAutoIndicator};
})();
