/* ============================================================
   ATLAS — where the stack physically is.

   The Ruler's discipline, applied to ground rather than to size: every
   circle here encloses the area it claims to enclose. A chokepoint ring
   is built as a geodesic polygon — a hundred points, each exactly r km
   from the centre — and then projected like any other geometry, so it
   comes out as the oval a true circle actually is in this projection.
   Nothing is drawn "roughly to scale".

   The whole world is one path string in lon/lat degrees, and an
   equirectangular projection is affine in lon/lat, so panning and
   zooming is a single transform on a single group. Coastline, borders,
   graticule and every scale ring are built once at init and never
   touched again. Only the 56 site markers move per frame, because they
   must keep a constant size on screen while everything under them does
   not.
   ============================================================ */

import { app } from "../core/app.js";
import {
  transform, project, unproject, wrapLon, fitTo,
  ringPath, graticule, R_EARTH
} from "../lib/projection.js";

const NS = "http://www.w3.org/2000/svg";
const KM_PER_DEG = Math.PI * R_EARTH / 180;   // 111.19 km, one degree of great circle
const K_MIN = 0.9;        // pixels per degree — a little under a whole world
const K_MAX = 2600;       // …and about forty metres per pixel
const LABEL_MAX = 13;     // name everything on screen once this few are on it
const WRAP = [-360, 0, 360];

let D = null, W = null;
let svg = null, gGeo = null, gMarks = null, defs = null, gRings = null, gRisk = null, gStroke = [];
let sites = [], marks = [];
let cam = { lon: 40, lat: 22, k: 3 };
let target = null, raf = null, dragging = null, moved = 0;
let layers = { scale: true, regime: false, risk: false, names: false };
let focused = null;
let Wd = 1200, Hd = 560;

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const clampK = v => Math.max(K_MIN, Math.min(K_MAX, v));

/* ---------- colour ----------
   A site takes the colour of the stratum its first station sits in, so
   the Atlas and the Descent agree without either knowing about the other. */

const REGIME_COLOUR = {
  origin: "var(--mag)", aligned: "var(--pls)",
  restricted: "var(--brs)", outside: "var(--ash)"
};

function colourOf(s) {
  if (layers.regime) return REGIME_COLOUR[s.regime] || "var(--ash)";
  const st = app.byId[s.stations[0]];
  return st ? app.col(st.L) : "#8FA0C4";
}

/* ---------- camera ---------- */

function clampCam(c) {
  const k = clampK(c.k);
  const halfLat = Hd / 2 / k;
  const lat = Math.max(-88 + halfLat, Math.min(88 - halfLat, c.lat));
  /* Fold the camera back into [-180, 180). The coastline is tiled three
     times so a 360° fold is invisible, and markers are placed with
     wrapLon — but the scale rings are drawn once, at their true
     longitude. Without this, flying west from Taiwan to North Carolina
     leaves the camera at lon 278 and every ring silently off-stage. The
     corpus keeps sites clear of the antimeridian so one copy is enough;
     check-data.mjs holds it to that. */
  const lon = ((c.lon + 180) % 360 + 360) % 360 - 180;
  return { lon, lat: Hd / k >= 176 ? 0 : lat, k };
}

/** The camera, for tests that need to know where the map is looking. */
export function camera() { return { ...cam, W: Wd, H: Hd }; }

