# Fuel Tracker

Active validation version: **v16.3.7 Backup & Context**

Current approved stable rollback baseline: **v15.8 Garage**

## Release status
- **v16.2 Smart Inbox remains rolled back** due to startup/loading instability.
- v16.1 Smart Stations remains the active automation feature line.
- v16.3 introduced per-vehicle Garage Maintenance.
- v16.3.4 added Vendor/Workshop, REVIEW/VERIFIED handling and a separate Upgrades & Accessories section.
- v16.3.5 added Maintenance vs Upgrade/Accessory record type selection and reclassification.
- v16.3.6 hardened Whole Garage backup schema and restore normalization.
- **v16.3.7 fixes export feedback, restore verification auditing, current MasterDB version metadata, and identifies Browser vs Home Screen Web App local data contexts.**
- The top-left app label is a release requirement and must be updated with every app change.
- Active validation PWA cache: `fueltracker-v16-3-7-backup-context-1`

## v16.3.7 — Backup & Context
- Whole Garage export uses the iOS Share Sheet when available; browser downloads show a clear download-started confirmation and filename.
- Whole Garage restore validates Vehicles, Fuel Records, Maintenance, Upgrades, REVIEW, VERIFIED and Vehicle Photo counts before replacing local state.
- A post-reload restore audit confirms REVIEW/VERIFIED counts were restored correctly.
- Per-vehicle MasterDB exports identify the current format as **v16.3.7** instead of legacy v15.x metadata.
- Settings shows the active local data context: **Web App Local Store** or **Browser Local Store**.
- Safari and the Home Screen Web App keep separate local website data on iPhone; use Whole Garage Export/Restore to transfer state between those contexts while Fuel Tracker remains local-first.

## Maintenance data model
Each Garage profile can store Maintenance and Upgrade/Accessory records with `recordType`, category, Vendor/Workshop, description, cost/currency, historical MYR FX rate, odometer, notes, REVIEW/VERIFIED state, imported-source metadata and timestamps.

Whole Garage Backup includes maintenance, upgrades/accessories, verification states, source metadata, vehicle photos, fuel records, vehicle profiles and Garage metadata.

## v16.1 — Smart Station Recognition
- Saved petrol stations learn from explicit confirmations.
- User confirmation remains mandatory before dwell timing begins.
- No automatic fuel record creation.

### Important iPhone limitation
The GitHub Pages PWA cannot reliably monitor geolocation while suspended or fully closed. Reliable closed-app petrol-station detection will require a native iOS companion using Core Location region monitoring.

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
