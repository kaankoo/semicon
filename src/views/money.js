/* ============================================================
   MONEY — the stack, priced.

   The Descent's column, re-weighted. Same twenty-seven rows the reader
   has already walked down, sized by capital instead of by station
   count. Recognition plus rearrangement is the whole trick.

   Two things make this honest rather than decorative.

   First, nothing here can invent a number. Every figure comes from
   src/lib/metrics.js, which returns null rather than zero when
   data/live/quotes.json has not been written by the ingest Action. Ship
   this site without ever running the pipeline and the page renders the
   spine — company counts, listed against private, coverage per layer —
   and says plainly that no market data is committed. That is a real
   chart, not a placeholder, and it is replaced the moment prices land.

   Second, coverage is drawn beside every bar. The spine covers 283 of
   527 organisations, unevenly: the Node and Memory layers are complete,
   the Agency layer is a quarter. An aggregate over a quarter of a layer
   is a lower bound and the view is required to say which layers are
   which, because a bar that looks authoritative and is a quarter
   sampled is the easiest lie on the page.
   ============================================================ */

import { app } from "../core/app.js";
import { layerTotals, stratumHHI, coverage, weightsFor, evenWeights, usd, pct } from "../lib/metrics.js";

const GUTTER = 210;
const PAD_R = 150;
const ROW = 21;
const BAR = 13;
const HEAD = 26;

let SP = null, quotes = null, live = null, svg = null;
let cov = {}, metric = "companies", basis = "declared";
let W = 1200, chartW = 900;

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const has = () => !!(quotes && Object.keys(quotes).length);

/* ---------- what each row is worth ---------- */

function series() {
  const out = {};
  if (metric === "mcap" && has()) {
    const t = layerTotals(SP.companies, app.S, quotes, { basis: basis === "even" ? "even" : undefined });
    app.L.forEach(l => { out[l.n] = t.byStratum[l.n] || 0; });
    return { values: out, fmt: usd, label: "aggregate market capitalisation" };
  }
  /* the spine itself — always available, and worth looking at */
  app.L.forEach(l => {
    const w = basis === "even" ? evenWeights : weightsFor;
    let n = 0;
    for (const c of Object.values(SP.companies))
      for (const [st, share] of Object.entries(w(c)))
        if (app.byId[st] && app.byId[st].L === l.n) n += share;
    out[l.n] = n;
  });
  return { values: out, fmt: v => (v == null ? "—" : v.toFixed(1)), label: "companies, attributed" };
}

function kindsAt(stratum) {
  const k = { listed: 0, division: 0, private: 0, body: 0, abstract: 0 };
  for (const c of Object.values(SP.companies))
    if (c.stations.some(s => app.byId[s] && app.byId[s].L === stratum)) k[c.kind]++;
  return k;
}

/* ---------- painting ---------- */

