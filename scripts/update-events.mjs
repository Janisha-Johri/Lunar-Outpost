import { writeFileSync, mkdirSync } from "node:fs";

const KEY = process.env.NASA_API_KEY || "DEMO_KEY";
const day = d => d.toISOString().slice(0, 10);
const end = new Date(), start = new Date(end - 45 * 864e5);
const q = `startDate=${day(start)}&endDate=${day(end)}&api_key=${KEY}`;

async function get(type) {
  const r = await fetch(`https://api.nasa.gov/DONKI/${type}?${q}`);
  if (!r.ok) throw new Error(`${type} failed: ${r.status}`);
  return (await r.json()) || [];
}

try {
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
  if (events.length < 3) { console.log("Too few events, keeping old file."); process.exit(0); }
  events.sort((a, b) => b.date.localeCompare(a.date));
  mkdirSync("data", { recursive: true });
  writeFileSync("data/events.json", JSON.stringify({ updated: day(end), events: events.slice(0, 40) }, null, 1));
  console.log(`Saved ${Math.min(events.length, 40)} events.`);
} catch (e) {
  console.log("NASA fetch failed, keeping old file:", e.message);
}
