/* ============================================================
   WEB — the dependency graph. Stations laid out in stratum rows,
   edges drawn as bezier curves, with supply-cone tracing and
   pan / zoom / pinch.
   ============================================================ */

import { app } from "../core/app.js";
import { cone } from "../lib/graph.js";

const NS = "http://www.w3.org/2000/svg";
const RW = 46, W = 1700, PADT = 40;

let svg, H, pos = {}, gRoot, gEdge, gNode;
let pinned = null;
let vx = 0, vy = 0, vs = 1, drag = null, pinch = null, moved = false;

/* ---------- layout ---------- */
function build() {
  const { L, S, byL, UP, col, pad } = app;

  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  gRoot = document.createElementNS(NS, "g");
  svg.appendChild(gRoot);
  const gRow = document.createElementNS(NS, "g");
  gEdge = document.createElementNS(NS, "g");
  gNode = document.createElementNS(NS, "g");
  gRoot.appendChild(gRow);
  gRoot.appendChild(gEdge);
  gRoot.appendChild(gNode);

  L.forEach(l => {
    const y = PADT + (L.length - l.n) * RW + RW / 2;
    const ln = document.createElementNS(NS, "line");
    ln.setAttribute("x1", 168); ln.setAttribute("x2", W - 20);
    ln.setAttribute("y1", y + RW / 2); ln.setAttribute("y2", y + RW / 2);
    ln.setAttribute("class", "lline");
    gRow.appendChild(ln);
    const tx = document.createElementNS(NS, "text");
    tx.setAttribute("x", 14); tx.setAttribute("y", y + 3);
    tx.setAttribute("class", "lrow");
    tx.textContent = pad(l.n) + "  " + l.t;
    gRow.appendChild(tx);

    const st = byL[l.n] || [], span = W - 196, step = span / st.length;
    st.forEach((s, k) => { pos[s.i] = { x: 184 + step * (k + .5), y: y, k: k }; });
  });

  S.forEach(s => (UP[s.i] || []).forEach(u => {
    const a = pos[u], b = pos[s.i];
    if (!a || !b) return;
    const p = document.createElementNS(NS, "path");
    const my = (a.y + b.y) / 2;
    p.setAttribute("d", `M${a.x.toFixed(1)},${a.y} C${a.x.toFixed(1)},${my} ${b.x.toFixed(1)},${my} ${b.x.toFixed(1)},${b.y}`);
    p.setAttribute("class", "edge");
    p.dataset.a = u; p.dataset.b = s.i;
    gEdge.appendChild(p);
  }));

  S.forEach(s => {
    const p = pos[s.i];
    const g = document.createElementNS(NS, "g");
    g.setAttribute("class", "nodeg");
    g.dataset.id = s.i;
    const c = document.createElementNS(NS, "circle");
    const r = 4 + s.c * 1.5;
    c.setAttribute("cx", p.x); c.setAttribute("cy", p.y); c.setAttribute("r", r);
    c.setAttribute("fill", col(s.L)); c.setAttribute("fill-opacity", .85);
    c.setAttribute("stroke", s.c >= 3 ? "#D2508F" : "none");
    c.setAttribute("stroke-width", s.c >= 3 ? 1.2 : 0);
    const t = document.createElementNS(NS, "text");
    const above = p.k % 2 === 0;
    t.setAttribute("x", p.x); t.setAttribute("y", above ? p.y - r - 5 : p.y + r + 11);
    t.setAttribute("text-anchor", "middle");
    t.textContent = s.n.length > 17 ? s.n.slice(0, 16) + "…" : s.n;
    g.appendChild(c); g.appendChild(t);
    g.addEventListener("mouseenter", () => trace(s.i, true));
    /* leaving a node restores the pinned cone rather than dropping to
       nothing — otherwise a pin silently evaporates the moment the
       pointer crosses another node */
    g.addEventListener("mouseleave", () => {
      if (!pinned) clearTrace();
      else if (pinned !== s.i) trace(pinned, true);
    });
    /* a click both opens the station and pins its cone, so the mapping
       is still there when the sheet is closed. Without this the trace
       lives only as long as the hover and there is nothing to clear. */
    g.addEventListener("click", e => { e.stopPropagation(); trace(s.i); app.openStation(s.i); });
    gNode.appendChild(g);
  });
}

/* ---------- tracing ----------
   `cone` now lives in src/lib/graph.js so the Faults view can walk the
   graph with exactly this code rather than a copy of it. */

/** The Clear trace button is only meaningful while something is pinned.
 *  Rather than sit there doing nothing, it goes flat until there is. */
function syncClear() {
  const b = document.getElementById("webClear");
  if (b) b.disabled = !pinned;
}

