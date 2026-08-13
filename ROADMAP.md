# Roadmap

Status as of **13 Aug 2026**. Nine lenses shipped, and as of Phase 9 they look like one site. Money was built, shipped unpriced, and replaced by **Moat** — see Phase 8 for why, because the reasoning matters more than the change. Read `CLAUDE.md` first for conventions and the file routing table.

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
| Barrier to entry | Who is allowed to do this, and from where? | ✅ Moat |

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
| 7 · Money | `d000983` | The ticker spine — 283 of 527 organisations — plus the ingest job, `metrics.js`, and a Money tab rendering the spine unpriced. **Superseded by Phase 8.** |
| 8 · Moat | — | Money removed. Jurisdictional concentration per stratum, chokepoint pips beside it, a per-layer roster, and price links out to Yahoo. No page holds a price; the nightly ingest became a weekly link check. |
| 9 · Layout parity | — | One frame, one measure and one legend pattern across all six chart views. Every `ch` gone from the group, every mark on every chart named beside it, and eighteen assertions so it cannot drift again. |
| 10 · Ruler usability | — | Zoom over the whole stage rather than over a shape, five tracks instead of three so objects stop covering each other, labels placed against each other and kept inside the frame, and a sweep from the lattice to the Earth. |

**Current test surface:** 258 assertions + corpus validation of 11 data files. `npm test`.

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

**The Method page no longer states the ingest's condition — it reads it.** The entry carried a hand-typed vintage of `not yet run`, which would have been sitting there months after the first snapshot landed. It now carries a `live` block with a priced and an unpriced branch, resolved at render from what the Money view loaded, and the vintage becomes the date of the last committed snapshot. `check-data.mjs` fails if a `live` entry is missing a branch, or if its prose asserts a state the resolver is supposed to determine. Same rule as the Atlas's Milan comparison and the Lag's medians, applied to a fact about the repository rather than about the world.

### What the first live run found — 13 Aug 2026

The run reported success. It fetched **168 of 171 prices**, FX landed, and the first daily snapshot committed. Three tickers failed both Yahoo and Stooq and are absent rather than wrong: `AWE.L`, `PSTG`, `6967.T`. Underneath the green tick, three things were broken.

- **EDGAR returned 403 on the first request.** The SEC's fair-access policy wants an application name *and a working email address*; ours declared a URL. One 403 on the ticker→CIK map takes out every filer at once, so `fundamentals.json` is empty and — because a market cap here is only ever price × shares — **`cap` in the first snapshot is `{}`**. The User-Agent now carries a contact address.
- **The share count was being read from the wrong namespace.** `companyfacts` splits its facts: `us-gaap` holds the statements, `dei` holds the cover-page entity data including `EntityCommonStockSharesOutstanding`. The code looked for that tag under `us-gaap`, where it does not exist, so it would have returned null for **every filer even with the 403 fixed** — two bugs stacked, the outer one hiding the inner. It also took the annual figure; it now takes the most recent, because a cap computed from a share count twelve months old is wrong by every buyback since.
- **The Money page opened on an axis it could not draw.** `has()` conflated *prices exist* with *market caps exist*. With 168 prices and no caps it selected the market-cap axis and rendered twenty-seven null bars under a "Priced 2026-08-13" stamp — priced-looking and empty, which is precisely the failure mode the whole view was built to avoid. `hasCaps()` is now a separate question, the axis follows it, and the status line says *None carry a market cap* in as many words.

**The suite now runs against three states, not two:** unpriced, priced-with-caps, and **priced-without-caps** — the state production was actually in, which the old assertions passed blindly because they keyed on the presence of quotes.

**A test would have blocked the deploy on the morning it started working.** `the overlay counts companies without pricing them` asserted that the Faults capital overlay shows no currency figure — true in an unpriced repository, and false the moment a snapshot exists. Since `deploy.yml` gates on `npm test`, the first successful ingest would have pushed a commit that failed CI, and the site would have stopped deploying the day the pipeline started working. The assertion now branches on `app.priced`; the enduring invariant is that a total never *replaces* the count. **The suite is run against a synthetic priced snapshot as well as the real unpriced one, and passes in both** — worth repeating for any test written against the absence of data.

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

