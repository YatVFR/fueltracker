(() => {
  'use strict';
  if (window.__fuelDashboardV12Loaded) return;
  window.__fuelDashboardV12Loaded = true;

  const STORAGE_KEY_FALLBACK = 'fuelTrackerData';
  const state = { view: 'efficiency', lastRefresh: null };
  const $ = (id) => document.getElementById(id);

  function storageKey() {
    return typeof window.STORAGE_KEY === 'string' ? window.STORAGE_KEY : STORAGE_KEY_FALLBACK;
  }

  function safeLoadData() {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return { data: [], parseError: null, raw: '' };
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return { data: [], parseError: 'Stored database is not an array.', raw };
      return { data: parsed, parseError: null, raw };
    } catch (error) {
      return { data: [], parseError: 'Stored database contains invalid JSON.', raw };
    }
  }

  function validDate(value) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function fingerprint(entry) {
    return [
      entry?.dateTime || '',
      Number(entry?.mileage) || 0,
      Number(entry?.volume) || 0,
      Number(entry?.cost) || 0,
      String(entry?.currency || '').toUpperCase(),
      String(entry?.location || '').trim().toLowerCase()
    ].join('|');
  }

  function validateIntegrity(data, parseError) {
    const issues = [];
    if (parseError) issues.push({ type: 'error', text: parseError });

    const seen = new Map();
    let duplicates = 0;
    let invalidRecords = 0;
    let currencyWarnings = 0;

    data.forEach((entry, index) => {
      const date = validDate(entry?.dateTime);
      const mileage = Number(entry?.mileage);
      const volume = Number(entry?.volume);
      const cost = Number(entry?.cost);
      const currency = String(entry?.currency || '').toUpperCase();
      const location = String(entry?.location || '').trim();
      const requiredInvalid = !date || !Number.isFinite(mileage) || mileage < 0 || !Number.isFinite(volume) || volume <= 0 || !Number.isFinite(cost) || cost < 0 || !location;
      if (requiredInvalid) invalidRecords++;
      if (currency && !['SGD', 'MYR'].includes(currency)) currencyWarnings++;

      const fp = fingerprint(entry);
      const previous = seen.get(fp);
      if (previous !== undefined) duplicates++;
      else seen.set(fp, index);
    });

    const chronological = data
      .map((entry, index) => ({ entry, index, date: validDate(entry?.dateTime), mileage: Number(entry?.mileage) }))
      .filter(item => item.date && Number.isFinite(item.mileage) && item.mileage >= 0)
      .sort((a, b) => a.date - b.date);

    let odoRegressions = 0;
    for (let i = 1; i < chronological.length; i++) {
      if (chronological[i].mileage < chronological[i - 1].mileage) odoRegressions++;
    }

    if (duplicates) issues.push({ type: 'warn', text: `${duplicates} possible duplicate ${duplicates === 1 ? 'record' : 'records'}` });
    if (invalidRecords) issues.push({ type: 'error', text: `${invalidRecords} ${invalidRecords === 1 ? 'record has' : 'records have'} missing or invalid required data` });
    if (odoRegressions) issues.push({ type: 'warn', text: `${odoRegressions} odometer sequence ${odoRegressions === 1 ? 'regression' : 'regressions'}` });
    if (currencyWarnings) issues.push({ type: 'warn', text: `${currencyWarnings} unsupported currency ${currencyWarnings === 1 ? 'value' : 'values'}` });

    const latest = data
      .map(entry => ({ entry, date: validDate(entry?.dateTime) }))
      .filter(item => item.date)
      .sort((a, b) => b.date - a.date)[0] || null;

    const level = parseError || invalidRecords ? 'error' : (duplicates || odoRegressions || currencyWarnings ? 'warn' : 'healthy');
    return { level, issues, duplicates, invalidRecords, odoRegressions, currencyWarnings, latest, count: data.length };
  }

  function formatDate(date) {
    if (!date) return 'No valid data yet';
    return date.toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function buildUI() {
    const mileageTabs = $('mileageTabs');
    const spendingTabs = $('spendingTabs');
    if (!mileageTabs || !spendingTabs) return null;

    const mileagePanel = mileageTabs.closest('.period-panel');
    const spendingPanel = spendingTabs.closest('.period-panel');
    if (!mileagePanel || !spendingPanel || mileagePanel.dataset.v12Wrapped) return null;

    mileagePanel.dataset.v12Wrapped = 'true';
    spendingPanel.dataset.v12Wrapped = 'true';

    const spendingSeparator = Array.from(document.querySelectorAll('.section-separator'))
      .find(el => el.textContent.trim().toLowerCase() === 'fuel spending');
    if (spendingSeparator) spendingSeparator.hidden = true;

    const frame = document.createElement('section');
    frame.className = 'unified-dashboard-frame';
    frame.setAttribute('aria-label', 'Fuel dashboard');
    frame.innerHTML = `
      <div class="unified-dashboard-head">
        <div class="dashboard-switch" role="tablist" aria-label="Dashboard view">
          <button type="button" class="dashboard-switch-btn active" data-dashboard-view="efficiency" role="tab" aria-selected="true">⛽ Efficiency</button>
          <button type="button" class="dashboard-switch-btn" data-dashboard-view="spending" role="tab" aria-selected="false">💰 Spending</button>
        </div>
        <button type="button" class="dashboard-refresh-btn" id="dashboardRefreshBtn" aria-label="Refresh dashboard and check data">↻ <span>Refresh</span></button>
      </div>
      <div class="dashboard-common-tabs" id="dashboardCommonTabs" aria-label="Dashboard timeframe">
        <button type="button" class="dashboard-common-tab active" data-common-period="14">14 Days</button>
        <button type="button" class="dashboard-common-tab" data-common-period="month">Monthly</button>
        <button type="button" class="dashboard-common-tab" data-common-period="year">Yearly</button>
        <button type="button" class="dashboard-common-tab" data-common-period="all">All Time</button>
      </div>
      <div class="dashboard-health-strip" id="dashboardHealthStrip" aria-live="polite">
        <span class="health-dot"></span>
        <span class="health-text">Checking data…</span>
        <span class="health-latest"></span>
      </div>
      <div class="dashboard-view-stage" id="dashboardViewStage"></div>
      <div class="dashboard-view-dots" aria-hidden="true"><span class="active"></span><span></span></div>
    `;

    mileagePanel.parentNode.insertBefore(frame, mileagePanel);
    const stage = frame.querySelector('#dashboardViewStage');

    const efficiencyView = document.createElement('div');
    efficiencyView.className = 'dashboard-view active';
    efficiencyView.dataset.view = 'efficiency';
    const spendingView = document.createElement('div');
    spendingView.className = 'dashboard-view';
    spendingView.dataset.view = 'spending';

    stage.append(efficiencyView, spendingView);
    efficiencyView.appendChild(mileagePanel);
    spendingView.appendChild(spendingPanel);

    mileageTabs.classList.add('v12-hidden-tabs');
    spendingTabs.classList.add('v12-hidden-tabs');

    const details = document.createElement('div');
    details.className = 'dashboard-health-details';
    details.id = 'dashboardHealthDetails';
    details.hidden = true;
    details.innerHTML = `
      <div class="health-detail-grid">
        <div><span>Records</span><strong id="healthRecordCount">0</strong></div>
        <div><span>Latest ingested</span><strong id="healthLatestIngested">—</strong></div>
        <div><span>Latest odometer</span><strong id="healthLatestOdo">—</strong></div>
        <div><span>Last UI refresh</span><strong id="healthLastRefresh">—</strong></div>
      </div>
      <div class="health-issues" id="healthIssues"></div>
    `;
    frame.querySelector('#dashboardHealthStrip').insertAdjacentElement('afterend', details);
    frame.querySelector('#dashboardHealthStrip').setAttribute('role', 'button');
    frame.querySelector('#dashboardHealthStrip').setAttribute('tabindex', '0');
    frame.querySelector('#dashboardHealthStrip').setAttribute('aria-expanded', 'false');

    return { frame, mileageTabs, spendingTabs, mileagePanel, spendingPanel };
  }

  function setView(view) {
    state.view = view;
    document.querySelectorAll('.dashboard-switch-btn').forEach(btn => {
      const active = btn.dataset.dashboardView === view;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    document.querySelectorAll('.dashboard-view').forEach(panel => panel.classList.toggle('active', panel.dataset.view === view));
    const dots = document.querySelectorAll('.dashboard-view-dots span');
    dots.forEach((dot, index) => dot.classList.toggle('active', (view === 'efficiency' ? 0 : 1) === index));
  }

  function setCommonPeriod(period) {
    document.querySelectorAll('.dashboard-common-tab').forEach(btn => btn.classList.toggle('active', btn.dataset.commonPeriod === period));
    const mileageButton = document.querySelector(`[data-mileage-period="${period}"]`);
    const spendingButton = document.querySelector(`[data-spending-period="${period}"]`);
    if (mileageButton) mileageButton.click();
    if (spendingButton) spendingButton.click();
  }

  function updateHealthUI(result) {
    const strip = $('dashboardHealthStrip');
    if (!strip) return;
    strip.classList.remove('healthy', 'warn', 'error', 'checking');
    strip.classList.add(result.level);
    const label = result.level === 'healthy' ? 'Data healthy' : result.level === 'warn' ? 'Review data' : 'Data integrity issue';
    strip.querySelector('.health-text').textContent = label;
    strip.querySelector('.health-latest').textContent = result.latest ? `Latest: ${formatDate(result.latest.date)}` : 'No ingested records';

    $('healthRecordCount').textContent = String(result.count);
    $('healthLatestIngested').textContent = result.latest ? formatDate(result.latest.date) : '—';
    const latestOdo = result.latest ? Number(result.latest.entry?.mileage) : NaN;
    $('healthLatestOdo').textContent = Number.isFinite(latestOdo) ? `${latestOdo.toLocaleString()} km` : '—';
    $('healthLastRefresh').textContent = state.lastRefresh ? formatDate(state.lastRefresh) : '—';

    const issues = $('healthIssues');
    if (result.issues.length) {
      issues.innerHTML = result.issues.map(issue => `<div class="health-issue ${issue.type}">${issue.type === 'error' ? '⚠' : '•'} ${escapeHtml(issue.text)}</div>`).join('');
    } else {
      issues.innerHTML = '<div class="health-issue ok">✓ No duplicate, required-field, currency or odometer-sequence issues detected.</div>';
    }

    const existingPanel = $('dataStatusPanel');
    if (existingPanel && !$('dataIntegrityStatus')) {
      const item = document.createElement('div');
      item.className = 'data-status-item';
      item.innerHTML = '<div class="data-status-label">Integrity</div><div class="data-status-value" id="dataIntegrityStatus">—</div>';
      const grid = existingPanel.querySelector('.data-status-grid');
      if (grid) grid.appendChild(item);
    }
    const integrity = $('dataIntegrityStatus');
    if (integrity) {
      integrity.textContent = label;
      integrity.classList.toggle('warn', result.level !== 'healthy');
    }
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch]));
  }

  async function refreshDashboard() {
    const button = $('dashboardRefreshBtn');
    const strip = $('dashboardHealthStrip');
    if (button) {
      button.disabled = true;
      button.classList.add('refreshing');
      button.querySelector('span').textContent = 'Checking…';
    }
    if (strip) {
      strip.classList.remove('healthy', 'warn', 'error');
      strip.classList.add('checking');
      strip.querySelector('.health-text').textContent = 'Refreshing UI & validating data…';
    }

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) await registration.update().catch(() => {});
      }
      const loaded = safeLoadData();
      const result = validateIntegrity(loaded.data, loaded.parseError);
      state.lastRefresh = new Date();

      if (typeof window.displayEntries === 'function') window.displayEntries();
      else if (typeof window.computeStats === 'function') window.computeStats(loaded.data);

      updateHealthUI(result);
      if (button) button.querySelector('span').textContent = result.level === 'healthy' ? 'Updated' : 'Review Data';
      window.setTimeout(() => {
        if (!button) return;
        button.disabled = false;
        button.classList.remove('refreshing');
        button.querySelector('span').textContent = 'Refresh';
      }, 1200);
    } catch (error) {
      state.lastRefresh = new Date();
      updateHealthUI({ level: 'error', issues: [{ type: 'error', text: 'Refresh failed. Reload the app and try again.' }], latest: null, count: 0 });
      if (button) {
        button.disabled = false;
        button.classList.remove('refreshing');
        button.querySelector('span').textContent = 'Retry';
      }
    }
  }

  function attachInteractions() {
    document.querySelectorAll('.dashboard-switch-btn').forEach(btn => btn.addEventListener('click', () => setView(btn.dataset.dashboardView)));
    document.querySelectorAll('.dashboard-common-tab').forEach(btn => btn.addEventListener('click', () => setCommonPeriod(btn.dataset.commonPeriod)));
    $('dashboardRefreshBtn')?.addEventListener('click', refreshDashboard);

    const healthStrip = $('dashboardHealthStrip');
    const toggleDetails = () => {
      const details = $('dashboardHealthDetails');
      if (!details) return;
      details.hidden = !details.hidden;
      healthStrip?.setAttribute('aria-expanded', details.hidden ? 'false' : 'true');
    };
    healthStrip?.addEventListener('click', toggleDetails);
    healthStrip?.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleDetails();
      }
    });

    const stage = $('dashboardViewStage');
    let startX = null;
    stage?.addEventListener('touchstart', event => { startX = event.changedTouches?.[0]?.clientX ?? null; }, { passive: true });
    stage?.addEventListener('touchend', event => {
      if (startX === null) return;
      const endX = event.changedTouches?.[0]?.clientX ?? startX;
      const dx = endX - startX;
      startX = null;
      if (Math.abs(dx) < 55) return;
      if (dx < 0 && state.view === 'efficiency') setView('spending');
      else if (dx > 0 && state.view === 'spending') setView('efficiency');
    }, { passive: true });

    window.addEventListener('storage', event => {
      if (event.key === storageKey()) refreshDashboard();
    });
  }

  function init() {
    const ui = buildUI();
    if (!ui) return;
    attachInteractions();
    setView('efficiency');
    setCommonPeriod('14');
    const loaded = safeLoadData();
    state.lastRefresh = new Date();
    updateHealthUI(validateIntegrity(loaded.data, loaded.parseError));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