function paint() {
  const { values, fmt, label } = series();
  const max = Math.max(...Object.values(values), 1e-9);
  const H = HEAD + app.L.length * ROW + 12;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("height", H);

  let out = "";
  app.L.slice().reverse().forEach((l, i) => {
    const y = HEAD + i * ROW;
    const v = values[l.n] || 0;
    const w = Math.max(1, (v / max) * chartW);
    const c = cov[l.n] || { share: 0, curated: 0, corpus: 0 };
    const hh = metric === "mcap" && has()
      ? stratumHHI(SP.companies, app.S, quotes, l.n, { basis: basis === "even" ? "even" : undefined })
      : null;

    out += `<g class="mny__r" data-stratum="${l.n}">
      <rect class="mny__hit" x="0" y="${y - 3}" width="${W}" height="${ROW}"/>
      <text class="mny__l" x="${GUTTER - 46}" y="${y + BAR - 3}" text-anchor="end">${esc(l.t)}</text>
      <text class="mny__s" x="${GUTTER - 12}" y="${y + BAR - 3}" text-anchor="end" fill="${l.c}">${app.pad(l.n)}</text>
      <rect class="mny__b" x="${GUTTER}" y="${y}" width="${w.toFixed(1)}" height="${BAR}"
        fill="${l.c}" fill-opacity="${hh != null ? (0.32 + hh * 0.6).toFixed(2) : "0.6"}"/>
      <rect class="mny__cov" x="${GUTTER}" y="${y + BAR + 1}" width="${(chartW * 0.16).toFixed(1)}" height="2" fill="var(--line)"/>
      <rect x="${GUTTER}" y="${y + BAR + 1}" width="${(chartW * 0.16 * c.share).toFixed(1)}" height="2" fill="${l.c}" fill-opacity=".65"/>
      <text class="mny__v" x="${GUTTER + w + 9}" y="${y + BAR - 3}">${fmt(v)}</text>
    </g>`;
  });
  svg.innerHTML = out;
  svg.querySelectorAll(".mny__r").forEach(g =>
    g.addEventListener("click", () => detail(+g.dataset.stratum)));

  document.getElementById("mnyAxis").textContent = label;
  document.querySelectorAll("#mnyMetric button").forEach(b =>
    b.setAttribute("aria-pressed", String(b.dataset.metric === metric)));
  document.querySelectorAll("#mnyBasis button").forEach(b =>
    b.setAttribute("aria-pressed", String(b.dataset.basis === basis)));
}

/* ---------- the panel ---------- */

function detail(n) {
  const l = app.L[n - 1];
  const c = cov[n] || { curated: 0, corpus: 0, share: 0 };
  const k = kindsAt(n);
  const { values, fmt } = series();
  const hh = metric === "mcap" && has()
    ? stratumHHI(SP.companies, app.S, quotes, n, { basis: basis === "even" ? "even" : undefined }) : null;

  const names = Object.values(SP.companies)
    .filter(x => x.stations.some(s => app.byId[s] && app.byId[s].L === n))
    .sort((a, b) => a.name.localeCompare(b.name));

  document.getElementById("mnyPanel").innerHTML = `
    <div class="mny__pk">
      <span style="color:${l.c}">${app.pad(l.n)}</span>
      <b class="mny__fig">${fmt(values[n] || 0)}</b>
      ${hh != null ? `<b class="mny__hhi" title="Herfindahl index on attributed value. 1 is one company holding everything.">HHI ${hh.toFixed(2)}</b>` : ""}
      <button class="flt__prec" data-go="${n}">open this stratum →</button>
    </div>
    <h3 class="atl__pn">${esc(l.t)}</h3>
    <p class="atl__ps">${c.curated} of ${c.corpus} organisations in the spine · ${pct(c.share)} covered</p>
    <p class="atl__pb">${esc(l.a)}</p>
    ${c.share < 0.6 ? `<p class="mny__warn"><b>Thinly covered</b> Only ${pct(c.share)} of the organisations this corpus names at stratum ${app.pad(n)} are in the ticker spine, so any total here is a lower bound rather than a measurement. The gaps are mostly small private companies, which have no market value to add in any case — but the shortfall is real and this is where it is.</p>` : ""}
    <div class="mny__kinds">
      ${[["listed", "listed"], ["division", "divisions"], ["private", "private"], ["body", "institutions"]]
        .filter(([id]) => k[id]).map(([id, lab]) =>
          `<span class="mny__kind mny__kind--${id}"><b>${k[id]}</b>${lab}</span>`).join("")}
    </div>
    <div class="mny__names">${names.map(x => `
      <button class="mny__co mny__co--${x.kind}" data-co="${esc(x.name)}" title="${esc(x.note || "")}">
        ${esc(x.name)}${x.ticker ? `<i>${esc(x.ticker)}</i>` : x.kind === "division" && x.parent ? `<i>via ${esc(x.parent)}</i>` : ""}
      </button>`).join("")}</div>`;

  document.querySelectorAll("#mnyPanel [data-go]").forEach(b =>
    b.addEventListener("click", () => app.go(+b.dataset.go)));
  document.querySelectorAll("#mnyPanel [data-co]").forEach(b =>
    b.addEventListener("click", () => { app.show("idx"); setTimeout(() => app.focusSearch(b.dataset.co), 80); }));
}

