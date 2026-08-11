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
