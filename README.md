# Fuel Tracker

Active validation version: **v16.4.0 Smart Refuel Capture DEV**

Current approved stable rollback baseline: **v16.3.8 iCloud Backup Target**

## Release status
- **v16.4.0 DEV adds Smart Refuel Capture** for pump/receipt photos and onboard odometer photos.
- Pump/receipt scan can prefill fuel volume, displayed amount, unit price and known station when recognizable.
- Odometer scan prefills the vehicle total odometer; trip meter and onboard average consumption are retained as optional supporting metadata when detected.
- Discounts can be entered as fixed amount, sen/cents per litre, or percentage; the existing `cost` field remains the actual final amount paid for backward-compatible dashboards.
- Refuel history can be collapsed to reduce long-page scrolling, especially on mobile.
- Scan images are not stored inside the MasterDB; only extracted values are retained.
- OCR is loaded lazily on first scan and therefore needs internet access for the first recognition session.
- Pre-commit hardening prevents blank scan fields from being treated as zero and preserves Smart Capture metadata across per-vehicle MasterDB export/import.
- v16.3.8 remains the approved rollback baseline while v16.4 is validated in DEV.
- **v16.2 Smart Inbox remains rolled back** due to startup/loading instability.
- v16.1 Smart Stations remains the active automation feature line.
- v16.3 introduced per-vehicle Garage Maintenance.
- v16.3.4 added Vendor/Workshop, REVIEW/VERIFIED handling and a separate Upgrades & Accessories section.
- v16.3.5 added Maintenance vs Upgrade/Accessory record type selection and reclassification.
- v16.3.6 hardened Whole Garage backup schema and restore normalization.
- v16.3.7 fixed export feedback, restore verification auditing, current MasterDB version metadata, and Browser vs Home Screen Web App local-data context identification.
- v16.3.8 added the preferred iCloud Drive Garage backup destination: iCloud Drive → Apps → GitHub → Fuel_Tracker.
- The top-left app label is a release requirement and must be updated with every app change.
- Active DEV PWA cache: `fueltracker-v16-4-0-smart-refuel-capture-dev-2`

## v16.4.0 — Smart Refuel Capture DEV
- **SCAN PUMP / RECEIPT** processes a selected photo locally in the browser and attempts to identify amount, litres and unit price.
- Pump parsing validates candidates against `litres × unit price ≈ amount` to reduce seven-segment OCR mistakes.
- Recognized Malaysian pump displays automatically select MYR and can recognize common station names when present.
- **SCAN ODOMETER** attempts to identify the total odometer for form prefill. Supporting Trip Current and onboard consumption values are stored when confidently identified.
- Odometer parsing accepts compact total odometer formats and removes common thousands separators before mapping.
- Discount handling supports no discount, fixed amount, sen/cents-per-litre, or percentage.
- `pumpAmount`, `unitPrice`, discount metadata, `netPaid`, `effectiveUnitPrice`, scanned trip meter and onboard consumption are optional refuel fields and do not invalidate older records.
- Per-vehicle MasterDB schema 3 export/import preserves the optional Smart Capture fields.
- Extended CSV export includes the new optional scan and discount fields.
- Refuel History gains collapse/expand grouping for lengthy displays.
- Planned follow-up: per-vehicle learned odometer display profiles so users can teach Fuel Tracker how their dashboard layout maps to Total Odometer, Trip, Economy and Range.

## v16.3.8 — iCloud Backup Target
- Settings → Whole Garage Backup shows the preferred iCloud path.
- **SAVE LATEST TO ICLOUD** creates `FuelTracker-Garage-Latest.json`.
- **SAVE DATED ARCHIVE** creates a timestamped Garage JSON backup.
- On supported iPhone/PWA environments, export uses the native Share Sheet so the file can be saved to the preferred iCloud folder.
- The preferred backup target is recorded inside Garage state and backup metadata.
- Whole Garage remains the portability mechanism between Browser and installed Web App local stores.
- iOS still requires the user to confirm the Save to Files/Share Sheet destination; a browser/PWA cannot silently write to an arbitrary iCloud Drive folder in the background.

## Maintenance data model
Each Garage profile can store Maintenance and Upgrade/Accessory records with `recordType`, category, Vendor/Workshop, description, cost/currency, historical MYR FX rate, odometer, notes, REVIEW/VERIFIED state, imported-source metadata and timestamps.

Whole Garage Backup includes maintenance, upgrades/accessories, verification states, source metadata, vehicle photos, fuel records, vehicle profiles and Garage metadata.

## v16.1 — Smart Station Recognition
- Saved petrol stations learn from explicit confirmations.
- User confirmation remains mandatory before dwell timing begins.
- No automatic fuel record creation.

### Important iPhone limitations
The GitHub Pages PWA cannot reliably monitor geolocation while suspended or fully closed. It also cannot silently retain unrestricted background file-system access to an arbitrary iCloud Drive directory. Smart Capture uses browser-side OCR; initial OCR engine/language loading requires network access. Native iOS capabilities would be required for fully automatic iCloud/CloudKit synchronization and closed-app geofencing.

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

v16.3.8 remains the approved rollback point while v16.4 Smart Refuel Capture undergoes DEV validation.