## Phase 8 — Moat *(shipped, 13 Aug 2026)* — and why Money was removed

Money is gone. The tab is now **Moat**, the chart measures jurisdictional concentration, and **no page on this site holds a price**. This was not a retreat from a hard problem; the pipeline worked. It is a judgement that the priced version could not be made honest at a cost worth paying.

### The reasoning, in order

**The pipeline was fine.** The first live run fetched 168 of 171 prices and committed a snapshot. What it could not fetch was share counts: a market capitalisation is price × shares, and the only free source of share counts — SEC EDGAR — covers US filers.

**The gap was not random, and that is what killed it.** 65 of the 171 listed organisations trade in Taipei, Tokyo, Seoul, Frankfurt, Amsterdam or Paris. Sorted by stratum, the foreign share runs: Feedstock 83%, Substrate 67%, Patterning 64%, Process 60%, Memory 58%, Package 57%. The US-dominated layers are Model, Agency and Application. So a market-cap chart built on EDGAR alone would have drawn **the deep physical strata as near-empty and the shallow software strata as enormous — the precise inverse of this site's argument, in this site's own colours, under this site's own coverage hairlines.** Incomplete would have been survivable. Systematically wrong in the direction of the thesis was not.

**Closing the gap required a maintenance commitment that was not available.** 65 share counts, refreshed quarterly. An hour to seed, twenty minutes a quarter — cheap, and still a standing obligation. A page that depends on someone remembering is a page that will eventually lie, and this one would have lied about the most important thing on the site.

### What replaced it, and the trap avoided on the way

The obvious substitute was to plot company counts per stratum. **That would have been a chart of the editing.** Every station in this corpus names between five and eight organisations, because roughly six is what makes a station legible — so a per-layer count is roughly stations-per-layer × 6. It comes out at 23.0 per stratum across the deepest nine against 21.7 across the shallowest three, and the page renders both figures from the corpus rather than repeating them, so the caveat cannot go stale. Flat, and it would have looked like a measurement. `check-data.mjs` now asserts the 5–9 band, so if the corpus ever stops being evenly curated the caveat on the page fails loudly rather than the chart quietly acquiring meaning.

What does vary is **jurisdiction** — recorded per organisation per station, curated for its own sake years before this chart existed, which is what makes it safe to plot.

### The finding

**Mean jurisdictional HHI: 0.24 across the deepest nine strata, 0.59 across the shallowest nine. The shallow end is 2.4× more concentrated.** Lithosphere spans 17 jurisdictions with no country above 25%; Surface is 93% American across two. The received view — that rock and fab are the dangerous chokepoint and software is global and commoditised — is inverted at the layer level.

It does not contradict Faults, it sharpens it: **a layer can be cosmopolitan in aggregate and single-sourced at every joint that matters.** Patterning spans eight jurisdictions and holds four chokepoint stations. So the chokepoint pips are drawn past the end of each bar and never folded into the index — concentration is arithmetic, pips are judgement, and this site does not blend the two. The panel says so in words on any layer that is both diverse and single-sourced.

### What the reader gets instead of prices

- **A per-stratum roster.** Who works at this depth, with jurisdiction and a lookup — the one view the site genuinely lacked. The Descent shows stations, the Index shows organisations, nothing showed the cast of a layer.
- **A Price column in the Index.** 283 organisations link out to Yahoo; the other 244 show a dash. Yahoo because the tickers in `companies.json` are already in Yahoo's symbol convention — every other provider would need a hand-maintained symbol map for the 65 foreign listings, which is the burden this change exists to remove.

### What was removed

`valueOf`, `layerTotals`, `stratumHHI`, `capitalAt`, `depthOf` and `usd` are gone from `metrics.js`. The Faults capital overlay is gone — with no prices it was a button labelled "weight by capital" that showed a headcount. `data/live/` and `data/history/` are gone. The nightly ingest is now a **weekly ticker link check** that writes `data/live/tickers.json` and commits no numbers: a dead symbol is the only rot this design can still suffer, and it is now the only thing automated. A smoke assertion fails if any of the priced functions ever reappear.

