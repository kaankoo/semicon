/* Ingest — the only thing on this project that touches a network.

   Runs in a GitHub Action on weekday evenings, writes data/live/*.json,
   and commits the result. The site then stays entirely static: no
   worker in the request path, nothing to 500, and every commit is a
   dated snapshot that accumulates into a time series nobody else has.

   The rule this file exists to enforce: NEVER SHIP A SILENT STALE
   NUMBER. If a source fails, yesterday's value is kept, the failure is
   written to meta.json with the reason, and the view puts a staleness
   badge on the figure. A wrong number that looks fresh is worse than
   no number, and this whole section is only worth having if that is
   true in the code rather than in the README.

     node scripts/ingest/run.mjs            # full run
     node scripts/ingest/run.mjs --dry      # fetch nothing, prove the plumbing
     node scripts/ingest/run.mjs --only=AAPL,NVDA

   It has never been run at the time of writing. `--dry` is what CI
   exercises on every push so the plumbing cannot rot while the live
   run is switched off. */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const STATIC = path.join(ROOT, "data/static");
const LIVE = path.join(ROOT, "data/live");
const HISTORY = path.join(ROOT, "data/history");

const argv = process.argv.slice(2);
const DRY = argv.includes("--dry");
const ONLY = (argv.find(a => a.startsWith("--only=")) || "").split("=")[1]?.split(",").filter(Boolean);

const UA = "sand-to-sentence/1.0 (static site corpus; contact via github.com/kaankoo/semicon)";
const today = new Date().toISOString().slice(0, 10);

const read = f => JSON.parse(fs.readFileSync(f, "utf8"));
const readIf = f => (fs.existsSync(f) ? read(f) : null);
const write = (f, o) => {
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify(o, null, f.endsWith("meta.json") ? 2 : 0) + "\n");
};

const sleep = ms => new Promise(r => setTimeout(r, ms));
const meta = { ran: new Date().toISOString(), dry: DRY, sources: {}, failures: [], kept: 0 };

/* ---------- fetch with a budget ---------- */

async function get(url, { json = true, retries = 2 } = {}) {
  for (let i = 0; i <= retries; i++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA, Accept: json ? "application/json" : "text/csv" } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return json ? await r.json() : await r.text();
    } catch (e) {
      if (i === retries) throw e;
      await sleep(400 * (i + 1));
    }
  }
}

/* ---------- sources ---------- */

/** Yahoo's v8 chart endpoint. The v7 quote endpoint returns 401; v8
 *  still answers, one request per ticker, and gives us the previous
 *  close and enough metadata to derive a market cap where shares
 *  outstanding is known. Unofficial, hence the Stooq fallback. */
async function yahoo(ticker) {
  const u = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}` +
            `?range=1y&interval=1d`;
  const j = await get(u);
  const r = j?.chart?.result?.[0];
  if (!r) throw new Error("no result");
  const m = r.meta || {};
  const closes = (r.indicators?.quote?.[0]?.close || []).filter(x => x != null);
  const last = m.regularMarketPrice ?? closes.at(-1);
  if (last == null) throw new Error("no price");
  const back = n => (closes.length > n ? closes.at(-1 - n) : null);
  const chg = p => (p == null ? null : +((last - p) / p).toFixed(6));
  return {
    price: last,
    currency: m.currency || null,
    marketCap: null,                        // filled by shares × price where known
    prevClose: m.chartPreviousClose ?? back(1),
    d1: chg(m.chartPreviousClose ?? back(1)),
    m1: chg(back(21)),
    y1: chg(back(251)),
    hi52: m.fiftyTwoWeekHigh ?? (closes.length ? Math.max(...closes) : null),
    lo52: m.fiftyTwoWeekLow ?? (closes.length ? Math.min(...closes) : null),
    source: "yahoo"
  };
}

/** Stooq's CSV. Fewer fields, no auth, and it answers when Yahoo does
 *  not. Symbols differ — US tickers take a `.us` suffix. */
async function stooq(ticker) {
  const sym = /^[A-Z.]+$/.test(ticker) ? `${ticker.toLowerCase()}.us` : ticker.toLowerCase();
  const csv = await get(`https://stooq.com/q/l/?s=${encodeURIComponent(sym)}&f=sd2t2ohlcv&h&e=csv`, { json: false });
  const row = csv.trim().split("\n")[1]?.split(",");
  if (!row || row[6] === "N/D") throw new Error("no data");
  return { price: +row[6], currency: null, marketCap: null, source: "stooq" };
}

