(function(){
  'use strict';
  if(window.FuelTrackerAutomationDwell)return;

  const REV='v16.0-custom-dwell-1';
  const SETTINGS_KEY='fueltrackerV160AutomationSettings';
  const MIN=1,MAX=60,DEFAULT=3;

  function readSettings(){
    try{return Object.assign({dwellMinutes:DEFAULT},JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}'));}
    catch(e){return {dwellMinutes:DEFAULT};}
  }

  function clamp(value){
    const n=Math.round(Number(value));
    return Number.isFinite(n)?Math.min(MAX,Math.max(MIN,n)):DEFAULT;
  }

  function saveDwell(value){
    const cfg=readSettings();
    cfg.dwellMinutes=clamp(value);
    localStorage.setItem(SETTINGS_KEY,JSON.stringify(cfg));
    const api=window.FuelTrackerAutomation;
    if(api){
      api.stopMonitoring?.();
      if(cfg.enabled)api.startMonitoring?.();
    }
    return cfg.dwellMinutes;
  }

  function enhance(){
    const old=document.getElementById('v160Dwell');
    if(!old||old.dataset.customDwell==='1')return;

    const value=clamp(readSettings().dwellMinutes);
    const input=document.createElement('input');
    input.id='v160Dwell';
    input.type='number';
    input.min=String(MIN);
    input.max=String(MAX);
    input.step='1';
    input.inputMode='numeric';
    input.value=String(value);
    input.dataset.customDwell='1';
    input.setAttribute('aria-label','Minimum petrol station dwell time in minutes');
    old.replaceWith(input);

    const control=input.closest('.v160-auto-control');
    if(control&&!control.querySelector('.v160-dwell-help')){
      const help=document.createElement('div');
      help.className='v160-dwell-help';
      help.textContent='1–60 min';
      help.style.cssText='margin-top:4px;font-size:7px;color:#72808a';
      control.appendChild(help);
    }

    input.addEventListener('change',()=>{
      input.value=String(saveDwell(input.value));
    });
    input.addEventListener('blur',()=>{
      input.value=String(saveDwell(input.value));
    });
  }

  let timer=null;
  const observer=new MutationObserver(()=>{
    clearTimeout(timer);
    timer=setTimeout(enhance,0);
  });
  observer.observe(document.body,{childList:true,subtree:true});

  enhance();
  window.addEventListener('load',()=>setTimeout(enhance,100));
  document.addEventListener('fueltracker:pagechange',()=>setTimeout(enhance,30));
  window.FuelTrackerAutomationDwell={revision:REV,min:MIN,max:MAX,saveDwell,enhance};
})();
