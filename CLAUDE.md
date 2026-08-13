# Working on Sand to Sentence

Read this file, then read **only what the routing table tells you to**. The corpus is 648 KB and `stations.json` alone is 8,887 lines; opening things speculatively burns the session for nothing.

---

## What this is

A static, dependency-free site mapping the AI economy as 27 physical strata → 131 stations → 527 organisations, seen through eight lenses: **Descent · Web · Moat · Ruler · Atlas · Lag · Faults · Cascade**, with **Method** and **Index** outside the tab group. Hand-curated knowledge is the asset; the code is thin.

**Live:** GitHub Pages from `main`, public repo `kaankoo/semicon`. Deploys on push, gated on `npm test`.

```bash
npm run dev      # http://localhost:5173 — ES modules need HTTP, file:// will not work
npm test         # check-data + smoke — 223 assertions. Run before every commit
npm run peek -- hbm          # one station, without opening stations.json
npm run peek -- --ids        # all 131 ids
npm run peek -- --find euv   # search names, taglines and prose
npm run peek -- --org ASML   # every station an org appears at
npm run peek -- --stratum 9  # a whole stratum
node scripts/ingest/run.mjs --dry   # ticker link check, plumbing only, fetches nothing
```

---

## Hard rules

1. **Never rewrite the homepage.** The Descent (`#v-strata`) is the front door and stays as it is. New work is additive — a new tab, or depth inside an existing sheet. Evolutionary, not revolutionary. Standing instruction.
2. **Views never import each other.** Each registers its actions on `app` (`src/core/app.js`) and calls `app.<action>()` for anything owned elsewhere. Shared logic goes in `src/lib/`, which views may import. The module graph stays acyclic.
3. **Never read `stations.json` whole.** Use `npm run peek`.
4. **Guarantees go in tests, not in care.** If a property matters, assert it in `scripts/smoke.mjs` or `scripts/check-data.mjs` so it cannot silently rot.
5. **Every claim carries a source and a vintage.** Judgement is labelled as judgement. **Never invent a figure** — if it is not derivable from something committed, it renders as a dash.
6. **No page holds a price.** A priced Money page was built, shipped, and removed — see ROADMAP for the reasoning. The Index links out to Yahoo instead. Do not reintroduce a committed market figure without reading why the last one was taken out; a smoke assertion fails if `valueOf`, `layerTotals`, `capitalAt` or `usd` ever reappear in `metrics.js`.
7. **Run `npm test` before committing.** CI runs it too; a red build blocks the deploy.

---

## Files that are finished — do not open

These are done. They are listed so you can skip them, not so you can read them. Touch only if the symptom in the triage table below points here explicitly.

| File | Why it is settled |
|---|---|
| `src/core/app.js` · `data.js` · `router.js` | 49 / 59 / 25 lines. Only ever gain 2–4 lines when a view is added. |
| `src/views/descent.js` · `sheet.js` · `tour.js` · `table.js` | The homepage and its furniture. Frozen by hard rule 1. |
| `src/views/web.js` | Stable since Phase 0. Last touched to import `cone()` from `lib/graph.js`. |
| `src/lib/cascade.js` · `glyphs.js` · `projection.js` · `graph.js` · `metrics.js` · `tickers.js` | Pure, no DOM, fully asserted. Read only for the bug classes named below. |
| `src/views/ruler.js` · `atlas.js` · `timeline.js` · `faults.js` · `cascade.js` · `method.js` · `moat.js` | Each is complete against its brief. Content changes go in that view's JSON, never in the JS. |
| `scripts/dev.mjs` · `peek.mjs` · `parity.mjs` | Tooling. Unchanged for four phases. |
| `data/static/strata.json` · `edges.json` | Only touched when adding a station. |
| `data/static/world.json` | **Generated.** 1 line, 57 KB. Never hand-edit — regenerate with `scripts/world.mjs`. |
| `data/live/tickers.json` | **Generated** by the weekly link check. A maintenance to-do, not a fact about the world. Never hand-edit. |

