(function(){
  'use strict';
  if(window.FuelTrackerVersionOwnerV16)return;

  const REV='v16.3.3-version-owner-1';
  const APP_VERSION='v16.3.3 Maintenance Data Preview';
  const DISPLAY_NUMBER='16.3.3';
  const COMPAT_NUMBER='16.33';

  function apply(){
    window.FUEL_TRACKER_VERSION=APP_VERSION;
    window.FUEL_TRACKER_VERSION_NUMBER=COMPAT_NUMBER;
    window.FUEL_TRACKER_DISPLAY_VERSION=DISPLAY_NUMBER;
    const badge=document.querySelector('.brand small');
    if(badge&&badge.textContent!==APP_VERSION)badge.textContent=APP_VERSION;
    const wanted='Fuel Tracker v'+DISPLAY_NUMBER;
    if(document.title!==wanted)document.title=wanted;
  }
  function ensureRecovery(){if(window.FuelTrackerRuntimeRecoveryV16||document.getElementById('v1633RuntimeRecovery'))return;const s=document.createElement('script');s.id='v1633RuntimeRecovery';s.src='./runtime-recovery-v16.js';document.body.appendChild(s);}
  function ensureUpdateStatus(){if(window.FuelTrackerUpdateStatusV16||document.getElementById('v1633UpdateStatus'))return;const s=document.createElement('script');s.id='v1633UpdateStatus';s.src='./update-status-v16.js';document.body.appendChild(s);}
  function ensureMaintenance(){if(window.FuelTrackerGarageMaintenanceV16||document.getElementById('v1633GarageMaintenance'))return;const s=document.createElement('script');s.id='v1633GarageMaintenance';s.src='./garage-maintenance-v16.js';document.body.appendChild(s);}
  function ensureTrial(){if(window.FuelTrackerMaintenanceTrialV16||document.getElementById('v1633MaintenanceTrial'))return;const s=document.createElement('script');s.id='v1633MaintenanceTrial';s.src='./maintenance-trial-v16.js';document.body.appendChild(s);}

  apply();ensureRecovery();ensureUpdateStatus();ensureMaintenance();ensureTrial();
  [0,250,900,1800].forEach(ms=>setTimeout(apply,ms));
  window.addEventListener('load',()=>{apply();ensureRecovery();ensureUpdateStatus();ensureMaintenance();ensureTrial();},{once:true});
  document.addEventListener('fueltracker:pagechange',()=>setTimeout(apply,120));document.addEventListener('fueltracker:datachange',()=>setTimeout(apply,150));document.addEventListener('fueltracker:maintenancechange',()=>setTimeout(apply,120));document.addEventListener('visibilitychange',()=>{if(!document.hidden)apply();});
  window.FuelTrackerVersionOwnerV16={revision:REV,version:APP_VERSION,displayVersion:DISPLAY_NUMBER,apply};
})();