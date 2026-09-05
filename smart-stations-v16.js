(function(){
  'use strict';
  if(window.FuelTrackerSmartStations)return;

  const REV='v16.1-smart-stations-1';
  const APP_VERSION='v16.1 Smart Stations';
  const APP_NUMBER='16.1';
  const STATIONS_KEY='fueltrackerV160Stations';

  const loadStations=()=>{
    try{const v=JSON.parse(localStorage.getItem(STATIONS_KEY)||'[]');return Array.isArray(v)?v:[];}catch(e){return [];}
  };
  const saveStations=v=>localStorage.setItem(STATIONS_KEY,JSON.stringify(v));
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function confidence(station){
    const n=Number(station?.confirmationCount)||0;
    if(n>=3)return {label:'Frequent',rank:2};
    if(n>=1)return {label:'Known',rank:1};
    return {label:'New',rank:0};
  }

  function confirmStation(id){
    const list=loadStations();
    const station=list.find(s=>String(s.id)===String(id));
    if(!station)return null;
    station.confirmationCount=(Number(station.confirmationCount)||0)+1;
    station.lastConfirmedAt=new Date().toISOString();
    saveStations(list);
    return station;
  }

  function installStyles(){
    if(document.getElementById('v161SmartStationStyles'))return;
    const s=document.createElement('style');s.id='v161SmartStationStyles';
    s.textContent=`
      .v161-confidence{display:inline-flex;align-items:center;margin-left:6px;padding:2px 5px;border:1px solid #34434e;border-radius:999px;font-size:6px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;color:#8fa0ab;vertical-align:middle}.v161-confidence.known{color:#7fb5ff;border-color:#315078;background:#0c1723}.v161-confidence.frequent{color:#74df8c;border-color:#315d3b;background:#0d1b13}
      .v161-station-meta{margin-top:4px;font-size:7px;color:#74818b;line-height:1.35}.v161-station-meta b{font-size:7px;color:#9ba8b1;font-weight:850}
      #v160StationConfirm .v160-station-choice.v161-preferred{border-color:#36516a;background:#0d1a24}.v161-choice-meta{display:block;margin-top:3px;font-size:7px;color:#7f8d97}.v161-choice-meta .v161-confidence{margin-left:0;margin-right:5px}
    `;
    document.head.appendChild(s);
  }

  function setVersion(){
    window.FUEL_TRACKER_VERSION=APP_VERSION;window.FUEL_TRACKER_VERSION_NUMBER=APP_NUMBER;
    const badge=document.querySelector('.brand small');if(badge&&badge.textContent!==APP_VERSION)badge.textContent=APP_VERSION;
    if(document.title!=='Fuel Tracker v'+APP_NUMBER)document.title='Fuel Tracker v'+APP_NUMBER;
  }

  function annotateSettingsStations(){
    const list=loadStations();
    document.querySelectorAll('#v160AutomationCard .v160-station').forEach(row=>{
      const remove=row.querySelector('[data-v160-remove]');
      if(!remove)return;
      const station=list.find(s=>String(s.id)===String(remove.dataset.v160Remove));if(!station)return;
      const info=row.querySelector('div');if(!info)return;
      info.querySelector('.v161-station-meta')?.remove();
      const c=confidence(station),count=Number(station.confirmationCount)||0;
      const last=station.lastConfirmedAt?new Date(station.lastConfirmedAt).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}):'Never confirmed';
      const meta=document.createElement('div');meta.className='v161-station-meta';
      meta.innerHTML=`<span class="v161-confidence ${c.label.toLowerCase()}">${esc(c.label)}</span> <b>${count} confirmation${count===1?'':'s'}</b> · Last: ${esc(last)}`;
      info.appendChild(meta);
    });
  }

  function reorderConfirmation(){
    const card=document.querySelector('#v160StationConfirm .v160-station-confirm-card');if(!card)return;
    const list=loadStations();
    const choices=[...card.querySelectorAll('[data-v160-station-choice]')];if(!choices.length)return;
    const parsed=choices.map(btn=>{
      const station=list.find(s=>String(s.id)===String(btn.dataset.v160StationChoice))||{};
      const small=btn.querySelector('small');
      const m=String(small?.textContent||'').match(/([\d,.]+)\s*m/);const distance=m?Number(m[1].replace(',','')):999999;
      return {btn,station,distance,c:confidence(station)};
    }).sort((a,b)=>{
      const ac=Number(a.station.confirmationCount)||0,bc=Number(b.station.confirmationCount)||0;
      if(bc!==ac)return bc-ac;
      return a.distance-b.distance;
    });
    const cancel=card.querySelector('#v160StationNotHere');
    parsed.forEach((x,i)=>{
      x.btn.classList.toggle('v161-preferred',i===0&&(Number(x.station.confirmationCount)||0)>0);
      x.btn.querySelector('.v161-choice-meta')?.remove();
      const meta=document.createElement('span');meta.className='v161-choice-meta';
      meta.innerHTML=`<span class="v161-confidence ${x.c.label.toLowerCase()}">${esc(x.c.label)}</span>${Number(x.station.confirmationCount)||0} prior confirmation${(Number(x.station.confirmationCount)||0)===1?'':'s'}`;
      x.btn.appendChild(meta);
      card.insertBefore(x.btn,cancel||null);
    });
  }

  document.addEventListener('click',e=>{
    const btn=e.target.closest?.('[data-v160-station-choice]');
    if(btn){
      const station=confirmStation(btn.dataset.v160StationChoice);
      if(station)setTimeout(()=>{annotateSettingsStations();},40);
    }
  },true);

  let timer=null;
  new MutationObserver(()=>{
    clearTimeout(timer);
    timer=setTimeout(()=>{reorderConfirmation();annotateSettingsStations();setVersion();},0);
  }).observe(document.body,{childList:true,subtree:true});

  installStyles();setVersion();annotateSettingsStations();reorderConfirmation();
  document.addEventListener('fueltracker:pagechange',e=>{if(e.detail?.page==='settings')setTimeout(annotateSettingsStations,40);});
  document.addEventListener('fueltracker:datachange',()=>setTimeout(()=>{annotateSettingsStations();setVersion();},80));

  const brand=document.querySelector('.brand');if(brand)new MutationObserver(setVersion).observe(brand,{childList:true,subtree:true});
  const title=document.querySelector('title');if(title)new MutationObserver(setVersion).observe(title,{childList:true});

  window.FuelTrackerSmartStations={revision:REV,version:APP_VERSION,confidence,confirmStation,refresh:()=>{annotateSettingsStations();reorderConfirmation();setVersion();}};
})();
