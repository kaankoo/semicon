# Working on Sand to Sentence

Read this file, then read **only what the routing table tells you to**. The corpus is 648 KB and `stations.json` alone is 8,887 lines; opening things speculatively burns the session for nothing.

---

## What this is

A static, dependency-free site mapping the AI economy as 27 physical strata → 131 stations → 527 organisations, seen through eight lenses: **Descent · Web · Moat · Ruler · Atlas · Lag · Faults · Cascade**, with **Method** and **Index** outside the tab group. Hand-curated knowledge is the asset; the code is thin.

**Live:** GitHub Pages from `main`, public repo `kaankoo/semicon`. Deploys on push, gated on `npm test`.

```bash
npm run dev      # http://localhost:5173 — ES modules need HTTP, file:// will not work
npm test         # check-data + smoke — 264 assertions. Run before every commit
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
| **A Ruler label reads an order of magnitude off** | `metres()` in `ruler.js`, not the JSON. Trimming trailing zeros off a *whole* number turned 550 nm into "55 nm". Round-tripped by the test now | `ruler.json` |
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
| A page looks narrow on a wide screen | the block's own `max-width`, not the frame's. Check the **unit** first — see Layout under Conventions | — |
| A chart view's layout drifts from the other five | the `LAYOUT PARITY` block at the foot of `app.css`; `npm test` names the offender | that view's section |
| A mark on a chart is unexplained | that view's legend in `index.html` — `.rul__lg` `.atl__lg` `.tml__lg` `.moat__lg`, `#fltLegend`. **Not** the footer | the JS |
| A test fails | `scripts/smoke.mjs` — section markers below | — |
| Adding a data file | `scripts/check-data.mjs` — validation is mandatory | — |

### Finding things inside the big files

`src/styles/app.css` (1,123 lines). Grep the banner, read ±40 lines:

| Section | Grep | ~line | Prefix |
|---|---|---|---|
| Base, bar, rail, hero, cards, sheet, tour, web, index | `---------- <name> ----------` | 1–400 | `.bar .rail .hero .core .sec .card .sheet .co .web .idx .tbl .tour` |
| Cascade | `   CASCADE` | 403 | `.cas` |
| Against the grain | `   AGAINST THE GRAIN` | 512 | `.grain .grainline` |
| Method | `   METHOD` | 556 | `.mth` |
| Ruler | `   RULER` | 646 | `.rul` |
| Atlas | `   ATLAS` | 731 | `.atl` |
| Lag | `   LAG` | 811 | `.tml` |
| Faults | `   FAULTS` | 881 | `.flt` |
| Moat | `   MOAT` | 969 | `.moat` |
| **Layout parity** | `   LAYOUT PARITY` | 1060 | all seven full-width views, grouped |

**The parity block is the one place that breaks prefix locality, deliberately.** Frames, footers and chart legends are what the seven full-width views are meant to *share* — the site read as inconsistent between tabs precisely because each view had settled its own answer. Anything that must hold for all six lives there, with its reasoning. Anything true of one view stays in that view's section.

`scripts/smoke.mjs` sections: `---- behaviour ----` · `cascade` · `against the grain` · `method` · `ruler` · `atlas` · `lag` · `faults` · `moat` · `the price links` · `layout parity` · `---- report ----`.

`scripts/check-data.mjs` sections: `---- strata / stations / edges / organisations / cascade / notes / method / ruler / atlas / timeline / counterfactuals / companies / jurisdiction / ticker links ----`.

