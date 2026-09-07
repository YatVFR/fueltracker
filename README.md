# Fuel Tracker

Active validation version: **v16.3.2 Maintenance Page Trial**

Current approved stable rollback baseline: **v15.8 Garage**

## Release status
- **v16.2 Smart Inbox remains rolled back from the live app due to startup / loading instability.**
- `smart-refuel-inbox-v16.js` remains in the repository as unfinished work but is not loaded by the active app shell.
- v16.1 Smart Stations remains the active automation feature line.
- v16.1.5 added the Refresh update-state indicator: **Latest** when current and **Updates Available** when a newer service worker is waiting.
- v16.3 introduced per-vehicle Garage Maintenance Expenses.
- **v16.3.2 is a reversible UI trial:** Maintenance is now a dedicated page, maintenance categories receive visual icons, the iPhone form layout is stacked safely, and each Garage vehicle can store its own real dashboard photo locally.
- Vehicle photos are compressed on-device before being stored under Garage state; they are never uploaded to a server by Fuel Tracker.
- Fuel records are not modified by maintenance entries.
- The top-left app label is a release requirement and must be updated with every app change.
- Active validation PWA cache: `fueltracker-v16-3-2-maintenance-page-trial-1`

## v16.3.2 — Maintenance Page Trial
- Four-page navigation: **Dashboard / Refuel / Maintenance / Settings**
- Maintenance ledger removed from the Dashboard flow and shown as its own page
- Category icons added to maintenance entries and summary segments
- Narrow iPhone maintenance form rows stack vertically to avoid native Date/Select overlap
- Dashboard hero includes **Vehicle Photo** control
- User can select a real vehicle photo from the device
- Selected photo is resized/compressed locally and remembered separately per Garage vehicle profile
- Existing theme, model and registration text remain overlaid on the photo
- Trial is designed to be reverted if the layout does not meet requirements

## v16.3 — Garage Maintenance Expenses
- Separate maintenance ledger for every Garage vehicle profile
- Summary KPIs: active vehicle total, whole Garage total, current-year Garage maintenance spend and active-vehicle entry count
- Add, edit and delete maintenance expenses
- Categories: **Service, Repair, Tyres, Parts, Accessories, Inspection, Cleaning, Other**
- Expense fields: date, category, description, cost, currency, optional odometer and notes
- SGD and MYR supported
- MYR maintenance entries store their own historical SGD/MYR exchange rate
- Maintenance spending remains independent from fuel spending and does not alter fuel efficiency calculations
- Maintenance entries are stored under Garage state and therefore included in Whole Garage backup/recovery

## v16.1 — Smart Station Recognition
- Saved petrol stations learn from explicit user confirmations
- Each station tracks confirmation count and last confirmed date locally
- Confidence labels: **New**, **Known** or **Frequent**
- When several saved petrol stations fall within the GPS radius, the confirmation sheet ranks frequently confirmed stations ahead of less familiar stations while still showing distance
- User confirmation remains mandatory before dwell timing begins
- No fuel-record schema change is introduced

## v16.0 — Refuel Automation Foundation
- Refuel Automation card in Settings
- Foreground petrol-station geofence monitoring using device location while Fuel Tracker is open
- User can save the current location as a known petrol-station geofence
- User-defined minimum stop duration from **1 to 60 minutes**
- AUTO ON/OFF header indicator
- Explicit station confirmation before dwell timing
- Possible Refuel workflow only; no automatic fuel-record creation

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
