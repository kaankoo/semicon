/* ============================================================
   NOTES — findings that cut against the grain.

   Loaded once, indexed by station, stratum and cascade step, so any
   view can ask "is there something surprising here?" and render it
   at the weight the note declares.
   ============================================================ */

import { app } from "./app.js";

let byStation = {}, byStratum = {}, byStep = {}, all = [];

export async function loadNotes() {
  const r = await fetch(new URL("../../data/static/notes.json", import.meta.url));
  if (!r.ok) throw new Error(`Could not load notes.json (${r.status})`);
  const D = await r.json();
  all = D.notes;

  byStation = {}; byStratum = {}; byStep = {};
  all.forEach(n => {
    (n.stations || []).forEach(s => (byStation[s] = byStation[s] || []).push(n));
    (n.strata || []).forEach(s => (byStratum[s] = byStratum[s] || []).push(n));
    if (n.cascadeStep) (byStep[n.cascadeStep] = byStep[n.cascadeStep] || []).push(n);
  });

  /* heaviest first wherever several apply */
  Object.values(byStation).forEach(a => a.sort((x, y) => y.weight - x.weight));
  Object.values(byStratum).forEach(a => a.sort((x, y) => y.weight - x.weight));

  app.notes = { all, forStation, forStratum, forStep, render, renderInline };
  return app.notes;
}

export const forStation = id => byStation[id] || [];
export const forStratum = n => byStratum[n] || [];
export const forStep = id => byStep[id] || [];

/* ---------- rendering ---------- */

/** Full callout. Used in station sheets and on the Method page. */
export function render(n, opts = {}) {
  const cite = n.source && n.source.url
    ? `<a href="${n.source.url}" target="_blank" rel="noopener">${n.source.who} — ${n.source.what} ↗</a>`
    : n.source ? `${n.source.who} — ${n.source.what}` : "";
  return `
    <div class="grain grain--w${n.weight}" data-note="${n.id}">
      <div class="grain__k">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v10M12 17.5v.5"/></svg>
        Against the grain
        <span class="grain__basis">${n.basis}</span>
      </div>
      <div class="grain__top">
        <div class="grain__fig"><b>${n.figure}</b><span>${n.figureNote}</span></div>
        <h4 class="grain__t">${n.title}</h4>
      </div>
      <p class="grain__b">${n.body}</p>
      <p class="grain__s"><b>So what</b> ${n.soWhat}</p>
      ${cite ? `<p class="grain__c">${cite}</p>` : ""}
      ${rulerLink(n)}${atlasLink(n)}${lagLink(n)}
      ${opts.links !== false ? grainLinks(n) : ""}
    </div>`;
}

/** One-line flag. Used inside the Cascade, where space is tight. */
export function renderInline(n) {
  return `
    <button class="grainline" data-noteopen="${n.id}" title="${n.title}">
      <i></i><b>${n.figure}</b><span>${n.title}</span>
    </button>`;
}

function rulerLink(n) {
  if (!n.ruler) return "";
  return `<button class="grain__r" data-ruler="${n.ruler}">See it at true scale →</button>`;
}

function atlasLink(n) {
  if (!n.atlas) return "";
  return `<button class="grain__r grain__r--atl" data-atlas="${n.atlas}">See where it is →</button>`;
}

function lagLink(n) {
  if (!n.timeline) return "";
  return `<button class="grain__r grain__r--tml" data-lag="${n.timeline}">See how long it waited →</button>`;
}

function grainLinks(n) {
  const ids = (n.stations || []).filter(id => app.byId[id]);
  if (!ids.length) return "";
  return `<div class="grain__l">${ids.map(id => {
    const s = app.byId[id];
    return `<button class="cas__st" data-station="${id}" style="--c:${app.col(s.L)}"><b>${app.pad(s.L)}</b>${s.n}</button>`;
  }).join("")}</div>`;
}

/** Wires station chips and inline flags inside a container. */
export function wireNotes(root) {
  root.querySelectorAll("[data-station]").forEach(b => {
    if (b.dataset.wired) return;
    b.dataset.wired = "1";
    b.addEventListener("click", () => app.openStation(b.dataset.station));
  });
  root.querySelectorAll("[data-ruler]").forEach(b => {
    if (b.dataset.wired) return;
    b.dataset.wired = "1";
    b.addEventListener("click", () => {
      app.closeSheet();
      app.show("rul");
      setTimeout(() => app.rulerGoTo(b.dataset.ruler), 60);
    });
  });
  root.querySelectorAll("[data-atlas]").forEach(b => {
    if (b.dataset.wired) return;
    b.dataset.wired = "1";
    b.addEventListener("click", () => {
      app.closeSheet();
      app.show("atl");
      setTimeout(() => app.atlasGoTo(b.dataset.atlas), 60);
    });
  });
  root.querySelectorAll("[data-lag]").forEach(b => {
    if (b.dataset.wired) return;
    b.dataset.wired = "1";
    b.addEventListener("click", () => {
      app.closeSheet();
      app.show("tml");
      setTimeout(() => app.lagGoTo(b.dataset.lag), 60);
    });
  });
  root.querySelectorAll("[data-noteopen]").forEach(b => {
    if (b.dataset.wired) return;
    b.dataset.wired = "1";
    b.addEventListener("click", () => app.showNote(b.dataset.noteopen));
  });
}
