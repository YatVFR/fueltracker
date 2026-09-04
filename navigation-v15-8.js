(function(){
  'use strict';

  const REV='v15.8-page-navigation-1';
  const APP_VERSION='v15.8 Garage';
  const APP_NUMBER='15.8';
  const PAGE_KEY='fueltrackerV158ActivePage';
  const PAGES=new Set(['dashboard','refuel','settings']);

  function currentPage(){
    const saved=localStorage.getItem(PAGE_KEY);
    return PAGES.has(saved)?saved:'dashboard';
  }

  function installStyles(){
    if(document.getElementById('v158NavigationStyles'))return;
    const s=document.createElement('style');
    s.id='v158NavigationStyles';
    s.textContent=`
      .v158-page-nav{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin:8px 0 10px;padding:6px;border:1px solid #26343f;border-radius:11px;background:#081017;position:sticky;top:6px;z-index:120;box-shadow:0 8px 22px rgba(0,0,0,.22)}
      .v158-page-nav button{min-width:0;border:1px solid transparent;border-radius:8px;background:transparent;color:#8e99a3;padding:9px 8px;font-size:9px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap}
      .v158-page-nav button.active{color:#fff;background:linear-gradient(135deg,var(--accent2,#0d62d9),var(--accent,#137fe8));border-color:color-mix(in srgb,var(--accent,#137fe8) 35%,transparent)}
      .v158-page-nav button span{display:block;margin-top:2px;font-size:7px;font-weight:700;letter-spacing:.02em;text-transform:none;color:inherit;opacity:.72;overflow:hidden;text-overflow:ellipsis}
      main>section.v158-page-hidden{display:none!important}
      .v158-page-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin:2px 0 8px;padding:0 2px}.v158-page-heading strong{font-size:12px;letter-spacing:.11em;text-transform:uppercase}.v158-page-heading span{font-size:8px;color:#7f8b96;text-align:right}
      body[data-v158-page="refuel"] .lower{margin-top:0}
      body[data-v158-page="settings"] #settingsBox{margin-top:0}
      @media(max-width:580px){.v158-page-nav{top:4px;margin-top:6px;padding:5px;gap:4px}.v158-page-nav button{padding:8px 5px;font-size:8px}.v158-page-nav button span{font-size:6.5px}.v158-page-heading span{display:none}}
    `;
    document.head.appendChild(s);
  }

  function ensureNav(){
    let nav=document.getElementById('v158PageNav');
    if(nav)return nav;
    const main=document.querySelector('main');if(!main)return null;
    nav=document.createElement('nav');
    nav.id='v158PageNav';nav.className='v158-page-nav';nav.setAttribute('aria-label','Fuel Tracker pages');
    nav.innerHTML=`
      <button type="button" data-v158-page="dashboard"><b>Dashboard</b><span>Overview & analytics</span></button>
      <button type="button" data-v158-page="refuel"><b>Refuel</b><span>Entry & history</span></button>
      <button type="button" data-v158-page="settings"><b>Settings</b><span>Garage & data</span></button>`;
    main.insertAdjacentElement('beforebegin',nav);
    nav.querySelectorAll('[data-v158-page]').forEach(btn=>btn.onclick=()=>showPage(btn.dataset.v158Page,true));
    return nav;
  }

  function pageForSection(section){
    if(section.id==='settingsBox')return 'settings';
    if(section.classList.contains('lower'))return 'refuel';
    return 'dashboard';
  }

  function classifySections(){
    document.querySelectorAll('main > section.box').forEach(section=>{
      section.dataset.v158Page=pageForSection(section);
    });
  }

  function ensureHeading(page){
    const selector=page==='refuel'?'main > section.lower':page==='settings'?'#settingsBox':null;
    const target=selector?document.querySelector(selector):null;
    if(!target)return;
    const id='v158Heading-'+page;
    if(target.querySelector('#'+id))return;
    const h=document.createElement('div');h.id=id;h.className='v158-page-heading';
    if(page==='refuel')h.innerHTML='<strong>Refuel</strong><span>Add fuel entries and review vehicle history</span>';
    else h.innerHTML='<strong>Settings</strong><span>Garage profiles, appearance, database and backup</span>';
    target.insertAdjacentElement('afterbegin',h);
  }

  function showPage(page,remember){
    if(!PAGES.has(page))page='dashboard';
    classifySections();
    ensureHeading('refuel');ensureHeading('settings');
    document.querySelectorAll('main > section.box').forEach(section=>{
      section.classList.toggle('v158-page-hidden',section.dataset.v158Page!==page);
    });
    document.querySelectorAll('#v158PageNav [data-v158-page]').forEach(btn=>{
      const active=btn.dataset.v158Page===page;
      btn.classList.toggle('active',active);btn.setAttribute('aria-current',active?'page':'false');
    });
    document.body.dataset.v158Page=page;
    if(remember)localStorage.setItem(PAGE_KEY,page);
    if(remember)window.scrollTo({top:0,behavior:'smooth'});
    document.dispatchEvent(new CustomEvent('fueltracker:pagechange',{detail:{page}}));
  }

  function ownVersionNodes(){
    const oldBrand=document.querySelector('.brand');
    if(oldBrand&&!oldBrand.dataset.v158Owned){
      const next=oldBrand.cloneNode(true);next.dataset.v158Owned='1';oldBrand.replaceWith(next);
    }
    const oldTitle=document.querySelector('title');
    if(oldTitle&&!oldTitle.dataset.v158Owned){
      const next=document.createElement('title');next.dataset.v158Owned='1';next.textContent='Fuel Tracker v'+APP_NUMBER;oldTitle.replaceWith(next);
    }
  }

  function setVersion(){
    window.FUEL_TRACKER_VERSION=APP_VERSION;window.FUEL_TRACKER_VERSION_NUMBER=APP_NUMBER;
    const badge=document.querySelector('.brand small');if(badge&&badge.textContent!==APP_VERSION)badge.textContent=APP_VERSION;
    if(document.title!=='Fuel Tracker v'+APP_NUMBER)document.title='Fuel Tracker v'+APP_NUMBER;
  }

  function bindShortcuts(){
    const settings=document.getElementById('settingsBtn');
    if(settings){settings.onclick=()=>showPage('settings',true);settings.title='Open Settings page';}
  }

  function refreshLayout(){
    classifySections();ensureHeading('refuel');ensureHeading('settings');bindShortcuts();setVersion();
    const page=document.body.dataset.v158Page||currentPage();
    document.querySelectorAll('main > section.box').forEach(section=>section.classList.toggle('v158-page-hidden',section.dataset.v158Page!==page));
  }

  installStyles();ensureNav();ownVersionNodes();showPage(currentPage(),false);bindShortcuts();setVersion();

  const main=document.querySelector('main');
  if(main){let timer;new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(refreshLayout,0);}).observe(main,{childList:true,subtree:false});}
  const brand=document.querySelector('.brand');if(brand)new MutationObserver(setVersion).observe(brand,{childList:true,subtree:true});
  const title=document.querySelector('title');if(title)new MutationObserver(setVersion).observe(title,{childList:true});

  document.addEventListener('fueltracker:datachange',()=>setTimeout(refreshLayout,70));
  window.FuelTrackerNavigation={revision:REV,version:APP_VERSION,showPage};
})();
