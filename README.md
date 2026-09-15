# Fuel Tracker

Active validation version: **v16.4.1 Guided Setup & Station Reliability DEV**

Current approved production rollback baseline: **v16.3.8 iCloud Backup Target**  
Pre-onboarding DEV checkpoint: **checkpoint/v16.4.0-pre-onboarding**

## Current DEV release
### v16.4.1 — Guided Setup & Station Reliability
- First-run startup collects vehicle type, registration, vehicle name/model, current odometer, default currency, Auto Detect preference and preferred iCloud backup folder.
- App Tour walks through Garage, Dashboard, Refuel/Smart Scan, Auto Detect and Settings/Backups.
- Setup and tour can be re-run from Settings.
- Preferred iCloud path defaults to `Apps/GitHub/Fuel_Tracker` and can be changed by the user.
- iPhone/iPad still requires the user to confirm the actual Save to Files / Share Sheet destination; a PWA cannot silently write to an arbitrary iCloud folder.
- Petrol-station Auto Detect gets foreground GPS heartbeat, resume/restart handling, automatic dwell start for one unambiguous **saved** station, and Detection Health diagnostics.
- Detection Health reports permission/location errors, GPS accuracy, last fix age, nearest saved station and saved-geofence count.
- Multiple overlapping saved stations still require user selection.
- Active DEV PWA cache: `fueltracker-v16-4-1-guided-setup-station-reliability-dev-3`.

### v16.4.0 — Smart Refuel Capture included
- Scan pump/receipt images to prefill amount, litres, unit price and recognized station where possible.
- Scan onboard display images to prefill total odometer and retain optional trip/economy values.
- Discount handling supports fixed amount, sen/cents per litre, percentage or no discount.
- Existing `cost` remains the actual amount paid for dashboard compatibility.
- Per-vehicle MasterDB schema 3 preserves Smart Capture metadata during export/import.
- Refuel History can be collapsed for long displays.
- Scan images are not stored in MasterDB; only extracted values are retained.

## Petrol-station Auto Detect behavior
The previous implementation only monitored stations already saved as Fuel Tracker geofences and required the user to confirm the station **before** the dwell timer began. That explains why a five-minute stop could produce no result if the station was not saved, the confirmation was missed, or iOS paused location updates.

v16.4.1 changes this behavior:
1. Detection must be enabled.
2. The station must still be saved once as a geofence.
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
- Existing Maintenance and Upgrade/Accessory records
- Smart Refuel Capture and discount metadata
- iOS Share Sheet export compatibility
- Local-first PWA storage
- Mobile-safe iPhone layout

## Important iPhone limitations
- Geolocation may pause when the PWA is suspended or fully closed.
- v16.4.1 improves foreground/resume reliability but is not native background geofencing.
- Browser-side OCR needs network access the first time the OCR engine/language data is loaded.
- Native iOS capabilities would be required for true closed-app geofencing and silent iCloud/CloudKit synchronization.

Production: https://yatvfr.github.io/fueltracker/  
DEV validation: https://yatvfr.github.io/fueltracker/dev/

v16.3.8 remains the approved production rollback point while v16.4.x is validated in DEV.
