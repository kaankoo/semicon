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

/* ---- counterfactuals ---- */
const CF = read("counterfactuals.json");
const TIERS = new Set((CF.meta.tiers || []).map(t => t.id));
const tlIds = new Set(TL.events.map(e => e.id));
const faultIds = new Set();

["updated", "framing", "note", "tiers", "caveat", "leadTimes"].forEach(k => {
  if (!CF.meta[k]) problems.push(`counterfactuals.json meta is missing "${k}"`);
});
["removed", "dead", "reroute", "reach", "clear"].forEach(t => {
  if (!TIERS.has(t)) problems.push(`counterfactuals.json does not declare the "${t}" tier`);
});

/* the same downstream walk the view does, so validation and rendering
   cannot disagree about what a fault reaches */
const DNmap = {};
S.forEach(s => { DNmap[s.i] = []; });
Object.keys(E).forEach(k => {
  if (!ids.has(k)) return;
  E[k].forEach(u => { if (ids.has(u) && u !== k) DNmap[u].push(k); });
});
function downstream(seeds) {
  const seed = new Set(seeds), out = new Set(), q = [...seeds];
  while (q.length) {
    const k = q.pop();
    (DNmap[k] || []).forEach(x => { if (!out.has(x) && !seed.has(x)) { out.add(x); q.push(x); } });
  }
  return out;
}

CF.faults.forEach(f => {
  if (faultIds.has(f.id)) problems.push(`duplicate fault: ${f.id}`);
  faultIds.add(f.id);
  ["title", "sub", "essay"].forEach(k => { if (!f[k]) problems.push(`fault ${f.id} is missing "${k}"`); });
  if (!f.source || !f.source.who) problems.push(`fault ${f.id} has no source`);
  if (!Array.isArray(f.removes) || !f.removes.length) problems.push(`fault ${f.id} removes nothing`);
  if (!(f.leadTimeYears >= 0)) problems.push(`fault ${f.id} has lead time ${f.leadTimeYears}`);
  if (f.precedent && !tlIds.has(f.precedent))
    problems.push(`fault ${f.id} cites unknown precedent "${f.precedent}"`);
  f.removes.forEach(x => { if (!ids.has(x)) problems.push(`fault ${f.id} removes unknown station "${x}"`); });

  const reach = downstream(f.removes.filter(x => ids.has(x)));
  if (!reach.size) problems.push(`fault ${f.id} reaches nothing — check its removals`);

  /* the load-bearing check: you may not declare a consequence for a
     station the graph does not actually connect to the removal. This is
     what stops the essays drifting away from the corpus. */
  const seen = new Set();
  const claimAt = (kind, station, extra) => {
    if (!ids.has(station)) { problems.push(`fault ${f.id} ${kind} names unknown station "${station}"`); return; }
    if (!reach.has(station))
      problems.push(`fault ${f.id} declares ${station} a ${kind}, but it is not downstream of ${f.removes.join("+")}`);
    if (seen.has(station))
      problems.push(`fault ${f.id} classifies ${station} twice`);
    seen.add(station);
    if (!extra) problems.push(`fault ${f.id} ${kind} for ${station} has no explanation`);
  };
  (f.reroutes || []).forEach(r => {
    claimAt("reroute", r.station, r.how);
    if (!(r.leadTimeYears >= 0)) problems.push(`fault ${f.id} reroute ${r.station} has lead time ${r.leadTimeYears}`);
    if (r.timeline && !tlIds.has(r.timeline))
      problems.push(`fault ${f.id} reroute ${r.station} cites unknown timeline event "${r.timeline}"`);
  });
  (f.deadEnds || []).forEach(d => claimAt("dead-end", d.station, d.why));

  /* a scenario that claims to have classified everything is not being
     honest about what a dependency graph can tell you */
  if (seen.size >= reach.size)
    problems.push(`fault ${f.id} classifies all ${reach.size} downstream stations — the unclassified remainder is the honest part`);
});

/* the page's headline compares the widest blast radius against the
   slowest recovery. If those stop being different faults, the sentence
   stops meaning anything. */
{
  const rows = CF.faults.map(f => ({ id: f.id, n: downstream(f.removes).size, lead: f.leadTimeYears }));
  const widest = rows.reduce((a, b) => (b.n > a.n ? b : a));
  const slowest = rows.reduce((a, b) => (b.lead > a.lead ? b : a));
  if (widest.id === slowest.id)
    problems.push(`the widest blast radius and the slowest recovery are both "${widest.id}", ` +
                  `so the Faults headline no longer says anything — rewrite it`);
  if (widest.lead >= slowest.lead)
    problems.push(`the widest fault now takes as long to reroute as the slowest, ` +
                  `which contradicts the claim the page makes`);
}
/* findings that point at a scenario must land on a real one */
N.notes.forEach(n => {
  if (n.faults && !faultIds.has(n.faults)) problems.push(`note ${n.id} points at unknown fault "${n.faults}"`);
});

