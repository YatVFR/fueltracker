(function(){
  'use strict';
  const REV='v15.5-garage-analytics-1';
  const APP_VERSION='v15.5 Garage';

  function garage(){return state.garageV15||null;}
  function profiles(){return garage()?.profiles||[];}
  function activeId(){return garage()?.activeProfileId||'';}
  function clone(v){return JSON.parse(JSON.stringify(v));}
  function validDateLocal(v){const d=new Date(v);return Number.isNaN(d.getTime())?null:d;}
  function escLocal(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function typeLabel(t){return t==='bike'?'Bike':'Car';}

  function baseData(p){
    if(!p)return {records:[],registration:'',theme:'',odometer:{value:null,updatedAt:null}};
    const d=p.legacy?garage()?.legacy?.[p.type]:p.data;
    return d||{records:[],registration:'',theme:'',odometer:{value:null,updatedAt:null}};
  }

  function dataFor(p){
    const d=clone(baseData(p));
    if(p.id===activeId()){
      d.records=clone(state.records?.[p.type]||d.records||[]);
      d.registration=state.registrations?.[p.type]||d.registration||'';
      d.theme=state.selected?.[p.type]||d.theme||'';
      d.odometer=clone(state.currentOdometer?.[p.type]||d.odometer||{value:null,updatedAt:null});
    }
    return d;
  }

  function rowFx(r){const n=Number(r.fxRateSGDMYR);return Number.isFinite(n)&&n>0?n:3.16;}
  function rowSpendSgd(r){const cost=Number(r.cost)||0;return String(r.currency||'').toUpperCase()==='MYR'?cost/rowFx(r):cost;}
  function allSpend(rows){return rows.reduce((s,r)=>s+rowSpendSgd(r),0);}

  function completedStats(rows){
    const valid=[...rows]
      .filter(r=>validDateLocal(r.dateTime)&&Number(r.mileage)>0&&Number(r.volume)>0)
      .sort((a,b)=>new Date(a.dateTime)-new Date(b.dateTime));
    let distance=0,litres=0,intervalSpend=0,intervals=0;
    for(let i=1;i<valid.length;i++){
      const prev=valid[i-1],cur=valid[i];
      const dist=Number(cur.mileage)-Number(prev.mileage),fuel=Number(cur.volume);
      if(dist>0&&fuel>0){distance+=dist;litres+=fuel;intervalSpend+=rowSpendSgd(cur);intervals++;}
    }
    return {distance,litres,intervalSpend,intervals,economy:litres>0?distance/litres:null,cost100:distance>0?(intervalSpend/distance*100):null};
  }

  function profileName(p,d){return d.registration||p.name||typeLabel(p.type);}
  function profileModel(p){return [p.year,p.make,p.model].map(v=>String(v||'').trim()).filter(Boolean).join(' ');}

  function snapshots(){
    return profiles().map(p=>{
      const d=dataFor(p),rows=d.records||[],stats=completedStats(rows);
      return {p,d,rows,stats,label:profileName(p,d),model:profileModel(p),spend:allSpend(rows)};
    });
  }

  function monthKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;}
  function monthLabel(d){return d.toLocaleDateString(undefined,{month:'short'});}
  function monthlyTrend(snap){
    const now=new Date(),months=[];
    for(let i=11;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);months.push({key:monthKey(d),label:monthLabel(d),value:0});}
    const map=new Map(months.map(m=>[m.key,m]));
    snap.forEach(x=>x.rows.forEach(r=>{const d=validDateLocal(r.dateTime);if(!d)return;const m=map.get(monthKey(d));if(m)m.value+=rowSpendSgd(r);}));
    return months;
  }

  function money(v,digits=0){return 'S$'+Number(v||0).toFixed(digits);}
  function km(v){return Number(v||0).toLocaleString()+' km';}
  function installStyles(){
    let s=document.getElementById('v155GarageAnalyticsStyles');if(!s){s=document.createElement('style');s.id='v155GarageAnalyticsStyles';document.head.appendChild(s);}
    s.textContent=`
      #garageAnalyticsBox{overflow:hidden}.ga-wrap{padding:11px}.ga-head{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin-bottom:9px}.ga-head h2{margin:0;font-size:13px;letter-spacing:.12em;text-transform:uppercase}.ga-head span{font-size:9px;color:#87939e;text-transform:uppercase;letter-spacing:.08em}
      .ga-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ga-card{border:1px solid #293641;border-radius:10px;background:#0a1117;padding:10px;min-width:0}.ga-card h3{margin:0 0 9px;font-size:9px;letter-spacing:.09em;text-transform:uppercase;color:#9aa5ae}.ga-row{display:grid;grid-template-columns:minmax(92px,1.15fr) 2fr auto;gap:7px;align-items:center;margin:7px 0;min-width:0}.ga-label{min-width:0}.ga-label b{display:block;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ga-label small{display:block;margin-top:1px;font-size:7px;color:#74818b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ga-bar{height:7px;border-radius:999px;background:#18222b;overflow:hidden}.ga-bar i{display:block;height:100%;width:var(--w);background:var(--accent);border-radius:inherit;opacity:.82}.ga-value{font-size:10px;font-weight:850;white-space:nowrap;text-align:right}.ga-empty{font-size:9px;color:#7f8b96;padding:4px 0}
      .ga-trend{grid-column:1/-1}.ga-trend-chart{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:4px;align-items:end;height:105px;padding-top:8px}.ga-month{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;min-width:0}.ga-month-bar{width:100%;max-width:22px;height:var(--h);min-height:2px;border-radius:5px 5px 2px 2px;background:var(--accent);opacity:.75}.ga-month-value{font-size:6px;color:#89949d;margin-bottom:3px;writing-mode:vertical-rl;transform:rotate(180deg);max-height:34px;overflow:hidden}.ga-month-label{margin-top:5px;font-size:7px;color:#7f8b96;text-transform:uppercase}.ga-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin-bottom:8px}.ga-kpi{border:1px solid #27343f;border-radius:8px;padding:8px;background:#091017;min-width:0}.ga-kpi small{display:block;font-size:7px;color:#7f8b96;text-transform:uppercase;letter-spacing:.06em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ga-kpi strong{display:block;margin-top:4px;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      @media(max-width:720px){.ga-grid{grid-template-columns:1fr}.ga-trend{grid-column:auto}.ga-summary{grid-template-columns:1fr 1fr}.ga-trend-chart{height:92px;gap:3px}.ga-row{grid-template-columns:minmax(82px,1.1fr) 1.7fr auto}}
      @media(max-width:420px){.ga-wrap{padding:9px}.ga-card{padding:9px}.ga-row{gap:5px}.ga-trend-chart{height:84px}.ga-month-value{display:none}}
    `;
  }

  function ensureBox(){
    let box=document.getElementById('garageAnalyticsBox');if(box)return box;
    const overview=document.getElementById('garageOverviewBox');
    const anchor=overview||document.querySelector('main > section.box');if(!anchor)return null;
    box=document.createElement('section');box.className='box';box.id='garageAnalyticsBox';anchor.insertAdjacentElement('afterend',box);return box;
  }

  function comparisonRows(snap,field,format){
    const values=snap.map(x=>Number(field(x))||0),max=Math.max(...values,0);
    if(!snap.length)return '<div class="ga-empty">No Garage vehicles yet.</div>';
    return snap.map((x,i)=>{
      const value=values[i],pct=max>0?Math.max(2,value/max*100):0;
      return `<div class="ga-row"><div class="ga-label"><b>${escLocal(x.label)}</b><small>${escLocal(x.model||typeLabel(x.p.type))}</small></div><div class="ga-bar"><i style="--w:${pct.toFixed(1)}%"></i></div><div class="ga-value">${format(value,x)}</div></div>`;
    }).join('');
  }

  function renderAnalytics(){
    const box=ensureBox();if(!box)return;const snap=snapshots(),trend=monthlyTrend(snap);
    const totalSpend=snap.reduce((s,x)=>s+x.spend,0),totalDistance=snap.reduce((s,x)=>s+x.stats.distance,0),totalLitres=snap.reduce((s,x)=>s+x.stats.litres,0),intervalSpend=snap.reduce((s,x)=>s+x.stats.intervalSpend,0);
    const garageEconomy=totalLitres>0?totalDistance/totalLitres:null,garageCost100=totalDistance>0?intervalSpend/totalDistance*100:null;
    const trendMax=Math.max(...trend.map(m=>m.value),0);
    box.innerHTML=`<div class="ga-wrap">
      <div class="ga-head"><h2>Garage Analytics</h2><span>All-time + 12 month trend</span></div>
      <div class="ga-summary">
        <div class="ga-kpi"><small>Total Spend</small><strong>${money(totalSpend,0)}</strong></div>
        <div class="ga-kpi"><small>Tracked Distance</small><strong>${totalDistance?km(totalDistance):'—'}</strong></div>
        <div class="ga-kpi"><small>Garage Economy</small><strong>${garageEconomy?garageEconomy.toFixed(1)+' km/L':'—'}</strong></div>
        <div class="ga-kpi"><small>Cost / 100 km</small><strong>${garageCost100?money(garageCost100,2):'—'}</strong></div>
      </div>
      <div class="ga-grid">
        <div class="ga-card"><h3>Spend by Vehicle</h3>${comparisonRows(snap,x=>x.spend,v=>money(v,0))}</div>
        <div class="ga-card"><h3>Average Economy by Vehicle</h3>${comparisonRows(snap,x=>x.stats.economy||0,(v,x)=>x.stats.economy?x.stats.economy.toFixed(1)+' km/L':'—')}</div>
        <div class="ga-card"><h3>Tracked Distance by Vehicle</h3>${comparisonRows(snap,x=>x.stats.distance,(v,x)=>x.stats.distance?km(x.stats.distance):'—')}</div>
        <div class="ga-card"><h3>Cost / 100 km by Vehicle</h3>${comparisonRows(snap,x=>x.stats.cost100||0,(v,x)=>x.stats.cost100?money(x.stats.cost100,2):'—')}</div>
        <div class="ga-card ga-trend"><h3>Monthly Garage Spending · Latest 12 Months</h3><div class="ga-trend-chart">${trend.map(m=>{const h=trendMax>0?Math.max(2,m.value/trendMax*100):2;return `<div class="ga-month"><div class="ga-month-value">${m.value?money(m.value,0):''}</div><div class="ga-month-bar" style="--h:${h.toFixed(1)}%" title="${escLocal(m.label)}: ${money(m.value,2)}"></div><div class="ga-month-label">${escLocal(m.label)}</div></div>`;}).join('')}</div></div>
      </div>
    </div>`;
  }

  function setVersion(){const badge=document.querySelector('.brand small');if(badge)badge.textContent=APP_VERSION;document.title='Fuel Tracker v15.5';}
  function refresh(){installStyles();renderAnalytics();setVersion();}

  if(!garage()?.profiles?.length)return;
  garage().analyticsRevision=REV;saveState?.();refresh();
  document.addEventListener('click',e=>{if(e.target.closest('[data-profile-switch],[data-profile-open],#garageModalSave,#garageAddProfile,#garageHeaderAdd,#odoSaveBtn,#saveDbBtn,#newDbBtn,#themeRow button'))setTimeout(refresh,70);});
  document.getElementById('fuelForm')?.addEventListener('submit',()=>setTimeout(refresh,100));
  document.getElementById('loadDbInput')?.addEventListener('change',()=>setTimeout(refresh,140));
})();