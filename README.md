# Fuel Tracker

Active validation version: **v16.0 Automation**

Current approved stable rollback baseline: **v15.8 Garage**

## v16.0 — Refuel Automation Foundation
- New Refuel Automation card in Settings
- Foreground petrol-station geofence monitoring using device location while Fuel Tracker is open
- User can save the current location as a known petrol-station geofence
- Configurable station radius: 100 m, 150 m or 250 m
- User-defined minimum stop duration from **1 to 60 minutes**; **3 minutes** is the default
- Changing the dwell threshold updates the locally stored automation preference and is used for the next qualifying stop
- A qualifying stop creates a **Possible Refuel** only; it never writes a fuel record automatically
- Possible Refuels are stored locally in an inbox for review
- Enter Refuel opens the dedicated Refuel page and pre-fills detected date/time, station type and a detection note
- Dismiss removes a candidate from the pending inbox without touching fuel history
- Notification permission and test-notification controls are included
- Service-worker notification clicks deep-link back to the relevant Possible Refuel
- A native bridge hook (`FuelTrackerAutomation.receiveDetection`) is available for a future iOS background geofence companion
- No fuel-record schema change is introduced in v16.0
- Existing v15.8 Dashboard / Refuel / Settings structure, Fuel Age, Garage, MasterDB, Backup & Recovery and export behavior remain intact
- Validation PWA cache: `fueltracker-v16-0-automation-2`

### Important iPhone limitation
The GitHub Pages PWA cannot reliably monitor geolocation while suspended or fully closed. v16.0 therefore provides the complete web-side automation workflow and foreground geofence validation. Reliable closed-app petrol-station detection will require a small native iOS companion using Core Location region monitoring, which can feed detections into the same Possible Refuel workflow.

## Stable baseline retained from v15.8
- Dedicated Dashboard / Refuel / Settings pages
- Remembered active page
- Fuel Age header metric
- Startup Garage stabilization guard
- Per-profile monthly dashboard state
- Data Health exact-record locating and REVIEW highlighting
- Whole Garage backup compatibility guard
- Browser direct-download exports
- Installed iOS PWA native Share Sheet exports for CSV, MasterDB and Whole Garage backup
- Whole Garage backup and recovery
- Per-vehicle MasterDB backup and restore
- Garage Analytics and Garage Overview
- Enhanced Vehicle Profiles
- Multi-vehicle Garage profiles
- Soft Refresh / Check Update flow
- 3-decimal fuel volume precision
- Current Odometer and live economy calculations
- Local-first PWA storage
- Mobile-safe iPhone layout

Live app: https://yatvfr.github.io/fueltracker/

v15.8 remains the approved stable rollback point while v16.0 automation undergoes device validation.

Validation target: confirm the custom 1–60 minute dwell control persists, enable notifications, save a petrol-station location, enable Detection, confirm foreground dwell detection creates a Possible Refuel, test notification tap/deep-link, confirm Enter Refuel prefill, dismiss workflow, Garage switching, offline relaunch and existing v15.8 regression checks.