**The corollary:** almost every content change is a JSON edit, and almost every new feature is a new view plus the six-file wiring recipe below. If you find yourself editing a finished view's JS, check you are not doing something the data could do.

---

## Adding a view — the recipe, unchanged for four phases

1. `data/static/<thing>.json` — the corpus, with `meta` carrying sources, definitions and caveats
2. `src/views/<thing>.js` — exports `init<Thing>()`, registers `app.<thing>Fit` / `app.<thing>GoTo`
3. `index.html` — nav button + `<section class="view" id="v-xxx">`, **additive only**
4. `src/main.js` — import and `await init<Thing>()`
5. `src/core/router.js` — one line, the fit hook
6. `src/core/app.js` — two lines, the action stubs
7. `src/styles/app.css` — append a banner section, claim a new prefix
8. `scripts/check-data.mjs` + `scripts/smoke.mjs` — validation is mandatory, not optional
9. `data/static/method.json` — a provenance entry and, if it has one, a limit
10. `data/static/notes.json` — a finding, if the view earned one

---

## Routing table — what to read for what

| Task | Read (in order) | Never open |
|---|---|---|
| **Any change at all** | this file, `src/core/app.js` (49 lines) | — |
| **Content is wrong anywhere** | that view's JSON in `data/static/` — the JS almost never holds a fact | the JS |
| Cascade number looks wrong | `data/static/cascade.json` — every parameter has its derivation | the JS |
| Bug in the Cascade | `src/views/cascade.js`, `src/lib/cascade.js` | stations.json |
| A Ruler object is the wrong size | `data/static/ruler.json` (`m` is the whole story) | the JS |
| Bug in the Ruler | `src/views/ruler.js`; glyph problems → `src/lib/glyphs.js` | stations.json |
| A circle is the wrong size, or a site is misplaced | `data/static/atlas.json` — `lat`, `lon`, `radiusKm` | the JS |
| Bug in the Atlas | `src/views/atlas.js` | stations.json, world.json |
| Projection, geodesic or wrapping problem | `src/lib/projection.js` (131 lines, pure) | — |
| Coastline wrong, or the file is too big | `scripts/world.mjs`, then regenerate | world.json |
| A Lag bar is the wrong length or in the wrong place | `data/static/timeline.json` — `invented`, `shipped`, `stratum` | the JS |
| A date is disputed | `data/static/timeline.json` — each event cites its paper; `confidence` says how firm | — |
| Bug in the Lag chart | `src/views/timeline.js` | stations.json |
| A blast radius looks wrong | `data/static/edges.json` — reach is the graph, not the view | the JS |
| A reroute or dead-end is disputed | `data/static/counterfactuals.json` — each is individually argued | — |
| Bug in the Faults page | `src/views/faults.js` | stations.json |
| Traversal problem in Web or Faults | `src/lib/graph.js` (48 lines, pure) | — |
| An attribution weight looks wrong | `data/static/companies.json` — the weights are the whole story | the JS |
| A ticker is wrong or missing | `data/static/companies.json`. Note `parent` on a division holds a **ticker**, not a name | — |
| An Index price link is dead | `data/live/tickers.json` — the weekly job lists every symbol that stopped resolving | the views |
| Bug in the Moat page | `src/views/moat.js`, `src/lib/metrics.js` | stations.json |
| A Moat bar looks wrong | the `co[][3]` jurisdiction field in `stations.json` — the bar is arithmetic over it | the JS |
| A price link is wrong | `src/lib/tickers.js` (60 lines, pure) | — |
| Link check broken | `scripts/ingest/run.mjs`, then `--dry` | — |
| Edit station prose or companies | `npm run peek -- <id>` then a targeted `Edit` | the whole file |
| Add a station | `stations.json` (append), `edges.json`, `companies.json`, then `npm test` | — |
| A finding shows in the wrong place | `data/static/notes.json` | — |
| A finding's cross-view button goes nowhere | `src/core/notes.js` `wireNotes()` — one block per target view | — |
| Method page missing an entry | `data/static/method.json` — the page is generated, so the data is the bug | the JS |
| Wrong tab opens / nav broken | `src/core/router.js` (25 lines), nav at `index.html:20-30` | — |
| Styling | `src/styles/app.css` — grep the banner, never read 1,001 lines | — |
| A test fails | `scripts/smoke.mjs` — section markers below | — |
| Adding a data file | `scripts/check-data.mjs` — validation is mandatory | — |

