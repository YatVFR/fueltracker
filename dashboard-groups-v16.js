(function(){
'use strict';
if(window.FuelTrackerDashboardGroupsV166)return;
const KEY='ft-v166-dashboard-group';
function init(){
 const dash=document.querySelector('.hero-dash .dashboard');
 if(!dash||dash.dataset.ftGroups)return;
 const top=dash.querySelector('.dashboard-top'),metrics=dash.querySelector('#metrics'),health=dash.querySelector('.health');
 const eff=document.getElementById('effBtn'),spend=document.getElementById('spendBtn');
 if(!top||!metrics||!eff||!spend)return;
 dash.dataset.ftGroups='1';
 const shell=document.createElement('div');shell.className='ft-v166-groups';
 const heading=document.createElement('div');heading.className='ft-v166-heading';heading.textContent='DETAILED ANALYTICS';
 const definitions=[['fuel','⛽','Fuel Efficiency','Consumption and driving trends'],['spending','💳','Spending','Fuel costs and currency comparisons'],['maintenance','🔧','Maintenance','Service history and forecasts']];
 const panels={};
 definitions.forEach(([id,emoji,title,sub])=>{
  const details=document.createElement('details');details.className='ft-v166-group';details.dataset.group=id;
  const summary=document.createElement('summary');summary.innerHTML='<span class="ft-v166-icon">'+emoji+'</span><span class="ft-v166-name"><strong>'+title+'</strong><small>'+sub+'</small></span><span class="ft-v166-chevron" aria-hidden="true">⌄</span>';
  const body=document.createElement('div');body.className='ft-v166-body';
  details.append(summary,body);shell.append(details);panels[id]={details,body};
 });
 // Keep the original period selector, metric element and data-health panel intact.
 const shared=document.createElement('div');shared.className='ft-v166-shared';
 shared.append(top,metrics);if(health)shared.append(health);
 const hint=document.createElement('p');hint.className='ft-v166-hint';hint.textContent='Maintenance history is available on the Maintenance page. Mileage and replacement forecasting will be added after data validation.';
 panels.maintenance.body.append(hint);
 dash.append(heading,shell);
 function activate(id,persist){
  if(id!=='maintenance'){
   const target=id==='fuel'?eff:spend;
   if(!target.classList.contains('active'))target.click();
   panels[id].body.append(shared);
   panels.fuel.details.open=id==='fuel';
   panels.spending.details.open=id==='spending';
  }
  if(persist)try{localStorage.setItem(KEY,id)}catch(e){}
 }
 panels.fuel.details.addEventListener('toggle',()=>{if(panels.fuel.details.open)activate('fuel',true)});
 panels.spending.details.addEventListener('toggle',()=>{if(panels.spending.details.open)activate('spending',true)});
 // Existing efficiency/spending controls remain in DOM and preserve their original event handlers.
 const prior=(()=>{try{return localStorage.getItem(KEY)}catch(e){return null}})();
 activate(prior==='spending'?'spending':'fuel',false);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.FuelTrackerDashboardGroupsV166={revision:'v16.6.0-dashboard-groups-1',init};
})();