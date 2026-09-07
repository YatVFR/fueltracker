(function(){
  'use strict';
  if(window.FuelTrackerVersionOwnerV16)return;

  const REV='v16.1-version-owner-1';
  const APP_VERSION='v16.1 Smart Stations';
  const APP_NUMBER='16.1';

  function apply(){
    window.FUEL_TRACKER_VERSION=APP_VERSION;
    window.FUEL_TRACKER_VERSION_NUMBER=APP_NUMBER;
    const badge=document.querySelector('.brand small');
    if(badge&&badge.textContent!==APP_VERSION)badge.textContent=APP_VERSION;
    const wanted='Fuel Tracker v'+APP_NUMBER;
    if(document.title!==wanted)document.title=wanted;
  }

  // Reassert only at known lifecycle points. No MutationObserver and no
  // repeating timer: older compatibility layers may write their historical
  // version during startup/rerender, but this owner must never create DOM churn.
  apply();
  [0,250,900,1800].forEach(ms=>setTimeout(apply,ms));
  window.addEventListener('load',apply,{once:true});
  document.addEventListener('fueltracker:pagechange',()=>setTimeout(apply,0));
  document.addEventListener('fueltracker:datachange',()=>setTimeout(apply,0));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)apply();});

  window.FuelTrackerVersionOwnerV16={revision:REV,version:APP_VERSION,apply};
})();
