# Roadmap

Status as of **12 Aug 2026**. Read `CLAUDE.md` first for conventions and the file routing table.

The organising idea: the site holds **one body of knowledge** — 27 strata, 131 stations, 533 organisations — and each new section is **a different index on it**, not new content.

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
| **Money** | **What is it worth?** | **next — see `PLAN.md`** |

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

**Current test surface:** 180 smoke assertions + corpus validation of 11 data files. `npm test`.

### What Phase 4 actually landed

Against the acceptance conditions it set itself:

- **Every site resolves to a station** — checked in `check-data.mjs`; 56 sites, 0 unresolved.
- **Circles are true to the ground, asserted** — twice over. `ringRadiusError()` holds every vertex of every ring to one part in 10⁹, and a second assertion checks the drawn aspect matches 1/cos(latitude) rather than 1, so the map cannot quietly be cheated back into screen-space circles.
- **Spruce Pine and Hsinchu one click from their findings** — `wrong-quartz` and the new `logic-fits-in-a-city` carry `atlas` targets, and the smoke test clicks the button and checks where it lands.
- **No library, no tiles, no runtime network call** — `src/lib/projection.js` is 150 lines and the coastline is a checked-in path string.

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

## Phase 7 — Multipliers

Cheap, and each lifts everything above it. Can be done in any order, or interleaved.

| Item | Effort | Files |
|---|---|---|
| **Glossary** — ~400 terms, hover any acronym anywhere | weekend | `data/static/glossary.json`, `src/core/glossary.js`, CSS |
| **Deep links** — `/s/hbm`, `/l/8`, `/rul/reticle` | half a day | `src/core/router.js` only |
| **⌘K palette** — jump to any station, org, stratum or object | 1–2 days | `src/core/palette.js`, CSS |
| **Generated OG images** — one per station and view, at build time | 1 day | `.github/workflows/deploy.yml`, `scripts/og.mjs` (satori + resvg) |
| **Print stylesheet** | half a day | `src/styles/app.css` |
| **Multiple entrances** — five curated paths through the same corpus | 1 day | `data/static/paths.json`, `src/views/tour.js` |

Deep links are the highest value per hour of the six — they make everything else shareable, and touch exactly one 21-line file.

---

## Phase 8 — MONEY

Fully specified in **`PLAN.md`**. Unstarted, and deliberately last: learning is primary, price is supporting evidence.

Placement is settled — a `MONEY` tab **between Web and Index**, absorbing the Index table as its screener. The homepage never changes.

### Critical path

`data/static/companies.json` — tickers, CIKs, parent mappings, attribution weights for the ~320 listed names among the 533. Nothing downstream works without it, and NVIDIA appearing at 19 stations makes attribution weights mandatory rather than optional.

### Read to start

`PLAN.md` in full · `CLAUDE.md` · `src/views/table.js` (becomes the screener) · `prototype-stack-priced.html` (the design direction, illustrative figures only)

**Effort:** large. Phase 0–2 of `PLAN.md` before evaluating whether to continue.

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