function trace(id, soft) {
  const { UP, DN, byId, col } = app;
  if (!soft) pinned = id;
  const anc = cone(id, UP), des = cone(id, DN);
  const keep = new Set([...anc, ...des, id]);
  document.querySelectorAll(".nodeg").forEach(g => {
    const k = g.dataset.id, on = keep.has(k);
    g.classList.toggle("dim", !on);
    g.classList.toggle("lit", k === id);
    g.classList.toggle("up", anc.has(k));
    g.classList.toggle("dn", des.has(k));
  });
  document.querySelectorAll(".edge").forEach(e => {
    const a = e.dataset.a, b = e.dataset.b;
    const upEdge = (anc.has(a) || a === id) && (anc.has(b) || b === id);
    const dnEdge = (des.has(a) || a === id) && (des.has(b) || b === id);
    e.classList.toggle("lit", !!upEdge);
    e.classList.toggle("litd", !!dnEdge && !upEdge);
    e.classList.toggle("dim", !upEdge && !dnEdge);
  });
  const s = byId[id];
  document.getElementById("hudT").textContent = s.n;
  document.getElementById("hudP").innerHTML =
    `<b style="color:${col(s.L)}">${anc.size}</b> stations upstream · <b style="color:var(--brs)">${des.size}</b> downstream.<br>${s.s}.` +
    (pinned === id ? `<br><span class="webpin">Pinned — clear it below, or click empty space.</span>` : "");
  syncClear();
}

function clearTrace() {
  pinned = null;
  document.querySelectorAll(".nodeg").forEach(g => g.classList.remove("dim", "lit", "up", "dn"));
  document.querySelectorAll(".edge").forEach(e => e.classList.remove("lit", "litd", "dim"));
  document.getElementById("hudT").textContent = "The dependency web";
  document.getElementById("hudP").textContent = "Every station, stacked by depth. Hover a node to light its supply cone; click to pin it and open the station. Drag to pan, scroll to zoom in for labels.";
  syncClear();
}

/* ---------- view transform ---------- */
function applyView() {
  gRoot.setAttribute("transform", `translate(${vx},${vy}) scale(${vs})`);
  svg.classList.toggle("zoomed", vs > .9);
}

function fitWeb(mode) {
  const r = svg.getBoundingClientRect();
  if (!r.width || !r.height) return;
  const vbH = Math.max(420, Math.round(W * r.height / r.width));
  svg.setAttribute("viewBox", `0 0 ${W} ${vbH}`);
  if (mode === "wide") { vs = 1.34; vx = (W - W * vs) / 2; vy = 0; }
  else {
    vs = Math.min(1.1, (vbH / H) * .97);
    vx = (W - W * vs) / 2 + Math.min(170, (W - W * vs) / 2);
    vy = (vbH - H * vs) / 2;
  }
  applyView();
}

/* ---------- init ---------- */
export function initWeb() {
  svg = document.getElementById("webSvg");
  H = app.L.length * RW + PADT + 44;

  build();

  document.getElementById("webClear").addEventListener("click", clearTrace);
  document.getElementById("webReset").addEventListener("click", () => { fitWeb(); clearTrace(); });
  document.getElementById("webWide").addEventListener("click", () => fitWeb("wide"));
  syncClear();

  addEventListener("resize", () => {
    if (document.getElementById("v-web").classList.contains("on")) fitWeb();
  });

  svg.addEventListener("mousedown", e => { drag = { x: e.clientX - vx, y: e.clientY - vy }; moved = false; svg.classList.add("drag"); });
  addEventListener("mouseup", () => { drag = null; svg.classList.remove("drag"); });
  addEventListener("mousemove", e => { if (!drag) return; moved = true; vx = e.clientX - drag.x; vy = e.clientY - drag.y; applyView(); });

  svg.addEventListener("wheel", e => {
    e.preventDefault();
    const r = svg.getBoundingClientRect(), sx = (e.clientX - r.left) / r.width * W, sy = (e.clientY - r.top) / r.height * H;
    const f = e.deltaY < 0 ? 1.13 : 1 / 1.13, ns = Math.min(6, Math.max(.6, vs * f));
    vx = sx - (sx - vx) * (ns / vs); vy = sy - (sy - vy) * (ns / vs); vs = ns;
    applyView();
  }, { passive: false });

  svg.addEventListener("touchstart", e => {
    if (e.touches.length === 1) { drag = { x: e.touches[0].clientX - vx, y: e.touches[0].clientY - vy }; }
    else if (e.touches.length === 2) {
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      pinch = { d: d, s: vs }; drag = null;
    }
  }, { passive: true });

  svg.addEventListener("touchmove", e => {
    if (pinch && e.touches.length === 2) {
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      vs = Math.min(6, Math.max(.4, pinch.s * d / pinch.d)); applyView(); e.preventDefault();
    } else if (drag && e.touches.length === 1) {
      vx = e.touches[0].clientX - drag.x; vy = e.touches[0].clientY - drag.y; applyView(); e.preventDefault();
    }
  }, { passive: false });

  svg.addEventListener("touchend", () => { drag = null; pinch = null; });
  /* a pan ends in a click event; releasing the pin because someone moved
     the graph would be maddening, so a click that travelled is ignored */
  svg.addEventListener("click", () => {
    if (moved) { moved = false; return; }
    if (pinned) clearTrace();
  });

  app.trace = trace;
  app.clearTrace = clearTrace;
  app.fitWeb = fitWeb;
}
