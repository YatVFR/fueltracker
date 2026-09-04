(function(){
  'use strict';
  const REV='v15.4-enhanced-profiles-2';

  function garage(){return state.garageV15||null;}
  function profiles(){return garage()?.profiles||[];}
  function activeProfile(){return profiles().find(p=>p.id===garage()?.activeProfileId)||profiles()[0]||null;}
  function escLocal(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function cleanYear(v){const n=parseInt(v,10);return Number.isFinite(n)&&n>=1900&&n<=2100?String(n):'';}
  function cleanTank(v){const n=Number(v);return Number.isFinite(n)&&n>0?Math.round(n*10)/10:null;}

  function ensureProfiles(){
    profiles().forEach(p=>{
      if(typeof p.make!=='string')p.make='';
      if(typeof p.model!=='string')p.model='';
      if(typeof p.year!=='string')p.year='';
      if(!('tankCapacity' in p))p.tankCapacity=null;
      if(typeof p.notes!=='string')p.notes='';
    });
    if(garage())garage().enhancedProfileRevision=REV;
    saveState?.();
  }

  function fullModel(p){
    if(!p)return '';
    return [p.year,p.make,p.model].map(v=>String(v||'').trim()).filter(Boolean).join(' ');
  }

  function installStyles(){
    let s=document.getElementById('v15VehicleModelStyles');
    if(!s){s=document.createElement('style');s.id='v15VehicleModelStyles';document.head.appendChild(s);}
    s.textContent=`
      .hero-model{margin-top:5px;color:#d7dde3;font-size:13px;font-weight:800;letter-spacing:.02em;min-height:18px}
      .hero-model.empty{color:#73808a;font-weight:600;font-size:11px}
      .hero-profile-meta{display:flex;gap:6px;flex-wrap:wrap;margin-top:5px}.hero-profile-chip{padding:3px 6px;border:1px solid #2a3742;border-radius:999px;background:#0a1117;color:#919da7;font-size:8px;font-weight:800;letter-spacing:.04em;text-transform:uppercase}
      .garage-model{font-size:10px;color:#d2dae1;font-weight:750;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .settings-model-line{margin-top:5px;font-size:11px;color:#d5dce2;line-height:1.5}.settings-model-line small{color:#87939e}
      .profile-notes-field textarea{min-height:72px}
      .profile-two-col{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      @media(max-width:480px){.profile-two-col{grid-template-columns:1fr}.hero-profile-meta{gap:4px}}
    `;
  }

  function ensureModalFields(){
    const modal=document.getElementById('garageProfileModal');
    if(!modal)return;
    const regField=modal.querySelector('#garageVehicleReg')?.closest('.field');
    if(!regField)return;

    let modelInput=modal.querySelector('#garageVehicleModel');
    if(!modelInput){
      const wrap=document.createElement('div');wrap.className='field';
      wrap.innerHTML='<label for="garageVehicleModel">Vehicle Model</label><input id="garageVehicleModel" placeholder="e.g. CB400 / Mazda 3 Astina">';
      regField.insertAdjacentElement('beforebegin',wrap);modelInput=wrap.querySelector('input');
    }

    if(!modal.querySelector('#garageVehicleMake')){
      const wrap=document.createElement('div');wrap.className='profile-two-col';
      wrap.innerHTML=`<div class="field"><label for="garageVehicleMake">Make</label><input id="garageVehicleMake" placeholder="e.g. Honda / Mazda"></div><div class="field"><label for="garageVehicleYear">Year</label><input id="garageVehicleYear" type="number" min="1900" max="2100" inputmode="numeric" placeholder="e.g. 2023"></div>`;
      modelInput.closest('.field')?.insertAdjacentElement('beforebegin',wrap);
    }
    if(!modal.querySelector('#garageTankCapacity')){
      const wrap=document.createElement('div');wrap.className='field';
      wrap.innerHTML='<label for="garageTankCapacity">Fuel Tank Capacity (L)</label><input id="garageTankCapacity" type="number" min="0.1" step="0.1" inputmode="decimal" placeholder="e.g. 18.0">';
      regField.insertAdjacentElement('afterend',wrap);
    }
    if(!modal.querySelector('#garageVehicleNotes')){
      const wrap=document.createElement('div');wrap.className='field profile-notes-field';
      wrap.innerHTML='<label for="garageVehicleNotes">Vehicle Notes</label><textarea id="garageVehicleNotes" placeholder="Variant, modifications, preferred fuel, reminders, etc."></textarea>';
      modal.querySelector('#garageTankCapacity')?.closest('.field')?.insertAdjacentElement('afterend',wrap);
    }

    const save=modal.querySelector('#garageModalSave');
    if(save&&!save.dataset.enhancedProfileBound){
      save.dataset.enhancedProfileBound='true';
      save.addEventListener('click',()=>{
        const id=modal.querySelector('#garageEditId')?.value||'';
        const meta={
          make:(modal.querySelector('#garageVehicleMake')?.value||'').trim(),
          model:(modal.querySelector('#garageVehicleModel')?.value||'').trim(),
          year:cleanYear(modal.querySelector('#garageVehicleYear')?.value||''),
          tankCapacity:cleanTank(modal.querySelector('#garageTankCapacity')?.value||''),
          notes:(modal.querySelector('#garageVehicleNotes')?.value||'').trim()
        };
        if(id){
          const p=profiles().find(x=>x.id===id);if(p)Object.assign(p,meta);
          saveState?.();setTimeout(renderProfileUi,0);
        }else{
          setTimeout(()=>{const p=activeProfile();if(p){Object.assign(p,meta);saveState?.();renderProfileUi();}},0);
        }
      },true);
    }
  }

  function syncModal(){
    const modal=document.getElementById('garageProfileModal');
    if(!modal||!modal.classList.contains('show'))return;
    ensureModalFields();
    const id=modal.querySelector('#garageEditId')?.value||'';
    const p=profiles().find(x=>x.id===id)||null;
    const set=(id,v)=>{const el=modal.querySelector(id);if(el&&document.activeElement!==el)el.value=v??'';};
    set('#garageVehicleMake',p?.make||'');set('#garageVehicleModel',p?.model||'');set('#garageVehicleYear',p?.year||'');set('#garageTankCapacity',p?.tankCapacity??'');set('#garageVehicleNotes',p?.notes||'');
  }

  function renderHero(){
    const p=activeProfile();if(!p)return;
    const tag=document.getElementById('heroTag');if(!tag)return;
    let line=document.getElementById('heroVehicleModel');
    if(!line){line=document.createElement('div');line.id='heroVehicleModel';line.className='hero-model';tag.insertAdjacentElement('beforebegin',line);}
    const title=fullModel(p);
    line.textContent=title||'Add vehicle details in Settings';line.classList.toggle('empty',!title);
    let meta=document.getElementById('heroProfileMeta');
    if(!meta){meta=document.createElement('div');meta.id='heroProfileMeta';meta.className='hero-profile-meta';line.insertAdjacentElement('afterend',meta);}
    const chips=[];if(p.tankCapacity)chips.push(`${Number(p.tankCapacity).toFixed(1)} L tank`);if(p.notes)chips.push('Profile notes');
    meta.innerHTML=chips.map(x=>`<span class="hero-profile-chip">${escLocal(x)}</span>`).join('');
  }

  function renderGarageCards(){
    [...document.querySelectorAll('#garageProfileList .garage-profile')].forEach((card,i)=>{
      const p=profiles()[i];if(!p)return;
      let line=card.querySelector('.garage-model');
      if(!line){line=document.createElement('div');line.className='garage-model';card.querySelector('.garage-profile-top')?.insertAdjacentElement('afterend',line);}
      const extras=[];if(p.tankCapacity)extras.push(`${Number(p.tankCapacity).toFixed(1)}L`);
      line.textContent=[fullModel(p)||'Vehicle details not set',...extras].join(' • ');
    });
  }

  function renderSettings(){
    const p=activeProfile(),name=document.getElementById('settingsVehicleName');if(!p||!name)return;
    let line=name.parentElement?.querySelector('.settings-model-line');
    if(!line){line=document.createElement('div');line.className='settings-model-line';name.insertAdjacentElement('afterend',line);}
    const title=fullModel(p)||'Vehicle details not set';
    const tank=p.tankCapacity?`${Number(p.tankCapacity).toFixed(1)} L tank`:'Tank capacity not set';
    line.innerHTML=`${escLocal(title)}<br><small>${escLocal(tank)}${p.notes?' • Notes saved':''}</small>`;
  }

  function renderHeader(){
    document.querySelectorAll('[data-profile-switch]').forEach(btn=>{
      const p=profiles().find(x=>x.id===btn.dataset.profileSwitch);if(!p)return;
      const reg=btn.querySelector('.garage-reg');if(reg)reg.title=fullModel(p)||p.name||'';
    });
  }

  function renderProfileUi(){ensureModalFields();renderHero();renderGarageCards();renderSettings();renderHeader();syncModal();}
  function refreshSoon(delay=40){setTimeout(renderProfileUi,delay);}

  if(!garage()?.profiles?.length)return;
  ensureProfiles();installStyles();renderProfileUi();

  document.addEventListener('click',e=>{
    if(e.target.closest('[data-profile-switch],[data-profile-open],[data-profile-edit],#garageAddProfile,#garageHeaderAdd,#garageModalSave,#settingsBtn,#odoSaveBtn,#saveDbBtn,#newDbBtn,#themeRow button'))refreshSoon();
  });
  document.getElementById('fuelForm')?.addEventListener('submit',()=>refreshSoon(80));
  document.getElementById('loadDbInput')?.addEventListener('change',()=>refreshSoon(120));
})();