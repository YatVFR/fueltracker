(function(){
  'use strict';
  if(window.FuelTrackerVersionOwnerV16)return;

  const REV='v16.1.5-version-owner-1';
  const APP_VERSION='v16.1.5 Update Status';
  const DISPLAY_NUMBER='16.1.5';
  const COMPAT_NUMBER='16.15';

  function apply(){
    window.FUEL_TRACKER_VERSION=APP_VERSION;
    window.FUEL_TRACKER_VERSION_NUMBER=COMPAT_NUMBER;
    window.FUEL_TRACKER_DISPLAY_VERSION=DISPLAY_NUMBER;
    const badge=document.querySelector('.brand small');
    if(badge&&badge.textContent!==APP_VERSION)badge.textContent=APP_VERSION;
    const wanted='Fuel Tracker v'+DISPLAY_NUMBER;
    if(document.title!==wanted)document.title=wanted;
  }

  function ensureRecovery(){
    if(window.FuelTrackerRuntimeRecoveryV16||document.getElementById('v1614RuntimeRecovery'))return;
    const s=document.createElement('script');
    s.id='v1614RuntimeRecovery';
    s.src='./runtime-recovery-v16.js';
    document.body.appendChild(s);
  }

  function ensureUpdateStatus(){
    if(window.FuelTrackerUpdateStatusV16||document.getElementById('v1615UpdateStatus'))return;
    const s=document.createElement('script');
    s.id='v1615UpdateStatus';
    s.src='./update-status-v16.js';
    document.body.appendChild(s);
  }

  apply();
  ensureRecovery();
  ensureUpdateStatus();
  [0,250,900,1800].forEach(ms=>setTimeout(apply,ms));
  window.addEventListener('load',()=>{apply();ensureRecovery();ensureUpdateStatus();},{once:true});
  document.addEventListener('fueltracker:pagechange',()=>setTimeout(apply,120));
  document.addEventListener('fueltracker:datachange',()=>setTimeout(apply,150));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)apply();});

  window.FuelTrackerVersionOwnerV16={revision:REV,version:APP_VERSION,displayVersion:DISPLAY_NUMBER,apply};
})();
