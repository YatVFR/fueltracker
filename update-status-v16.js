(function(){
  'use strict';
  if(window.FuelTrackerUpdateStatusV16)return;

  const REV='v16.4.7-update-status-3';
  let registration=null;
  let lastCheck=0;
  let checking=false;

  function button(){return document.getElementById('refreshBtn');}
  function paint(status){
    const btn=button();if(!btn)return;
    let text='Latest',color='#5add76';
    if(status==='available'){text='Updates Available';color='#f2bd54';}
    else if(status==='checking'){text='Checking…';color='#89949d';}
    btn.innerHTML=`Refresh<br><span data-update-status="${status}" style="font-size:11px;color:${color}">${text}</span>`;
    btn.dataset.updateStatus=status;
    btn.setAttribute('aria-label',`Refresh. ${text}`);
  }

  function watchInstalling(worker){
    if(!worker||worker.datasetUpdateStatusBound)return;
    worker.datasetUpdateStatusBound=true;
    const sync=()=>{
      if(worker.state==='installed'&&registration?.active)paint('available');
      else if(worker.state==='activated')paint('latest');
    };
    worker.addEventListener('statechange',sync);sync();
  }

  function bindRegistration(reg){
    if(!reg)return;
    registration=reg;
    if(reg.__fuelTrackerStatusBound)return;
    reg.__fuelTrackerStatusBound=true;
    reg.addEventListener('updatefound',()=>watchInstalling(reg.installing));
    if(reg.installing)watchInstalling(reg.installing);
  }

  async function inspect({network=true,showChecking=false}={}){
    if(checking)return;
    checking=true;
    if(showChecking)paint('checking');
    try{
      const reg=await navigator.serviceWorker.getRegistration('./')||await navigator.serviceWorker.ready;
      bindRegistration(reg);
      if(network){
        try{await reg.update();lastCheck=Date.now();}catch(e){}
      }
      if(reg.waiting){paint('available');return 'available';}
      if(reg.installing&&reg.active){watchInstalling(reg.installing);return 'checking';}
      paint('latest');return 'latest';
    }catch(e){
      paint('latest');return 'latest';
    }finally{checking=false;}
  }

  function scheduleInspect(delay=0,opts={}){setTimeout(()=>inspect(opts),delay);}

  if('serviceWorker' in navigator){
    navigator.serviceWorker.addEventListener('controllerchange',()=>scheduleInspect(220,{network:false}));
    window.addEventListener('load',()=>scheduleInspect(900,{network:true}),{once:true});
    document.addEventListener('visibilitychange',()=>{
      if(!document.hidden&&Date.now()-lastCheck>60000)scheduleInspect(250,{network:true});
    });
    document.addEventListener('click',e=>{
      if(e.target.closest('#refreshBtn')){
        scheduleInspect(1800,{network:false});
        scheduleInspect(3200,{network:false});
      }
    },true);
  }else paint('latest');

  // Set a useful state immediately while the quiet network check happens later.
  paint('latest');
  async function activateWaiting(){
    const reg=registration||await navigator.serviceWorker.getRegistration('./')||await navigator.serviceWorker.ready;
    if(!reg?.waiting)return false;
    return await new Promise(resolve=>{
      let done=false;
      const finish=v=>{if(done)return;done=true;resolve(v)};
      navigator.serviceWorker.addEventListener('controllerchange',()=>finish(true),{once:true});
      reg.waiting.postMessage({type:'SKIP_WAITING'});
      setTimeout(()=>finish(true),1800);
    });
  }
  window.FuelTrackerUpdateStatusV16={revision:REV,inspect,paint,activateWaiting};
})();
