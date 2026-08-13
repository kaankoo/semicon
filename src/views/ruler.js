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

/* Spacing, and the one ratio that decides whether this view works.

   Two things fight. An object Δ decades along is drawn 10^Δ times the
   size of this one — that is the whole claim of the page and it is not
   negotiable — while the gap between them on screen is only Δ × the
   pixels-per-decade. So the shapes grow exponentially with Δ and the
   spacing grows linearly, and past some Δ the neighbour always wins.

   Setting them back to back means Δ·PX_DECADE ≥ (REF/2)(1 + 10^Δ), or

       PX_DECADE / REF ≥ (1 + 10^Δ) / 2Δ

   which bottoms out at 4.13 around Δ = 0.57 and climbs steeply either
   side. The corpus averages half a decade between neighbours, so 4.13
   is the floor worth clearing. It used to be 300/190 = 1.6 — a third of
   what it needed — which is why everything sat on top of everything
   else however far apart the vertical tracks were pulled. No amount of
   stagger fixes a horizontal ratio that is out by a factor of three.

   4.31 here, which sets neighbours between about 0.45 and 0.7 decades
   apart properly back to back. Closer pairs than that still overlap and
   always will: three entries sit between 500 µm and 800 µm, and
   separating those would need a ratio near 6.5 and put barely one
   decade on the stage. The tracks are what carry those clusters.

   The cost is paid where it should be — about 2.4 decades across the
   stage instead of 5, so five or six objects at a time rather than a
   crowd. That is the right trade for a ruler whose job is comparing two
   or three things properly, not a contact sheet.                     */
const PX_DECADE = 560;   // horizontal pixels per power of ten
const REF = 130;         // pixels an object measures when centred
const MIN_PX = 1.1;      // below this it is not worth drawing
/* An object much above the camera scale is a wash of colour across the
   whole stage with its neighbours somewhere underneath it. It fades
   from 0.55 of this and is gone at it — which at REF 130 means nothing
   more than about 0.9 decades above the camera is drawn at all. That is
   the same trade as the spacing above, made at the other end. */
const MAX_PX = 1000;

/* Vertical stacking.

   On a true-scale log ruler the object one place along is about three
   times the size of this one, so it will always cover its neighbour if
   the two share a line. Three tracks about 24px apart — what this used
   to do — put every object well inside a shape-height of the next, and
   the ruler read as one pile with a slight tilt. Five tracks across
   most of the stage give each object a lane of its own, and running
   them as a triangle wave rather than a repeating ramp means
   consecutive objects climb and descend in long diagonals with no jump
   where the pattern wraps.

   The taper is the other half of it. An object drawn large enough to
   fill the stage is pulled back to the centre line, so the thing you
   are actually looking at is never shoved off the top or bottom while
   its smaller neighbours stay fanned out beside it.                  */
const LANES = 5;
const SPREAD = 0.88;     // share of the stage the tracks span
const SETTLE = 1.9;      // stage-heights at which a shape is fully recentred
const WHEEL_PX = 0.48;   // pixels of travel per wheel unit

/* SI ladder for the readout */
const SI = [
  [-12, "pm"], [-9, "nm"], [-6, "µm"], [-3, "mm"], [0, "m"], [3, "km"], [6, "Mm"]
];

let D = null, svg = null, stage = null, gWorld = null, gAxis = null;
let z = -9.3, target = -9.3, raf = null, dragging = null;
let objects = [];
let W = 1200, H = 560;
let sweeping = null;

/* ---------- formatting ---------- */

