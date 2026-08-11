/* Headless smoke test — boots the real app in jsdom against the real
   corpus and asserts the DOM it builds. Catches broken refs, wrong
   element ids and ordering bugs that a syntax check cannot.

   Dev-only:  npm i --no-save jsdom && node scripts/smoke.mjs         */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { JSDOM } from "jsdom";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const dom = new JSDOM(fs.readFileSync(path.join(ROOT, "index.html"), "utf8"), {
  url: "http://localhost/",
  pretendToBeVisual: true,
  runScripts: "outside-only"
});
const { window } = dom;

/* ---- shims jsdom lacks ---- */
window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
window.requestAnimationFrame = cb => setTimeout(cb, 0);
window.scrollTo = () => {};
window.Element.prototype.scrollIntoView = () => {};
window.Element.prototype.getBoundingClientRect = () => ({ width: 1200, height: 800, top: 0, left: 0, right: 1200, bottom: 800 });
window.fetch = async url => {
  const u = String(url);
  // modules resolve data paths against import.meta.url, which is file:// here
  const file = u.startsWith("file:")
    ? fileURLToPath(u)
    : path.join(ROOT, new URL(u, "http://localhost/").pathname);
  if (!fs.existsSync(file)) return { ok: false, status: 404 };
  return { ok: true, status: 200, json: async () => JSON.parse(fs.readFileSync(file, "utf8")) };
};

/* expose to modules */
for (const k of ["document", "matchMedia", "IntersectionObserver", "requestAnimationFrame",
                 "fetch", "addEventListener", "scrollTo", "Element", "Node", "SVGElement",
                 "MouseEvent", "KeyboardEvent", "getComputedStyle", "location", "history"]) {
  globalThis[k] = typeof window[k] === "function" && !/^[A-Z]/.test(k) ? window[k].bind(window) : window[k];
}
globalThis.window = window;

const errors = [];
const origError = console.error;
console.error = (...a) => { errors.push(a.join(" ")); origError(...a); };

/* ---- boot ---- */
await import(pathToFileURL(path.join(ROOT, "src/main.js")).href);
await new Promise(r => setTimeout(r, 250));

/* ---- assertions ---- */
const D = window.document;
const app = window.app;
const checks = [];
const is = (label, actual, expected) =>
  checks.push({ label, ok: actual === expected, actual, expected });
const atLeast = (label, actual, min) =>
  checks.push({ label, ok: actual >= min, actual, expected: "≥ " + min });

is("boot completed (no fatal)", errors.length, 0);
is("strata loaded", app.L.length, 27);
is("stations loaded", app.S.length, 131);

/* descent */
is("hero stat blocks", D.querySelectorAll(".hstat").length, 4);
is("core sample bars", D.querySelectorAll(".core__b").length, 27);
is("rail segments", D.querySelectorAll(".stratum").length, 27);
is("stratum sections", D.querySelectorAll(".sec").length, 27);
is("station cards", D.querySelectorAll(".card").length, 131);
is("first section is stratum 1", D.querySelector(".sec")?.id, "s1");
is("rail is top-down (27 first)", D.querySelector(".stratum")?.dataset.s, "27");
atLeast("criticality pips rendered", D.querySelectorAll(".pip.on").length, 100);

/* web */
is("graph nodes", D.querySelectorAll(".nodeg").length, 131);
is("graph edges", D.querySelectorAll(".edge").length, 356);
is("stratum row labels", D.querySelectorAll(".lrow").length, 27);

/* table */
atLeast("index rows rendered", D.querySelectorAll("#tb tr").length, 400);
is("group chips", D.querySelectorAll("#chips .chip").length, 9);

/* every action must have been replaced by a real implementation —
   the defaults in app.js are empty arrow functions with no body */
["openStation", "closeSheet", "show", "go", "litRail", "trace", "clearTrace", "fitWeb", "focusSearch", "tourStop"]
  .forEach(k => {
    const src = String(app[k] ?? "");
    const stillDefault = /^\(\s*\)\s*=>\s*\{\s*\}$/.test(src);
    checks.push({ label: `action wired: ${k}`, ok: typeof app[k] === "function" && !stillDefault,
                  actual: stillDefault ? "still the default stub" : "implemented", expected: "implemented" });
  });

/* ---- behaviour ---- */
app.openStation("hpq");
is("sheet opens", D.getElementById("sheet").classList.contains("on"), true);
is("sheet title", D.getElementById("shN").textContent, "High-purity quartz");
atLeast("sheet org links", D.querySelectorAll("#shB .co a, #shB .co .nolink").length, 6);
is("sheet shows chokepoint warning", !!D.querySelector("#shB .warn"), true);

