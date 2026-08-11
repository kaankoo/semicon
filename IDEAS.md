# Sand to Sentence — non-financial directions

*Learning-first expansion paths. Written as an alternative and a complement to PLAN.md.*

---

## The reframe

You've built one body of knowledge — 27 strata, 131 stations, 533 companies — and exactly **one way into it: depth**. You enter at sand, you descend to sentence. It's a beautiful ordering and it's the right primary one.

But depth is only one axis along which this material is organised. The same 131 stations are also ordered by:

| Lens | The question it answers | Currently on the site |
|---|---|---|
| **Depth** | What sits on top of what? | ✅ the Descent |
| **Causality** | What depends on what? | ✅ the Web |
| **Scale** | How big is it, physically? | ❌ |
| **Time** | When did this become possible? | ❌ |
| **Space** | Where on Earth does it happen? | ❌ |
| **Energy & matter** | What does it consume? | ❌ |
| **Money** | What is it worth? | ❌ (PLAN.md) |

**That's the structural idea: every new section is a new index on the existing content, not new content.** Nothing gets rewritten. A station like *EUV source* already exists — it simply acquires a position on a scale ruler, a date on a timeline, a pin on a map, and an energy budget. Same 131 objects, six ways to walk them.

This is maximally evolutionary and, done properly, more impressive than any amount of new prose — because a reader who has descended once and then opens the Scale lens experiences the same material rearranged, and *that* is the moment a website becomes a place.

Four of these lenses are genuinely mind-blowing. In order of how strongly I'd argue for them:

---

## 1. THE CASCADE — *Sand to Sentence, actually quantified* ⭐

**The single strongest idea here, because it is the one thing the site promises in its title and does not yet deliver.**

Right now "Sand to Sentence" is a metaphor. Make it arithmetic. Follow **one 1,000-token answer** backwards through all 27 layers, converting units at every step, and arrive at a number of micrograms of quartz.

The chain looks roughly like this — every figure needs proper sourcing and an honest error bar in the built version, but the *shape* is what matters:

```
1,000 tokens
  → ~1 Wh of electricity at the socket          [huge range: 0.3–3 Wh]
  → ~3,600 joules
  → ~3.6 GPU-seconds at ~1 kW per accelerator
  → 2.9 × 10⁻⁸ of one GPU's ~35,000-hour service life
  → ~1 × 10⁻⁹ of one 300 mm wafer
  → ~0.13 micrograms of electronic-grade silicon
  → ~0.3 micrograms of high-purity quartz
  → ~20 microlitres of ultra-pure fab water
  → one 4,000th of a second of a 1,000-step, 3-month fab flow
```

And the reason to build it is what falls out at the bottom: **the sand is free and the electricity is not.** A sentence costs you *micrograms* of quartz and *microlitres* of fab water, but a full watt-hour of power. Every intuition about "AI is consuming the earth's minerals" collapses, and the real constraint — the one the industry actually talks about — appears on its own, derived rather than asserted.

Then run it forward for contrast: **one tonne of Spruce Pine quartz**, through crucibles and pulls and wafers and dies, versus **one gas turbine**. The truck of sand serves the planet for a year. The turbine never stops.

That contrast *is* the thesis of the entire website, and right now the site states it in prose. This makes the reader derive it themselves in ninety seconds of scrolling.

**Form:** a single scroll-driven column. Each step is one line of arithmetic with the unit conversion visible, the assumption stated, and a link to the station where that conversion happens. Sliders at the top for the three assumptions that dominate the result (model size, serving efficiency, GPU lifetime) so the reader can watch the whole cascade recompute. Error bars shown, never hidden.

**Why it fits:** it uses the existing 27 layers as its spine. It teaches unit-reasoning, which is the most transferable skill in the whole subject. It is intellectually honest in a way that almost nothing written about AI energy is. And it produces a shareable number.

**Effort:** medium. The engineering is trivial; the sourcing is the work, and the sourcing *is* the value.

---

## 2. THE RULER — *feel a nanometre* ⭐

A continuous logarithmic zoom, from the silicon lattice to the electrical grid, with the real objects of *this specific stack* placed at their true scale.

