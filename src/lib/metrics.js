/* ============================================================
   METRICS — the arithmetic behind the Moat.

   Pure functions, no DOM, no fetch, no network-derived input of any
   kind. Everything here is computed from the committed corpus, which
   is the whole point: this was once the file that joined market prices
   to the graph, and a price is the one fact on this site that can go
   wrong while nobody is looking. It does not any more.

   The measure that replaced it. Counting organisations per stratum
   looks like data and is not: every station in the corpus carries
   between five and eight named organisations, because that is the
   editorial policy, so a headcount per layer is roughly
   stations-per-layer times six. It comes out flat — 23.0 per stratum
   across the deepest nine against 21.7 across the shallowest three —
   and a bar chart of it would be measuring the curation rather than
   the industry. `bandHeadcount` and `curationBand` exist so the page
   can state those two numbers from the corpus at render instead of
   repeating them, because a caveat carrying a stale figure is worse
   than no caveat.

   What does vary is where those organisations sit. Jurisdiction is
   recorded per organisation per station, it was curated for its own
   sake rather than to make this chart come out, and the concentration
   it produces runs the opposite way to the intuition: the deep
   physical strata draw on many countries, and the shallow software
   strata are a US monoculture. That is a claim the corpus can defend
   without ever being refreshed.

   Two honesty rules hold throughout:

   - An organisation is counted once per stratum, however many stations
     it appears at within it. Otherwise a firm listed at four stations
     in one layer would quadruple its own country's weight.
   - Organisations with no stated jurisdiction — 16 of 527 — are
     excluded from the concentration base rather than bucketed into an
     "unknown" country, which would read as a 44th jurisdiction and
     flatten the index. Every result reports how many it left out.
   ============================================================ */

/** The declared attribution weights, or an even split if none are
 *  declared. Still used by the Moat panel to describe how a company
 *  that spans nineteen stations is apportioned across them. */
export function weightsFor(c) {
  if (c.attribution) return c.attribution;
  return evenWeights(c);
}

export function evenWeights(c) {
  const w = {}, n = c.stations.length || 1;
  c.stations.forEach(s => { w[s] = 1 / n; });
  return w;
}

/** Herfindahl–Hirschman index over a set of counts, 0–1. One country
 *  holding everything is 1; ten equal countries is 0.1. */
export function hhi(values) {
  const v = values.filter(x => x > 0);
  const sum = v.reduce((a, b) => a + b, 0);
  if (!sum) return null;
  return v.reduce((a, b) => a + (b / sum) ** 2, 0);
}

const NAMED = c => c && c[0] && c[0] !== "—";
const JUR = c => (c[3] && c[3] !== "—" ? c[3] : null);

/** Forty-one organisations are recorded against two countries — `UK/US`,
 *  `US/FR`, `IE/US`. Three things go wrong if that string is used as a
 *  bucket key. It becomes a country of its own, so the distinct count
 *  inflates. It removes those organisations from the tallies of the
 *  countries they are actually in, so concentration reads lower than it
 *  is. And `UK/US` appears sixteen times against `US/UK` twice, so the
 *  same pair of countries lands in two different buckets.
 *
 *  Each part gets an equal share instead. That needs no judgement about
 *  which base is primary — the field's ordering is not consistent
 *  enough to carry one — it makes the ordering irrelevant, and it is
 *  the same rule the attribution weights already use: one organisation
 *  is worth one, however many places it is counted in. */
export function splitJurisdiction(j) {
  if (!j) return [];
  const parts = j.split("/").map(x => x.trim()).filter(Boolean);
  const w = 1 / parts.length;
  return parts.map(p => [p, w]);
}

/** Every organisation named at a stratum, once each, with the
 *  jurisdiction it was recorded under. The shared basis for everything
 *  below, exported so a view never re-derives it slightly differently. */
export function orgsAt(stations, stratum) {
  const seen = new Map();
  stations.filter(s => s.L === stratum).forEach(s =>
    s.co.filter(NAMED).forEach(c => { if (!seen.has(c[0])) seen.set(c[0], JUR(c)); }));
  return seen;
}

/** Jurisdictional concentration for one stratum.
 *
 *  Returns { orgs, stated, unstated, distinct, top, topShare, hhi,
 *  tally } — or hhi null where nothing carries a jurisdiction, never 0,
 *  because a zero would read as perfect diversity rather than as
 *  silence. */