/* the finding this page argues for names two numbers in prose, both of
   them computed. Hold the sentence to the graph. */
{
  const note = N.notes.find(n => n.id === "reach-is-not-damage");
  const reachOf = id => downstream(CF.faults.find(f => f.id === id).removes).size;
  if (!note) problems.push('the "reach-is-not-damage" finding is missing, but the Faults page argues for it');
  else {
    const want = `${reachOf("gases")} vs ${reachOf("taiwan")}`;
    if (note.figure !== want)
      problems.push(`finding "reach-is-not-damage" reads "${note.figure}" but the graph now says ` +
                    `"${want}" — update its figure and its body together`);
    const dead = CF.faults.find(f => f.id === "taiwan").deadEnds.length;
    if (!note.body.includes(`${dead === 5 ? "five" : dead} declared dead-end`))
      problems.push(`finding "reach-is-not-damage" says a different number of Taiwan dead-ends than the ${dead} declared`);
  }
}
ok.push(`${CF.faults.length} counterfactuals`);

/* ---- companies ---- */
const CO = read("companies.json");
const KINDS_C = new Set((CO.meta.kinds || []).map(k => k.id));
const corpusOrgs = {};
S.forEach(s => s.co.forEach(c => { if (c[0] !== "—") (corpusOrgs[c[0]] = corpusOrgs[c[0]] || []).push(s.i); }));

["updated", "note", "attribution", "kinds", "cik", "caveat", "coverage"].forEach(k => {
  if (!CO.meta[k]) problems.push(`companies.json meta is missing "${k}"`);
});
["listed", "division", "private", "body", "abstract"].forEach(k => {
  if (!KINDS_C.has(k)) problems.push(`companies.json does not declare the "${k}" kind`);
});

const tickers = {};
Object.entries(CO.companies).forEach(([id, c]) => {
  if (!c.name) { problems.push(`company ${id} has no name`); return; }
  if (!KINDS_C.has(c.kind)) problems.push(`company ${id} has kind "${c.kind}"`);

  /* the spine may not drift away from the corpus it joins onto */
  const real = corpusOrgs[c.name];
  if (!real) problems.push(`company ${id} ("${c.name}") does not appear in stations.json`);
  else if (real.slice().sort().join() !== c.stations.slice().sort().join())
    problems.push(`company ${id} lists stations the corpus disagrees with — ` +
                  `spine has [${c.stations}], corpus has [${real}]`);

  if (c.kind === "listed") {
    if (!c.ticker) problems.push(`company ${id} is listed with no ticker`);
    else (tickers[c.ticker] = tickers[c.ticker] || []).push(id);
    if (c.cik !== null) problems.push(`company ${id} has a hand-typed CIK — those are resolved at ingest`);
  }
  if (c.kind === "division") {
    if (!c.parent) problems.push(`company ${id} is a division with no parent`);
    if (!(c.parentShare > 0 && c.parentShare <= 1))
      problems.push(`company ${id} has parentShare ${c.parentShare}`);
  }
  if (c.kind !== "listed" && c.ticker) problems.push(`company ${id} is ${c.kind} but carries a ticker`);

  /* a company at nine stations counted nine times makes every aggregate
     nonsense — so weights, where declared, must be a partition of one */
  if (c.attribution) {
    const keys = Object.keys(c.attribution);
    const sum = Object.values(c.attribution).reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 1) > 2e-3) problems.push(`company ${id} weights sum to ${sum.toFixed(4)}, not 1`);
    keys.forEach(k => {
      if (!ids.has(k)) problems.push(`company ${id} weights unknown station "${k}"`);
      else if (!c.stations.includes(k)) problems.push(`company ${id} weights "${k}", a station it is not at`);
    });
    if (keys.length !== c.stations.length)
      problems.push(`company ${id} weights ${keys.length} of its ${c.stations.length} stations — ` +
                    `a partial partition silently loses value`);
    if (c.attributionBasis !== "judgement")
      problems.push(`company ${id} declares weights but calls the basis "${c.attributionBasis}"`);
    if (!c.attributionWhy)
      problems.push(`company ${id} hand-weights without saying why — judgement has to be defensible`);
  } else if (c.attributionBasis !== "even") {
    problems.push(`company ${id} has no weights, so its basis must be "even", not "${c.attributionBasis}"`);
  }
});

Object.entries(tickers).forEach(([t, who]) => {
  if (who.length > 1) problems.push(`ticker ${t} is claimed by ${who.length} companies: ${who.join(", ")}`);
});

/* the declared coverage must be the real coverage */
{
  const n = Object.keys(CO.companies).length, all = Object.keys(corpusOrgs).length;
  if (CO.meta.coverage.curated !== n || CO.meta.coverage.corpus !== all)
    problems.push(`companies.json declares coverage ${CO.meta.coverage.curated}/${CO.meta.coverage.corpus} ` +
                  `but is ${n}/${all}`);
  /* every organisation appearing at more than one station is where
     attribution actually matters, so none of them may be missing */
  const multi = Object.entries(corpusOrgs).filter(([, st]) => st.length > 1).map(([n2]) => n2);
  const have = new Set(Object.values(CO.companies).map(c => c.name));
  const gap = multi.filter(n2 => !have.has(n2));
  if (gap.length) problems.push(`${gap.length} multi-station organisations are missing from the spine: ` +
                                gap.slice(0, 5).join(", "));
}

