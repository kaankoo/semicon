/* ============================================================
   GRAPH — traversal over the dependency edges.

   Small enough to inline anywhere, and deliberately not inlined. The
   Web lights a supply cone with it and Faults computes a blast radius
   with it, and the whole credibility of the second depends on it being
   literally the same walk as the first. A view importing another view
   would break the module graph; a view importing a lib does not.
   ============================================================ */

/** Everything reachable from `id` by following `map` — app.UP for what a
 *  station needs, app.DN for what it feeds. The seed is not included. */
export function cone(id, map) {
  const seen = new Set(), q = [id];
  while (q.length) {
    const k = q.pop();
    (map[k] || []).forEach(x => { if (!seen.has(x)) { seen.add(x); q.push(x); } });
  }
  return seen;
}

/** The same walk from several seeds at once, with the seeds excluded
 *  from the result — remove three stations and this is what is left
 *  standing downstream of them. */
export function coneOfAll(ids, map) {
  const seed = new Set(ids), out = new Set();
  for (const id of ids)
    for (const x of cone(id, map)) if (!seed.has(x)) out.add(x);
  return out;
}

/** How many hops each reachable station sits from the nearest seed.
 *  Breadth-first, so the first time a station is seen is its shortest
 *  path — which is the depth the shock reaches it at. */
export function hops(ids, map) {
  const depth = new Map();
  let front = [...ids], d = 0;
  const seed = new Set(ids);
  while (front.length) {
    d++;
    const next = [];
    for (const k of front)
      for (const x of map[k] || [])
        if (!seed.has(x) && !depth.has(x)) { depth.set(x, d); next.push(x); }
    front = next;
  }
  return depth;
}
