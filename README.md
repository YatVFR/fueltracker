# Fuel Tracker

Active validation version: **v16.3.8 iCloud Backup Target**

Current approved stable rollback baseline: **v15.8 Garage**

## Release status
- **v16.2 Smart Inbox remains rolled back** due to startup/loading instability.
- v16.1 Smart Stations remains the active automation feature line.
- v16.3 introduced per-vehicle Garage Maintenance.
- v16.3.4 added Vendor/Workshop, REVIEW/VERIFIED handling and a separate Upgrades & Accessories section.
- v16.3.5 added Maintenance vs Upgrade/Accessory record type selection and reclassification.
- v16.3.6 hardened Whole Garage backup schema and restore normalization.
- v16.3.7 fixed export feedback, restore verification auditing, current MasterDB version metadata, and Browser vs Home Screen Web App local-data context identification.
- **v16.3.8 adds the preferred iCloud Drive Garage backup destination: iCloud Drive → Apps → GitHub → Fuel_Tracker.**
- The top-left app label is a release requirement and must be updated with every app change.
- Active validation PWA cache: `fueltracker-v16-3-8-icloud-backup-target-1`

## v16.3.8 — iCloud Backup Target
- Settings → Whole Garage Backup shows the preferred iCloud path.
- **SAVE LATEST TO ICLOUD** creates `FuelTracker-Garage-Latest.json`.
- **SAVE DATED ARCHIVE** creates a timestamped Garage JSON backup.
- On supported iPhone/PWA environments, export uses the native Share Sheet so the file can be saved to the preferred iCloud folder.
- The preferred backup target is recorded inside Garage state and backup metadata.
- Whole Garage remains the portability mechanism between Browser and installed Web App local stores.
- iOS still requires the user to confirm the Save to Files/Share Sheet destination; a browser/PWA cannot silently write to an arbitrary iCloud Drive folder in the background.

## v16.3.7 — Backup & Context
- Whole Garage export uses the iOS Share Sheet when available; browser downloads show a clear download-started confirmation and filename.
- Whole Garage restore validates Vehicles, Fuel Records, Maintenance, Upgrades, REVIEW, VERIFIED and Vehicle Photo counts before replacing local state.
- A post-reload restore audit confirms REVIEW/VERIFIED counts were restored correctly.
- Per-vehicle MasterDB exports identify the current format instead of legacy v15.x metadata.
- Settings shows the active local data context: **Web App Local Store** or **Browser Local Store**.

## Maintenance data model
Each Garage profile can store Maintenance and Upgrade/Accessory records with `recordType`, category, Vendor/Workshop, description, cost/currency, historical MYR FX rate, odometer, notes, REVIEW/VERIFIED state, imported-source metadata and timestamps.

Whole Garage Backup includes maintenance, upgrades/accessories, verification states, source metadata, vehicle photos, fuel records, vehicle profiles and Garage metadata.

## v16.1 — Smart Station Recognition
- Saved petrol stations learn from explicit confirmations.
- User confirmation remains mandatory before dwell timing begins.
- No automatic fuel record creation.

### Important iPhone limitations
The GitHub Pages PWA cannot reliably monitor geolocation while suspended or fully closed. It also cannot silently retain unrestricted background file-system access to an arbitrary iCloud Drive directory. Native iOS capabilities would be required for fully automatic iCloud/CloudKit synchronization and closed-app geofencing.

## Stable baseline retained from v15.8
- Dashboard / Refuel / Settings navigation foundation
- Fuel Age header metric
- Garage Overview and Garage Analytics
- Current Odometer and Current Tank calculations
- Per-vehicle MasterDB
- Whole Garage backup/recovery
- iOS Share Sheet export compatibility
- Local-first PWA storage
- Mobile-safe iPhone layout

Live app: https://yatvfr.github.io/fueltracker/

v15.8 remains the approved stable rollback point while v16.x features undergo validation.
