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

/* ---- report ---- */
if (problems.length) {
  console.error(`\n  ✗ ${problems.length} problem${problems.length > 1 ? "s" : ""}\n`);
  problems.forEach(p => console.error("    " + p));
  console.error("");
  process.exit(1);
}
console.log(`\n  ✓ corpus is sound — ${ok.join(" · ")}\n`);
