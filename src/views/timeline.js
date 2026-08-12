/* ============================================================
   LAG — the distance between working and shipping.

   Every capability gets one bar: left end the year it first worked,
   right end the year it arrived in volume. Nothing else is drawn,
   because the length of that bar is the entire argument.

   Unlike the Ruler and the Atlas this view has no camera. Eighty-one
   years fit across a screen at seventeen pixels each, so the year axis
   is fixed and the chart simply is as tall as it needs to be. What
   moves instead is the scrubber: a year handle that walks the stack
   forward, filling bars as they land and lighting strata as capability
   arrives in them. A bar caught mid-wait is drawn only as far as the
   handle — you watch the gaps open before you watch them close.
   ============================================================ */

import { app } from "../core/app.js";

const GUTTER = 216;    // pixels of label before the axis starts
const PAD_R = 26;
const ROW = 15;
const BAR = 7;
const HEAD = 40;       // year axis strip

const REASON_COLOUR = {
  unsolved: "var(--mag)", tooling: "var(--ind)", economics: "var(--cu)",
  scale: "var(--pls)", demand: "var(--brs)"
};

let D = null, events = [], svg = null;
let W = 1200, chartW = 960;
let year = 2026, playing = null, focused = null;
let layers = { reason: false, long: false, sortLag: false };

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const lagOf = e => (e.shipped == null ? null : e.shipped - e.invented);

/* ---------- the claim ----------
   Exported so the smoke test can reconcile the rendered sentence
   against the corpus rather than against itself. */

export function stats(data = D) {
  const E = data.events, shipped = E.filter(e => e.shipped != null);
  const med = a => {
    const s = a.slice().sort((x, y) => x - y);
    return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
  };
  const band = (lo, hi) => {
    const g = shipped.filter(e => e.stratum >= lo && e.stratum <= hi);
    return { n: g.length, median: med(g.map(e => e.shipped - e.invented)) };
  };
  const long = shipped.filter(e => e.shipped - e.invented >= 30);
  return {
    total: E.length,
    shipped: shipped.length,
    open: E.length - shipped.length,
    median: med(shipped.map(e => e.shipped - e.invented)),
    deep: band(1, 9), middle: band(10, 16), shallow: band(17, 27),
    long: long.length,
    longUnsolved: long.filter(e => e.waitedFor === "unsolved").length
  };
}

/** How much of the stack existed in a given year. */
export function landedBy(y, data = D) {
  const strata = {};
  for (const e of data.events) {
    const s = (strata[e.stratum] = strata[e.stratum] || { n: 0, in: 0 });
    s.n++;
    if (e.shipped != null && e.shipped <= y) s.in++;
  }
  const lit = Object.values(strata).filter(s => s.in > 0).length;
  return { strata, lit, of: Object.keys(strata).length };
}

/* ---------- geometry ---------- */

const x = y => GUTTER + ((y - D.meta.span[0]) / (D.meta.span[1] - D.meta.span[0])) * chartW;

function ordered() {
  const list = events.slice();
  if (layers.sortLag) {
    return list.sort((a, b) => {
      const la = lagOf(a), lb = lagOf(b);
      if (la == null && lb == null) return a.invented - b.invented;
      if (la == null) return -1;              // unfinished waits sit at the top
      if (lb == null) return 1;
      return lb - la;
    });
  }
  return list.sort((a, b) => a.stratum - b.stratum || a.invented - b.invented);
}

/* ---------- painting ---------- */

function colourOf(e) {
  if (layers.reason) return REASON_COLOUR[e.waitedFor] || "var(--ash)";
  return app.col(e.stratum);
}

