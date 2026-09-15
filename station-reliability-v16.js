(function(){
  'use strict';
  if(window.FuelTrackerStationReliabilityV16)return;
  const REV='v16.4.1-station-reliability-2';
  let watchId=null,heartbeat=null,lastFix=null,lastError='',candidateId='',candidateHits=0,ownVisit=null,ownTimer=null;

  const api=()=>window.FuelTrackerAutomation||null;
  const settings=()=>api()?.settings?.()||{enabled:false,radius:150,dwellMinutes:3};
  const stations=()=>api()?.stations?.()||[];
  const inbox=()=>api()?.inbox?.()||[];
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function distanceM(a,b){const R=6371000,toRad=v=>v*Math.PI/180,dLat=toRad(b.lat-a.lat),dLon=toRad(b.lng-a.lng),lat1=toRad(a.lat),lat2=toRad(b.lat);const x=Math.sin(dLat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;return 2*R*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));}
  function recentDetection(stationId){const now=Date.now();return inbox().some(x=>String(x.stationId)===String(stationId)&&now-new Date(x.detectedAt||0).getTime()<20*60000&&x.status!=='dismissed');}
  function clearOwnVisit(){if(ownTimer)clearTimeout(ownTimer);ownTimer=null;ownVisit=null;}

  function statusText(){
    const cfg=settings(),saved=stations();if(!cfg.enabled)return 'Detection is OFF.';if(!navigator.geolocation)return 'Location services are unavailable in this browser.';if(!saved.length)return 'No saved station geofences. Save a station once before Auto Detect can recognize it.';if(lastError)return 'Location error: '+lastError;if(!lastFix)return 'Waiting for GPS… keep Fuel Tracker open.';
    const here={lat:lastFix.lat,lng:lastFix.lng},near=saved.map(s=>({s,d:distanceM(here,s)})).sort((a,b)=>a.d-b.d)[0],age=Math.max(0,Math.round((Date.now()-lastFix.at)/1000));return `GPS ${Math.round(lastFix.accuracy||0)} m accuracy · ${age}s ago${near?` · nearest ${near.s.name} ${Math.round(near.d)} m`:''}${ownVisit?` · dwell ${ownVisit.name}`:''}`;
  }

  function updateCopy(){
    const card=document.getElementById('v160AutomationCard');if(!card)return;const p=card.querySelector(':scope > p');if(p)p.textContent='While Fuel Tracker is active, Auto Detect monitors saved petrol-station geofences. One clear saved station can start the dwell timer automatically; overlapping nearby stations still ask you to choose.';
    const status=card.querySelector('.v160-status');if(status){const cfg=settings();status.innerHTML=`<strong>Automation Status</strong><br>Location: ${navigator.geolocation?(watchId!=null?'Monitoring while app is open':'Ready when enabled'):'Unavailable'} · Notifications: ${typeof Notification==='undefined'?'Unavailable':Notification.permission}<br>${cfg.enabled?'Foreground monitoring active. Keep Fuel Tracker open; iOS may pause location while the PWA is suspended.':'Turn Detection on when you want foreground monitoring.'}`;}
  }
  function renderDiagnostics(){
    const card=document.getElementById('v160AutomationCard');if(!card)return;updateCopy();let box=document.getElementById('v1641StationHealth');if(!box){box=document.createElement('div');box.id='v1641StationHealth';box.style.cssText='margin-top:8px;padding:8px 9px;border:1px solid #30414f;border-radius:9px;background:#0b151d;color:#8fa0ab;font-size:8px;line-height:1.45';const actions=card.querySelector('.v160-actions');actions?.insertAdjacentElement('afterend',box);}box.innerHTML=`<strong style="color:#dce6ec">Detection Health</strong><br>${esc(statusText())}<br><span style="color:#71808a">Known stations: ${stations().length}. Auto-start works for one unambiguous saved station while the app is active.</span><div style="margin-top:7px;display:flex;gap:6px;flex-wrap:wrap"><button type="button" id="v1641TestLocation" class="secondary" style="font-size:7px;padding:6px 8px">TEST LOCATION NOW</button><button type="button" id="v1641RestartDetect" class="secondary" style="font-size:7px;padding:6px 8px">RESTART DETECTION</button></div>`;document.getElementById('v1641TestLocation').onclick=testLocation;document.getElementById('v1641RestartDetect').onclick=restart;
  }

  function confirmOriginalChoice(stationId){const safe=String(stationId).replace(/\\/g,'\\\\').replace(/"/g,'\\"'),btn=document.querySelector(`[data-v160-station-choice="${safe}"]`);if(btn){btn.click();return true;}return false;}
  function startOwnDwell(station){if(ownVisit?.id===station.id||recentDetection(station.id))return;clearOwnVisit();ownVisit={id:station.id,name:station.name,station,enteredAt:Date.now()};const mins=Math.max(1,Number(settings().dwellMinutes)||3);ownTimer=setTimeout(()=>{if(!ownVisit||ownVisit.id!==station.id||recentDetection(station.id))return;api()?.receiveDetection?.({stationId:station.id,name:station.name,station:station.station,lat:station.lat,lng:station.lng,enteredAt:new Date(ownVisit.enteredAt).toISOString(),detectedAt:new Date().toISOString(),dwellMinutes:mins});clearOwnVisit();renderDiagnostics();},mins*60000);renderDiagnostics();}

  function handlePosition(pos){
    lastError='';lastFix={lat:pos.coords.latitude,lng:pos.coords.longitude,accuracy:pos.coords.accuracy||0,at:Date.now()};const cfg=settings();if(!cfg.enabled){renderDiagnostics();return;}const saved=stations();if(!saved.length){clearOwnVisit();renderDiagnostics();return;}const here={lat:lastFix.lat,lng:lastFix.lng};const nearby=saved.map(s=>({s,d:distanceM(here,s)})).filter(x=>x.d<=Number(cfg.radius||150)).sort((a,b)=>a.d-b.d);
    if(!nearby.length){candidateId='';candidateHits=0;clearOwnVisit();renderDiagnostics();return;}const unambiguous=nearby.length===1||(nearby[1].d-nearby[0].d>=40);if(!unambiguous){candidateId='';candidateHits=0;clearOwnVisit();renderDiagnostics();return;}const chosen=nearby[0].s;if(candidateId===chosen.id)candidateHits++;else{candidateId=chosen.id;candidateHits=1;}if(candidateHits<2){renderDiagnostics();return;}if(!confirmOriginalChoice(chosen.id))startOwnDwell(chosen);else{clearOwnVisit();document.getElementById('v160StationConfirm')?.remove();}renderDiagnostics();
  }
  function geoError(err){lastError=err?.message||({1:'Location permission denied',2:'Location unavailable',3:'Location timed out'}[err?.code])||'Unknown location error';renderDiagnostics();}
  function testLocation(){if(!navigator.geolocation){lastError='Geolocation unavailable';renderDiagnostics();return;}lastError='';navigator.geolocation.getCurrentPosition(handlePosition,geoError,{enableHighAccuracy:true,maximumAge:0,timeout:15000});renderDiagnostics();}
  function start(){if(watchId!=null||!navigator.geolocation||!settings().enabled)return;watchId=navigator.geolocation.watchPosition(handlePosition,geoError,{enableHighAccuracy:true,maximumAge:10000,timeout:20000});heartbeat=setInterval(()=>{if(!document.hidden&&settings().enabled)navigator.geolocation.getCurrentPosition(handlePosition,geoError,{enableHighAccuracy:true,maximumAge:10000,timeout:15000});},30000);renderDiagnostics();}
  function stop(){if(watchId!=null&&navigator.geolocation)navigator.geolocation.clearWatch(watchId);watchId=null;if(heartbeat)clearInterval(heartbeat);heartbeat=null;clearOwnVisit();candidateId='';candidateHits=0;renderDiagnostics();}
  function restart(){stop();setTimeout(start,120);}
  function sync(){setTimeout(()=>{renderDiagnostics();settings().enabled?start():stop();},80);}

  document.addEventListener('change',e=>{if(e.target?.id==='v160Enabled'||e.target?.id==='v160Radius'||e.target?.id==='v160Dwell')setTimeout(restart,100);});document.addEventListener('fueltracker:pagechange',e=>{if(e.detail?.page==='settings')setTimeout(renderDiagnostics,100);});document.addEventListener('fueltracker:datachange',sync);window.addEventListener('focus',()=>{if(settings().enabled)restart();});window.addEventListener('pageshow',()=>{if(settings().enabled)restart();});document.addEventListener('visibilitychange',()=>{if(!document.hidden&&settings().enabled)restart();});[300,900,1800].forEach(ms=>setTimeout(sync,ms));window.FuelTrackerStationReliabilityV16={revision:REV,start,stop,restart,testLocation,status:statusText};
})();