### Finding things inside the big files

`src/styles/app.css` (1,001 lines). Grep the banner, read ±40 lines:

| Section | Grep | ~line | Prefix |
|---|---|---|---|
| Base, bar, rail, hero, cards, sheet, tour, web, index | `---------- <name> ----------` | 1–386 | `.bar .rail .hero .core .sec .card .sheet .co .web .idx .tbl .tour` |
| Cascade | `   CASCADE` | 387 | `.cas` |
| Against the grain | `   AGAINST THE GRAIN` | 493 | `.grain .grainline` |
| Method | `   METHOD` | 537 | `.mth` |
| Ruler | `   RULER` | 621 | `.rul` |
| Atlas | `   ATLAS` | 692 | `.atl` |
| Lag | `   LAG` | 767 | `.tml` |
| Faults | `   FAULTS` | 837 | `.flt` |
| Moat | `   MOAT` | 929 | `.moat` |

`scripts/smoke.mjs` sections: `---- behaviour ----` · `cascade` · `against the grain` · `method` · `ruler` · `atlas` · `lag` · `faults` · `moat` · `the price links` · `---- report ----`.

`scripts/check-data.mjs` sections: `---- strata / stations / edges / organisations / cascade / notes / method / ruler / atlas / timeline / counterfactuals / companies / jurisdiction / ticker links ----`.

`index.html` (405 ln) — view sections at 44, 70, 91, 124, 153, 185, 226, 260, 291, 352. Safe to read whole.

---

## Data files

| File | Size | What it holds | Validated by |
|---|---|---|---|
| `strata.json` | 163 ln | 27 layers `{n,t,c,a}` | strata block |
| `stations.json` | **8,887 ln** | 131 stations `{i,L,n,s,w,h[],k[][],c,x,co[][]}` | stations block |
| `edges.json` | 605 ln | 356 dependency edges, `id → [upstream]` | edges block |
| `companies.json` | **3,721 ln** | 283 companies `{name,kind,ticker,parent,parentShare,stations[],attribution,attributionBasis}` | companies block |
| `cascade.json` | 157 ln | assumptions, constants, chain, branches | cascade block |
| `ruler.json` | 155 ln | 36 objects `{id,m,glyph,label,precision,station,note}` | ruler block |
| `atlas.json` | 365 ln | 56 sites `{id,lat,lon,kind,radiusKm,stations[],precision,regime,risk,source}` | atlas block |
| `timeline.json` | 379 ln | 70 capabilities `{id,stratum,station,invented,shipped,waitedFor,confidence,source}` | timeline block |
| `counterfactuals.json` | 178 ln | 8 scenarios `{id,removes[],essay,leadTimeYears,precedent,reroutes[],deadEnds[]}` | counterfactuals block |
| `notes.json` | 148 ln | 9 findings, each naming stations/strata/cascadeStep/ruler/atlas/timeline/faults | notes block |
| `method.json` | 230 ln | provenance by kind, reading definitions, known limits | method block |
| `world.json` | 1 ln, 57 KB | **generated** coastline + boundaries | atlas block |
| `live/tickers.json` | — | **generated** weekly link check, `{checked,dead[],inconclusive[]}` | ticker links block |

Station record: `i` id · `L` stratum · `n` name · `s` tagline · `w` what it is · `h[]` mechanism · `k[][]` key figures · `c` criticality 0–3 · `x` chokepoint prose · `co[][]` `[name, role, domain, jurisdiction]`.

---

## Conventions

