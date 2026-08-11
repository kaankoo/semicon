# Sand to Sentence

An interactive cross-section of the AI economy — **27 strata, 131 stations, 533 organisations**, from a quartz seam in North Carolina to the last consumer of value.

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
    glyphs.js              schematic shapes for the Ruler
  views/
    descent.js             the cross-section: hero, rail, strata sections
    web.js                 the dependency graph
    ruler.js               seventeen orders of magnitude, to scale
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
  notes.json               counterintuitive findings
  method.json              provenance and known limits
scripts/
  dev.mjs                  zero-dependency dev server
  check-data.mjs           corpus integrity check (runs in CI)
  smoke.mjs                boots the app headlessly and asserts the DOM
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

## Against the grain

`data/static/notes.json` holds findings that contradict what most people assume — six of them so far. Each is load-bearing: it changes how the rest of the stack reads.

They are first-class objects rather than prose, so one fact surfaces everywhere it applies: as a full callout near the top of every station sheet it touches, as a one-line flag at the relevant Cascade step, and collected on the Method page. Add a note, name the stations it belongs to, and it appears in all three places. `npm run check` fails if it names a station, stratum or cascade step that does not exist, or if it would surface nowhere.

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

- [`IDEAS.md`](IDEAS.md) — the learning-first expansion: the Cascade, the Ruler, the Atlas, the Time Machine
- [`PLAN.md`](PLAN.md) — the MONEY section: live market data joined to the dependency graph

---

## Corrections

The corpus is hand-curated and certainly contains errors. Open an issue — a wrong number, a missing company, a dependency that doesn't hold — and cite a source. Corrections are the most valuable contribution here.
