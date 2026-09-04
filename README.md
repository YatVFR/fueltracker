# Fuel Tracker

Current approved stable version: **v15.6 Garage**

Previous rollback baseline: **v15.5 Garage**

## v15.6 — Backup & Recovery
- Whole Garage backup in a single JSON file
- Backup includes all Garage profiles, enhanced vehicle details, themes, registrations, Current Odometers, MasterDB metadata and fuel records
- Active Garage profile and app state are preserved in the backup
- Monthly dashboard selection state is included where available
- Restore validates that the selected file is a Fuel Tracker Garage backup
- Restore Preview shows vehicle count, fuel-record count, backup version and export timestamp before replacement
- Final confirmation is required before replacing the complete local Garage
- Restore normalizes fuel volume to 3-decimal precision and rebuilds the active legacy working slot from the restored Garage profile
- App reloads after a successful whole-Garage restore so every dashboard/module starts from the restored state
- Per-vehicle MasterDB remains available for vehicle-level backup and restore
- Dashboard themes are alphabetized for Bike and Car theme selectors
- The active Garage selector follows the current vehicle theme accent
- Refresh / Check Update now uses a soft in-app refresh when the app is already current, avoiding unnecessary Safari/PWA reload jumps
- Hard reload is reserved for genuine app/service-worker updates
- Final stable PWA cache: `fueltracker-v15-6-stable-1`

## Preserved from v15.5
- Garage Analytics across all vehicle profiles
- Garage Overview across all vehicles
- Enhanced Vehicle Profiles: Make, Model, Year, Fuel Tank Capacity and Notes
- Multi-vehicle Garage profiles
- Per-vehicle MasterDB import/export with Bike/Car type validation
- MasterDB backup of profile metadata, theme, Current Odometer and odometer timestamp
- CLEAR ALL DATA resets tracking data across the entire Garage while keeping vehicle profiles
- Fuel volume standardized to 3 decimal places
- Local-first PWA storage
- Compact Current Tank summary
- Live odometer-based distance and fuel economy
- Data Health details
- In-app new user guide
- Mobile-safe iPhone layout

Live app: https://yatvfr.github.io/fueltracker/

v15.6 passed code sanity review and device functional validation, including Whole Garage restore and soft-refresh UX, and is now the approved stable baseline.

Next planned milestone: **v15.7 Stabilization**
