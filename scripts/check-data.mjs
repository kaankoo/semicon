/* Integrity check for the static corpus.  npm run check
   Runs in CI before deploy, so a broken edge never ships. */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const D = path.join(ROOT, "data/static");
const read = f => JSON.parse(fs.readFileSync(path.join(D, f), "utf8"));

const L = read("strata.json");
const S = read("stations.json");
const E = read("edges.json");

const problems = [];
const ok = [];

/* ---- strata ---- */
const nums = L.map(l => l.n);
if (nums.join() !== L.map((_, i) => i + 1).join()) problems.push("strata are not numbered 1..n in order");
L.forEach(l => {
  if (!/^#[0-9A-Fa-f]{6}$/.test(l.c)) problems.push(`stratum ${l.n} has a bad colour: ${l.c}`);
  if (!l.t || !l.a) problems.push(`stratum ${l.n} is missing a title or abstract`);
});
ok.push(`${L.length} strata`);

/* ---- stations ---- */
const ids = new Set();
S.forEach(s => {
  if (ids.has(s.i)) problems.push(`duplicate station id: ${s.i}`);
  ids.add(s.i);
  if (!(s.L >= 1 && s.L <= L.length)) problems.push(`station ${s.i} points at stratum ${s.L}`);
  if (!(s.c >= 0 && s.c <= 3)) problems.push(`station ${s.i} has criticality ${s.c}`);
  ["n", "s", "w"].forEach(k => { if (!s[k]) problems.push(`station ${s.i} is missing "${k}"`); });
  if (!Array.isArray(s.h) || !s.h.length) problems.push(`station ${s.i} has no mechanism list`);
  if (!Array.isArray(s.k) || !s.k.length) problems.push(`station ${s.i} has no key figures`);
  if (!Array.isArray(s.co) || !s.co.length) problems.push(`station ${s.i} has no organisations`);
  (s.co || []).forEach((c, j) => {
    if (!Array.isArray(c) || c.length !== 4) problems.push(`station ${s.i} org #${j} is malformed`);
  });
});
ok.push(`${S.length} stations`);

/* ---- coverage: every stratum has at least one station ---- */
L.forEach(l => {
  if (!S.some(s => s.L === l.n)) problems.push(`stratum ${l.n} (${l.t}) has no stations`);
});

/* ---- edges ---- */
Object.keys(E).forEach(k => {
  if (!ids.has(k)) problems.push(`edge key "${k}" is not a station`);
  E[k].forEach(u => {
    if (!ids.has(u)) problems.push(`edge ${k} -> ${u}: "${u}" is not a station`);
    if (u === k) problems.push(`edge ${k} -> itself`);
  });
});
S.forEach(s => { if (!(s.i in E)) problems.push(`station ${s.i} has no entry in edges.json`); });
ok.push(`${Object.values(E).flat().length} edges`);

/* ---- organisations ---- */
const orgs = new Set();
S.forEach(s => s.co.forEach(c => { if (c[0] !== "—") orgs.add(c[0]); }));
ok.push(`${orgs.size} organisations`);

/* ---- cascade ---- */
const K = read("cascade.json");
const stationIds = ids;
["meta","assumptions","constants","chain","branches","stepSources"].forEach(k => {
  if (!K[k]) problems.push(`cascade.json is missing "${k}"`);
});
K.assumptions.forEach(a => {
  if (!Array.isArray(a.options) || a.options.length < 2) problems.push(`cascade assumption ${a.id} needs options`);
  if (a.default == null || !a.options[a.default]) problems.push(`cascade assumption ${a.id} has a bad default`);
  if (!a.help) problems.push(`cascade assumption ${a.id} has no help text`);
});
Object.entries(K.constants).forEach(([k, c]) => {
  if (typeof c.value !== "number") problems.push(`cascade constant ${k} has no value`);
  if (c.lo != null && c.hi != null && !(c.lo <= c.value && c.value <= c.hi))
    problems.push(`cascade constant ${k}: value ${c.value} is outside [${c.lo}, ${c.hi}]`);
  if (!c.derivation) problems.push(`cascade constant ${k} has no derivation`);
  if (!c.source || !c.source.who) problems.push(`cascade constant ${k} has no source`);
});
[...K.chain, ...K.branches].forEach(s => {
  if (s.station && !stationIds.has(s.station)) problems.push(`cascade step ${s.id} points at unknown station "${s.station}"`);
  if (s.via && !K.constants[s.via]) problems.push(`cascade step ${s.id} references unknown constant "${s.via}"`);
});
const chainIds = new Set(K.chain.map(s => s.id));
K.branches.forEach(b => {
  if (!chainIds.has(b.from) && !K.branches.some(x => x.id === b.from))
    problems.push(`cascade branch ${b.id} hangs off unknown step "${b.from}"`);
});
Object.entries(K.stepSources).forEach(([step, cid]) => {
  if (!chainIds.has(step)) problems.push(`stepSources names unknown step "${step}"`);
  if (!K.constants[cid]) problems.push(`stepSources points at unknown constant "${cid}"`);
});
ok.push(`${K.chain.length}-step cascade`);

/* ---- notes ---- */
const N = read("notes.json");
const cascadeIds = new Set([...K.chain, ...K.branches].map(x => x.id));
const noteIds = new Set();
N.notes.forEach(n => {
  if (noteIds.has(n.id)) problems.push(`duplicate note id: ${n.id}`);
  noteIds.add(n.id);
  ["title", "figure", "figureNote", "body", "soWhat", "basis"].forEach(f => {
    if (!n[f]) problems.push(`note ${n.id} is missing "${f}"`);
  });
  if (!(n.weight >= 1 && n.weight <= 3)) problems.push(`note ${n.id} has weight ${n.weight}`);
  if (!["derived", "cited"].includes(n.basis)) problems.push(`note ${n.id} has basis "${n.basis}"`);
  if (!n.source || !n.source.who) problems.push(`note ${n.id} has no source`);
  (n.stations || []).forEach(x => { if (!ids.has(x)) problems.push(`note ${n.id} points at unknown station "${x}"`); });
  (n.strata || []).forEach(x => { if (!L.some(l => l.n === x)) problems.push(`note ${n.id} points at unknown stratum ${x}`); });
  if (n.cascadeStep && !cascadeIds.has(n.cascadeStep)) problems.push(`note ${n.id} points at unknown cascade step "${n.cascadeStep}"`);
  if (!(n.stations || []).length && !(n.strata || []).length) problems.push(`note ${n.id} surfaces nowhere`);
});
ok.push(`${N.notes.length} findings`);

/* ---- method ---- */
const MT = read("method.json");
["intro", "reading", "provenance", "limits", "corrections"].forEach(f => {
  if (!MT[f]) problems.push(`method.json is missing "${f}"`);
});
const KINDS = new Set(["judgement", "curated", "cited", "derived"]);
MT.provenance.forEach(p => {
  if (!KINDS.has(p.kind)) problems.push(`provenance "${p.class}" has kind "${p.kind}"`);
  ["class", "who", "detail", "vintage"].forEach(f => {
    if (!p[f]) problems.push(`provenance "${p.class}" is missing "${f}"`);
  });
});
MT.limits.forEach(l => { if (!l.title || !l.body) problems.push("a limitation is incomplete"); });
if (!MT.corrections.repo) problems.push("method.json has no corrections repo");
/* every judgement-heavy data class the site actually ships must be declared */
["strata", "station", "Criticality", "Dependency", "Company"].forEach(kw => {
  if (!MT.provenance.some(p => p.class.toLowerCase().includes(kw.toLowerCase())))
    problems.push(`provenance does not account for "${kw}"`);
});
ok.push(`${MT.provenance.length} provenance classes`);

/* ---- ruler ---- */
const R = read("ruler.json");
const GLYPHS = new Set(["lattice","layers","wave","pitch","dot","via","strand","stack",
                        "rect","disc","board","figure","rack","machine","plan","region","globe"]);
const PREC = new Set(["exact","typical","approx"]);
const rIds = new Set();
let lastLg = -Infinity;
R.objects.slice().sort((a,b) => a.m - b.m).forEach(o => {
  if (rIds.has(o.id)) problems.push(`duplicate ruler object: ${o.id}`);
  rIds.add(o.id);
  if (!(o.m > 0)) problems.push(`ruler object ${o.id} has size ${o.m}`);
  const lg = Math.log10(o.m);
  if (lg < R.meta.span[0] || lg > R.meta.span[1])
    problems.push(`ruler object ${o.id} at 10^${lg.toFixed(1)} falls outside the declared span`);
  if (!GLYPHS.has(o.glyph)) problems.push(`ruler object ${o.id} uses unknown glyph "${o.glyph}"`);
  if (!PREC.has(o.precision)) problems.push(`ruler object ${o.id} has precision "${o.precision}"`);
  ["label","sub","note"].forEach(f => { if (!o[f]) problems.push(`ruler object ${o.id} is missing "${f}"`); });
  if (o.station && !ids.has(o.station)) problems.push(`ruler object ${o.id} points at unknown station "${o.station}"`);
  lastLg = lg;
});
/* no decade in the middle of the ruler may be empty, or the journey stalls */
const decades = new Set(R.objects.map(o => Math.floor(Math.log10(o.m))));
const lo = Math.min(...decades), hi = Math.max(...decades);
let gap = 0, worst = 0, gapAt = null;
for (let e = lo; e <= hi; e++) {
  if (decades.has(e)) { gap = 0; } else { gap++; if (gap > worst) { worst = gap; gapAt = e; } }
}
if (worst > 2) problems.push(`ruler has a ${worst}-decade gap around 10^${gapAt} — the journey stalls there`);
ok.push(`${R.objects.length} scale objects over ${(hi - lo + 1)} decades`);

/* ---- atlas ---- */
const AT = read("atlas.json");
const WD = read("world.json");
const KINDS_A = new Set(["mine", "refine", "wafer", "tool", "fab", "memory", "package", "site", "chokepoint"]);
const PREC_A = new Set(["sited", "approx", "area"]);
const REGIMES = new Set((AT.meta.regimes || []).map(r => r.id));
const RISKS = new Set((AT.meta.risks || []).map(r => r.id));
const rulerIds = new Set(R.objects.map(o => o.id));
const siteIds = new Set();

["updated", "note", "coordinates", "projection", "comparison", "regimes", "risks"].forEach(k => {
  if (!AT.meta[k]) problems.push(`atlas.json meta is missing "${k}"`);
});
if (!(AT.meta.comparison && AT.meta.comparison.km2 > 0 && AT.meta.comparison.label))
  problems.push("atlas comparison needs a label and an area");

AT.sites.forEach(s => {
  if (siteIds.has(s.id)) problems.push(`duplicate atlas site: ${s.id}`);
  siteIds.add(s.id);
  ["label", "place", "note"].forEach(f => { if (!s[f]) problems.push(`atlas site ${s.id} is missing "${f}"`); });
  if (!(s.lat >= -90 && s.lat <= 90)) problems.push(`atlas site ${s.id} has latitude ${s.lat}`);
  /* The Atlas tiles the coastline across the antimeridian but draws each
     scale ring once, at its true longitude. That is only safe while no
     site sits near the seam. See clampCam() in src/views/atlas.js. */
  if (!(s.lon >= -170 && s.lon <= 170))
    problems.push(`atlas site ${s.id} is at longitude ${s.lon}, too close to the antimeridian for a single-copy ring`);
  if (!KINDS_A.has(s.kind)) problems.push(`atlas site ${s.id} has kind "${s.kind}"`);
  if (!PREC_A.has(s.precision)) problems.push(`atlas site ${s.id} has precision "${s.precision}"`);
  if (!REGIMES.has(s.regime)) problems.push(`atlas site ${s.id} has regime "${s.regime}"`);
  if (s.risk && !RISKS.has(s.risk.k)) problems.push(`atlas site ${s.id} has risk kind "${s.risk.k}"`);
  if (s.risk && !s.risk.note) problems.push(`atlas site ${s.id} declares a risk without saying what it is`);
  if (!s.source || !s.source.who) problems.push(`atlas site ${s.id} has no source`);
  if (s.radiusKm != null && !(s.radiusKm > 0)) problems.push(`atlas site ${s.id} has radius ${s.radiusKm}`);
  /* the acceptance condition: every site is anchored in the corpus */
  if (!Array.isArray(s.stations) || !s.stations.length)
    problems.push(`atlas site ${s.id} names no station`);
  (s.stations || []).forEach(x => {
    if (!ids.has(x)) problems.push(`atlas site ${s.id} points at unknown station "${x}"`);
  });
  if (s.leading && !(s.radiusKm > 0))
    problems.push(`atlas site ${s.id} is flagged leading-edge but has no radius to draw`);
  /* a site that claims a Ruler object must be the same size as it */
  if (s.ruler) {
    if (!rulerIds.has(s.ruler)) problems.push(`atlas site ${s.id} points at unknown ruler object "${s.ruler}"`);
    else {
      const o = R.objects.find(x => x.id === s.ruler);
      if (Math.abs(o.m - s.radiusKm * 2000) > 1e-6)
        problems.push(`atlas site ${s.id} is ${s.radiusKm * 2} km across but the ruler draws ${s.ruler} at ${o.m / 1000} km`);
    }
  }
});

/* the concentration claim must survive its own data */
const leadKm2 = AT.sites.filter(s => s.leading)
  .reduce((n, s) => n + Math.PI * s.radiusKm * s.radiusKm, 0);
if (!(leadKm2 > 0)) problems.push("atlas has no leading-edge sites, so the concentration claim says nothing");
if (leadKm2 >= AT.meta.comparison.km2)
  problems.push(`leading-edge sites now enclose ${leadKm2.toFixed(0)} km², which is no longer less than ` +
                `${AT.meta.comparison.label} at ${AT.meta.comparison.km2} km² — pick a bigger comparison or check the radii`);

/* findings that point at the map must land somewhere real */
N.notes.forEach(n => {
  if (n.atlas && !siteIds.has(n.atlas)) problems.push(`note ${n.id} points at unknown atlas site "${n.atlas}"`);
});

/* the coastline must actually be geometry, and must parse */
["land", "borders"].forEach(k => {
  const d = WD[k];
  if (typeof d !== "string" || d.length < 1000) { problems.push(`world.json "${k}" is missing or empty`); return; }
  if (!/^M/.test(d)) problems.push(`world.json "${k}" does not start with a move`);
  if (/[^MlLZz0-9.\- ]/.test(d)) problems.push(`world.json "${k}" contains an unexpected path command`);
  /* every ring must carry an even number of coordinates, or a relative
     delta has been swallowed by its neighbour — see scripts/world.mjs */
  const odd = d.split("M").slice(1).filter(p =>
    (("M" + p).match(/[MlLZz]|-?(?:\d+\.?\d*|\.\d+)/g) || [])
      .filter(t => !/^[MlLZz]$/.test(t)).length % 2);
  if (odd.length) problems.push(`world.json "${k}" has ${odd.length} rings with a broken coordinate pair`);
});
if (!WD.meta || !WD.meta.source || !WD.meta.source.who) problems.push("world.json has no source");
ok.push(`${AT.sites.length} atlas sites`);

/* ---- timeline ---- */
const TL = read("timeline.json");
const CONF = new Set((TL.meta.confidence || []).map(c => c.id));
const WAIT = new Set((TL.meta.waitedFor || []).map(c => c.id));
const stationOf = {};
S.forEach(s => { stationOf[s.i] = s; });
const evIds = new Set();

["updated", "span", "now", "note", "definitions", "confidence", "waitedFor", "caveat"].forEach(k => {
  if (!TL.meta[k]) problems.push(`timeline.json meta is missing "${k}"`);
});
if (!(TL.meta.span[0] < TL.meta.now && TL.meta.now <= TL.meta.span[1]))
  problems.push(`timeline span ${TL.meta.span} does not contain "now" (${TL.meta.now})`);

TL.events.forEach(e => {
  if (evIds.has(e.id)) problems.push(`duplicate timeline event: ${e.id}`);
  evIds.add(e.id);
  ["label", "note"].forEach(f => { if (!e[f]) problems.push(`timeline event ${e.id} is missing "${f}"`); });
  if (!e.source || !e.source.who) problems.push(`timeline event ${e.id} has no source`);
  if (!CONF.has(e.confidence)) problems.push(`timeline event ${e.id} has confidence "${e.confidence}"`);
  if (!WAIT.has(e.waitedFor)) problems.push(`timeline event ${e.id} waited for "${e.waitedFor}"`);
  /* the acceptance condition: every event is anchored in the corpus */
  if (!ids.has(e.station)) problems.push(`timeline event ${e.id} points at unknown station "${e.station}"`);
  else if (stationOf[e.station].L !== e.stratum)
    problems.push(`timeline event ${e.id} claims stratum ${e.stratum} but station "${e.station}" is in ${stationOf[e.station].L}`);
  if (!L.some(l => l.n === e.stratum)) problems.push(`timeline event ${e.id} points at unknown stratum ${e.stratum}`);
  /* dates */
  if (!(e.invented > 1800 && e.invented <= TL.meta.now))
    problems.push(`timeline event ${e.id} was invented in ${e.invented}`);
  if (e.shipped != null) {
    if (e.shipped < e.invented) problems.push(`timeline event ${e.id} shipped before it worked`);
    if (e.shipped > TL.meta.now) problems.push(`timeline event ${e.id} ships in ${e.shipped}, which has not happened`);
    if (e.confidence === "open") problems.push(`timeline event ${e.id} has a ship date but is marked "open"`);
  } else if (e.confidence !== "open") {
    /* the whole point: nothing may imply a date it does not have */
    problems.push(`timeline event ${e.id} has no ship date, so its confidence must be "open"`);
  }
  if (e.invented > TL.meta.span[1]) problems.push(`timeline event ${e.id} starts past the end of the chart`);
});

/* findings that point at the chart must land on a real event */
N.notes.forEach(n => {
  if (n.timeline && !evIds.has(n.timeline)) problems.push(`note ${n.id} points at unknown timeline event "${n.timeline}"`);
});

/* every stratum should be represented, or the gradient the page claims is
   a statement about the strata that happen to be here */
L.forEach(l => {
  if (!TL.events.some(e => e.stratum === l.n))
    problems.push(`stratum ${l.n} (${l.t}) has no entry on the timeline`);
  if (!TL.events.some(e => e.stratum === l.n && e.shipped != null))
    problems.push(`stratum ${l.n} (${l.t}) never lights — every entry it has is unshipped`);
});

/* the finding that this chart exists to support states two numbers in
   prose. Hold the prose to the corpus: if a new event moves the counts,
   the build stops here rather than shipping a stale sentence. */
{
  const long = TL.events.filter(e => e.shipped != null && e.shipped - e.invented >= 30);
  const unsolved = long.filter(e => e.waitedFor === "unsolved");
  const note = N.notes.find(n => n.id === "waiting-not-inventing");
  if (!note) problems.push('the "waiting-not-inventing" finding is missing, but the Lag chart argues for it');
  else if (note.figure !== `${unsolved.length} of ${long.length}`)
    problems.push(`finding "waiting-not-inventing" reads "${note.figure}" but the timeline now says ` +
                  `"${unsolved.length} of ${long.length}" — update its figure and its body together`);
}
ok.push(`${TL.events.length} timeline events`);

/* ---- report ---- */
if (problems.length) {
  console.error(`\n  ✗ ${problems.length} problem${problems.length > 1 ? "s" : ""}\n`);
  problems.forEach(p => console.error("    " + p));
  console.error("");
  process.exit(1);
}
console.log(`\n  ✓ corpus is sound — ${ok.join(" · ")}\n`);
