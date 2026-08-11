# Sand to Sentence — the MONEY section

**Backing the knowledge with data. A section, not a thesis.**

> **Revised scope.** The homepage stays exactly as it is. This becomes a new tab — **MONEY** — sitting between Web and Index, absorbing the Index table as its screener. Learning remains primary; price is the supporting evidence. See `IDEAS.md` for the non-financial lenses that take priority over this one.

---

## 0. What you already have (and why it's rarer than you think)

One file, 1,929 lines, 257 KB. Inside it:

| | |
|---|---|
| Strata | 27 |
| Stations | 131 |
| Companies | 533 unique, 804 station-appearances |
| Dependency edges | ~400, hand-written |
| Jurisdictions | 40+ |
| Criticality ratings | hand-assigned 0–3 per station |
| Chokepoint prose | 131 paragraphs of judgment |

Strip away the CSS and what remains is **a curated causal graph of the AI economy**. That is the asset. Not the prose, not the palette — the graph.

Bloomberg SPLC has supply-chain data, but it's derived from filings, noisy, and $25k/year. FactSet's is worse and pricier. Nothing free comes close. And crucially: nobody's graph is *physics-first*. Yours knows that HBM depends on CoWoS depends on foundry depends on EUV depends on tin plasma depends on a district in North Carolina. That chain isn't in any filing. It's in your head, and now it's in a file.

**The gap:** it is currently a museum. Beautiful, authoritative, read-only. Nothing in it changes, nothing computes, and there is no reason to come back tomorrow.

---

## 1. The thesis

> **Attach money to a causal graph and you can compute things that no financial platform on Earth can compute.**

Every finance site has prices, multiples and charts. None of them has the graph. You have the graph. The join is the whole product.

Concretely, the join unlocks six classes of question that are currently unanswerable anywhere:

1. **Where does the money in AI actually sit?** Aggregate market cap by physical layer. Not by GICS sector — by position in the production chain.
2. **Which layer is the most monopolised?** Herfindahl index computed on real revenue share, per stratum, updated daily.
3. **What is this company actually exposed to?** Not "who they mention in the 10-K" — the full upstream dependency cone traced through physics, five layers deep.
4. **What breaks if X breaks?** Sever a node, propagate the damage, count the market cap downstream.
5. **How much is the market paying per unit of physics?** $ of market cap per gigawatt of committed power. Per HBM stack. Per EUV scanner. Per 300 mm wafer start.
6. **How circular is the money?** Share of a company's revenue coming from counterparties it has funded.

Question 6 is the single most-asked question in the AI trade in August 2026 — NVIDIA is reportedly structuring $750bn+ of interlocking deals, and CDS on its bonds is trading. Nobody publishes the number. You can.

---

## 2. Decisions taken

| Decision | Choice | Consequence |
|---|---|---|
| Freshness | Daily close, git-committed | Site stays fully static. $0 forever. Every commit is a dated snapshot → free time-series archive. |
| Scope | Full 27-layer stack; tradeable layer first-class | The physical map is what makes the financial view unique. Don't amputate it. |
| Audience | Public artifact + personal instrument | Must be beautiful on first load *and* dense on the tenth. Solved with a density mode, not two sites. |
| Placement | A **MONEY** tab between Web and Index | Homepage untouched. Index is absorbed here as the screener. |
| Section landing | **The Stack, Priced** | Not the site's hero — the Money tab's. Comprehensible in three seconds, answers "where is the money." |
| Killer interaction | **Faults** (shock propagation) | The reason people stay inside this section. |

### On git-as-database

This is the quietly excellent part of the daily-commit choice. A GitHub Action writes `data/live/*.json` every weekday and commits it. Three consequences:

- **Zero runtime cost and zero fragility.** No Worker in the request path. If Yahoo breaks at 22:30 UTC, yesterday's numbers stay live and a staleness stamp appears. Nothing 500s.
- **Free history.** After ninety days you own a time series of *layer-level* aggregates that literally does not exist elsewhere. "Market cap of the Patterning layer, 2026" is a chart nobody else can draw.
- **A daily diff.** The Action compares yesterday to today and writes a human-readable changelog: biggest layer move, biggest single name, any concentration shift, any new 52-week extreme in a level-3 chokepoint. That's a reason to return and a thing to share.

