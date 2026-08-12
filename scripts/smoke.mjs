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


/* ---------- ruler ---------- */
{
  const R = JSON.parse(fs.readFileSync(path.join(ROOT, "data/static/ruler.json"), "utf8"));
  const { place } = await import(pathToFileURL(path.join(ROOT, "src/views/ruler.js")).href);

  app.show("rul");
  is("ruler view active", D.getElementById("v-rul").classList.contains("on"), true);
  atLeast("objects drawn", D.querySelectorAll("#rulSvg .rul__o").length, 2);
  atLeast("axis ticks drawn", D.querySelectorAll("#rulSvg text.rul__tick").length, 2);
  atLeast("stops offered", D.querySelectorAll("#rulStops button").length, 8);
  atLeast("panel populated", D.getElementById("rulPanel").textContent.trim().length, 80);
  atLeast("scale readout", D.getElementById("rulScale").textContent.trim().length, 2);

  /* the whole point: an object ten times bigger must be drawn ten times bigger */
  const a = { lg: Math.log10(1e-9) }, b = { lg: Math.log10(1e-8) };
  const z0 = -9;
  const ratio = place(b, z0).px / place(a, z0).px;
  checks.push({ label: "scale is true, not schematic", ok: Math.abs(ratio - 10) < 1e-6,
                actual: ratio.toFixed(6) + "× for a 10× object", expected: "exactly 10×" });

  /* centring an object must make it the reference size */
  const c = place({ lg: -6 }, -6);
  checks.push({ label: "a centred object is the reference size", ok: Math.abs(c.rel) < 1e-9,
                actual: "rel " + c.rel, expected: "rel 0" });

  /* things far off scale must not be drawn at all */
  is("far-smaller objects drop out", place({ lg: -14 }, -6).visible, false);
  is("far-larger objects drop out", place({ lg: 2 }, -6).visible, false);

  /* every object must become visible somewhere along its own journey */
  const never = R.objects.filter(o => !place({ lg: Math.log10(o.m) }, Math.log10(o.m)).visible);
  checks.push({ label: "every object is reachable", ok: never.length === 0,
                actual: never.length ? never.map(o => o.id).join(", ") : "all " + R.objects.length,
                expected: "all reachable" });

  /* travelling the full span must never leave the stage empty */
  let emptyAt = null;
  for (let zz = R.meta.span[0]; zz <= R.meta.span[1]; zz += 0.25) {
    const n = R.objects.filter(o => place({ lg: Math.log10(o.m) }, zz).visible).length;
    if (n === 0) { emptyAt = zz.toFixed(2); break; }
  }
  checks.push({ label: "the journey never goes blank", ok: emptyAt === null,
                actual: emptyAt === null ? "populated throughout" : `empty at z=${emptyAt}`,
                expected: "populated throughout" });

  /* a station chip in the panel must open that station */
  const chip = D.querySelector("#rulPanel [data-station]");
  if (chip) {
    chip.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    is("ruler panel opens stations", D.getElementById("sheet").classList.contains("on"), true);
    app.closeSheet();
  }

  /* jumping to an object must centre it */
  app.rulerGoTo("reticle");
  await new Promise(r => setTimeout(r, 400));
  const lgRet = Math.log10(R.objects.find(o => o.id === "reticle").m);
  const shownNow = D.getElementById("rulScale").textContent;
  checks.push({ label: "jumping centres the target", ok: shownNow.includes("33") || shownNow.includes("32"),
                actual: shownNow, expected: "≈ 33 mm across the view" });
}


/* findings that point at the ruler must land on a real object */
{
  const R = JSON.parse(fs.readFileSync(path.join(ROOT, "data/static/ruler.json"), "utf8"));
  const rIds = new Set(R.objects.map(o => o.id));
  const bad = app.notes.all.filter(n => n.ruler && !rIds.has(n.ruler)).map(n => n.id);
  checks.push({ label: "findings link to real ruler objects", ok: bad.length === 0,
                actual: bad.length ? bad.join(", ") : "all resolve", expected: "all resolve" });

  app.openStation("cowos");
  const rb = D.querySelector("#shB [data-ruler]");
  is("a finding offers the ruler", !!rb, true);
  if (rb) {
    rb.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise(r => setTimeout(r, 400));
    is("it lands on the ruler", D.getElementById("v-rul").classList.contains("on"), true);
  }
}

