(() => {
  'use strict';
  const BMW_KEY='fuelTrackerThemeBMW';
  function applyBMW(){
    document.body.dataset.theme='bmw';
    localStorage.setItem(BMW_KEY,'1');
    document.querySelectorAll('.theme-option').forEach(btn=>btn.classList.toggle('active',btn.dataset.theme==='bmw'));
    const badge=document.getElementById('settingsThemeBadge');if(badge)badge.textContent='BMW MOTORRAD INSPIRED';
  }
  function init(){
    const picker=document.querySelector('.theme-picker');if(!picker)return;
    if(!picker.querySelector('[data-theme="bmw"]')){
      const btn=document.createElement('button');btn.type='button';btn.className='theme-option';btn.dataset.theme='bmw';btn.style.setProperty('--swatch','#0066b1');btn.innerHTML='<span class="theme-swatch"></span>BMW<br>Motorrad';picker.appendChild(btn);btn.addEventListener('click',applyBMW);
    }
    picker.querySelectorAll('.theme-option').forEach(btn=>{if(btn.dataset.theme!=='bmw')btn.addEventListener('click',()=>localStorage.removeItem(BMW_KEY));});
    if(localStorage.getItem(BMW_KEY)==='1')applyBMW();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
