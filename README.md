# Sand to Sentence

An interactive cross-section of the AI economy — **27 strata, 131 stations, 527 organisations**, from a quartz seam in North Carolina to the last consumer of value.

Between a hole in the ground and a sentence on your screen sit roughly twenty-seven layers of civilisation. This is the whole chain, one layer at a time, with the companies that own each link.

---

## Running it locally

ES modules and `fetch()` both require HTTP, so the site cannot be opened straight from disk.

```bash
npm run dev          # → http://localhost:5173
npm run check        # validate the corpus
```

No dependencies. Node 20+.

---

## How it's organised

```
index.html                 shell — markup only
src/
  main.js                  entry point
  core/
    app.js                 shared state + late-bound actions
    data.js                loads the corpus, builds the indexes
    router.js              view switching
    notes.js               findings that cut against the grain
  lib/
    cascade.js             the unit-conversion chain and its arithmetic
    graph.js               traversal over the dependency edges
    metrics.js             attribution, concentration, coverage
    glyphs.js              schematic shapes for the Ruler
    projection.js          equirectangular projection, geodesics, graticule
  views/
    descent.js             the cross-section: hero, rail, strata sections
    web.js                 the dependency graph
    ruler.js               seventeen orders of magnitude, to scale
    atlas.js               where the stack physically is
    timeline.js            how long each capability waited
    faults.js              what breaks if a link is cut
    money.js               the stack, priced
    cascade.js             sand to sentence, quantified
    method.js              sources, assumptions and limits
    sheet.js               station dossiers
    table.js               the searchable index
    tour.js                the guided descent
  styles/app.css
data/static/
  strata.json              27 layers
  stations.json            131 stations
  edges.json               the dependency graph
  cascade.json             conversion parameters, ranges and sources
  ruler.json               36 objects from the lattice to the Earth
  atlas.json               56 sites, each anchored to stations
  world.json               simplified coastline and boundaries, 56 KB
  timeline.json            70 capabilities, invented and shipped
  counterfactuals.json     8 scenarios, reach against judgement
  companies.json           the ticker spine — 283 of 527 organisations
  notes.json               counterintuitive findings
  method.json              provenance and known limits
scripts/
  dev.mjs                  zero-dependency dev server
  check-data.mjs           corpus integrity check (runs in CI)
  smoke.mjs                boots the app headlessly and asserts the DOM
  world.mjs                regenerates world.json from Natural Earth
  ingest/run.mjs           the only thing here that touches a network
  parity.mjs               diffs two builds' DOM output
```

Views never import each other. Each registers the actions others need on `app`, which keeps the module graph acyclic and makes any single view removable without touching the rest.

---

## The data model

**Stratum** — one layer of the stack.

```jsonc
{ "n": 5, "t": "Patterning", "c": "#4479DE", "a": "Light is the sculptor…" }
```

**Station** — a distinct technology, process or market with its own physics and its own incumbents.

```jsonc
{
  "i": "hpq",              // id
  "L": 1,                  // stratum
  "n": "High-purity quartz",
  "s": "The crucible nobody can replace",
  "w": "…what it is",
  "h": ["…how it actually works"],
  "k": [["~99.998%", "SiO₂ purity"]],
  "c": 3,                  // criticality 0–3
  "x": "…why it's a chokepoint",
  "co": [["Sibelco", "role", "sibelco.com", "BE"]]
}
```

**Edges** — `edges.json` maps each station id to the ids it directly depends on. Upstream and downstream cones are derived at load time; unresolvable references are dropped rather than thrown.

`npm run check` enforces all of the above and runs in CI before every deploy.

---

## The Ruler

Seventeen orders of magnitude, from the silicon lattice constant to the Earth, **drawn at true relative size**.

One camera value, `z = log₁₀(metres)`, drives everything. An object of size *d* sits `log₁₀d − z` decades from centre and is drawn `REF × 10^(log₁₀d − z)` pixels across — so something ten times bigger is drawn ten times bigger, with no fudging. A test asserts exactly that, because the temptation to cheat proportion for legibility is the standard lie in diagrams like this. Shapes are schematic; proportions are not.

36 objects, each with a **precision flag** — *exact* for defined or measured quantities, *typical* for a representative production value, *approx* for the right order of magnitude. `npm run check` fails if a decade in the middle goes empty, and the smoke test walks the entire span confirming the stage never goes blank.

Two moments do the teaching. Around 10⁻⁹ a gate-all-around channel sits beside the lattice it is built from — about ten atoms across. Around 10⁻² the **reticle field** appears at 26 × 33 mm, and you can hold it up to the screen: the hard optical ceiling that explains why chiplets exist and why packaging became a bottleneck.

---

## The Atlas

Fifty-six sites — mines, refineries, wafer plants, tool-makers, fabs, packaging houses, data-centre markets and one strait — each resolving to at least one station in the corpus. `npm run check` fails if a site names a station that does not exist.