```
10⁻¹⁰ m   silicon lattice constant, 0.543 nm — the floor everything is built on
10⁻⁹      EUV wavelength 13.5 nm · a gate-all-around nanosheet, ~10 atoms thick
10⁻⁸      transistor pitch · the atomic layer deposited per ALD cycle
10⁻⁷      a particle that kills a die
10⁻⁶      a copper via · a CMP scratch
10⁻⁵      an HBM through-silicon via · hybrid bond pitch
10⁻⁴      a solder bump · a bond wire
10⁻³      wafer thickness, 0.775 mm
10⁻²      a reticle field, 26 × 33 mm — the largest object lithography can print at once
10⁻¹      a 300 mm wafer
10⁰       a GPU board · a human
10¹       a rack, 1.5 tonnes · an aisle
10²       a data hall
10³       a campus
10⁴       a substation · transmission span
10⁵       Hsinchu Science Park · the Spruce Pine district
10⁶       Taiwan
10⁷       Earth
```

Fifteen orders of magnitude in one continuous gesture, and **every stop links to the station that operates there**. It is a second navigation of the same 131 stations, arranged by size instead of by depth.

Two moments do the teaching:

- **Around 10⁻⁹**, you park on a nanosheet channel and the lattice is visible behind it. The channel is roughly ten atoms across. Nobody who sees that forgets it.
- **Around 10⁻²**, the reticle field appears — 26 × 33 mm — and you realise *this is why chiplets exist*. The single most important constraint in modern accelerator design is a rectangle you can hold up to the screen.

This is the most-shared genre of educational interactive ever made, and **nobody has built one for the semiconductor stack.** The subject is more suited to it than almost any other, because the range is genuinely 17 orders of magnitude and every stop is a real, named, commercially important object.

**Effort:** medium-high. Canvas or transformed SVG, ~30 hand-drawn objects. The craft ceiling is very high and the payoff is proportional.

---

## 3. THE PROCESS THEATRE — *show the physics, don't describe it* ⭐

The site currently says ALD is "two self-limiting precursor pulses." That sentence is correct and teaches almost nobody anything. These processes are visually gorgeous and completely invisible to everyone outside a fab.

Build a set of tight, accurate, loopable animations — twelve is enough to cover the essential physics:

1. **Czochralski pull** — seed dipped, rotated, withdrawn; the meniscus; diameter control
2. **EUV generation** — tin droplet, pre-pulse flattening it, main pulse, plasma, collector mirror, and the tin debris that slowly kills it
3. **Exposure and resist** — mask, reduction optics, acid generation, post-exposure bake, develop
4. **Atomic layer deposition** — the two half-reactions, and *why* self-limiting means thickness is set by cycle count, not time
5. **Plasma etch** — ion directionality, sidewall passivation, selectivity, the profile you actually get
6. **Chemical-mechanical planarisation** — pad, slurry, the dishing you're fighting
7. **Ion implantation and anneal** — damage, then repair
8. **Copper damascene** — trench, barrier, seed, overfill, polish back
9. **Gate-all-around formation** — the superlattice, the nanosheet release, the wrap. The best animation in the set.
10. **TSV and hybrid bonding** — how twelve DRAM dies become one HBM stack
11. **Backside power delivery** — flipping the wafer and coming in from underneath
12. **Attention as dataflow** — tokens moving through a systolic array; matmul as a physical event

Each is 6–12 seconds, loops, has a scrub bar, and lives **inside the station sheet it belongs to**. No new tab needed. The site simply becomes deeper where you already are — which is exactly the evolutionary change you asked for.

**Why it matters:** this is the highest-craft, most-bookmarked thing you could build. A correct, beautiful, freely available set of semiconductor process animations does not currently exist in one place anywhere on the internet. Teachers would use it. That is how a site gets remembered for a decade.

**Effort:** high, and the only item here I'd stage over time — ship three, then three more. But it compounds, and each one is independently shippable.

---

## 4. THE ATLAS — *geography is the geopolitics* ⭐

Forty jurisdictions in the data and not a single map. Every chokepoint in the site is ultimately a *place*: Spruce Pine, Veldhoven, Hsinchu, Ichon, Bayan Obo, Kyshtym, Northern Virginia.

A world map where each station's production is plotted, with layers you can switch on:

