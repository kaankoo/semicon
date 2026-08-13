/* ============================================================
   FAULTS — the stack under stress.

   Remove a station, walk the dependency graph downstream, and draw what
   is reachable. The walk is `coneOfAll` from src/lib/graph.js, which is
   the same function the Web lights its supply cones with — the whole
   credibility of this view rests on it being that function rather than
   a copy of it.

   The one thing this view must never do is blur its two voices. Reach
   is arithmetic: these stations depend on the removed one, and that is
   all it says. Reroutes and dead-ends are hand-written judgement about
   what would actually happen, and they are drawn in different colours,
   named in a different tier, and counted separately. The gap between
   them — the unclassified remainder — is left visible on purpose,
   because an exposure map that claims to have classified everything is
   lying.
   ============================================================ */

import { app } from "../core/app.js";
import { coneOfAll } from "../lib/graph.js";

const GUTTER = 208;
const PAD_R = 20;
const ROW = 21;
const CELL = 13;
const HEAD = 26;

const TIER_FILL = {
  removed: "var(--qz)",
  dead: "var(--mag)",
  reroute: "var(--brs)"
};

let D = null, faults = [], svg = null;
let current = null, W = 1200, chartW = 960;

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

/* ---------- the arithmetic ---------- */

/** Everything the fault reaches, and how it has been classified.
 *  Exported so the smoke test can check the rendered numbers against
 *  the graph rather than against the essay. */
export function exposure(f, dn = app.DN) {
  const reach = coneOfAll(f.removes, dn);
  const reroute = new Set(f.reroutes.map(r => r.station));
  const dead = new Set(f.deadEnds.map(d => d.station));
  return {
    reach, reroute, dead,
    n: reach.size,
    unclassified: reach.size - reroute.size - dead.size,
    strata: new Set([...reach].map(id => app.byId[id] && app.byId[id].L)).size
  };
}

export function tierOf(id, f, ex) {
  if (f.removes.includes(id)) return "removed";
  if (ex.dead.has(id)) return "dead";
  if (ex.reroute.has(id)) return "reroute";
  if (ex.reach.has(id)) return "reach";
  return "clear";
}

/** The comparison the page is built on: the fault with the widest reach
 *  against the one that takes longest to route around. */
export function stats(data = D, dn = app.DN) {
  const rows = data.faults.map(f => ({ id: f.id, title: f.title,
    n: exposure(f, dn).n, lead: f.leadTimeYears }));
  const widest = rows.reduce((a, b) => (b.n > a.n ? b : a));
  const slowest = rows.reduce((a, b) => (b.lead > a.lead ? b : a));
  return { rows, widest, slowest, total: app.S.length };
}

/* ---------- painting ---------- */

