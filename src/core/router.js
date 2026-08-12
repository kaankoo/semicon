/* ============================================================
   ROUTER — switching between the top-level views.
   ============================================================ */

import { app } from "./app.js";

let webFitted = false;

function show(v) {
  document.querySelectorAll(".view").forEach(e => e.classList.toggle("on", e.id === "v-" + v));
  document.querySelectorAll(".navs button").forEach(b => b.setAttribute("aria-selected", b.dataset.view === v));
  if (v === "idx") setTimeout(() => app.focusSearch(), 60);
  if (v === "web" && !webFitted) { webFitted = true; requestAnimationFrame(() => app.fitWeb()); }
  if (v === "rul") requestAnimationFrame(() => app.rulerFit());
  if (v === "atl") requestAnimationFrame(() => app.atlasFit());
  if (v === "tml") requestAnimationFrame(() => app.lagFit());
  if (v !== "strata") window.scrollTo(0, 0);
}

export function initRouter() {
  document.querySelectorAll("[data-view]").forEach(b => b.addEventListener("click", () => show(b.dataset.view)));
  app.show = show;
}