A Cloudflare Worker stays optional and out of the critical path — useful later for on-demand delayed quotes and OG image generation, never required for the site to work.

---

## 3. Inside the MONEY tab

Four views inside one new tab, keeping the geological conceit because it's excellent and it now does double duty. The existing Descent and Web are untouched; they gain only a small optional stat line each, off by default.

### 3.1 **The Stack, Priced** *(the section's landing view)*

The Descent's core-sample bars are sized by *station count*. Money opens with the **same column, sized by market capitalisation instead** — so the reader arrives at a figure they already recognise, rearranged. That recognition is the whole trick: it's the homepage's image, re-weighted by money, which teaches more than either version alone.

- Bar width = aggregate market cap of the layer
- Bar colour = existing stratum colour; **saturation** = concentration (HHI)
- A hairline delta ribbon on the right edge = today's move, green/magenta
- Axis toggle: `market cap · revenue · capex · gross margin · power draw · headcount`
- The deposition animation is reused from the homepage — but here it means something else. The market is being deposited, bottom-up, on load.

That single image answers "where does the money in AI sit" better than any chart currently published. It is the screenshot.

Below it, a layer breakdown: for each stratum, market cap, 1d/1m/1y, HHI, listed-company count, and the biggest mover — with each row linking **back into the Descent** at that stratum. Money should always be a door back to the writing, never a replacement for it.

### 3.2 **Faults** *(new — shock propagation)*

A fault propagates through strata. Geologically exact, financially evocative.

Pick a rupture — from a curated library of real scenarios plus a freeform "sever this node" — and watch it cascade upward through the dependency graph, layer by layer, with a running tally.

Starter scenario library:
- Gallium/germanium export licensing tightens
- Spruce Pine quartz district offline (this has already happened once, in 2024)
- HBM capacity capped at current run-rate
- CoWoS allocation halved
- Taiwan Strait interdiction
- US interconnection queue freeze in the top five data-centre markets
- Neon supply shock (2022 replay)
- A single EUV scanner-fleet grounding

Output for each: affected stations by propagation depth, listed companies at each depth, aggregate market cap in the blast radius, the top twenty names by exposure, and — the honest part — which links have credible substitutes and how long qualification takes. Damage decays by depth with a curated per-edge coupling coefficient, so it isn't naive percolation.

This is not a prediction. It is an **exposure map**, and it should say so loudly. That's what makes it credible rather than clickbait.

### 3.3 **Circulation** *(new — the money loop)*

A directed graph of who pays whom, with edge types:

- **Revenue** (from customer-concentration disclosures in 10-Ks — these are public and machine-readable)
- **Equity** (vendor stakes: NVDA→OpenAI, NVDA→CoreWeave, MSFT→OpenAI, …)
- **Credit** (backstops, guarantees, vendor financing, take-or-pay compute)
- **Capacity** (leases and offtake)

Then compute, per company, a **circularity ratio**: share of revenue attributable to counterparties in which it holds equity or has extended credit. Highlight actual cycles in the graph — literal loops, drawn as loops. Show the total notional trapped inside each cycle.

This is the most contested question in the market right now and the visualisation writes itself.

### 3.4 **Web** *(untouched, with one optional overlay)*

The Web tab keeps working exactly as it does today. It gains a single toggle — **"weight by capital"** — off by default, which sizes node radius by market cap and makes the supply-cone trace report a number: *"this cone contains $2.1tn across 34 listed companies."* One switch, reversible, nothing lost.

### 3.5 **Screener** *(the Index table, absorbed and made serious)*

Index stops being a top-level tab and becomes Money's fourth view — still reachable instantly from ⌘K, so nothing gets harder to find. The table becomes supply-chain-native screening that doesn't exist anywhere else:

```
depth ≤ 9  AND  chokepoint ≥ 2  AND  EV/S < 8  AND  gross margin > 45%
```

