(function(){
  'use strict';
  if(window.FuelTrackerRuntimeRecoveryV16)return;

  const REV='v16.3.2-runtime-recovery-1';
  const VERSION='v16.3.2 Maintenance Page Trial';
  const DISPLAY='16.3.2';
  const COMPAT='16.32';

  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  function applyVersion(){
    window.FUEL_TRACKER_VERSION=VERSION;
    window.FUEL_TRACKER_VERSION_NUMBER=COMPAT;
    window.FUEL_TRACKER_DISPLAY_VERSION=DISPLAY;
    const badge=document.querySelector('.brand small');if(badge)badge.textContent=VERSION;
    document.title='Fuel Tracker v'+DISPLAY;
  }
  function hasGarage(){try{return typeof state!=='undefined'&&Array.isArray(state?.garageV15?.profiles)&&state.garageV15.profiles.length>0;}catch(e){return false;}}
  function addCss(href,key){if(document.querySelector(`link[data-${key}]`)||document.querySelector(`link[href="${href}"]`))return;const l=document.createElement('link');l.rel='stylesheet';l.href=href;l.dataset[key]='1';document.head.appendChild(l);}
  function load(id,src){return new Promise(resolve=>{if(document.getElementById(id)){resolve();return;}const s=document.createElement('script');s.id=id;s.src=src;s.onload=resolve;s.onerror=resolve;document.body.appendChild(s);});}

  async function recover(){
    addCss('./mobile-header-fix.css','v1632Mobile');addCss('./garage-v15.css','v1632Garage');addCss('./maintenance-form-fix-v16.css','v1632MaintenanceForm');applyVersion();
    try{if(typeof renderAll==='function')renderAll();}catch(e){console.warn('v16.3.2 render recovery',e);}
    await sleep(80);
    if(!hasGarage()){
      await load('v1632GarageScript','./garage-v15.js?v=1632');
      try{if(typeof renderAll==='function')renderAll();}catch(e){}
      await sleep(80);
    }
    if(!document.getElementById('garageOverviewBox'))await load('v1632OverviewScript','./garage-overview-v15.js?v=1632');
    if(!document.getElementById('garageAnalyticsBox'))await load('v1632AnalyticsScript','./garage-analytics-v15.js?v=1632');
    if(!document.getElementById('odometerGrid')?.children.length)await load('v1632OdoScript','./odometer-live-v15.js?v=1632');
    if(!document.getElementById('v158PageNav'))await load('v1632NavScript','./navigation-v15-8.js?v=1632');
    await sleep(120);
    if(!window.FuelTrackerAutomation)await load('v1632AutomationScript','./automation-v16.js?v=1632');
    if(!window.FuelTrackerGarageMaintenanceV16)await load('v1632MaintenanceScript','./garage-maintenance-v16.js?v=1632');
    if(!window.FuelTrackerMaintenanceTrialV16)await load('v1632TrialScript','./maintenance-trial-v16.js?v=1632');
    if(!window.FuelTrackerUpdateStatusV16)await load('v1632UpdateStatusScript','./update-status-v16.js?v=1632');

    try{window.FuelTrackerNavigation?.updateFuelAge?.();}catch(e){}
    try{window.FuelTrackerAutomation?.updateAutoIndicator?.();}catch(e){}
    try{window.FuelTrackerGarageMaintenanceV16?.render?.();}catch(e){}
    try{window.FuelTrackerMaintenanceTrialV16?.refresh?.();}catch(e){}
    try{window.FuelTrackerUpdateStatusV16?.inspect?.({network:false});}catch(e){}
    applyVersion();
  }

  window.FuelTrackerRuntimeRecoveryV16={revision:REV,version:VERSION,recover,applyVersion};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(recover,80),{once:true});else setTimeout(recover,80);
  window.addEventListener('load',()=>setTimeout(recover,120),{once:true});
})();