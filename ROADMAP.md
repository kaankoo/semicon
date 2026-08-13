# Roadmap

Status as of **13 Aug 2026**. All eight lenses shipped; Money is shipped unpriced. Read `CLAUDE.md` first for conventions and the file routing table.

The organising idea: the site holds **one body of knowledge** — 27 strata, 131 stations, 527 organisations — and each new section is **a different index on it**, not new content.

| Lens | Question it answers | Status |
|---|---|---|
| Depth | What sits on top of what? | ✅ Descent |
| Causality | What depends on what? | ✅ Web |
| Scale | How big is it, physically? | ✅ Ruler |
| Energy & matter | What does it consume? | ✅ Cascade |
| Provenance | How do we know? | ✅ Method |
| Space | Where on Earth does it happen? | ✅ Atlas |
| Time | When did this become possible? | ✅ Lag |
| Counterfactual | What breaks if this breaks? | ✅ Faults |
| Money | What is it worth? | ◐ Money — spine and pipeline shipped, unpriced |

---

## Shipped

| Phase | Commit | What landed |
|---|---|---|
| 0 · Foundation | `dc70a87` | Monolith split into `src/` + `data/static/`. index.html 257 KB → 6.6 KB. Byte-identical DOM proven by `scripts/parity.mjs`. Dev server, corpus check, smoke test, Pages deploy. |
| 1 · Cascade | `b1517a7` | 1,000 tokens followed back to rock through 8 steps + 6 branches. Every parameter sourced with a range. `reconcile()` re-checks the displayed arithmetic across 108 assumption combinations. |
| 2 · Grain + Method | `72ca256` | Counterintuitive findings as first-class objects surfacing in sheets, Cascade and Method. Method page generated from the live corpus. |
| 3 · Ruler | `a1c18f2` | 36 objects over 18 decades at true relative size. Scale-truth asserted by test. |
| 4 · Atlas | — | 56 sites over 40 jurisdictions, every one anchored to a station. Circles are geodesic, not decorative, and the test proves it two ways. Hand-rolled equirectangular projection; Natural Earth at 56 KB. |
| 5 · Lag | — | 70 capabilities with two dates each, laid out by stratum. A scrubber from 1947 fills bars as they land and lights the strata behind them. Nothing unfinished is given a date, and the build enforces it. |
| 6 · Faults | — | 8 scenarios over the dependency graph. Reach is derived, reroutes and dead-ends are declared, and the two are never added together. `cone()` moved to `src/lib/graph.js` so the traversal is shared rather than copied. |
| 7 · Money | — | The ticker spine — 283 of 527 organisations — plus the ingest job, `metrics.js`, and a Money tab that renders the spine honestly with no prices committed. PLAN.md phases 1 and most of 2. |

**Current test surface:** 200 smoke assertions + corpus validation of 12 data files. `npm test`.

### What Phase 4 actually landed

Against the acceptance conditions it set itself:

- **Every site resolves to a station** — checked in `check-data.mjs`; 56 sites, 0 unresolved.
- **Circles are true to the ground, asserted** — twice over. `ringRadiusError()` holds every vertex of every ring to one part in 10⁹, and a second assertion checks the drawn aspect matches 1/cos(latitude) rather than 1, so the map cannot quietly be cheated back into screen-space circles.
- **Spruce Pine and Hsinchu one click from their findings** — `wrong-quartz` and the new `logic-fits-in-a-city` carry `atlas` targets, and the smoke test clicks the button and checks where it lands.
- **No library, no tiles, no runtime network call** — `src/lib/projection.js` is 131 lines and the coastline is a checked-in path string.

Two things beyond the brief, both because a test asked for them:

- **The Atlas and the Ruler are held to the same number.** Spruce Pine is 30 km across in both views and Hsinchu 6 km, and `check-data.mjs` fails if they ever disagree. Cross-view consistency is now a build condition rather than an intention.
- **The concentration claim is arithmetic.** The nine leading-edge logic sites enclose ~170 km² of ground, computed from the data at run time, rendered into the sentence, and asserted against Milan's 182 km². Adding a tenth site that breaks the claim breaks the build.

Three bugs the tests caught that reading would not have: a relative-path encoder that silently merged `0` and `.5` into `0.05` and corrupted 49 coastline rings; rings that lost their colour when they moved out of `<defs>`; and a camera that, flying west from Taiwan to North Carolina, settled at longitude 278 where the single-copy rings do not exist. The last is why `clampCam()` folds and why no site may sit within 10° of the antimeridian.

### Standing gaps

- Grid and interconnection queues were listed as a layer and are not one. The data is patchy and dates within a quarter; it currently lives in the site notes for Loudoun, Dublin and Memphis instead.
- No site carries a capacity. A large park with modest output looks identical to a small one carrying a node — declared as a limit on Method.
- The regime layer is a four-way judgement, not a legal reading, and should never be treated as one.

