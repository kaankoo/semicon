# Working on Sand to Sentence

Read this file, then read **only what the routing table below tells you to**. The corpus is 445 KB; opening it whole burns the session for nothing.

---

## What this is

A static, dependency-free site mapping the AI economy as 27 physical strata → 131 stations → 533 organisations, plus derived views (Ruler, Atlas, Lag, Faults, Cascade, Method). Hand-curated knowledge is the asset; the code is thin.

**Live:** GitHub Pages from `main`, public repo `kaankoo/semicon`. Deploys on push, gated on `npm test`.

```bash
npm run dev      # http://localhost:5173 — ES modules need HTTP, file:// will not work
npm test         # check-data + smoke — run before every commit
npm run peek -- hbm          # one station, without opening stations.json
npm run peek -- --ids        # all 131 ids
npm run peek -- --find euv   # search names, taglines and prose
npm run peek -- --org ASML   # every station an org appears at
npm run peek -- --stratum 9  # a whole stratum
```

---

## Hard rules

1. **Never rewrite the homepage.** The Descent (`#v-strata`) is the front door and stays as it is. New work is additive — a new tab, or depth inside an existing sheet. Evolutionary, not revolutionary. This is the user's standing instruction.
2. **Views never import each other.** Each registers its public actions on `app` (`src/core/app.js`) and calls `app.<action>()` for anything owned elsewhere. The module graph stays acyclic. Adding a view must not touch another view.
3. **Never read `data/static/stations.json` whole.** 8,887 lines. Use `npm run peek`.
4. **Guarantees go in tests, not in care.** If a property matters — the Cascade's arithmetic reconciling, the Ruler's scale being true — assert it in `scripts/smoke.mjs` so it cannot silently rot.
5. **Every claim carries a source and a vintage.** New data files need a `source` and get validated in `scripts/check-data.mjs`. Judgement is labelled as judgement.
6. **Run `npm test` before committing.** CI runs it too; a red build blocks the deploy.

---

## Architecture

```
index.html            markup shell only — 9 view sections, no logic
src/main.js           boot: loadData → loadNotes → init each view → initRouter
src/core/app.js       shared state + late-bound action registry   ← read this first
src/core/data.js      loads strata/stations/edges, builds byId, byL, UP, DN
src/core/router.js    view switching (#v-strata #v-web #v-rul #v-atl #v-tml #v-flt #v-cas #v-mth #v-idx)
src/core/notes.js     "against the grain" findings, indexed by station/stratum/step
src/lib/cascade.js    the unit-conversion arithmetic + fmt + reconcile
src/lib/graph.js      cone / coneOfAll / hops over the dependency edges
src/lib/glyphs.js     15 procedural SVG shapes for the Ruler
src/lib/projection.js equirectangular projection, geodesic rings, graticule
src/views/*.js        descent web ruler atlas timeline faults cascade method sheet table tour
src/styles/app.css    one stylesheet, sectioned by banner comment
```

Boot order matters only in that every view registers before `initRouter`. `initRuler`, `initAtlas`, `initTimeline`, `initFaults`, `initCascade` and `initMethod` are `await`ed because they fetch their own data.

---

## Routing table — what to read for what

