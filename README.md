# Fuel Tracker

Active validation version: **v16.4.4 Collapsible Sections DEV**

Current approved production rollback baseline: **v16.3.8 iCloud Backup Target**  
Pre-onboarding DEV checkpoint: **checkpoint/v16.4.0-pre-onboarding**  
Pre-sanitization DEV checkpoint: **checkpoint/v16.4.1-pre-sanitize**  
Pre-floating-menu DEV checkpoint: **checkpoint/v16.4.2-pre-floating-menu**  
Pre-collapsible-sections DEV checkpoint: **checkpoint/v16.4.3-pre-collapsible-sections**

## Current DEV release
### v16.4.4 — Collapsible Sections
- Major Dashboard sections can be expanded/collapsed individually.
- Add Refuel and Refuel History cards can be expanded/collapsed independently.
- Settings cards can be expanded/collapsed independently.
- Dynamically generated Garage Analytics / Garage Overview / Maintenance sections are supported.
- A compact **Collapse all / Expand all** control applies only to the currently active page.
- Each section remembers its collapsed state in local browser/PWA storage.
- Collapsing UI sections does not modify Fuel Tracker records, MasterDB schema or backup data.
- Floating bottom navigation from v16.4.3 remains unchanged.
- Active DEV PWA cache: `fueltracker-dev-v16-4-4-collapsible-sections-1`.

### v16.4.3 — Floating Bottom Menu included
- Dashboard / Refuel / Maintenance / Settings navigation floats at the bottom of the app.
- iPhone safe-area spacing keeps navigation above the Home indicator.
- Active page remains highlighted using the current vehicle theme.

### v16.4.2 — Data Sanitization included
- Removed hard-coded demo refuel records, demo odometers and preset registrations from the default application state.
- Removed bundled compressed Bike/Car MasterDB payloads and vehicle-specific maintenance seed history from source.
- Fresh installs start with empty histories and use Guided Setup to collect user data.
- Existing browser/PWA local data is not deleted by source sanitization.

### v16.4.1 — Guided Setup & Station Reliability included
- First-run setup collects vehicle basics, current odometer, default currency, Auto Detect preference and preferred iCloud backup folder.
- App Tour can be rerun from Settings.
- Auto Detect includes foreground GPS heartbeat, resume/restart handling and Detection Health diagnostics.

### v16.4.0 — Smart Refuel Capture included
- Scan pump/receipt images to prefill amount, litres, unit price and recognized station where possible.
- Scan onboard display images to prefill total odometer and retain optional trip/economy values.
- Discount handling supports fixed amount, sen/cents per litre, percentage or no discount.
- Existing `cost` remains the actual amount paid for dashboard compatibility.
- Per-vehicle MasterDB schema 3 preserves Smart Capture metadata during export/import.

## Petrol-station Auto Detect behavior
1. Detection must be enabled.
2. The station must be saved once as a geofence.
3. Fuel Tracker must remain active enough for iOS to provide location updates.
4. When one saved station is clearly matched, the dwell timer can start automatically after stable GPS fixes.
5. If several saved stations overlap, Fuel Tracker asks the user to choose.
6. Settings provides **TEST LOCATION NOW** and **RESTART DETECTION** controls.

This remains foreground geofencing. It does not discover arbitrary petrol stations from the internet, and it cannot guarantee closed-app/background detection on iOS.

## iCloud backup behavior
- Default preferred location: **iCloud Drive → Apps → GitHub → Fuel_Tracker**.
- The preferred path can be changed during startup or in Settings.
- Whole Garage backup remains the main portability method between browser/PWA local stores.

## Existing stable capabilities retained
- Dashboard / Refuel / Maintenance / Settings navigation
- Mileage, efficiency and spending analytics
- Per-vehicle Garage profiles and MasterDB
- Whole Garage backup/restore
- User-created Maintenance and Upgrade/Accessory records
- Smart Refuel Capture and discount metadata
- iOS Share Sheet export compatibility
- Local-first PWA storage
- Mobile-safe iPhone layout

## Important data and iPhone notes
- Source sanitization does not erase records already stored in a browser/PWA local store.
- Git commit history from before v16.4.2 still contains historical source snapshots unless repository history is explicitly rewritten.
- Geolocation may pause when the PWA is suspended or fully closed.
- Browser-side OCR needs network access the first time the OCR engine/language data is loaded.

Production: https://yatvfr.github.io/fueltracker/  
DEV validation: https://yatvfr.github.io/fueltracker/dev/

v16.3.8 remains the approved production rollback point while v16.4.x is validated in DEV.