- **Concentration** — a heat overlay of where each layer actually happens
- **Chokepoint circles, drawn to scale** — the single most powerful image the site could produce is a 30-mile circle around Spruce Pine, North Carolina, next to the sentence *"almost every silicon wafer on Earth passes through a crucible made from rock inside this circle."*
- **Export control regimes** — who may sell what to whom, as of a dated snapshot
- **Physical risk** — seismic zones over Hsinchu and Ichon, drought basins over fab clusters, sea lanes
- **Grid** — interconnection queue depth over data-centre markets

And the closing move: **zoom out and show, at true scale, that the world's entire leading-edge logic capacity occupies an area smaller than a mid-sized city.** Nothing argues the fragility case more efficiently than that.

**Effort:** medium. Needs a lat/long per station cluster — genuinely useful curation you'd want anyway — plus a projection. Natural Earth data is free; no mapping service required.

---

## 5. THE TIME MACHINE — *the thirty-year lag*

A timeline from 1947 to now, where each of the 27 strata shows **two dates: when the science was finished, and when it shipped in volume.**

- EUV: concept in the 1980s → ASML programme from 1997 → production 2019. **Thirty years.**
- FinFET: Hu's papers 1999 → Intel 22 nm 2011. **Twelve years.**
- HBM: standardised 2013 → strategically scarce 2023. **Ten years.**
- Transformers: 2017 → ChatGPT 2022. **Five years.**
- Backside power, CFET, glass substrates, 2D channels: **in the lab now.**

The insight this delivers reframes the entire subject: **the AI boom is running on physics that was finished decades ago, and the physics for 2040 is being decided in a lab this week.** Once a reader internalises the lag, every roadmap announcement reads differently, and the whole site becomes less about news and more about structure.

Add a forward-projection band — what's in research now, with honest confidence, clearly separated from what has shipped. Being explicit about *what we don't know* is a trust-builder, not a weakness.

**Effort:** low-medium. Mostly curation, and it's curation you'd enjoy.

---

## 6. THE COUNTERFACTUAL ENGINE — *teach the graph by breaking it*

Structurally this is the *Faults* mechanic from PLAN.md with the money removed — and honestly it may be **better** as a learning device than as a financial one.

Remove one link and follow what happens:

- **Remove EUV.** Multi-patterning everywhere, three to four times the mask cost, node cadence slows by years, and the economics of leading-edge collapse toward a handful of buyers.
- **Remove HBM.** The bandwidth wall returns, accelerators starve, and model architecture bends toward whatever fits in cache.
- **Remove CUDA.** Fifteen years of kernels evaporate; the hardware still works and almost nothing runs on it.
- **Remove Taiwan.** The honest answer, with lead times.
- **Remove attention.** What we actually did before 2017, and how much worse it was.

Each is a short well-written essay plus a graph animation showing what reroutes and what dead-ends. Breaking a dependency graph is the single best way to teach one — you cannot learn structure by reading it, only by perturbing it.

**Effort:** medium. Reuses the Web's existing traversal code. Mostly writing.

---

## 7. THE LIVING FRONTIER — *stay current without price data*

You asked whether there's live data that isn't financial. There is, it's free, and it fits the site's purpose better than quotes do:

| Source | What it feeds | Cost |
|---|---|---|
| arXiv API | New papers slotted into the right stratum (Model, Kernel, Assay, Embodiment) | Free, no key |
| Federal Register API | Export control rules, BIS entity list changes → the Capital & control layer | Free, no key |
| USGS Mineral Commodity Summaries | Gallium, germanium, rare earth production and reserves → Lithosphere | Free |
| EIA | Electricity prices, generation build, interconnection → Power | Free key |
| SEC EDGAR full-text | Who first mentioned "CoWoS" or "hybrid bonding" in a filing, and when | Free |
| Papers-with-code / HF hub | Model releases → the Model and Serve layers | Free |

A nightly job files each new item under the stratum it belongs to, and the site gains a **"what moved in the stack this week"** strip — *knowledge* news, sorted by physical layer rather than by publication. Nobody organises AI news this way. It is immediately more useful than a feed, because position in the stack tells you whether an announcement matters.

**Effort:** medium. Same GitHub Action as the financial ingest — one pipeline, two payloads.

---

## 8. Five multipliers — cheap, and each one lifts everything above it

**The glossary as a graph.** ~400 terms, each with one plain-English sentence, a "why it matters," and a link to its station. Hover any acronym anywhere on the site. Semiconductors have the worst jargon density in technology and this is the single largest friction reducer available. Low effort, disproportionate effect.