---

## Phase 5 — The Lag *(shipped)*

**The thirty-year lag.** Every capability gets two dates — when it first worked, and when it shipped in volume. EUV: 1986 → 2019. Gate-all-around: 1990 → 2022. The transformer: 2017 → 2022.

### What it actually landed

Against the acceptance conditions it set itself:

- **Every event names a real stratum and station** — and the two must agree, which caught several miscodings. 70 events, all 27 strata, and `check-data.mjs` also fails if a stratum has *only* unshipped entries, because a stratum that never lights is a claim in itself.
- **Nothing unfinished is given a date** — four entries have no right-hand end, the build fails if an entry without a ship date is marked anything but `open`, and the smoke test counts the open bars in the DOM to be sure the view renders them without a cap.
- **A scrubber from 1947 lights strata as capability lands** — with a sweep button, and the test asserts the lit count rises monotonically and that the number rendered is the number the corpus computes.

Two things beyond the brief:

- **The finding is sharper than the thesis was.** The gradient is real — median wait 10 years from rock to package, 6 through silicon, 3 from software to sentence — but the better story is what the long waits were *for*. A `waitedFor` field on every event splits them five ways, and it turns out that of the twelve capabilities that waited thirty years or more, only three were waiting on the science. The rest worked and waited for a machine, a price, a scale or a customer.
- **The prose is held to the corpus.** The finding states "3 of 12" in words. `check-data.mjs` recomputes both numbers from `timeline.json` and fails if the sentence has drifted — the same trick as the Atlas's Milan comparison, applied to a claim written in English rather than one rendered by JavaScript.

### Deviation from the brief

The roadmap said the Ruler's camera pattern would transfer directly. It did not, and should not have: eighty-one years fit across a screen at seventeen pixels each, so a camera would have been machinery in service of nothing. The view has a fixed axis and a scrubber instead. The camera pattern remains the right precedent for Phase 6.

### Standing gaps

- The sample is chosen, not enumerated, with a survivorship problem built in: capabilities that never shipped mostly do not appear because nobody writes their history. Declared as a limit on Method, and it is the weakest thing about the page.
- `waitedFor` is the most interpretive field on the site after criticality, and the headline finding rests entirely on it.
- No keyboard route to an individual bar; arrow keys move the year only.

---

## Phase 6 — Faults *(shipped)*

Remove a link, walk the graph, and show what sits downstream. Eight scenarios: specialty gases, critical minerals, Spruce Pine, EUV, advanced packaging, HBM, CUDA, Taiwan.

### What it actually landed

Against the acceptance conditions it set itself:

- **Exposure mapping, not prediction** — enforced structurally rather than promised in prose. Reach is derived from the graph and drawn in the stratum's own colour; reroutes and dead-ends are hand-written and drawn in amber and magenta; the unclassified remainder is left visible and counted out loud. `npm test` fails if any scenario ever classifies its whole blast radius.
- **Substitutes and lead-times in the same view as the damage** — every reroute carries a lead time as a bar, and where a comparable substitution has already happened it links to it on the Lag chart rather than asking for trust.

Three things beyond the brief:

- **`cone()` moved to `src/lib/graph.js`.** The roadmap said to reuse the Web's traversal; doing that from a view would have broken the no-view-imports-a-view rule, so it became a lib. The smoke test now asserts the two views produce identical sets, which is the whole basis of the page's claim to be reading the corpus rather than illustrating an opinion.
- **The essays are held to the graph.** A declared reroute or dead-end must name a station the graph actually connects to the removal, and no station may be classified twice. This caught real curation drift while writing.
- **The finding inverted the expected answer.** The widest blast radius is specialty gases at 101 of 131 stations, and it reroutes in two years — it already did, in 2022. Taiwan reaches 70 and takes a decade. Ranking exposure by reach, which is the number a graph can compute and therefore the one most supply-chain maps use, is close to backwards. That is the ninth finding, and `check-data.mjs` recomputes both numbers in its prose.

### Standing gaps

- **No per-edge coupling.** PLAN.md called for a curated coupling coefficient per edge so damage decays with depth. It is not there: every dependency is present or absent. That is the single biggest thing separating this from the Faults mechanic as specified.
- **No inventory.** A shock absorbed by six months of stock renders identically to one absorbed by nothing.
- **Station granularity.** A neon interruption is not the loss of all industrial gases. Scenarios say so in words; the picture does not.
- The reroute and dead-end readings are the most contestable claims on the site, and unlike criticality they are individually argued — which makes them easier to disagree with productively.

---

## Phase 7 — Money *(partly shipped — the unpriced half)*

PLAN.md's phase 1 and most of its phase 2. The tab sits **between Web and Ruler**; Index stayed where it is rather than being absorbed, because removing a tab people may have bookmarked is the one subtractive change this project has avoided making.

