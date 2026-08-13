/* Ticker health check — the only thing on this project that touches a
   network, and it no longer brings anything back.

   This file used to fetch prices, fundamentals and FX every weekday and
   commit a snapshot. It worked. It was removed anyway, because a market
   capitalisation needs a share count as well as a price, the only free
   source of share counts covers US filers, and 65 of the 171 listed
   organisations here are listed in Taipei, Tokyo, Seoul, Frankfurt,
   Amsterdam or Paris — concentrated in exactly the deep strata the site
   exists to argue about. A market-cap chart built on US filings alone
   would have drawn the physical base as near-worthless: the inverse of
   the argument, rendered in the site's own colours.

   So the site stopped holding prices. The Index links out to Yahoo
   instead, and the only thing left worth automating is asking whether
   those links still resolve. A ticker dies quietly — an acquisition, a
   delisting, a symbol change — and a dead link is the one kind of rot
   this design can still suffer.

   It writes no prices and commits no numbers. It writes a list of
   tickers that did not answer, which is a maintenance to-do rather
   than a fact about the world, and it runs weekly because that is how
   often a symbol changes.

     node scripts/ingest/run.mjs            # check every ticker
     node scripts/ingest/run.mjs --dry      # fetch nothing, prove the plumbing
     node scripts/ingest/run.mjs --only=NVDA,2330.TW                          */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const STATIC = path.join(ROOT, "data/static");
const LIVE = path.join(ROOT, "data/live");

const argv = process.argv.slice(2);
const DRY = argv.includes("--dry");
const ONLY = (argv.find(a => a.startsWith("--only=")) || "").split("=")[1]?.split(",").filter(Boolean);

const UA = "sand-to-sentence/1.0 (github.com/kaankoo/semicon; sidisposablemail@gmail.com)";
const today = new Date().toISOString().slice(0, 10);

const read = f => JSON.parse(fs.readFileSync(f, "utf8"));
const write = (f, o) => {
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify(o, null, 2) + "\n");
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

/** Does this symbol still resolve? Yahoo's v8 chart endpoint answers
 *  without auth and 404s on a symbol it does not know, which is exactly
 *  and only the question being asked. The response body is discarded —
 *  nothing fetched here is ever written to the corpus. */
async function resolves(ticker) {
  const u = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=5d&interval=1d`;
  const r = await fetch(u, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (r.status === 404) return { ok: false, why: "unknown symbol" };
  if (!r.ok) return { ok: null, why: `HTTP ${r.status}` };   // null = inconclusive, not a failure
  const j = await r.json().catch(() => null);
  return j?.chart?.result?.[0] ? { ok: true } : { ok: false, why: "no result" };
}

async function main() {
  const spine = read(path.join(STATIC, "companies.json"));
  /* the same list the Index renders, from the same function, so a
     symbol can never be linked-but-unchecked. That matters most for
     the twelve division parents — Alphabet, Hitachi, Sony — which are
     live links and are not spine rows of their own. */
  const { allTickers } = await import(pathToFileURL(path.join(ROOT, "src/lib/tickers.js")).href);
  const listed = allTickers(spine.companies)
    .filter(t => !ONLY || ONLY.includes(t))
    .map(t => [t, { ticker: t, name: Object.values(spine.companies).find(c => c.ticker === t)?.name || t }]);

  const out = {
    checked: today,
    dry: DRY,
    tickers: listed.length,
    dead: [],            // resolved to nothing — the Index link is broken
    inconclusive: [],     // rate-limited or transient; not a finding
    note: "Link health only. This project commits no prices; the Index links out to Yahoo."
  };

  if (DRY) {
    console.log(`  dry run — ${listed.length} tickers in the spine, nothing fetched`);
  } else {
    for (const [, c] of listed) {
      try {
        const r = await resolves(c.ticker);
        if (r.ok === false) out.dead.push({ ticker: c.ticker, name: c.name, why: r.why });
        else if (r.ok === null) out.inconclusive.push({ ticker: c.ticker, why: r.why });
      } catch (e) {
        out.inconclusive.push({ ticker: c.ticker, why: e.message });
      }
      await sleep(150);
    }
  }

  write(path.join(LIVE, "tickers.json"), out);

  console.log(`\n  ${DRY ? "dry run complete" : "checked " + listed.length + " tickers"} — ` +
              `${out.dead.length} dead, ${out.inconclusive.length} inconclusive\n`);
  if (out.dead.length) {
    console.log("  these Index links point at nothing and need a corrected ticker:\n");
    out.dead.forEach(d => console.log(`    ${d.ticker.padEnd(12)} ${d.name} — ${d.why}`));
    console.log("");
  }
}

main().catch(e => { console.error(e); process.exit(1); });
