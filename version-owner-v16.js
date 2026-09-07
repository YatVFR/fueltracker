(function(){
  'use strict';
  if(window.FuelTrackerVersionOwnerV16)return;

  const REV='v16.1.1-version-owner-2';
  const APP_VERSION='v16.1.1 Smart Stations';
  const APP_NUMBER='16.1.1';

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
    window.FUEL_TRACKER_VERSION_NUMBER=APP_NUMBER;
    const badge=document.querySelector('.brand small');
    if(badge&&badge.textContent!==APP_VERSION)badge.textContent=APP_VERSION;
    const wanted='Fuel Tracker v'+APP_NUMBER;
    if(document.title!==wanted)document.title=wanted;
  }

  // Detach observers installed by historical v15 modules, then reassert the
  // active release at finite lifecycle points only. No page-wide observer and
  // no repeating timer are used.
  detachLegacyVersionObservers();
  apply();
  [0,250,900,1800].forEach(ms=>setTimeout(apply,ms));
  window.addEventListener('load',()=>{detachLegacyVersionObservers();apply();},{once:true});
  document.addEventListener('fueltracker:pagechange',()=>setTimeout(apply,140));
  document.addEventListener('fueltracker:datachange',()=>setTimeout(apply,180));
  document.addEventListener('click',()=>setTimeout(apply,140));
  document.addEventListener('change',()=>setTimeout(apply,90));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)apply();});

  window.FuelTrackerVersionOwnerV16={revision:REV,version:APP_VERSION,apply};
})();
