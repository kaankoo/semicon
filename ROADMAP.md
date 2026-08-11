# Roadmap

Status as of **11 Aug 2026**. Read `CLAUDE.md` first for conventions and the file routing table.

The organising idea: the site holds **one body of knowledge** — 27 strata, 131 stations, 533 organisations — and each new section is **a different index on it**, not new content.

| Lens | Question it answers | Status |
|---|---|---|
| Depth | What sits on top of what? | ✅ Descent |
| Causality | What depends on what? | ✅ Web |
| Scale | How big is it, physically? | ✅ Ruler |
| Energy & matter | What does it consume? | ✅ Cascade |
| Provenance | How do we know? | ✅ Method |
| **Space** | **Where on Earth does it happen?** | **next** |
| **Time** | **When did this become possible?** | queued |
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

**Current test surface:** 95 smoke assertions + corpus validation of 7 data files. `npm test`.

---

## Phase 4 — The Atlas *(recommended next)*

**Geography is the geopolitics.** Forty jurisdictions in the corpus and not one map. Every chokepoint in the site is ultimately a *place*.

### The moment it exists for

A 30-mile circle drawn to scale around Spruce Pine, North Carolina, next to the sentence *"almost every silicon wafer on Earth passes through a crucible made from rock inside this circle."* Then zoom out and show that the world's entire leading-edge logic capacity occupies less area than a mid-sized city.

### Read to start

```
CLAUDE.md                          conventions + routing
src/core/app.js                    the action registry
src/views/ruler.js                 closest precedent — camera, panel, station links, glyphs
src/lib/glyphs.js                  the schematic drawing language to stay consistent with
data/static/ruler.json             the shape a new corpus file should take
scripts/check-data.mjs             the ruler block, as the template for an atlas block
scripts/smoke.mjs                  the ruler section, as the template for atlas assertions
npm run peek -- --stratum 1        the earth layer, for which places matter
```

Do **not** open `stations.json`, `cascade.json`, `method.json` or the Cascade/Method views.

### Create

- `data/static/atlas.json` — sites, each `{id, lat, lon, label, kind, radiusKm, stations[], note, precision, source}`. Perhaps 45–60 sites: mines, fabs, packaging, memory, data-centre markets, chokepoint districts.
- `src/views/atlas.js` — projection, pan/zoom, layer toggles, the site panel.
- `src/lib/projection.js` — an equirectangular or Robinson projection, hand-rolled. No mapping library.
- Coastline geometry: a simplified world outline as a single path string, checked into `data/static/world.json`. Natural Earth 110m, decimated. Keep it under ~60 KB.

### Touch

- `index.html` — nav button + `<section class="view" id="v-atl">`
- `src/main.js` — import and `await initAtlas()`
- `src/core/router.js` — the `atl` fit hook, mirroring `rul`
- `src/core/app.js` — register `atlasFit`, `atlasGoTo`
- `src/styles/app.css` — append an `ATLAS` banner section, prefix `.atl`
- `data/static/notes.json` — add `atlas` targets to `wrong-quartz` and any note about concentration
- `data/static/method.json` — a provenance entry for site coordinates
- `scripts/check-data.mjs`, `scripts/smoke.mjs`, `README.md`

### Layers to support

`concentration` · `chokepoint circles to scale` · `export-control regimes` · `physical risk (seismic, drought)` · `grid and interconnection queues`

### Acceptance

- Every site resolves to at least one real station; build fails otherwise.
- Chokepoint circles are drawn at true geographic scale, and a test asserts it — same discipline as the Ruler.
- The Spruce Pine and Hsinchu views are reachable in one click from the notes that mention them.
- No mapping library, no tile server, no network call at runtime.

### Risk

Coordinates for private industrial sites are approximate and sometimes sensitive. Use published corporate locations only, mark everything `approx` unless a company states it, and say so on Method.

**Effort:** medium. The projection is an afternoon; the site corpus is the work.

---

## Phase 5 — The Time Machine

**The thirty-year lag.** Each stratum gets two dates — when the science was finished, and when it shipped in volume. EUV: concept in the 1980s, production in 2019. Transformers: 2017 → 2022.

The insight it delivers: *the AI boom runs on physics that was finished decades ago, and the physics for 2040 is being decided in a lab this week.*

### Read to start

`CLAUDE.md` · `src/core/app.js` · `src/views/ruler.js` (the camera pattern transfers directly — a timeline is a 1-D camera) · `data/static/ruler.json`

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
| No accessibility pass | everywhere | Focus order, reduced-motion coverage beyond `app.RM`, SVG labelling on Ruler and Web. |
| Fab figures are cross-industry averages | `data/static/cascade.json` | Declared on Method. Better public numbers do not appear to exist. |
