# Working on Sand to Sentence

Read this file, then read **only what the routing table below tells you to**. The corpus is 295 KB; opening it whole burns the session for nothing.

---

## What this is

A static, dependency-free site mapping the AI economy as 27 physical strata → 131 stations → 533 organisations, plus derived views (Ruler, Cascade, Method). Hand-curated knowledge is the asset; the code is thin.

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
index.html            markup shell only — 6 view sections, no logic
src/main.js           boot: loadData → loadNotes → init each view → initRouter
src/core/app.js       shared state + late-bound action registry   ← read this first
src/core/data.js      loads strata/stations/edges, builds byId, byL, UP, DN
src/core/router.js    view switching (#v-strata #v-web #v-rul #v-cas #v-mth #v-idx)
src/core/notes.js     "against the grain" findings, indexed by station/stratum/step
src/lib/cascade.js    the unit-conversion arithmetic + fmt + reconcile
src/lib/glyphs.js     15 procedural SVG shapes for the Ruler
src/views/*.js        descent web ruler cascade method sheet table tour
src/styles/app.css    one stylesheet, sectioned by banner comment
```

Boot order matters only in that every view registers before `initRouter`. `initRuler`, `initCascade` and `initMethod` are `await`ed because they fetch their own data.

---

## Routing table — what to read for what

| Task | Read (in order) | Never open |
|---|---|---|
| **Any change at all** | this file, `src/core/app.js` (42 lines) | — |
| Bug in the Cascade | `src/views/cascade.js`, `src/lib/cascade.js`, `data/static/cascade.json` | stations.json |
| Cascade number looks wrong | `data/static/cascade.json` only — every parameter is there with its derivation | the JS |
| Bug in the Ruler | `src/views/ruler.js`, `data/static/ruler.json`; glyph problems → `src/lib/glyphs.js` | stations.json |
| Bug in the dependency web | `src/views/web.js`, `data/static/edges.json` | stations.json |
| Bug in the descent / cards / rail | `src/views/descent.js` | stations.json |
| Bug in a station sheet | `src/views/sheet.js`, then `npm run peek -- <id>` | stations.json |
| Bug in search / index table | `src/views/table.js` | stations.json |
| Bug in the Method page | `src/views/method.js`, `data/static/method.json` | stations.json |
| Wrong tab opens / nav broken | `src/core/router.js` (21 lines), nav block at `index.html:20-31` | — |
| A finding shows in the wrong place | `src/core/notes.js`, `data/static/notes.json` | — |
| Edit station prose or companies | `npm run peek -- <id>` then a targeted `Edit` on stations.json | the whole file |
| Add a station | `data/static/stations.json` (append), `data/static/edges.json`, then `npm test` | — |
| Styling | `src/styles/app.css` — grep the section banner, do not read 689 lines | — |
| A test fails | `scripts/smoke.mjs` section markers below | — |
| Adding a data file | `scripts/check-data.mjs` — validation is mandatory, not optional | — |

### Finding things inside the big files

`src/styles/app.css` (689 lines) is sectioned. Grep for the banner, then read ±40 lines:

| Section | Banner to grep | ~line | Class prefixes |
|---|---|---|---|
| Base, palette, bar, rail, hero, cards, sheet, tour, web, index | `---------- <name> ----------` | 1–386 | `.bar .rail .hero .core .sec .card .sheet .blk .co .web .idx .tbl .tour` |
| Cascade | `   CASCADE` | 387 | `.cas` |
| Against the grain | `   AGAINST THE GRAIN` | 493 | `.grain .grainline` |
| Method | `   METHOD` | 537 | `.mth .mthlink` |
| Ruler | `   RULER` | 621 | `.rul` |

`scripts/smoke.mjs` (350 lines) sections: `---- behaviour ----` · `---------- cascade ----------` · `---------- against the grain ----------` · `---------- method ----------` · `---------- ruler ----------` · `---- report ----`.

`scripts/check-data.mjs` (177 lines) sections: `---- strata/stations/edges/organisations/cascade/notes/method/ruler ----`.

`index.html` (261 lines) — view sections at lines 41, 67, 88, 117, 148, 209. Safe to read whole.

---

## Data files

| File | Size | What it holds | Validated by |
|---|---|---|---|
| `strata.json` | 163 ln | 27 layers: `{n,t,c,a}` | strata block |
| `stations.json` | **8,887 ln** | 131 stations: `{i,L,n,s,w,h[],k[][],c,x,co[][]}` | stations block |
| `edges.json` | 605 ln | 356 dependency edges, `id → [upstream ids]` | edges block |
| `cascade.json` | 157 ln | assumptions, constants (value/lo/hi/derivation/source), chain, branches | cascade block |
| `ruler.json` | 155 ln | 36 objects: `{id,m,glyph,label,sub,precision,station,note}` | ruler block |
| `notes.json` | 95 ln | 6 findings, each naming stations/strata/cascadeStep/ruler | notes block |
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
| A finding appears on the wrong station | `data/static/notes.json` `stations[]` | `src/core/notes.js` indexing |
| Method page missing an entry | `data/static/method.json` — it is generated, so the data is the bug | `src/views/method.js` |
| Search finds nothing | the `q` field built in `initTable()` | `src/views/table.js` |
| Tour skips a stratum | `src/views/tour.js`, `app.go()` in `src/views/descent.js` | — |
| Style leaks between views | a prefix collision — every view owns a prefix | `src/styles/app.css` |
| CI red, local green | `npm ci` vs `npm install`, or a file not committed | `.github/workflows/deploy.yml` |

**First move for any bug: `npm test`.** 95 assertions cover every view's structure and behaviour; a failure usually names the broken thing directly.