/* ---------- the state of the data ---------- */

function status() {
  const el = document.getElementById("mnyStatus");
  const spine = Object.values(SP.companies);
  const listed = spine.filter(c => c.kind === "listed").length;

  if (!has()) {
    el.className = "mny__status mny__status--none";
    el.innerHTML = `
      <p class="mny__sk">No market data is committed</p>
      <p>The ticker spine is built — <b>${spine.length}</b> of ${SP.meta.coverage.corpus} organisations,
         <b>${listed}</b> of them with a primary listing — and nothing has been priced. This page is
         showing the spine itself, which is a real chart and not a placeholder: how many companies each
         layer has, and how much of each layer the spine actually covers.</p>
      <p>Prices arrive on their own. The ingest Action is scheduled for weekday evenings after the US
         close, and the first run it completes will commit a snapshot and replace this notice — nobody
         has to do anything for that to happen. Until one lands, there is nothing here to show.</p>
      <p>No figure on this page will ever be typed by hand. Where a number is not derivable from something
         committed, it stays a dash.</p>`;
    return;
  }

  const stale = Object.values(quotes).filter(q => q.stale).length;
  el.className = `mny__status${stale ? " mny__status--stale" : ""}`;
  el.innerHTML = `
    <p class="mny__sk">Priced ${esc(live.asOf)}</p>
    <p><b>${Object.keys(quotes).length}</b> of ${listed} listed names carry a price.
       ${stale ? `<b class="mny__staleb">${stale} are stale</b> and are showing the last value that was fetched,
        not a current one — the run that should have refreshed them failed and said so.` : "Every one of them is from the latest run."}</p>`;
}

/* ---------- init ---------- */

export async function initMoney() {
  const [rs, rq] = await Promise.all([
    fetch(new URL("../../data/static/companies.json", import.meta.url)),
    fetch(new URL("../../data/live/quotes.json", import.meta.url)).catch(() => null)
  ]);
  if (!rs.ok) throw new Error(`Could not load companies.json (${rs.status})`);
  SP = await rs.json();

  /* the live file is allowed not to exist, and to exist holding nothing:
     between switching the cron on and its first successful run, an empty
     quotes.json is the honest state rather than an error */
  try {
    if (rq && rq.ok) { live = await rq.json(); quotes = live.quotes || {}; }
  } catch { quotes = null; }

  cov = coverage(SP.companies, app.S, app.L);
  metric = has() ? "mcap" : "companies";

  svg = document.getElementById("mnySvg");

  document.getElementById("mnyMetric").innerHTML = `
    <button data-metric="mcap" ${has() ? "" : "disabled title='No market data is committed'"}>Market cap</button>
    <button data-metric="companies">Companies</button>`;
  document.querySelectorAll("#mnyMetric button").forEach(b =>
    b.addEventListener("click", () => { if (b.disabled) return; metric = b.dataset.metric; paint(); }));

  document.getElementById("mnyBasis").innerHTML = `
    <button data-basis="declared">Declared weights</button>
    <button data-basis="even">Even split</button>`;
  document.querySelectorAll("#mnyBasis button").forEach(b =>
    b.addEventListener("click", () => { basis = b.dataset.basis; paint(); }));

  addEventListener("resize", () => { if (document.getElementById("v-mny").classList.contains("on")) size(); });

  app.moneyFit = size;
  app.spine = SP;
  app.quotes = quotes;
  /* the Method page states the vintage of the market data, and this is
     the only view that knows it. Published rather than imported, so the
     two never depend on each other's load order beyond main.js's. */
  app.priced = has() ? { asOf: live?.asOf ?? null, n: Object.keys(quotes).length } : null;

  status();
  size();
  detail(10);
}

function size() {
  const r = svg.getBoundingClientRect();
  W = Math.max(760, r.width || 1200);
  chartW = W - GUTTER - PAD_R;
  paint();
}
