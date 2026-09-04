(function(){
  'use strict';
  const REV='v15.5-garage-overview-1';
  const APP_VERSION='v15.5 Garage';

  function garage(){return state.garageV15||null;}
  function profiles(){return garage()?.profiles||[];}
  function activeId(){return garage()?.activeProfileId||'';}
  function clone(v){return JSON.parse(JSON.stringify(v));}
  function valid(v){const d=new Date(v);return Number.isNaN(d.getTime())?null:d;}
  function escLocal(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function typeLabel(t){return t==='bike'?'Bike':'Car';}
  function profileTitle(p){return [p.year,p.make,p.model].map(v=>String(v||'').trim()).filter(Boolean).join(' ');}

  function baseData(p){
    if(!p)return {records:[],registration:'',theme:'',odometer:{value:null,updatedAt:null}};
    const g=garage();
    const d=p.legacy?g?.legacy?.[p.type]:p.data;
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

  function fx(row){const n=Number(row.fxRateSGDMYR);return n>0?n:3.16;}
  function spendSgd(rows){return rows.reduce((sum,r)=>{const cost=Number(r.cost)||0;return sum+(String(r.currency||'').toUpperCase()==='MYR'?cost/fx(r):cost);},0);}
  function latestRow(rows){return [...rows].filter(r=>valid(r.dateTime)).sort((a,b)=>new Date(b.dateTime)-new Date(a.dateTime))[0]||null;}
  function latestOdo(d,rows){
    const n=Number(d.odometer?.value);if(Number.isFinite(n)&&n>=0)return n;
    const r=[...rows].filter(x=>Number(x.mileage)>0&&valid(x.dateTime)).sort((a,b)=>new Date(b.dateTime)-new Date(a.dateTime))[0];
    return r?Number(r.mileage):null;
  }
  function dbName(p,d){
    if(p.masterDb?.filename)return p.masterDb.filename;
    if(p.id==='bike-primary')return 'BikeFuelData.json';
    if(p.id==='car-primary')return 'CarFuelData.json';
    const clean=String(d.registration||p.name||'Vehicle').trim().replace(/[^a-zA-Z0-9_-]+/g,'-');
    return `${clean||'Vehicle'}FuelData.json`;
  }
  function activityDate(d,rows){
    const candidates=[];const row=latestRow(rows);if(row?.dateTime)candidates.push(valid(row.dateTime));if(d.odometer?.updatedAt)candidates.push(valid(d.odometer.updatedAt));
    return candidates.filter(Boolean).sort((a,b)=>b-a)[0]||null;
  }
  function fmtDate(d){return d?d.toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}):'No activity';}

  function snapshots(){
    return profiles().map(p=>{
      const d=dataFor(p),rows=d.records||[],last=latestRow(rows),activity=activityDate(d,rows);
      return {p,d,rows,last,activity,label:d.registration||p.name||typeLabel(p.type),model:profileTitle(p),odo:latestOdo(d,rows),spend:spendSgd(rows),db:dbName(p,d)};
    });
  }

  function installStyles(){
    let s=document.getElementById('v153GarageOverviewStyles');if(!s){s=document.createElement('style');s.id='v153GarageOverviewStyles';document.head.appendChild(s);}
    s.textContent=`
      #garageOverviewBox{overflow:hidden}.go-wrap{padding:11px}.go-head{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin-bottom:9px}.go-head h2{margin:0;font-size:13px;letter-spacing:.12em;text-transform:uppercase}.go-head span{font-size:9px;color:#87939e;text-transform:uppercase;letter-spacing:.08em}
      .go-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-bottom:8px}.go-kpi{border:1px solid #293641;border-radius:9px;background:#0a1117;padding:9px 10px;min-width:0}.go-kpi small{display:block;color:#7f8b96;font-size:8px;font-weight:850;text-transform:uppercase;letter-spacing:.08em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.go-kpi strong{display:block;margin-top:4px;font-size:17px;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .go-vehicles{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(205px,1fr);gap:7px;overflow-x:auto;scroll-snap-type:x proximity;padding-bottom:2px;scrollbar-width:none}.go-vehicles::-webkit-scrollbar{display:none}.go-vehicle{scroll-snap-align:start;text-align:left;border:1px solid #2a3742;border-radius:10px;background:linear-gradient(180deg,#111922,#0a1117);padding:10px;min-width:0;color:inherit}.go-vehicle.active{border-color:var(--accent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--accent) 35%,transparent)}
      .go-vehicle-top{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}.go-vehicle-title{min-width:0}.go-vehicle-title b{display:block;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.go-vehicle-title span{display:block;margin-top:2px;font-size:9px;color:#8e99a3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.go-type{font-size:8px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:var(--accent)}
      .go-vehicle-stats{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:8px}.go-stat{border-top:1px solid #26323c;padding-top:6px;min-width:0}.go-stat small{display:block;color:#7f8b96;font-size:7px;text-transform:uppercase;letter-spacing:.07em}.go-stat strong{display:block;margin-top:2px;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.go-db{margin-top:7px;font-size:8px;color:#74818b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.go-tank{color:#87939e}
      @media(max-width:680px){.go-kpis{grid-template-columns:1fr 1fr}.go-kpi strong{font-size:15px}.go-vehicles{grid-auto-columns:78%}}@media(max-width:420px){.go-wrap{padding:9px}.go-head{margin-bottom:7px}.go-kpis{gap:5px;margin-bottom:6px}.go-kpi{padding:8px}.go-vehicles{grid-auto-columns:84%}}
    `;
  }

  function ensureBox(){
    let box=document.getElementById('garageOverviewBox');if(box)return box;
    const first=document.querySelector('main > section.box');if(!first)return null;
    box=document.createElement('section');box.className='box';box.id='garageOverviewBox';first.insertAdjacentElement('afterend',box);return box;
  }

  function renderOverview(){
    const box=ensureBox();if(!box)return;const snap=snapshots();
    const totalRecords=snap.reduce((s,x)=>s+x.rows.length,0),totalSpend=snap.reduce((s,x)=>s+x.spend,0);
    const activities=snap.map(x=>x.activity).filter(Boolean).sort((a,b)=>b-a),latest=activities[0]||null;
    box.innerHTML=`<div class="go-wrap">
      <div class="go-head"><h2>Garage Overview</h2><span>All vehicles</span></div>
      <div class="go-kpis"><div class="go-kpi"><small>Vehicles</small><strong>${snap.length}</strong></div><div class="go-kpi"><small>Fuel Records</small><strong>${totalRecords.toLocaleString()}</strong></div><div class="go-kpi"><small>All-time Spend</small><strong>S$${totalSpend.toFixed(0)}</strong></div><div class="go-kpi"><small>Latest Activity</small><strong>${fmtDate(latest)}</strong></div></div>
      <div class="go-vehicles">${snap.map(x=>`<button type="button" class="go-vehicle ${x.p.id===activeId()?'active':''}" data-go-profile="${escLocal(x.p.id)}">
        <div class="go-vehicle-top"><div class="go-vehicle-title"><b>${escLocal(x.label)}</b><span>${escLocal(x.model||x.p.name||'Vehicle details not set')}${x.p.tankCapacity?` • ${Number(x.p.tankCapacity).toFixed(1)}L tank`:''}</span></div><span class="go-type">${escLocal(typeLabel(x.p.type))}</span></div>
        <div class="go-vehicle-stats"><div class="go-stat"><small>Odometer</small><strong>${x.odo!=null?Number(x.odo).toLocaleString()+' km':'—'}</strong></div><div class="go-stat"><small>Records</small><strong>${x.rows.length}</strong></div><div class="go-stat"><small>Last Refuel</small><strong>${x.last?fmtDate(valid(x.last.dateTime)):'—'}</strong></div><div class="go-stat"><small>Spend</small><strong>S$${x.spend.toFixed(0)}</strong></div></div>
        <div class="go-db">${escLocal(x.db)}</div></button>`).join('')}</div></div>`;
    box.querySelectorAll('[data-go-profile]').forEach(btn=>btn.onclick=()=>{const target=document.querySelector(`[data-profile-switch="${CSS.escape(btn.dataset.goProfile)}"]`);target?.click();setTimeout(()=>{renderOverview();document.querySelector('.hero-dash')?.scrollIntoView({behavior:'smooth',block:'start'});},30);});
  }

  function setVersion(){const badge=document.querySelector('.brand small');if(badge)badge.textContent=APP_VERSION;document.title='Fuel Tracker v15.5';}
  function refresh(){installStyles();renderOverview();setVersion();}

  if(!garage()?.profiles?.length)return;state.garageV15.overviewRevision=REV;saveState?.();refresh();
  document.addEventListener('click',e=>{if(e.target.closest('[data-profile-switch],[data-profile-open],#garageModalSave,#garageAddProfile,#garageHeaderAdd,#odoSaveBtn,#saveDbBtn,#newDbBtn'))setTimeout(refresh,50);});
  document.getElementById('fuelForm')?.addEventListener('submit',()=>setTimeout(refresh,80));
})();