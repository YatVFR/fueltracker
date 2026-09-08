(function(){
  'use strict';
  if(window.FuelTrackerVersionOwnerV16)return;
  const REV='v16.3.8-version-owner-1';
  const APP_VERSION='v16.3.8 iCloud Backup Target';
  const DISPLAY_NUMBER='16.3.8';
  const COMPAT_NUMBER='16.38';
  function apply(){window.FUEL_TRACKER_VERSION=APP_VERSION;window.FUEL_TRACKER_VERSION_NUMBER=COMPAT_NUMBER;window.FUEL_TRACKER_DISPLAY_VERSION=DISPLAY_NUMBER;const badge=document.querySelector('.brand small');if(badge&&badge.textContent!==APP_VERSION)badge.textContent=APP_VERSION;const wanted='Fuel Tracker v'+DISPLAY_NUMBER;if(document.title!==wanted)document.title=wanted;}
  function ensure(id,flag,src){if(window[flag]||document.getElementById(id))return;const s=document.createElement('script');s.id=id;s.src=src;document.body.appendChild(s);}
  function ensureAll(){
    ensure('v1638RuntimeRecovery','FuelTrackerRuntimeRecoveryV16','./runtime-recovery-v16.js');
    ensure('v1638UpdateStatus','FuelTrackerUpdateStatusV16','./update-status-v16.js');
    ensure('v1638GarageMaintenance','FuelTrackerGarageMaintenanceV16','./garage-maintenance-v16.js');
    ensure('v1638MaintenanceTrial','FuelTrackerMaintenanceTrialV16','./maintenance-trial-v16.js');
    ensure('v1638MaintenanceType','FuelTrackerMaintenanceTypeV16','./maintenance-type-v16.js');
    ensure('v1638DataContext','FuelTrackerDataContextV16','./data-context-v16.js');
    ensure('v1638BackupIntegrity','FuelTrackerBackupIntegrityV16','./backup-integrity-v16.js');
    ensure('v1638MasterDbCurrent','FuelTrackerMasterDbCurrentV16','./masterdb-current-v16.js');
    ensure('v1638ICloudTarget','FuelTrackerICloudBackupTargetV16','./icloud-backup-target-v16.js');
  }
  apply();ensureAll();[0,250,900,1800].forEach(ms=>setTimeout(apply,ms));window.addEventListener('load',()=>{apply();ensureAll();},{once:true});document.addEventListener('fueltracker:pagechange',()=>setTimeout(apply,120));document.addEventListener('fueltracker:datachange',()=>setTimeout(apply,150));document.addEventListener('fueltracker:maintenancechange',()=>setTimeout(apply,120));document.addEventListener('visibilitychange',()=>{if(!document.hidden)apply();});window.FuelTrackerVersionOwnerV16={revision:REV,version:APP_VERSION,displayVersion:DISPLAY_NUMBER,apply,ensureAll};
})();