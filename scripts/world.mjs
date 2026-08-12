/* Generates data/static/world.json — the coastline the Atlas draws on.

   Natural Earth 1:50m, public domain, by way of the world-atlas TopoJSON
   build. Two things make it small enough to check in:

   1. Adaptive simplification. Douglas–Peucker with a tolerance
      proportional to the square root of each ring's area, so continents
      are flattened hard — nobody zooms into the coast of Chile here —
      while an island the size of Taiwan keeps detail down to a few
      kilometres, because that is a view the Atlas actually offers.

   2. Relative path commands. Deltas between neighbouring coastline
      points are small, so "l.34-.21" replaces "L121.23 -24.78" and the
      file halves. Deltas are taken between *rounded* positions, so the
      error stays bounded at half a hundredth of a degree rather than
      accumulating along a ring.

   The output is one path string in raw lon/lat space (x = lon, y = −lat),
   because an equirectangular projection is affine in lon/lat: the view
   pans and zooms with a single SVG transform and never re-projects a
   point. See src/lib/projection.js.

   Dev-only, run by hand when the geometry needs regenerating:
     npm i --no-save world-atlas topojson-client && node scripts/world.mjs   */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { feature, mesh } from "topojson-client";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NE = path.join(ROOT, "node_modules/world-atlas");

const DIV = 30;          // ring tolerance = sqrt(area) / DIV, degrees
const TOL_MIN = 0.02;    // …clamped to this floor
const TOL_MAX = 0.62;    // …and this ceiling
const MIN_AREA = 0.3;    // drop land rings smaller than this, square degrees
const BORDER_TOL = 0.42; // borders are orientation only, so simplify harder
const DP = 2;            // decimal places kept — 0.01° is ~1.1 km at the equator

/* ---------- geometry ---------- */

/** Perpendicular distance from p to the segment ab, in degrees. */
function seg(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  if (!dx && !dy) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

function simplify(pts, tol) {
  if (pts.length < 3) return pts;
  let worst = 0, at = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = seg(pts[i], pts[0], pts[pts.length - 1]);
    if (d > worst) { worst = d; at = i; }
  }
  if (worst <= tol) return [pts[0], pts[pts.length - 1]];
  return [...simplify(pts.slice(0, at + 1), tol).slice(0, -1), ...simplify(pts.slice(at), tol)];
}

/** Shoelace area in square degrees. Sign discarded — only size matters. */
const area = r => Math.abs(r.reduce((s, p, i) => {
  const q = r[(i + 1) % r.length];
  return s + (p[0] * q[1] - q[0] * p[1]);
}, 0)) / 2;

/** A jump of more than 180° means the ring was stitched across the
 *  antimeridian. Split it rather than drawing a streak through the
 *  Pacific. */
function unwrap(ring) {
  const out = [[]];
  for (let i = 0; i < ring.length; i++) {
    if (i && Math.abs(ring[i][0] - ring[i - 1][0]) > 180) out.push([]);
    out[out.length - 1].push(ring[i]);
  }
  return out.filter(r => r.length > 2);
}

/* ---------- path encoding ---------- */

const SCALE = Math.pow(10, DP);

/** Shortest legal spelling of a fixed-point value: "0.30" → ".3", "-0" → "0". */
function num(v) {
  let s = (v / SCALE).toFixed(DP);
  if (s.includes(".")) s = s.replace(/0+$/, "").replace(/\.$/, "");
  s = s.replace(/^(-?)0\./, "$1.");
  return s === "-0" || s === "" ? "0" : s;
}

/** Does `t` need whitespace in front of it, given the token before it?
 *
 *  A command letter on either side always terminates a number. A leading
 *  minus does too. A leading decimal point only terminates the previous
 *  number if that number already contains a point — "0" followed by ".5"
 *  would otherwise be read as the single number 0.5, which is the one way
 *  this encoding can quietly corrupt a coastline. Everything else needs a
 *  space. The test is against the previous *token*, not the string built
 *  so far: a decimal point earlier in the path says nothing about whether
 *  the number immediately behind us can absorb another one. */
const CMD = /^[MlLZz]$/;
function sep(prev, t) {
  if (prev === null || CMD.test(prev) || CMD.test(t)) return "";
  if (t.startsWith("-")) return "";
  if (t.startsWith(".") && prev.includes(".")) return "";
  return " ";
}

function join(toks) {
  let out = "", prev = null;
  for (const t of toks) { out += sep(prev, t) + t; prev = t; }
  return out;
}

function toPath(rings, close) {
  const out = [];
  for (const r of rings) {
    let cx = Math.round(r[0][0] * SCALE), cy = Math.round(-r[0][1] * SCALE);
    const toks = ["M", num(cx), num(cy)];
    let n = 0;
    for (let i = 1; i < r.length; i++) {
      const x = Math.round(r[i][0] * SCALE), y = Math.round(-r[i][1] * SCALE);
      if (x === cx && y === cy) continue;               // collapsed by rounding
      if (!n++) toks.push("l");
      toks.push(num(x - cx), num(y - cy));
      cx = x; cy = y;
    }
    if (n) { if (close) toks.push("Z"); out.push(join(toks)); }
  }
  return out.join("");
}

