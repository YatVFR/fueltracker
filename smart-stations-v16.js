(function(){
  'use strict';
  if(window.FuelTrackerSmartStations)return;

  const REV='v16.1-smart-stations-3';
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

  function newerVersionOwnsUi(){
    const current=Number(window.FUEL_TRACKER_VERSION_NUMBER);
    return Number.isFinite(current)&&current>Number(APP_NUMBER);
  }

  function setVersion(){
    if(newerVersionOwnsUi())return;
    window.FUEL_TRACKER_VERSION=APP_VERSION;window.FUEL_TRACKER_VERSION_NUMBER=APP_NUMBER;
    const badge=document.querySelector('.brand small');if(badge&&badge.textContent!==APP_VERSION)badge.textContent=APP_VERSION;
    if(document.title!=='Fuel Tracker v'+APP_NUMBER)document.title='Fuel Tracker v'+APP_NUMBER;
  }

  function stationMetaHtml(station){
    const c=confidence(station),count=Number(station.confirmationCount)||0;
    const last=station.lastConfirmedAt?new Date(station.lastConfirmedAt).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}):'Never confirmed';
    return `<span class="v161-confidence ${c.label.toLowerCase()}">${esc(c.label)}</span> <b>${count} confirmation${count===1?'':'s'}</b> · Last: ${esc(last)}`;
  }

  function annotateSettingsStations(){
    const list=loadStations();
    document.querySelectorAll('#v160AutomationCard .v160-station').forEach(row=>{
      const remove=row.querySelector('[data-v160-remove]');
      if(!remove)return;
      const station=list.find(s=>String(s.id)===String(remove.dataset.v160Remove));if(!station)return;
      const info=row.querySelector('div');if(!info)return;
      const html=stationMetaHtml(station);
      let meta=info.querySelector('.v161-station-meta');
      if(meta){if(meta.innerHTML!==html)meta.innerHTML=html;return;}
      meta=document.createElement('div');meta.className='v161-station-meta';meta.innerHTML=html;info.appendChild(meta);
    });
  }

  function choiceMetaHtml(station){
    const c=confidence(station),count=Number(station.confirmationCount)||0;
    return `<span class="v161-confidence ${c.label.toLowerCase()}">${esc(c.label)}</span>${count} prior confirmation${count===1?'':'s'}`;
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
      const html=choiceMetaHtml(x.station);
      let meta=x.btn.querySelector('.v161-choice-meta');
      if(meta){if(meta.innerHTML!==html)meta.innerHTML=html;}else{meta=document.createElement('span');meta.className='v161-choice-meta';meta.innerHTML=html;x.btn.appendChild(meta);}
    });
    const current=[...card.querySelectorAll('[data-v160-station-choice]')];
    const needsReorder=parsed.some((x,i)=>current[i]!==x.btn);
    if(needsReorder)parsed.forEach(x=>card.insertBefore(x.btn,cancel||null));
  }

  document.addEventListener('click',e=>{
    const btn=e.target.closest?.('[data-v160-station-choice]');
    if(btn){
      const station=confirmStation(btn.dataset.v160StationChoice);
      if(station)setTimeout(()=>{annotateSettingsStations();reorderConfirmation();},40);
    }
  },true);

  // Observe only newly rendered automation/station UI. Ignore our own
  // v16.1 annotation nodes so the observer cannot trigger itself forever.
  let timer=null;
  const observer=new MutationObserver(records=>{
    let relevant=false;
    for(const record of records){
      for(const node of record.addedNodes){
        if(!(node instanceof Element))continue;
        if(node.matches?.('.v161-station-meta,.v161-choice-meta,.v161-confidence'))continue;
        if(node.matches?.('#v160AutomationCard,.v160-station,#v160StationConfirm,[data-v160-station-choice]')||node.querySelector?.('#v160AutomationCard,.v160-station,#v160StationConfirm,[data-v160-station-choice]')){relevant=true;break;}
      }
      if(relevant)break;
    }
    if(!relevant)return;
    clearTimeout(timer);
    timer=setTimeout(()=>{reorderConfirmation();annotateSettingsStations();setVersion();},0);
  });
  observer.observe(document.body,{childList:true,subtree:true});

  installStyles();setVersion();annotateSettingsStations();reorderConfirmation();
  document.addEventListener('fueltracker:pagechange',e=>{if(e.detail?.page==='settings')setTimeout(annotateSettingsStations,40);});
  document.addEventListener('fueltracker:datachange',()=>setTimeout(()=>{annotateSettingsStations();setVersion();},80));

  window.FuelTrackerSmartStations={revision:REV,version:APP_VERSION,confidence,confirmStation,refresh:()=>{annotateSettingsStations();reorderConfirmation();setVersion();}};
})();
