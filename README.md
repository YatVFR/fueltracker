# Fuel Tracker

Current approved stable version: **v15.5 Garage**

Previous rollback baseline: **v15.4 Garage**

## v15.5 — Garage Analytics
- Garage-wide analytical summary across all vehicle profiles
- Total all-time Garage spend in SGD equivalent
- Tracked distance based on completed valid refuel intervals
- Weighted Garage fuel economy
- Garage cost per 100 km
- Spend by Vehicle comparison
- Average Economy by Vehicle comparison
- Tracked Distance by Vehicle comparison
- Cost / 100 km by Vehicle comparison
- Latest 12-month combined Garage spending trend
- Analytics uses each refuel record's stored SGD/MYR FX rate where available
- Live Current Tank estimate is excluded from completed-interval Garage analytics to avoid double counting
- CLEAR ALL DATA resets fuel history and Current Odometer across the whole Garage while preserving vehicle profiles, registrations, themes and enhanced vehicle details
- MasterDB restore preserves profile metadata, theme and Current Odometer and now blocks Bike/Car profile-type mismatches
- Final stable PWA cache: `fueltracker-v15-5-stable-1`

## Preserved from v15.4
- Enhanced Vehicle Profiles: Make, Model, Year, Fuel Tank Capacity and Notes
- Garage Overview across all vehicles
- Multi-vehicle Garage profiles
- Per-vehicle MasterDB import/export
- MasterDB backup of profile metadata, theme, current odometer and odometer timestamp
- Fuel volume standardized to 3 decimal places
- Local-first PWA storage
- Compact Current Tank summary
- Live odometer-based distance and fuel economy
- Data Health details
- In-app new user guide
- Refresh / Check Update flow
- Mobile-safe iPhone layout

Live app: https://yatvfr.github.io/fueltracker/

v15.5 has passed code sanity review and device functional validation and is now the approved stable baseline.

Next planned milestone: **v15.6 Backup & Recovery**