/** The SEC's own ticker → CIK map. This is why companies.json leaves
 *  `cik` null: a hand-typed CIK is a silent wrong answer, and the
 *  authoritative mapping is one request away. */
async function cikMap() {
  const j = await get("https://www.sec.gov/files/company_tickers.json");
  const out = {};
  for (const v of Object.values(j)) out[v.ticker] = String(v.cik_str).padStart(10, "0");
  return out;
}

/** XBRL company facts. Authoritative, free, and rate-limited to ten a
 *  second — hence the sleep. US filers only; everything else is
 *  hand-curated quarterly, which PLAN.md is right to call the moat
 *  rather than a workaround. */
async function edgarFacts(cik) {
  const j = await get(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`);
  const pick = (tag, unit = "USD") => {
    const f = j?.facts?.["us-gaap"]?.[tag]?.units?.[unit];
    if (!f) return null;
    const annual = f.filter(x => x.form === "10-K" && x.fp === "FY").sort((a, b) => (a.end < b.end ? 1 : -1));
    return annual[0]?.val ?? null;
  };
  return {
    revenue: pick("RevenueFromContractWithCustomerExcludingAssessedTax") ?? pick("Revenues"),
    grossProfit: pick("GrossProfit"),
    operatingIncome: pick("OperatingIncomeLoss"),
    capex: pick("PaymentsToAcquirePropertyPlantAndEquipment"),
    cash: pick("CashAndCashEquivalentsAtCarryingValue"),
    shares: pick("CommonStockSharesOutstanding", "shares") ??
            pick("EntityCommonStockSharesOutstanding", "shares"),
    source: "edgar"
  };
}

/** Everything to USD. The ECB's rates by way of Frankfurter — free,
 *  no key, and the reference set most people would check against. */
async function fx() {
  const j = await get("https://api.frankfurter.app/latest?from=USD");
  return { base: "USD", rates: j.rates, date: j.date };
}

/* ---------- run ---------- */

async function main() {
  const spine = read(path.join(STATIC, "companies.json"));
  const listed = Object.entries(spine.companies)
    .filter(([, c]) => c.kind === "listed" && c.ticker)
    .filter(([, c]) => !ONLY || ONLY.includes(c.ticker));

  const prevQuotes = readIf(path.join(LIVE, "quotes.json"))?.quotes || {};
  const quotes = {}, fundamentals = {};

  if (DRY) {
    console.log(`  dry run — ${listed.length} listed tickers in the spine, nothing fetched`);
    meta.sources.yahoo = "skipped (dry)";
    meta.sources.edgar = "skipped (dry)";
    meta.sources.fx = "skipped (dry)";
  } else {
    /* --- FX first, because everything downstream is normalised by it --- */
    try { meta.fx = await fx(); meta.sources.fx = "ok"; }
    catch (e) { meta.sources.fx = `failed: ${e.message}`; meta.failures.push("fx"); }

    /* --- prices, Yahoo with a Stooq fallback --- */
    let ok = 0, fell = 0;
    for (const [id, c] of listed) {
      let q = null;
      try { q = await yahoo(c.ticker); ok++; }
      catch {
        try { q = await stooq(c.ticker); fell++; }
        catch (e) { meta.failures.push(`${c.ticker}: ${e.message}`); }
      }
      if (q) quotes[c.ticker] = q;
      else if (prevQuotes[c.ticker]) {
        /* keep yesterday, and say so — this is the whole point */
        quotes[c.ticker] = { ...prevQuotes[c.ticker], stale: true, staleSince: prevQuotes[c.ticker].staleSince || today };
        meta.kept++;
      }
      await sleep(120);
    }
    meta.sources.yahoo = `${ok} ok, ${fell} via stooq, ${meta.failures.length} failed`;

    /* --- US fundamentals from EDGAR, and shares outstanding so a
           market cap can be computed rather than taken on faith --- */
    try {
      const map = await cikMap();
      let n = 0;
      for (const [id, c] of listed) {
        const cik = map[c.ticker];
        if (!cik) continue;
        try {
          const f = await edgarFacts(cik);
          fundamentals[c.ticker] = { ...f, cik };
          if (f.shares && quotes[c.ticker]?.price)
            quotes[c.ticker].marketCap = f.shares * quotes[c.ticker].price;
          n++;
        } catch (e) { meta.failures.push(`edgar ${c.ticker}: ${e.message}`); }
        await sleep(110);                       // ≤10 req/s, as SEC asks
      }
      meta.sources.edgar = `${n} filers`;
    } catch (e) {
      meta.sources.edgar = `failed: ${e.message}`;
      meta.failures.push("edgar");
    }
  }

  /* --- what changed since yesterday --- */
  const changelog = [];
  for (const [t, q] of Object.entries(quotes)) {
    const p = prevQuotes[t];
    if (p && p.price && q.price && Math.abs(q.price / p.price - 1) > 0.08)
      changelog.push({ ticker: t, move: +(q.price / p.price - 1).toFixed(4) });
  }
  changelog.sort((a, b) => Math.abs(b.move) - Math.abs(a.move));

  /* a dry run says so in every file it writes, so an empty quotes.json
     can never be read as "we looked and the market was empty" */
  const stamp = DRY ? { asOf: today, dry: true, note: "Dry run — nothing was fetched." } : { asOf: today };
  write(path.join(LIVE, "quotes.json"), { ...stamp, quotes });
  write(path.join(LIVE, "fundamentals.json"), { ...stamp, fundamentals });
  write(path.join(LIVE, "changelog.json"), { ...stamp, moves: changelog.slice(0, 20) });
  write(path.join(LIVE, "meta.json"), meta);

  /* --- the daily close, appended ---
     One file per trading day, deliberately lean: a ticker, its close and
     its market cap, and nothing else. About 5 KB a day, so a year of
     commits is a megabyte rather than a hundred.

     A stale quote is omitted rather than repeated. Writing yesterday's
     price under today's date would fabricate a data point, and a history
     series is exactly where that lie would be hardest to see later. A
     ticker that failed simply has a gap, which is honest and which any
     chart can draw as a break. */
  if (!DRY) {
    const close = {}, cap = {};
    for (const [t, q] of Object.entries(quotes)) {
      if (q.stale) continue;
      if (q.price != null) close[t] = q.price;
      if (q.marketCap != null) cap[t] = Math.round(q.marketCap);
    }
    if (Object.keys(close).length) {
      write(path.join(HISTORY, `${today}.json`), { asOf: today, close, cap });
      meta.history = { asOf: today, closes: Object.keys(close).length, omittedStale: meta.kept };
    }
    write(path.join(LIVE, "meta.json"), meta);
  }

  console.log(`\n  ${DRY ? "dry run complete" : "ingest complete"} — ` +
              `${Object.keys(quotes).length} quotes, ${Object.keys(fundamentals).length} filers, ` +
              `${meta.kept} kept from yesterday, ${meta.failures.length} failures\n`);
  if (meta.failures.length) console.log("  failures written to data/live/meta.json\n");
}

main().catch(e => { console.error(e); process.exit(1); });
