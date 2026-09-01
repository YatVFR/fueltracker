let state=loadState();

function loadState(){
  try{
    const x=JSON.parse(localStorage.getItem(STORE_KEY)||'null');
    if(x&&x.records&&x.selected) return x;
  }catch(e){}
  return structuredClone(defaultState);
}
function saveState(){localStorage.setItem(STORE_KEY,JSON.stringify(state));}
function list(){return state.mode==='bike'?bikeThemes:carThemes}
function currentTheme(){return list().find(t=>t.id===state.selected[state.mode])||list()[0]}
function currentRecords(){return state.records[state.mode]||[]}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function uid(){return (crypto.randomUUID?.()||('id-'+Date.now()+'-'+Math.random().toString(36).slice(2)))}
function validDate(v){const d=new Date(v);return Number.isNaN(d.getTime())?null:d}
function money(v,c='SGD'){return (c==='MYR'?'RM':'S$')+Number(v||0).toFixed(2)}

function periodRecords(){
  const rows=[...currentRecords()].filter(r=>validDate(r.dateTime)).sort((a,b)=>new Date(a.dateTime)-new Date(b.dateTime));
  if(state.period==='all') return rows;
  const now=new Date();
  let start;
  if(state.period==='14') start=new Date(now.getTime()-14*86400000);
  else if(state.period==='year') start=new Date(now.getFullYear(),0,1);
  else start=new Date(now.getFullYear(),now.getMonth(),1);
  return rows.filter(r=>new Date(r.dateTime)>=start);
}
function economyIntervals(){
  const rows=[...currentRecords()].filter(r=>validDate(r.dateTime)&&Number.isFinite(+r.mileage)&&+r.volume>0).sort((a,b)=>new Date(a.dateTime)-new Date(b.dateTime));
  const out=[];
  for(let i=1;i<rows.length;i++){
    const prev=rows[i-1],cur=rows[i];
    const dist=+cur.mileage-(+prev.mileage);
    if(dist>0) out.push({date:new Date(cur.dateTime),distance:dist,economy:dist/(+cur.volume),litres:+cur.volume});
  }
  return out;
}
function dashboardSummary(){
  const rows=periodRecords();
  const pfx=state.period==='all'?null:(()=>{
    const now=new Date();
    if(state.period==='14') return new Date(now.getTime()-14*86400000);
    if(state.period==='year') return new Date(now.getFullYear(),0,1);
    return new Date(now.getFullYear(),now.getMonth(),1);
  })();
  const intervals=economyIntervals().filter(x=>!pfx||x.date>=pfx);
  const distance=intervals.reduce((s,x)=>s+x.distance,0);
  const litres=rows.reduce((s,r)=>s+(+r.volume||0),0);
  const avg=intervals.length?intervals.reduce((s,x)=>s+x.distance,0)/intervals.reduce((s,x)=>s+x.litres,0):null;
  const spendSgd=rows.reduce((s,r)=>s+(r.currency==='MYR'?(+r.cost||0)/3.16:(+r.cost||0)),0);
  return {rows,distance,litres,avg,spendSgd,refuels:rows.length};
}
function renderThemes(){
  const row=document.getElementById('themeRow');row.innerHTML='';
  list().forEach(t=>{
    const b=document.createElement('button');
    b.className='theme-card'+(t.id===state.selected[state.mode]?' active':'');
    b.style.setProperty('--logo-color',t.lc);
    b.innerHTML=`<div class="theme-logo">${esc(t.logo)}</div><div class="theme-name">${esc(t.name)}</div>`;
    b.onclick=()=>{state.selected[state.mode]=t.id;saveState();renderAll()};
    row.appendChild(b);
  });
}
function renderHero(){
  const t=currentTheme();
  document.documentElement.style.setProperty('--accent',t.a);
  document.documentElement.style.setProperty('--accent2',t.a2);
  document.getElementById('themeTitle').textContent=(state.mode==='bike'?'BIKE':'CAR')+' THEMES';
  document.getElementById('heroBrand').textContent=t.logo;
  document.getElementById('heroPlate').textContent=state.registrations[state.mode]||'Enter Registration No.';
  document.getElementById('heroTag').textContent=t.tag;
  document.getElementById('heroSpecs').innerHTML=t.spec.map(s=>`<div><b>${esc(s)}</b></div>`).join('');
  document.getElementById('dbName').textContent=state.mode==='bike'?'BikeFuelData.json':'CarFuelData.json';
  document.getElementById('selectedTheme').textContent=t.name;
  document.getElementById('vehicleRegInput').value=state.registrations[state.mode]||'';
}
function renderDashboard(){
  const s=dashboardSummary();
  const vals=state.dashMode==='efficiency'
    ? [['Distance Travelled',s.distance?Math.round(s.distance).toLocaleString()+' km':'—','selected period'],
       ['Average Economy',s.avg?s.avg.toFixed(1)+' km/L':'—','weighted average'],
       ['Fuel Purchased',s.litres.toFixed(1)+' L',s.refuels+' refuels'],
       ['Cost / 100 KM',s.distance?('S$'+(s.spendSgd/s.distance*100).toFixed(2)):'—','SGD equivalent']]
    : [['Combined Spend','S$'+s.spendSgd.toFixed(2),'SGD equivalent'],
       ['Average / Refuel',s.refuels?'S$'+(s.spendSgd/s.refuels).toFixed(2):'—','selected period'],
       ['Fuel Purchased',s.litres.toFixed(1)+' L',s.refuels+' refuels'],
       ['Refuels',String(s.refuels),'selected period']];
  document.getElementById('metrics').innerHTML=vals.map(v=>`<div class="metric"><div class="icon">•</div><div class="k">${v[0]}</div><div class="v">${v[1]}</div><div class="s">${v[2]}</div></div>`).join('');
  document.getElementById('effBtn').classList.toggle('active',state.dashMode==='efficiency');
  document.getElementById('spendBtn').classList.toggle('active',state.dashMode==='spending');
  document.querySelectorAll('.period button').forEach(b=>b.classList.toggle('active',b.dataset.period===state.period));
  renderHealth();
}
function renderHealth(){
  const rows=[...currentRecords()].sort((a,b)=>new Date(a.dateTime)-new Date(b.dateTime));
  let invalid=0, regress=0, duplicates=0;
  const seen=new Set();
  rows.forEach((r,i)=>{
    if(!validDate(r.dateTime)||!(+r.mileage>=0)||!(+r.volume>0)||!(+r.cost>=0)||!r.station) invalid++;
    const fp=[r.dateTime,r.mileage,r.volume,r.cost,r.currency,r.station].join('|');
    if(seen.has(fp))duplicates++; else seen.add(fp);
    if(i&&+r.mileage<+rows[i-1].mileage)regress++;
  });
  const status=document.querySelector('.health');
  const strong=status.querySelector('strong');
  const span=status.querySelector('span');
  const latest=rows.filter(r=>validDate(r.dateTime)).sort((a,b)=>new Date(b.dateTime)-new Date(a.dateTime))[0];
  if(invalid||regress||duplicates){
    status.style.borderColor='#6a511f';status.style.background='#231b0d';strong.style.color='#f2bd54';
    strong.textContent='REVIEW DATA';
    span.textContent=`${invalid} invalid • ${regress} odometer issue • ${duplicates} duplicate`;
  }else{
    status.style.borderColor='#255e38';status.style.background='#07150c';strong.style.color='#5de078';
    strong.textContent='DATA HEALTHY';
    span.textContent=latest?'Latest record: '+new Date(latest.dateTime).toLocaleString():'No records yet';
  }
}
function renderHistory(){
  const rows=[...currentRecords()].sort((a,b)=>new Date(b.dateTime)-new Date(a.dateTime));
  document.getElementById('historyBody').innerHTML=rows.map(r=>{
    const cost100=(()=>{
      const asc=[...currentRecords()].sort((a,b)=>new Date(a.dateTime)-new Date(b.dateTime));
      const pos=asc.findIndex(x=>x.id===r.id);
      if(pos<1)return '—';
      const dist=+r.mileage-(+asc[pos-1].mileage);
      const sgd=r.currency==='MYR'?(+r.cost||0)/3.16:(+r.cost||0);
      return dist>0?'S$'+(sgd/dist*100).toFixed(2):'—';
    })();
    return `<tr>
      <td>${esc(new Date(r.dateTime).toLocaleString())}<br><span style="color:#7f8a94">${esc(r.station)}</span></td>
      <td>${(+r.mileage).toLocaleString()} km</td>
      <td>${(+r.volume).toFixed(2)} L</td>
      <td>${money(r.cost,r.currency)}</td>
      <td>${cost100}</td>
      <td><button class="secondary" onclick="editRecord('${r.id}')">VIEW/EDIT</button> <button class="danger" onclick="deleteRecord('${r.id}')">DELETE</button></td>
    </tr>`;
  }).join('');
}
function renderModeButtons(){
  document.getElementById('bikeBtn').classList.toggle('active',state.mode==='bike');
  document.getElementById('carBtn').classList.toggle('active',state.mode==='car');
}
function renderAll(){renderModeButtons();renderThemes();renderHero();renderDashboard();renderHistory();saveState()}

