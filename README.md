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
  views/
    descent.js             the cross-section: hero, rail, strata sections
    web.js                 the dependency graph
    sheet.js               station dossiers
    table.js               the searchable index
    tour.js                the guided descent
  styles/app.css
data/static/
  strata.json              27 layers
  stations.json            131 stations
  edges.json               the dependency graph
scripts/
  dev.mjs                  zero-dependency dev server
  check-data.mjs           corpus integrity check (runs in CI)
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
