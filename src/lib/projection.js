/* ============================================================
   PROJECTION — equirectangular, hand-rolled, no library.

   Plate carrée: x = longitude, y = −latitude. It is chosen for one
   reason. Being affine in lon/lat, the entire coastline can be drawn
   once as a path string in degrees and then panned and zoomed by a
   single SVG transform — no point is ever re-projected, at any frame
   rate, on any hardware. Nothing prettier buys anything the Atlas needs.

   What it costs: east–west distance is stretched by 1/cos(latitude).
   Sweden looks wider than it is; the equator is honest. Because that
   distortion is real and this map draws circles that claim to be true
   to the ground, chokepoint rings are NOT drawn as circles. They are
   built as geodesic polygons — a ring of points each exactly r km from
   the centre, walked around the compass — and then projected like any
   other geometry. The ring therefore comes out as an oval that widens
   with latitude, which is what a true circle looks like in this
   projection. `ringRadiusError` exists so a test can hold us to it.
   ============================================================ */

/** Mean Earth radius, km. IUGG. */
export const R_EARTH = 6371.0088;

const RAD = Math.PI / 180, DEG = 180 / Math.PI;

/* ---------- the camera ----------
   { lon, lat, k } — the degrees at the centre of the stage and k, the
   pixels drawn per degree of longitude. */

/** The SVG transform that maps lon/lat-space geometry onto the stage. */
export function transform(cam, W, H) {
  const { lon, lat, k } = cam;
  return `translate(${(W / 2 - lon * k).toFixed(3)},${(H / 2 + lat * k).toFixed(3)}) scale(${k.toFixed(5)})`;
}

/** Where a coordinate lands on the stage, in pixels. */
export function project(lon, lat, cam, W, H) {
  return {
    x: W / 2 + (lon - cam.lon) * cam.k,
    y: H / 2 - (lat - cam.lat) * cam.k
  };
}

/** …and back again. */
export function unproject(x, y, cam, W, H) {
  return {
    lon: cam.lon + (x - W / 2) / cam.k,
    lat: cam.lat - (y - H / 2) / cam.k
  };
}

/** The world repeats every 360°. Return the copy of `lon` nearest `near`,
 *  so a site west of the antimeridian still draws beside its neighbours
 *  when the camera has panned across it. */
export function wrapLon(lon, near) {
  return lon - 360 * Math.round((lon - near) / 360);
}

/** The lon/lat rectangle currently on screen. */
export function viewBounds(cam, W, H) {
  const a = unproject(0, 0, cam, W, H), b = unproject(W, H, cam, W, H);
  return { w: a.lon, e: b.lon, n: a.lat, s: b.lat };
}

/** A camera that frames a lon/lat box with `pad` fraction of slack. */
export function fitTo(box, W, H, pad = 0.14) {
  const dLon = Math.max(1e-4, box.e - box.w), dLat = Math.max(1e-4, box.n - box.s);
  const k = Math.min(W / dLon, H / dLat) * (1 - pad);
  return { lon: (box.w + box.e) / 2, lat: (box.s + box.n) / 2, k };
}

/* ---------- distances on the sphere ---------- */

/** Great-circle distance between two coordinates, km. */
export function haversine(lon1, lat1, lon2, lat2) {
  const φ1 = lat1 * RAD, φ2 = lat2 * RAD;
  const dφ = (lat2 - lat1) * RAD, dλ = (lon2 - lon1) * RAD;
  const a = Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;
  return 2 * R_EARTH * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** The point `km` away from (lon,lat) on the given bearing, in degrees. */
export function destination(lon, lat, km, bearingDeg) {
  const δ = km / R_EARTH, θ = bearingDeg * RAD;
  const φ1 = lat * RAD, λ1 = lon * RAD;
  const sinφ2 = Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ);
  const φ2 = Math.asin(Math.min(1, Math.max(-1, sinφ2)));
  const λ2 = λ1 + Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
                             Math.cos(δ) - Math.sin(φ1) * sinφ2);
  return [λ2 * DEG, φ2 * DEG];
}

/** A geodesic circle: `n` points, each exactly `km` from the centre. */
export function ring(lon, lat, km, n = 96) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(destination(lon, lat, km, (i * 360) / n));
  return out;
}

/** That ring as a closed path in lon/lat space, ready for the geometry
 *  group. Longitudes are unwrapped so a ring straddling ±180° stays in
 *  one piece rather than flying across the map. */
export function ringPath(lon, lat, km, n = 96) {
  const pts = ring(lon, lat, km, n).map(([x, y]) => [wrapLon(x, lon), -y]);
  return "M" + pts.map(p => `${p[0].toFixed(4)} ${p[1].toFixed(4)}`).join("L") + "Z";
}

/** The worst deviation, as a fraction, between a generated ring's points
 *  and the radius they claim. A truthful ring returns ~1e-12; a ring
 *  drawn as a screen-space circle would return the cosine error, which
 *  at Hsinchu is about 9 percent. Asserted in the smoke test. */
export function ringRadiusError(lon, lat, km, n = 96) {
  let worst = 0;
  for (const [x, y] of ring(lon, lat, km, n))
    worst = Math.max(worst, Math.abs(haversine(lon, lat, x, y) - km) / km);
  return worst;
}

/* ---------- graticule ---------- */

/** Meridians and parallels at the given spacing, as one path string in
 *  lon/lat space. Cheap orientation, and the only cue that the vertical
 *  axis is not lying while the horizontal one is. */
export function graticule(step = 15, box = { w: -180, e: 180, s: -85, n: 85 }) {
  let d = "";
  const from = Math.ceil(box.w / step) * step, to = Math.floor(box.e / step) * step;
  for (let lon = from; lon <= to; lon += step) d += `M${lon} ${-box.n}V${-box.s}`;
  const fromLat = Math.ceil(box.s / step) * step, toLat = Math.floor(box.n / step) * step;
  for (let lat = fromLat; lat <= toLat; lat += step) d += `M${box.w} ${-lat}H${box.e}`;
  return d;
}