function paint() {
  const f = current, ex = exposure(f);
  const H = HEAD + app.L.length * ROW + 12;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("height", H);

  let out = "";
  /* Rock at the bottom, as on the Descent and the Web. This view is a
     cross-section, not a list, and a shock in the lithosphere has to be
     seen climbing. */
  const rows = app.L.slice().reverse();
  rows.forEach((l, i) => {
    const y = HEAD + i * ROW;
    const st = app.byL[l.n] || [];
    const hit = st.filter(s => ex.reach.has(s.i) || f.removes.includes(s.i)).length;
    const w = chartW / st.length;

    out += `<text class="flt__l" x="${GUTTER - 44}" y="${y + CELL - 2}" text-anchor="end">${esc(l.t)}</text>
            <text class="flt__n" x="${GUTTER - 12}" y="${y + CELL - 2}" text-anchor="end"
              fill="${hit ? l.c : "#39456B"}">${hit}/${st.length}</text>`;

    st.forEach((s, k) => {
      const tier = tierOf(s.i, f, ex);
      const clear = tier === "clear";
      const fill = TIER_FILL[tier] || l.c;
      /* untouched stations keep their outline so the shape of the stack
         stays legible, but carry no fill — otherwise a row of unaffected
         cells reads as a row of affected ones */
      const paint = clear
        ? `fill="none" stroke="${l.c}" stroke-opacity=".22" stroke-width="1"`
        : `fill="${fill}" fill-opacity="${tier === "reach" ? 0.42 : 0.92}"`;
      out += `<rect class="flt__c flt__c--${tier}" data-id="${s.i}"
                x="${(GUTTER + k * w).toFixed(1)}" y="${y}"
                width="${Math.max(2, w - 2).toFixed(1)}" height="${CELL}"
                ${paint}><title>${esc(s.n)} — ${
                  tier === "removed" ? "removed" : tier === "dead" ? "dead-end" :
                  tier === "reroute" ? "reroutes" : tier === "reach" ? "downstream" : "not downstream"
                }</title></rect>`;
    });
  });
  svg.innerHTML = out;
  svg.querySelectorAll(".flt__c").forEach(c =>
    c.addEventListener("click", () => app.openStation(c.dataset.id)));

  document.getElementById("fltCount").innerHTML =
    `<b>${ex.n}</b> of ${app.S.length} stations downstream, across <b>${ex.strata}</b> strata ·
     <em class="flt__k flt__k--reroute">${ex.reroute.size} reroute</em>
     <em class="flt__k flt__k--dead">${ex.dead.size} dead-end</em>
     <em class="flt__k flt__k--reach">${ex.unclassified} unclassified</em>`;
}

/* ---------- the panel ---------- */

function chip(id) {
  const s = app.byId[id];
  if (!s) return "";
  return `<button class="cas__st" data-station="${id}" style="--c:${app.col(s.L)}"><b>${app.pad(s.L)}</b>${esc(s.n)}</button>`;
}

/** A lead time drawn against the same years the Lag chart uses, so a
 *  qualification period can be compared with a substitution that has
 *  already happened rather than taken on trust. */
function leadBar(years, max = 12) {
  const pct = Math.min(100, (years / max) * 100);
  return `<span class="flt__lead"><i style="width:${pct.toFixed(0)}%"></i><b>${
    years === 0 ? "already exists" : `${years} yr${years === 1 ? "" : "s"}`}</b></span>`;
}

