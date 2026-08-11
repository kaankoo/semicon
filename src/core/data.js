/* ============================================================
   DATA — load the static corpus and build the indexes every
   view depends on.

   strata.json    27 layers        L
   stations.json  131 stations     S
   edges.json     dependency graph E
   ============================================================ */

import { app } from "./app.js";

const base = new URL("../../data/static/", import.meta.url);

async function json(name) {
  const r = await fetch(new URL(name, base));
  if (!r.ok) throw new Error(`Could not load ${name} (${r.status})`);
  return r.json();
}

export async function loadData() {
  const [L, S, E] = await Promise.all([
    json("strata.json"),
    json("stations.json"),
    json("edges.json")
  ]);

  app.L = L;
  app.S = S;
  app.E = E;

  /* ---- indexes ---- */
  const byId = {}, byL = {};
  S.forEach(s => {
    byId[s.i] = s;
    (byL[s.L] = byL[s.L] || []).push(s);
  });
  app.byId = byId;
  app.byL = byL;

  /* ---- helpers ---- */
  app.col = n => L[n - 1].c;
  app.lname = n => L[n - 1].t;
  app.pad = n => String(n).padStart(2, "0");
  app.RM = matchMedia("(prefers-reduced-motion:reduce)").matches;

  /* ---- clean edges: drop anything that does not resolve ---- */
  const UP = {}, DN = {};
  S.forEach(s => { UP[s.i] = []; DN[s.i] = []; });
  Object.keys(E).forEach(k => {
    if (!byId[k]) return;
    E[k].forEach(u => {
      if (byId[u] && u !== k) { UP[k].push(u); DN[u].push(k); }
    });
  });
  app.UP = UP;
  app.DN = DN;

  return app;
}
