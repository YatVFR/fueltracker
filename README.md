# Fuel Tracker

Current approved stable version: **v15.8 Garage**

Current rollback baseline: **v15.7 Garage**

## v15.8 — Separated Pages
- Dashboard, Refuel and Settings are separated into dedicated app pages
- Dashboard contains the vehicle hero, fuel/spending dashboard, Data Health, Garage Overview, Garage Analytics, Current Odometer and Current Tank
- Refuel contains the Add Refuel form and Refuel History only
- Settings contains Garage profiles, themes, registration, MasterDB, Backup & Recovery and Stability controls
- Compact Dashboard / Refuel / Settings navigation is available above the working content
- The active page is remembered locally so the installed PWA can reopen where the user left off
- The redundant header Settings button was removed
- The former header space now shows live Fuel Age for the selected vehicle, with the day count emphasized in a larger font
- Fuel Age is calculated from the latest valid refuel date and updates automatically when switching vehicles
- Existing Garage, MasterDB, analytics, backup, Data Health and export logic remain on the same local-first state model
- No fuel-record schema change was introduced in v15.8
- Existing iOS PWA Share Sheet export behavior is preserved
- Final stable PWA cache: `fueltracker-v15-8-stable-1`

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

v15.8 passed device validation for separated pages, navigation, iPhone layout and Fuel Age header presentation, and is now the approved stable baseline.

Rollback baseline: **v15.7 Garage**
