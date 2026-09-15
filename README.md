# Fuel Tracker

Active validation version: **v16.4.1 Guided Setup & Station Reliability DEV**

Current approved stable rollback baseline: **v16.3.8 iCloud Backup Target**  
Pre-onboarding DEV checkpoint: **checkpoint/v16.4.0-pre-onboarding**

## Release status
- **v16.4.1 DEV adds first-run Guided Setup and App Tour.**
- Startup collects vehicle type, registration, vehicle name/model, current odometer, preferred currency and preferred iCloud backup folder.
- The preferred iCloud folder is remembered, but iPhone/iPad users still confirm the real destination through Share/Save to Files.
- Settings can re-run the startup setup and tour.
- Petrol-station detection gains a reliability layer with foreground GPS heartbeat, resume/restart handling and live diagnostics.
- One unambiguous **saved** station can start dwell detection automatically; multiple nearby saved stations still require user selection.
- Detection Health now shows GPS accuracy, last fix age, nearest saved station and whether station geofences exist.
- **v16.4.0 Smart Refuel Capture** remains included: pump/receipt scan, odometer scan, discount handling and grouped refuel history.
- Smart Capture metadata survives per-vehicle MasterDB schema 3 export/import.
- v16.3.8 remains the approved production rollback baseline while v16.4.x is validated in DEV.
- **v16.2 Smart Inbox remains rolled back** due to startup/loading instability.
- The top-left app label is a release requirement and must be updated with every app change.
- Active DEV PWA cache: `fueltracker-v16-4-1-guided-setup-station-reliability-dev-1`

## v16.4.1 — Guided Setup & Station Reliability DEV
### First-run setup
- Vehicle type: Bike / Car.
- Registration, vehicle name and make/model.
- Current odometer.
- Default currency: SGD / MYR.
- Preferred iCloud backup path, defaulting to `Apps/GitHub/Fuel_Tracker`.
- Setup details remain local to Fuel Tracker unless included in an exported backup.

### App tour
- Garage selector.
- Fuel dashboard.
- Add Refuel and Smart Scan.
- Auto Detect.
- Settings and backups.
- Tour/startup setup can be restarted from Settings.

### Petrol-station reliability
Auto Detect is a foreground geofence feature. It does **not** identify arbitrary petrol stations from the internet. A location must first exist in Fuel Tracker's saved-station list.

Improvements in v16.4.1:
- Extra foreground location heartbeat while Fuel Tracker is visible.
- Detection restarts after focus, page-show and return from app suspension.
- A single unambiguous saved station can auto-start dwell tracking after stable location fixes.
- If multiple saved stations overlap, Fuel Tracker keeps the station-selection prompt.
- Detection Health reports permission/location errors, GPS accuracy and nearest saved station distance.
- `TEST LOCATION NOW` and `RESTART DETECTION` controls are available in Settings.

### Why a five-minute stop may previously have produced nothing
The older flow required all of the following:
1. Detection enabled.
2. The petrol station already saved as a Fuel Tracker geofence.
3. Fuel Tracker remaining active enough for iOS to provide location updates.
4. The user confirming the station **before** the dwell timer began.

v16.4.1 removes the confirmation-before-timer requirement when only one saved station is clearly matched.

## v16.4.0 — Smart Refuel Capture DEV
- **SCAN PUMP / RECEIPT** attempts to identify amount, litres and unit price.
- Pump parsing validates `litres × unit price ≈ amount` to reduce OCR mistakes.
- **SCAN ODOMETER** prefills total odometer and can retain Trip Current / onboard economy as supporting metadata.
- Discounts support fixed amount, sen/cents per litre, percentage or no discount.
- Existing `cost` continues to mean actual final amount paid.
- Optional fields include `pumpAmount`, `unitPrice`, discount metadata, `netPaid`, `effectiveUnitPrice`, trip meter and onboard consumption.
- Scan photos are not stored in the MasterDB; only extracted values are retained.
- Refuel History can be collapsed for long displays.
- Planned follow-up: learned per-vehicle odometer display profiles.

## iCloud backup behavior
- Default preferred location: **iCloud Drive → Apps → GitHub → Fuel_Tracker**.
- The user may enter a different preferred iCloud path during setup or in Settings.
- **SAVE LATEST TO ICLOUD** creates `FuelTracker-Garage-Latest.json`.
- **SAVE DATED ARCHIVE** creates a timestamped Garage JSON backup.
- iOS browsers/PWAs cannot silently retain unrestricted write access to arbitrary iCloud folders; the user confirms the Save to Files/Share destination.

## Maintenance data model
Existing Garage Maintenance and Upgrade/Accessory records remain unchanged and are not part of the v16.4.1 feature scope.

## Important iPhone limitations
- Geolocation cannot be relied on while the PWA is suspended or fully closed.
- v16.4.1 improves foreground/resume reliability but is not native background geofencing.
- Browser-side OCR needs network access the first time the OCR engine/language data is loaded.
- Native iOS capabilities would be required for true closed-app geofencing and silent iCloud/CloudKit synchronization.

## Stable baseline retained from v16.3.8
- Dashboard / Refuel / Settings navigation foundation
- Fuel Age header metric
- Garage Overview and Garage Analytics
- Current Odometer and Current Tank calculations
- Per-vehicle MasterDB
- Whole Garage backup/recovery
- Existing Garage Maintenance and Upgrades/Accessories records
- iOS Share Sheet export compatibility
- Local-first PWA storage
- Mobile-safe iPhone layout

Production app: https://yatvfr.github.io/fueltracker/  
DEV validation: https://yatvfr.github.io/fueltracker/dev/

v16.3.8 remains the approved production rollback point while v16.4.x undergoes DEV validation.