- **No framework, no build step, no runtime dependency.** ES modules, raw SVG, template strings. jsdom is dev-only; the link check uses built-in `fetch` and writes no numbers. **No page on this site holds a price** — the Index links out instead, so nothing rendered can go stale.
- **CSS** is BEM-ish with a two-to-five letter view prefix. New views claim a new prefix. Design tokens are the `:root` block; introduce no new colours — `--ok` is up, `--mag` is down.
- **Numbers** use `font-variant-numeric: tabular-nums` and the mono face.
- **Charts** are hand-drawn SVG. No chart library — the house style is a lab notebook, not a dashboard.
- **Prose** is British spelling, en-dashes, no exclamation marks.
- **Commits** explain *why*. First line under 60 chars, then a paragraph or two.

### Patterns worth copying

- **A headline claim is arithmetic, never a typed sentence.** The Atlas's 170 km², the Lag's medians, the Faults comparison. Each is computed at render and reconciled by a smoke assertion, so it cannot go stale silently.
- **Prose in JSON is held to the corpus too.** `check-data.mjs` recomputes the numbers stated in `notes.json` findings and fails if the sentence has drifted.
- **Derived and declared are never blended.** Faults draws graph reach and hand-written judgement in different colours and counts the unclassified remainder out loud.
- **Absent data renders as a dash.** `metrics.js` returns null, never 0.

---

## Bug triage — symptom to file

| Symptom | Look here first | Then |
|---|---|---|
| Blank page, "Could not load the corpus" | you opened `file://` — use `npm run dev` | — |
| One view blank, others fine | that view's `init*()` threw; boot is sequential so everything after it stops | console, then `src/main.js` |
| A view is stale after resize | the fit hook in `src/core/router.js` | the view's `size()` |
| Clicking a chip does nothing | chips are re-wired after every re-render | `wireNotes()` in `src/core/notes.js` |
| Cascade operator disagrees with the values | it cannot — `reconcile()` would fail. Run `npm test` | `src/lib/cascade.js` |
| Ruler object never appears | its `m` sits outside `meta.span` | `place()` in `ruler.js` |
| Atlas circles invisible or absurdly fat | strokes are counter-scaled in `paint()`, not by `vector-effect` | `atlas.js` `paint()` |
| An Atlas circle vanishes after flying somewhere | camera left [-180,180); rings are drawn once, coastline three times | `clampCam()` |
| A country is missing from the map | small islands below the area floor are dropped by design | `world.mjs` `MIN_AREA` |
| A Lag bar has no right-hand end | correct — it has not shipped. `confidence` must be `open` | `timeline.json` |
| A Lag bar runs off the left edge | demonstrated before 1947; the panel gives the true year | `meta.span` |
| `check-data` says a stratum "never lights" | all its entries are unshipped | add a shipped event |
| Faults claims all of a blast radius | the unclassified remainder is required | `counterfactuals.json` |
| A Moat bar is missing | that stratum has no organisation with a stated jurisdiction — `check-data` fails on this | `metrics.js` |
| An Index price cell is a dash | correct — the organisation is private, or a division with no listed parent | `companies.json` |
| A layer total looks too small | coverage. The hairline under each bar is how much of the layer is in the spine | `companies.json` |
| Two names claim one ticker | a duplicate organisation in `stations.json` | fix the name, regenerate |
| Search finds nothing | the `q` field built in `initTable()` | `src/views/table.js` |
| Style leaks between views | a prefix collision | `src/styles/app.css` |
| CI red, local green | `npm ci` vs `npm install`, or a file not committed | `.github/workflows/deploy.yml` |

**First move for any bug: `npm test`.** 200 assertions cover every view's structure and behaviour; a failure usually names the broken thing directly.

---

## Where the plans live

- **`ROADMAP.md`** — what shipped, what each phase actually landed against its brief, and what is next. **Start here.**
- `PLAN.md` — the MONEY section as originally specified. **Superseded**: the priced page was built, shipped unpriced, then replaced by Moat. ROADMAP records why
- `IDEAS.md` — the original non-financial thinking. Almost entirely shipped; kept for the reasoning
- `README.md` — the public-facing description