### What landed

- **`data/static/companies.json` — the critical path.** 283 of 527 organisations, every multi-station one covered. Tickers, listed-parent mappings with an estimated `parentShare`, private marks kept out of every total, and attribution weights that partition one. CIKs deliberately left null and resolved at ingest from the SEC's own map.
- **`scripts/ingest/run.mjs` + the Action.** Yahoo with a Stooq fallback, EDGAR facts, ECB FX, a diff and a changelog, committed to `data/live/`. Written, dry-runnable, and switched off.
- **`src/lib/metrics.js`.** Attribution, layer totals, HHI on attributed value, coverage, blast-radius capital. Pure and testable without any live data.
- **The Money view.** The Descent's column re-weighted, with coverage drawn beside every bar and a toggle between the even split and the declared weights.
- **A capital overlay on Faults**, off by default, as PLAN.md gives the Web.

### What is deliberately not there

**No prices.** The ingest job has never been run against the live endpoints. Rather than seed the repo with figures typed from memory — which would have broken the rule every other view is built on — the page renders the spine and says so. `npm test` asserts that with nothing ingested every metric returns null rather than zero, that a null formats as a dash, and that the market-cap axis is disabled until data exists.

**Turning it on — done, 13 Aug 2026.** The `schedule` block is live: weekdays at 22:30 UTC, after the US close. A manual run from the Actions tab still defaults to `--dry`.

Three things had to be fixed first, and only one of them was visible from reading the file:

- **The Action could never have committed anything.** `git add data/live data/history` names a directory that has never existed, and `git add` on a missing pathspec is a fatal error rather than a no-op — so every run that fetched successfully would have died at the last step with nothing to show for it. `data/history/` now exists with a README, and the step creates it anyway for older checkouts.
- **No `npm ci` before `npm run check`.** It happened to work because `check-data.mjs` imports nothing but `node:` builtins. That is luck, not design, and the first validation that needed a dependency would have failed in production.
- **A blind `git push`.** The ingest pushes to `main`, which triggers the deploy; a run that collided with a hand commit would have failed and lost the day's snapshot. It now rebases and retries three times. The snapshot is append-only, so a rebase cannot conflict with hand edits.

**The history format changed.** The snapshot was going to be the whole quote object — around 50 KB a day, a hundred megabytes over a few years, most of it recoverable from `quotes.json` anyway. It is now the close and the implied market cap and nothing else, about 5 KB a day. **Stale quotes are omitted rather than repeated**: `quotes.json` keeps yesterday's price and flags it, but writing that under today's date in a series would fabricate a data point, and a series is exactly where that lie is hardest to see a year on. A failed ticker leaves a gap. `check-data.mjs` holds every snapshot to its filename, its date, positive prices, and a cap that has a close to belong to.

The **History charts** row below needs about sixty of these files. Counting from the first live run, that is roughly December 2026.

### What the spine already found

Six organisations appeared in the corpus twice under different names — Tokyo Electron and TEL, Arm and Arm Holdings, Cadence and Cadence Design Systems, Amkor and Amkor Technology, KLA and KLA Corporation, SoftBank and SoftBank Group. Every aggregate would have double-counted them. The corpus is 527 organisations, not 533, and `check-data.mjs` now fails if two names ever claim one ticker.

---

## What is left — split by whether it needs prices

Everything below is optional. The site is complete as an argument without any of it. What matters is the split: **five of these need no market data at all** and could be built tomorrow, and the rest are blocked on a decision you have not made yet — whether to switch the ingest job on.

### Buildable now, no prices required

| Item | Why it is worth it | Effort | Files |
|---|---|---|---|
| **Fragility-adjusted exposure** ⭐ | *"NVIDIA's production passes through six single-source nodes."* One computed sentence per company, from `cone()` and the criticality pips. The most quotable thing on this list and it needs nothing new. | half a day | `src/lib/metrics.js`, `src/views/sheet.js` |
| **Computed Chokepoint Score** | Replace nothing. Compute concentration × substitutability × geographic spread × qualification lead-time — all four inputs already exist in `companies.json`, `counterfactuals.json`, `atlas.json` and `timeline.json` — and show it *beside* the hand-set pips. Where they disagree is the interesting part, and showing the disagreement is what makes the method believable. | 1–2 days | `src/lib/metrics.js`, `data/static/stations.json` (nothing removed) |
| **Deep links** — `/s/hbm`, `/l/8`, `/atl/hsinchu`, `/fault/taiwan` | Highest value per hour on the whole roadmap. Makes everything shareable and touches one 25-line file. | half a day | `src/core/router.js` |
| **Per-edge coupling** | The one thing PLAN.md specified that Faults still lacks. Every dependency is currently present or absent; a coefficient per edge would let damage decay with depth instead of percolating naively. | 2 days, mostly curation | `data/static/edges.json`, `src/views/faults.js` |
| **Glossary** — ~400 terms, hover any acronym anywhere | Cheap, lifts every view at once, and this corpus is dense with jargon. | weekend | `data/static/glossary.json`, `src/core/glossary.js` |

