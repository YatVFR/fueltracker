# Fuel Tracker

Active validation version: **v15.8 Garage**

Current approved stable rollback baseline: **v15.7 Garage**

## v15.8 — Separated Pages
- Dashboard, Refuel and Settings are now separated into dedicated app pages
- Dashboard contains the vehicle hero, fuel/spending dashboard, Data Health, Garage Overview, Garage Analytics, Current Odometer and Current Tank
- Refuel contains the Add Refuel form and Refuel History only
- Settings contains Garage profiles, themes, registration, MasterDB, Backup & Recovery and Stability controls
- A compact three-page navigation switcher is available above the working content
- The existing header Settings button now opens the dedicated Settings page instead of scrolling to an embedded section
- The active page is remembered locally so the installed PWA can reopen where the user left off
- Existing Garage, MasterDB, analytics, backup, Data Health and export logic remain on the same local-first state model
- No fuel-record schema change is introduced in v15.8
- Existing iOS PWA Share Sheet export behavior is preserved
- Validation PWA cache: `fueltracker-v15-8-navigation-1`

## Stable baseline retained from v15.7
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
- Alphabetical Bike and Car themes
- Theme-aware active Garage selector
- Soft Refresh / Check Update flow
- CLEAR ALL DATA Garage-wide tracking reset
- 3-decimal fuel volume precision
- Compact Current Tank summary
- Current Odometer and live economy calculations
- Local-first PWA storage
- Mobile-safe iPhone layout

Live app: https://yatvfr.github.io/fueltracker/

v15.7 remains the approved stable rollback point while v15.8 page separation undergoes device validation.

Validation target: confirm Dashboard / Refuel / Settings navigation, page persistence, Garage switching, refuel add/edit/delete, Data Health locating, Settings controls, MasterDB, Whole Garage backup/restore, iOS Share Sheet export, soft refresh and offline relaunch before promoting v15.8.