app.openStation("hbm");
is("sheet navigates", D.getElementById("shN").textContent, "High-bandwidth memory");
is("hbm has upstream links", D.querySelectorAll('#shB [data-go]').length > 0, true);

app.closeSheet();
is("sheet closes", D.getElementById("sheet").classList.contains("on"), false);

app.show("web");
is("web view active", D.getElementById("v-web").classList.contains("on"), true);
is("strata view hidden", D.getElementById("v-strata").classList.contains("on"), false);

app.trace("gpu");
is("trace sets HUD title", D.getElementById("hudT").textContent, app.byId.gpu.n);
atLeast("trace lights upstream nodes", D.querySelectorAll(".nodeg.up").length, 20);
app.clearTrace();
is("clearTrace resets HUD", D.getElementById("hudT").textContent, "The dependency web");
is("clearTrace unlights nodes", D.querySelectorAll(".nodeg.dim").length, 0);

app.show("idx");
const q = D.getElementById("q");
q.value = "asml";
q.dispatchEvent(new window.Event("input"));
atLeast("search finds ASML", D.querySelectorAll("#tb tr").length, 1);
q.value = "zzzznotathing";
q.dispatchEvent(new window.Event("input"));
is("empty search shows message", D.getElementById("tb").innerHTML, "");
q.value = "";
q.dispatchEvent(new window.Event("input"));

app.show("strata");
D.getElementById("ctaTour").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
is("tour opens", D.getElementById("tour").classList.contains("on"), true);
is("tour starts at stratum 1", D.getElementById("tN").textContent, "Lithosphere");
D.getElementById("tNext").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
is("tour advances", D.getElementById("tN").textContent, "Feedstock");
app.tourStop();
is("tour closes", D.getElementById("tour").classList.contains("on"), false);

/* ---------- cascade ---------- */
app.show("cas");
is("cascade view active", D.getElementById("v-cas").classList.contains("on"), true);
is("chain steps rendered", D.querySelectorAll("#casChain .cas__row").length, 8);
is("branch cards rendered", D.querySelectorAll("#casBranch .cas__br").length, 6);
atLeast("conversion operators shown", D.querySelectorAll("#casChain .cas__op").length, 7);
is("findings rendered", D.querySelectorAll("#casFind .cas__fi").length, 3);
is("assumption controls", D.querySelectorAll("#casCtl .cas__as").length, 4);
atLeast("station links in cascade", D.querySelectorAll("#v-cas [data-station]").length, 10);
atLeast("source panels available", D.querySelectorAll("#v-cas .cas__src").length, 10);

/* every station a cascade step points at must exist */
[...D.querySelectorAll("#v-cas [data-station]")].forEach(b => {
  const id = b.dataset.station;
  if (!app.byId[id]) checks.push({ label: `cascade station "${id}" resolves`, ok: false, actual: "missing", expected: "a station" });
});
checks.push({ label: "all cascade stations resolve", ok: [...D.querySelectorAll("#v-cas [data-station]")].every(b => !!app.byId[b.dataset.station]), actual: "yes", expected: "yes" });

/* the headline must be populated, not empty */
atLeast("headline populated", D.getElementById("casLead").textContent.trim().length, 40);

/* changing an assumption must move the numbers */
const before = D.getElementById("casLead").textContent;
const seg = D.querySelector('#casCtl .cas__seg[data-as="model"]');
seg.querySelectorAll("button")[3].dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
const after = D.getElementById("casLead").textContent;
is("reasoning model changes the answer", before !== after, true);
seg.querySelectorAll("button")[2].dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
is("switching back restores it", D.getElementById("casLead").textContent, before);

/* a cascade station link must open the sheet */
D.querySelector("#v-cas [data-station]").dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
is("cascade links open stations", D.getElementById("sheet").classList.contains("on"), true);
app.closeSheet();


