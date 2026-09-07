(function(){
  'use strict';
  if(window.FuelTrackerVersionOwnerV16)return;

  const REV='v16.1.2-version-owner-1';
  const APP_VERSION='v16.1.2 Smart Stations';
  const DISPLAY_NUMBER='16.1.2';
  // Numeric compatibility for older modules that compare versions with Number().
  // 16.12 is greater than 16.1 while the visible semantic version stays 16.1.2.
  const COMPAT_NUMBER='16.12';

  function detachLegacyVersionObservers(){
    const brand=document.querySelector('.brand');
    if(brand&&!brand.dataset.currentVersionOwned){
      const next=brand.cloneNode(true);
      next.dataset.currentVersionOwned='1';
      brand.replaceWith(next);
    }
    const title=document.querySelector('title');
    if(title&&!title.dataset.currentVersionOwned){
      const next=document.createElement('title');
      next.dataset.currentVersionOwned='1';
      next.textContent=title.textContent;
      title.replaceWith(next);
    }
  }

  function apply(){
    window.FUEL_TRACKER_VERSION=APP_VERSION;
    window.FUEL_TRACKER_VERSION_NUMBER=COMPAT_NUMBER;
    window.FUEL_TRACKER_DISPLAY_VERSION=DISPLAY_NUMBER;
    const badge=document.querySelector('.brand small');
    if(badge&&badge.textContent!==APP_VERSION)badge.textContent=APP_VERSION;
    const wanted='Fuel Tracker v'+DISPLAY_NUMBER;
    if(document.title!==wanted)document.title=wanted;
  }

  // Historical v15 modules attached observers directly to the original brand/title.
  // Clone those nodes once to detach the legacy observers, then reassert only at
  // finite lifecycle points. No page-wide observer or repeating interval is used.
  detachLegacyVersionObservers();
  apply();
  [0,250,900,1800].forEach(ms=>setTimeout(apply,ms));
  window.addEventListener('load',()=>{detachLegacyVersionObservers();apply();},{once:true});
  document.addEventListener('fueltracker:pagechange',()=>setTimeout(apply,140));
  document.addEventListener('fueltracker:datachange',()=>setTimeout(apply,180));
  document.addEventListener('click',()=>setTimeout(apply,140));
  document.addEventListener('change',()=>setTimeout(apply,90));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)apply();});

  window.FuelTrackerVersionOwnerV16={revision:REV,version:APP_VERSION,displayVersion:DISPLAY_NUMBER,apply};
})();
