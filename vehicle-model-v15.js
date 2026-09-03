(function(){
  'use strict';
  const REV='v15.2-vehicle-model-1';

  function garage(){return state.garageV15||null;}
  function profiles(){return garage()?.profiles||[];}
  function activeProfile(){return profiles().find(p=>p.id===garage()?.activeProfileId)||profiles()[0]||null;}
  function escLocal(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}

  function ensureModels(){
    profiles().forEach(p=>{if(typeof p.model!=='string')p.model='';});
    if(garage())garage().vehicleModelRevision=REV;
    saveState();
  }

  function installStyles(){
    if(document.getElementById('v15VehicleModelStyles'))return;
    const s=document.createElement('style');
    s.id='v15VehicleModelStyles';
    s.textContent=`
      .hero-model{margin-top:5px;color:#d7dde3;font-size:13px;font-weight:800;letter-spacing:.02em;min-height:18px}
      .hero-model.empty{color:#73808a;font-weight:600;font-size:11px}
      .garage-model{font-size:10px;color:#d2dae1;font-weight:750;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .settings-model-line{margin-top:5px;font-size:11px;color:#d5dce2}
    `;
    document.head.appendChild(s);
  }

  function ensureModalField(){
    const modal=document.getElementById('garageProfileModal');
    if(!modal||modal.querySelector('#garageVehicleModel'))return;
    const regField=modal.querySelector('#garageVehicleReg')?.closest('.field');
    if(!regField)return;
    const wrap=document.createElement('div');
    wrap.className='field';
    wrap.innerHTML='<label for="garageVehicleModel">Vehicle Model</label><input id="garageVehicleModel" placeholder="e.g. Honda CB400 / Mazda 3 Astina">';
    regField.insertAdjacentElement('beforebegin',wrap);

    const editId=modal.querySelector('#garageEditId')?.value||'';
    const p=profiles().find(x=>x.id===editId);
    modal.querySelector('#garageVehicleModel').value=p?.model||'';

    const save=modal.querySelector('#garageModalSave');
    if(save&&!save.dataset.modelBound){
      save.dataset.modelBound='true';
      save.addEventListener('click',()=>{
        const id=modal.querySelector('#garageEditId')?.value||'';
        const model=(modal.querySelector('#garageVehicleModel')?.value||'').trim();
        if(id){
          const p=profiles().find(x=>x.id===id);
          if(p)p.model=model;
          saveState();
          setTimeout(renderVehicleModelUi,0);
        }else{
          setTimeout(()=>{
            const p=activeProfile();
            if(p){p.model=model;saveState();renderVehicleModelUi();}
          },0);
        }
      },true);
    }
  }

  function syncModalOnOpen(){
    const modal=document.getElementById('garageProfileModal');
    if(!modal||!modal.classList.contains('show'))return;
    ensureModalField();
    const id=modal.querySelector('#garageEditId')?.value||'';
    const p=profiles().find(x=>x.id===id);
    const input=modal.querySelector('#garageVehicleModel');
    if(input&&document.activeElement!==input)input.value=p?.model||input.value||'';
  }

  function renderHero(){
    const p=activeProfile();
    if(!p)return;
    const hero=document.querySelector('.hero');
    const tag=document.getElementById('heroTag');
    if(!hero||!tag)return;
    let line=document.getElementById('heroVehicleModel');
    if(!line){
      line=document.createElement('div');
      line.id='heroVehicleModel';
      line.className='hero-model';
      tag.insertAdjacentElement('beforebegin',line);
    }
    const model=(p.model||'').trim();
    line.textContent=model||'Add vehicle model in Settings';
    line.classList.toggle('empty',!model);
  }

  function renderGarageCards(){
    const cards=[...document.querySelectorAll('#garageProfileList .garage-profile')];
    cards.forEach((card,i)=>{
      const p=profiles()[i];
      if(!p)return;
      let line=card.querySelector('.garage-model');
      if(!line){
        line=document.createElement('div');
        line.className='garage-model';
        const top=card.querySelector('.garage-profile-top');
        top?.insertAdjacentElement('afterend',line);
      }
      line.textContent=p.model||'Model not set';
    });
  }

  function renderSettings(){
    const p=activeProfile();
    const name=document.getElementById('settingsVehicleName');
    if(!p||!name)return;
    let line=name.parentElement?.querySelector('.settings-model-line');
    if(!line){
      line=document.createElement('div');
      line.className='settings-model-line';
      name.insertAdjacentElement('afterend',line);
    }
    line.textContent=p.model?`Model: ${p.model}`:'Model: Not set — use Edit in My Garage';
  }

  function renderHeader(){
    document.querySelectorAll('[data-profile-switch]').forEach(btn=>{
      const p=profiles().find(x=>x.id===btn.dataset.profileSwitch);
      if(!p)return;
      const reg=btn.querySelector('.garage-reg');
      if(reg&&p.model)reg.title=p.model;
    });
  }

  function renderVehicleModelUi(){
    renderHero();
    renderGarageCards();
    renderSettings();
    renderHeader();
    syncModalOnOpen();
  }

  if(!garage()?.profiles?.length)return;
  ensureModels();
  installStyles();
  renderVehicleModelUi();

  const observer=new MutationObserver(()=>setTimeout(renderVehicleModelUi,0));
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
})();