/* the displayed arithmetic must reconcile at every assumption combination */
{
  const { compute, reconcile } = await import(pathToFileURL(path.join(ROOT, "src/lib/cascade.js")).href);
  const K = JSON.parse(fs.readFileSync(path.join(ROOT, "data/static/cascade.json"), "utf8"));
  let combos = 0, broken = [];
  for (const m of K.assumptions[0].options)
    for (const l of K.assumptions[1].options)
      for (const u of K.assumptions[2].options)
        for (const g of K.assumptions[3].options) {
          combos++;
          const bad = reconcile(K, { model: m.value, life: l.value, util: u.value, grid: g.value });
          if (bad.length) broken.push(...bad);
          const r = compute(K, { model: m.value, life: l.value, util: u.value, grid: g.value });
          for (const [key, v] of Object.entries(r.mid))
            if (!isFinite(v) || v < 0) broken.push(`${key} is ${v}`);
          for (const key of Object.keys(r.mid))
            if (r.lo[key] > r.mid[key] * 1.000001 || r.hi[key] < r.mid[key] * 0.999999)
              broken.push(`${key}: central ${r.mid[key]} sits outside [${r.lo[key]}, ${r.hi[key]}]`);
        }
  checks.push({ label: `arithmetic reconciles (${combos} combinations)`, ok: broken.length === 0,
                actual: broken.length ? broken[0] : "every step checks out", expected: "every step checks out" });
}


/* ---------- against the grain ---------- */
{
  const N = JSON.parse(fs.readFileSync(path.join(ROOT, "data/static/notes.json"), "utf8"));
  is("notes loaded", app.notes.all.length, N.notes.length);

  /* a station carrying a note must show it, high in the sheet */
  app.openStation("hbm");
  const g = D.querySelector("#shB .grain");
  is("station sheet surfaces its finding", !!g, true);
  is("finding sits above the mechanism",
     !!(g && (g.compareDocumentPosition(D.querySelector("#shB .mech")) & 4)), true);
  atLeast("finding shows a figure", D.querySelector("#shB .grain__fig b")?.textContent.trim().length || 0, 2);
  is("finding shows a so-what", !!D.querySelector("#shB .grain__s"), true);

  /* a station carrying none must show none */
  app.openStation("h2o");
  const waterNotes = N.notes.filter(n => (n.stations || []).includes("h2o")).length;
  is("water station shows its findings", D.querySelectorAll("#shB .grain").length, waterNotes);
  app.openStation("ver");
  is("a station with no finding shows none", D.querySelectorAll("#shB .grain").length, 0);
  app.closeSheet();

  /* cascade shows inline flags at the steps that have them */
  app.show("cas");
  const stepped = N.notes.filter(n => n.cascadeStep).length;
  is("cascade flags its findings", D.querySelectorAll("#v-cas .grainline").length, stepped);
}

/* ---------- method ---------- */
{
  const MT = JSON.parse(fs.readFileSync(path.join(ROOT, "data/static/method.json"), "utf8"));
  const K = JSON.parse(fs.readFileSync(path.join(ROOT, "data/static/cascade.json"), "utf8"));
  app.show("mth");
  is("method view active", D.getElementById("v-mth").classList.contains("on"), true);
  is("reading definitions", D.querySelectorAll("#mthRead .mth__rd").length, MT.reading.length);
  is("provenance entries", D.querySelectorAll("#mthProv .mth__pv").length, MT.provenance.length);
  is("limitations", D.querySelectorAll("#mthLimits .mth__lim").length, MT.limits.length);
  is("every finding collected", D.querySelectorAll("#mthGrain .grain").length, app.notes.all.length);
  is("assumption ledger", D.querySelectorAll("#mthAssume tr").length, K.assumptions.length);
  is("parameter ledger", D.querySelectorAll("#mthLedger tr").length, Object.keys(K.constants).length);
  atLeast("counts rendered", D.querySelectorAll("#mthCount .mth__ct").length, 6);

  /* the ledger must reproduce the live values, not a transcription */
  const first = Object.entries(K.constants)[0];
  is("ledger reflects the live corpus",
     D.querySelector("#mthLedger .mth__p b")?.textContent, first[1].label);

  /* an inline flag must navigate here and find its target */
  app.show("cas");
  const flag = D.querySelector("#v-cas .grainline");
  flag.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  is("inline flag opens the method page", D.getElementById("v-mth").classList.contains("on"), true);
  is("inline flag resolves its target",
     !!D.querySelector(`#mthGrain [data-note="${flag.dataset.noteopen}"]`), true);
}

/* ---- report ---- */
const failed = checks.filter(c => !c.ok);
const pad = s => String(s).padEnd(34);
console.log("");
checks.forEach(c => console.log(`  ${c.ok ? "✓" : "✗"} ${pad(c.label)} ${c.ok ? c.actual : `got ${c.actual}, want ${c.expected}`}`));
console.log("");
if (failed.length) {
  console.log(`  ✗ ${failed.length} of ${checks.length} checks failed\n`);
  process.exit(1);
}
console.log(`  ✓ all ${checks.length} checks passed\n`);

