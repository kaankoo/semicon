/* ============================================================
   TOUR — the guided descent, one stratum at a time.
   ============================================================ */

import { app } from "../core/app.js";

let tour, ti = -1;

function tourGo(n) {
  const { L, byL, pad } = app;
  ti = Math.max(0, Math.min(L.length - 1, n));
  const l = L[ti];
  tour.style.setProperty("--c", l.c);
  document.getElementById("tK").textContent = "Stratum " + pad(l.n) + " of " + pad(L.length);
  document.getElementById("tC").textContent = (byL[l.n] || []).length + " stations";
  document.getElementById("tN").textContent = l.t;
  document.getElementById("tP").textContent = l.a;
  document.getElementById("tBar").style.width = ((ti + 1) / L.length * 100) + "%";
  tour.classList.add("on");
  app.go(l.n);
}

function tourStop() {
  tour.classList.remove("on");
  ti = -1;
}

export function initTour() {
  tour = document.getElementById("tour");

  document.getElementById("btnTour").addEventListener("click", () => ti < 0 ? tourGo(0) : tourStop());
  document.getElementById("ctaTour").addEventListener("click", () => tourGo(0));
  document.getElementById("tNext").addEventListener("click", () => ti >= app.L.length - 1 ? tourStop() : tourGo(ti + 1));
  document.getElementById("tPrev").addEventListener("click", () => tourGo(ti - 1));
  document.getElementById("tEnd").addEventListener("click", tourStop);

  app.tourStop = tourStop;
}
