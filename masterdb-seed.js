// Fuel Tracker data-sanitized compatibility stub.
// Historical bundled Bike/Car MasterDB payloads were intentionally removed.
// This file remains in the app shell so older cached HTML/service workers do not 404.
// No fuel records, odometer values, registrations, locations or other user data are embedded here.

const MASTER_DB_REVISION='sanitized-no-seed-v1';

// schema-native.js previously waited for the historical bundled revision before
// normalizing the active local store. Preserve only that compatibility marker;
// do not define BIKE_DB_GZ_B64 or CAR_DB_GZ_B64, so no source-code data can be applied.
try{
  if(typeof state!=='undefined'){
    state.masterDbRevision='2026-09-01T13:14:16.791Z-v4';
    if(typeof saveState==='function')saveState();
  }
}catch(e){}