*"Show me deep-stack, hard-to-substitute businesses the market hasn't repriced."* No other screener has `depth` or `chokepoint` as a column, because no other screener has the graph.

Filters: stratum, station, jurisdiction, chokepoint score, stack depth, market cap, EV/Sales, EV/EBITDA, gross margin, revenue growth, net cash, circularity ratio. Sortable, URL-encoded, CSV-exportable.

---

## 4. Metrics only this site can compute

The differentiation lives here. Six of these; the last one is the one that gets shared.

**1 — Layer market cap.** Σ market cap by stratum, with fractional attribution. A company present at nine stations must not be counted nine times: weight by revenue segment where disclosed, split evenly where not, and *disclose which*. Show a confidence flag per layer.

**2 — Chokepoint Score (computed).** Replace the hand-set 0–3 pips with a composite: revenue HHI × substitutability (curated) × geographic concentration × qualification lead-time (curated). Then **display the hand rating next to the computed one**. Where they disagree is interesting, and showing the disagreement is what makes the methodology believable.

**3 — Fragility-adjusted exposure.** For any company: the share of its upstream cone that passes through a level-3 chokepoint. *"NVIDIA's production depends on six single-source nodes."* One sentence, computed, checkable.

**4 — Value density.** Market cap per unit of physical throughput — $/GW committed, $/300 mm wafer start per month, $/HBM stack, $/EUV scanner. Requires a hand-curated `physical.json`. That curation is the moat; the arithmetic is trivial.

**5 — Circularity ratio.** Defined in §3.3. Publish the definition and the sources beside the number.

**6 — The Depth Curve.** ⭐

Scatter every listed company: **x = stack depth (1 = lithosphere … 27 = residue)**, **y = EV/Sales**, **bubble = market cap**, **colour = stratum**. A LOESS fit through it.

That chart answers, in one image, *where the market is paying a premium in the AI stack* — proximity to the token, or proximity to the physics. It updates daily. It has never been drawn because nobody else has the x-axis.

This is the chart that gets embedded in other people's articles. Give it a permalink and a static OG image and let it travel.

---

## 5. Architecture

```
semicon/
├─ index.html                     shell only — no data, no logic
├─ src/
│  ├─ main.js                     router, view switching
│  ├─ views/                      stack · faults · circulation · web · screener
│  ├─ lib/                        graph.js  metrics.js  fmt.js  chart.js
│  └─ styles/                     tokens.css  base.css  components.css
├─ data/
│  ├─ static/                     ← human-edited, the moat
│  │  ├─ strata.json              27 layers
│  │  ├─ stations.json            131 stations
│  │  ├─ edges.json               dependency graph + coupling coefficients
│  │  ├─ companies.json           ← THE KEY NEW FILE (see below)
│  │  ├─ physical.json            GW, wafer starts, HBM units, EUV fleet
│  │  ├─ flows.json               revenue/equity/credit/capacity edges
│  │  └─ scenarios.json           the fault library
│  ├─ live/                       ← machine-written, committed daily
│  │  ├─ quotes.json              price, mcap, 1d/1m/1y, 52w, ADV
│  │  ├─ fundamentals.json        revenue, GM, OM, FCF, capex, net cash
│  │  ├─ derived.json             layer aggregates, HHI, depth curve, $/GW
│  │  ├─ changelog.json           what moved in the stack today
│  │  └─ meta.json                run stamp, per-source health, failures
│  └─ history/YYYY-MM-DD.json     daily snapshot (~60 KB gzipped)
├─ scripts/ingest/                Node — runs in the Action
└─ .github/workflows/ingest.yml   cron, weekdays 22:30 UTC
```

No framework. ES modules, raw SVG, `<template>` cloning. The current code is already written this way and it's fast; keep the discipline. Total JS budget: **under 60 KB gzipped**, excluding data.

### `companies.json` — the critical path

This file is the entire unlock, and it does not exist yet. Every company currently has only `[name, role, domain, base]`. It needs:

