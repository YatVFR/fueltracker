(function(){
  'use strict';
  if(window.FuelTrackerMaintenanceTrialV16)return;

  const REV='v16.3.3-maintenance-data-preview-1';
  const SEED='fbv260b-pdf-preview-v1633';
  const ICONS={Service:'🛠️',Repair:'⚙️',Tyres:'🛞',Parts:'📦',Accessories:'🧰',Inspection:'🔎',Cleaning:'✨',Installation:'🔧','Recovery / Towing':'🚚',Other:'•••'};
  const PAGE_ICONS={dashboard:'📊',refuel:'⛽',maintenance:'🛠️',settings:'⚙️'};

  function garage(){try{return typeof state!=='undefined'?state.garageV15||null:null;}catch(e){return null;}}
  function profiles(){return Array.isArray(garage()?.profiles)?garage().profiles:[];}
  function profileData(p){const g=garage();return p?.legacy?g?.legacy?.[p.type]:p?.data;}
  function profileLabel(p){return String(profileData(p)?.registration||p?.name||'');}
  function activeProfile(){const g=garage();return profiles().find(p=>p?.id===g?.activeProfileId)||profiles()[0]||null;}
  function fbvProfile(){return profiles().find(p=>profileLabel(p).toUpperCase()==='FBV260B')||null;}

  function installStyles(){
    if(document.getElementById('v1633TrialStyles'))return;
    const s=document.createElement('style');s.id='v1633TrialStyles';s.textContent=`
      #v1632VehiclePhotoInput{display:none!important;width:0!important;height:0!important;position:absolute!important;left:-9999px!important;opacity:0!important;pointer-events:none!important}
      .gm-icon{display:inline-grid;place-items:center;width:22px;height:22px;margin-right:7px;border:1px solid #31414d;border-radius:7px;background:#0c151d;font-size:13px;vertical-align:middle;flex:0 0 auto}
      .gm-main b{display:flex!important;align-items:center;gap:0}.gm-kpi small{display:flex!important;align-items:center;gap:5px}.gm-kpi small .gm-icon{width:18px;height:18px;margin:0;font-size:11px;border-radius:6px}
      .v1633-tab-icon{display:inline!important;margin:0 4px 0 0!important;font-size:12px!important;opacity:1!important}.v1633-section-icon{display:inline-block;margin-right:6px;font-size:.95em}
      .gm-review{border-color:#6a511f!important;background:linear-gradient(180deg,#15120b,#0b1015)!important}.gm-review-badge{display:inline-block;margin-top:4px;padding:3px 6px;border:1px solid #7a5c20;border-radius:999px;background:#241b0d;color:#f2bd54;font-size:7px;font-weight:900;letter-spacing:.06em}
      .hero.v1632-photo{position:relative;overflow:hidden;background-size:cover!important;background-position:center!important;min-height:190px}.hero.v1632-photo:before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(3,8,13,.92) 0%,rgba(3,8,13,.64) 45%,rgba(3,8,13,.18) 100%);z-index:0}.hero.v1632-photo>*{position:relative;z-index:1}
      .v1632-photo-btn{position:absolute!important;right:10px;bottom:10px;z-index:3!important;border:1px solid #42525f;border-radius:8px;background:rgba(7,14,20,.84);color:#e7edf2;padding:7px 9px;font-size:8px;font-weight:900;letter-spacing:.05em;text-transform:uppercase;backdrop-filter:blur(5px)}.v1632-photo-empty{position:absolute;right:12px;bottom:47px;z-index:2;color:#82909a;font-size:8px;text-align:right;max-width:120px}
      @media(max-width:580px){.gm-grid2{grid-template-columns:1fr!important}.gm-modal{width:100%;max-width:none}.gm-modal-backdrop{align-items:flex-end}.hero.v1632-photo{min-height:180px}.v1632-photo-btn{right:8px;bottom:8px}.v1633-tab-icon{font-size:11px!important;margin-right:2px!important}}
    `;document.head.appendChild(s);
  }

  function decoratePageIcons(){
    document.querySelectorAll('#v158PageNav [data-v158-page]').forEach(btn=>{const page=btn.dataset.v158Page,b=btn.querySelector('b');if(!b||b.querySelector('.v1633-tab-icon'))return;const i=document.createElement('span');i.className='v1633-tab-icon';i.textContent=PAGE_ICONS[page]||'•';b.prepend(i);});
    const map=[['.eff-panel-header h2','⛽'],['#garageOverviewBox .garage-overview-head strong','🏠'],['#garageAnalyticsBox .garage-analytics-head strong','📈'],['#garageMaintenanceBox .gm-head h2','🛠️'],['#v158Heading-refuel strong','⛽'],['#v158Heading-settings strong','⚙️']];
    map.forEach(([sel,icon])=>document.querySelectorAll(sel).forEach(el=>{if(el.querySelector('.v1633-section-icon'))return;const s=document.createElement('span');s.className='v1633-section-icon';s.textContent=icon;el.prepend(s);}));
  }

  function categoryFromText(text){const t=String(text||'').toLowerCase();if(t.includes('tyre'))return 'Tyres';if(t.includes('repair'))return 'Repair';if(t.includes('accessor'))return 'Accessories';if(t.includes('part'))return 'Parts';if(t.includes('inspect'))return 'Inspection';if(t.includes('clean'))return 'Cleaning';if(t.includes('install'))return 'Installation';if(t.includes('tow')||t.includes('recovery'))return 'Recovery / Towing';if(t.includes('service')||t.includes('oil'))return 'Service';return 'Other';}
  function decorateMaintenance(){
    const box=document.getElementById('garageMaintenanceBox');if(!box)return;
    box.querySelectorAll('.gm-main b').forEach(b=>{if(b.querySelector('.gm-icon'))return;const cat=categoryFromText(b.textContent);const i=document.createElement('span');i.className='gm-icon';i.textContent=ICONS[cat]||ICONS.Other;b.prepend(i);});
    box.querySelectorAll('.gm-kpi small').forEach((el,idx)=>{if(el.querySelector('.gm-icon'))return;const i=document.createElement('span');i.className='gm-icon';i.textContent=['🛠️','🏠','📅','🧾'][idx]||'🧾';el.prepend(i);});
    box.querySelectorAll('[data-gm-edit]').forEach(btn=>{const id=btn.dataset.gmEdit,row=btn.closest('.gm-row');if(!row)return;const p=fbvProfile();const e=p?window.FuelTrackerGarageMaintenanceV16?.entries?.(p.id)?.find(x=>x.id===id):null;if(!e?.reviewStatus)return;row.classList.add('gm-review');const side=row.querySelector('.gm-side');if(side&&e.cost==null){const strong=side.querySelector('strong'),sub=side.querySelector(':scope>span');if(strong)strong.textContent='—';if(sub)sub.textContent='AMOUNT UNKNOWN';}if(!row.querySelector('.gm-review-badge')){const badge=document.createElement('span');badge.className='gm-review-badge';badge.textContent='REVIEW';row.querySelector('.gm-main')?.appendChild(badge);}});
  }

  function ensurePhotoStore(){const g=garage();if(!g)return {};if(!g.vehiclePhotos||typeof g.vehiclePhotos!=='object'||Array.isArray(g.vehiclePhotos))g.vehiclePhotos={};return g.vehiclePhotos;}
  function compressImage(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>{const img=new Image();img.onload=()=>{const maxW=960,maxH=600,scale=Math.min(1,maxW/img.width,maxH/img.height),w=Math.round(img.width*scale),h=Math.round(img.height*scale),c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.drawImage(img,0,0,w,h);resolve(c.toDataURL('image/jpeg',.78));};img.onerror=reject;img.src=reader.result;};reader.onerror=reject;reader.readAsDataURL(file);});}
  function applyVehiclePhoto(){const p=activeProfile(),hero=document.querySelector('.hero');if(!p||!hero)return;const photo=ensurePhotoStore()[p.id];hero.classList.toggle('v1632-photo',!!photo);hero.style.backgroundImage=photo?`url(${photo})`:'';let btn=hero.querySelector('#v1632VehiclePhotoBtn');if(!btn){btn=document.createElement('button');btn.type='button';btn.id='v1632VehiclePhotoBtn';btn.className='v1632-photo-btn';btn.textContent=photo?'Change Photo':'Vehicle Photo';hero.appendChild(btn);btn.onclick=()=>document.getElementById('v1632VehiclePhotoInput')?.click();}else btn.textContent=photo?'Change Photo':'Vehicle Photo';let note=hero.querySelector('.v1632-photo-empty');if(!photo&&!note){note=document.createElement('div');note.className='v1632-photo-empty';note.textContent='Add your real vehicle photo';hero.appendChild(note);}else if(photo&&note)note.remove();}
  function ensurePhotoInput(){let input=document.getElementById('v1632VehiclePhotoInput');if(input){input.hidden=true;input.style.display='none';return;}input=document.createElement('input');input.type='file';input.accept='image/*';input.id='v1632VehiclePhotoInput';input.hidden=true;input.style.display='none';input.setAttribute('aria-hidden','true');document.body.appendChild(input);input.onchange=async()=>{const file=input.files?.[0],p=activeProfile();if(!file||!p)return;try{const data=await compressImage(file);ensurePhotoStore()[p.id]=data;saveState?.();applyVehiclePhoto();}catch(e){alert('Unable to use this vehicle photo. Please try another image.');}input.value='';};}

  const PDF_ROWS=[
    ['pdf-svc-20230525','2023-05-25','Service','1st Servicing',0,880,'PML','FBV260B Servicing Form'],
    ['pdf-svc-20230728','2023-07-28','Service','Engine oil change (Liqui Moly 10W50)',100,6095,'AA Motoring (Ah Looi)','FBV260B Servicing Form'],
    ['pdf-svc-20231021','2023-10-21','Service','10K service · ENI 10W60 · oil filter · diagnostic',235,9923,'HP Moto','FBV260B Servicing Form'],
    ['pdf-svc-20240507','2024-05-07','Tyres','Front tyre · Bridgestone Battlax Adventure A41',220,18558,'AA Motoring (Ah Looi)','FBV260B Servicing Form'],
    ['pdf-svc-20240625','2024-06-25','Service','Oil, BMW oil filter, K&N air filter, service reset + repairs',485,19775,'Troy Garage','FBV260B Servicing Form'],
    ['pdf-svc-20240717','2024-07-17','Repair','Right-side crash bar repair + rear tyre internal patch x2',120,20367,'Bikewerkz','FBV260B Servicing Form'],
    ['pdf-svc-20240729-tyre','2024-07-29','Tyres','Rear tyre replacement · Battlax Adventure A41',260,20844,'AA Motoring (Ah Looi)','FBV260B Servicing Form'],
    ['pdf-svc-20240729-tow','2024-07-29','Other','Towing / recovery service',60,20844,'Bikers Road Recovery Service','FBV260B Servicing Form'],
    ['pdf-svc-20240820','2024-08-20','Tyres','Rear tyre balancing',10,21731,'AA Motoring (Ah Looi)','FBV260B Servicing Form'],
    ['pdf-svc-20241011','2024-10-11','Parts','Battery YTZ14S + transport / installation',180,25930,'Zack Enterprise','FBV260B Servicing Form'],
    ['pdf-svc-20241204','2024-12-04','Service','30K servicing',408.17,27137,'PML','FBV260B Servicing Form'],
    ['pdf-svc-20250204','2025-02-04','Repair','Rear brake pad replacement · EBC',null,30491,'Home','FBV260B Servicing Form','Total cost is ambiguous in source; price breakdown shows S$65.'],
    ['pdf-svc-20250221','2025-02-21','Tyres','Front tyre · Bridgestone Battlax Adventure A41',225,31411,'AA Motoring (Ah Looi)','FBV260B Servicing Form','Total cell blank; amount taken from price breakdown.'],
    ['pdf-svc-20250630','2025-06-30','Service','40K servicing',1123.40,36915,'PML','FBV260B Servicing Form'],
    ['pdf-svc-20251120','2025-11-20','Tyres','Front / rear tyres · Michelin Anakee Adventure',570,41885,'HP Moto','FBV260B Servicing Form'],
    ['pdf-svc-20260126','2026-01-26','Service','Oil & oil filter change',180,44293,'HP Moto','FBV260B Servicing Form'],
    ['pdf-svc-20260428','2026-04-28','Service','Oil & oil filter change',240,48287,'HP Moto','FBV260B Servicing Form','Total cell blank; amount taken from price breakdown.'],
    ['pdf-svc-20260625','2026-06-25','Service','PML service record · details missing',null,50296,'PML','FBV260B Servicing Form','Service description and cost are missing in source.'],
    ['pdf-fin-20230428','2023-04-28','Accessories','Wunderlich side stand extender',80,null,'Wunderlich','FINANCES-2022'],
    ['pdf-fin-20230701-cam','2023-07-01','Accessories','HP Moto Cam',318,null,'HP Moto','FINANCES-2022'],
    ['pdf-fin-20230701-d7','2023-07-01','Accessories','Denali D7 Fog Lights',1850,null,'Denali','FINANCES-2022'],
    ['pdf-fin-20230701-install','2023-07-01','Accessories','Cam installation',120,null,'Bike Nest','FINANCES-2022'],
    ['pdf-fin-20240701','2024-07-01','Accessories','M-Technic Extended Crash Bar',350,null,'M-Technic','FINANCES-2022'],
    ['pdf-fin-20250626','2025-06-26','Accessories','M-Technic Extended Crash Bar',380,null,'M-Technic','FINANCES-2022']
  ];

  function seedPdfPreview(){
    const p=fbvProfile(),api=window.FuelTrackerGarageMaintenanceV16;if(!p||!api?.entries)return false;const list=api.entries(p.id);let changed=false;
    PDF_ROWS.forEach(r=>{if(list.some(x=>x.id===r[0]||x.sourceSeed===SEED&&x.sourceKey===r[0]))return;const [id,date,category,description,cost,odometer,vendor,source,reviewReason]=r;list.push({id,dateTime:date+'T12:00:00',category,description,cost,currency:'SGD',fxRateSGDMYR:null,odometer,notes:[vendor?`Vendor: ${vendor}`:'',`Source: ${source}`,reviewReason||''].filter(Boolean).join(' · '),vendor,source,sourceSeed:SEED,sourceKey:id,reviewStatus:reviewReason?'review':null,reviewReason:reviewReason||null,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});changed=true;});
    if(changed){try{saveState?.();}catch(e){}try{api.render?.();}catch(e){}document.dispatchEvent(new CustomEvent('fueltracker:maintenancechange',{detail:{profileId:p.id,action:'pdf-preview-seed'}}));}
    return changed;
  }

  function refresh(){installStyles();ensurePhotoInput();applyVehiclePhoto();seedPdfPreview();decorateMaintenance();decoratePageIcons();}
  refresh();[120,500,1200].forEach(ms=>setTimeout(refresh,ms));
  document.addEventListener('fueltracker:maintenancechange',()=>setTimeout(()=>{decorateMaintenance();decoratePageIcons();},60));
  document.addEventListener('fueltracker:datachange',()=>setTimeout(refresh,80));document.addEventListener('fueltracker:pagechange',()=>setTimeout(refresh,50));document.addEventListener('click',e=>{if(e.target.closest('[data-profile-switch],[data-profile-open],#bikeBtn,#carBtn'))setTimeout(refresh,100);});
  window.FuelTrackerMaintenanceTrialV16={revision:REV,refresh,seedPdfPreview};
})();