`index.html` (448 ln) — view sections at 44, 71, 96, 136, 175, 218, 270, 303, 334, 395. Safe to read whole.

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
- **Layout — settled on Moat and carried across all six chart views (13 Aug 2026). Enforced by the `layout parity` block in `smoke.mjs`; the reasoning is in the `LAYOUT PARITY` block at the foot of `app.css`.**
  - **Frame:** `max-width:min(1860px,95vw); padding:44px 3vw 80px`, identical on Ruler, Atlas, Lag, Faults, Cascade, Moat **and Method**, so switching tabs does not move the page edge. Cascade was 1680px/60px and Method 1480px/60px — three different answers across nine tabs.
  - **No hard line breaks in a headline.** A `<br>` is a layout decision typed into the content, and it goes stale exactly like a typed number: Cascade's and Method's titles were broken for a header block that has since doubled in width, so they wrapped early inside a line that had room to spare. `clamp()` on the font size handles narrow screens.
  - **Blocks run the full frame.** The hud, the status band, the panel and the footer take no width cap of their own. If each block carries its own reading measure *and* the frame is wide, the page reads as a narrow column pinned left however wide the frame gets — that is the actual cause, and widening the frame alone does nothing.
  - **Only body copy is measured, and the measure is in `px`.** **Never `ch`.** A `ch` is the width of the digit zero *in that element's own font*: Newsreader at 14px makes it ~7px, so `118ch` is ~830px, not the ~1500px it reads like. The unit hides its own size and cost two rounds of wrong fixes. `1100px` is the house ceiling for a single column of 14–16px serif. A smoke assertion fails if any rule belonging to a view in the group uses `ch` again. Only the Descent and the sheet keep theirs, and the Descent is frozen by hard rule 1.
  - **No multi-column body text.** Tried on Moat and reverted: on a page that is otherwise one vertical read, columns send the eye back up the page mid-paragraph. A long line beats that.
  - **Every mark on a chart is named in a legend beside it**, not only in the footer. An unlabelled mark near a bar reads as a caveat on that bar. All six have one now: `.rul__lg` `.atl__lg` `.tml__lg` `.moat__lg`, and Faults' tier legend.
  - **Naming the marks is not naming the colours.** Atlas and Lag carry both, separately: `#atlLegend` / `#tmlLegend` say what the colours encode and change with the layer buttons; `.atl__lg` / `.tml__lg` say what the shapes mean and never change. A shape put in a colour legend would come and go with the colours. Shape swatches take `currentColor` for the same reason.
  - **One bar, one variable.** If a bar encodes a value by length, its shade must track the same value, not a second one.
  - **A position that means nothing must say so.** The Ruler stacks its objects across five tracks purely so neighbours stop covering each other — three times the size of the one before it, every object would otherwise sit on top of the last. Height there carries no data, and the legend says that in as many words rather than leaving a reader to infer an encoding that is not there.
- **Pointer events on a chart belong to the stage, not to the SVG.** An SVG only hit-tests where it has painted something, so a wheel listener on `#rulSvg` fires over a glyph and nowhere else — and since zooming moves the glyph out from under the cursor, the next notch falls through to the page and scrolls it. Bind to the containing block, which hit-tests across its whole area, and give it `touch-action:none`.
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
| **Ruler objects sit on top of each other** | `PX_DECADE / REF` at the top of `ruler.js`. It must clear **4.13**, or every object is drawn inside its neighbour and no amount of vertical stagger will fix it — the shapes grow with 10^Δ and the gap only with Δ. Asserted | `LANES`, the CSS |
| Ruler objects pile vertically | `LANES` / `SPREAD` / `SETTLE` — five tracks, tapering to centre as a shape fills the stage. These carry clusters closer than ~0.25 decades, which spacing cannot | the CSS |
| A Ruler label is missing or written over another | the rung ladder in `paint()` — labels are placed against each other, then clamped inside the stage | `ruler.json` |
| Zoom only works over a shape, or the page scrolls instead | the wheel is bound to `.rul__stage`, not `#rulSvg`. **An SVG only hit-tests where it has painted** | the CSS |
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

**First move for any bug: `npm test`.** 264 assertions cover every view's structure and behaviour; a failure usually names the broken thing directly.

---

## Where the plans live

- **`ROADMAP.md`** — what shipped, what each phase actually landed against its brief, and what is next. **Start here.**
- `PLAN.md` — the MONEY section as originally specified. **Superseded**: the priced page was built, shipped unpriced, then replaced by Moat. ROADMAP records why
- `IDEAS.md` — the original non-financial thinking. Almost entirely shipped; kept for the reasoning
- `README.md` — the public-facing description
