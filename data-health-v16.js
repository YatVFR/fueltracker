(function(){
  'use strict';
  if(window.FuelTrackerDataHealthV165)return;
  const REV='v16.5.0-data-health-1';

  function garage(){try{return window.state?.garageV15||state?.garageV15||null;}catch(e){return null;}}
  function profiles(){return garage()?.profiles||[];}
  function activeProfile(){
    const g=garage(),ps=profiles();
    return ps.find(p=>p.id===g?.activeProfileId)||ps[0]||null;
  }
  function profileData(p){
    if(!p)return null;
    const g=garage();
    return p.legacy?g?.legacy?.[p.type]:p.data;
  }
  function finite(v){return Number.isFinite(Number(v));}
  function validDate(v){if(!v)return false;const d=new Date(v);return !Number.isNaN(d.getTime());}
  function fingerprint(r){
    return [r?.dateTime||'',Number(r?.mileage)||0,Number(r?.volume)||0,Number(r?.cost)||0,String(r?.currency||''),String(r?.location||r?.station||'').trim().toLowerCase()].join('|');
  }
  function inspectProfile(p){
    const d=profileData(p)||{},rows=Array.isArray(d.records)?d.records:[];
    let invalid=0,duplicates=0,odometerRegressions=0;
    const seen=new Set();
    rows.forEach(r=>{
      const volume=Number(r?.volume),cost=Number(r?.cost),mileage=Number(r?.mileage);
      if(!validDate(r?.dateTime)||!Number.isFinite(volume)||volume<=0||!Number.isFinite(cost)||cost<0||!Number.isFinite(mileage)||mileage<0)invalid++;
      const fp=fingerprint(r);if(seen.has(fp))duplicates++;else seen.add(fp);
    });
    const odo=rows.filter(r=>validDate(r?.dateTime)&&finite(r?.mileage)&&Number(r.mileage)>0).sort((a,b)=>new Date(a.dateTime)-new Date(b.dateTime));
    for(let i=1;i<odo.length;i++)if(Number(odo[i].mileage)<Number(odo[i-1].mileage))odometerRegressions++;
    const dated=rows.filter(r=>validDate(r?.dateTime)).sort((a,b)=>new Date(b.dateTime)-new Date(a.dateTime));
    const latest=dated[0]||null;
    return {
      profileId:p?.id||null,type:p?.type||null,name:p?.name||d.registration||'Vehicle',
      database:p?.masterDb?.filename||null,records:rows.length,invalid,duplicates,odometerRegressions,
      latest:latest?{id:latest.id||null,dateTime:latest.dateTime,mileage:Number(latest.mileage)||0,volume:Number(latest.volume)||0,cost:Number(latest.cost)||0,currency:latest.currency||'',location:latest.location||latest.station||''}:null,
      healthy:invalid===0&&duplicates===0&&odometerRegressions===0
    };
  }
  function inspect(){
    const ps=profiles();
    const result={revision:REV,checkedAt:new Date().toISOString(),profiles:ps.map(inspectProfile)};
    result.summary={
      vehicles:result.profiles.length,
      records:result.profiles.reduce((n,p)=>n+p.records,0),
      invalid:result.profiles.reduce((n,p)=>n+p.invalid,0),
      duplicates:result.profiles.reduce((n,p)=>n+p.duplicates,0),
      odometerRegressions:result.profiles.reduce((n,p)=>n+p.odometerRegressions,0)
    };
    result.healthy=result.summary.invalid===0&&result.summary.duplicates===0&&result.summary.odometerRegressions===0;
    return result;
  }
  function active(){const p=activeProfile();return p?inspectProfile(p):null;}
  window.FuelTrackerDataHealthV165={revision:REV,inspect,active,inspectProfile};
})();