| Task | Read (in order) | Never open |
|---|---|---|
| **Any change at all** | this file, `src/core/app.js` (42 lines) | — |
| Bug in the Cascade | `src/views/cascade.js`, `src/lib/cascade.js`, `data/static/cascade.json` | stations.json |
| Cascade number looks wrong | `data/static/cascade.json` only — every parameter is there with its derivation | the JS |
| Bug in the Ruler | `src/views/ruler.js`, `data/static/ruler.json`; glyph problems → `src/lib/glyphs.js` | stations.json |
| Bug in the Atlas | `src/views/atlas.js`, `data/static/atlas.json` | stations.json, world.json |
| A circle is the wrong size, or a site is in the wrong place | `data/static/atlas.json` only — `lat`, `lon` and `radiusKm` are the whole story | the JS |
| Projection, geodesic or wrapping problem | `src/lib/projection.js` (150 lines, pure functions, no DOM) | — |
| Coastline looks wrong or the file is too big | `scripts/world.mjs`, then regenerate — never hand-edit `world.json` | world.json |
| Bug in the Lag chart | `src/views/timeline.js`, `data/static/timeline.json` | stations.json |
| A bar is the wrong length, or in the wrong place | `data/static/timeline.json` only — `invented`, `shipped` and `stratum` are the whole story | the JS |
| A date is disputed | `data/static/timeline.json` — every event cites the paper or patent, and `confidence` says how firm it is | — |
| Bug in the Faults page | `src/views/faults.js`, `data/static/counterfactuals.json` | stations.json |
| A blast radius looks wrong | `data/static/edges.json` — reach is the graph, not the view. Check the edges before the JS | the JS |
| A reroute or dead-end is disputed | `data/static/counterfactuals.json` — every one is individually argued and sourced | — |
| Traversal problem in Web or Faults | `src/lib/graph.js` (40 lines, pure, no DOM) | — |
| Bug in the dependency web | `src/views/web.js`, `data/static/edges.json` | stations.json |
| Bug in the descent / cards / rail | `src/views/descent.js` | stations.json |
| Bug in a station sheet | `src/views/sheet.js`, then `npm run peek -- <id>` | stations.json |
| Bug in search / index table | `src/views/table.js` | stations.json |
| Bug in the Method page | `src/views/method.js`, `data/static/method.json` | stations.json |
| Wrong tab opens / nav broken | `src/core/router.js` (21 lines), nav block at `index.html:20-29` | — |
| A finding shows in the wrong place | `src/core/notes.js`, `data/static/notes.json` | — |
| A finding's cross-view button goes nowhere | `src/core/notes.js` `wireNotes()` — one block per target view | — |
| Edit station prose or companies | `npm run peek -- <id>` then a targeted `Edit` on stations.json | the whole file |
| Add a station | `data/static/stations.json` (append), `data/static/edges.json`, then `npm test` | — |
| Styling | `src/styles/app.css` — grep the section banner, do not read 922 lines | — |
| A test fails | `scripts/smoke.mjs` section markers below | — |
| Adding a data file | `scripts/check-data.mjs` — validation is mandatory, not optional | — |

### Finding things inside the big files

`src/styles/app.css` (922 lines) is sectioned. Grep for the banner, then read ±40 lines:

| Section | Banner to grep | ~line | Class prefixes |
|---|---|---|---|
| Base, palette, bar, rail, hero, cards, sheet, tour, web, index | `---------- <name> ----------` | 1–386 | `.bar .rail .hero .core .sec .card .sheet .blk .co .web .idx .tbl .tour` |
| Cascade | `   CASCADE` | 387 | `.cas` |
| Against the grain | `   AGAINST THE GRAIN` | 493 | `.grain .grainline` |
| Method | `   METHOD` | 537 | `.mth .mthlink` |
| Ruler | `   RULER` | 621 | `.rul` |
| Atlas | `   ATLAS` | 692 | `.atl` |
| Lag | `   LAG` | 767 | `.tml` |
| Faults | `   FAULTS` | 837 | `.flt` |

`scripts/smoke.mjs` sections: `---- behaviour ----` · `---------- cascade ----------` · `---------- against the grain ----------` · `---------- method ----------` · `---------- ruler ----------` · `---------- atlas ----------` · `---------- lag ----------` · `---------- faults ----------` · `---- report ----`.

`scripts/check-data.mjs` sections: `---- strata/stations/edges/organisations/cascade/notes/method/ruler/atlas/timeline/counterfactuals ----`.

`index.html` (370 lines) — grep `============ ` for the view sections. Safe to read whole.

---

## Data files

| File | Size | What it holds | Validated by |
|---|---|---|---|
| `strata.json` | 163 ln | 27 layers: `{n,t,c,a}` | strata block |
| `stations.json` | **8,887 ln** | 131 stations: `{i,L,n,s,w,h[],k[][],c,x,co[][]}` | stations block |
| `edges.json` | 605 ln | 356 dependency edges, `id → [upstream ids]` | edges block |
| `cascade.json` | 157 ln | assumptions, constants (value/lo/hi/derivation/source), chain, branches | cascade block |
| `ruler.json` | 155 ln | 36 objects: `{id,m,glyph,label,sub,precision,station,note}` | ruler block |
| `atlas.json` | 320 ln | 56 sites: `{id,lat,lon,label,place,kind,radiusKm,stations[],precision,regime,risk,note,source}` | atlas block |
| `world.json` | **generated** | coastline + boundaries as two path strings in lon/lat, 56 KB | atlas block |
| `timeline.json` | 379 ln | 70 capabilities: `{id,stratum,station,label,invented,shipped,waitedFor,confidence,note,source}` | timeline block |
| `counterfactuals.json` | 178 ln | 8 scenarios: `{id,title,removes[],essay,leadTimeYears,precedent,reroutes[],deadEnds[]}` | counterfactuals block |
| `notes.json` | 148 ln | 9 findings, each naming stations/strata/cascadeStep/ruler/atlas/timeline | notes block |
| `method.json` | 139 ln | provenance by kind, reading definitions, known limits | method block |