export function metres(v) {
  const e = Math.floor(Math.log10(Math.abs(v)));
  let [exp, unit] = SI[0];
  for (const [x, u] of SI) if (e >= x) { exp = x; unit = u; }
  const n = v / Math.pow(10, exp);
  const s = n >= 100 ? n.toFixed(0) : n >= 10 ? n.toFixed(1) : n >= 1 ? n.toFixed(2) : n.toFixed(3);
  /* trim the fractional tail only. `/\.?0+$/` also ate zeros off whole
     numbers — 550 nm rendered as "55 nm", 300 m as "3 m", 100 pm as
     "1 pm" — so nine of the thirty-six objects were labelled an order
     of magnitude off while being *drawn* at the right size. Every label
     is now round-tripped against its stored value by the test. */
  const t = s.includes(".") ? s.replace(/0+$/, "").replace(/\.$/, "") : s;
  return `${t} ${unit}`;
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

function jump(to) { endSweep(); if (raf) { cancelAnimationFrame(raf); raf = null; } glide(to); }

/* ---------- painting ---------- */

/** The centre line of an object's track, once it is drawn `px` across. */
function lane(o, px) {
  const mid = (H - 60) / 2;
  const band = (H - 96) * SPREAD;
  const u = o.lane / (LANES - 1) - 0.5;          // −0.5 … +0.5
  const room = Math.max(0, 1 - px / (H * SETTLE));
  return mid + u * band * room;
}

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
  /* Labels are placed against each other, not only against their own
     shape. Lanes stop the *shapes* piling up; they do not stop two
     labels landing on one line, because a label sits a shape-height
     away from its lane and two shapes of similar size on adjacent lanes
     put their names in the same band. That is how two names ended up
     written over each other at the small end of the ruler. Each label
     now takes the first slot — above, below, then a rank further out —
     that no already-placed label occupies. */
  const taken = [];
  const free = (x0, x1, y) => !taken.some(q => x0 < q.x1 && x1 > q.x0 && Math.abs(q.y - y) < 15);
  const claim = (x0, x1, y) => { taken.push({ x0, x1, y }); return y; };

  for (const o of objects) {
    const p = place(o);
    if (!p.visible) continue;
    const d = Math.abs(p.rel);
    if (d < best) { best = d; focal = o; }

    const s = p.px / 100;
    const cy = lane(o, p.px);

    out += `<g class="rul__o" data-id="${o.id}" opacity="${p.op.toFixed(3)}"
              transform="translate(${x2(p.x)},${cy})">
              <g transform="translate(${-p.px / 2},${-p.px / 2}) scale(${s})">${o.svg}</g>`;

    /* labels only once the object is big enough to be worth naming */
    const half = Math.max(p.px, 6) / 2;
    const named = p.px > 26;
    /* an object whose centre has left the stage gets no label — a
       centred anchor would leave half a word hanging over the edge */
    if ((named || p.px > 5) && p.x > 24 && p.x < W - 24) {
      /* rough box: the name sets the width, at ~6.6px per character */
      const w = (named ? o.label.length * 6.6 : metres(o.m).length * 6) / 2 + 6;
      const x0 = p.x - w, x1 = p.x + w;
      /* clear of the shape first, then a rank further out, then just
         inside its top or bottom edge — a shape taller than the stage
         has no clear air to offer, and a name written over it with a
         halo still reads where a name off the top of the frame does
         not. That was the old failure: `cy − half − 15` for an object
         480px tall on a 560px stage is above the stage. */
      const rungs = named
        ? [-half - 15, half + 27, -half - 39, half + 51, -half + 26, half - 14]
        : [-half - 6, half + 12, -half - 24, half + 30];
      const top = 14, floor = H - 50;
      let y = rungs.find(r => cy + r > top && cy + r < floor && free(x0, x1, cy + r));
      if (y === undefined) y = Math.min(floor - cy, Math.max(top - cy, rungs[0]));
      claim(x0, x1, cy + y);
      const under = y > 0;

      out += named
        ? (under
          ? `<text class="rul__m" x="0" y="${y - 13}" text-anchor="middle">${metres(o.m)}</text>
             <text class="rul__n" x="0" y="${y}" text-anchor="middle">${esc(o.label)}</text>`
          : `<text class="rul__n" x="0" y="${y}" text-anchor="middle">${esc(o.label)}</text>
             <text class="rul__m" x="0" y="${y + 12}" text-anchor="middle">${metres(o.m)}</text>`)
        : `<text class="rul__m" x="0" y="${y}" text-anchor="middle">${metres(o.m)}</text>`;
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

/* ---------- the sweep ---------- */

const SWEEP_LABEL = "Sweep lattice → Earth";
/* both rates are in pixels of travel, not decades, so widening the
   ruler does not silently make the wheel and the sweep feel twice as
   fast — what the reader perceives is the ground moving under them */
const SWEEP_PX = 5.4;    // per frame — the full journey in about 28 s

/* The journey the page describes, taken end to end. The camera moves at
   a constant rate in decades, which on a log ruler is a constant rate of
   growth: every object swells, passes and shrinks away at the same pace
   whatever its size, which is the one thing a still frame cannot show.
   Any interaction ends it — a control that fights the reader is worse
   than no control at all. */
function sweep() {
  if (sweeping) { endSweep(); return; }
  if (raf) { cancelAnimationFrame(raf); raf = null; }
  const [lo, hi] = D.meta.span;
  if (z >= hi - 0.05) { z = target = lo; }
  document.getElementById("rulPlay").textContent = "Stop";
  const perFrame = app.RM ? (hi - lo) / 90 : SWEEP_PX / PX_DECADE;
  const step = () => {
    /* a sweep running behind another tab is a repaint nobody is reading */
    if (!document.getElementById("v-rul").classList.contains("on")) { endSweep(); return; }
    z = target = clamp(z + perFrame);
    paint();
    if (z >= hi - 1e-6) { endSweep(); return; }
    sweeping = requestAnimationFrame(step);
  };
  sweeping = requestAnimationFrame(step);
}

function endSweep() {
  if (!sweeping) return;
  cancelAnimationFrame(sweeping);
  sweeping = null;
  const b = document.getElementById("rulPlay");
  if (b) b.textContent = SWEEP_LABEL;
}

/* ---------- init ---------- */

export async function initRuler() {
  const r = await fetch(new URL("../../data/static/ruler.json", import.meta.url));
  if (!r.ok) throw new Error(`Could not load ruler.json (${r.status})`);
  D = await r.json();

  objects = D.objects
    .map(o => ({ ...o, lg: Math.log10(o.m) }))
    .sort((a, b) => a.lg - b.lg)
    .map((o, i) => {
      /* a triangle wave: 0,1,2,3,4,3,2,1,0,… — long diagonal runs, and
         no jump back to the top where a plain ramp would wrap */
      const t = i % (2 * (LANES - 1));
      return {
        ...o,
        lane: t < LANES ? t : 2 * (LANES - 1) - t,
        svg: drawGlyph(o.glyph, app.byId[o.station] ? app.col(app.byId[o.station].L) : "#8FA0C4", o.detail)
      };
    });

  z = target = objects[0].lg + 0.6;

  svg = document.getElementById("rulSvg");
  stage = svg.parentElement;
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
  range.addEventListener("input", () => { endSweep(); if (raf) { cancelAnimationFrame(raf); raf = null; } z = target = +range.value; paint(); });

  /* Bound to the stage, not to the SVG.

     An SVG only hit-tests where it has painted something, so listening
     on `svg` meant the wheel was caught by whatever glyph happened to
     be under the pointer and by nothing else. Zooming then moved that
     glyph out from under the cursor — the shapes grow and shrink, that
     is the whole point of the view — and the very next notch of the
     wheel fell through to the page and scrolled it. The stage is a
     plain block, so it catches the wheel across its whole area. */
  stage.addEventListener("wheel", e => {
    e.preventDefault();
    const d = (Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX);
    endSweep();
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    z = target = clamp(z + d * WHEEL_PX / PX_DECADE);
    paint();
  }, { passive: false });

  stage.addEventListener("pointerdown", e => {
    dragging = { x: e.clientX, z };
    stage.setPointerCapture(e.pointerId);
    stage.classList.add("drag");
  });
  stage.addEventListener("pointermove", e => {
    if (!dragging) return;
    endSweep();
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    z = target = clamp(dragging.z - (e.clientX - dragging.x) / PX_DECADE);
    paint();
  });
  const stop = () => { dragging = null; stage.classList.remove("drag"); };
  stage.addEventListener("pointerup", stop);
  stage.addEventListener("pointercancel", stop);

  document.getElementById("rulPlay").addEventListener("click", sweep);

  addEventListener("keydown", e => {
    if (!document.getElementById("v-rul").classList.contains("on")) return;
    if (e.target.tagName === "INPUT") return;
    if (e.key === "ArrowRight") { jump(target + 0.5); e.preventDefault(); }
    if (e.key === "ArrowLeft") { jump(target - 0.5); e.preventDefault(); }
  });

  addEventListener("resize", () => { if (document.getElementById("v-rul").classList.contains("on")) size(); });

  /* the footer states this number; it is written from the constant so
     the sentence cannot disagree with the drawing */
  document.getElementById("rulPxDecade").textContent = PX_DECADE;

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
