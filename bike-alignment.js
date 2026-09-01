(function(){
  const MONTH_KEY='fueltrackerV14SelectedMonth';
  function ym(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;}
  function parseYm(v){const [y,m]=String(v||'').split('-').map(Number);return Number.isFinite(y)&&Number.isFinite(m)?new Date(y,m-1,1):new Date();}
  function loadMonths(){try{return JSON.parse(localStorage.getItem(MONTH_KEY)||'{}')}catch(e){return {}}}
  function selectedMonth(){const all=loadMonths();return all[state.mode]||ym(new Date());}
  function setSelectedMonth(v){const all=loadMonths();all[state.mode]=v;localStorage.setItem(MONTH_KEY,JSON.stringify(all));}
  function shiftMonth(delta){const d=parseYm(selectedMonth());d.setMonth(d.getMonth()+delta);const now=new Date();const future=new Date(d.getFullYear(),d.getMonth(),1)>new Date(now.getFullYear(),now.getMonth(),1);if(future)return;setSelectedMonth(ym(d));renderDashboard();}
  function monthLabel(v){return parseYm(v).toLocaleDateString(undefined,{month:'long',year:'numeric'});}
  function fx(e){const n=Number(e.fxRateSGDMYR);if(n>0)return n;const k=state.mode==='bike'?'bikeLastSgdMyrRate':'carLastSgdMyrRate';const f=Number(localStorage.getItem(k));return f>0?f:3.16;}
  function nativeRows(){return [...currentRecords()].filter(r=>validDate(r.dateTime)).sort((a,b)=>new Date(a.dateTime)-new Date(b.dateTime));}
  const originalPeriodRecords=periodRecords;
  periodRecords=function(){
    if(state.period!=='month')return originalPeriodRecords();
    const target=selectedMonth();
    return nativeRows().filter(r=>ym(new Date(r.dateTime))===target);
  };
  function selectedMonthIntervals(){
    if(state.period!=='month')return economyIntervals();
    const target=selectedMonth();
    return economyIntervals().filter(x=>ym(x.date)===target);
  }
  dashboardSummary=function(){
    const rows=periodRecords();
    let intervals;
    if(state.period==='month')intervals=selectedMonthIntervals();
    else{
      const now=new Date();let start=null;
      if(state.period==='14')start=new Date(now.getTime()-14*86400000);
      else if(state.period==='year')start=new Date(now.getFullYear(),0,1);
      intervals=economyIntervals().filter(x=>!start||x.date>=start);
    }
    const distance=intervals.reduce((s,x)=>s+x.distance,0);
    const litres=rows.reduce((s,r)=>s+(+r.volume||0),0);
    const totalIntervalLitres=intervals.reduce((s,x)=>s+x.litres,0);
    const avg=totalIntervalLitres>0?distance/totalIntervalLitres:null;
    const spendSgd=rows.reduce((s,r)=>s+(String(r.currency).toUpperCase()==='MYR'?(+r.cost||0)/fx(r):(+r.cost||0)),0);
    return {rows,distance,litres,avg,spendSgd,refuels:rows.length};
  };
  function ensureExtras(){
    const dash=document.querySelector('.dashboard');if(!dash)return;
    if(!document.getElementById('monthScrubberV14')){
      const e=document.createElement('div');e.id='monthScrubberV14';e.className='month-scrubber-v14';e.innerHTML='<button type="button" class="month-nav-v14" id="monthPrevV14">‹</button><div class="month-center-v14"><div class="month-label-v14" id="monthLabelV14">—</div><div class="month-hint-v14">Swipe left or right to change month</div></div><button type="button" class="month-nav-v14" id="monthNextV14">›</button>';
      dash.querySelector('.dashboard-top')?.insertAdjacentElement('afterend',e);
      document.getElementById('monthPrevV14').onclick=()=>shiftMonth(-1);document.getElementById('monthNextV14').onclick=()=>shiftMonth(1);
      let sx=null;e.addEventListener('touchstart',ev=>{sx=ev.changedTouches[0].clientX},{passive:true});e.addEventListener('touchend',ev=>{if(sx==null)return;const dx=ev.changedTouches[0].clientX-sx;if(Math.abs(dx)>45)shiftMonth(dx<0?1:-1);sx=null},{passive:true});
    }
    if(!document.getElementById('spendCompareV14')){
      const c=document.createElement('div');c.id='spendCompareV14';c.className='spend-compare-v14';c.innerHTML='<div class="spend-compare-title">SGD vs MYR Spending</div><div class="compare-row-v14"><div class="compare-head-v14"><span>Singapore</span><span id="sgPctV14">0%</span></div><div class="compare-track-v14"><div class="compare-fill-v14 sg" id="sgBarV14"></div></div></div><div class="compare-row-v14"><div class="compare-head-v14"><span>Malaysia → SGD equivalent</span><span id="myPctV14">0%</span></div><div class="compare-track-v14"><div class="compare-fill-v14 my" id="myBarV14"></div></div></div>';
      document.getElementById('metrics')?.insertAdjacentElement('afterend',c);
    }
    if(!document.getElementById('monthlyBarsV14')){
      const m=document.createElement('div');m.id='monthlyBarsV14';m.className='monthly-bars-v14';m.innerHTML='<div class="monthly-bars-title">Monthly Spending Comparison</div><div class="month-bars-v14" id="monthBarsV14"></div>';
      document.getElementById('spendCompareV14')?.insertAdjacentElement('afterend',m);
    }
  }
  function renderExtras(){
    ensureExtras();
    const scrub=document.getElementById('monthScrubberV14');if(scrub){scrub.classList.toggle('show',state.period==='month');document.getElementById('monthLabelV14').textContent=monthLabel(selectedMonth());const d=parseYm(selectedMonth()),now=new Date();document.getElementById('monthNextV14').disabled=d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth();}
    const comp=document.getElementById('spendCompareV14');if(comp){comp.classList.toggle('show',state.dashMode==='spending');const rows=periodRecords();let sg=0,my=0;rows.forEach(r=>{if(String(r.currency).toUpperCase()==='MYR')my+=(+r.cost||0)/fx(r);else if(String(r.currency).toUpperCase()==='SGD')sg+=+r.cost||0;});const total=sg+my,sp=total?sg/total*100:0,mp=total?my/total*100:0;document.getElementById('sgPctV14').textContent=sp.toFixed(0)+'%';document.getElementById('myPctV14').textContent=mp.toFixed(0)+'%';document.getElementById('sgBarV14').style.width=sp+'%';document.getElementById('myBarV14').style.width=mp+'%';}
    const bars=document.getElementById('monthlyBarsV14');if(bars){bars.classList.toggle('show',state.dashMode==='spending'&&state.period==='month');const target=parseYm(selectedMonth()),year=target.getFullYear(),data=[];for(let m=0;m<12;m++){let total=0;nativeRows().filter(r=>{const d=new Date(r.dateTime);return d.getFullYear()===year&&d.getMonth()===m}).forEach(r=>{total+=String(r.currency).toUpperCase()==='MYR'?(+r.cost||0)/fx(r):(+r.cost||0)});data.push(total);}const max=Math.max(...data,1);document.getElementById('monthBarsV14').innerHTML=data.map((v,m)=>`<div class="month-col-v14"><div class="month-bar-value-v14">${v?('S$'+Math.round(v)):'—'}</div><div class="month-bar-v14 ${m===target.getMonth()?'selected':''}" style="height:${Math.max(2,v/max*82)}px"></div><div class="month-bar-label-v14 ${m===target.getMonth()?'selected':''}">${new Date(year,m,1).toLocaleDateString(undefined,{month:'short'})}</div></div>`).join('');}
  }
  const baseRenderDashboard=renderDashboard;renderDashboard=function(){baseRenderDashboard();renderExtras();};
  function bindPencil(){const btn=document.getElementById('setRegBtn');if(!btn)return;const handler=()=>{const current=state.registrations?.[state.mode]||'';const entered=window.prompt('Vehicle registration number',current);if(entered===null)return;const value=entered.trim().toUpperCase();state.registrations=state.registrations||{bike:'',car:''};state.registrations[state.mode]=value;saveState();document.getElementById('heroPlate').textContent=value||'Enter Registration No.';const input=document.getElementById('vehicleRegInput');if(input)input.value=value;};btn.onclick=handler;btn.addEventListener('touchend',e=>{e.preventDefault();handler();},{passive:false});}
  function tightenHistory(){const wrap=document.getElementById('historyBody')?.closest('.table-wrap');if(wrap){wrap.classList.add('history-scroll');wrap.style.maxHeight=window.innerWidth<780?'360px':'420px';wrap.style.overflow='auto';}}
  const baseRenderAll=renderAll;renderAll=function(){baseRenderAll();renderExtras();bindPencil();tightenHistory();};
  bindPencil();tightenHistory();renderExtras();
})();