Station record shape — `i` id, `L` stratum, `n` name, `s` tagline, `w` what it is, `h[]` mechanism bullets, `k[][]` key figures, `c` criticality 0–3, `x` chokepoint prose, `co[][]` `[name, role, domain, jurisdiction]`.

---

## Conventions

- **No framework, no build step, no dependencies at runtime.** ES modules, raw SVG, template strings. jsdom is dev-only.
- **CSS** is BEM-ish with a two-to-five letter view prefix (`.cas__row`, `.rul__panel`, `.mth__tbl`). New views claim a new prefix. Design tokens are the `:root` block at the top; do not introduce new colours — `--ok` is up, `--mag` is down.
- **Numbers** use `font-variant-numeric: tabular-nums` and the mono face.
- **Charts** are hand-drawn SVG. No chart library — the house style is a lab notebook, not a dashboard.
- **Prose** is British spelling, en-dashes, no exclamation marks. Match the existing register.
- **Commits** explain *why*, not what. First line under 60 chars, then a paragraph or two of reasoning.

---

## Where the plans live

- **`ROADMAP.md`** — shipped phases and what comes next, with a file manifest per phase. **Start here.**
- `IDEAS.md` — the non-financial expansion thinking (Cascade and Ruler came from it; Atlas and Time Machine remain)
- `PLAN.md` — the MONEY section, unstarted
- `README.md` — the public-facing description

---

## Bug triage — symptom to file

| Symptom | Look here first | Then |
|---|---|---|
| Blank page, console shows "Could not load the corpus" | you opened `file://` — use `npm run dev` | — |
| One view is blank, others fine | that view's `init*()` threw — check the console; boot is sequential so a throw stops everything after it | `src/main.js` boot order |
| A view renders but is stale after resize | the fit hook in `src/core/router.js` | the view's `size()` |
| Clicking a station chip does nothing | `wireNotes()` / the view's own `wire()` — chips are re-wired after every re-render | `src/core/notes.js` |
| A number is wrong in the Cascade | `data/static/cascade.json` — the constant and its `derivation` | `src/lib/cascade.js` only if the chain shape is wrong |
| Cascade operator disagrees with the values | it cannot — `reconcile()` would fail. Run `npm test` | `src/lib/cascade.js` `factors` |
| Ruler object never appears | its `m` may sit outside `meta.span`; `npm run check` catches this | `place()` in `src/views/ruler.js` |
| Ruler feels empty at some scale | a decade gap — `npm run check` fails above 2 empty decades | `data/static/ruler.json` |
| Atlas circles invisible or absurdly fat | strokes are counter-scaled in `paint()`, not by `vector-effect`. At k=2000 an unscaled 1.2-unit stroke is 2,400 px | `src/views/atlas.js` `paint()` |
| An Atlas circle vanishes after flying somewhere | the camera left [-180,180); rings are drawn once, the coastline three times | `clampCam()` in `src/views/atlas.js` |
| Atlas rings render black or unstyled | `syncLayers()` sets fill and stroke per path — check it is querying the group the rings actually live in | `src/views/atlas.js` `syncLayers()` |
| A country is missing from the map | small islands below the area floor are dropped by design; sites still plot correctly | `scripts/world.mjs` `MIN_AREA` |
| Coastline has streaks across the Pacific | a ring crossing the antimeridian was not split | `unwrap()` in `scripts/world.mjs` |
| A Lag bar has no right-hand end | that is correct — it has not shipped. `confidence` must be `open` or the build fails | `data/static/timeline.json` |
| A Lag bar runs off the left edge | it was demonstrated before 1947; the panel gives the true year | `meta.span` in `timeline.json` |
| The Lag headline disagrees with the chart | it cannot — `stats()` computes it and the smoke test reconciles both | `stats()` in `src/views/timeline.js` |
| `check-data` complains a stratum "never lights" | every entry it has is unshipped, so the scrubber would imply nothing there works | add a shipped event to that stratum |
| A finding appears on the wrong station | `data/static/notes.json` `stations[]` | `src/core/notes.js` indexing |
| Method page missing an entry | `data/static/method.json` — it is generated, so the data is the bug | `src/views/method.js` |
| Search finds nothing | the `q` field built in `initTable()` | `src/views/table.js` |
| Tour skips a stratum | `src/views/tour.js`, `app.go()` in `src/views/descent.js` | — |
| Style leaks between views | a prefix collision — every view owns a prefix | `src/styles/app.css` |
| CI red, local green | `npm ci` vs `npm install`, or a file not committed | `.github/workflows/deploy.yml` |

**First move for any bug: `npm test`.** 180 assertions cover every view's structure and behaviour; a failure usually names the broken thing directly.
