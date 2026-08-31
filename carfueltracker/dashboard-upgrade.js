(() => {
  'use strict';
  if (window.__fuelDashboardV12Loaded) return;
  window.__fuelDashboardV12Loaded = true;
  const STORAGE_KEY_FALLBACK = 'fuelTrackerData';
  const state = { view: 'efficiency', lastRefresh: null };
  const $ = (id) => document.getElementById(id);
  function storageKey(){ return typeof window.STORAGE_KEY === 'string' ? window.STORAGE_KEY : STORAGE_KEY_FALLBACK; }
  function safeLoadData(){
    const raw=localStorage.getItem(storageKey());
    if(!raw) return {data:[],parseError:null};
    try{const parsed=JSON.parse(raw);return Array.isArray(parsed)?{data:parsed,parseError:null}:{data:[],parseError:'Stored database is not an array.'};}
    catch(error){return {data:[],parseError:'Stored database contains invalid JSON.'};}
  }
  function validDate(value){const d=new Date(value);return Number.isNaN(d.getTime())?null:d;}
  function fingerprint(entry){return [entry?.dateTime||'',Number(entry?.mileage)||0,Number(entry?.volume)||0,Number(entry?.cost)||0,String(entry?.currency||'').toUpperCase(),String(entry?.location||'').trim().toLowerCase()].join('|');}
  function validateIntegrity(data,parseError){
    const issues=[]; if(parseError)issues.push({type:'error',text:parseError});
    const seen=new Map();let duplicates=0,invalidRecords=0,currencyWarnings=0;
    data.forEach((entry,index)=>{
      const date=validDate(entry?.dateTime),mileage=Number(entry?.mileage),volume=Number(entry?.volume),cost=Number(entry?.cost),currency=String(entry?.currency||'').toUpperCase(),location=String(entry?.location||'').trim();
      if(!date||!Number.isFinite(mileage)||mileage<0||!Number.isFinite(volume)||volume<=0||!Number.isFinite(cost)||cost<0||!location)invalidRecords++;
      if(currency&&!['SGD','MYR'].includes(currency))currencyWarnings++;
      const fp=fingerprint(entry);if(seen.has(fp))duplicates++;else seen.set(fp,index);
    });
    const chronological=data.map((entry,index)=>({entry,index,date:validDate(entry?.dateTime),mileage:Number(entry?.mileage)})).filter(x=>x.date&&Number.isFinite(x.mileage)&&x.mileage>=0).sort((a,b)=>a.date-b.date);
    let odoRegressions=0;for(let i=1;i<chronological.length;i++)if(chronological[i].mileage<chronological[i-1].mileage)odoRegressions++;
    if(duplicates)issues.push({type:'warn',text:`${duplicates} possible duplicate ${duplicates===1?'record':'records'}`});
    if(invalidRecords)issues.push({type:'error',text:`${invalidRecords} ${invalidRecords===1?'record has':'records have'} missing or invalid required data`});
    if(odoRegressions)issues.push({type:'warn',text:`${odoRegressions} odometer sequence ${odoRegressions===1?'regression':'regressions'}`});
    if(currencyWarnings)issues.push({type:'warn',text:`${currencyWarnings} unsupported currency ${currencyWarnings===1?'value':'values'}`});
    const latest=data.map(entry=>({entry,date:validDate(entry?.dateTime)})).filter(x=>x.date).sort((a,b)=>b.date-a.date)[0]||null;
    const level=parseError||invalidRecords?'error':(duplicates||odoRegressions||currencyWarnings?'warn':'healthy');
    return {level,issues,latest,count:data.length};
  }
  function formatDate(date){return date?date.toLocaleString(undefined,{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):'No valid data yet';}
  function escapeHtml(value){return String(value).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));}
  function buildUI(){
    const mileageTabs=$('mileageTabs'),spendingTabs=$('spendingTabs');if(!mileageTabs||!spendingTabs)return null;
    const mileagePanel=mileageTabs.closest('.period-panel'),spendingPanel=spendingTabs.closest('.period-panel');if(!mileagePanel||!spendingPanel||mileagePanel.dataset.v12Wrapped)return null;
    mileagePanel.dataset.v12Wrapped='true';spendingPanel.dataset.v12Wrapped='true';
    const spendingSeparator=Array.from(document.querySelectorAll('.section-separator')).find(el=>el.textContent.trim().toLowerCase()==='fuel spending');if(spendingSeparator)spendingSeparator.hidden=true;
    const frame=document.createElement('section');frame.className='unified-dashboard-frame';frame.setAttribute('aria-label','Fuel dashboard');
    frame.innerHTML=`<div class="unified-dashboard-head"><div class="dashboard-switch" role="tablist" aria-label="Dashboard view"><button type="button" class="dashboard-switch-btn active" data-dashboard-view="efficiency" role="tab" aria-selected="true">⛽ Efficiency</button><button type="button" class="dashboard-switch-btn" data-dashboard-view="spending" role="tab" aria-selected="false">💰 Spending</button></div><button type="button" class="dashboard-refresh-btn" id="dashboardRefreshBtn" aria-label="Refresh dashboard and check data">↻ <span>Refresh</span></button></div><div class="dashboard-common-tabs" id="dashboardCommonTabs" aria-label="Dashboard timeframe"><button type="button" class="dashboard-common-tab active" data-common-period="14">14 Days</button><button type="button" class="dashboard-common-tab" data-common-period="month">Monthly</button><button type="button" class="dashboard-common-tab" data-common-period="year">Yearly</button><button type="button" class="dashboard-common-tab" data-common-period="all">All Time</button></div><div class="dashboard-health-strip" id="dashboardHealthStrip" aria-live="polite"><span class="health-dot"></span><span class="health-text">Checking data…</span><span class="health-latest"></span></div><div class="dashboard-view-stage" id="dashboardViewStage"></div><div class="dashboard-view-dots" aria-hidden="true"><span class="active"></span><span></span></div>`;
    mileagePanel.parentNode.insertBefore(frame,mileagePanel);const stage=frame.querySelector('#dashboardViewStage');
    const efficiencyView=document.createElement('div');efficiencyView.className='dashboard-view active';efficiencyView.dataset.view='efficiency';
    const spendingView=document.createElement('div');spendingView.className='dashboard-view';spendingView.dataset.view='spending';stage.append(efficiencyView,spendingView);efficiencyView.appendChild(mileagePanel);spendingView.appendChild(spendingPanel);
    mileageTabs.classList.add('v12-hidden-tabs');spendingTabs.classList.add('v12-hidden-tabs');
    const details=document.createElement('div');details.className='dashboard-health-details';details.id='dashboardHealthDetails';details.hidden=true;details.innerHTML=`<div class="health-detail-grid"><div><span>Records</span><strong id="healthRecordCount">0</strong></div><div><span>Latest ingested</span><strong id="healthLatestIngested">—</strong></div><div><span>Latest odometer</span><strong id="healthLatestOdo">—</strong></div><div><span>Last UI refresh</span><strong id="healthLastRefresh">—</strong></div></div><div class="health-issues" id="healthIssues"></div>`;
    frame.querySelector('#dashboardHealthStrip').insertAdjacentElement('afterend',details);frame.querySelector('#dashboardHealthStrip').setAttribute('role','button');frame.querySelector('#dashboardHealthStrip').setAttribute('tabindex','0');frame.querySelector('#dashboardHealthStrip').setAttribute('aria-expanded','false');return frame;
  }
  function setView(view){state.view=view;document.querySelectorAll('.dashboard-switch-btn').forEach(btn=>{const active=btn.dataset.dashboardView===view;btn.classList.toggle('active',active);btn.setAttribute('aria-selected',active?'true':'false');});document.querySelectorAll('.dashboard-view').forEach(panel=>panel.classList.toggle('active',panel.dataset.view===view));document.querySelectorAll('.dashboard-view-dots span').forEach((dot,index)=>dot.classList.toggle('active',(view==='efficiency'?0:1)===index));}
  function setCommonPeriod(period){document.querySelectorAll('.dashboard-common-tab').forEach(btn=>btn.classList.toggle('active',btn.dataset.commonPeriod===period));document.querySelector(`[data-mileage-period="${period}"]`)?.click();document.querySelector(`[data-spending-period="${period}"]`)?.click();}
  function updateHealthUI(result){
    const strip=$('dashboardHealthStrip');if(!strip)return;strip.classList.remove('healthy','warn','error','checking');strip.classList.add(result.level);const label=result.level==='healthy'?'Data healthy':result.level==='warn'?'Review data':'Data integrity issue';strip.querySelector('.health-text').textContent=label;strip.querySelector('.health-latest').textContent=result.latest?`Latest: ${formatDate(result.latest.date)}`:'No ingested records';
    $('healthRecordCount').textContent=String(result.count);$('healthLatestIngested').textContent=result.latest?formatDate(result.latest.date):'—';const latestOdo=result.latest?Number(result.latest.entry?.mileage):NaN;$('healthLatestOdo').textContent=Number.isFinite(latestOdo)?`${latestOdo.toLocaleString()} km`:'—';$('healthLastRefresh').textContent=state.lastRefresh?formatDate(state.lastRefresh):'—';
    $('healthIssues').innerHTML=result.issues.length?result.issues.map(issue=>`<div class="health-issue ${issue.type}">${issue.type==='error'?'⚠':'•'} ${escapeHtml(issue.text)}</div>`).join(''):'<div class="health-issue ok">✓ No duplicate, required-field, currency or odometer-sequence issues detected.</div>';
    const existingPanel=$('dataStatusPanel');if(existingPanel&&!$('dataIntegrityStatus')){const item=document.createElement('div');item.className='data-status-item';item.innerHTML='<div class="data-status-label">Integrity</div><div class="data-status-value" id="dataIntegrityStatus">—</div>';existingPanel.querySelector('.data-status-grid')?.appendChild(item);}const integrity=$('dataIntegrityStatus');if(integrity){integrity.textContent=label;integrity.classList.toggle('warn',result.level!=='healthy');}
  }
  async function refreshDashboard(){
    const button=$('dashboardRefreshBtn'),strip=$('dashboardHealthStrip');if(button){button.disabled=true;button.classList.add('refreshing');button.querySelector('span').textContent='Checking…';}if(strip){strip.classList.remove('healthy','warn','error');strip.classList.add('checking');strip.querySelector('.health-text').textContent='Refreshing UI & validating data…';}
    try{if('serviceWorker'in navigator){const registration=await navigator.serviceWorker.getRegistration();if(registration)await registration.update().catch(()=>{});}const loaded=safeLoadData(),result=validateIntegrity(loaded.data,loaded.parseError);state.lastRefresh=new Date();if(typeof window.displayEntries==='function')window.displayEntries();else if(typeof window.computeStats==='function')window.computeStats(loaded.data);updateHealthUI(result);if(button)button.querySelector('span').textContent=result.level==='healthy'?'Updated':'Review Data';setTimeout(()=>{if(button){button.disabled=false;button.classList.remove('refreshing');button.querySelector('span').textContent='Refresh';}},1200);}catch(error){state.lastRefresh=new Date();updateHealthUI({level:'error',issues:[{type:'error',text:'Refresh failed. Reload the app and try again.'}],latest:null,count:0});if(button){button.disabled=false;button.classList.remove('refreshing');button.querySelector('span').textContent='Retry';}}
  }
  function attachInteractions(){
    document.querySelectorAll('.dashboard-switch-btn').forEach(btn=>btn.addEventListener('click',()=>setView(btn.dataset.dashboardView)));document.querySelectorAll('.dashboard-common-tab').forEach(btn=>btn.addEventListener('click',()=>setCommonPeriod(btn.dataset.commonPeriod)));$('dashboardRefreshBtn')?.addEventListener('click',refreshDashboard);
    const healthStrip=$('dashboardHealthStrip');const toggleDetails=()=>{const details=$('dashboardHealthDetails');if(!details)return;details.hidden=!details.hidden;healthStrip?.setAttribute('aria-expanded',details.hidden?'false':'true');};healthStrip?.addEventListener('click',toggleDetails);healthStrip?.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleDetails();}});
    const stage=$('dashboardViewStage');let startX=null;stage?.addEventListener('touchstart',event=>{startX=event.changedTouches?.[0]?.clientX??null;},{passive:true});stage?.addEventListener('touchend',event=>{if(startX===null)return;const endX=event.changedTouches?.[0]?.clientX??startX,dx=endX-startX;startX=null;if(Math.abs(dx)<55)return;if(dx<0&&state.view==='efficiency')setView('spending');else if(dx>0&&state.view==='spending')setView('efficiency');},{passive:true});window.addEventListener('storage',event=>{if(event.key===storageKey())refreshDashboard();});
  }
  function init(){if(!buildUI())return;attachInteractions();setView('efficiency');setCommonPeriod('14');const loaded=safeLoadData();state.lastRefresh=new Date();updateHealthUI(validateIntegrity(loaded.data,loaded.parseError));}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
