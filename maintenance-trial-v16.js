(function(){
  'use strict';
  if(window.FuelTrackerMaintenanceTrialV16)return;

  const REV='v16.3.2-maintenance-trial-1';
  const ICONS={Service:'🛠️',Repair:'⚙️',Tyres:'🛞',Parts:'📦',Accessories:'🧰',Inspection:'🔎',Cleaning:'✨',Installation:'🔧','Recovery / Towing':'🚚',Other:'•••'};

  function garage(){try{return typeof state!=='undefined'?state.garageV15||null:null;}catch(e){return null;}}
  function profiles(){return Array.isArray(garage()?.profiles)?garage().profiles:[];}
  function activeProfile(){const g=garage();return profiles().find(p=>p?.id===g?.activeProfileId)||profiles()[0]||null;}

  function installStyles(){
    if(document.getElementById('v1632TrialStyles'))return;
    const s=document.createElement('style');s.id='v1632TrialStyles';s.textContent=`
      .gm-icon{display:inline-grid;place-items:center;width:22px;height:22px;margin-right:7px;border:1px solid #31414d;border-radius:7px;background:#0c151d;font-size:13px;vertical-align:middle;flex:0 0 auto}
      .gm-main b{display:flex!important;align-items:center;gap:0}
      .gm-kpi small{display:flex!important;align-items:center;gap:5px}.gm-kpi small .gm-icon{width:18px;height:18px;margin:0;font-size:11px;border-radius:6px}
      .hero.v1632-photo{position:relative;overflow:hidden;background-size:cover!important;background-position:center!important;min-height:190px}
      .hero.v1632-photo:before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(3,8,13,.92) 0%,rgba(3,8,13,.64) 45%,rgba(3,8,13,.18) 100%);z-index:0}
      .hero.v1632-photo>*{position:relative;z-index:1}.v1632-photo-btn{position:absolute!important;right:10px;bottom:10px;z-index:3!important;border:1px solid #42525f;border-radius:8px;background:rgba(7,14,20,.84);color:#e7edf2;padding:7px 9px;font-size:8px;font-weight:900;letter-spacing:.05em;text-transform:uppercase;backdrop-filter:blur(5px)}
      .v1632-photo-empty{position:absolute;right:12px;bottom:47px;z-index:2;color:#82909a;font-size:8px;text-align:right;max-width:120px}
      @media(max-width:580px){.gm-grid2{grid-template-columns:1fr!important}.gm-modal{width:100%;max-width:none}.gm-modal-backdrop{align-items:flex-end}.hero.v1632-photo{min-height:180px}.v1632-photo-btn{right:8px;bottom:8px}}
    `;document.head.appendChild(s);
  }

  function categoryFromText(text){const t=String(text||'').toLowerCase();if(t.includes('tyre'))return 'Tyres';if(t.includes('repair'))return 'Repair';if(t.includes('accessor'))return 'Accessories';if(t.includes('part'))return 'Parts';if(t.includes('inspect'))return 'Inspection';if(t.includes('clean'))return 'Cleaning';if(t.includes('install'))return 'Installation';if(t.includes('tow')||t.includes('recovery'))return 'Recovery / Towing';if(t.includes('service'))return 'Service';return 'Other';}
  function decorateMaintenance(){
    const box=document.getElementById('garageMaintenanceBox');if(!box)return;
    box.querySelectorAll('.gm-main b').forEach(b=>{if(b.querySelector('.gm-icon'))return;const cat=categoryFromText(b.textContent);const i=document.createElement('span');i.className='gm-icon';i.textContent=ICONS[cat]||ICONS.Other;b.prepend(i);});
    box.querySelectorAll('.gm-kpi small').forEach((el,idx)=>{if(el.querySelector('.gm-icon'))return;const i=document.createElement('span');i.className='gm-icon';i.textContent=['🛠️','🏠','📅','🧾'][idx]||'🧾';el.prepend(i);});
  }

  function ensurePhotoStore(){const g=garage();if(!g)return {};if(!g.vehiclePhotos||typeof g.vehiclePhotos!=='object'||Array.isArray(g.vehiclePhotos))g.vehiclePhotos={};return g.vehiclePhotos;}
  function compressImage(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>{const img=new Image();img.onload=()=>{const maxW=960,maxH=600,scale=Math.min(1,maxW/img.width,maxH/img.height),w=Math.round(img.width*scale),h=Math.round(img.height*scale),c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.drawImage(img,0,0,w,h);resolve(c.toDataURL('image/jpeg',.78));};img.onerror=reject;img.src=reader.result;};reader.onerror=reject;reader.readAsDataURL(file);});}
  function applyVehiclePhoto(){
    const p=activeProfile(),hero=document.querySelector('.hero');if(!p||!hero)return;
    const photo=ensurePhotoStore()[p.id];hero.classList.toggle('v1632-photo',!!photo);hero.style.backgroundImage=photo?`url(${photo})`:'';
    let btn=hero.querySelector('#v1632VehiclePhotoBtn');if(!btn){btn=document.createElement('button');btn.type='button';btn.id='v1632VehiclePhotoBtn';btn.className='v1632-photo-btn';btn.textContent='Vehicle Photo';hero.appendChild(btn);btn.onclick=()=>document.getElementById('v1632VehiclePhotoInput')?.click();}
    let note=hero.querySelector('.v1632-photo-empty');if(!photo&&!note){note=document.createElement('div');note.className='v1632-photo-empty';note.textContent='Add your real vehicle photo';hero.appendChild(note);}else if(photo&&note)note.remove();
  }
  function ensurePhotoInput(){
    if(document.getElementById('v1632VehiclePhotoInput'))return;
    const input=document.createElement('input');input.type='file';input.accept='image/*';input.id='v1632VehiclePhotoInput';input.hidden=true;document.body.appendChild(input);
    input.onchange=async()=>{const file=input.files?.[0],p=activeProfile();if(!file||!p)return;try{const data=await compressImage(file);ensurePhotoStore()[p.id]=data;saveState?.();applyVehiclePhoto();}catch(e){alert('Unable to use this vehicle photo. Please try another image.');}input.value='';};
  }

  function refresh(){installStyles();decorateMaintenance();ensurePhotoInput();applyVehiclePhoto();}
  refresh();
  [120,500,1200].forEach(ms=>setTimeout(refresh,ms));
  document.addEventListener('fueltracker:maintenancechange',()=>setTimeout(refresh,60));
  document.addEventListener('fueltracker:datachange',()=>setTimeout(refresh,80));
  document.addEventListener('fueltracker:pagechange',()=>setTimeout(refresh,50));
  document.addEventListener('click',e=>{if(e.target.closest('[data-profile-switch],[data-profile-open],#bikeBtn,#carBtn'))setTimeout(refresh,100);});
  window.FuelTrackerMaintenanceTrialV16={revision:REV,refresh};
})();