function paint() {
  const rows = ordered();
  const H = HEAD + rows.length * ROW + 16;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("height", H);

  /* --- year axis --- */
  let ax = "";
  const [y0, y1] = D.meta.span;
  for (let y = Math.ceil(y0 / 10) * 10; y <= y1; y += 10) {
    ax += `<line class="tml__grid" x1="${x(y)}" y1="${HEAD - 12}" x2="${x(y)}" y2="${H - 10}"/>`;
    ax += `<text class="tml__tick" x="${x(y)}" y="${HEAD - 18}" text-anchor="middle">${y}</text>`;
  }
  ax += `<line class="tml__now" x1="${x(D.meta.now)}" y1="${HEAD - 16}" x2="${x(D.meta.now)}" y2="${H - 10}"/>`;
  ax += `<text class="tml__nowt" x="${x(D.meta.now) + 5}" y="${HEAD - 18}">now</text>`;

  /* the scrubber's own line, so the eye can follow it down the chart */
  ax += `<line class="tml__head" x1="${x(year)}" y1="${HEAD - 16}" x2="${x(year)}" y2="${H - 10}"/>`;

  /* --- rows --- */
  let out = "";
  rows.forEach((e, i) => {
    const yTop = HEAD + i * ROW;
    const cy = yTop + ROW / 2;
    const c = colourOf(e);
    const lag = lagOf(e);
    const clamped = e.invented < y0;

    const started = e.invented <= year;
    const landed = e.shipped != null && e.shipped <= year;
    /* an unfinished wait is not a short one — it is a long one still
       running, so the long-wait filter keeps it rather than dimming it */
    const dim = layers.long && lag != null && lag < 30;

    const x0 = Math.max(GUTTER, x(e.invented));
    const xEnd = e.shipped == null ? x(D.meta.now) : x(e.shipped);
    const xNow = Math.min(xEnd, x(year));

    out += `<g class="tml__r${focused === e.id ? " on" : ""}" data-id="${e.id}"
              opacity="${!started ? 0.13 : dim ? 0.22 : 1}">
              <rect class="tml__hit" x="0" y="${yTop}" width="${W}" height="${ROW}"/>`;

    /* label gutter */
    out += `<text class="tml__l" x="${GUTTER - 12}" y="${cy + 3.5}" text-anchor="end">${esc(e.label)}</text>
            <rect class="tml__pip" x="8" y="${cy - 4}" width="4" height="8" fill="${app.col(e.stratum)}"/>
            <text class="tml__s" x="20" y="${cy + 3.5}">${app.pad(e.stratum)}</text>`;

    if (started) {
      /* the full span, faint — what the wait will turn out to have been */
      out += `<rect class="tml__track" x="${x0}" y="${cy - BAR / 2}"
                width="${Math.max(1, xEnd - x0)}" height="${BAR}" fill="${c}"/>`;
      /* and the part of it the scrubber has reached */
      out += `<rect class="tml__fill" x="${x0}" y="${cy - BAR / 2}"
                width="${Math.max(1, xNow - x0)}" height="${BAR}" fill="${c}"/>`;

      if (clamped)
        out += `<path class="tml__cap" d="M${x0} ${cy - BAR / 2 - 2}l-7 ${BAR / 2 + 2}l7 ${BAR / 2 + 2}z" fill="${c}"/>`;

      if (e.shipped == null) {
        /* no right-hand end, because there is no date and none is being guessed */
        out += `<path class="tml__open" d="M${xEnd} ${cy}h14m-4 -4l4 4l-4 4" stroke="${c}"/>`;
      } else if (landed) {
        out += `<rect class="tml__land" x="${xEnd - 1.5}" y="${cy - BAR / 2 - 3}" width="3" height="${BAR + 6}" fill="${c}"/>`;
      }

      if (lag != null && (landed || !layers.long))
        out += `<text class="tml__y" x="${xEnd + 8}" y="${cy + 3.5}" fill="${c}">${lag}</text>`;
    }
    out += `</g>`;
  });

  svg.innerHTML = ax + out;
  svg.querySelectorAll(".tml__r").forEach(g =>
    g.addEventListener("click", () => detail(g.dataset.id)));

  strip();
}

/* ---------- the strata strip ---------- */

function strip() {
  const { strata, lit, of } = landedBy(year);
  document.getElementById("tmlStrip").innerHTML = app.L.map(l => {
    const s = strata[l.n];
    const frac = s ? s.in / s.n : 0;
    return `<i title="${app.pad(l.n)} ${esc(l.t)} — ${s ? s.in : 0} of ${s ? s.n : 0} landed by ${year}"
              style="--c:${l.c};opacity:${(0.1 + frac * 0.9).toFixed(2)}"></i>`;
  }).join("");
  document.getElementById("tmlYear").textContent = year;
  document.getElementById("tmlLit").innerHTML =
    `<b>${lit}</b> of <b>${of}</b> strata had something working`;
}

/* ---------- the panel ---------- */

function detail(id) {
  const e = events.find(v => v.id === id);
  if (!e) return;
  focused = id;
  const st = app.byId[e.station];
  const conf = (D.meta.confidence || []).find(c => c.id === e.confidence);
  const why = (D.meta.waitedFor || []).find(c => c.id === e.waitedFor);
  const lag = lagOf(e);

  document.getElementById("tmlPanel").innerHTML = `
    <div class="tml__pk">
      <span>${e.invented}${e.shipped == null ? " → not shipped" : ` → ${e.shipped}`}</span>
      ${lag == null ? `<b class="tml__lag tml__lag--open">no end date</b>`
                    : `<b class="tml__lag">${lag} year${lag === 1 ? "" : "s"}</b>`}
      <b class="tml__conf tml__conf--${e.confidence}" title="${esc(conf ? conf.note : "")}">${conf ? conf.label : e.confidence}</b>
    </div>
    <h3 class="atl__pn">${esc(e.label)}</h3>
    <p class="atl__ps">${app.pad(e.stratum)} · ${esc(app.lname(e.stratum))}${e.invented < D.meta.span[0] ? ` · demonstrated in ${e.invented}, before this chart begins` : ""}</p>
    <p class="atl__pb">${esc(e.note)}</p>
    ${why ? `<p class="atl__pr"><i style="background:${REASON_COLOUR[e.waitedFor]}"></i>
      <b>Waited for ${esc(why.label.toLowerCase())}</b> ${esc(why.note)}</p>` : ""}
    ${e.source ? `<p class="cas__cite">${e.source.url
      ? `<a href="${e.source.url}" target="_blank" rel="noopener">${esc(e.source.who)} — ${esc(e.source.what)} ↗</a>`
      : `${esc(e.source.who)} — ${esc(e.source.what)}`}</p>` : ""}
    ${st ? `<div class="atl__pl"><button class="cas__st" data-station="${e.station}" style="--c:${app.col(st.L)}">
      <b>${app.pad(st.L)}</b>${esc(st.n)}</button></div>` : ""}`;

  const b = document.querySelector("#tmlPanel [data-station]");
  if (b) b.addEventListener("click", () => app.openStation(b.dataset.station));
  paint();
}