**Multiple entrances.** Same 131 stations, five curated paths: *I'm an engineer · I'm an investor · I'm in policy · I'm fifteen and curious · I have five minutes.* It's an ordering and a lens, not new content — cheap to build, and it triples who the site works for.

**The provenance layer.** Every claim carries a source, a vintage, and a confidence, plus a **"contested"** flag where the industry genuinely disagrees. This sounds like housekeeping. It isn't — it's what converts a beautiful infographic into something people cite, and citation is how a site survives past its launch week.

**The physical limits panel.** Per layer, what is *actually* impossible versus merely hard: Landauer's limit on computation, Abbe diffraction, silicon's thermal conductivity, the speed of light as a latency floor across a rack. Separating engineering problems from physics walls is one of the most clarifying things you can teach, and almost nobody does it.

**The gauntlet.** Twenty-seven questions, one per stratum, framed as predictions rather than trivia — *"which of these is the binding constraint on accelerator supply today?"* — with the graph's reasoning revealed after you answer, and a shareable scorecard at the end. People share scores. It's the cheapest distribution mechanism on this list.

---

## Proposed structure

Homepage untouched. Everything below is additive.

```
DESCENT      WEB      RULER      ATLAS      MONEY                    ⌘K
  ↑           ↑         ↑          ↑          ↑
today's    today's    scale     geography  finance
homepage    graph     + time                (absorbs Index)
          deepened   + cascade
```

- **Descent** — exactly as it is today. The front door does not change.
- **Web** — as today, plus the counterfactual engine, since it already has the traversal code.
- **Ruler** — the scale zoom, the timeline, and the cascade. Three instruments, one room. *(Alternative names if "Ruler" doesn't sit right: Bench · Scope · Instruments · Section.)*
- **Atlas** — the map.
- **Money** — everything from PLAN.md, with the Index table absorbed as its screener. Sits between Web and Money as you suggested; Index stops being a top-level tab and lives here and in ⌘K.
- **Process animations, glossary, provenance and limits** live *inside station sheets*. They deepen what exists rather than widening the nav — which is the most evolutionary change of all.

Five tabs, every existing thing survives, and each tab is a lens rather than a new subject.

---

## If you build three things

**The Cascade**, because it delivers the promise in the title and produces a genuinely surprising result. **The Ruler**, because it's the most shareable artifact available on this subject and nobody has made one. **The Atlas**, because geography is the argument the site keeps making in prose without ever showing.

Add the **glossary** alongside them — it's a weekend, and it makes all three land for a much wider audience.

Money then becomes what you described: a strong supporting section, not the thesis.

---

## Answering the GitHub question

**No manual commits.** The whole point is that you never touch it.

A GitHub Actions workflow runs on a cron schedule *inside GitHub's own infrastructure*. It checks out the repo, runs a Node script, writes the JSON, and commits and pushes using the built-in `GITHUB_TOKEN`. Your laptop can be off, closed, or in another country.

```yaml
name: daily-ingest
on:
  schedule: [{ cron: "30 22 * * 1-5" }]   # weekdays, 22:30 UTC
  workflow_dispatch:                       # and a manual button, for testing
permissions:
  contents: write
jobs:
  ingest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: node scripts/ingest/index.mjs
      - run: |
          git config user.name  "stack-bot"
          git config user.email "bot@users.noreply.github.com"
          git add data/
          git diff --staged --quiet || git commit -m "data: $(date -u +%F)"
          git push
```

Three practical notes:

- **Cost: zero.** Actions minutes are unlimited on public repositories. On a private repo you'd get 2,000 free minutes a month and this job uses roughly 40.
- **The 60-day rule doesn't bite you.** GitHub disables scheduled workflows on repos with no activity for 60 days — but this workflow *commits every day*, which is activity. It keeps itself alive.
- **Cron timing is approximate.** Scheduled Actions can run several minutes to about an hour late during GitHub's peak load. Irrelevant for daily-close data; worth knowing before you debug a "missing" 22:30 run.

The `workflow_dispatch` trigger gives you a manual **Run workflow** button in the GitHub UI whenever you want to force a refresh.

---

*Every direction above uses the 131 stations you already wrote. None of them asks you to rewrite a word of it.*
