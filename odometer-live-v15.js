(function(){
  'use strict';
  const REV='v15.4-current-tank-compact-2';
  const MONTH_KEY='fueltrackerV14SelectedMonth';

  economyIntervals=function(){
    const rows=[...currentRecords()].filter(r=>validDate(r.dateTime)&&Number(r.mileage)>0&&Number(r.volume)>0).sort((a,b)=>new Date(a.dateTime)-new Date(b.dateTime));
    const out=[];
    for(let i=1;i<rows.length;i++){
      const prev=rows[i-1],cur=rows[i];
      const distance=Number(cur.mileage)-Number(prev.mileage),litres=Number(cur.volume);
      if(distance>0&&litres>0)out.push({date:new Date(cur.dateTime),distance,economy:distance/litres,litres});
    }
    return out;
  };

  function rowsAsc(){
    return [...currentRecords()]
      .filter(r=>validDate(r.dateTime)&&Number(r.mileage)>0&&Number(r.volume)>0)
      .sort((a,b)=>new Date(a.dateTime)-new Date(b.dateTime));
  }

  function currentInterval(){
    const rows=rowsAsc();
    const latest=rows[rows.length-1];
    if(!latest)return null;
    const odo=state.currentOdometer?.[state.mode];
    const current=Number(odo?.value);
    const previous=Number(latest.mileage);
    const litres=Number(latest.volume);
    if(!Number.isFinite(current)||!Number.isFinite(previous)||!(litres>0))return null;
    const distance=Math.max(0,current-previous);
    const refuelDate=validDate(latest.dateTime);
    const tankAge=refuelDate?Math.max(0,Math.floor((Date.now()-refuelDate.getTime())/86400000)):null;
    return {latest,odo,current,previous,litres,distance,economy:distance>0?distance/litres:null,tankAge,date:validDate(odo?.updatedAt)||new Date()};
  }

  function selectedMonth(){
    try{
      const all=JSON.parse(localStorage.getItem(MONTH_KEY)||'{}');
      return all[state.mode]||`${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`;
    }catch(e){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;}
  }
  function ym(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;}
  function inActivePeriod(d){
    if(state.period==='all')return true;
    const now=new Date();
    if(state.period==='14')return d>=new Date(now.getTime()-14*86400000);
    if(state.period==='year')return d>=new Date(now.getFullYear(),0,1);
    if(state.period==='month')return ym(d)===selectedMonth();
    return true;
  }

  function completedIntervals(){return economyIntervals().filter(x=>inActivePeriod(x.date));}

  function patchDashboard(){
    if(state.dashMode!=='efficiency')return;
    const cards=document.querySelectorAll('#metrics .metric');if(cards.length<4)return;
    const done=completedIntervals(),live=currentInterval();
    const includeLive=live&&live.distance>0&&inActivePeriod(live.date);
    const distance=done.reduce((s,x)=>s+x.distance,0)+(includeLive?live.distance:0);
    const intervalLitres=done.reduce((s,x)=>s+x.litres,0)+(includeLive?live.litres:0);
    const avg=intervalLitres>0?distance/intervalLitres:null,base=dashboardSummary();
    const setValue=(card,value)=>{const el=card?.querySelector('.v');if(el)el.textContent=value;};
    setValue(cards[0],distance>0?Math.round(distance).toLocaleString()+' km':'—');
    setValue(cards[1],avg?avg.toFixed(1)+' km/L':'—');
    setValue(cards[3],distance>0?'S$'+(base.spendSgd/distance*100).toFixed(2):'—');
    const sub0=cards[0]?.querySelector('.s');if(sub0&&includeLive)sub0.textContent='includes current odometer';
    const sub1=cards[1]?.querySelector('.s');if(sub1&&includeLive)sub1.textContent='weighted incl. current interval';
  }

  function installTankStyles(){
    let s=document.getElementById('v15CurrentTankStyles');
    if(!s){s=document.createElement('style');s.id='v15CurrentTankStyles';document.head.appendChild(s);}
    s.textContent=`
      .eff-panel{padding:12px}
      .eff-panel-header{margin-bottom:8px;text-align:left}
      .eff-panel-header h2{font-size:12px;letter-spacing:.12em}
      .eff-formula{display:none}
      .eff-list{gap:0}
      .current-tank-summary{display:grid;gap:7px}
      .tank-primary{display:grid;grid-template-columns:1fr 1fr;gap:7px}
      .tank-primary-card{border:1px solid #2b3945;border-radius:9px;background:linear-gradient(180deg,#131c25,#0b1218);padding:11px 12px;min-width:0}
      .tank-k{font-size:8px;font-weight:900;letter-spacing:.09em;text-transform:uppercase;color:#8d99a4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .tank-v{margin-top:5px;font-size:25px;font-weight:900;letter-spacing:-.035em;line-height:1}
      .tank-v small{font-size:11px;font-weight:750;letter-spacing:0}
      .tank-s{margin-top:4px;font-size:9px;color:#8f9aa4;line-height:1.25}
      .tank-facts{display:grid;grid-template-columns:1fr 1fr;gap:6px}
      .tank-fact{display:flex;align-items:center;justify-content:space-between;gap:8px;border:1px solid #27343f;border-radius:8px;background:#0a1117;padding:8px 10px;min-width:0}
      .tank-fact .tank-k{flex:1}
      .tank-fact .tank-v{margin:0;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:right}
      @media(min-width:700px){.tank-facts{grid-template-columns:repeat(4,1fr)}.tank-fact{display:block}.tank-fact .tank-v{margin-top:5px;text-align:left}}
      @media(max-width:420px){.tank-primary-card{padding:10px}.tank-v{font-size:22px}.tank-s{display:none}.tank-fact{padding:7px 8px}.tank-fact .tank-v{font-size:13px}}
    `;
  }

  function patchCurrentTank(){
    const panel=document.querySelector('.eff-panel'),el=document.getElementById('efficiencyList');if(!panel||!el)return;
    const title=panel.querySelector('.eff-panel-header h2');if(title)title.textContent='CURRENT TANK';
    const live=currentInterval();
    if(!live){
      el.innerHTML='<div class="current-tank-summary"><div class="tank-primary-card"><div class="tank-k">Current Tank</div><div class="tank-v">—</div><div class="tank-s">Add a valid refuel and update Current Odometer.</div></div></div>';
      return;
    }
    el.innerHTML=`<div class="current-tank-summary">
      <div class="tank-primary">
        <div class="tank-primary-card"><div class="tank-k">Distance Since Refuel</div><div class="tank-v">${Number(live.distance).toLocaleString()} <small>km</small></div><div class="tank-s">Current odo − last refuel odo</div></div>
        <div class="tank-primary-card"><div class="tank-k">Current Economy</div><div class="tank-v">${live.economy?live.economy.toFixed(1):'—'} <small>km/L</small></div><div class="tank-s">Live current-tank estimate</div></div>
      </div>
      <div class="tank-facts">
        <div class="tank-fact"><div class="tank-k">Fuel</div><div class="tank-v">${live.litres.toFixed(3)} L</div></div>
        <div class="tank-fact"><div class="tank-k">Tank Age</div><div class="tank-v">${live.tankAge!=null?live.tankAge:'—'} d</div></div>
        <div class="tank-fact"><div class="tank-k">Refuel Odo</div><div class="tank-v">${live.previous.toLocaleString()}</div></div>
        <div class="tank-fact"><div class="tank-k">Current Odo</div><div class="tank-v">${live.current.toLocaleString()}</div></div>
      </div>
    </div>`;
  }

  function fixVersion(){const badge=document.querySelector('.brand small');if(badge)badge.textContent='v15.4 Garage';document.title='Fuel Tracker v15.4';}
  function refreshLive(){installTankStyles();patchCurrentTank();patchDashboard();fixVersion();}

  const baseRenderAll=renderAll;renderAll=function(){baseRenderAll();refreshLive();};
  const baseRenderDashboard=renderDashboard;renderDashboard=function(){baseRenderDashboard();patchDashboard();fixVersion();};

  document.getElementById('odoSaveBtn')?.addEventListener('click',()=>setTimeout(()=>{renderDashboard();patchCurrentTank();fixVersion();saveState?.();},0));
  document.querySelector('.vehicle-switch')?.addEventListener('click',()=>setTimeout(refreshLive,0));
  const badge=document.querySelector('.brand small');if(badge)new MutationObserver(()=>{if(badge.textContent!=='v15.4 Garage')badge.textContent='v15.4 Garage';}).observe(badge,{childList:true,characterData:true,subtree:true});

  if(!document.querySelector('script[data-v153-garage-overview]')){
    const script=document.createElement('script');
    script.src='./garage-overview-v15.js';
    script.dataset.v153GarageOverview='true';
    document.body.appendChild(script);
  }

  state.odometerLiveRevision=REV;saveState?.();refreshLive();
})();