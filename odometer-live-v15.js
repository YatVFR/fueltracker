(function(){
  'use strict';
  const REV='v15.2-odometer-live-2';
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
    const distance=current-previous;
    return {
      latest,
      odo,
      current,
      previous,
      litres,
      distance:distance>0?distance:0,
      economy:distance>0?distance/litres:null,
      date:validDate(odo?.updatedAt)||new Date()
    };
  }

  function selectedMonth(){
    try{
      const all=JSON.parse(localStorage.getItem(MONTH_KEY)||'{}');
      return all[state.mode]||`${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`;
    }catch(e){
      const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    }
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

  function completedIntervals(){
    return economyIntervals().filter(x=>inActivePeriod(x.date));
  }

  function patchDashboard(){
    if(state.dashMode!=='efficiency')return;
    const cards=document.querySelectorAll('#metrics .metric');
    if(cards.length<4)return;
    const done=completedIntervals();
    const live=currentInterval();
    const includeLive=live&&live.distance>0&&inActivePeriod(live.date);
    const distance=done.reduce((s,x)=>s+x.distance,0)+(includeLive?live.distance:0);
    const intervalLitres=done.reduce((s,x)=>s+x.litres,0)+(includeLive?live.litres:0);
    const avg=intervalLitres>0?distance/intervalLitres:null;
    const base=dashboardSummary();
    const setValue=(card,value)=>{const el=card?.querySelector('.v');if(el)el.textContent=value;};
    setValue(cards[0],distance>0?Math.round(distance).toLocaleString()+' km':'—');
    setValue(cards[1],avg?avg.toFixed(1)+' km/L':'—');
    setValue(cards[3],distance>0?'S$'+(base.spendSgd/distance*100).toFixed(2):'—');
    const sub0=cards[0]?.querySelector('.s');if(sub0&&includeLive)sub0.textContent='includes current odometer';
    const sub1=cards[1]?.querySelector('.s');if(sub1&&includeLive)sub1.textContent='weighted incl. current interval';
  }

  function patchEfficiencyDetails(){
    const el=document.getElementById('efficiencyList');if(!el)return;
    const live=currentInterval();
    if(!live){
      el.innerHTML='<div class="eff-card"><h3>Latest Fuel Economy</h3><div class="eff-value">—</div><div class="eff-sub">A valid refuel record and Current Odometer are required.</div></div>';
      return;
    }
    el.innerHTML=`
      <div class="eff-card"><h3>Latest Fuel Economy</h3><div class="eff-value">${live.economy?live.economy.toFixed(1):'—'}<span class="eff-unit"> km/L</span></div><div class="eff-sub">current odometer interval</div></div>
      <div class="eff-card"><h3>Distance Travelled</h3><div class="eff-value">${live.distance>0?Number(live.distance).toLocaleString():'—'}<span class="eff-unit"> km</span></div><div class="eff-sub">current odo − latest refuel odo</div></div>
      <div class="eff-card"><h3>Current Refuel Volume</h3><div class="eff-value">${live.litres>0?live.litres.toFixed(2):'—'}<span class="eff-unit"> L</span></div><div class="eff-sub">latest refuel volume used in formula</div></div>
      <div class="eff-card"><h3>Latest Refuel Odometer</h3><div class="eff-value">${live.previous.toLocaleString()}<span class="eff-unit"> km</span></div><div class="eff-sub">starting odometer for current interval</div></div>
      <div class="eff-card"><h3>Current Odometer</h3><div class="eff-value">${live.current.toLocaleString()}<span class="eff-unit"> km</span></div><div class="eff-sub">manual current odometer</div></div>`;
  }

  function fixFormulaText(){
    const p=document.querySelector('.eff-formula p');
    if(p)p.textContent='(Current Odo − Latest Refuel Odo) ÷ Latest Refuel Volume';
  }
  function fixVersion(){
    const badge=document.querySelector('.brand small');
    if(badge)badge.textContent='v15.2 Garage';
    document.title='Fuel Tracker v15.2';
  }
  function refreshLive(){fixFormulaText();patchEfficiencyDetails();patchDashboard();fixVersion();}

  const baseRenderAll=renderAll;
  renderAll=function(){baseRenderAll();refreshLive();};
  const baseRenderDashboard=renderDashboard;
  renderDashboard=function(){baseRenderDashboard();patchDashboard();fixVersion();};

  document.getElementById('odoSaveBtn')?.addEventListener('click',()=>setTimeout(()=>{
    renderDashboard();patchEfficiencyDetails();fixFormulaText();fixVersion();saveState?.();
  },0));

  document.querySelector('.vehicle-switch')?.addEventListener('click',()=>setTimeout(refreshLive,0));
  const badge=document.querySelector('.brand small');
  if(badge)new MutationObserver(()=>{if(badge.textContent!=='v15.2 Garage')badge.textContent='v15.2 Garage';}).observe(badge,{childList:true,characterData:true,subtree:true});

  state.odometerLiveRevision=REV;
  saveState?.();
  refreshLive();
})();