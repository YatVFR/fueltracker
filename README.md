# Fuel Tracker

Active validation version: **v16.3.5 Maintenance Type**

Current approved stable rollback baseline: **v15.8 Garage**

## Release status
- **v16.2 Smart Inbox remains rolled back from the live app due to startup / loading instability.**
- `smart-refuel-inbox-v16.js` remains in the repository as unfinished work but is not loaded by the active app shell.
- v16.1 Smart Stations remains the active automation feature line.
- v16.1.5 added the Refresh update-state indicator: **Latest** when current and **Updates Available** when a newer service worker is waiting.
- v16.3 introduced per-vehicle Garage Maintenance Expenses.
- v16.3.2 added the dedicated Maintenance page, category icons and local per-vehicle dashboard photo support.
- v16.3.3 added PDF-derived FBV260B maintenance/accessory preview data.
- v16.3.4 added Vendor / Workshop and imported-record REVIEW / VERIFIED handling.
- **v16.3.5 adds an explicit Maintenance vs Upgrade / Accessory record type selector.**
- Existing records are classified automatically on first load. FINANCES-2022, Accessories and Installation records default to Upgrade / Accessory; other records default to Maintenance.
- Editing a record and changing its type reclassifies the existing record instead of duplicating it.
- The form category choices adapt to the selected record type.
- The top-left app label is a release requirement and must be updated with every app change.
- Active validation PWA cache: `fueltracker-v16-3-5-maintenance-type-1`

## v16.3.5 — Maintenance Type
- Radio selector at the top of the Maintenance form: **Maintenance** or **Upgrade / Accessory**
- Record type stored as `recordType` inside the per-vehicle Garage maintenance ledger
- Existing records receive a compatible type automatically
- Switching a record type and saving moves it between Maintenance History and Upgrades & Accessories
- Upgrade / Accessory categories: Accessories, Installation, Parts, Other
- Maintenance categories: Service, Repair, Tyres, Parts, Recovery / Towing, Inspection, Cleaning, Other
- Imported source metadata is preserved when a record is reclassified
- REVIEW / VERIFIED behavior from v16.3.4 remains intact

## v16.3.4 — Maintenance Verification
- Dedicated **Vendor / Workshop** field
- Imported records marked REVIEW can become VERIFIED after complete core details are saved
- Separate **Upgrades & Accessories** section for FINANCES-2022 vehicle-history items
- Unknown source dates/costs remain explicit rather than being treated as zero-value data

## v16.3.2 — Maintenance Page Trial
- Four-page navigation: **Dashboard / Refuel / Maintenance / Settings**
- Maintenance ledger shown on its own page
- Category icons added to maintenance entries and summary segments
- Narrow iPhone maintenance form rows stack vertically
- Dashboard hero includes per-vehicle **Vehicle Photo** control
- Vehicle photo remains local and is stored with Garage state

## v16.3 — Garage Maintenance Expenses
- Separate maintenance ledger for every Garage vehicle profile
- Summary KPIs for active vehicle, whole Garage, current year and entry count
- Add, edit and delete expenses
- SGD and MYR support with historical FX per entry
- Maintenance spending remains independent from fuel spending
- Maintenance entries are included in Whole Garage backup/recovery

## v16.1 — Smart Station Recognition
- Saved petrol stations learn from explicit user confirmations
- Confidence labels: New, Known or Frequent
- User confirmation remains mandatory before dwell timing begins

## v16.0 — Refuel Automation Foundation
- Foreground station geofence monitoring while Fuel Tracker is open
- Configurable dwell timing
- AUTO ON/OFF header indicator
- Explicit station confirmation before Possible Refuel creation
- No automatic fuel-record creation

### Important iPhone limitation
The GitHub Pages PWA cannot reliably monitor geolocation while suspended or fully closed. Reliable closed-app station detection will require a native iOS companion using Core Location region monitoring.

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
