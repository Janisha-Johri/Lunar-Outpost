// ALL balance numbers live here, so you can tune the game without touching the logic.
const CFG = { days: 6, budget: 20, unit: 4, start: 80, decay: { life: 8, power: 10, food: 7, shield: 3 },
  lowPower: 30, lowSys: 25, night: 15, radK: 8, shieldK: 0.15 };
const SYS = [
  ["life", "Life support", "Air, water & habitat", "#2dd4bf"],
  ["shield", "Radiation shield", "Keeps radiation out", "#a78bfa"],
  ["power", "Power grid", "Solar & stored energy", "#f5a623"],
  ["food", "Food grower", "Greenhouse crops", "#4ade80"]
];
const GL = { "solar flare": "A sudden burst of energy from the Sun.", "CME": "A giant cloud of particles thrown out by the Sun.",
  "radiation": "Invisible energy that can harm the body.", "shield": "Thick material that blocks radiation.",
  "lunar night": "On the Moon, night lasts about 14 Earth days." };
const T = w => `<span class="tip" tabindex="0" data-tip="${GL[w]}">${w}</span>`;
const $ = s => document.querySelector(s);
const shuffle = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(x => x[1]);
const clamp = v => Math.max(0, Math.min(100, Math.round(v)));
let pool = EVENTS.slice(), live = false, G, view = "play";

let feed = "";
function badge() {
  const b = $("#badge");
  b.className = "badge " + (live ? "live" : "sample");
  b.textContent = feed || (live ? "LIVE NASA DATA" : SAMPLE_IS_REAL ? "ARCHIVED NASA DATA" : "SAMPLE DATA");
}

async function loadLive() {
  try { 
      const r = await fetch("data/events.json", { cache: "no-cache" });
      if (r.ok) {
        const j = await r.json();
        if (j.events && j.events.length >= 3) {
          pool = j.events; live = true; feed = "NASA DONKI · UPDATED " + j.updated;
          badge(); newGame(); return;
        }
      }
    } catch (e) {}
    const e = new Date(), s = new Date(e - 30 * 864e5), f = d => d.toISOString().slice(0, 10);
    const q = `startDate=${f(s)}&endDate=${f(e)}&api_key=DEMO_KEY`;
    const ctl = new AbortController(); setTimeout(() => ctl.abort(), 6000);
    const [fl, cm] = await Promise.all(["FLR", "CME"].map(t =>
      fetch(`https://api.nasa.gov/DONKI/${t}?${q}`, { signal: ctl.signal }).then(r => r.ok ? r.json() : [])));
    const out = [];
    fl.forEach(x => { const c = x.classType || ""; out.push({ type: "solar flare", classType: c, date: (x.beginTime || "").slice(0, 10), intensity: c[0] == "X" ? 3 : c[0] == "M" ? 2 : 1 }); });
    cm.forEach(x => { const sp = (x.cmeAnalyses && x.cmeAnalyses[0] && x.cmeAnalyses[0].speed) || 0;
      out.push({ type: "CME", classType: sp ? Math.round(sp) + " km/s" : "", date: (x.startTime || "").slice(0, 10), intensity: sp > 1000 ? 3 : sp > 500 ? 2 : 1 }); });
    if (out.length >= 3) { pool = out; live = true; }
  } catch (err) { /* fall back to data/events.js */ }
  badge();
  newGame();
}

function newGame() {
  const ev = shuffle(pool).slice(0, 5), q = Math.floor(Math.random() * 6), days = [];
  let i = 0;
  for (let d = 0; d < CFG.days; d++) days.push(d == q ? null : ev[i++] || null);
  G = { day: 0, sys: { life: 80, shield: 80, power: 80, food: 80 }, health: 100, a: { life: 0, shield: 0, power: 0, food: 0 },
    days, night: 1 + Math.floor(Math.random() * 4), log: [], hist: [], lowDays: 0, rad: 0, drain: 0, fact: 0 };
  view = "play"; render();
}

const total = () => Object.values(G.a).reduce((a, b) => a + b, 0);
function adj(k, d) {
  if (d > 0 && total() >= CFG.budget) return;
  if (G.a[k] + d < 0) return;
  G.a[k] += d; render();
}
const evLabel = ev => ev ? `${ev.classType} ${ev.type}${ev.date ? " (" + ev.date + ")" : ""}` : "quiet space weather";

