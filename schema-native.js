(function(){
  const NATIVE_REV='2026-09-01-v14-native-schema-1';
  const BUNDLED_REV='2026-09-01T13:14:16.791Z-v4';
  const FX_KEYS={bike:'bikeLastSgdMyrRate',car:'carLastSgdMyrRate'};

  function normalizeEntry(e){
    return {
      id:e.id||uid(),
      dateTime:e.dateTime||'',
      location:e.location||e.station||'',
      volume:Number(e.volume)||0,
      cost:Number(e.cost)||0,
      currency:String(e.currency||'').toUpperCase(),
      fxRateSGDMYR:Number(e.fxRateSGDMYR)>0?Number(e.fxRateSGDMYR):null,
      mileage:Number(e.mileage)||0,
      fuelType:e.fuelType||e.fuelGrade||'',
      notes:e.notes||''
    };
  }
  function normalizeState(){
    state.records=state.records||{bike:[],car:[]};
    for(const mode of ['bike','car']) state.records[mode]=(state.records[mode]||[]).map(normalizeEntry);
  }
  function fxFallback(mode=state.mode){
    const n=Number(localStorage.getItem(FX_KEYS[mode]));
    return Number.isFinite(n)&&n>0?n:3.16;
  }
  function entryFx(e){
    const n=Number(e.fxRateSGDMYR);
    return Number.isFinite(n)&&n>0?n:fxFallback();
  }
  function ensureSelectOption(select,value){
    if(!select||!value)return;
    const exists=[...select.options].some(o=>o.value===value);
    if(!exists){const o=document.createElement('option');o.value=value;o.textContent=value;select.appendChild(o);}
  }
  function syncFxField(){
    const currency=document.getElementById('currency'),wrap=document.getElementById('fxRateWrap'),input=document.getElementById('fxRate');
    if(!currency||!wrap||!input)return;
    const isMYR=currency.value==='MYR';
    wrap.classList.toggle('show',isMYR);
    input.required=isMYR;
    if(isMYR&&!input.value)input.value=fxFallback().toFixed(3);
    if(!isMYR)input.value='';
  }

  dashboardSummary=function(){
    const rows=periodRecords();
    const pfx=state.period==='all'?null:(()=>{const now=new Date();if(state.period==='14')return new Date(now.getTime()-14*86400000);if(state.period==='year')return new Date(now.getFullYear(),0,1);return new Date(now.getFullYear(),now.getMonth(),1);})();
    const intervals=economyIntervals().filter(x=>!pfx||x.date>=pfx);
    const distance=intervals.reduce((s,x)=>s+x.distance,0);
    const litres=rows.reduce((s,r)=>s+(+r.volume||0),0);
    const avg=intervals.length?intervals.reduce((s,x)=>s+x.distance,0)/intervals.reduce((s,x)=>s+x.litres,0):null;
    const spendSgd=rows.reduce((s,r)=>s+(r.currency==='MYR'?(+r.cost||0)/entryFx(r):(+r.cost||0)),0);
    return {rows,distance,litres,avg,spendSgd,refuels:rows.length};
  };

  renderHealth=function(){
    const rows=[...currentRecords()].sort((a,b)=>new Date(a.dateTime)-new Date(b.dateTime));
    let invalid=0,regress=0,duplicates=0;const seen=new Set();
    rows.forEach(r=>{
      if(!validDate(r.dateTime)||!(+r.mileage>=0)||!(+r.volume>0)||!(+r.cost>=0)||!r.location)invalid++;
      const fp=[r.dateTime,r.mileage,r.volume,r.cost,r.currency,r.location].join('|');
      if(seen.has(fp))duplicates++;else seen.add(fp);
    });
    const mileageRows=rows.filter(r=>+r.mileage>0);
    for(let i=1;i<mileageRows.length;i++)if(+mileageRows[i].mileage<+mileageRows[i-1].mileage)regress++;
    const status=document.querySelector('.health');if(!status)return;
    const strong=status.querySelector('strong'),span=status.querySelector('span');
    const latest=rows.filter(r=>validDate(r.dateTime)).sort((a,b)=>new Date(b.dateTime)-new Date(a.dateTime))[0];
    if(invalid||regress||duplicates){status.style.borderColor='#6a511f';status.style.background='#231b0d';strong.style.color='#f2bd54';strong.textContent='REVIEW DATA';span.textContent=`${invalid} invalid • ${regress} odometer issue • ${duplicates} duplicate`;}
    else{status.style.borderColor='#255e38';status.style.background='#07150c';strong.style.color='#5de078';strong.textContent='DATA HEALTHY';span.textContent=latest?'Latest record: '+new Date(latest.dateTime).toLocaleString():'No records yet';}
  };

  renderHistory=function(){
    const rows=[...currentRecords()].sort((a,b)=>new Date(b.dateTime)-new Date(a.dateTime));
    const mileageRows=[...currentRecords()].filter(r=>+r.mileage>0).sort((a,b)=>new Date(a.dateTime)-new Date(b.dateTime));
    document.getElementById('historyBody').innerHTML=rows.map(r=>{
      let cost100='—';
      if(+r.mileage>0){const pos=mileageRows.findIndex(x=>x.id===r.id);if(pos>=1){const dist=+r.mileage-(+mileageRows[pos-1].mileage);const sgd=r.currency==='MYR'?(+r.cost||0)/entryFx(r):(+r.cost||0);if(dist>0)cost100='S$'+(sgd/dist*100).toFixed(2);}}
      return `<tr><td>${esc(new Date(r.dateTime).toLocaleString())}<br><span style="color:#7f8a94">${esc(r.location)}</span></td><td>${+r.mileage>0?(+r.mileage).toLocaleString()+' km':'—'}</td><td>${(+r.volume).toFixed(2)} L</td><td>${money(r.cost,r.currency)}</td><td>${cost100}</td><td><button class="secondary" onclick="editRecord('${r.id}')">VIEW/EDIT</button> <button class="danger" onclick="deleteRecord('${r.id}')">DELETE</button></td></tr>`;
    }).join('');
    enhanceHistory();
  };

  resetForm=function(){
    const f=document.getElementById('fuelForm');if(f)f.reset();
    const edit=document.getElementById('editId');if(edit)edit.value='';
    const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());
    document.getElementById('dateTime').value=d.toISOString().slice(0,16);
    document.getElementById('currency').value='';
    document.getElementById('fuelGrade').value='';
    syncFxField();
  };

  editRecord=function(id){
    const r=currentRecords().find(x=>x.id===id);if(!r)return;
    document.getElementById('editId').value=r.id;
    document.getElementById('dateTime').value=(r.dateTime||'').slice(0,16);
    document.getElementById('mileage').value=r.mileage||0;
    const station=document.getElementById('station');ensureSelectOption(station,r.location);station.value=r.location||'';
    document.getElementById('volume').value=r.volume;
    document.getElementById('cost').value=r.cost;
    document.getElementById('currency').value=r.currency||'';
    const grade=document.getElementById('fuelGrade');ensureSelectOption(grade,r.fuelType);grade.value=r.fuelType||'';
    document.getElementById('notes').value=r.notes||'';
    document.getElementById('fxRate').value=r.fxRateSGDMYR||'';
    syncFxField();
    document.getElementById('fuelForm').scrollIntoView({behavior:'smooth',block:'center'});
  };

  function nativeSaveRecord(e){
    e.preventDefault();
    const currency=document.getElementById('currency').value;
    const fx=currency==='MYR'?Number(document.getElementById('fxRate').value):null;
    const r={
      id:document.getElementById('editId').value||uid(),
      dateTime:document.getElementById('dateTime').value,
      location:document.getElementById('station').value,
      volume:Number(document.getElementById('volume').value),
      cost:Number(document.getElementById('cost').value),
      currency,
      fxRateSGDMYR:currency==='MYR'&&fx>0?fx:null,
      mileage:Number(document.getElementById('mileage').value),
      fuelType:document.getElementById('fuelGrade').value,
      notes:document.getElementById('notes').value.trim()
    };
    if(!r.dateTime||!r.location||!(r.mileage>=0)||!(r.volume>0)||!(r.cost>=0)||!r.currency){alert('Please complete all required fields.');return;}
    if(r.currency==='MYR'&&!(r.fxRateSGDMYR>0)){alert('Please enter the SGD/MYR exchange rate for this MYR refuel.');return;}
    if(r.fxRateSGDMYR) localStorage.setItem(FX_KEYS[state.mode],String(r.fxRateSGDMYR));
    const arr=currentRecords();const pos=arr.findIndex(x=>x.id===r.id);if(pos>=0)arr[pos]=r;else arr.push(r);state.records[state.mode]=arr;
    state.currentOdometer=state.currentOdometer||{};const cur=state.currentOdometer[state.mode];if(r.mileage>0&&(!cur||cur.value==null||r.mileage>+cur.value))state.currentOdometer[state.mode]={value:r.mileage,updatedAt:r.dateTime};
    saveState();renderAll();resetForm();alert(pos>=0?'Refuel updated.':'Refuel saved.');
  }

  exportCsv=function(){
    const data=currentRecords();if(!data.length){alert('No data to export.');return;}
    const header=['ID','Date & Time','Location','Volume (L)','Cost','Currency','Cost/L','SGD/MYR FX Rate','Mileage (KM)','Fuel Grade','Notes'];
    const rows=data.map(e=>[e.id||'',e.dateTime?new Date(e.dateTime).toLocaleString():'',e.location,e.volume,e.cost,e.currency,e.volume?(Number(e.cost)/Number(e.volume)).toFixed(2):'',e.fxRateSGDMYR||'',e.mileage,e.fuelType||'',e.notes||'']);
    const q=v=>'"'+String(v??'').replaceAll('"','""')+'"';
    downloadBlob([header,...rows].map(r=>r.map(q).join(',')).join('\n'),(state.mode==='bike'?'Bike':'Car')+'Fuel.csv','text/csv;charset=utf-8');
  };

  exportDb=function(){
    const isBike=state.mode==='bike';
    const payload={app:isBike?'RideFuel Universal Mobile':'AstinaFuel Universal Mobile',version:4,database:isBike?'BikeFuelData.json':'CarFuelData.json',exportedAt:new Date().toISOString(),entries:currentRecords().map(normalizeEntry)};
    downloadBlob(JSON.stringify(payload,null,2),payload.database,'application/json');
  };

  importDb=function(file){
    if(!file)return;const reader=new FileReader();
    reader.onload=()=>{try{const p=JSON.parse(reader.result);if(!Array.isArray(p.entries))throw new Error();const rows=p.entries.map(normalizeEntry);if(confirm(`Replace the current ${state.mode} data with ${rows.length} MasterDB entries?`)){state.records[state.mode]=rows;const valid=rows.filter(r=>+r.mileage>0&&validDate(r.dateTime)).sort((a,b)=>new Date(b.dateTime)-new Date(a.dateTime));const latest=valid[0];state.currentOdometer=state.currentOdometer||{};if(latest)state.currentOdometer[state.mode]={value:+latest.mileage,updatedAt:latest.dateTime};saveState();renderAll();resetForm();alert('MasterDB loaded.');}}catch(err){alert('Invalid Fuel Tracker MasterDB file.');}};
    reader.readAsText(file);
  };

  function bindNativeForm(){
    const old=document.getElementById('fuelForm');if(!old)return;
    const fresh=old.cloneNode(true);old.replaceWith(fresh);
    fresh.addEventListener('submit',nativeSaveRecord);
    document.getElementById('currency').addEventListener('change',syncFxField);
    document.getElementById('exportCsvBtn').onclick=exportCsv;
    document.getElementById('clearBtn').onclick=clearCurrent;
    syncFxField();
  }

  function enhanceHistory(){
    const body=document.getElementById('historyBody');if(!body)return;
    const card=body.closest('.card');const wrap=body.closest('.table-wrap');
    if(card)card.classList.add('history-card');
    if(wrap)wrap.classList.add('history-scroll');
    const title=card?.querySelector('h3');
    if(title){
      let count=title.querySelector('.history-count');
      if(!count){count=document.createElement('span');count.className='history-count';title.appendChild(count);}
      count.textContent=`${currentRecords().length} records`;
    }
  }

  function installUiFixStyles(){
    if(document.getElementById('v14UiFixStyles'))return;
    const style=document.createElement('style');style.id='v14UiFixStyles';
    style.textContent=`
      .history-card>h3{display:flex;align-items:center;justify-content:space-between;gap:10px}
      .history-count{font-size:10px;color:#89949d;font-weight:700;letter-spacing:.03em;text-transform:none}
      .history-scroll{max-height:540px;overflow:auto;-webkit-overflow-scrolling:touch;scrollbar-gutter:stable}
      .history-scroll thead th{position:sticky;top:0;z-index:3;background:#0a1117;box-shadow:0 1px 0 #26313b}
      @media(max-width:780px){.history-scroll{max-height:460px}}
    `;
    document.head.appendChild(style);
  }

  function bindRegistrationEdit(){
    const btn=document.getElementById('setRegBtn');if(!btn)return;
    btn.onclick=()=>{
      const current=state.registrations?.[state.mode]||'';
      const entered=window.prompt('Vehicle registration number',current);
      if(entered===null)return;
      const value=entered.trim().toUpperCase();
      state.registrations=state.registrations||{bike:'',car:''};
      state.registrations[state.mode]=value;
      saveState();
      document.getElementById('heroPlate').textContent=value||'Enter Registration No.';
      const input=document.getElementById('vehicleRegInput');if(input)input.value=value;
    };
  }

  async function applyExactBundledData(){
    if(state.nativeDbRevision===NATIVE_REV){normalizeState();saveState();renderAll();return;}
    for(let i=0;i<30&&state.masterDbRevision!==BUNDLED_REV;i++)await new Promise(r=>setTimeout(r,50));
    try{
      if(typeof decodeGzipBase64==='function'&&typeof BIKE_DB_GZ_B64!=='undefined'&&typeof CAR_DB_GZ_B64!=='undefined'){
        const [b,c]=await Promise.all([decodeGzipBase64(BIKE_DB_GZ_B64),decodeGzipBase64(CAR_DB_GZ_B64)]);
        const bike=JSON.parse(b),car=JSON.parse(c);
        state.records.bike=(bike.entries||[]).map(normalizeEntry);state.records.car=(car.entries||[]).map(normalizeEntry);
      }else normalizeState();
      for(const mode of ['bike','car']){
        const valid=(state.records[mode]||[]).filter(r=>+r.mileage>0&&validDate(r.dateTime)).sort((a,b)=>new Date(b.dateTime)-new Date(a.dateTime));
        const latest=valid[0];state.currentOdometer=state.currentOdometer||{};
        if(latest&&(!state.currentOdometer[mode]||state.currentOdometer[mode].value==null||+state.currentOdometer[mode].value<+latest.mileage))state.currentOdometer[mode]={value:+latest.mileage,updatedAt:latest.dateTime};
      }
      state.nativeDbRevision=NATIVE_REV;saveState();renderAll();
    }catch(err){console.error('Native MasterDB alignment failed',err);normalizeState();saveState();renderAll();}
  }

  installUiFixStyles();
  bindNativeForm();
  bindRegistrationEdit();
  enhanceHistory();
  document.getElementById('saveDbBtn').onclick=exportDb;
  document.getElementById('loadDbInput').onchange=e=>importDb(e.target.files?.[0]);
  resetForm();
  applyExactBundledData();
})();