function setMode(m){state.mode=m;renderAll();resetForm()}
function resetForm(){
  document.getElementById('editId').value='';
  document.getElementById('fuelForm').reset();
  const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());
  document.getElementById('dateTime').value=d.toISOString().slice(0,16);
  document.getElementById('currency').value='SGD';
  document.getElementById('fuelGrade').value='95 RON';
}
function editRecord(id){
  const r=currentRecords().find(x=>x.id===id);if(!r)return;
  document.getElementById('editId').value=r.id;
  document.getElementById('dateTime').value=r.dateTime;
  document.getElementById('mileage').value=r.mileage;
  document.getElementById('station').value=r.station;
  document.getElementById('volume').value=r.volume;
  document.getElementById('cost').value=r.cost;
  document.getElementById('currency').value=r.currency;
  document.getElementById('fuelGrade').value=r.fuelGrade||'95 RON';
  document.getElementById('notes').value=r.notes||'';
  document.getElementById('fuelForm').scrollIntoView({behavior:'smooth',block:'center'});
}
function deleteRecord(id){
  if(!confirm('Delete this refuel record?'))return;
  state.records[state.mode]=currentRecords().filter(x=>x.id!==id);renderAll();
}
function saveRecord(e){
  e.preventDefault();
  const r={
    id:document.getElementById('editId').value||uid(),
    dateTime:document.getElementById('dateTime').value,
    mileage:+document.getElementById('mileage').value,
    station:document.getElementById('station').value.trim(),
    volume:+document.getElementById('volume').value,
    cost:+document.getElementById('cost').value,
    currency:document.getElementById('currency').value,
    fuelGrade:document.getElementById('fuelGrade').value,
    notes:document.getElementById('notes').value.trim()
  };
  if(!r.dateTime||!r.station||!(r.mileage>=0)||!(r.volume>0)||!(r.cost>=0)){alert('Please complete all required fields.');return;}
  const arr=currentRecords();const pos=arr.findIndex(x=>x.id===r.id);
  if(pos>=0)arr[pos]=r;else arr.push(r);
  state.records[state.mode]=arr;renderAll();resetForm();alert(pos>=0?'Refuel updated.':'Refuel saved.');
}
function exportCsv(){
  const rows=currentRecords();
  const cols=['dateTime','mileage','station','volume','cost','currency','fuelGrade','notes'];
  const csv=[cols.join(',')].concat(rows.map(r=>cols.map(k=>'"'+String(r[k]??'').replaceAll('"','""')+'"').join(','))).join('\n');
  downloadBlob(csv,(state.mode==='bike'?'Bike':'Car')+'Fuel.csv','text/csv');
}
function exportDb(){
  const payload={app:'Fuel Tracker Unified',version:14,exportedAt:new Date().toISOString(),state};
  downloadBlob(JSON.stringify(payload,null,2),'FuelTrackerMasterDB.json','application/json');
}
function downloadBlob(content,name,type){
  const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),300);
}
function importDb(file){
  if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const p=JSON.parse(reader.result);const next=p.state||p;
      if(!next.records||!next.selected)throw new Error();
      if(confirm('Replace the current data with this MasterDB?')){state=next;saveState();renderAll();resetForm();alert('MasterDB loaded.');}
    }catch(e){alert('Invalid Fuel Tracker MasterDB file.');}
  };
  reader.readAsText(file);
}
function refreshUi(){
  const btn=document.getElementById('refreshBtn');btn.textContent='Checking…';
  setTimeout(()=>{state=loadState();renderAll();btn.textContent='Updated';},450);
  setTimeout(()=>btn.textContent='Refresh',1200);
}
function clearCurrent(){
  if(confirm('Clear all '+state.mode+' records?')){state.records[state.mode]=[];renderAll();}
}

