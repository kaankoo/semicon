/* ============================================================
   RULER — seventeen orders of magnitude, drawn to true scale.

   One camera value, z = log₁₀(metres), drives everything. An object
   of size d metres sits at horizontal offset (log₁₀d − z) decades from
   centre and is drawn REF × 10^(log₁₀d − z) pixels across. So an object
   one decade smaller than the current scale really is drawn a tenth
   the size. Nothing here is schematic about proportion — only about
   shape.
   ============================================================ */

import { app } from "../core/app.js";
import { drawGlyph } from "../lib/glyphs.js";

const NS = "http://www.w3.org/2000/svg";
const PX_DECADE = 300;   // horizontal pixels per power of ten
const REF = 190;         // pixels an object measures when centred
const MIN_PX = 1.1;      // below this it is not worth drawing
const MAX_PX = 1500;     // above this it has swallowed the screen

/* SI ladder for the readout */
const SI = [
  [-12, "pm"], [-9, "nm"], [-6, "µm"], [-3, "mm"], [0, "m"], [3, "km"], [6, "Mm"]
];

let D = null, svg = null, gWorld = null, gAxis = null;
let z = -9.3, target = -9.3, raf = null, dragging = null;
let objects = [];
let W = 1200, H = 560;

/* ---------- formatting ---------- */

function metres(v) {
  const e = Math.floor(Math.log10(Math.abs(v)));
  let [exp, unit] = SI[0];
  for (const [x, u] of SI) if (e >= x) { exp = x; unit = u; }
  const n = v / Math.pow(10, exp);
  const s = n >= 100 ? n.toFixed(0) : n >= 10 ? n.toFixed(1) : n >= 1 ? n.toFixed(2) : n.toFixed(3);
  return `${s.replace(/\.?0+$/, "")} ${unit}`;
}

function decadeLabel(e) {
  let [exp, unit] = SI[0];
  for (const [x, u] of SI) if (e >= x) { exp = x; unit = u; }
  const n = Math.pow(10, e - exp);
  return `${n >= 1000 ? n.toExponential(0) : n} ${unit}`;
}

/* ---------- camera ---------- */

const clamp = v => Math.max(D.meta.span[0], Math.min(D.meta.span[1], v));

