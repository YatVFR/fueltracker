RideFuel PWA

Files:
- index.html
- manifest.webmanifest
- service-worker.js
- icons/

Important:
A PWA must be opened from HTTPS (or localhost) for service worker/offline installation.
Opening index.html directly from iCloud Files will not provide full PWA installation/offline behavior.

iPhone/iPad:
1. Host this folder on an HTTPS website.
2. Open the site in Safari.
3. Share > Add to Home Screen.
4. Launch RideFuel from the Home Screen.

Android:
1. Open the HTTPS site in Chrome/Edge/Samsung Internet.
2. Choose Install app / Add to Home screen.

Data:
- Working data remains in browser storage on each installed device.
- Use BikeFuelData.json as the portable master database.
- Use MERGE DATA when combining records from another device.