Circles are **true to the ground**. A chokepoint ring is not an ellipse chosen to look right; it is a hundred points, each computed to be exactly *r* kilometres from the centre along a great circle, then projected like any other geometry. Because the projection is equirectangular, the result comes out stretched east–west by 1/cos(latitude) — which is what a true circle looks like on this map, and the smoke test asserts both halves of that: every ring's radius is right to one part in 10⁹, and the drawn aspect matches 1/cos(latitude) rather than 1. Two sites cross-check against the Ruler: Spruce Pine's 30 km and Hsinchu's 6 km must be the same number in both views, or the build fails.

The projection is hand-rolled and affine in lon/lat, which is the whole reason it was chosen — the coastline is one path string in degrees, so panning and zooming is a single SVG transform and no point is ever re-projected. `data/static/world.json` is Natural Earth 1:50m simplified to **56 KB** with a per-ring tolerance, so a continent is flattened hard while Taiwan keeps detail to a few kilometres. `scripts/world.mjs` re-decodes what it writes and fails if a single coordinate has drifted.

The headline, computed rather than typed: draw a circle at true scale round every site on Earth running logic at the 5 nm class or below and the nine of them enclose about **170 km²** — less ground than Milan. The build fails if that stops being true.

Four layers: true-scale circles, export-control regime, physical risk, and all names. The regime layer is judgement and is declared as such on Method.

---

## The Lag

Every capability in the stack with two dates: the year it first worked, and the year it arrived in volume. One bar each, laid out by stratum. The length of the bar is the entire argument.

The chart has no camera — eighty-one years fit across a screen — so what moves is a **scrubber**. Drag a year, or sweep it from 1947, and bars fill as they land while a 27-cell strip lights the strata that have something working. A bar caught mid-wait is drawn solid only as far as the handle and faint beyond, so you watch the gaps open before you watch them close. `npm run check` fails if any stratum has no entry, or has only entries that never shipped — otherwise the chart would quietly claim that nothing in evaluation has ever landed.

Nothing unfinished is given a date. Four entries — co-packaged optics, feature-level interpretability, computer-use agents, robot foundation models — have no right-hand end, and the build fails if an entry without a ship date is marked anything other than `open`. An arrow is not a forecast.

The headline is arithmetic over the corpus: **median wait of 10 years from rock to package, 6 through silicon, 3 from software to sentence** — and the test asserts both that the rendered numbers match the computed ones and that the gradient is still strictly decreasing.

The finding it exists for is sharper than the gradient. Twelve capabilities waited thirty years or more, and only **three** of them were waiting on the science. Liquid cooling waited 43 years because air was cheaper; mixture of experts 30 because there were not yet enough parameters for routing to pay; backpropagation 42 for something to run on. That claim lives in `notes.json` as prose, so `check-data.mjs` holds the prose to the corpus — change an event and the build stops rather than shipping a stale sentence.

---

## Money

The Descent's column, re-weighted by capital. Same twenty-seven rows, sized by money instead of by station count — recognition and rearrangement teach more than either alone.

**Nothing on this page can invent a number.** Every figure comes from `src/lib/metrics.js`, which returns `null` rather than `0` when `data/live/quotes.json` has not been written. Ship the site without ever running the ingest job and the page renders the spine itself — companies per layer, listed against private, coverage per layer — and says plainly that no market data is committed. `npm test` asserts that with no data `layerTotals`, `valueOf` and `capitalAt` all return null, that a null formats as a dash, and that the empty state is stated rather than implied.

`data/static/companies.json` is the join, and PLAN.md is right that it is the critical path: **283 of 527 organisations**, every multi-station one covered, mapped to a primary listing, a listed parent, or neither. A company at nineteen stations must not be counted nineteen times, so every one carries weights summing to one — an **even split** by default, with thirteen hand-set exceptions that each say why. The toggle shows exactly how much that judgement moved the answer; the build fails if any weight set stops being a partition of one, and asserts that attribution conserves value to floating point.

Coverage is drawn as a hairline under every bar and stated in the panel below 60%, because a long bar over a short hairline is a lower bound wearing a confident face.

Private companies have no market value here at all. Divisions carry an estimated share of a listed parent, flagged as an estimate. CIKs are left null on purpose and resolved from the SEC's own ticker map at ingest, because a hand-typed CIK is a silent wrong answer.

### The ingest job

`scripts/ingest/run.mjs` and `.github/workflows/ingest.yml`. Yahoo's v8 chart endpoint with a Stooq fallback, EDGAR company facts for US fundamentals and shares outstanding, ECB rates for FX. It writes `data/live/` and commits, so the site stays fully static and a failed run degrades to yesterday's numbers rather than to an error page.

**It has never been run and the schedule is commented out** — turning it on is a decision, not a default. `--dry` exercises the plumbing without fetching anything, which is what keeps the pipeline from rotting while it is switched off. The rule the file exists to enforce: a source that fails keeps yesterday's value, marks it stale with the date it went stale, and writes the reason to `meta.json`. Never ship a silent stale number.

---

## Faults

