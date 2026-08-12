/* ============================================================
   METRICS — the arithmetic that joins money to the graph.

   Pure functions, no DOM, no fetch. Every one of them takes the corpus
   and an optional quote table and returns null rather than a number
   when the quotes are not there. That is the important property: this
   file is the only place a market-cap figure is ever produced, so if
   nothing has been ingested there is nowhere for a plausible-looking
   number to come from.

   The one idea worth stating plainly: a company at nineteen stations
   must not be counted nineteen times. Every company's market cap is
   split across its stations by an attribution weight, and the weights
   sum to one. The default split is even, which involves no judgement
   and is fully reproducible. A handful of entries carry hand-set
   weights instead, because an even split would put 5% of NVIDIA in the
   scheduling layer. Those are labelled `judgement` and `evenWeights`
   exists so the view can show what the judgement changed.
   ============================================================ */

/** The declared weights, or an even split if none are declared. */
export function weightsFor(c) {
  if (c.attribution) return c.attribution;
  return evenWeights(c);
}

export function evenWeights(c) {
  const w = {}, n = c.stations.length || 1;
  c.stations.forEach(s => { w[s] = 1 / n; });
  return w;
}

/** What a company is worth for aggregation purposes, in whatever unit
 *  the quote table is in. Divisions carry an estimated share of their
 *  parent. Anything without a price returns null — never zero, because
 *  zero would silently drag an average down. */
export function valueOf(c, quotes) {
  if (!quotes) return null;
  if (c.kind === "listed") {
    const q = quotes[c.ticker];
    return q && q.marketCap > 0 ? q.marketCap : null;
  }
  if (c.kind === "division" && c.parent && c.parentShare != null) {
    const q = quotes[c.parent];
    return q && q.marketCap > 0 ? q.marketCap * c.parentShare : null;
  }
  return null;   // private, institution, abstract — no market value, by design
}

/** Aggregate market cap per stratum, with fractional attribution.
 *  Returns { byStratum, byStation, priced, unpriced, total } or null. */
export function layerTotals(companies, stations, quotes, opts = {}) {
  if (!quotes) return null;
  const byId = {};
  stations.forEach(s => { byId[s.i] = s; });
  const byStratum = {}, byStation = {};
  let priced = 0, unpriced = 0, total = 0;

  for (const c of Object.values(companies)) {
    const v = valueOf(c, quotes);
    if (v == null) { if (c.kind === "listed" || c.kind === "division") unpriced++; continue; }
    priced++;
    total += v;
    const w = opts.basis === "even" ? evenWeights(c) : weightsFor(c);
    for (const [st, share] of Object.entries(w)) {
      const s = byId[st];
      if (!s) continue;
      byStation[st] = (byStation[st] || 0) + v * share;
      byStratum[s.L] = (byStratum[s.L] || 0) + v * share;
    }
  }
  return { byStratum, byStation, priced, unpriced, total };
}

/** Herfindahl–Hirschman index over a set of values, 0–1. One company
 *  holding everything is 1; ten equal companies is 0.1. */
export function hhi(values) {
  const v = values.filter(x => x > 0);
  const sum = v.reduce((a, b) => a + b, 0);
  if (!sum) return null;
  return v.reduce((a, b) => a + (b / sum) ** 2, 0);
}

/** Concentration per stratum, computed on attributed value rather than
 *  on company count — a layer with twenty companies and one of them
 *  holding 90% is not diversified. */
export function stratumHHI(companies, stations, quotes, stratum, opts = {}) {
  if (!quotes) return null;
  const byId = {};
  stations.forEach(s => { byId[s.i] = s; });
  const parts = [];
  for (const c of Object.values(companies)) {
    const v = valueOf(c, quotes);
    if (v == null) continue;
    const w = opts.basis === "even" ? evenWeights(c) : weightsFor(c);
    let here = 0;
    for (const [st, share] of Object.entries(w))
      if (byId[st] && byId[st].L === stratum) here += v * share;
    if (here > 0) parts.push(here);
  }
  return parts.length ? hhi(parts) : null;
}

/** How much of each stratum's cast this spine actually covers. A layer
 *  aggregate at 23% coverage is not comparable to one at 100%, and the
 *  view is required to say so. */
export function coverage(companies, stations, strata) {
  const curated = new Set(Object.values(companies).map(c => c.name));
  const out = {};
  strata.forEach(l => {
    const all = new Set(), done = new Set();
    stations.filter(s => s.L === l.n).forEach(s => s.co.forEach(x => {
      if (x[0] === "—") return;
      all.add(x[0]);
      if (curated.has(x[0])) done.add(x[0]);
    }));
    out[l.n] = { curated: done.size, corpus: all.size, share: all.size ? done.size / all.size : 0 };
  });
  return out;
}

/** Everything with a price sitting at any of these stations, and what
 *  it is worth attributed to them. Used by the Faults overlay to put a
 *  number on a blast radius. */
export function capitalAt(stationIds, companies, quotes, opts = {}) {
  const want = new Set(stationIds);
  const names = [], byName = {};
  let value = 0, listed = 0, privateCount = 0, priced = 0;
  for (const c of Object.values(companies)) {
    if (!c.stations.some(s => want.has(s))) continue;
    /* who stands here is a property of the spine and needs no prices —
       only what they are worth does */
    if (c.kind === "private") privateCount++;
    if (c.kind === "listed" || c.kind === "division") listed++;
    const v = valueOf(c, quotes);
    if (v == null) continue;
    priced++;
    const w = opts.basis === "even" ? evenWeights(c) : weightsFor(c);
    let here = 0;
    for (const [st, share] of Object.entries(w)) if (want.has(st)) here += v * share;
    if (here > 0) { value += here; byName[c.name] = here; names.push(c.name); }
  }
  names.sort((a, b) => byName[b] - byName[a]);
  return {
    value: priced ? value : null,
    listed, private: privateCount, priced,
    top: names.slice(0, 20), byName
  };
}

/** How deep in the stack a company sits, weighted the same way its
 *  value is. The x-axis of the Depth Curve, when that arrives. */
export function depthOf(c, stations) {
  const byId = {};
  stations.forEach(s => { byId[s.i] = s; });
  const w = weightsFor(c);
  let d = 0, n = 0;
  for (const [st, share] of Object.entries(w)) {
    if (!byId[st]) continue;
    d += byId[st].L * share; n += share;
  }
  return n ? d / n : null;
}

/* ---------- formatting ---------- */

/** Money, at the magnitude a reader can hold. Never invents precision:
 *  a null stays a dash. */
export function usd(v) {
  if (v == null || !isFinite(v)) return "—";
  const a = Math.abs(v);
  if (a >= 1e12) return `$${(v / 1e12).toFixed(2)}tn`;
  if (a >= 1e9) return `$${(v / 1e9).toFixed(a >= 1e10 ? 0 : 1)}bn`;
  if (a >= 1e6) return `$${(v / 1e6).toFixed(0)}m`;
  return `$${Math.round(v)}`;
}

export function pct(v, digits = 0) {
  return v == null || !isFinite(v) ? "—" : `${(v * 100).toFixed(digits)}%`;
}
