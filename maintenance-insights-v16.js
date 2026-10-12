(function(){
'use strict';
if(window.FuelTrackerMaintenanceInsightsV1661)return;
const DAY=86400000;
const validDate=v=>{const d=v?new Date(v):null;return d&&Number.isFinite(+d)&&+d<=Date.now()+DAY?d:null};
const validKm=v=>v==null||v===''?null:(Number.isFinite(+v)&&+v>=0?+v:null);
const fmt=v=>Number.isFinite(v)?Math.round(v).toLocaleString():'—';
const fmtDate=d=>d?d.toLocaleDateString():'—';
function render(){
 const host=document.querySelector('.ft-v166-group[data-group="maintenance"]>.ft-v166-body');if(!host)return;
 let g;try{g=state.garageV15}catch(e){}
 const p=g?.profiles?.find(x=>x.id===g.activeProfileId)||g?.profiles?.[0];
 if(!p){host.textContent='Select a vehicle to view maintenance insights.';return}
 const d=p.legacy?g.legacy?.[p.type]:p.data;
 const records=(p.id===g.activeProfileId&&Array.isArray(state.records?.[p.type])?state.records[p.type]:d?.records)||[];
 const points=records.map(r=>({date:validDate(r.dateTime||r.date),km:validKm(r.mileage??r.odometer)})).filter(x=>x.date&&x.km!==null).sort((a,b)=>a.date-b.date);
 const rate=m=>{const q=points.filter(x=>+x.date>=Date.now()-m*30.4375*DAY);if(q.length<2)return null;const a=q[0],b=q[q.length-1],days=(b.date-a.date)/DAY;return days>=7&&b.km>a.km?(b.km-a.km)/days*30.4375:null};
 const rates=[1,6,12].map(rate),pace=rates[2]??rates[1]??rates[0];
 const last=points.length?points[points.length-1].km:null;
 const current=validKm((p.id===g.activeProfileId?state.currentOdometer?.[p.type]?.value:null)??d?.odometer?.value);
 const odometer=current!==null&&last!==null?Math.max(current,last):current??last;
 const next=odometer===null?null:(Math.floor(odometer/10000)+1)*10000;
 const estimate=next!==null&&pace>0?new Date(Date.now()+(next-odometer)/pace*30.4375*DAY):null;
 const tile=(name,value,sub)=>'<div class="ft-mi-card"><small>'+name+'</small><strong>'+value+'</strong><span>'+sub+'</span></div>';
 const entries=Array.isArray(g.maintenance?.[p.id])?g.maintenance[p.id]:[];
 const groups=[['Tyres',/tyre|tire/i],['Brake pads',/brake.*pad|pad.*brake/i],['Engine oil',/engine oil|oil change/i],['Transmission oil',/transmission oil|gearbox oil|atf/i],['Battery',/battery/i]];
 const history=groups.map(([label,re])=>{const match=entries.filter(e=>re.test([e.category,e.description,e.notes].join(' '))&&validDate(e.dateTime||e.date)).sort((a,b)=>new Date(b.dateTime||b.date)-new Date(a.dateTime||a.date))[0];return '<div class="ft-mi-item"><b>'+label+'</b><span>'+(match?'Last recorded '+fmtDate(validDate(match.dateTime||match.date))+(validKm(match.odometer)!==null?' · '+fmt(validKm(match.odometer))+' km':''):'No recorded replacement')+'</span><small>Interval not configured</small></div>'}).join('');
 host.innerHTML='<div class="ft-mi"><p>Read-only estimates for the selected vehicle.</p><div class="ft-mi-grid">'+rates.map((r,i)=>tile([1,6,12][i]+'-month average',r===null?'Insufficient data':fmt(r)+' km/month','Based on valid odometer history')).join('')+tile('Annual projection',pace>0?fmt(pace*12)+' km/year':'Insufficient data','Longest available history')+tile('Next 10,000 km milestone',next===null?'Insufficient data':fmt(next)+' km',estimate?'Estimated '+fmtDate(estimate):'Date needs sufficient mileage history')+'</div><h4>Replacement history</h4>'+history+'<p>Replacement due dates need vehicle-specific intervals. The 10,000 km milestone is informational, not a manufacturer requirement.</p></div>';
}
function init(){
 const css=document.createElement('style');css.textContent='.ft-mi{color:#dcecf5}.ft-mi p,.ft-mi-item span,.ft-mi-item small{color:#9fbacc;font-size:12px;line-height:1.5}.ft-mi-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.ft-mi-card{padding:12px;border:1px solid #314d61;border-radius:10px;background:#0b1c2b;display:grid;gap:5px}.ft-mi-card small,.ft-mi-card span{color:#9fbacc;font-size:11px}.ft-mi-card strong{font-size:16px;overflow-wrap:anywhere}.ft-mi h4{margin:18px 0 9px}.ft-mi-item{padding:11px 0;border-bottom:1px solid #284154;display:grid;gap:4px}@media(max-width:450px){.ft-mi-grid{grid-template-columns:1fr}}';document.head.append(css);
 render();['fueltracker:datachange','fueltracker:maintenancechange','fueltracker:pagechange'].forEach(name=>document.addEventListener(name,render));
 document.addEventListener('click',e=>{if(e.target.closest('[data-profile-switch],[data-profile-open],#bikeBtn,#carBtn,#odoSaveBtn'))setTimeout(render,100)});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.FuelTrackerMaintenanceInsightsV1661={revision:'v16.6.1-maintenance-insights-1',render};
})();