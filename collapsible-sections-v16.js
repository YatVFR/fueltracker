(function(){
'use strict';
if(window.FuelTrackerCollapsibleSectionsV16)return;
const REV='v16.4.4-collapsible-sections-1';
const KEY='fueltrackerV1644CollapsedSections';
let timer;
function load(){try{const x=JSON.parse(localStorage.getItem(KEY)||'{}');return x&&typeof x==='object'?x:{};}catch(e){return {};}}
function save(x){try{localStorage.setItem(KEY,JSON.stringify(x));}catch(e){}}
function slug(v){return String(v||'section').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60)||'section';}
function title(el){
 if(el.id==='garageOverviewBox')return'My Garage';
 if(el.id==='garageAnalyticsBox')return'Garage Analytics';
 if(el.id==='garageMaintenanceBox')return'Maintenance';
 if(el.querySelector('.hero-dash'))return'Dashboard Summary';
 if(el.querySelector('#odometerGrid'))return'Odometer';
 if(el.querySelector('.eff-wrap'))return'Current Tank';
 if(el.classList.contains('refuel-card'))return'Add Refuel';
 if(el.querySelector('#historyBody'))return'Refuel History';
 if(el.closest('#settingsBox'))return el.querySelector('.label')?.textContent?.trim()||el.querySelector('strong')?.textContent?.trim()||'Settings Section';
 return el.querySelector('h2,h3,strong')?.textContent?.trim()||'Section';
}
function itemKey(el,t){
 if(el.dataset.ftCollapseKey)return el.dataset.ftCollapseKey;
 let k=el.id||'';
 if(!k&&el.classList.contains('refuel-card'))k='refuel-add';
 if(!k&&el.querySelector('#historyBody'))k='refuel-history';
 if(!k&&el.querySelector('#garageProfileList'))k='settings-garage';
 if(!k&&el.classList.contains('theme-setting'))k='settings-theme';
 if(!k&&el.querySelector('#vehicleRegInput'))k='settings-registration';
 if(!k&&el.querySelector('#saveDbBtn'))k='settings-masterdb';
 if(!k&&el.querySelector('.hero-dash'))k='dashboard-summary';
 if(!k&&el.querySelector('#odometerGrid'))k='dashboard-odometer';
 if(!k&&el.querySelector('.eff-wrap'))k='dashboard-current-tank';
 if(!k)k='section-'+slug(t);
 el.dataset.ftCollapseKey=k;return k;
}
function page(el){
 const s=el.matches('main > section.box')?el:el.closest('main > section.box');
 if(!s)return document.body.dataset.v158Page||'dashboard';
 if(s.id==='settingsBox')return'settings';
 if(s.id==='garageMaintenanceBox')return'maintenance';
 if(s.classList.contains('lower'))return'refuel';
 return s.dataset.v158Page||'dashboard';
}
function setState(el,collapsed,persist){
 el.classList.toggle('ft-collapsed',collapsed);
 const b=el.querySelector(':scope > .ft-collapse-bar .ft-collapse-toggle');
 if(b){b.textContent=collapsed?'⌄':'⌃';b.setAttribute('aria-expanded',collapsed?'false':'true');b.setAttribute('aria-label',(collapsed?'Expand ':'Collapse ')+(el.dataset.ftCollapseTitle||'section'));}
 if(persist){const x=load();x[el.dataset.ftCollapseKey]=collapsed;save(x);}
}
function enhance(el){
 if(!el||el.querySelector(':scope > .ft-collapse-bar'))return;
 const t=title(el),k=itemKey(el,t),nodes=[...el.childNodes];
 el.dataset.ftCollapseTitle=t;el.dataset.ftCollapsePage=page(el);el.classList.add('ft-collapsible');
 const bar=document.createElement('div');bar.className='ft-collapse-bar';bar.tabIndex=0;
 const label=document.createElement('span');label.className='ft-collapse-title';label.textContent=t;
 const btn=document.createElement('button');btn.type='button';btn.className='ft-collapse-toggle';
 const body=document.createElement('div');body.className='ft-collapse-body';nodes.forEach(n=>body.appendChild(n));
 bar.append(label,btn);el.append(bar,body);
 const toggle=()=>setState(el,!el.classList.contains('ft-collapsed'),true);
 bar.onclick=e=>{if(!e.target.closest('.ft-collapse-toggle'))toggle();};
 bar.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();}};
 btn.onclick=e=>{e.stopPropagation();toggle();};
 setState(el,!!load()[k],false);
}
function targets(){return[...document.querySelectorAll('main > section.box:not(.lower):not(#settingsBox),main > section.lower > .card,#settingsBox .settings > .setting')];}
function toolbar(){
 const main=document.querySelector('main');if(!main||document.getElementById('ftCollapseToolbar'))return;
 const x=document.createElement('div');x.id='ftCollapseToolbar';x.className='ft-collapse-toolbar';
 const c=document.createElement('button'),e=document.createElement('button');c.type=e.type='button';c.textContent='Collapse all';e.textContent='Expand all';
 c.onclick=()=>all(true);e.onclick=()=>all(false);x.append(c,e);main.prepend(x);
}
function refresh(){targets().forEach(enhance);toolbar();}
function all(collapsed){const p=document.body.dataset.v158Page||'dashboard';targets().filter(x=>page(x)===p).forEach(x=>{enhance(x);setState(x,collapsed,true);});}
function later(ms){clearTimeout(timer);timer=setTimeout(refresh,ms||20);}
refresh();
const main=document.querySelector('main');if(main)new MutationObserver(()=>later(25)).observe(main,{childList:true,subtree:true});
document.addEventListener('fueltracker:pagechange',()=>later(20));
document.addEventListener('fueltracker:datachange',()=>later(60));
document.addEventListener('fueltracker:maintenancechange',()=>later(60));
window.FuelTrackerCollapsibleSectionsV16={revision:REV,refresh,collapseAll:()=>all(true),expandAll:()=>all(false)};
})();