/* ---- jurisdiction ----
   The Moat page is built on this field, so it has to be sound. The
   important assertion is the first one: the reason that page plots
   concentration rather than a headcount is that the corpus names five
   to seven organisations per station by editorial policy. If that ever
   stopped being true, the argument on the page would need rewriting
   rather than the chart quietly becoming meaningful. */
{
  const named = c => c && c[0] && c[0] !== "—";
  const perStation = S.map(x => new Set(x.co.filter(named).map(c => c[0])).size);
  const lo = Math.min(...perStation), hi = Math.max(...perStation);
  if (lo < 3 || hi > 9)
    problems.push(`stations name between ${lo} and ${hi} organisations, so the Moat page's ` +
                  `"five to eight, by editorial policy" caveat no longer describes this corpus`);

  const jur = new Map();
  S.forEach(x => x.co.filter(named).forEach(c => {
    if (!jur.has(c[0])) jur.set(c[0], new Set());
    if (c[3] && c[3] !== "—") jur.get(c[0]).add(c[3]);
  }));
  const split = [...jur].filter(([, v]) => v.size > 1);
  if (split.length)
    problems.push(`${split.length} organisations are recorded under more than one jurisdiction, ` +
                  `so the Moat index would place one company in two countries: ` +
                  split.slice(0, 4).map(([k]) => k).join(", "));

  const unstated = [...jur].filter(([, v]) => !v.size).length;
  if (unstated / jur.size > 0.1)
    problems.push(`${unstated} of ${jur.size} organisations have no stated jurisdiction, ` +
                  `too many to quietly exclude from the Moat index`);

  const blind = L.filter(l => !S.some(x => x.L === l.n &&
    x.co.some(c => named(c) && c[3] && c[3] !== "—")));
  if (blind.length) problems.push(`stratum ${blind[0].n} has no organisation with a stated base, so its bar is blank`);

  ok.push(`${jur.size} organisations, ${lo}-${hi} per station, ${unstated} without a base`);
}

/* ---- ticker links ----
   The Index links out rather than holding a price, so the failure mode
   is a dead link rather than a stale number. */
{
  /* `parent` on a division holds a ticker, not a name. Twelve of the 38
     name a parent that operates at no station here — Alphabet, Hitachi,
     Sony, Hyundai, Atlas Copco — so requiring a spine row would have
     broken twelve working links. What must hold is that every division
     names a parent at all, since a division with none has no price to
     point at and no way to say so. */
  const divisions = Object.values(CO.companies).filter(c => c.kind === "division");
  const parentless = divisions.filter(c => !c.parent);
  if (parentless.length)
    problems.push(`${parentless.length} divisions name no parent, so their price link resolves to ` +
                  `nothing: ` + parentless.slice(0, 3).map(c => c.name).join(", "));

  const symbols = new Set();
  Object.values(CO.companies).forEach(c => {
    if (c.kind === "listed" && c.ticker) symbols.add(c.ticker);
    if (c.kind === "division" && c.parent) symbols.add(c.parent);
  });
  if (symbols.size < 100)
    problems.push(`only ${symbols.size} symbols are linkable; the Index price column would be mostly empty`);

  /* the join is what makes the column work: a rename in stations.json
     that stops matching companies.json empties the column silently */
  const spineNames = new Set(Object.values(CO.companies).map(c => c.name));
  const matched = new Set();
  S.forEach(x => x.co.forEach(c => { if (c[0] && c[0] !== "—" && spineNames.has(c[0])) matched.add(c[0]); }));
  if (matched.size < spineNames.size * 0.9)
    problems.push(`only ${matched.size} of ${spineNames.size} spine names appear in stations.json — ` +
                  `the Index price column is joined on name and would be losing rows`);
  ok.push(`${symbols.size} symbols, ${matched.size} organisations linkable`);

  const t = path.join(D, "../live/tickers.json");
  if (fs.existsSync(t)) {
    const T = JSON.parse(fs.readFileSync(t, "utf8"));
    if (!T.checked) problems.push("data/live/tickers.json has no check date");
    if (T.quotes || T.close)
      problems.push("data/live/tickers.json holds market data, and this project commits no prices");
  }
}
ok.push(`${Object.keys(CO.companies).length} companies in the spine`);

/* ---- report ---- */
if (problems.length) {
  console.error(`\n  ✗ ${problems.length} problem${problems.length > 1 ? "s" : ""}\n`);
  problems.forEach(p => console.error("    " + p));
  console.error("");
  process.exit(1);
}
console.log(`\n  ✓ corpus is sound — ${ok.join(" · ")}\n`);
