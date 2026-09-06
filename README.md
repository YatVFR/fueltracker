# Fuel Tracker

Active validation version: **v16.2 Smart Inbox**

Current approved stable rollback baseline: **v15.8 Garage**

## v16.2 — Smart Refuel Inbox
- Dedicated **Possible Refuels** inbox added to the Refuel page
- Pending detections are visible without opening Automation Settings
- Inbox statuses: **Pending**, **Opened**, **Dismissed** and **Completed**
- Compact counters summarize each inbox state
- Filter between active items, all items, or a specific status
- Enter Refuel opens the existing Refuel form using the automation prefill workflow
- Dismiss moves a candidate out of the active queue without changing fuel history
- Dismissed items can be reopened
- When a refuel is saved from an opened Possible Refuel, v16.2 records the newly created refuel record ID in automation inbox metadata and marks the detection **Completed**
- The fuel record itself is not modified, preserving the existing fuel-record schema
- The Refuel navigation tab shows a pending-count badge when unresolved Possible Refuels exist
- Existing v16.1 Smart Station Recognition and v16.0 automation behavior remains intact
- v16.2 hotfix prevents older v16 version observers from competing with the active v16.2 UI owner
- Mobile-network performance improvement: installed PWA navigation now launches from the local cache immediately instead of waiting for a network-first GitHub Pages response
- **Refresh → Check update** remains the explicit release-update path
- Service-worker updates reuse unchanged cached app-shell assets and fetch only version-sensitive files, reducing repeated downloads on 4G/mobile data
- Validation PWA cache: `fueltracker-v16-2-mobile-performance-2`

## v16.1 — Smart Station Recognition
- Saved petrol stations learn from explicit user confirmations
- Each station tracks confirmation count and last confirmed date locally
- Confidence labels: **New**, **Known** or **Frequent**
- When several saved petrol stations fall within the GPS radius, the confirmation sheet ranks frequently confirmed stations ahead of less familiar stations while still showing distance
- The highest-ranked previously confirmed station is visually emphasized, but Fuel Tracker never auto-selects it
- User confirmation remains mandatory before dwell timing begins
- Saved station cards in Settings show confirmation history and confidence
- No fuel-record schema change is introduced

## v16.0 — Refuel Automation Foundation
- Refuel Automation card in Settings
- Foreground petrol-station geofence monitoring using device location while Fuel Tracker is open
- User can save the current location as a known petrol-station geofence
- Configurable station radius: 100 m, 150 m or 250 m
- User-defined minimum stop duration from **1 to 60 minutes**; **3 minutes** is the default
- A compact **AUTO ON / AUTO OFF** indicator is shown in the app header
- Tapping the header automation indicator opens **Settings → Refuel Automation** directly
- GPS proximity does not automatically assume the nearest saved petrol station
- When one or more saved petrol stations are within the configured radius, Fuel Tracker asks the user to confirm the actual station before starting the dwell timer
- Nearby station choices show their approximate GPS distance
- The station confirmation sheet includes a **Not at a petrol station** option
- A qualifying confirmed stop creates a **Possible Refuel** only; it never writes a fuel record automatically
- Notification permission and test-notification controls are included for supported installed web-app environments
- Service-worker notification clicks deep-link back to the relevant Possible Refuel
- A native bridge hook (`FuelTrackerAutomation.receiveDetection`) is available for a future iOS background geofence companion
- No fuel-record schema change is introduced

### Important iPhone limitation
The GitHub Pages PWA cannot reliably monitor geolocation while suspended or fully closed. v16.x therefore provides the web-side automation workflow and foreground geofence validation. Reliable closed-app petrol-station detection will require a small native iOS companion using Core Location region monitoring, which can feed detections into the same Possible Refuel workflow.

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

v15.8 remains the approved stable rollback point while v16.x automation undergoes field validation.

Validated so far: installed web-app notification permission/test, notification tap opening the Refuel page, custom dwell persistence, and AUTO ON/OFF header redirection to Automation settings.

Pending validation: v16.2 mobile-network launch/update performance, actual GPS geofence detection, multi-station confirmation, dwell timing, Possible Refuel creation, v16.1 station-learning/ranking during real petrol-station visits, and v16.2 end-to-end inbox completion linking after a detected refuel is saved.
