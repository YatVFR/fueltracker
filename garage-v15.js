(function(){
  const REV='v15-garage-1';

  function profile(mode){
    const reg=(state.registrations&&state.registrations[mode])||'';
    const themeId=(state.selected&&state.selected[mode])||'';
    const themes=mode==='bike'?bikeThemes:carThemes;
    const theme=themes.find(t=>t.id===themeId)||themes[0];
    const rows=(state.records&&state.records[mode])||[];
    const valid=rows.filter(r=>+r.mileage>0&&validDate(r.dateTime)).sort((a,b)=>new Date(b.dateTime)-new Date(a.dateTime));
    return {
      id:mode,
      type:mode==='bike'?'Bike':'Car',
      registration:reg,
      theme:theme?.name||'',
      dbName:mode==='bike'?'BikeFuelData.json':'CarFuelData.json',
      records:rows.length,
      odometer:state.currentOdometer?.[mode]?.value ?? valid[0]?.mileage ?? null
    };
  }

  function syncHeader(){
    const b=profile('bike'),c=profile('car');
    const bikeBtn=document.getElementById('bikeBtn'),carBtn=document.getElementById('carBtn');
    if(bikeBtn){bikeBtn.innerHTML=`<span class="garage-type">BIKE</span><span class="garage-reg">${esc(b.registration||'No registration')}</span>`;}
    if(carBtn){carBtn.innerHTML=`<span class="garage-type">CAR</span><span class="garage-reg">${esc(c.registration||'No registration')}</span>`;}
  }

  function renderGarage(){
    const el=document.getElementById('garageProfileList');
    if(!el)return;
    const profiles=[profile('bike'),profile('car')];
    el.innerHTML=profiles.map(p=>`
      <button type="button" class="garage-profile ${state.mode===p.id?'active':''}" data-garage-mode="${p.id}">
        <span class="garage-profile-top"><b>${esc(p.registration||p.type)}</b><small>${esc(p.type)}</small></span>
        <span class="garage-profile-meta">${esc(p.theme)} • ${p.records} records</span>
        <span class="garage-profile-meta">${p.odometer!=null?Number(p.odometer).toLocaleString()+' km':'Odometer not set'}</span>
        <span class="garage-profile-db">${esc(p.dbName)}</span>
      </button>`).join('');
    el.querySelectorAll('[data-garage-mode]').forEach(btn=>btn.onclick=()=>{
      const mode=btn.dataset.garageMode;
      if(mode==='bike')document.getElementById('bikeBtn')?.click();
      else document.getElementById('carBtn')?.click();
      setTimeout(renderV15,0);
    });
  }

  function syncSettings(){
    const name=document.getElementById('settingsVehicleName');
    const p=profile(state.mode);
    if(name)name.textContent=p.registration||p.type;
  }

  function renderV15(){syncHeader();renderGarage();syncSettings();}

  const originalRenderAll=renderAll;
  renderAll=function(){originalRenderAll();renderV15();};

  document.getElementById('vehicleRegInput')?.addEventListener('input',()=>setTimeout(renderV15,0));
  document.getElementById('setRegBtn')?.addEventListener('click',()=>setTimeout(renderV15,0));
  document.getElementById('settingsBtn')?.addEventListener('click',()=>setTimeout(renderV15,0));

  state.garageRevision=REV;
  saveState();
  renderV15();
})();