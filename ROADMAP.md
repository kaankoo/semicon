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
| **Time** | **When did this become possible?** | **next** |
| **Counterfactual** | What breaks if this breaks? | queued |
| **Money** | What is it worth? | queued — see `PLAN.md` |

---

## Shipped

| Phase | Commit | What landed |
|---|---|---|
| 0 · Foundation | `dc70a87` | Monolith split into `src/` + `data/static/`. index.html 257 KB → 6.6 KB. Byte-identical DOM proven by `scripts/parity.mjs`. Dev server, corpus check, smoke test, Pages deploy. |
| 1 · Cascade | `b1517a7` | 1,000 tokens followed back to rock through 8 steps + 6 branches. Every parameter sourced with a range. `reconcile()` re-checks the displayed arithmetic across 108 assumption combinations. |
| 2 · Grain + Method | `72ca256` | Counterintuitive findings as first-class objects surfacing in sheets, Cascade and Method. Method page generated from the live corpus. |
| 3 · Ruler | `a1c18f2` | 36 objects over 18 decades at true relative size. Scale-truth asserted by test. |
| 4 · Atlas | — | 56 sites over 40 jurisdictions, every one anchored to a station. Circles are geodesic, not decorative, and the test proves it two ways. Hand-rolled equirectangular projection; Natural Earth at 56 KB. |

**Current test surface:** 131 smoke assertions + corpus validation of 9 data files. `npm test`.

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

## Phase 5 — The Time Machine *(recommended next)*

**The thirty-year lag.** Each stratum gets two dates — when the science was finished, and when it shipped in volume. EUV: concept in the 1980s, production in 2019. Transformers: 2017 → 2022.

The insight it delivers: *the AI boom runs on physics that was finished decades ago, and the physics for 2040 is being decided in a lab this week.*

### Read to start

`CLAUDE.md` · `src/core/app.js` · `src/views/ruler.js` (the camera pattern transfers directly — a timeline is a 1-D camera) · `data/static/ruler.json` · `src/views/atlas.js` for the more recent precedent: layer toggles, a claim computed from the data rather than typed into the prose, and cross-view assertions holding two views to the same number

### Create

- `data/static/timeline.json` — events `{id, invented, shipped, stratum, station, label, note, source, confidence}`
- `src/views/timeline.js`

### Touch

Same six wiring files as Phase 4, prefix `.tml`.

### Acceptance

- Every event names a real stratum or station.
- Research-stage entries are visually separated from shipped ones and carry an explicit confidence — no implying we know when CFET arrives.
- A scrubber from 1947 to now lights strata as capability lands.

**Effort:** low-medium. Mostly curation, and pleasant curation.

---

## Phase 6 — Counterfactuals

The *Faults* mechanic from `PLAN.md` with the money removed. Remove EUV, HBM, CUDA, Taiwan, attention — follow what reroutes and what dead-ends.

Reuses the Web's traversal (`cone()` in `src/views/web.js`), so it is mostly writing plus an animation.

### Read to start

`CLAUDE.md` · `src/views/web.js` · `data/static/edges.json` · `src/core/notes.js`

### Create

`data/static/counterfactuals.json` — `{id, removes[stationIds], title, essay, reroutes[], deadEnds[], leadTimeYears}`; `src/views/faults.js`

### Acceptance

Framed relentlessly as **exposure mapping, not prediction**. Substitutes and qualification lead-times shown in the same view as the damage.

**Effort:** medium. The essays are the work.

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