/** Jump to an event and open it. The action other views call. */
function goTo(id) {
  const e = events.find(v => v.id === id);
  if (!e) return;
  setYear(D.meta.now);
  detail(id);
  document.querySelector(`#tmlSvg [data-id="${id}"]`)?.scrollIntoView({ block: "center", behavior: app.RM ? "auto" : "smooth" });
}

/* ---------- controls ---------- */

function setYear(y) {
  year = Math.max(D.meta.span[0], Math.min(D.meta.now, Math.round(y)));
  document.getElementById("tmlRange").value = String(year);
  paint();
}

function play() {
  if (playing) { stop(); return; }
  if (year >= D.meta.now) setYear(D.meta.span[0]);
  document.getElementById("tmlPlay").textContent = "Pause";
  playing = setInterval(() => {
    if (year >= D.meta.now) { stop(); return; }
    setYear(year + 1);
  }, app.RM ? 10 : 90);
}

function stop() {
  clearInterval(playing);
  playing = null;
  const b = document.getElementById("tmlPlay");
  if (b) b.textContent = "Sweep 1947 → now";
}

const LAYERS = [
  ["reason", "What it waited for", "Colour by what the capability was actually waiting on, rather than by stratum."],
  ["long", "Only the long waits", "Dim everything that shipped within thirty years of first working."],
  ["sortLag", "Sort by wait", "Reorder longest wait first, instead of by depth in the stack."]
];

function syncLayers() {
  document.querySelectorAll("#tmlLayers button").forEach(b =>
    b.setAttribute("aria-pressed", String(!!layers[b.dataset.layer])));
  document.getElementById("tmlLegend").innerHTML = layers.reason
    ? (D.meta.waitedFor || []).map(r =>
        `<span><i style="background:${REASON_COLOUR[r.id]}"></i>${esc(r.label)}</span>`).join("")
    : `<span style="color:#4C5A7C">Colour follows the stratum each capability belongs to</span>`;
  paint();
}

function claim() {
  const s = stats();
  document.getElementById("tmlClaim").innerHTML = `
    <button id="tmlClaimBtn">
      Median wait: <b>${s.deep.median}</b> years from rock to package,
      <b>${s.middle.median}</b> through silicon, <b>${s.shallow.median}</b> from software to sentence ·
      of the <b>${s.long}</b> that waited thirty years or more, <b>${s.longUnsolved}</b> were waiting on the science
    </button>`;
  document.getElementById("tmlClaimBtn").addEventListener("click", () => {
    layers.long = true; layers.sortLag = true; layers.reason = true;
    syncLayers();
  });
}

/* ---------- init ---------- */

export async function initTimeline() {
  const r = await fetch(new URL("../../data/static/timeline.json", import.meta.url));
  if (!r.ok) throw new Error(`Could not load timeline.json (${r.status})`);
  D = await r.json();
  events = D.events;
  year = D.meta.now;

  svg = document.getElementById("tmlSvg");

  document.getElementById("tmlLayers").innerHTML = LAYERS
    .map(([id, label, help]) => `<button data-layer="${id}" title="${esc(help)}" aria-pressed="false">${label}</button>`)
    .join("");
  document.querySelectorAll("#tmlLayers button").forEach(b =>
    b.addEventListener("click", () => { layers[b.dataset.layer] = !layers[b.dataset.layer]; syncLayers(); }));

  const range = document.getElementById("tmlRange");
  range.min = String(D.meta.span[0]);
  range.max = String(D.meta.now);
  range.step = "1";
  range.value = String(year);
  range.addEventListener("input", () => { stop(); setYear(+range.value); });

  document.getElementById("tmlPlay").addEventListener("click", play);

  addEventListener("keydown", e => {
    if (!document.getElementById("v-tml").classList.contains("on")) return;
    if (e.target.tagName === "INPUT") return;
    if (e.key === "ArrowRight") { stop(); setYear(year + 1); e.preventDefault(); }
    if (e.key === "ArrowLeft") { stop(); setYear(year - 1); e.preventDefault(); }
  });

  addEventListener("resize", () => { if (document.getElementById("v-tml").classList.contains("on")) size(); });

  app.lagGoTo = goTo;
  app.lagFit = size;

  claim();
  syncLayers();
  size();
  detail("euv");
}

function size() {
  const r = svg.getBoundingClientRect();
  W = Math.max(720, r.width || 1200);
  chartW = W - GUTTER - PAD_R;
  paint();
}
