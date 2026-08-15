/* ============================================================
   ROUTER — switching between the top-level views.
   ============================================================ */

import { app } from "./app.js";

let webFitted = false;

/* ---------- depth ----------
   The rail is the site's one persistent sense of where you are in the
   stack, and it used to move only on the Descent. A reader who opened
   Model on the Moat, or EUV on the Lag, was left looking at a rail
   still lit wherever they had last scrolled the homepage — the one
   piece of chrome present on every page, quietly reporting a different
   page's answer.

   Views now report the stratum their current selection sits in, and the
   rail follows whichever view is on. Each view keeps its own depth, so
   switching tabs restores that tab's answer rather than inheriting the
   last one, and a view that has no depth to report leaves the rail
   alone rather than blanking it.

   Registered at module scope rather than inside initRouter, because
   every chart view opens with something already selected and reports it
   while it initialises — which all happens before initRouter runs. */

const depth = {};
let current = "strata";

app.depth = (view, n) => {
  if (!n) return;
  depth[view] = n;
  if (current === view) app.litRail(n);
};

function show(v) {
  current = v;
  if (depth[v]) app.litRail(depth[v]);
  document.querySelectorAll(".view").forEach(e => e.classList.toggle("on", e.id === "v-" + v));
  document.querySelectorAll(".navs button").forEach(b => b.setAttribute("aria-selected", b.dataset.view === v));
  if (v === "idx") setTimeout(() => app.focusSearch(), 60);
  if (v === "web" && !webFitted) { webFitted = true; requestAnimationFrame(() => app.fitWeb()); }
  if (v === "rul") requestAnimationFrame(() => app.rulerFit());
  if (v === "atl") requestAnimationFrame(() => app.atlasFit());
  if (v === "tml") requestAnimationFrame(() => app.lagFit());
  if (v === "flt") requestAnimationFrame(() => app.faultsFit());
  if (v === "moat") requestAnimationFrame(() => app.moatFit());
  if (v !== "strata") window.scrollTo(0, 0);
}

export function initRouter() {
  document.querySelectorAll("[data-view]").forEach(b => b.addEventListener("click", () => show(b.dataset.view)));
  app.show = show;
}