function resolve() {
  const s = G.sys, a = G.a, c = CFG, ev = G.days[G.day], m = [];
  for (const k in c.decay) s[k] -= c.decay[k];
  if (G.day == G.night) { s.power -= c.night; m.push(`Lunar night: no sunlight, so solar power dropped by ${c.night}.`); }
  s.power += a.power * c.unit;
  const low = s.power < c.lowPower;
  s.life += a.life * c.unit * (low ? 0.5 : 1); s.food += a.food * c.unit; s.shield += a.shield * c.unit;
  if (low) { s.food -= 5; G.lowDays++; m.push(`Power fell to ${clamp(s.power)}. Air pumps and grow lights need electricity, so life support worked at half strength and crops lost extra growth.`); }
  for (const k in s) s[k] = clamp(s[k]);
  let dmg = 0;
  if (ev) {
    dmg = Math.max(0, Math.round(ev.intensity * c.radK - s.shield * c.shieldK));
    m.push(dmg ? `A ${evLabel(ev)} hit. Your shield was ${s.shield}, so the crew took ${dmg} radiation damage.` : `A ${evLabel(ev)} hit, but your shield (${s.shield}) blocked it all.`);
  } else m.push("Space weather was quiet today, so radiation was low. A good day to invest elsewhere.");
  let h = dmg; G.rad += dmg;
  if (s.life < c.lowSys) { h += 10; G.drain++; m.push(`Life support is only ${s.life}. The crew struggled to breathe easily (-10 health).`); }
  if (s.food < c.lowSys) { h += 8; G.drain++; m.push(`Food is only ${s.food}. The crew went hungry (-8 health).`); }
  const sorted = Object.entries(s).sort((x, y) => x[1] - y[1]);
  m.push(`Weakest system now: ${sorted[0][0]} at ${sorted[0][1]}. Every unit you add somewhere is a unit you cannot add elsewhere.`);
  G.health = Math.max(0, G.health - h);
  G.hist.push({ n: G.day + 1, ev: evLabel(ev), a: { ...a }, h });
  G.log = m; G.a = { life: 0, shield: 0, power: 0, food: 0 };
  view = (G.health <= 0 || G.day == c.days - 1) ? "end" : "result"; render();
}

function next() { G.day++; G.fact = (G.fact + 1) % FACTS.length; view = "play"; render(); }

function hud() {
  return `<div class="stats"><span>Day <b>${Math.min(G.day + 1, CFG.days)}</b> of ${CFG.days}</span><span>Crew health <b class="${G.health < 40 ? "bad" : ""}">${G.health}%</b></span></div>`;
}

function render() {
  const app = $("#app"); let h = "";
  if (view == "play") {
    const ev = G.days[G.day], left = CFG.budget - total();
    h += `<section class="card">${hud()}<h2>Space weather forecast</h2>`;
    h += ev ? `<p><b class="warn">${ev.classType} ${T(ev.type)}</b> ${ev.date && ev.date != "sample" ? "from " + ev.date : "(sample)"} · ${live || SAMPLE_IS_REAL ? "NASA DONKI" : "sample data"}.<br><span class="mut">Strong ${T("radiation")} gets through a weak ${T("shield")}.</span></p>`
      : `<p class="good">Quiet space weather today. Nothing incoming.</p>`;
    if (G.day == G.night) h += `<p class="warn">${T("lunar night")} today: solar power will drop.</p>`;
    h += `</section><section class="card"><h3>Allocate today's supplies <span class="mut">(${left} / ${CFG.budget} units left)</span></h3>`;
    SYS.forEach(([k, n, sub, col]) => {
      const v = G.sys[k];
      h += `<div class="sys"><div><b>${n}</b><small>${sub} · now ${v}%</small></div><div class="ctl"><button onclick="adj('${k}',-1)" aria-label="less ${n}">−</button><span>${G.a[k]}</span><button onclick="adj('${k}',1)" aria-label="more ${n}">+</button></div><div class="bar"><i style="width:${v}%;background:${v < CFG.lowSys ? "var(--red)" : col}"></i></div></div>`;
    });
    h += `<button class="go" ${left ? "disabled" : ""} onclick="resolve()">${left ? "Spend all " + CFG.budget + " units to continue" : "Advance to next day"}</button></section>`;
  } else if (view == "result") {
    const f = FACTS[G.fact];
    h += `<section class="card">${hud()}<h2>What happened</h2><ul>${G.log.map(x => `<li>${x}</li>`).join("")}</ul>
      <div class="fact">${f.text} <a href="${f.url}" style="color:var(--amb)" target="_blank" rel="noopener">${f.src}</a></div>
      <button class="go" onclick="next()">Start day ${G.day + 2}</button></section>`;
  } else {
    const win = G.health > 0, worst = G.lowDays >= 2 || G.drain >= G.rad / 10 && G.lowDays ? "power" : G.rad >= 20 ? "shield" : "none";
    const lesson = worst == "power" ? "Everything depends on power. When it dropped, air and food got worse too." : worst == "shield" ? "Radiation storms are real risks. Shield early, because you can't know exactly when one will hit." : "You balanced air, power, shield and food well. That is the real job of a mission planner.";
    h += `<section class="card">${hud()}<h2 class="${win ? "good" : "warn"}">${win ? "Crew home safe!" : "Mission learning"}</h2>
      <p>${win ? `The crew survived with ${G.health}% health.` : "The crew had to leave early. Real missions learn from this too. Try a new plan!"}</p>
      <p><b>Lesson:</b> ${lesson}</p><ul>${G.log.map(x => `<li>${x}</li>`).join("")}</ul>
      <h3>Your days</h3><ul>${G.hist.map(d => `<li>Day ${d.n}: ${d.ev}. Life ${d.a.life}, Shield ${d.a.shield}, Power ${d.a.power}, Food ${d.a.food}${d.h ? " (-" + d.h + " health)" : ""}</li>`).join("")}</ul>
      <button class="go" onclick="newGame()">Play again with new events</button></section>`;
  }
  app.innerHTML = h;
  const dc = $("#dayChip");
if (dc) dc.textContent = `Day ${String(Math.min(G.day + 1, CFG.days)).padStart(2, "0")} / ${CFG.days}`;
}

badge(); newGame(); loadLive();
