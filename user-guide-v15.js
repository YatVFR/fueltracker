(function(){
  'use strict';
  const REV='v15.4-user-guide-3';

  function installStyles(){
    if(document.getElementById('v15UserGuideStyles'))return;
    const s=document.createElement('style');
    s.id='v15UserGuideStyles';
    s.textContent=`
      .user-guide-setting{grid-column:1/-1;padding:0!important;border:0!important;background:transparent!important}
      .user-guide-launcher{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;border:1px solid #293540;background:#0c141b;border-radius:10px}
      .user-guide-launcher-copy{min-width:0}.user-guide-launcher-copy .label{margin-bottom:4px}.user-guide-launcher-copy strong{margin:0}.user-guide-launcher-copy p{margin:5px 0 0;color:#929ca5;font-size:11px;line-height:1.45}
      .user-guide-toggle{flex:0 0 auto;min-width:112px}
      .user-guide-panel{display:grid;grid-template-rows:0fr;opacity:0;transition:grid-template-rows .26s ease,opacity .2s ease;margin-top:0}
      .user-guide-panel.open{grid-template-rows:1fr;opacity:1;margin-top:8px}
      .user-guide-panel-inner{overflow:hidden}
      .user-guide-shell{padding:12px;border:1px solid #293540;background:#0c141b;border-radius:10px}
      .user-guide-shell-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px}.user-guide-shell-head strong{margin:0}.user-guide-close{padding:7px 9px}
      .user-guide-list{display:grid;gap:8px}
      .user-guide-item{border:1px solid #2b3742;border-radius:10px;background:#091017;overflow:hidden}
      .user-guide-item summary{list-style:none;cursor:pointer;padding:12px 13px;font-size:11px;font-weight:900;color:#eef3f7;display:flex;align-items:center;justify-content:space-between;gap:10px}
      .user-guide-item summary::-webkit-details-marker{display:none}.user-guide-item summary::after{content:'+';font-size:17px;color:#7e8b97}.user-guide-item[open] summary::after{content:'−'}
      .user-guide-body{padding:0 13px 13px;color:#a6b0ba;font-size:11px;line-height:1.6}.user-guide-body ol,.user-guide-body ul{margin:8px 0 0;padding-left:20px}.user-guide-body li{margin:5px 0}
      .user-guide-tip{margin-top:10px;padding:10px;border:1px solid #255e38;border-radius:8px;background:#07150c;color:#70df8a}.user-guide-warn{margin-top:10px;padding:10px;border:1px solid #6a511f;border-radius:8px;background:#231b0d;color:#f2bd54}
      @media(max-width:780px){.user-guide-setting{grid-column:auto}.user-guide-launcher{align-items:flex-start}.user-guide-toggle{min-width:96px}.user-guide-launcher-copy p{max-width:220px}}
      @media(max-width:480px){.user-guide-launcher{padding:11px}.user-guide-toggle{min-width:88px;padding:9px 8px}.user-guide-launcher-copy p{font-size:10px}}
    `;
    document.head.appendChild(s);
  }

  function guideItems(){return `
    <details class="user-guide-item" id="guideInstall"><summary>1. Install Fuel Tracker on iPhone</summary><div class="user-guide-body"><ol><li>Open Fuel Tracker in <strong>Safari</strong>.</li><li>Open <strong>https://yatvfr.github.io/fueltracker/</strong>.</li><li>Tap the Safari <strong>Share</strong> button.</li><li>Choose <strong>Add to Home Screen</strong>.</li><li>Launch Fuel Tracker from the Home Screen icon.</li><li>Open the app once while online so its PWA files are cached for offline use.</li></ol><div class="user-guide-tip">Fuel Tracker is local-first. No database server or account is required for normal use.</div></div></details>
    <details class="user-guide-item"><summary>2. First-time Garage setup</summary><div class="user-guide-body"><ol><li>Open <strong>Settings → My Garage</strong>.</li><li>Use an existing profile or tap <strong>+ ADD VEHICLE</strong>.</li><li>Choose Bike or Car and enter a profile name.</li><li>Add the vehicle model and registration number.</li><li>Select a dashboard theme.</li><li>Set the current odometer.</li></ol><div class="user-guide-tip">Each Garage vehicle keeps separate registration, model, theme, odometer, fuel history and MasterDB identity.</div></div></details>
    <details class="user-guide-item"><summary>3. Add a refuel</summary><div class="user-guide-body"><ol><li>Select the correct vehicle from the Garage selector.</li><li>Under <strong>ADD REFUEL</strong>, enter Date &amp; Time and Odometer.</li><li>Select the fuel station.</li><li>Enter litres and total cost.</li><li>Select SGD or MYR. For MYR, confirm the SGD/MYR exchange rate.</li><li>Choose fuel grade if known, add optional notes, then tap <strong>SAVE REFUEL</strong>.</li></ol></div></details>
    <details class="user-guide-item"><summary>4. Read the dashboard</summary><div class="user-guide-body"><ul><li><strong>Efficiency</strong> shows mileage and fuel-economy information.</li><li><strong>Spending</strong> shows fuel spend, including SGD and MYR comparison.</li><li>Use <strong>14 Days, Monthly, Yearly or All Time</strong> to change period.</li><li>When Monthly is selected, use month arrows or swipe.</li><li><strong>View Details</strong> under Data Health shows record integrity information.</li></ul></div></details>
    <details class="user-guide-item"><summary>5. MasterDB backup</summary><div class="user-guide-body"><ol><li>Select the vehicle you want to back up.</li><li>Go to <strong>Settings → Master Database</strong>.</li><li>Tap <strong>EXPORT DB</strong>.</li><li>Save the JSON file somewhere backed up.</li><li>Repeat for every Garage vehicle.</li></ol><div class="user-guide-tip">Recommended: export after important changes and periodically for rollback.</div></div></details>
    <details class="user-guide-item"><summary>6. Restore or import a MasterDB</summary><div class="user-guide-body"><ol><li>Select the Garage vehicle that should receive the database.</li><li>Go to <strong>Settings → Master Database → IMPORT DB</strong>.</li><li>Select the correct JSON file.</li><li>Review the record count.</li><li>Confirm only when the selected vehicle and file are correct.</li></ol><div class="user-guide-warn">IMPORT DB replaces the working records of the active vehicle only. Export the current DB first if you may need to roll back.</div></div></details>
    <details class="user-guide-item"><summary>7. Moving to a new phone or reinstalling</summary><div class="user-guide-body"><ol><li>Export the MasterDB for every vehicle first.</li><li>Install Fuel Tracker on the new device with Safari → Add to Home Screen.</li><li>Create/select the corresponding vehicle profile.</li><li>Import that vehicle's MasterDB.</li><li>Repeat for all Garage vehicles.</li></ol><div class="user-guide-warn">Clearing Safari website data can remove the local working copy. Keep exported MasterDB files as recovery backups.</div></div></details>
    <details class="user-guide-item"><summary>8. Safe everyday workflow</summary><div class="user-guide-body"><ol><li>Select the correct Garage vehicle.</li><li>Add refuels normally.</li><li>Check Data Health occasionally.</li><li>Export each vehicle's MasterDB periodically.</li><li>Keep dated backups before major changes.</li></ol><div class="user-guide-tip">Simple rule: local copy for daily use, exported MasterDB for recovery.</div></div></details>`;}

  function buildGuide(){
    const settings=document.querySelector('#settingsBox .settings');
    if(!settings||document.getElementById('newUserGuide'))return;
    const card=document.createElement('div');card.className='setting user-guide-setting';card.id='newUserGuide';
    card.innerHTML=`<div class="user-guide-launcher"><div class="user-guide-launcher-copy"><div class="label">Help &amp; Getting Started</div><strong>New User Guide</strong><p>Installation, usage, MasterDB backup and recovery.</p></div><button type="button" class="secondary user-guide-toggle" id="userGuideToggle" aria-expanded="false">OPEN GUIDE</button></div><div class="user-guide-panel" id="userGuidePanel"><div class="user-guide-panel-inner"><div class="user-guide-shell"><div class="user-guide-shell-head"><strong>Fuel Tracker Guide</strong><button type="button" class="secondary user-guide-close" id="userGuideClose">CLOSE</button></div><div class="user-guide-list">${guideItems()}</div></div></div></div>`;
    settings.appendChild(card);
    const panel=card.querySelector('#userGuidePanel');const toggle=card.querySelector('#userGuideToggle');const close=card.querySelector('#userGuideClose');
    function setOpen(open){panel.classList.toggle('open',open);toggle.setAttribute('aria-expanded',open?'true':'false');toggle.textContent=open?'CLOSE GUIDE':'OPEN GUIDE';if(!open)card.querySelectorAll('details').forEach(d=>d.open=false);}
    toggle.onclick=()=>setOpen(!panel.classList.contains('open'));
    close.onclick=()=>{setOpen(false);card.querySelector('.user-guide-launcher')?.scrollIntoView({behavior:'smooth',block:'center'});};
  }

  installStyles();buildGuide();state.userGuideRevision=REV;saveState?.();
})();