```jsonc
{
  "tsmc": {
    "name": "TSMC",
    "listed": true,
    "tickers": { "primary": "2330.TW", "adr": "TSM", "isin": "TW0002330008" },
    "cik": null,
    "currency": "TWD",
    "stations": ["fdry", "gaa", "beol", "cowos", "..."],
    "attribution": { "fdry": 0.55, "cowos": 0.20, "gaa": 0.15 },
    "physical": { "waferStarts300mm": 1500000, "cowosCapacityWpm": 80000 }
  },
  "samsung-foundry": {
    "name": "Samsung Foundry",
    "listed": false,
    "parent": "samsung-electronics",
    "parentShare": 0.11,
    "note": "Foundry division; market cap attributed to 005930.KS at estimated segment share."
  }
}
```

Three subtleties that decide whether the numbers are honest:

- **Parent mapping.** Intel Foundry → INTC. Google DeepMind → GOOGL. Samsung Foundry → 005930.KS. Attributing a parent's full market cap to a division is wrong; attributing zero is also wrong. Use `parentShare`, disclose the estimate, flag it in the UI.
- **Attribution weights.** NVIDIA appears at 19 stations. Without weights, the Silicon layer and the Kernel layer both claim $4.85tn and every aggregate is nonsense.
- **Private companies.** OpenAI, Anthropic, xAI, Databricks, Mistral, SSI have no market cap but enormous graph weight. Give them `valuation` from last round with a date, render them differently (outlined, not filled), and exclude them from market-cap aggregates while including them in exposure counts. Never silently mix a private mark with a public price.

Rough universe estimate: of 533 companies, **~320 listed**, ~90 private-with-a-mark, ~120 divisions/subsidiaries/institutes.

### Ingest pipeline

| Source | Covers | Cost | Auth | Notes |
|---|---|---|---|---|
| Yahoo `v8/finance/chart` | Global prices, market cap | Free | None | v7 quote returns 401; v8 chart still works. One request per ticker. |
| Stooq CSV | Global OHLCV | Free | None | Fallback tier. ~21k global symbols, no login. |
| SEC EDGAR `companyfacts` | US fundamentals | Free | User-Agent only | Authoritative XBRL. ≤10 req/s. The gold standard. |
| SEC EDGAR full-text search | Filing mentions | Free | None | "Who mentioned CoWoS in the last 90 days" |
| Frankfurter / ECB | FX | Free | None | Everything normalised to USD |
| FRED | Macro, semis IP | Free | Free key | |
| EIA | Electricity price, capacity | Free | Free key | Feeds the Power stratum |
| Hand-curated | Physical capacity, flows, non-US fundamentals | — | — | Quarterly, ~2 hours. This is the moat, not a workaround. |

Run order: FX → quotes (with fallback) → EDGAR fundamentals → non-US fundamentals → derive → diff → changelog → commit. On partial failure: keep yesterday's values, write the failure to `meta.json`, surface a staleness badge. **Never ship a silent stale number.**

---

## 6. Design

The existing design is genuinely good — silicon-substrate palette, thin-film interference gradient, Archivo / IBM Plex Mono / Newsreader. It should be *evolved*, not replaced. What it lacks is the vocabulary of an instrument.

**Numeric typography.** There is currently no tabular-figure discipline. Every figure gets `font-variant-numeric: tabular-nums`, mono, and a strict scale. Deltas use the existing `--ok` #3FCB8E for up and `--mag` #D2508F for down — magenta reads as "down" without introducing a red that would break the palette. No new colours needed.

**A house chart language.** No chart library. Raw SVG, drawn to a strict spec: hairline axes in `--line`, mono labels at 9px/.13em uppercase, no gridlines except a single zero rule, area fills at 8% opacity, exactly one accent per chart, and every chart legible at 200px wide. The result should look like a lab notebook, not a dashboard. This is a strong opinion and it's the right one — it's what will make screenshots recognisable as yours.

**Density mode** (`D`). One toggle compresses the whole UI: line-height 1.62 → 1.35, cards → rows, prose collapsed to first sentence, numbers everywhere. Same data, instrument personality. This is how one site serves both the public artifact and the personal research tool without becoming two sites.

