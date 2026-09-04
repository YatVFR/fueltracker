# Fuel Tracker

Current approved stable version: **v15.7 Garage**

Current rollback baseline: **v15.6 Garage**

## v15.7 — Stabilization & Polish
- Dedicated stabilization guard layer loaded after all feature modules
- One visible app-version owner keeps the header and browser title on v15.7 across rerenders
- Startup Garage integrity check validates active profile, working slots, themes, odometers and profile structure
- Safe inconsistencies are repaired automatically and recorded in Garage runtime metadata
- Malformed profile structures are reported without deleting profile data automatically
- A Stability card in Settings reports whether startup repairs or reviewable integrity issues were found
- Data Health identifies exact invalid, duplicate and odometer-sequence records that require review
- Suspect refuel rows are marked with an amber REVIEW badge in Refuel History
- Locate Record scrolls directly to the affected history row and temporarily highlights it
- Odometer sequence warnings show the suspect odometer beside the previous odometer for context
- Monthly dashboard selection is remembered per Garage profile while preserving the existing Bike/Car dashboard storage for compatibility
- Same-type vehicles no longer need to share the same selected month state
- Whole Garage restore is wrapped with stronger compatibility checks before the existing restore preview runs
- Newer unsupported backup schemas and future-version Garage backups are blocked with clearer messages
- Duplicate or malformed vehicle profile identities in Garage backups are rejected before restore
- Existing soft-refresh behavior is preserved
- v15.6 data model, MasterDB flow, Garage Overview, Garage Analytics and Backup & Recovery remain structurally unchanged to minimize regression risk
- Final stable PWA cache: `fueltracker-v15-7-stable-1`

## Stable baseline retained from v15.6
- Whole Garage backup and recovery
- Restore Preview and final destructive confirmation
- Per-vehicle MasterDB backup and restore
- Garage Analytics and Garage Overview
- Enhanced Vehicle Profiles
- Multi-vehicle Garage profiles
- Alphabetical Bike and Car themes
- Theme-aware active Garage selector
- Soft Refresh / Check Update flow without unnecessary Safari/PWA reload jumps
- CLEAR ALL DATA Garage-wide tracking reset
- 3-decimal fuel volume precision
- Compact Current Tank summary
- Current Odometer and live economy calculations
- Data Health details
- Local-first PWA storage
- Mobile-safe iPhone layout

Live app: https://yatvfr.github.io/fueltracker/

v15.7 passed device validation for the stabilization guard, soft refresh, per-profile state handling and Data Health record locating, and is now the approved stable baseline.

Rollback baseline: **v15.6 Garage**