/* ---------- round trip ----------
   The encoding above is the only clever thing in this file, so it does
   not get to be trusted. Decode what was written and compare it against
   the rings that went in: any drift means the coastline shipped wrong. */

function decode(d) {
  const toks = d.match(/[MlLZz]|-?(?:\d+\.?\d*|\.\d+)/g) || [];
  const rings = [];
  let cur = null, cx = 0, cy = 0, i = 0;
  while (i < toks.length) {
    const t = toks[i];
    if (t === "M") { cx = +toks[i + 1]; cy = +toks[i + 2]; cur = [[cx, cy]]; rings.push(cur); i += 3; continue; }
    if (t === "l" || t === "Z" || t === "z" || t === "L") { i++; continue; }
    cx += +toks[i]; cy += +toks[i + 1]; cur.push([cx, cy]); i += 2;
  }
  return rings;
}

function verify(label, d, rings) {
  /* the encoder drops points that collide after rounding, and drops a ring
     outright if that leaves it with nowhere to go — so expect the same */
  const want = rings.map(r => {
    const keep = [];
    let px = null, py = null;
    for (const p of r) {
      const x = Math.round(p[0] * SCALE) / SCALE, y = Math.round(-p[1] * SCALE) / SCALE;
      if (x === px && y === py) continue;
      keep.push([x, y]); px = x; py = y;
    }
    return keep;
  }).filter(r => r.length > 1);

  const back = decode(d);
  if (back.length !== want.length)
    throw new Error(`${label}: ${want.length} rings in, ${back.length} out`);
  let worst = 0;
  want.forEach((r, i) => {
    if (r.length !== back[i].length)
      throw new Error(`${label}: ring ${i} has ${r.length} points in, ${back[i].length} out`);
    r.forEach(([x, y], j) => {
      worst = Math.max(worst, Math.abs(x - back[i][j][0]), Math.abs(y - back[i][j][1]));
    });
  });
  if (worst > 1e-9) throw new Error(`${label}: coordinates drifted by ${worst}°`);
  return back.reduce((n, r) => n + r.length, 0);
}

/* ---------- build ---------- */

function ringsOf(geojson) {
  const out = [];
  const walk = g => {
    if (!g) return;
    if (g.type === "Polygon") g.coordinates.forEach(r => out.push(r));
    else if (g.type === "MultiPolygon") g.coordinates.forEach(p => p.forEach(r => out.push(r)));
    else if (g.type === "MultiLineString") g.coordinates.forEach(l => out.push(l));
    else if (g.type === "LineString") out.push(g.coordinates);
    else if (g.type === "GeometryCollection") g.geometries.forEach(walk);
    else if (g.type === "FeatureCollection") g.features.forEach(f => walk(f.geometry));
    else if (g.type === "Feature") walk(g.geometry);
  };
  walk(geojson);
  return out;
}

const read = f => JSON.parse(fs.readFileSync(path.join(NE, f), "utf8"));

const land = read("land-50m.json");
const ctry = read("countries-50m.json");

const landRings = ringsOf(feature(land, land.objects.land))
  .flatMap(unwrap)
  .filter(r => area(r) >= MIN_AREA)
  .map(r => simplify(r, Math.max(TOL_MIN, Math.min(TOL_MAX, Math.sqrt(area(r)) / DIV))))
  .filter(r => r.length > 2);

/* interior boundaries only — the coast is already drawn by `land`, and
   drawing it twice doubles the file for nothing */
const borderRings = ringsOf(mesh(ctry, ctry.objects.countries, (a, b) => a !== b))
  .flatMap(unwrap)
  .map(r => simplify(r, BORDER_TOL))
  .filter(r => r.length > 1);

const out = {
  meta: {
    updated: new Date().toISOString().slice(0, 10),
    projection: "raw lon/lat degrees — x = longitude, y = −latitude",
    note: `Natural Earth 1:50m physical land and admin-0 boundaries. Douglas–Peucker simplification with a per-ring tolerance of sqrt(area)/${DIV}° clamped to [${TOL_MIN}, ${TOL_MAX}], land rings under ${MIN_AREA} square degrees dropped, boundaries at ${BORDER_TOL}°, coordinates rounded to ${DP} decimal places (~1 km). Small island states — Singapore among them — fall below the area floor and are not drawn; their sites still plot at their true coordinates. Boundaries are Natural Earth's, shown for orientation and not as a position on any of them. Regenerate with scripts/world.mjs.`,
    source: {
      who: "Natural Earth",
      what: "1:50m physical land and admin-0 boundaries, public domain",
      url: "https://www.naturalearthdata.com/"
    },
    counts: {}
  },
  land: toPath(landRings, true),
  borders: toPath(borderRings, false)
};
out.meta.counts = {
  landRings: landRings.length,
  landPoints: verify("land", out.land, landRings),
  borderLines: borderRings.length,
  borderPoints: verify("borders", out.borders, borderRings)
};

const dest = path.join(ROOT, "data/static/world.json");
fs.writeFileSync(dest, JSON.stringify(out));
const kb = (fs.statSync(dest).size / 1024).toFixed(1);
console.log(`\n  ✓ world.json — ${kb} KB · ${out.meta.counts.landRings} land rings ` +
            `(${out.meta.counts.landPoints} points) · ${out.meta.counts.borderLines} border lines ` +
            `(${out.meta.counts.borderPoints} points)\n`);