/* ---------- atlas ---------- */
{
  const AT = JSON.parse(fs.readFileSync(path.join(ROOT, "data/static/atlas.json"), "utf8"));
  const { ring, ringRadiusError, haversine, project, unproject, transform, wrapLon } =
    await import(pathToFileURL(path.join(ROOT, "src/lib/projection.js")).href);
  const { leadingArea, camera } = await import(pathToFileURL(path.join(ROOT, "src/views/atlas.js")).href);

  app.show("atl");
  is("atlas view active", D.getElementById("v-atl").classList.contains("on"), true);
  is("every site is marked", D.querySelectorAll("#atlSvg .atl__m").length, AT.sites.length);
  is("the world is drawn", !!D.querySelector("#atlSvg .atl__land"), true);
  is("the world wraps", D.querySelectorAll("#atlSvg use").length, 3);
  is("every radius is drawn", D.querySelectorAll("#atlSvg .atl__ring").length,
     AT.sites.filter(s => s.radiusKm).length);
  /* a ring with no colour on it is an invisible ring, and the geometry
     being right does not help if nothing paints it */
  {
    const blind = [...D.querySelectorAll("#atlSvg .atl__ring")]
      .filter(p => !/^#[0-9A-Fa-f]{6}$/.test(p.getAttribute("stroke") || ""));
    checks.push({ label: "every circle is actually drawn", ok: blind.length === 0,
                  actual: blind.length ? `${blind.length} with no stroke colour` : "all coloured",
                  expected: "all coloured" });
    const geo = D.querySelector("#atlSvg g[transform]");
    checks.push({ label: "strokes are counter-scaled", ok: +D.querySelector("#atlSvg .atl__rings").getAttribute("stroke-width") > 0,
                  actual: "stroke-width " + D.querySelector("#atlSvg .atl__rings").getAttribute("stroke-width"),
                  expected: "a positive width in degrees" });
    checks.push({ label: "the geometry group carries the camera", ok: /translate\(.+\) scale\(/.test(geo?.getAttribute("transform") || ""),
                  actual: (geo?.getAttribute("transform") || "none").slice(0, 40), expected: "translate + scale" });
  }

  atLeast("layers offered", D.querySelectorAll("#atlLayers button").length, 3);
  atLeast("stops offered", D.querySelectorAll("#atlStops button").length, 6);
  atLeast("panel populated", D.getElementById("atlPanel").textContent.trim().length, 120);
  atLeast("scale readout", D.getElementById("atlScale").textContent.trim().length, 2);

  /* the whole point: a ring must enclose the ground it claims to.
     Every vertex, on every site, at every latitude. */
  let worst = 0, worstAt = null;
  for (const s of AT.sites.filter(x => x.radiusKm)) {
    const e = ringRadiusError(s.lon, s.lat, s.radiusKm);
    if (e > worst) { worst = e; worstAt = s.id; }
  }
  checks.push({ label: "circles are true to the ground", ok: worst < 1e-9,
                actual: `worst ${(worst * 100).toExponential(1)}% at ${worstAt}`,
                expected: "under 1e-9 everywhere" });

  /* …and must therefore NOT be circles on screen. A ring drawn as a
     screen circle would have an aspect of exactly 1; a true one is
     stretched east–west by 1/cos(latitude). */
  {
    const s = AT.sites.find(x => x.id === "hsinchu");
    const pts = ring(s.lon, s.lat, s.radiusKm);
    const lons = pts.map(p => p[0]), lats = pts.map(p => p[1]);
    const aspect = (Math.max(...lons) - Math.min(...lons)) / (Math.max(...lats) - Math.min(...lats));
    const want = 1 / Math.cos(s.lat * Math.PI / 180);
    checks.push({ label: "the projection is not being cheated", ok: Math.abs(aspect - want) < 0.01,
                  actual: `aspect ${aspect.toFixed(3)} at ${s.lat}°N`,
                  expected: `1/cos(lat) = ${want.toFixed(3)}` });
  }

  /* the Atlas and the Ruler must agree about the same distance */
  {
    const R2 = JSON.parse(fs.readFileSync(path.join(ROOT, "data/static/ruler.json"), "utf8"));
    const bad = AT.sites.filter(s => s.ruler).filter(s => {
      const o = R2.objects.find(x => x.id === s.ruler);
      return !o || Math.abs(o.m - s.radiusKm * 2000) > 1e-6;
    }).map(s => s.id);
    checks.push({ label: "atlas and ruler agree on size", ok: bad.length === 0,
                  actual: bad.length ? bad.join(", ") : "spruce-pine, hsinchu",
                  expected: "every cross-linked site matches" });
  }

  /* the headline sentence must be arithmetic, not a string */
  {
    const km2 = leadingArea(AT);
    const shown = D.getElementById("atlClaim").textContent;
    const inText = +(shown.match(/([\d,]+)\s*km²/) || [])[1]?.replace(/,/g, "");
    checks.push({ label: "the concentration claim reconciles", ok: inText === Math.round(km2),
                  actual: `renders ${inText}, computes ${Math.round(km2)}`,
                  expected: "the same number" });
    checks.push({ label: "…and is still true", ok: km2 < AT.meta.comparison.km2,
                  actual: `${Math.round(km2)} km² vs ${AT.meta.comparison.label} at ${AT.meta.comparison.km2}`,
                  expected: "smaller than the comparison" });
  }

  /* project and unproject must be exact inverses, or panning drifts */
  {
    const cam = { lon: 121, lat: 24.8, k: 240 };
    const p = project(120.5, 25.1, cam, 1200, 600);
    const u = unproject(p.x, p.y, cam, 1200, 600);
    checks.push({ label: "the camera does not drift", ok: Math.abs(u.lon - 120.5) + Math.abs(u.lat - 25.1) < 1e-9,
                  actual: `${Math.abs(u.lon - 120.5).toExponential(1)}° round trip`, expected: "exact" });
    /* and the SVG transform must place things where project() says */
    const m = transform(cam, 1200, 600).match(/translate\(([-\d.]+),([-\d.]+)\) scale\(([\d.]+)\)/);
    const gx = +m[1] + 120.5 * +m[3], gy = +m[2] + -25.1 * +m[3];
    checks.push({ label: "markers and geometry agree", ok: Math.abs(gx - p.x) < 0.02 && Math.abs(gy - p.y) < 0.02,
                  actual: `${Math.abs(gx - p.x).toFixed(4)} px apart`, expected: "the same point" });
  }

  /* known distances, as a check on the sphere itself */
  checks.push({ label: "the earth is the right size",
                ok: Math.abs(haversine(-0.1276, 51.5072, 2.3522, 48.8566) - 344) < 6,
                actual: haversine(-0.1276, 51.5072, 2.3522, 48.8566).toFixed(0) + " km London–Paris",
                expected: "≈ 344 km" });

  /* the world must not fall apart at the antimeridian */
  is("longitudes wrap to the near copy", wrapLon(-179, 179), 181);

  /* jumping to a site must open it and close the camera in */
  const wide = D.getElementById("atlScale").textContent;
  app.atlasGoTo("spruce-pine");
  await new Promise(r => setTimeout(r, 500));
  is("jumping opens the site", D.querySelector("#atlPanel .atl__pn")?.textContent, "Spruce Pine");
  const near = D.getElementById("atlScale").textContent;
  const km = t => (/thousand/.test(t) ? 1000 : 1) * parseFloat(t);
  checks.push({ label: "jumping closes the camera in", ok: km(near) < km(wide) / 20 && km(near) > 0,
                actual: `${wide} → ${near}`, expected: "a much tighter view" });
  checks.push({ label: "the world view shows a world", ok: km(wide) > 20000,
                actual: wide + " across", expected: "over 20,000 km" });

  /* Fly the long way round and back. The rings are drawn once, at their
     true longitude, so the camera must never wander into a copy of the
     world where they are not — which is what happens if you let it chase
     a site westward past the antimeridian. */
  for (const id of ["hsinchu", "spruce-pine", "veldhoven", "abilene", "chitose", "escondida"]) {
    app.atlasGoTo(id);
    await new Promise(r => setTimeout(r, 420));
    const c = camera(), s = AT.sites.find(x => x.id === id);
    const p = project(s.lon, s.lat, c, c.W, c.H);
    const inside = p.x > 0 && p.x < c.W && p.y > 0 && p.y < c.H;
    checks.push({ label: `${id} stays on the stage`, ok: inside && Math.abs(c.lon) <= 180,
                  actual: `camera at ${c.lon.toFixed(1)}°, site at ${p.x.toFixed(0)},${p.y.toFixed(0)} px`,
                  expected: "on stage, camera within ±180°" });
  }

  /* …and the corpus must keep clear of the seam that assumption rests on */
  {
    const near = AT.sites.filter(s => Math.abs(s.lon) > 170).map(s => s.id);
    checks.push({ label: "no site sits on the antimeridian", ok: near.length === 0,
                  actual: near.length ? near.join(", ") : "furthest is " +
                    Math.max(...AT.sites.map(s => Math.abs(s.lon))).toFixed(0) + "°",
                  expected: "all within ±170°" });
  }

  /* a station chip in the panel must open that station */
  app.atlasGoTo("spruce-pine");
  await new Promise(r => setTimeout(r, 420));
  const chip = D.querySelector("#atlPanel [data-station]");
  if (chip) {
    chip.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    is("atlas panel opens stations", D.getElementById("sheet").classList.contains("on"), true);
    app.closeSheet();
  }
}

/* findings that point at the map must land on a real site */
{
  const AT = JSON.parse(fs.readFileSync(path.join(ROOT, "data/static/atlas.json"), "utf8"));
  const sIds = new Set(AT.sites.map(s => s.id));
  const bad = app.notes.all.filter(n => n.atlas && !sIds.has(n.atlas)).map(n => n.id);
  checks.push({ label: "findings link to real atlas sites", ok: bad.length === 0,
                actual: bad.length ? bad.join(", ") : "all resolve", expected: "all resolve" });

  /* the acceptance condition: Spruce Pine is one click from the finding
     that makes it matter */
  app.openStation("hpq");
  const ab = D.querySelector("#shB [data-atlas]");
  is("a finding offers the map", !!ab, true);
  if (ab) {
    ab.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await new Promise(r => setTimeout(r, 500));
    is("it lands on the atlas", D.getElementById("v-atl").classList.contains("on"), true);
    is("…on the right site", D.querySelector("#atlPanel .atl__pn")?.textContent, "Spruce Pine");
  }
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