function detail(f) {
  current = f;
  const ex = exposure(f);
  const maxLead = Math.max(12, f.leadTimeYears, ...f.reroutes.map(r => r.leadTimeYears || 0));

  document.getElementById("fltPanel").innerHTML = `
    <div class="flt__pk">
      <span>Exposure map</span>
      <b class="flt__hl">${f.leadTimeYears} year${f.leadTimeYears === 1 ? "" : "s"} to a substitute at volume</b>
      ${f.precedent ? `<button class="flt__prec" data-lag="${f.precedent}">precedent on the Lag chart →</button>` : ""}
    </div>
    <h3 class="atl__pn">${esc(f.title)}</h3>
    <p class="atl__ps">removing ${f.removes.map(id => esc(app.byId[id] ? app.byId[id].n : id)).join(" · ")}</p>
    <p class="atl__pb">${f.essay}</p>
    ${f.granularity ? `<p class="flt__gran"><b>What this actually removes</b> ${esc(f.granularity)}</p>` : ""}

    ${f.reroutes.length ? `
      <h4 class="flt__h flt__h--reroute">Reroutes <span>${f.reroutes.length} · declared, not derived</span></h4>
      <div class="flt__list">${f.reroutes.map(r => `
        <div class="flt__item">
          <div class="flt__ihead">${chip(r.station)}${leadBar(r.leadTimeYears, maxLead)}</div>
          <p>${esc(r.how)}</p>
          ${r.timeline ? `<button class="flt__prec" data-lag="${r.timeline}">it happened before →</button>` : ""}
          ${r.source ? `<p class="cas__cite">${r.source.url
            ? `<a href="${r.source.url}" target="_blank" rel="noopener">${esc(r.source.who)} — ${esc(r.source.what)} ↗</a>`
            : `${esc(r.source.who)} — ${esc(r.source.what)}`}</p>` : ""}
        </div>`).join("")}</div>` : ""}

    ${f.deadEnds.length ? `
      <h4 class="flt__h flt__h--dead">Dead-ends <span>${f.deadEnds.length} · declared, not derived</span></h4>
      <div class="flt__list">${f.deadEnds.map(d => `
        <div class="flt__item flt__item--dead">
          <div class="flt__ihead">${chip(d.station)}</div>
          <p>${esc(d.why)}</p>
        </div>`).join("")}</div>` : `
      <h4 class="flt__h flt__h--none">No dead-ends declared <span>everything downstream has a route, however slow</span></h4>`}

    <p class="flt__unc">${ex.unclassified} of the ${ex.n} stations downstream are <b>not classified either way</b>.
      That is not an oversight — it is the honest size of what this reading does not claim to know.</p>

    ${f.source ? `<p class="cas__cite">${f.source.url
      ? `<a href="${f.source.url}" target="_blank" rel="noopener">${esc(f.source.who)} — ${esc(f.source.what)} ↗</a>`
      : `${esc(f.source.who)} — ${esc(f.source.what)}`}</p>` : ""}`;

  document.querySelectorAll("#fltPanel [data-station]").forEach(b =>
    b.addEventListener("click", () => app.openStation(b.dataset.station)));
  document.querySelectorAll("#fltPanel [data-lag]").forEach(b =>
    b.addEventListener("click", () => { app.show("tml"); setTimeout(() => app.lagGoTo(b.dataset.lag), 60); }));

  document.querySelectorAll("#fltPicks button").forEach(b =>
    b.setAttribute("aria-pressed", String(b.dataset.fault === f.id)));
  paint();
}

/** Open a scenario. The action other views call. */
function goTo(id) {
  const f = faults.find(x => x.id === id);
  if (f) detail(f);
}

/* ---------- the claim ---------- */

function claim() {
  const s = stats();
  document.getElementById("fltClaim").innerHTML = `
    <button id="fltClaimBtn">
      Reach is not damage. The widest blast radius here — <b>${s.widest.n}</b> of ${s.total} stations —
      routes around itself in <b>${s.widest.lead}</b> years, and already did once.
      The one that takes <b>${s.slowest.lead}</b> reaches <b>${s.slowest.n}</b>.
    </button>`;
  document.getElementById("fltClaimBtn").addEventListener("click", () => goTo(s.slowest.id));
}

/* ---------- init ---------- */

export async function initFaults() {
  const r = await fetch(new URL("../../data/static/counterfactuals.json", import.meta.url));
  if (!r.ok) throw new Error(`Could not load counterfactuals.json (${r.status})`);
  D = await r.json();
  faults = D.faults;

  svg = document.getElementById("fltSvg");

  document.getElementById("fltPicks").innerHTML = faults
    .map(f => `<button data-fault="${f.id}" aria-pressed="false" title="${esc(f.sub)}">${esc(f.title)}</button>`)
    .join("");
  document.querySelectorAll("#fltPicks button").forEach(b =>
    b.addEventListener("click", () => goTo(b.dataset.fault)));

  document.getElementById("fltLegend").innerHTML = (D.meta.tiers || [])
    .map(t => `<span title="${esc(t.note)}"><i class="flt__sw flt__sw--${t.id}"></i>${esc(t.label)}</span>`)
    .join("");

  addEventListener("resize", () => { if (document.getElementById("v-flt").classList.contains("on")) size(); });

  app.faultsGoTo = goTo;
  app.faultsFit = size;

  claim();
  size();
  detail(faults.find(f => f.id === "taiwan") || faults[0]);
}

function size() {
  const r = svg.getBoundingClientRect();
  W = Math.max(720, r.width || 1200);
  chartW = W - GUTTER - PAD_R;
  if (current) paint();
}
