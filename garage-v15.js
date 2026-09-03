(function(){
  const REV='v15.1-garage-profiles-1';
  let switching=false;

  function clone(v){return JSON.parse(JSON.stringify(v));}
  function defaultTheme(type){return type==='bike'?'honda':'generic';}
  function profileTypeLabel(type){return type==='bike'?'Bike':'Car';}

  if(!document.querySelector('link[data-v15-mobile-header-fix]')){
    const link=document.createElement('link');link.rel='stylesheet';link.href='./mobile-header-fix.css';link.dataset.v15MobileHeaderFix='true';document.head.appendChild(link);
  }
  if(!document.querySelector('link[data-v15-garage-css]')){
    const link=document.createElement('link');link.rel='stylesheet';link.href='./garage-v15.css';link.dataset.v15GarageCss='true';document.head.appendChild(link);
  }

  function snapshotSlot(type){
    return {
      records:clone(state.records?.[type]||[]),
      registration:state.registrations?.[type]||'',
      theme:state.selected?.[type]||defaultTheme(type),
      odometer:clone(state.currentOdometer?.[type]||{value:null,updatedAt:null})
    };
  }
  function applySlot(type,data){
    state.records=state.records||{};state.registrations=state.registrations||{};state.selected=state.selected||{};state.currentOdometer=state.currentOdometer||{};
    state.records[type]=clone(data?.records||[]);
    state.registrations[type]=data?.registration||'';
    state.selected[type]=data?.theme||defaultTheme(type);
    state.currentOdometer[type]=clone(data?.odometer||{value:null,updatedAt:null});
  }
  function ensureGarage(){
    if(state.garageV15?.profiles?.length)return;
    state.garageV15={
      revision:REV,
      activeProfileId:state.mode==='car'?'car-primary':'bike-primary',
      legacy:{bike:snapshotSlot('bike'),car:snapshotSlot('car')},
      profiles:[
        {id:'bike-primary',type:'bike',name:'Bike',legacy:true},
        {id:'car-primary',type:'car',name:'Car',legacy:true}
      ]
    };
    saveState();
  }
  function garage(){ensureGarage();return state.garageV15;}
  function profiles(){return garage().profiles;}
  function activeProfile(){return profiles().find(p=>p.id===garage().activeProfileId)||profiles()[0];}
  function profileData(p){return p.legacy?garage().legacy[p.type]:(p.data||{records:[],registration:'',theme:defaultTheme(p.type),odometer:{value:null,updatedAt:null}});}
  function saveActiveProfile(){
    if(switching)return;
    const p=activeProfile();if(!p)return;
    const snap=snapshotSlot(p.type);
    if(p.legacy)garage().legacy[p.type]=snap;else p.data=snap;
    garage().revision=REV;
  }
  function displayProfile(p){
    const data=profileData(p);const rows=data.records||[];
    const valid=rows.filter(r=>+r.mileage>0&&validDate(r.dateTime)).sort((a,b)=>new Date(b.dateTime)-new Date(a.dateTime));
    return {
      ...p,
      registration:data.registration||'',
      theme:(p.type==='bike'?bikeThemes:carThemes).find(t=>t.id===data.theme)?.name||data.theme||'',
      records:rows.length,
      odometer:data.odometer?.value??valid[0]?.mileage??null,
      dbName:p.legacy?(p.type==='bike'?'BikeFuelData.json':'CarFuelData.json'):'Local profile • MasterDB in v15.2'
    };
  }

  function selectProfile(id){
    const target=profiles().find(p=>p.id===id);if(!target)return;
    saveActiveProfile();
    switching=true;
    garage().activeProfileId=target.id;
    applySlot(target.type,profileData(target));
    state.mode=target.type;
    saveState();
    originalRenderAll();
    switching=false;
    renderV15();
    saveState();
    resetForm?.();
  }

  function renderHeader(){
    const sw=document.querySelector('.vehicle-switch');if(!sw)return;
    sw.classList.add('garage-switch');
    sw.innerHTML=profiles().map(p=>{
      const d=displayProfile(p);const label=d.registration||d.name||profileTypeLabel(d.type);
      return `<button type="button" class="garage-switch-btn ${garage().activeProfileId===p.id?'active':''}" data-profile-switch="${p.id}"><span class="garage-type">${esc(profileTypeLabel(p.type).toUpperCase())}</span><span class="garage-reg">${esc(label)}</span></button>`;
    }).join('')+`<button type="button" class="garage-add-btn" id="garageHeaderAdd" aria-label="Add vehicle" title="Add vehicle">+</button>`;
    sw.querySelectorAll('[data-profile-switch]').forEach(btn=>btn.onclick=()=>selectProfile(btn.dataset.profileSwitch));
    sw.querySelector('#garageHeaderAdd')?.addEventListener('click',()=>openProfileModal());
  }

  function renderGarage(){
    const el=document.getElementById('garageProfileList');if(!el)return;
    el.innerHTML=profiles().map(p=>{
      const d=displayProfile(p);
      return `<div class="garage-profile ${garage().activeProfileId===p.id?'active':''} ${p.legacy?'locked':''}">
        <div class="garage-profile-top"><b>${esc(d.registration||d.name||profileTypeLabel(d.type))}</b><small>${esc(profileTypeLabel(d.type))}</small></div>
        <div class="garage-profile-meta">${esc(d.theme)} • ${d.records} records</div>
        <div class="garage-profile-meta">${d.odometer!=null?Number(d.odometer).toLocaleString()+' km':'Odometer not set'}</div>
        <div class="garage-profile-db">${esc(d.dbName)}</div>
        <div class="garage-profile-actions">
          <button type="button" class="secondary" data-profile-open="${p.id}">OPEN</button>
          <button type="button" class="secondary" data-profile-edit="${p.id}">EDIT</button>
          <button type="button" class="danger garage-delete" data-profile-delete="${p.id}">DELETE</button>
        </div>
      </div>`;
    }).join('')+`<button type="button" class="garage-add-profile" id="garageAddProfile">+ ADD VEHICLE</button>`;
    el.querySelectorAll('[data-profile-open]').forEach(b=>b.onclick=()=>selectProfile(b.dataset.profileOpen));
    el.querySelectorAll('[data-profile-edit]').forEach(b=>b.onclick=()=>openProfileModal(b.dataset.profileEdit));
    el.querySelectorAll('[data-profile-delete]').forEach(b=>b.onclick=()=>deleteProfile(b.dataset.profileDelete));
    el.querySelector('#garageAddProfile')?.addEventListener('click',()=>openProfileModal());
  }

  function syncSettings(){
    const p=displayProfile(activeProfile());
    const name=document.getElementById('settingsVehicleName');if(name)name.textContent=p.registration||p.name||profileTypeLabel(p.type);
    const brand=document.querySelector('.brand small');if(brand)brand.textContent='v15.1 Garage';
    const copy=document.querySelector('.garage-setting p');if(copy)copy.textContent='Each vehicle profile keeps its own registration, theme, odometer and local fuel records. Original Bike and Car profiles are protected.';
  }
  function renderV15(){renderHeader();renderGarage();syncSettings();}

  function ensureModal(){
    let wrap=document.getElementById('garageProfileModal');if(wrap)return wrap;
    wrap=document.createElement('div');wrap.id='garageProfileModal';wrap.className='garage-modal-backdrop';
    wrap.innerHTML=`<div class="garage-modal" role="dialog" aria-modal="true" aria-labelledby="garageModalTitle">
      <h3 id="garageModalTitle">Add Vehicle</h3><p id="garageModalHelp">Create a separate local Fuel Tracker profile.</p>
      <input type="hidden" id="garageEditId">
      <div class="field"><label for="garageVehicleType">Vehicle Type</label><select id="garageVehicleType"><option value="bike">Bike</option><option value="car">Car</option></select></div>
      <div class="field"><label for="garageVehicleName">Profile Name</label><input id="garageVehicleName" placeholder="e.g. Touring Bike"></div>
      <div class="field"><label for="garageVehicleReg">Registration No.</label><input id="garageVehicleReg" placeholder="e.g. SXX1234A"></div>
      <div class="modal-actions"><button type="button" class="secondary" id="garageModalCancel">CANCEL</button><button type="button" class="primary" id="garageModalSave">SAVE PROFILE</button></div>
    </div>`;
    document.body.appendChild(wrap);
    wrap.querySelector('#garageModalCancel').onclick=closeProfileModal;
    wrap.querySelector('#garageModalSave').onclick=saveProfileModal;
    wrap.addEventListener('click',e=>{if(e.target===wrap)closeProfileModal();});
    return wrap;
  }
  function openProfileModal(id=''){
    const wrap=ensureModal();const p=id?profiles().find(x=>x.id===id):null;const d=p?displayProfile(p):null;
    wrap.querySelector('#garageModalTitle').textContent=p?'Edit Vehicle':'Add Vehicle';
    wrap.querySelector('#garageEditId').value=p?.id||'';
    const type=wrap.querySelector('#garageVehicleType');type.value=p?.type||'bike';type.disabled=!!p;
    wrap.querySelector('#garageVehicleName').value=p?.name||'';
    wrap.querySelector('#garageVehicleReg').value=d?.registration||'';
    wrap.classList.add('show');
    setTimeout(()=>wrap.querySelector('#garageVehicleReg').focus(),50);
  }
  function closeProfileModal(){document.getElementById('garageProfileModal')?.classList.remove('show');}
  function saveProfileModal(){
    const wrap=ensureModal();const id=wrap.querySelector('#garageEditId').value;const type=wrap.querySelector('#garageVehicleType').value;const name=wrap.querySelector('#garageVehicleName').value.trim()||profileTypeLabel(type);const reg=wrap.querySelector('#garageVehicleReg').value.trim().toUpperCase();
    if(id){
      const p=profiles().find(x=>x.id===id);if(!p)return;
      p.name=name;
      if(p.legacy)garage().legacy[p.type].registration=reg;else{p.data=p.data||profileData(p);p.data.registration=reg;}
      if(garage().activeProfileId===id){state.registrations[p.type]=reg;document.getElementById('heroPlate').textContent=reg||'Enter Registration No.';const inp=document.getElementById('vehicleRegInput');if(inp)inp.value=reg;}
    }else{
      const newId='vehicle-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
      profiles().push({id:newId,type,name,legacy:false,data:{records:[],registration:reg,theme:defaultTheme(type),odometer:{value:null,updatedAt:null}}});
      closeProfileModal();saveState();selectProfile(newId);return;
    }
    closeProfileModal();saveState();renderV15();
  }
  function deleteProfile(id){
    const p=profiles().find(x=>x.id===id);if(!p||p.legacy)return;
    const d=displayProfile(p);if(!confirm(`Delete ${d.registration||d.name||'this vehicle'} and its ${d.records} local records? This cannot be undone unless you exported its data.`))return;
    if(garage().activeProfileId===id){const fallback=profiles().find(x=>x.legacy&&x.type===p.type)||profiles().find(x=>x.legacy)||profiles()[0];garage().profiles=profiles().filter(x=>x.id!==id);selectProfile(fallback.id);}else{garage().profiles=profiles().filter(x=>x.id!==id);saveState();renderV15();}
  }

  ensureGarage();
  const originalRenderAll=renderAll;
  renderAll=function(){if(!switching)saveActiveProfile();originalRenderAll();renderV15();};

  document.getElementById('vehicleRegInput')?.addEventListener('input',()=>{setTimeout(()=>{saveActiveProfile();renderV15();saveState();},0);});
  document.getElementById('setRegBtn')?.addEventListener('click',()=>setTimeout(()=>{saveActiveProfile();renderV15();saveState();},0));
  document.getElementById('settingsBtn')?.addEventListener('click',()=>setTimeout(renderV15,0));

  state.garageV15.revision=REV;saveState();renderV15();
})();