export function stratumJurisdictions(stations, stratum) {
  const orgs = orgsAt(stations, stratum);
  const tally = {};
  let stated = 0, unstated = 0, dual = 0;
  for (const j of orgs.values()) {
    if (!j) { unstated++; continue; }
    stated++;
    const parts = splitJurisdiction(j);
    if (parts.length > 1) dual++;
    parts.forEach(([k, w]) => { tally[k] = (tally[k] || 0) + w; });
  }
  const ranked = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  return {
    orgs: orgs.size,
    stated, unstated, dual,
    distinct: ranked.length,
    top: ranked.length ? ranked[0][0] : null,
    topShare: stated ? ranked[0][1] / stated : null,
    hhi: stated ? hhi(Object.values(tally)) : null,
    tally
  };
}

/** The same, for every stratum, keyed by stratum number. */
export function jurisdictionsByStratum(stations, strata) {
  const out = {};
  strata.forEach(l => { out[l.n] = stratumJurisdictions(stations, l.n); });
  return out;
}

/** The headline the page is built on, computed rather than typed: mean
 *  concentration across a band of strata. `deep` and `shallow` are
 *  inclusive ranges. Returns nulls rather than NaN on an empty band. */
export function bandConcentration(stations, strata, lo, hi) {
  const rows = strata.filter(l => l.n >= lo && l.n <= hi)
    .map(l => stratumJurisdictions(stations, l.n))
    .filter(r => r.hhi != null);
  if (!rows.length) return { hhi: null, distinct: null, strata: 0 };
  return {
    hhi: rows.reduce((a, r) => a + r.hhi, 0) / rows.length,
    distinct: rows.reduce((a, r) => a + r.distinct, 0) / rows.length,
    strata: rows.length
  };
}

/** Mean distinct organisations per stratum across a band — the number
 *  the page would be plotting if it plotted a headcount. Exported so
 *  the footer's "and here is why we do not" sentence is arithmetic
 *  rather than a figure someone typed once and stopped checking. */
export function bandHeadcount(stations, strata, lo, hi) {
  const band = strata.filter(l => l.n >= lo && l.n <= hi);
  if (!band.length) return null;
  const total = band.reduce((a, l) => a + orgsAt(stations, l.n).size, 0);
  return total / band.length;
}

/** The spread of organisations-per-station across the whole corpus.
 *  Returns { lo, hi }. If these ever come apart, the claim that a
 *  headcount measures the editing stops being true and the Moat page
 *  needs rewriting rather than quietly becoming meaningful. */
export function curationBand(stations) {
  const per = stations.map(s =>
    new Set(s.co.filter(NAMED).map(c => c[0])).size);
  return { lo: Math.min(...per), hi: Math.max(...per) };
}

/** Chokepoint stations per stratum, from the hand-set criticality
 *  pips. Drawn beside the bars rather than folded into them: the
 *  concentration is arithmetic and the pips are judgement, and this
 *  site does not blend the two. */
export function chokepointsAt(stations, stratum) {
  return stations.filter(s => s.L === stratum && s.c >= 3).length;
}

/** How much of each stratum's cast the ticker spine covers. Retained
 *  because the Index links prices for the organisations in the spine
 *  and nothing for the rest, and the Moat panel says which is which. */
export function coverage(companies, stations, strata) {
  const curated = new Set(Object.values(companies).map(c => c.name));
  const out = {};
  strata.forEach(l => {
    const all = new Set(), done = new Set();
    stations.filter(s => s.L === l.n).forEach(s => s.co.forEach(x => {
      if (!NAMED(x)) return;
      all.add(x[0]);
      if (curated.has(x[0])) done.add(x[0]);
    }));
    out[l.n] = { curated: done.size, corpus: all.size, share: all.size ? done.size / all.size : 0 };
  });
  return out;
}

/* ---------- formatting ---------- */

export function pct(v, digits = 0) {
  return v == null || !isFinite(v) ? "—" : `${(v * 100).toFixed(digits)}%`;
}

/** An index to two places, or a dash. Never 0 for absent. */
export function idx(v) {
  return v == null || !isFinite(v) ? "—" : v.toFixed(2);
}
