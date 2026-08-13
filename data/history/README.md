# data/history

One file per trading day, written by `scripts/ingest/run.mjs` and committed
by the `ingest` Action. **Generated — never hand-edit.**

```
YYYY-MM-DD.json   { "asOf": "2026-08-13", "close": { "NVDA": 182.4, … },
                                          "cap":   { "NVDA": 4.44e12, … } }
```

Deliberately lean. The full quote — currency, 52-week range, the derived
changes — lives in `data/live/quotes.json` and is overwritten daily. What
accumulates here is only what cannot be recovered later: the close, and the
market cap implied by it.

**A stale ticker is absent, not repeated.** If a source failed, `quotes.json`
keeps yesterday's value and flags it; the snapshot omits it entirely. Writing
yesterday's price under today's date would fabricate a data point, and a
series is exactly where that would be hardest to spot a year on. A failed
ticker leaves a gap, and a chart should draw it as a break.

`scripts/check-data.mjs` holds every file here to its filename, its date and
positive prices, so a malformed snapshot fails the build rather than quietly
bending a line.

Roughly 5 KB a day, ~250 trading days a year. The history charts on the
roadmap need about sixty files before they say anything.