### Bugs found on the way out

- **41 organisations are recorded against two countries**, and using that string as a bucket key was wrong three ways: `UK/US` became a country of its own, those organisations vanished from the tallies of the countries they are actually in, and the corpus writes `UK/US` sixteen times against `US/UK` twice, so one pair of countries landed in two buckets. Each part now takes half a vote, which needs no judgement about which base is primary and makes the ordering irrelevant. Fixing it moved the headline from 2.2× to 2.4×.
- **`parent` on a division holds a ticker, not a name.** It reads like a name field. Resolving it as one silently dropped 12 of 38 division links — Google DeepMind, Waymo, Sony Semiconductor, Hitachi Energy — because their parents operate at no station and are not spine rows.
- **The weekly check now derives its list from `allTickers()`**, the same function the Index links on, so a symbol can never be linked-but-unchecked. Those 12 parent tickers were previously invisible to it.
- Three tickers failed the live run and remain suspect: `AWE.L`, `PSTG`, `6967.T`. The weekly job will now name them every Monday until they are fixed.

### Follow-up, same day

- **The pages were wasting half a wide screen.** Moat through Cascade were capped at 1560 px inside viewports often half again as wide, and — the real cause — every block inside carried its own reading measure on top of that, so the page read as a narrow column pinned to the left however wide the frame got. The frames now run to `min(1860px, 95vw)` and the blocks run the width of the frame; only body copy keeps a measure, so the padding belongs to the page rather than to each block. A first attempt put the hud and the headline side by side, which fixed the emptiness and kept the boxed-in feel; stacking them full-width was the right answer.
- **The attribution toggle is gone.** *Declared weights / Even split* was inherited from the priced page, where it re-split every market capitalisation. Nothing on Moat is divided by those weights, so it changed one sentence in the footer and nothing else: a prominent control above a chart that did not move the chart. A smoke assertion now fails if it comes back. The weights themselves stay in `companies.json` — thirteen hand-set and individually argued, still held to summing to one by the build — and Method now says plainly that they are dormant rather than load-bearing.
- **The coverage hairline is gone, and its removal is the useful part.** Each bar carried a thin second mark beneath it — what share of that layer's cast held a ticker. On the priced page that qualified the bar directly: a total computed over a quarter of a layer was a lower bound and had to say so. On Moat it qualifies nothing, because the index is computed from the whole 527-organisation corpus rather than the 283-name spine, so how many happen to be listed has no bearing on the number above it. A mark sitting under a bar reads as a caveat on that bar, and that reading would have been wrong — it was inherited furniture, not information. The coverage figure still appears in the panel, where it explains the price column and nothing else. The two marks that survive are now named in a legend beside the chart rather than only in the footer, and the bar's shade tracks the plotted value instead of always tracking the Herfindahl index, so switching axes no longer leaves shade and length encoding different variables.
- **And the prose still stopped halfway, for a reason worth writing down.** The caps were set in `ch`, which is the width of the digit zero *in the element's own font* — Newsreader at 14px puts that near 7px, so `max-width:118ch` is about 830px rather than the ~1500px it reads like. The container had never been the constraint; the measure was, in a unit that hides its own size. Every measure on Moat is now in `px`. **If a block looks narrower than its cap suggests, check the unit before widening the container** — this cost two rounds of wrong fixes.
- **Multi-column body text was tried and reverted.** Flowing the prose into two or three columns filled the width and kept lines near 90 characters, which is textbook. It read badly: on a page that is otherwise one continuous vertical scroll, columns send the eye back up the page in the middle of a paragraph, and a reader does not expect that from a chart page. A single column at `1100px` is the settled answer — wider than it was, and about as wide as 14–16px serif goes before the return sweep starts losing the line.
- **The per-stratum card is the Index's table.** Page-wide, with the Index's own columns and its own classes: Company, What it does here, Station, Base, Price. One row per organisation per station, so a firm at three stations in a layer is three rows — and since that is not the organisation count the index above is computed on, the header states both numbers rather than leaving the reader to reconcile them. Clicking a row opens the station, exactly as in the Index.

