(function(){
  'use strict';
  if(window.FuelTrackerSmartInbox)return;

  const REV='v16.2-smart-refuel-inbox-1';
  const APP_VERSION='v16.2 Smart Inbox';
  const APP_NUMBER='16.2';
  const INBOX_KEY='fueltrackerV160PossibleRefuels';
  const ACTIVE_KEY='fueltrackerV162ActiveDetection';
  const FILTER_KEY='fueltrackerV162InboxFilter';
  const VALID_STATUS=new Set(['pending','opened','dismissed','completed']);

  function loadInbox(){try{const v=JSON.parse(localStorage.getItem(INBOX_KEY)||'[]');return Array.isArray(v)?v:[];}catch(e){return [];}}
  function saveInbox(v){localStorage.setItem(INBOX_KEY,JSON.stringify(v));}
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function activeId(){return localStorage.getItem(ACTIVE_KEY)||'';}
  function setActive(id){if(id)localStorage.setItem(ACTIVE_KEY,String(id));else localStorage.removeItem(ACTIVE_KEY);}
  function statusOf(x){const s=String(x?.status||'pending').toLowerCase();return VALID_STATUS.has(s)?s:'pending';}
  function fmtDate(v){const d=new Date(v);return Number.isNaN(d.getTime())?'Unknown time':d.toLocaleString();}

  function installStyles(){
    if(document.getElementById('v162InboxStyles'))return;
    const s=document.createElement('style');s.id='v162InboxStyles';s.textContent=`
      .v162-inbox{margin-bottom:10px;border:1px solid #2b3b47;border-radius:11px;background:linear-gradient(180deg,#0d161d,#081016);overflow:hidden}.v162-inbox-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;padding:10px 11px;border-bottom:1px solid #26343f}.v162-inbox-head h3{margin:0;font-size:10px;letter-spacing:.08em;text-transform:uppercase}.v162-inbox-head p{margin:3px 0 0;font-size:7.5px;color:#7f8c96}.v162-pending-count{min-width:24px;height:24px;display:flex;align-items:center;justify-content:center;border-radius:999px;background:#15293a;border:1px solid #355774;color:#90c8ff;font-size:10px;font-weight:900}.v162-inbox-tools{display:grid;grid-template-columns:repeat(4,minmax(0,1fr)) auto;gap:5px;padding:8px 10px;border-bottom:1px solid #22303a}.v162-kpi{border:1px solid #25343f;border-radius:7px;padding:6px 7px;background:#071016;min-width:0}.v162-kpi small{display:block;font-size:6px;color:#71808b;text-transform:uppercase;letter-spacing:.06em}.v162-kpi b{display:block;margin-top:2px;font-size:11px}.v162-inbox-tools select{min-width:92px;font-size:8px}.v162-list{display:grid;gap:6px;padding:9px}.v162-item{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;border:1px solid #263540;border-radius:9px;background:#091118;padding:9px}.v162-item-main{min-width:0}.v162-item-title{display:flex;align-items:center;gap:6px;min-width:0}.v162-item-title b{font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.v162-status{font-size:6px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;border:1px solid #3a4650;border-radius:999px;padding:3px 5px;color:#8e9ba5}.v162-status.pending{color:#f1bd58;border-color:#6a5228;background:#20190c}.v162-status.opened{color:#80b7ff;border-color:#365a83;background:#0c1724}.v162-status.completed{color:#70de8a;border-color:#315d3b;background:#0c1a12}.v162-status.dismissed{color:#8c98a1}.v162-meta{margin-top:4px;font-size:7px;color:#75838d;line-height:1.4}.v162-linked{color:#79d88d}.v162-actions{display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end}.v162-actions button{font-size:7px;padding:6px 7px}.v162-empty{padding:12px;text-align:center;color:#74818a;font-size:8px}.v162-nav-badge{display:inline-flex;min-width:15px;height:15px;align-items:center;justify-content:center;margin-left:5px;border-radius:999px;background:#f0b54e;color:#101418;font-size:7px;font-weight:950;vertical-align:middle}.v162-nav-badge[hidden]{display:none!important}
      @media(max-width:580px){.v162-inbox-tools{grid-template-columns:repeat(4,minmax(0,1fr));}.v162-inbox-tools select{grid-column:1/-1;width:100%}.v162-item{grid-template-columns:1fr}.v162-actions{justify-content:flex-start}}
    `;document.head.appendChild(s);
  }

  function ownVersionNodes(){
    const brand=document.querySelector('.brand');
    if(brand&&!brand.dataset.v162Owned){const next=brand.cloneNode(true);next.dataset.v162Owned='1';brand.replaceWith(next);}
    const title=document.querySelector('title');
    if(title&&!title.dataset.v162Owned){const next=document.createElement('title');next.dataset.v162Owned='1';title.replaceWith(next);}
  }
  function setVersion(){
    window.FUEL_TRACKER_VERSION=APP_VERSION;window.FUEL_TRACKER_VERSION_NUMBER=APP_NUMBER;
    const badge=document.querySelector('.brand small');if(badge)badge.textContent=APP_VERSION;
    if(document.title!=='Fuel Tracker v'+APP_NUMBER)document.title='Fuel Tracker v'+APP_NUMBER;
  }

  function ensurePanel(){
    const target=document.querySelector('main > section.lower');if(!target)return null;
    let panel=document.getElementById('v162SmartInbox');if(panel)return panel;
    panel=document.createElement('div');panel.id='v162SmartInbox';panel.className='v162-inbox';
    const heading=target.querySelector('.v158-page-heading');
    if(heading)heading.insertAdjacentElement('afterend',panel);else target.insertAdjacentElement('afterbegin',panel);
    return panel;
  }

  function counts(rows){const c={pending:0,opened:0,dismissed:0,completed:0};rows.forEach(x=>c[statusOf(x)]++);return c;}
  function currentFilter(){const f=localStorage.getItem(FILTER_KEY)||'active';return ['active','all','pending','opened','dismissed','completed'].includes(f)?f:'active';}
  function filtered(rows,f){if(f==='all')return rows;if(f==='active')return rows.filter(x=>['pending','opened'].includes(statusOf(x)));return rows.filter(x=>statusOf(x)===f);}

  function renderPanel(){
    installStyles();const panel=ensurePanel();if(!panel)return;
    const rows=loadInbox().sort((a,b)=>new Date(b.detectedAt||0)-new Date(a.detectedAt||0));const c=counts(rows),f=currentFilter(),view=filtered(rows,f).slice(0,30);
    panel.innerHTML=`<div class="v162-inbox-head"><div><h3>Possible Refuels</h3><p>Review detected petrol-station stops before they become fuel records.</p></div><span class="v162-pending-count" title="Pending">${c.pending}</span></div>
      <div class="v162-inbox-tools"><div class="v162-kpi"><small>Pending</small><b>${c.pending}</b></div><div class="v162-kpi"><small>Opened</small><b>${c.opened}</b></div><div class="v162-kpi"><small>Done</small><b>${c.completed}</b></div><div class="v162-kpi"><small>Dismissed</small><b>${c.dismissed}</b></div><select id="v162InboxFilter"><option value="active" ${f==='active'?'selected':''}>Active only</option><option value="all" ${f==='all'?'selected':''}>All</option><option value="pending" ${f==='pending'?'selected':''}>Pending</option><option value="opened" ${f==='opened'?'selected':''}>Opened</option><option value="completed" ${f==='completed'?'selected':''}>Completed</option><option value="dismissed" ${f==='dismissed'?'selected':''}>Dismissed</option></select></div>
      <div class="v162-list">${view.length?view.map(renderItem).join(''):'<div class="v162-empty">No Possible Refuels in this view.</div>'}</div>`;
    document.getElementById('v162InboxFilter')?.addEventListener('change',e=>{localStorage.setItem(FILTER_KEY,e.target.value);renderPanel();});
    panel.querySelectorAll('[data-v162-enter]').forEach(b=>b.onclick=()=>enterDetection(b.dataset.v162Enter));
    panel.querySelectorAll('[data-v162-dismiss]').forEach(b=>b.onclick=()=>changeStatus(b.dataset.v162Dismiss,'dismissed'));
    panel.querySelectorAll('[data-v162-reopen]').forEach(b=>b.onclick=()=>changeStatus(b.dataset.v162Reopen,'pending'));
    updateNavBadge();
  }

  function renderItem(x){
    const status=statusOf(x);const linked=x.linkedRecordId?`<span class="v162-linked">Linked refuel: ${esc(x.linkedRecordId)}</span>`:'';
    const actions=status==='pending'||status==='opened'
      ?`<button type="button" class="primary" data-v162-enter="${esc(x.id)}">ENTER REFUEL</button><button type="button" class="secondary" data-v162-dismiss="${esc(x.id)}">DISMISS</button>`
      :status==='dismissed'?`<button type="button" class="secondary" data-v162-reopen="${esc(x.id)}">REOPEN</button>`:'';
    return `<div class="v162-item"><div class="v162-item-main"><div class="v162-item-title"><b>⛽ ${esc(x.name||x.station||'Petrol station')}</b><span class="v162-status ${status}">${status}</span></div><div class="v162-meta">${esc(fmtDate(x.detectedAt))}${x.dwellMinutes?` · ${esc(x.dwellMinutes)} min dwell`:''}${linked?`<br>${linked}`:''}</div></div><div class="v162-actions">${actions}</div></div>`;
  }

  function changeStatus(id,status){const rows=loadInbox();const x=rows.find(v=>String(v.id)===String(id));if(!x)return;x.status=status;if(status==='dismissed')x.dismissedAt=new Date().toISOString();if(status==='pending'){delete x.dismissedAt;delete x.completedAt;delete x.linkedRecordId;}saveInbox(rows);if(activeId()===String(id))setActive('');renderPanel();syncSettingsInbox();}

  function enterDetection(id){
    setActive(id);
    const rows=loadInbox();const x=rows.find(v=>String(v.id)===String(id));if(x){x.status='opened';x.openedAt=x.openedAt||new Date().toISOString();saveInbox(rows);}
    window.FuelTrackerAutomation?.openDetection?.(id);
    window.FuelTrackerNavigation?.showPage?.('refuel',true);
    setTimeout(()=>document.querySelector('.refuel-card')?.scrollIntoView({behavior:'smooth',block:'start'}),100);
    renderPanel();syncSettingsInbox();
  }

  function updateNavBadge(){
    const btn=document.querySelector('#v158PageNav [data-v158-page="refuel"]');if(!btn)return;
    let badge=btn.querySelector('.v162-nav-badge');if(!badge){badge=document.createElement('em');badge.className='v162-nav-badge';btn.querySelector('b')?.appendChild(badge);}
    const n=loadInbox().filter(x=>statusOf(x)==='pending').length;badge.textContent=String(n);badge.hidden=n===0;
  }

  function syncSettingsInbox(){try{window.FuelTrackerAutomation?.refresh?.();}catch(e){} }

  function recordIds(){try{return new Set((typeof currentRecords==='function'?currentRecords():[]).map(r=>String(r.id)));}catch(e){return new Set();}}
  function completeFromSubmit(before){
    const id=activeId();if(!id)return;
    setTimeout(()=>{
      const after=typeof currentRecords==='function'?[...currentRecords()]:[];
      const created=after.find(r=>!before.has(String(r.id)));
      if(!created)return;
      const rows=loadInbox(),x=rows.find(v=>String(v.id)===String(id));if(!x)return;
      x.status='completed';x.completedAt=new Date().toISOString();x.linkedRecordId=created.id;saveInbox(rows);setActive('');renderPanel();syncSettingsInbox();
    },140);
  }

  function captureExternalOpen(){
    document.addEventListener('click',e=>{
      const b=e.target.closest?.('[data-v160-confirm]');if(b)setActive(b.dataset.v160Confirm);
    },true);
    const q=new URLSearchParams(location.search),id=q.get('possibleRefuel');if(id)setActive(id);
  }

  function bindSubmit(){
    const form=document.getElementById('fuelForm');if(!form||form.dataset.v162InboxBound)return;form.dataset.v162InboxBound='1';
    form.addEventListener('submit',()=>{const before=recordIds();completeFromSubmit(before);},true);
  }

  function refresh(){setVersion();renderPanel();bindSubmit();updateNavBadge();}

  installStyles();ownVersionNodes();setVersion();captureExternalOpen();bindSubmit();renderPanel();updateNavBadge();
  document.addEventListener('fueltracker:pagechange',e=>{if(e.detail?.page==='refuel')setTimeout(renderPanel,30);});
  document.addEventListener('fueltracker:datachange',()=>setTimeout(refresh,80));
  window.addEventListener('storage',e=>{if(e.key===INBOX_KEY)refresh();});
  const brand=document.querySelector('.brand');if(brand)new MutationObserver(setVersion).observe(brand,{childList:true,subtree:true});
  const title=document.querySelector('title');if(title)new MutationObserver(setVersion).observe(title,{childList:true});

  window.FuelTrackerSmartInbox={revision:REV,version:APP_VERSION,render:renderPanel,enterDetection,changeStatus};
})();