document.getElementById('bikeBtn').onclick=()=>setMode('bike');
document.getElementById('carBtn').onclick=()=>setMode('car');
document.getElementById('effBtn').onclick=()=>{state.dashMode='efficiency';renderDashboard();saveState()};
document.getElementById('spendBtn').onclick=()=>{state.dashMode='spending';renderDashboard();saveState()};
document.querySelectorAll('.period button').forEach((b,i)=>{b.dataset.period=['14','month','year','all'][i];b.onclick=()=>{state.period=b.dataset.period;renderDashboard();saveState()}});
document.getElementById('settingsBtn').onclick=()=>document.getElementById('settingsBox').scrollIntoView({behavior:'smooth'});
document.getElementById('refreshBtn').onclick=refreshUi;
document.getElementById('fuelForm').addEventListener('submit',saveRecord);
document.getElementById('vehicleRegInput').addEventListener('input',e=>{state.registrations[state.mode]=e.target.value.toUpperCase();document.getElementById('heroPlate').textContent=state.registrations[state.mode]||'Enter Registration No.';saveState()});
document.getElementById('exportCsvBtn').onclick=exportCsv;
document.getElementById('clearBtn').onclick=clearCurrent;
document.getElementById('saveDbBtn').onclick=exportDb;
document.getElementById('loadDbInput').addEventListener('change',e=>importDb(e.target.files?.[0]));
document.getElementById('newDbBtn').onclick=()=>{if(confirm('Create a new empty database for both trackers?')){state=structuredClone(defaultState);state.records={bike:[],car:[]};saveState();renderAll();resetForm();}};

renderAll();resetForm();