### Standing gaps

- **Jurisdiction is where an organisation is *based*, not where it *operates*.** TSMC is TW throughout, including its Arizona fab. The Atlas holds the operating geography; this page does not, and the two should not be read as the same claim.
- **16 organisations carry no stated base** and are excluded from the index rather than bucketed. `check-data` fails if that ever exceeds 10%.
- The index measures spread, not substitutability. Eight countries making the same commodity and eight countries each making one irreplaceable thing score identically.

---

## Phase 9 — Layout parity across the chart views *(shipped, 13 Aug 2026)*

Moat had a settled layout and the other five chart views did not, so the site read as inconsistent between tabs. Entirely CSS and markup; no new data, no view JS touched.

### What it actually landed

- **One frame, six views.** Ruler, Atlas, Lag, Faults, Cascade and Moat all run `min(1860px,95vw)` with `44px 3vw 80px`. Cascade was the only frame that had to move — it was 1680px with 60px of top padding, which is invisible until the viewport passes 1768px and then reads as a different site. The brief said the frames were not the problem; that was right for five of the six and wrong for Cascade, and the difference is exactly the case the acceptance criterion named.
- **Blocks run the frame.** `.rul__hud` `.atl__hud` `.cas__top` and the three panels lost their caps and their own `2vw` padding, so the padding belongs to the page rather than to each block. `.atl__hud` and `.atl__panel` are shared by four views, so the base rules were changed rather than forked — which then made four of Moat's overrides redundant, and those were deleted.
- **Every measure is in `px`.** Nine `ch` measures across the six views became `1100px`. The largest jump was `.rul__i`, the standing line under every chart headline: `60ch` in Newsreader is about 480px, so it was the narrowest measure on the site and it appeared on five pages.
- **Footers unpinned.** A 1100px column centred in an 1860px frame is the boxed-in look from the other direction. The base `.foot` is untouched — the Descent and the Index are correct as they are.
- **A LAYOUT PARITY block** at the foot of `app.css` holds the rules the six views share, and is the one place that breaks prefix locality. That is the point: the site looked inconsistent because each view had settled its own answer, so what must hold for all six now lives in one place with its reasoning.

### Legends — the half that was not cosmetic

The brief listed this as "also worth carrying across". It turned out to be the part with the most content in it.

- **Ruler and Atlas and Lag now name their marks.** Ruler named none of its four; Lag named none of the five shapes on a bar; Atlas had a legend but it was a *colour* legend, and its geodesic rings — the one mark on the site most likely to be read as a drawing convention rather than as a claim about the ground — were explained only in a footer paragraph.
- **Naming the marks is not naming the colours, and the two must not share a legend.** Atlas and Lag now carry both. `#atlLegend` / `#tmlLegend` say what the colours encode and change with the layer buttons; `.atl__lg` / `.tml__lg` say what the shapes mean and never change. A shape put in a colour legend would come and go with the colours. Shape swatches take `currentColor` for the same reason: a coloured swatch implies the shape only means that in that colour.
- Legends sit **above** their stage. A legend the reader meets after the chart has already misled them is not a legend.

### What holds it

Eighteen assertions in a new `layout parity` block in `smoke.mjs`, run against `app.css` as text and against the booted DOM:

- no rule belonging to a chart view uses `ch` again — the Descent, the sheet, Method and the grain cards are outside the group and keep theirs
- all six frames are byte-identical
- every chart view unpins its footer and measures the copy inside it
- the four shared blocks run the frame
- each of the five charts names at least as many marks as it draws, beside the chart and before it
- no shape swatch has leaked into a colour legend

Verified at 1440, 1920 and 2560 px: frame, hud, footer and body measure agree to the pixel across all six views at every width.

