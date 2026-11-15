import { writeFileSync, mkdirSync } from "node:fs";

const KEY = process.env.NASA_API_KEY || "DEMO_KEY";
const day = d => d.toISOString().slice(0, 10);
const end = new Date(), start = new Date(end - 30 * 864e5);

// Try 30 days first, then NASA's own default range. Never stops the whole script.
async function get(type) {
  const urls = [
    `https://api.nasa.gov/DONKI/${type}?startDate=${day(start)}&endDate=${day(end)}&api_key=${KEY}`,
    `https://api.nasa.gov/DONKI/${type}?api_key=${KEY}`
  ];
  for (const u of urls) {
    try {
      const r = await fetch(u);
      if (!r.ok) { console.log(`${type}: status ${r.status} - ${(await r.text()).slice(0, 150)}`); continue; }
      const j = await r.json();
      if (Array.isArray(j) && j.length) { console.log(`${type}: ${j.length} items`); return j; }
      console.log(`${type}: empty list`);
    } catch (e) { console.log(`${type}: error ${e.message}`); }
  }
  return [];
}

const [fl, cm] = await Promise.all([get("FLR"), get("CME")]);
const events = [];
for (const x of fl) {
  const c = x.classType || "";
  events.push({ type: "solar flare", classType: c, date: (x.beginTime || "").slice(0, 10),
    intensity: c[0] === "X" ? 3 : c[0] === "M" ? 2 : 1 });
}
for (const x of cm) {
  const sp = x.cmeAnalyses?.[0]?.speed || 0;
  events.push({ type: "CME", classType: sp ? Math.round(sp) + " km/s" : "", date: (x.startTime || "").slice(0, 10),
    intensity: sp > 1000 ? 3 : sp > 500 ? 2 : 1 });
}
if (events.length < 3) { console.log(`Only ${events.length} events, keeping old file.`); process.exit(0); }
events.sort((a, b) => b.date.localeCompare(a.date));
mkdirSync("data", { recursive: true });
writeFileSync("data/events.json", JSON.stringify({ updated: day(end), events: events.slice(0, 40) }, null, 1));
console.log(`Saved ${Math.min(events.length, 40)} events.`);
