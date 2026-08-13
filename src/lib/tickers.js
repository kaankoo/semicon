/* ============================================================
   TICKERS — turning a name in the corpus into a place to look up
   a price, without this site ever holding one.

   The decision behind this file. Prices were fetched nightly, and the
   pipeline worked, but a market capitalisation needs a share count as
   well as a price and the only free source of share counts covers US
   filers. Sixty-five of the 171 listed organisations here are listed
   in Taipei, Tokyo, Seoul, Frankfurt, Amsterdam or Paris — and they
   are concentrated in exactly the deep strata this site exists to
   argue about. A market-cap chart built on US filings alone would have
   drawn the physical base as near-worthless and the software layer as
   enormous: the inverse of the argument, rendered authoritatively.

   So the site stopped holding prices and started pointing at them. The
   reader gets a live number from a source that maintains it, this repo
   gets one less thing that can rot, and nothing on any page can ever
   be stale — because nothing on any page is a price.

   Why Yahoo rather than a better-looking provider: the tickers in
   companies.json are already in Yahoo's symbol convention, because
   that is what the old ingest fetched against. `2330.TW`, `005930.KS`,
   `8035.T`, `SU.PA`, `ASM.AS`. Every other provider would need a
   hand-maintained symbol map for the 65 foreign listings — which is
   the maintenance burden this whole change exists to remove.
   ============================================================ */

const HOST = "https://finance.yahoo.com/quote/";

/** Where a ticker can be looked up. Encoded because symbols contain
 *  dots and, in a few cases, characters that are not URL-safe. */
export function quoteUrl(ticker) {
  return ticker ? HOST + encodeURIComponent(ticker) : null;
}

/** What we can offer for an organisation named in the corpus.
 *
 *  Returns { ticker, url, via } or null. `via` is set when the
 *  organisation is a division and the link points at its listed parent
 *  — Google DeepMind does not trade, GOOGL does, and sending a reader
 *  there while saying so is more useful than a dash and more honest
 *  than implying DeepMind has a price of its own.
 *
 *  Note that `parent` in companies.json holds a **ticker**, not a name.
 *  That is worth stating because it reads like a name field and is not:
 *  twelve of the 38 divisions name a parent that is not itself a spine
 *  entry, because the parent operates at no station in this corpus —
 *  Alphabet, Hitachi, Sony, Hyundai, Atlas Copco. Those are still real
 *  symbols and still link correctly, so the lookup resolves the ticker
 *  directly rather than insisting on finding a spine row first.
 *
 *  Private companies, institutions and abstractions return null, which
 *  renders as a dash. Absent is absent, never zero and never a guess. */
export function lookupFor(name, byName) {
  const c = byName[name];
  if (!c) return null;

  if (c.kind === "listed" && c.ticker)
    return { ticker: c.ticker, url: quoteUrl(c.ticker), via: null };

  if (c.kind === "division" && c.parent) {
    /* the parent may or may not be a spine row; the ticker is what the
       link needs, and the row only supplies a nicer label */
    const p = Object.values(byName).find(x => x.ticker === c.parent);
    return { ticker: c.parent, url: quoteUrl(c.parent), via: p ? p.name : c.parent };
  }
  return null;
}

/** Every distinct symbol the Index will link to, listed and via-parent
 *  alike. This is what the weekly link check must actually verify: a
 *  parent ticker with no spine row of its own would otherwise never be
 *  checked, and those are twelve live links. */
export function allTickers(companies) {
  const t = new Set();
  Object.values(companies).forEach(c => {
    if (c.kind === "listed" && c.ticker) t.add(c.ticker);
    if (c.kind === "division" && c.parent) t.add(c.parent);
  });
  return [...t].sort();
}

/** Every organisation the corpus names that we can offer a lookup for.
 *  Used by the tests to hold the join steady: if a rename in
 *  stations.json ever stops matching companies.json, this number moves
 *  and the build says so rather than the column quietly emptying. */
export function linkable(stations, byName) {
  const seen = new Set(), out = new Set();
  stations.forEach(s => s.co.forEach(c => {
    const n = c[0];
    if (!n || n === "—" || seen.has(n)) return;
    seen.add(n);
    if (lookupFor(n, byName)) out.add(n);
  }));
  return { named: seen.size, linkable: out.size, names: out };
}