### Deviation from the brief

- **Cascade's frame moved**, which the brief said was already done. See above.
- **Method keeps its `ch` measures and its 1480px frame.** The acceptance criterion said no `ch` should survive outside the Descent and the sheet. Method is not a chart view and is deliberately a narrower reading page; converting it would have been a change to a page nobody had complained about, so it is excluded from the group explicitly rather than quietly. The same goes for the grain cards, whose two `ch` values are component sizing, not a reading measure.

### Standing gaps

- **One bar, one variable** was on the brief and was not needed: the Lag bars and the Faults blast-radius bars each encode one thing by length and the same thing by colour. Nothing to fix, but nothing asserts it either.
- The Lag shape legend describes the solid/faint split, which is only visible while the scrubber is short of today. At rest every bar is solid and one legend entry describes something not on screen.

---

## Phase 10 — The Ruler, made usable *(shipped, 13 Aug 2026)*

Three faults, reported by reading the page rather than the code, and all three turned out to be the same kind of mistake: the view was drawing correctly and behaving as though the drawing were the only thing on screen.

### The wheel belonged to the wrong element

Zooming worked with the pointer over a shape and nowhere else, and since zooming is exactly what moves a shape out from under the pointer, the next notch of the wheel fell through to the page and scrolled it. **An SVG only hit-tests where it has painted something** — a wheel listener on `#rulSvg` is a listener on the glyphs, not on the rectangle they sit in. The wheel, the drag and `touch-action` now belong to `.rul__stage`, a plain block that hit-tests across its whole area. Asserted structurally, because jsdom has no hit-testing to assert it with.

### Three tracks 24px apart is one line

On a true-scale log ruler the object one place along is about three times the size of this one, so anything sharing a line disappears under its neighbour. The old layout offered ±24px of separation on a 560px stage and used the top third of it. Now five tracks span most of the stage, run as a **triangle wave** (0,1,2,3,4,3,2,1) so consecutive objects climb and descend in long diagonals with no jump where the pattern wraps, and **taper to the centre line as a shape grows** — so the object you are actually looking at is never shoved off the top while its smaller neighbours stay fanned out beside it.

**Height therefore encodes nothing, and the legend says so in as many words.** A prominent visual variable that carries no data is the same failure as an unlabelled mark under a bar: the reader will infer an encoding that is not there. This is now a convention in `CLAUDE.md`, not a note about one view.

### Labels were placed against their own shape and nothing else

Lanes stop the shapes piling up. They do not stop two *labels* landing on one line, because a label sits a shape-height from its lane and two shapes of similar size on adjacent lanes put their names in the same band — which is how two names came to be written over each other at the small end of the ruler. Worse, `cy − half − 15` for a 480px shape on a 560px stage is *above the stage*: the label was not overlapping, it was gone.

Each label now takes the first rung — clear above, clear below, a rank further out, then just inside the shape's own edge — that no already-placed label occupies, and is clamped inside the stage if none is free. A name over a shape still reads, because the labels carry a stroke halo. A name off the top of the frame does not.

### And a sweep

`Sweep lattice → Earth`, mirroring the Lag chart's scrubber. The camera moves at a constant rate in decades, which on a log ruler is a constant rate of growth: every object swells, passes and shrinks away at the same pace whatever its size, which is the one thing a still frame cannot show. Any interaction ends it — a control that fights the reader is worse than no control — and it stops itself if the reader leaves the tab.

### The harness bug it surfaced

`smoke.mjs` shimmed `requestAnimationFrame` and never its partner. `jump()` in the ruler has always called `cancelAnimationFrame`; nothing in the suite had reached that line, so a missing global sat in the harness unnoticed until the sweep made every jump take it. Both are shimmed now.

### Standing gaps

- The label solver is greedy and runs in draw order, so the smallest visible object claims its slot first. The focal object — the one the reader is looking at — has no priority.
- `SPREAD` and `SETTLE` are tuned by eye against a 560px stage. Nothing asserts they still separate the objects at a much shorter viewport.

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