**Command palette** (`⌘K`). 533 companies, 131 stations, 27 strata, plus verbs — `fault: hbm`, `depth: 12`, `compare: NVDA AVGO`. This single feature is most of the difference between "a website" and "a tool."

**Deep links + generated OG images.** `/s/hbm`, `/c/NVDA`, `/l/8/patterning`, `/fault/gallium`, `/depth-curve`. Generate a static OG image per station and per scenario at build time (satori + resvg in the Action, both free). Every share looks designed. For a reputation artifact this is not a nice-to-have — it *is* the distribution mechanism.

**Print stylesheet.** People will want the stack on paper. Make it beautiful. Rare, cheap, and disproportionately memorable.

**A real methodology page.** Every computed metric with its formula, its sources, its known weaknesses, and the date each hand-curated input was last verified. Counter-intuitively this is a *design* feature: it's what converts "pretty infographic" into "citable resource," and it's the difference between being screenshotted once and being linked to permanently.

---

## 7. Phasing

**Phase 0 — Foundation.** Split the monolith into `src/` + `data/static/`. Extract the 27/131/533 from JS literals into JSON. Zero visual change. Deploy to Cloudflare Pages from GitHub. *De-risks everything after it.*

**Phase 1 — The ticker spine.** Build `companies.json` — tickers, CIKs, parent mappings, attribution weights, private marks. Write the ingest Action. Prices land. Nothing visible yet except a market pulse in the header and a "last updated" stamp. **This is the critical path; everything else is downstream of it.**

**Phase 2 — The MONEY tab.** New tab between Web and Index. Landing view is the value column. Layer breakdown linking back into the Descent. Company dossiers reusing the existing sheet component. Chokepoint Score computed. Index absorbed as Screener v1. *Ship-worthy on its own, and the homepage never changed.*

**Phase 3 — Faults.** Coupling coefficients on edges, scenario library, propagation engine, the cascade animation. *The retention feature.*

**Phase 4 — Circulation + the Depth Curve.** `flows.json`, cycle detection, circularity ratio, the scatter with its permalink and OG image. *The distribution feature — this is what travels.*

**Phase 5 — Instrument polish.** Command palette, density mode, daily changelog, history charts (needs ~60 trading days of accumulated commits), CSV export, print stylesheet, methodology page.

Phases 0–2 carry most of the value. Recommend building through Phase 2 before evaluating.

---

## 8. Risks, honestly

| Risk | Mitigation |
|---|---|
| Yahoo's unofficial endpoint breaks | Dual-source with Stooq; committed data means a failed run degrades to yesterday, never to an error |
| Attribution across 19 stations is genuinely ambiguous | Publish the weights, show confidence flags, offer equal-split and revenue-weighted side by side |
| Private-company marks are stale and non-comparable | Render them differently, date-stamp them, exclude from market-cap aggregates |
| 533 companies is a lot of curation | Start with the ~120 names carrying ~90% of stack value; expand as it proves out |
| "Shock propagation" reads as prediction | Frame relentlessly as *exposure mapping*; show substitutes and qualification lead-times in the same view |
| Legal / financial-advice exposure | Prominent disclaimer, real methodology page, sources on every number, no recommendations, no price targets |
| Scope creep kills it | Phase 0–2 is the contract. Faults and Circulation are separately-shippable. |

---

## 9. What "mindblowing" concretely means here

Three specific moments, in order of encounter:

1. **Second 3.** You've already descended the stack once. You open Money and the *same column* redraws itself sized by capital — and you see instantly that Patterning is a $780bn layer with eight companies in it while Application is a $3tn layer with fifty-two. Recognition plus rearrangement is what makes it land.
2. **Minute 4.** You click *Faults → gallium export licensing*, and watch the damage climb 27 layers with a live counter. You end up somewhere you didn't expect — a robotics company, because rare-earth magnets — and you realise the map knew something you didn't.
3. **Minute 12.** You open the Depth Curve, see the premium curve bend, and screenshot it. That screenshot has your URL on it.

Everything in this plan exists to produce those three moments.

---

*Not investment advice. Every figure carries a source and a vintage.*
