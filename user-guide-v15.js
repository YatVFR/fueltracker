(function(){
  'use strict';
  const REV='v15.2-user-guide-1';

  function installStyles(){
    if(document.getElementById('v15UserGuideStyles'))return;
    const s=document.createElement('style');
    s.id='v15UserGuideStyles';
    s.textContent=`
      .user-guide-setting{grid-column:1/-1}
      .user-guide-intro{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap}
      .user-guide-intro p{margin:6px 0 0;max-width:760px}
      .user-guide-list{display:grid;gap:8px;margin-top:12px}
      .user-guide-item{border:1px solid #2b3742;border-radius:10px;background:#091017;overflow:hidden}
      .user-guide-item summary{list-style:none;cursor:pointer;padding:12px 13px;font-size:11px;font-weight:900;color:#eef3f7;display:flex;align-items:center;justify-content:space-between;gap:10px}
      .user-guide-item summary::-webkit-details-marker{display:none}
      .user-guide-item summary::after{content:'+';font-size:17px;color:#7e8b97}
      .user-guide-item[open] summary::after{content:'−'}
      .user-guide-body{padding:0 13px 13px;color:#a6b0ba;font-size:11px;line-height:1.6}
      .user-guide-body ol,.user-guide-body ul{margin:8px 0 0;padding-left:20px}
      .user-guide-body li{margin:5px 0}
      .user-guide-tip{margin-top:10px;padding:10px;border:1px solid #255e38;border-radius:8px;background:#07150c;color:#70df8a}
      .user-guide-warn{margin-top:10px;padding:10px;border:1px solid #6a511f;border-radius:8px;background:#231b0d;color:#f2bd54}
      .user-guide-link{display:inline-block;margin-top:8px;color:#67b4ff;font-weight:800;word-break:break-all}
      @media(max-width:780px){.user-guide-setting{grid-column:auto}.user-guide-intro{display:block}}
    `;
    document.head.appendChild(s);
  }

  function buildGuide(){
    const settings=document.querySelector('#settingsBox .settings');
    if(!settings||document.getElementById('newUserGuide'))return;

    const card=document.createElement('div');
    card.className='setting user-guide-setting';
    card.id='newUserGuide';
    card.innerHTML=`
      <div class="user-guide-intro">
        <div>
          <div class="label">Help &amp; Getting Started</div>
          <strong>New User Guide</strong>
          <p>Installation, first-time setup, everyday usage, MasterDB backup and recovery.</p>
        </div>
        <button type="button" class="secondary" id="openFirstGuide">OPEN FIRST STEPS</button>
      </div>

      <div class="user-guide-list">
        <details class="user-guide-item" id="guideInstall">
          <summary>1. Install Fuel Tracker on iPhone</summary>
          <div class="user-guide-body">
            <ol>
              <li>Open Fuel Tracker in <strong>Safari</strong>.</li>
              <li>Open <strong>https://yatvfr.github.io/fueltracker/</strong>.</li>
              <li>Tap the Safari <strong>Share</strong> button.</li>
              <li>Choose <strong>Add to Home Screen</strong>.</li>
              <li>Launch Fuel Tracker from the new Home Screen icon.</li>
              <li>Open the app once while online so the PWA files are cached for offline use.</li>
            </ol>
            <div class="user-guide-tip">Fuel Tracker is local-first. No database server or account is required for normal use.</div>
          </div>
        </details>

        <details class="user-guide-item">
          <summary>2. First-time Garage setup</summary>
          <div class="user-guide-body">
            <ol>
              <li>Open <strong>Settings → My Garage</strong>.</li>
              <li>Use the existing Bike or Car profile, or tap <strong>+ ADD VEHICLE</strong>.</li>
              <li>Choose Bike or Car and enter a profile name.</li>
              <li>Add the vehicle model and registration number.</li>
              <li>Select a dashboard theme from Settings.</li>
              <li>Set the current odometer when prompted or from the odometer section.</li>
            </ol>
            <div class="user-guide-tip">Each Garage vehicle keeps separate registration, model, theme, odometer, fuel history and MasterDB identity.</div>
          </div>
        </details>

        <details class="user-guide-item">
          <summary>3. Add a refuel</summary>
          <div class="user-guide-body">
            <ol>
              <li>Select the correct vehicle from the Garage selector at the top.</li>
              <li>Under <strong>ADD REFUEL</strong>, enter Date &amp; Time and Odometer.</li>
              <li>Select the fuel station.</li>
              <li>Enter litres and total cost.</li>
              <li>Select SGD or MYR. For MYR, confirm the SGD/MYR exchange rate.</li>
              <li>Choose the fuel grade if known, add optional notes, then tap <strong>SAVE REFUEL</strong>.</li>
            </ol>
            <div class="user-guide-tip">The dashboard and Refuel History update from the active vehicle only.</div>
          </div>
        </details>

        <details class="user-guide-item">
          <summary>4. Read the dashboard</summary>
          <div class="user-guide-body">
            <ul>
              <li><strong>Efficiency</strong> shows mileage and fuel-economy information.</li>
              <li><strong>Spending</strong> shows fuel spend, including SGD and MYR comparison.</li>
              <li>Use <strong>14 Days, Monthly, Yearly or All Time</strong> to change the reporting period.</li>
              <li>When Monthly is selected, use the month arrows or swipe to review another month.</li>
              <li><strong>View Details</strong> under Data Health shows record count, latest record, duplicates and odometer sequence issues.</li>
            </ul>
          </div>
        </details>

        <details class="user-guide-item">
          <summary>5. MasterDB backup</summary>
          <div class="user-guide-body">
            <ol>
              <li>Select the vehicle you want to back up.</li>
              <li>Go to <strong>Settings → Master Database</strong>.</li>
              <li>Tap <strong>EXPORT DB</strong>.</li>
              <li>Save the JSON file somewhere backed up, such as iCloud Drive, Google Drive, OneDrive, NAS or a computer.</li>
              <li>Repeat for every Garage vehicle.</li>
            </ol>
            <div class="user-guide-tip">Recommended routine: export a fresh MasterDB after important data changes and periodically as a rollback copy.</div>
          </div>
        </details>

        <details class="user-guide-item">
          <summary>6. Restore or import a MasterDB</summary>
          <div class="user-guide-body">
            <ol>
              <li>Select the Garage vehicle that should receive the database.</li>
              <li>Go to <strong>Settings → Master Database → IMPORT DB</strong>.</li>
              <li>Select the correct JSON MasterDB file.</li>
              <li>Review the record count shown in the confirmation.</li>
              <li>Confirm only if the selected vehicle and file are correct.</li>
            </ol>
            <div class="user-guide-warn">IMPORT DB replaces the working records of the active vehicle only. Export the current database first if you may need to roll back.</div>
          </div>
        </details>

        <details class="user-guide-item">
          <summary>7. Moving to a new phone or reinstalling</summary>
          <div class="user-guide-body">
            <ol>
              <li>Before removing the old installation, export the MasterDB for every vehicle.</li>
              <li>Install Fuel Tracker on the new device using Safari → Add to Home Screen.</li>
              <li>Create/select the corresponding vehicle profile.</li>
              <li>Import that vehicle's MasterDB JSON file.</li>
              <li>Repeat for the remaining Garage vehicles.</li>
            </ol>
            <div class="user-guide-warn">Clearing Safari website data or deleting browser storage can remove the local working copy. Keep exported MasterDB files as your recovery backups.</div>
          </div>
        </details>

        <details class="user-guide-item">
          <summary>8. Safe everyday workflow</summary>
          <div class="user-guide-body">
            <ol>
              <li>Select the correct Garage vehicle.</li>
              <li>Add refuels normally.</li>
              <li>Check Data Health occasionally.</li>
              <li>Export each vehicle's MasterDB periodically.</li>
              <li>Keep older dated backups when making major changes.</li>
            </ol>
            <div class="user-guide-tip">Simple rule: local copy for daily use, exported MasterDB for recovery.</div>
          </div>
        </details>
      </div>`;

    settings.appendChild(card);
    card.querySelector('#openFirstGuide')?.addEventListener('click',()=>{
      const first=card.querySelector('#guideInstall');
      first.open=true;
      first.scrollIntoView({behavior:'smooth',block:'center'});
    });
  }

  installStyles();
  buildGuide();
  const brand=document.querySelector('.brand small');
  if(brand && brand.textContent.includes('v15.2')) brand.textContent='v15.2 Garage';
  state.userGuideRevision=REV;
  saveState?.();
})();