function glide(to) {
  target = clamp(to);
  if (raf) return;
  const step = () => {
    const d = target - z;
    if (Math.abs(d) < 1e-4) { z = target; raf = null; paint(); return; }
    z += d * (app.RM ? 1 : 0.16);
    paint();
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
}

function jump(to) { if (raf) { cancelAnimationFrame(raf); raf = null; } glide(to); }

/* ---------- painting ---------- */

/** Where an object sits and how big it is, at the current camera. */
export function place(o, zNow = z) {
  const rel = o.lg - zNow;                       // decades from the camera
  const px = REF * Math.pow(10, rel);
  const x = W / 2 + rel * PX_DECADE;
  let op = 1;
  if (px < MIN_PX * 6) op = Math.max(0, (px - MIN_PX) / (MIN_PX * 5));
  if (px > MAX_PX * 0.55) op = Math.max(0, 1 - (px - MAX_PX * 0.55) / (MAX_PX * 0.45));
  const visible = px >= MIN_PX && px <= MAX_PX && x > -px && x < W + px;
  return { rel, px, x, op, visible };
}

function paint() {
  /* --- axis --- */
  let ax = "";
  const from = Math.ceil(z - W / 2 / PX_DECADE), to = Math.floor(z + W / 2 / PX_DECADE);
  for (let e = from; e <= to; e++) {
    const x = W / 2 + (e - z) * PX_DECADE;
    const major = ((e % 3) + 3) % 3 === 0;   // SI prefix boundaries
    ax += `<line x1="${x}" y1="${H - 34}" x2="${x}" y2="${H - (major ? 20 : 27)}"
             stroke="var(--line2)" stroke-width="1" stroke-opacity="${major ? 1 : .55}"/>`;
    ax += `<text class="rul__tick${major ? " rul__tick--m" : ""}" x="${x}" y="${H - 8}"
             text-anchor="middle">${decadeLabel(e)}</text>`;
  }
  ax += `<line x1="0" y1="${H - 34}" x2="${W}" y2="${H - 34}" stroke="var(--line)" stroke-width="1"/>`;
  ax += `<path d="M${W / 2} ${H - 44}l5 9h-10z" fill="var(--pls)"/>`;
  gAxis.innerHTML = ax;

  /* --- objects --- */
  let out = "";
  let focal = null, best = Infinity;
  for (const o of objects) {
    const p = place(o);
    if (!p.visible) continue;
    const d = Math.abs(p.rel);
    if (d < best) { best = d; focal = o; }

    const s = p.px / 100;
    const lift = 26 + o.slot * 30;
    const cy = (H - 60) / 2 + (o.slot % 2 ? lift * 0.34 : -lift * 0.34);

    out += `<g class="rul__o" data-id="${o.id}" opacity="${p.op.toFixed(3)}"
              transform="translate(${x2(p.x)},${cy})">
              <g transform="translate(${-p.px / 2},${-p.px / 2}) scale(${s})">${o.svg}</g>`;

    /* labels only once the object is big enough to be worth naming */
    if (p.px > 26) {
      const half = p.px / 2;
      out += `<text class="rul__n" x="0" y="${-half - 15}" text-anchor="middle">${esc(o.label)}</text>
              <text class="rul__m" x="0" y="${-half - 3}" text-anchor="middle">${metres(o.m)}</text>`;
    } else if (p.px > 5) {
      out += `<text class="rul__m" x="0" y="${-p.px / 2 - 6}" text-anchor="middle">${metres(o.m)}</text>`;
    }
    out += `</g>`;
  }
  gWorld.innerHTML = out;

  gWorld.querySelectorAll(".rul__o").forEach(g =>
    g.addEventListener("click", () => focus(g.dataset.id)));

  document.getElementById("rulScale").textContent = metres(Math.pow(10, z));
  document.getElementById("rulRange").value = String(z);
  if (focal) detail(focal);
}

const x2 = v => Math.round(v * 100) / 100;
const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

/* ---------- the panel ---------- */

let shown = null;
function detail(o) {
  if (shown === o.id) return;
  shown = o.id;
  const st = o.station && app.byId[o.station] ? app.byId[o.station] : null;
  document.getElementById("rulPanel").innerHTML = `
    <div class="rul__pk">
      <span>${metres(o.m)}</span>
      <b class="rul__prec rul__prec--${o.precision}">${o.precision}</b>
    </div>
    <h3 class="rul__pn">${esc(o.label)}</h3>
    <p class="rul__ps">${esc(o.sub)}</p>
    <p class="rul__pb">${o.note}</p>
    ${o.source ? `<p class="cas__cite">${o.source.url
      ? `<a href="${o.source.url}" target="_blank" rel="noopener">${o.source.who} — ${o.source.what} ↗</a>`
      : `${o.source.who} — ${o.source.what}`}</p>` : ""}
    ${st ? `<button class="cas__st" data-station="${o.station}" style="--c:${app.col(st.L)}">
              <b>${app.pad(st.L)}</b>${st.n}</button>` : ""}`;
  const b = document.querySelector("#rulPanel [data-station]");
  if (b) b.addEventListener("click", () => app.openStation(b.dataset.station));
}

function focus(id) {
  const o = objects.find(x => x.id === id);
  if (o) jump(o.lg);
}

/* ---------- init ---------- */

export async function initRuler() {
  const r = await fetch(new URL("../../data/static/ruler.json", import.meta.url));
  if (!r.ok) throw new Error(`Could not load ruler.json (${r.status})`);
  D = await r.json();

  objects = D.objects
    .map(o => ({ ...o, lg: Math.log10(o.m) }))
    .sort((a, b) => a.lg - b.lg)
    .map((o, i) => ({
      ...o,
      slot: i % 3,
      svg: drawGlyph(o.glyph, app.byId[o.station] ? app.col(app.byId[o.station].L) : "#8FA0C4", o.detail)
    }));

  z = target = objects[0].lg + 0.6;

  svg = document.getElementById("rulSvg");
  gWorld = document.createElementNS(NS, "g");
  gAxis = document.createElementNS(NS, "g");
  svg.appendChild(gWorld);
  svg.appendChild(gAxis);

  /* stops along the ruler, one per named decade group */
  const stops = [
    ["Lattice", -9.3], ["Litho", -7.8], ["Optics", -6.3], ["Bonding", -5.1],
    ["Sand", -3.3], ["Die", -1.5], ["Wafer", -0.5], ["Rack", 0.4],
    ["Fab", 2.3], ["Island", 5.6], ["Earth", 7.1]
  ];
  document.getElementById("rulStops").innerHTML = stops
    .map(([l, v]) => `<button data-z="${v}">${l}</button>`).join("");
  document.querySelectorAll("#rulStops button").forEach(b =>
    b.addEventListener("click", () => jump(+b.dataset.z)));

  const range = document.getElementById("rulRange");
  range.min = String(D.meta.span[0]);
  range.max = String(D.meta.span[1]);
  range.step = "0.01";
  range.addEventListener("input", () => { if (raf) { cancelAnimationFrame(raf); raf = null; } z = target = +range.value; paint(); });

  svg.addEventListener("wheel", e => {
    e.preventDefault();
    const d = (Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX);
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    z = target = clamp(z + d * 0.0016);
    paint();
  }, { passive: false });

  svg.addEventListener("pointerdown", e => {
    dragging = { x: e.clientX, z };
    svg.setPointerCapture(e.pointerId);
    svg.classList.add("drag");
  });
  svg.addEventListener("pointermove", e => {
    if (!dragging) return;
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    z = target = clamp(dragging.z - (e.clientX - dragging.x) / PX_DECADE);
    paint();
  });
  const stop = () => { dragging = null; svg.classList.remove("drag"); };
  svg.addEventListener("pointerup", stop);
  svg.addEventListener("pointercancel", stop);

  addEventListener("keydown", e => {
    if (!document.getElementById("v-rul").classList.contains("on")) return;
    if (e.target.tagName === "INPUT") return;
    if (e.key === "ArrowRight") { glide(target + 0.5); e.preventDefault(); }
    if (e.key === "ArrowLeft") { glide(target - 0.5); e.preventDefault(); }
  });

  addEventListener("resize", () => { if (document.getElementById("v-rul").classList.contains("on")) size(); });

  app.rulerGoTo = focus;
  app.rulerFit = size;
  size();
}

function size() {
  const r = svg.getBoundingClientRect();
  W = Math.max(360, r.width || 1200);
  H = Math.max(380, r.height || 560);
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  shown = null;
  paint();
}