### Needs the ingest job switched on

| Item | Why it is worth it | Effort | Files |
|---|---|---|---|
| **The heat map** ⭐⭐ | See below. The screenshot that travels. | 2 days | `src/views/money.js`, CSS |
| **Company dossiers** | Click a name anywhere, get the sheet component with its stations, its upstream cone, its exposure and its numbers. The sheet already exists; this is mostly wiring. | 1–2 days | `src/views/sheet.js`, `src/views/money.js` |
| **Screener v1** | `depth ≤ 9 AND chokepoint ≥ 2 AND EV/S < 8`. No other screener has `depth` or `chokepoint` as a column, because no other screener has the graph. Sits inside Money; Index stays as it is. | 2–3 days | new `src/views/screener.js` |
| **The Depth Curve** | x = stack depth, y = EV/Sales, bubble = market cap. The x-axis already exists — `depthOf()` in `metrics.js`. Answers in one image whether the market pays a premium for proximity to the token or to the physics. | 1 day | `src/views/money.js` |
| **Circulation** — `flows.json`, circularity ratio | Who pays whom, which of them hold equity in each other, and the literal loops drawn as loops. The most contested question in this trade and nobody publishes the number. Large curation. | 1 week+ | `data/static/flows.json`, new view |
| **Value density** — $/GW, $/wafer start, $/HBM stack | Requires a hand-curated `physical.json`. The curation is the moat; the arithmetic is trivial. | 3 days | `data/static/physical.json` |
| **History charts** | Needs ~60 trading days of committed snapshots to exist first. Then "market cap of the Patterning layer over a year" is a chart nobody else can draw. | 1 day, after 3 months of commits | `data/history/`, `src/views/money.js` |

### ⭐⭐ The heat map — the strongest remaining idea

A treemap of the AI trade, **grouped by position in the production chain instead of by sector**. Every finance site has a heat map; all of them group by GICS. None of them can group by *depth in the physical stack*, because none of them has the graph.

- **Cell size** = attributed market cap, so a company at nineteen stations is split across them exactly as it is on the Money page
- **Cell colour** = the day's move, `--ok` green through `--mag` magenta, no new colours needed
- **Grouping** = the 27 strata, in Descent order, so the reader is looking at the same column a fourth time
- **The insight it produces** that no other heat map can: *the whole of Patterning is eight companies and it is greener than Application, which is fifty-two* — layer-level co-movement, visible instantly

Three things make it specifically good here rather than generically nice:

1. **It reuses everything.** `companies.json` for the cells, `metrics.js` for the attribution, `quotes.json` for the colour. No new curation at all, which is unusual on this list.
2. **It is the natural landing view once prices exist.** The current bar column answers "where is the money"; the heat map answers "what is the money doing", and the two share an axis.
3. **It is the screenshot.** PLAN.md hoped the Depth Curve would travel. A stack-grouped heat map travels further, because people already know how to read one — the novelty is entirely in the grouping, which is exactly where this project's asset is.

**Watch for:** a treemap makes small cells illegible, and the deep strata are small in capital and large in importance — the Lithosphere layer that everything rests on will be a sliver. Consider a size toggle (market cap · station count · equal) so the physical significance is not silently erased by the financial one. That toggle *is* the argument, and it is the same one the Money page already makes with its two attribution bases.

### Instrument polish, whenever

Command palette (⌘K) · density mode · print stylesheet · generated OG images per station and scenario · CSV export · multiple curated entrances through the corpus.

---

## Standing debt

| Item | Where | Note |
|---|---|---|
| Ruler is sparse above 10⁴ m | `data/static/ruler.json` | Three objects across four decades. True to the subject, but a substation and a subsea cable route would help the journey. |
| `parity.mjs` has no current reference | `scripts/parity.mjs` | Still useful for future refactors; needs a pre-change snapshot passed as an argument. |
| Criticality pips are unvalidated judgement | `data/static/stations.json` | Declared as such on Method. A computed concentration measure should sit *beside* them, never replace them. |
| No accessibility pass | everywhere | Focus order, reduced-motion coverage beyond `app.RM`, SVG labelling on Ruler, Web and Atlas. The Atlas has no keyboard route to an individual site — only the preset stops. |
| Atlas rings assume no site near ±180° | `src/views/atlas.js` | Rings are drawn once, coastline three times. `check-data.mjs` enforces ±170°. A Pacific site would need the rings tiled too. |
| Fab figures are cross-industry averages | `data/static/cascade.json` | Declared on Method. Better public numbers do not appear to exist. |
