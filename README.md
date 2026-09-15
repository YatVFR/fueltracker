# Fuel Tracker

Active validation version: **v16.4.2 Data Sanitization DEV**

Current approved production rollback baseline: **v16.3.8 iCloud Backup Target**  
Pre-onboarding DEV checkpoint: **checkpoint/v16.4.0-pre-onboarding**  
Pre-sanitization DEV checkpoint: **checkpoint/v16.4.1-pre-sanitize**

## Current DEV release
### v16.4.2 — Data Sanitization
- Removed hard-coded demo refuel records, demo odometers and preset registrations from the default application state.
- Removed bundled compressed Bike/Car MasterDB payloads from source code. Fresh installs no longer ingest source-coded fuel history.
- Removed hard-coded vehicle-specific maintenance/accessory seed history and source-specific maintenance classification rules.
- Fresh installs now start with empty Bike and Car fuel histories, empty registrations and unset odometers, then use Guided Setup to collect user data.
- Existing browser/PWA local data is **not deleted** by this update. User-created records remain local unless the user explicitly clears or replaces them.
- A compatibility stub remains for older startup/schema code, but it contains no records, odometers, registrations, locations or other user data.
- DEV PWA caching is now environment-specific and cleans older DEV Smart Capture/onboarding caches without deleting UAT/PROD caches.
- Active DEV PWA cache: `fueltracker-dev-v16-4-2-data-sanitization-1`.

### v16.4.1 — Guided Setup & Station Reliability included
- First-run startup collects vehicle type, registration, vehicle name/model, current odometer, default currency, Auto Detect preference and preferred iCloud backup folder.
- App Tour walks through Garage, Dashboard, Refuel/Smart Scan, Auto Detect and Settings/Backups.
- Setup and tour can be re-run from Settings.
- Preferred iCloud path defaults to `Apps/GitHub/Fuel_Tracker` and can be changed by the user.
- iPhone/iPad still requires the user to confirm the actual Save to Files / Share Sheet destination; a PWA cannot silently write to an arbitrary iCloud folder.
- Petrol-station Auto Detect includes foreground GPS heartbeat, resume/restart handling, automatic dwell start for one unambiguous **saved** station, and Detection Health diagnostics.

### v16.4.0 — Smart Refuel Capture included
- Scan pump/receipt images to prefill amount, litres, unit price and recognized station where possible.
- Scan onboard display images to prefill total odometer and retain optional trip/economy values.
- Discount handling supports fixed amount, sen/cents per litre, percentage or no discount.
- Existing `cost` remains the actual amount paid for dashboard compatibility.
- Per-vehicle MasterDB schema 3 preserves Smart Capture metadata during export/import.
- Refuel History can be collapsed for long displays.
- Scan images are not stored in MasterDB; only extracted values are retained.

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
- **SAVE LATEST TO ICLOUD** creates `FuelTracker-Garage-Latest.json`.
- **SAVE DATED ARCHIVE** creates a timestamped Garage JSON backup.
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
- Native iOS capabilities would be required for true closed-app geofencing and silent iCloud/CloudKit synchronization.

Production: https://yatvfr.github.io/fueltracker/  
DEV validation: https://yatvfr.github.io/fueltracker/dev/

v16.3.8 remains the approved production rollback point while v16.4.x is validated in DEV.