function glide(to) {
  target = clampCam(to);
  if (raf) return;
  const step = () => {
    /* travel the short way round, not across the whole map */
    const dl = wrapLon(target.lon, cam.lon) - cam.lon;
    const da = target.lat - cam.lat;
    const dk = Math.log(target.k) - Math.log(cam.k);
    if (Math.abs(dl) < 1e-4 && Math.abs(da) < 1e-4 && Math.abs(dk) < 1e-5) {
      cam = target; raf = null; paint(); return;
    }
    const e = app.RM ? 1 : 0.17;
    cam = clampCam({ lon: cam.lon + dl * e, lat: cam.lat + da * e, k: Math.exp(Math.log(cam.k) + dk * e) });
    paint();
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
}

function set(c) { if (raf) { cancelAnimationFrame(raf); raf = null; } cam = clampCam(c); paint(); }

/** Frame a site: its own circle if it has a meaningful one, else a
 *  neighbourhood the size of a county. */
function frame(s, mult = 5.5) {
  const spanKm = Math.max(2, (s.radiusKm || 6) * mult);
  const dLat = spanKm / 111.32;
  const dLon = dLat / Math.max(0.12, Math.cos(s.lat * Math.PI / 180));
  return fitTo({ w: s.lon - dLon, e: s.lon + dLon, s: s.lat - dLat, n: s.lat + dLat }, Wd, Hd, 0.06);
}

/* ---------- painting ---------- */

function paint() {
  gGeo.setAttribute("transform", transform(cam, Wd, Hd));

  /* one degree is cam.k pixels, so a stroke that should read as w pixels
     must be w/cam.k degrees wide */
  const u = 1 / cam.k;
  for (const [g, w] of gStroke) g.setAttribute("stroke-width", (w * u).toFixed(6));
  gRisk.setAttribute("stroke-dasharray", `${(5 * u).toFixed(6)} ${(5 * u).toFixed(6)}`);

  /* Label whatever is legible. A fixed zoom threshold cannot work — the
     same zoom that shows six sites in Europe shows twenty in Taiwan — so
     the test is how crowded the stage actually is. */
  const on = [];
  for (const m of marks) {
    const p = project(wrapLon(m.s.lon, cam.lon), m.s.lat, cam, Wd, Hd);
    m.p = p;
    m.on = p.x > -60 && p.x < Wd + 60 && p.y > -40 && p.y < Hd + 40;
    if (m.on) on.push(m);
  }
  /* Declutter. Place labels in order of consequence and drop any that
     would sit on top of one already placed — otherwise western Taiwan,
     which is the most important thing on this map, becomes the least
     readable part of it. */
  const named = layers.names || on.length <= LABEL_MAX;
  const rank = m => (m.s.id === focused ? 0 : m.s.kind === "chokepoint" ? 1 : m.s.leading ? 2 : 3);
  const placed = [];
  for (const m of marks) m.label = false;
  for (const m of on.slice().sort((a, b) => rank(a) - rank(b))) {
    if (rank(m) > 1 && !named) continue;
    const w = m.s.label.length * 5.7, box =
      { x0: m.p.x - w / 2, x1: m.p.x + w / 2, y0: m.p.y - 22, y1: m.p.y - 8 };
    if (placed.some(b => b.x0 < box.x1 && box.x0 < b.x1 && b.y0 < box.y1 && box.y0 < b.y1)) continue;
    placed.push(box);
    m.label = true;
  }
  for (const m of marks) {
    m.g.setAttribute("transform", `translate(${m.p.x.toFixed(1)},${m.p.y.toFixed(1)})`);
    m.g.setAttribute("display", m.on ? "inline" : "none");
    m.g.setAttribute("opacity", layers.risk && !m.s.risk ? "0.28" : "1");
    m.t.setAttribute("display", m.label ? "inline" : "none");
    /* the open site is marked on the map as well as in the panel, so the
       description below has something visible to belong to */
    m.g.classList.toggle("on", m.s.id === focused);
  }

  /* the rings sit inside the template the three wrapped copies reference,
     so they zoom with the ground and never need rebuilding — all that
     changes is whether they are shown at all */
  gRings.setAttribute("display", layers.scale ? "inline" : "none");
  gRisk.setAttribute("display", layers.risk ? "inline" : "none");

  /* How much ground is on screen. Not a great-circle distance between the
     two edges: once the whole world is in view those edges are the same
     meridian and the answer would be zero. Arc length along the centre
     parallel is what the eye is actually being asked to judge. */
  const km = (Wd / cam.k) * KM_PER_DEG * Math.cos(cam.lat * Math.PI / 180);
  document.getElementById("atlScale").textContent =
    km >= 1000 ? `${Math.round(km / 100) / 10} thousand km` : km >= 10 ? `${Math.round(km)} km` : `${km.toFixed(1)} km`;
}

/* ---------- the panel ---------- */

const KIND = {
  mine: "extraction", refine: "refining", wafer: "substrate", tool: "tool-making",
  fab: "logic fab", memory: "memory", package: "packaging", site: "compute site",
  chokepoint: "chokepoint"
};

const PRECISION = {
  sited: "the operator publishes this location",
  approx: "reconstructed from public reporting",
  area: "a district — the point is its centre"
};

function detail(s) {
  focused = s.id;
  /* A site is a place, and the rail reads depth — so it takes the
     stratum of the site's first station, which is the same rule this
     view already colours its markers by. Sites that reach across the
     stack are the reason it is the first and not a summary: one bar
     saying "this is where it starts" beats a guess at the middle. */
  const first = app.byId[s.stations[0]];
  if (first) app.depth("atl", first.L);
  const reg = (D.meta.regimes || []).find(r => r.id === s.regime);
  const risk = s.risk ? (D.meta.risks || []).find(r => r.id === s.risk.k) : null;
  const chips = s.stations.filter(id => app.byId[id]).map(id => {
    const st = app.byId[id];
    return `<button class="cas__st" data-station="${id}" style="--c:${app.col(st.L)}"><b>${app.pad(st.L)}</b>${st.n}</button>`;
  }).join("");

  document.getElementById("atlPanel").innerHTML = `
    <div class="atl__pk">
      <span>${esc(KIND[s.kind] || s.kind)}</span>
      <b class="atl__prec atl__prec--${s.precision}" title="${esc(PRECISION[s.precision] || "")}">${s.precision}</b>
      ${s.radiusKm ? `<em class="atl__rad">${s.radiusKm < 10 ? s.radiusKm : Math.round(s.radiusKm)} km radius, drawn to scale</em>` : ""}
    </div>
    <h3 class="atl__pn">${esc(s.label)}</h3>
    <p class="atl__ps">${esc(s.place)} · ${s.lat.toFixed(3)}°, ${s.lon.toFixed(3)}°</p>
    <p class="atl__pb">${esc(s.note)}</p>
    ${reg ? `<p class="atl__pr"><i style="background:${REGIME_COLOUR[s.regime]}"></i><b>${esc(reg.label)}</b> ${esc(reg.note)}</p>` : ""}
    ${risk ? `<p class="atl__pr atl__pr--risk"><i></i><b>${esc(risk.label)}</b> ${esc(s.risk.note)}</p>` : ""}
    ${s.source ? `<p class="cas__cite">${s.source.url
      ? `<a href="${s.source.url}" target="_blank" rel="noopener">${esc(s.source.who)} — ${esc(s.source.what)} ↗</a>`
      : `${esc(s.source.who)} — ${esc(s.source.what)}`}</p>` : ""}
    ${chips ? `<div class="atl__pl">${chips}</div>` : ""}
    ${s.ruler ? `<button class="grain__r" data-ruler="${s.ruler}">See this distance on the Ruler →</button>` : ""}`;

  document.querySelectorAll("#atlPanel [data-station]").forEach(b =>
    b.addEventListener("click", () => app.openStation(b.dataset.station)));
  document.querySelectorAll("#atlPanel [data-ruler]").forEach(b =>
    b.addEventListener("click", () => { app.show("rul"); setTimeout(() => app.rulerGoTo(b.dataset.ruler), 60); }));
  paint();
}

/** Fly to a site and open it. The public action other views call. */
function goTo(id) {
  const s = sites.find(x => x.id === id);
  if (!s) return;
  const f = frame(s);
  glide({ lon: s.lon, lat: f.lat, k: f.k });
  detail(s);
}

/** Open a site the reader has just tapped on the map.
 *
 *  Deliberately not goTo. A stop button names a place you cannot see and
 *  has to fly you there; a marker is one you are already looking at, and
 *  flying in on it throws away the context that made it worth clicking.
 *  So the camera stays put and only the description changes — and the
 *  description is brought into view, because the stage is 620 px tall
 *  and the panel below it opens off the bottom of most screens, which is
 *  most of why clicking the map looked like it did nothing even when it
 *  worked. */
function tap(id) {
  const s = sites.find(x => x.id === id);
  if (!s) return;
  detail(s);
  document.getElementById("atlPanel")
    .scrollIntoView({ behavior: app.RM ? "auto" : "smooth", block: "nearest" });
}

/* ---------- the concentration claim ---------- */

/** Total ground enclosed by the leading-edge logic circles, km².
 *  Exported so the smoke test can check the sentence against the data
 *  rather than against itself. */
export function leadingArea(data = D) {
  return data.sites.filter(s => s.leading)
    .reduce((n, s) => n + Math.PI * s.radiusKm * s.radiusKm, 0);
}

function concentration() {
  const lead = sites.filter(s => s.leading);
  const km2 = leadingArea();
  const c = D.meta.comparison;
  document.getElementById("atlClaim").innerHTML = `
    <button id="atlClaimBtn">
      <b>${lead.length}</b> leading-edge logic sites ·
      <b>${Math.round(km2)} km²</b> of circles, drawn to scale ·
      less ground than <b>${esc(c.label)}</b>
    </button>`;
  document.getElementById("atlClaimBtn").addEventListener("click", () => {
    const box = lead.reduce((b, s) => ({
      w: Math.min(b.w, s.lon - 3), e: Math.max(b.e, s.lon + 3),
      s: Math.min(b.s, s.lat - 3), n: Math.max(b.n, s.lat + 3)
    }), { w: 180, e: -180, s: 90, n: -90 });
    layers.scale = true;
    syncLayers();
    glide(fitTo(box, Wd, Hd));
  });
}

/* ---------- controls ---------- */

const LAYERS = [
  ["scale", "True-scale circles", "Every ring encloses the ground it claims to."],
  ["regime", "Export-control regime", "Who writes the rules, who is inside them, who is shut out."],
  ["risk", "Physical risk", "Sites with a named seismic, water, storm, grid or conflict exposure."],
  ["names", "All names", "Label every site, not just the ones you have zoomed into."]
];

function syncLayers() {
  document.querySelectorAll("#atlLayers button").forEach(b =>
    b.setAttribute("aria-pressed", String(!!layers[b.dataset.layer])));
  document.getElementById("atlLegend").innerHTML = layers.regime
    ? (D.meta.regimes || []).map(r =>
        `<span><i style="background:${REGIME_COLOUR[r.id]}"></i>${esc(r.label)}</span>`).join("")
    : `<span style="color:#4C5A7C">Colour follows the stratum each site belongs to</span>`;
  marks.forEach(m => {
    const c = colourOf(m.s);
    m.dot.setAttribute("fill", c);
    m.halo.setAttribute("stroke", c);
  });
  gRings.querySelectorAll(".atl__ring").forEach(p => {
    const s = sites.find(x => x.id === p.dataset.site);
    if (s) { p.setAttribute("stroke", colourOf(s)); p.setAttribute("fill", colourOf(s)); }
  });
  paint();
}

const STOPS = [
  ["Everything", null],
  ["Spruce Pine", "spruce-pine"],
  ["Hsinchu", "hsinchu"],
  ["Veldhoven", "veldhoven"],
  ["The strait", "taiwan-strait"],
  ["Korea", "pyeongtaek"],
  ["Arizona", "phoenix-fab21"],
  ["Loudoun", "ashburn"]
];

/** Frame every site. Not the whole globe — two thirds of the globe is
 *  ocean this stack never touches, and the emptiness is not the finding. */
function world() {
  focused = null;
  const b = sites.reduce((a, s) => ({
    w: Math.min(a.w, s.lon), e: Math.max(a.e, s.lon),
    s: Math.min(a.s, s.lat), n: Math.max(a.n, s.lat)
  }), { w: 180, e: -180, s: 90, n: -90 });
  glide(fitTo({ w: b.w - 6, e: b.e + 6, s: b.s - 8, n: b.n + 8 }, Wd, Hd, 0.02));
}

/* ---------- init ---------- */

export async function initAtlas() {
  const [ra, rw] = await Promise.all([
    fetch(new URL("../../data/static/atlas.json", import.meta.url)),
    fetch(new URL("../../data/static/world.json", import.meta.url))
  ]);
  if (!ra.ok) throw new Error(`Could not load atlas.json (${ra.status})`);
  if (!rw.ok) throw new Error(`Could not load world.json (${rw.status})`);
  D = await ra.json();
  W = await rw.json();
  sites = D.sites;

  svg = document.getElementById("atlSvg");
  defs = document.createElementNS(NS, "defs");
  gGeo = document.createElementNS(NS, "g");
  gMarks = document.createElementNS(NS, "g");
  svg.append(defs, gGeo, gMarks);

  /* --- the world, built once ---
     Coastline, borders and graticule go in one <g> in lon/lat degrees,
     referenced three times so the map wraps at the antimeridian without
     anything being recomputed. The rings are drawn once rather than three
     times: no site in the corpus sits near ±180°, and three stacked
     translucent copies would quietly triple every fill opacity.

     Stroke widths are counter-scaled in paint() rather than left to
     `vector-effect`, which is widely but not universally implemented. At
     a zoom of 2,000 pixels per degree an unscaled 1.2-unit stroke is
     2,400 pixels wide, so getting this wrong does not degrade the map —
     it erases it. */
  defs.innerHTML = `
    <g id="atlWorld">
      <g class="atl__gg" stroke="var(--line)" stroke-opacity=".5" fill="none">
        <path class="atl__grat" d="${graticule(15)}"/>
      </g>
      <g class="atl__lg" stroke="#4A5B85" stroke-linejoin="round">
        <path class="atl__land" d="${W.land}" fill="var(--ox2)" fill-opacity=".9"/>
      </g>
      <g class="atl__bg" stroke="#2E3B5E" fill="none">
        <path class="atl__bord" d="${W.borders}"/>
      </g>
    </g>`;
  gGeo.innerHTML =
    WRAP.map(dx => `<use href="#atlWorld" x="${dx}"/>`).join("") +
    `<g class="atl__risk" fill="none" stroke="var(--brs)" stroke-opacity=".45">${
      sites.filter(s => s.risk).map(s =>
        `<path class="atl__rx" d="${ringPath(s.lon, s.lat, Math.max(s.radiusKm, 5) * 2.6, 64)}"/>`).join("")
    }</g>` +
    `<g class="atl__rings" fill-opacity=".07" stroke-opacity=".9">${
      sites.filter(s => s.radiusKm).map(s =>
        `<path class="atl__ring" data-site="${s.id}" d="${ringPath(s.lon, s.lat, s.radiusKm)}"/>`).join("")
    }</g>`;
  gRings = gGeo.querySelector(".atl__rings");
  gRisk = gGeo.querySelector(".atl__risk");
  gStroke = [
    [defs.querySelector(".atl__gg"), 0.7],
    [defs.querySelector(".atl__lg"), 1.0],
    [defs.querySelector(".atl__bg"), 0.8],
    [gRisk, 1.1],
    [gRings, 1.4]
  ];

  /* --- markers, built once and moved thereafter ---
     The first circle is the hit target and nothing else. An SVG only
     hit-tests where it has painted, and the halo is fill:none while the
     dot is three pixels across — so before this the clickable part of a
     site was a three-pixel disc, on a map you are also dragging. A
     transparent disc is painted for hit-testing purposes even though it
     shows nothing, which is exactly what is wanted here. */
  gMarks.innerHTML = sites.map(s => `
    <g class="atl__m atl__m--${s.kind}" data-site="${s.id}">
      <circle class="atl__hit" r="${s.kind === "chokepoint" ? 16 : 13}" fill="transparent"/>
      <circle class="atl__halo" r="${s.kind === "chokepoint" ? 11 : 8}" fill="none" stroke-opacity=".35" stroke-width="1"/>
      <circle class="atl__dot" r="${s.leading || s.kind === "chokepoint" ? 4 : 3}"/>
      <text class="atl__t" x="0" y="-13" text-anchor="middle">${esc(s.label)}</text>
    </g>`).join("");
  marks = [...gMarks.querySelectorAll(".atl__m")].map(g => ({
    g, s: sites.find(x => x.id === g.dataset.site),
    dot: g.querySelector(".atl__dot"), halo: g.querySelector(".atl__halo"), t: g.querySelector(".atl__t")
  }));

  /* --- controls --- */
  document.getElementById("atlLayers").innerHTML = LAYERS
    .map(([id, label, help]) => `<button data-layer="${id}" title="${esc(help)}" aria-pressed="false">${label}</button>`)
    .join("");
  document.querySelectorAll("#atlLayers button").forEach(b =>
    b.addEventListener("click", () => { layers[b.dataset.layer] = !layers[b.dataset.layer]; syncLayers(); }));

  document.getElementById("atlStops").innerHTML = STOPS
    .map(([l, id]) => `<button data-goto="${id || ""}">${l}</button>`).join("");
  document.querySelectorAll("#atlStops button").forEach(b =>
    b.addEventListener("click", () => b.dataset.goto ? goTo(b.dataset.goto) : world()));

  /* --- pan, zoom, keys --- */
  svg.addEventListener("wheel", e => {
    e.preventDefault();
    const at = unproject(e.offsetX ?? Wd / 2, e.offsetY ?? Hd / 2, cam, Wd, Hd);
    const k = clampK(cam.k * Math.exp(-e.deltaY * 0.0022));
    /* keep the point under the cursor still */
    set({ k, lon: at.lon - (((e.offsetX ?? Wd / 2) - Wd / 2) / k), lat: at.lat + (((e.offsetY ?? Hd / 2) - Hd / 2) / k) });
  }, { passive: false });

  svg.addEventListener("pointerdown", e => {
    dragging = { x: e.clientX, y: e.clientY, cam: { ...cam } };
    moved = 0;
    svg.setPointerCapture(e.pointerId);
    svg.classList.add("drag");
  });
  svg.addEventListener("pointermove", e => {
    if (!dragging) return;
    const dx = e.clientX - dragging.x, dy = e.clientY - dragging.y;
    moved = Math.max(moved, Math.abs(dx) + Math.abs(dy));
    set({ k: dragging.cam.k, lon: dragging.cam.lon - dx / dragging.cam.k, lat: dragging.cam.lat + dy / dragging.cam.k });
  });
  const stop = () => { dragging = null; svg.classList.remove("drag"); };
  svg.addEventListener("pointercancel", stop);

  /* Taps are resolved here rather than by a click listener on each
     marker, and this is the whole reason clicking a site on this map did
     nothing at all.

     Pointer capture is set on pointerdown so a drag keeps panning after
     the cursor leaves the stage — and capture retargets every later
     pointer event, and the click synthesised from them, to the element
     holding it. The click therefore always arrived at the <svg>, never
     at the marker under the cursor, so the marker's own handler could
     not fire however precisely you hit it. The stops worked because they
     are ordinary buttons outside the map, which is why the panel only
     ever described one of those seven places.

     Capture is worth keeping, so the tap is resolved by hit-testing the
     release point instead. elementFromPoint is plain geometry and does
     not care who holds the pointer. */
  svg.addEventListener("pointerup", e => {
    const tapped = dragging && moved < 5;
    stop();
    if (!tapped) return;
    const g = document.elementFromPoint(e.clientX, e.clientY)?.closest?.(".atl__m");
    if (g) tap(g.dataset.site);
  });

  addEventListener("keydown", e => {
    if (!document.getElementById("v-atl").classList.contains("on")) return;
    if (e.target.tagName === "INPUT") return;
    const step = 90 / cam.k;
    if (e.key === "ArrowRight") { glide({ ...cam, lon: cam.lon + step }); e.preventDefault(); }
    if (e.key === "ArrowLeft") { glide({ ...cam, lon: cam.lon - step }); e.preventDefault(); }
    if (e.key === "ArrowUp") { glide({ ...cam, lat: cam.lat + step }); e.preventDefault(); }
    if (e.key === "ArrowDown") { glide({ ...cam, lat: cam.lat - step }); e.preventDefault(); }
    if (e.key === "+" || e.key === "=") { glide({ ...cam, k: cam.k * 1.8 }); e.preventDefault(); }
    if (e.key === "-") { glide({ ...cam, k: cam.k / 1.8 }); e.preventDefault(); }
  });

  addEventListener("resize", () => { if (document.getElementById("v-atl").classList.contains("on")) size(); });

  app.atlasGoTo = goTo;
  app.atlasFit = size;

  concentration();
  syncLayers();
  size();
  world();
  detail(sites.find(s => s.id === "spruce-pine") || sites[0]);
}

function size() {
  const r = svg.getBoundingClientRect();
  Wd = Math.max(360, r.width || 1200);
  Hd = Math.max(360, r.height || 560);
  svg.setAttribute("viewBox", `0 0 ${Wd} ${Hd}`);
  cam = clampCam(cam);
  paint();
}
