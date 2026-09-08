(function(){
  'use strict';
  if(window.FuelTrackerMaintenanceTypeV16)return;

  const REV='v16.3.5-maintenance-type-1';
  const MAINTENANCE_CATEGORIES=['Service','Repair','Tyres','Parts','Recovery / Towing','Inspection','Cleaning','Other'];
  const UPGRADE_CATEGORIES=['Accessories','Installation','Parts','Other'];
  let pendingType=null;

  function garage(){try{return typeof state!=='undefined'?state.garageV15||null:null;}catch(e){return null;}}
  function profiles(){return Array.isArray(garage()?.profiles)?garage().profiles:[];}
  function activeProfile(){const g=garage();return profiles().find(p=>p?.id===g?.activeProfileId)||profiles()[0]||null;}
  function api(){return window.FuelTrackerGarageMaintenanceV16||null;}
  function entries(){const p=activeProfile(),a=api();return p&&a?.entries?a.entries(p.id):[];}
  function inferType(e){
    if(e?.recordType==='upgrade'||e?.recordType==='maintenance')return e.recordType;
    const category=String(e?.category||'');
    if(e?.source==='FINANCES-2022'||category==='Accessories'||category==='Installation')return 'upgrade';
    return 'maintenance';
  }
  function save(){try{saveState?.();}catch(e){}}

  function installStyles(){
    if(document.getElementById('v1635MaintenanceTypeStyles'))return;
    const s=document.createElement('style');s.id='v1635MaintenanceTypeStyles';s.textContent=`
      .gm-type-field{margin:8px 0 4px}.gm-type-label{display:block;margin-bottom:5px;color:#aeb7bf;font-size:8px;font-weight:850;letter-spacing:.08em;text-transform:uppercase}.gm-type-options{display:grid;grid-template-columns:1fr 1fr;gap:7px}.gm-type-option{position:relative;display:flex;align-items:center;justify-content:center;gap:6px;min-height:42px;padding:8px;border:1px solid #33424d;border-radius:9px;background:#0d151c;color:#98a4ad;font-size:9px;font-weight:900;text-align:center;cursor:pointer;box-sizing:border-box}.gm-type-option input{position:absolute;opacity:0;pointer-events:none}.gm-type-option:has(input:checked){border-color:var(--accent,#137fe8);background:color-mix(in srgb,var(--accent,#137fe8) 18%,#0d151c);color:#fff}.gm-type-option .ico{font-size:14px}.gm-type-help{margin-top:4px;color:#71808a;font-size:7px;line-height:1.35}.gm-type-chip{display:inline-block;margin-left:5px;padding:2px 5px;border:1px solid #31414d;border-radius:999px;color:#86939d;font-size:6px;font-weight:900;text-transform:uppercase;letter-spacing:.05em;vertical-align:middle}.gm-type-chip.upgrade{border-color:#6b4d26;color:#efae55}
    `;document.head.appendChild(s);
  }

  function ensureControl(){
    const wrap=document.getElementById('gmModal');if(!wrap)return null;
    let field=wrap.querySelector('#gmRecordTypeField');
    if(!field){
      field=document.createElement('div');field.id='gmRecordTypeField';field.className='gm-type-field';
      field.innerHTML=`<span class="gm-type-label">Record Type *</span><div class="gm-type-options"><label class="gm-type-option"><input type="radio" name="gmRecordType" value="maintenance"><span class="ico">🛠️</span><span>Maintenance</span></label><label class="gm-type-option"><input type="radio" name="gmRecordType" value="upgrade"><span class="ico">🧰</span><span>Upgrade / Accessory</span></label></div><div class="gm-type-help">Changing the type moves this record to the matching section automatically.</div>`;
      const firstGrid=wrap.querySelector('.gm-grid2');firstGrid?.insertAdjacentElement('beforebegin',field);
      field.querySelectorAll('input[name="gmRecordType"]').forEach(r=>r.addEventListener('change',()=>applyCategoryOptions(r.value,true)));
    }
    return field;
  }

  function selectedType(){return document.querySelector('#gmModal input[name="gmRecordType"]:checked')?.value||'maintenance';}
  function applyCategoryOptions(type,preserve){
    const select=document.getElementById('gmCategory');if(!select)return;
    const allowed=type==='upgrade'?UPGRADE_CATEGORIES:MAINTENANCE_CATEGORIES;
    const old=select.value;
    select.innerHTML=allowed.map(x=>`<option value="${x}">${x}</option>`).join('');
    if(preserve&&allowed.includes(old))select.value=old;
    else select.value=type==='upgrade'?'Accessories':'Service';
  }

  function syncModal(){
    const wrap=document.getElementById('gmModal');if(!wrap||!wrap.classList.contains('show'))return;
    ensureControl();
    const id=wrap.querySelector('#gmEditId')?.value||'';
    const e=id?entries().find(x=>x.id===id):null;
    const type=inferType(e);
    const radio=wrap.querySelector(`input[name="gmRecordType"][value="${type}"]`);if(radio)radio.checked=true;
    applyCategoryOptions(type,false);
    const category=document.getElementById('gmCategory');
    if(e&&category){const allowed=type==='upgrade'?UPGRADE_CATEGORIES:MAINTENANCE_CATEGORIES;if(allowed.includes(e.category))category.value=e.category;}
  }

  function migrateTypes(){
    const a=api();if(!a?.entries)return false;let changed=false;
    profiles().forEach(p=>a.entries(p.id).forEach(e=>{if(e.recordType!=='maintenance'&&e.recordType!=='upgrade'){e.recordType=inferType(e);changed=true;}}));
    if(changed)save();return changed;
  }

  function applyPending(id){
    if(!pendingType||!id)return;
    const e=entries().find(x=>x.id===id);if(!e){pendingType=null;return;}
    e.recordType=pendingType;
    if(pendingType==='upgrade'&&!UPGRADE_CATEGORIES.includes(e.category))e.category='Accessories';
    if(pendingType==='maintenance'&&!MAINTENANCE_CATEGORIES.includes(e.category))e.category='Other';
    e.updatedAt=new Date().toISOString();pendingType=null;save();
    try{api()?.render?.();}catch(err){}
    setTimeout(()=>{try{window.FuelTrackerMaintenanceTrialV16?.refresh?.();}catch(err){}applySectionClassification();},30);
  }

  function applySectionClassification(){
    const list=entries();
    document.querySelectorAll('#garageMaintenanceBox .gm-row').forEach(row=>{
      const id=row.querySelector('[data-gm-edit]')?.dataset.gmEdit,e=id?list.find(x=>x.id===id):null;
      if(e)row.style.display=inferType(e)==='upgrade'?'none':'';
      const title=row.querySelector('.gm-main b');if(title&&e&&!title.querySelector('.gm-type-chip')){const chip=document.createElement('span');chip.className='gm-type-chip';chip.textContent='Maintenance';title.appendChild(chip);}
    });
    document.querySelectorAll('#garageMaintenanceBox .gm-up-row').forEach(row=>{
      const id=row.querySelector('[data-up-edit]')?.dataset.upEdit,e=id?list.find(x=>x.id===id):null;
      if(e)row.style.display=inferType(e)==='maintenance'?'none':'';
    });
  }

  function hookModal(){
    const wrap=document.getElementById('gmModal');if(!wrap||wrap.dataset.v1635TypeHook)return;
    wrap.dataset.v1635TypeHook='1';ensureControl();
    new MutationObserver(()=>{if(wrap.classList.contains('show'))setTimeout(syncModal,0);}).observe(wrap,{attributes:true,attributeFilter:['class']});
  }

  document.addEventListener('click',e=>{
    if(e.target.closest('#gmAddExpense,[data-gm-edit],[data-up-edit]'))setTimeout(()=>{hookModal();syncModal();},0);
  },true);
  document.addEventListener('click',e=>{
    if(e.target.closest('#gmSave'))pendingType=selectedType();
  },true);
  document.addEventListener('fueltracker:maintenancechange',e=>{
    if(pendingType&&e.detail?.id)applyPending(e.detail.id);
    else setTimeout(()=>{migrateTypes();applySectionClassification();},50);
  });
  document.addEventListener('fueltracker:pagechange',e=>{if(e.detail?.page==='maintenance')setTimeout(()=>{hookModal();migrateTypes();applySectionClassification();},80);});

  installStyles();migrateTypes();setTimeout(()=>{hookModal();applySectionClassification();},180);setTimeout(applySectionClassification,700);
  window.FuelTrackerMaintenanceTypeV16={revision:REV,inferType,migrateTypes,syncModal,applySectionClassification};
})();
