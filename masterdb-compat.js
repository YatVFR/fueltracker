(function(){
  const originalImportDb=importDb;

  economyIntervals=function(){
    const rows=[...currentRecords()].filter(r=>validDate(r.dateTime)&&+r.mileage>0&&+r.volume>0).sort((a,b)=>new Date(a.dateTime)-new Date(b.dateTime));
    const out=[];
    for(let i=1;i<rows.length;i++){
      const prev=rows[i-1],cur=rows[i];
      const dist=+cur.mileage-(+prev.mileage);
      if(dist>0)out.push({date:new Date(cur.dateTime),distance:dist,economy:dist/(+cur.volume),litres:+cur.volume});
    }
    return out;
  };

  renderHealth=function(){
    const rows=[...currentRecords()].sort((a,b)=>new Date(a.dateTime)-new Date(b.dateTime));
    let invalid=0,regress=0,duplicates=0;
    const seen=new Set();
    rows.forEach(r=>{
      if(!validDate(r.dateTime)||!(+r.mileage>=0)||!(+r.volume>0)||!(+r.cost>=0)||!r.station)invalid++;
      const fp=[r.dateTime,r.mileage,r.volume,r.cost,r.currency,r.station].join('|');
      if(seen.has(fp))duplicates++;else seen.add(fp);
    });
    const mileageRows=rows.filter(r=>+r.mileage>0);
    for(let i=1;i<mileageRows.length;i++)if(+mileageRows[i].mileage<+mileageRows[i-1].mileage)regress++;
    const status=document.querySelector('.health');if(!status)return;
    const strong=status.querySelector('strong'),span=status.querySelector('span');
    const latest=rows.filter(r=>validDate(r.dateTime)).sort((a,b)=>new Date(b.dateTime)-new Date(a.dateTime))[0];
    if(invalid||regress||duplicates){
      status.style.borderColor='#6a511f';status.style.background='#231b0d';strong.style.color='#f2bd54';
      strong.textContent='REVIEW DATA';span.textContent=`${invalid} invalid • ${regress} odometer issue • ${duplicates} duplicate`;
    }else{
      status.style.borderColor='#255e38';status.style.background='#07150c';strong.style.color='#5de078';
      strong.textContent='DATA HEALTHY';span.textContent=latest?'Latest record: '+new Date(latest.dateTime).toLocaleString():'No records yet';
    }
  };

  renderHistory=function(){
    const rows=[...currentRecords()].sort((a,b)=>new Date(b.dateTime)-new Date(a.dateTime));
    const validMileage=[...currentRecords()].filter(r=>+r.mileage>0).sort((a,b)=>new Date(a.dateTime)-new Date(b.dateTime));
    document.getElementById('historyBody').innerHTML=rows.map(r=>{
      let cost100='—';
      if(+r.mileage>0){
        const pos=validMileage.findIndex(x=>x.id===r.id);
        if(pos>=1){
          const dist=+r.mileage-(+validMileage[pos-1].mileage);
          const sgd=r.currency==='MYR'?(+r.cost||0)/(+r.fxRateSGDMYR||3.16):(+r.cost||0);
          if(dist>0)cost100='S$'+(sgd/dist*100).toFixed(2);
        }
      }
      return `<tr><td>${esc(new Date(r.dateTime).toLocaleString())}<br><span style="color:#7f8a94">${esc(r.station)}</span></td><td>${+r.mileage>0?(+r.mileage).toLocaleString()+' km':'—'}</td><td>${(+r.volume).toFixed(2)} L</td><td>${money(r.cost,r.currency)}</td><td>${cost100}</td><td><button class="secondary" onclick="editRecord('${r.id}')">VIEW/EDIT</button> <button class="danger" onclick="deleteRecord('${r.id}')">DELETE</button></td></tr>`;
    }).join('');
  };

  importDb=function(file){
    if(!file)return;
    const reader=new FileReader();
    reader.onload=()=>{
      try{
        const p=JSON.parse(reader.result);
        if(Array.isArray(p.entries)){
          const rows=(p.entries||[]).map(e=>({id:e.id,dateTime:e.dateTime,station:e.location||e.station||'',volume:Number(e.volume)||0,cost:Number(e.cost)||0,currency:e.currency||'SGD',fxRateSGDMYR:e.fxRateSGDMYR??null,mileage:Number(e.mileage)||0,fuelGrade:e.fuelType||e.fuelGrade||'',notes:e.notes||''}));
          if(confirm(`Replace the current ${state.mode} data with ${rows.length} MasterDB entries?`)){
            state.records[state.mode]=rows;
            const valid=rows.filter(r=>+r.mileage>0&&validDate(r.dateTime)).sort((a,b)=>new Date(b.dateTime)-new Date(a.dateTime));
            const latest=valid[0];
            state.currentOdometer=state.currentOdometer||{};
            if(latest)state.currentOdometer[state.mode]={value:+latest.mileage,updatedAt:latest.dateTime};
            saveState();renderAll();resetForm();alert('MasterDB loaded.');
          }
          return;
        }
        originalImportDb(file);
      }catch(e){alert('Invalid Fuel Tracker MasterDB file.');}
    };
    reader.readAsText(file);
  };
})();