Remove a station, walk the dependency graph downstream, and draw what is reachable. Eight scenarios: specialty gases, critical minerals, Spruce Pine, EUV, advanced packaging, HBM, CUDA, Taiwan.

The view has two voices and never blends them. **Reach** is arithmetic — the set of stations that depend on the removed one, computed with the same `cone()` the Web lights its supply traces with, which is why that function now lives in `src/lib/graph.js` rather than inside a view. **Reroutes** and **dead-ends** are hand-written judgement laid on top, drawn in different colours and counted separately. The **unclassified remainder** is left visible, and on most scenarios it is the large majority of the blast radius; `npm test` fails if any scenario ever classifies its whole reach, because a map that claims to know everything is the easiest kind to make dishonest.

The build also refuses to let the essays drift from the corpus: a declared reroute or dead-end must name a station the graph actually connects to the removal, no station may be classified twice, and every cited precedent must resolve to a real capability on the Lag chart.

The headline is a comparison the graph computes: **the widest blast radius here reaches 101 of 131 stations and routes around itself in about two years** — it already did, in 2022, when Ukrainian neon stopped. The scenario that takes a decade reaches 70. `check-data.mjs` fails if those ever stop being different faults, or if the wider one stops being the faster one, because at that point the page's argument has evaporated.

That argument is the ninth finding: ranking exposure by how much of a network a node touches — which is what a graph can compute, and therefore what most supply-chain maps do — puts the answer close to backwards.

---

## Against the grain

`data/static/notes.json` holds findings that contradict what most people assume — nine of them so far. Each is load-bearing: it changes how the rest of the stack reads.

They are first-class objects rather than prose, so one fact surfaces everywhere it applies: as a full callout near the top of every station sheet it touches, as a one-line flag at the relevant Cascade step, and collected on the Method page — and, where it names one, a button through to the object on the Ruler or the site on the Atlas. Add a note, name the stations it belongs to, and it appears in all of them. `npm run check` fails if it names a station, stratum, cascade step, ruler object or atlas site that does not exist, or if it would surface nowhere.

The heaviest one: **most of the silicon in an AI accelerator is memory, not compute** — roughly 1,600 mm² of logic against 6,000–7,500 mm² of HBM. It explains why the binding constraint sits in strata 08 and 09 rather than 10.

---

## Method

Every claim on the site, grouped by how much you should trust it — **judgement**, **curated**, **cited**, **derived** — with judgement listed first because those are the calls that shape the site most and defend themselves least.

The page is generated from the same JSON the site runs on. The assumption ledger comes straight out of `cascade.json`; the counts come from the live corpus. It cannot drift out of date relative to what you are reading, and the build fails if a parameter loses its source or falls outside its own declared range.

It also says where the site is most likely wrong. That section is the point of the page.

---

## The Cascade

One answer, followed backwards through the whole stack until it arrives at rock.

Every conversion parameter lives in `data/static/cascade.json` with a **range**, a **derivation written out in full**, and a **source**. The chain that consumes them lives in `src/lib/cascade.js`, written as plain arithmetic so it can be read and argued with.

Two properties are enforced by tests rather than by care:

- **The operator shown is the operator applied.** The engine reports the factor it used at each step; the interface displays that value rather than re-deriving one. They cannot disagree.
- **The arithmetic reconciles.** `reconcile()` applies each reported factor to the quantity it claims to act on and checks the result matches the value shown — across all 108 combinations of the four assumptions, on every test run.

The headline result, at central assumptions: **1,000 output tokens cost about 0.72 Wh of electricity, 780 µL of cooling water, 229 ng of silicon and 1 µg of rock.** The electricity to serve an answer is roughly **500×** the fab electricity embodied in the silicon serving it. The sand was never the constraint.

The largest single uncertainty by far is energy per output token, which spans two orders of magnitude between a distilled model answering directly and a frontier model reasoning at length. Nothing else in the chain is close.

---

## Reading the site

Each **stratum** is a layer of the stack; each **station** inside it is a distinct technology, process or market. The coloured pips on a card are a **criticality** read — how concentrated and how substitutable that link is. Three magenta pips means a genuine single point of failure for the whole industry.

Figures reflect public reporting through **mid-2026** and move fast — treat capacities, valuations and roadmap dates as of that vintage, not as live data. Company lists are illustrative of who matters at each link, not exhaustive or ranked, and nothing here is investment advice.

Built as a map for understanding, not a database of record.

---

## Where it's going

- [`ROADMAP.md`](ROADMAP.md) — what has shipped and what comes next, with a file manifest per phase
- [`IDEAS.md`](IDEAS.md) — the learning-first expansion: the Cascade, the Ruler, the Atlas, the Time Machine
- [`PLAN.md`](PLAN.md) — the MONEY section: live market data joined to the dependency graph

---

## Corrections

The corpus is hand-curated and certainly contains errors. Open an issue — a wrong number, a missing company, a dependency that doesn't hold — and cite a source. Corrections are the most valuable contribution here.
