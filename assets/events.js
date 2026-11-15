// FALLBACK space-weather events, used when the live NASA DONKI call fails.
// TODO (do this before submitting):
// 1. Open https://api.nasa.gov/DONKI/FLR?startDate=2026-10-01&endDate=2026-11-14&api_key=DEMO_KEY
//    (also /CME) and copy 6-10 REAL events below (date = beginTime/startTime, first 10 chars).
// 2. intensity: X-class flare = 3, M = 2, C or smaller = 1. CME speed >1000 km/s = 3, >500 = 2, else 1.
// 3. Set SAMPLE_IS_REAL = true ONLY once every entry is real NASA data.
const SAMPLE_IS_REAL = false;
const EVENTS = [
  { type: "solar flare", classType: "X1.0", date: "sample", intensity: 3 },
  { type: "solar flare", classType: "M2.0", date: "sample", intensity: 2 },
  { type: "CME", classType: "1100 km/s", date: "sample", intensity: 3 },
  { type: "solar flare", classType: "M1.0", date: "sample", intensity: 2 },
  { type: "CME", classType: "600 km/s", date: "sample", intensity: 2 },
  { type: "solar flare", classType: "C5.0", date: "sample", intensity: 1 }
];
