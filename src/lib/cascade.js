/* ============================================================
   CASCADE — the arithmetic that turns one answer back into rock.

   Parameters, ranges and sources live in data/static/cascade.json.
   The chain that consumes them lives here, written out in full so
   every conversion can be read and argued with.

   Everything is computed three times: with each parameter at its
   low bound, its central value, and its high bound. The spread is
   not decoration — it is most of the honest answer.
   ============================================================ */

const YEAR_S = 365.25 * 24 * 3600;

/* ---------- formatting ---------- */

/* each entry is [upper bound in base units, label, multiplier from base] */
const UNITS = {
  g:  [[1e-9, "pg", 1e12], [1e-6, "ng", 1e9], [1e-3, "µg", 1e6], [1, "mg", 1e3], [1e3, "g", 1], [Infinity, "kg", 1e-3]],
  L:  [[1e-6, "nL", 1e9], [1e-3, "µL", 1e6], [1, "mL", 1e3], [Infinity, "L", 1]],
  Wh: [[1e-6, "nWh", 1e9], [1e-3, "µWh", 1e6], [1, "mWh", 1e3], [1e3, "Wh", 1], [Infinity, "kWh", 1e-3]],
  s:  [[1e-3, "µs", 1e6], [1, "ms", 1e3], [60, "s", 1], [Infinity, "min", 1 / 60]]
};

export function fmt(v, unit) {
  if (unit === "×") return sig(v) + "×";
  if (unit === "count") return Math.round(v).toLocaleString("en");
  if (unit === "g!") return sig(v) + " g";              // don't rescale — CO₂ reads in grams
  if (unit === "") return sci(v);
  const ladder = UNITS[unit];
  if (!ladder) return sig(v) + " " + unit;
  for (const [ceil, label, mul] of ladder) {
    if (Math.abs(v) < ceil) return sig(v * mul) + " " + label;
  }
  const [, label, mul] = ladder[ladder.length - 1];
  return sig(v * mul) + " " + label;
}

function sig(v) {
  const a = Math.abs(v);
  if (a === 0) return "0";
  if (a >= 100) return v.toFixed(0);
  if (a >= 10) return v.toFixed(1);
  if (a >= 1) return v.toFixed(2);
  return v.toPrecision(3).replace(/0+$/, "").replace(/\.$/, "");
}

function sci(v) {
  const e = Math.floor(Math.log10(Math.abs(v)));
  const m = v / Math.pow(10, e);
  return `${m.toFixed(2)} × 10${sup(e)}`;
}

const SUP = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
const sup = n => String(n).split("").map(c => SUP[c] ?? c).join("");

/* ---------- the chain ---------- */

/**
 * @param {object} D      parsed cascade.json
 * @param {object} picks  { model, life, util, grid } — chosen assumption values
 * @param {"lo"|"value"|"hi"} bound  which end of each range to use
 */
function run(D, picks, bound) {
  const C = D.constants;
  const k = id => C[id][bound] ?? C[id].value;

  /* the assumption the user picked scales the central estimate for
     energy-per-token; the lo/hi bounds keep their relative spread  */
  const tokenSpread = k("tokenEnergyRange") / C.tokenEnergyRange.value;
  const perToken = picks.model * (bound === "value" ? 1 : tokenSpread);

  const lifeS = picks.life * YEAR_S * picks.util;

  const tokens = 1000;
  const acc = tokens * perToken;                       // Wh, accelerator only
  const socket = acc * k("overheadMultiplier");        // Wh, at the meter
  const gpusec = acc * 3600 / k("acceleratorPowerW");  // s of occupancy
  const gpufrac = gpusec / lifeS;
  const wafer = gpufrac * k("waferEqPerGpu");          // wafer-equivalents
  const silicon = wafer * k("waferMassG");             // g
  const poly = wafer * k("polyPerWafer");              // g
  const quartz = wafer * k("quartzitePerWafer");       // g

  const crucible = wafer * k("cruciblePerWafer");      // g
  const fabwater = wafer * k("fabWaterPerWafer");      // L
  const fabenergy = wafer * k("fabEnergyPerWafer") * 1000;      // Wh
  const coolwater = socket * k("coolingWaterPerWh") / 1000;     // L
  const co2 = socket / 1000 * picks.grid;              // g

  /* The factor actually applied at each step, so the interface can never
     display an operator that disagrees with the arithmetic behind it.
     `of` names the quantity the factor was applied to.                   */
  const factors = {
    acc:      { of: "tokens",  op: "×", n: perToken,                unit: "Wh per output token" },
    gpusec:   { of: "acc",     op: "÷", n: k("acceleratorPowerW"),  unit: "W of board power" },
    gpufrac:  { of: "gpusec",  op: "÷", n: lifeS,                   unit: `s of service life (${picks.life} yr × ${Math.round(picks.util * 100)}%)` },
    wafer:    { of: "gpufrac", op: "×", n: k("waferEqPerGpu"),      unit: "wafers per accelerator" },
    silicon:  { of: "wafer",   op: "×", n: k("waferMassG"),         unit: "g per wafer" },
    poly:     { of: "silicon", op: "×", n: k("polyPerWafer") / k("waferMassG"), unit: "for kerf and ingot crop" },
    quartz:   { of: "poly",    op: "×", n: k("quartzitePerWafer") / k("polyPerWafer"), unit: "for stoichiometry and smelter yield" },

    socket:   { of: "acc",     op: "×", n: k("overheadMultiplier"), unit: "for host, idle and cooling" },
    coolwater:{ of: "socket",  op: "×", n: k("coolingWaterPerWh"),  unit: "mL per Wh" },
    co2:      { of: "socket",  op: "×", n: picks.grid,              unit: "gCO₂e per kWh" },
    crucible: { of: "wafer",   op: "×", n: k("cruciblePerWafer"),   unit: "g per wafer" },
    fabwater: { of: "wafer",   op: "×", n: k("fabWaterPerWafer"),   unit: "L per wafer" },
    fabenergy:{ of: "wafer",   op: "×", n: k("fabEnergyPerWafer"),  unit: "kWh per wafer" }
  };

  return {
    values: { tokens, acc, socket, gpusec, gpufrac, wafer, silicon, poly, quartz,
              crucible, fabwater, fabenergy, coolwater, co2 },
    factors
  };
}

export const UNIT_OF = {
  tokens: "count", acc: "Wh", socket: "Wh", gpusec: "s", gpufrac: "", wafer: "",
  silicon: "g", poly: "g", quartz: "g", crucible: "g", fabwater: "L",
  fabenergy: "Wh", coolwater: "L", co2: "g!"
};

/**
 * Runs the chain at all three bounds and derives the findings.
 * @returns {{ lo, mid, hi, findings }}
 */
export function compute(D, picks) {
  const midRun = run(D, picks, "value");
  const mid = midRun.values;
  const factors = midRun.factors;
  const a = run(D, picks, "lo").values;
  const b = run(D, picks, "hi").values;

  /* lo/hi are not guaranteed to land the right way round for every
     quantity, so normalise per key rather than assuming             */
  const lo = {}, hi = {};
  for (const key of Object.keys(mid)) {
    lo[key] = Math.min(a[key], b[key]);
    hi[key] = Math.max(a[key], b[key]);
  }

  const findings = [
    {
      id: "energy-ratio",
      value: mid.socket / mid.fabenergy,
      headline: `${Math.round(mid.socket / mid.fabenergy)}×`,
      title: "Running it costs far more than making it",
      body: `The electricity to serve this answer is <b>${Math.round(mid.socket / mid.fabenergy)} times</b> the fab electricity embodied in the silicon that served it, amortised over the part's whole life. Every intuition about AI consuming the earth's minerals collapses here: the sand is effectively free, and the power station is not.`
    },
    {
      id: "water-ratio",
      value: mid.coolwater / mid.fabwater,
      headline: `${Math.round(mid.coolwater / mid.fabwater)}×`,
      title: "The thirsty part is the cooling, not the fab",
      body: `A fab drinks thousands of litres per wafer, which sounds enormous — but it drinks them <i>once</i>. Datacentre cooling water is spent on every request, and works out <b>${Math.round(mid.coolwater / mid.fabwater)} times</b> larger per answer.`
    },
    {
      id: "tonne",
      value: 1e6 / mid.crucible,
      headline: fmtBig(1e6 / mid.crucible * 1000),
      title: "One tonne of Spruce Pine quartz",
      body: `A single tonne of crucible-grade quartz — one truckload from one county in North Carolina — carries roughly <b>${fmtBig(1e6 / mid.crucible * 1000)} tokens</b> of served output. Generating the electricity for them would take about <b>${((1e6 / mid.crucible) * mid.socket / 1e12 / 8.766).toFixed(1)} GW</b> running flat out for a year. The rock is not the constraint. It was never the rock.`
    }
  ];

  return { lo, mid, hi, factors, findings };
}

/**
 * Applies each reported factor to the quantity it claims to act on and
 * checks the result matches the value shown. Guarantees the interface
 * can never display arithmetic that does not reconcile.
 * @returns {string[]} descriptions of any step that fails to reconcile
 */
export function reconcile(D, picks) {
  const { mid, factors } = compute(D, picks);
  const bad = [];
  for (const [id, f] of Object.entries(factors)) {
    const base = mid[f.of];
    let want = f.op === "×" ? base * f.n : base / f.n;
    if (id === "gpusec") want = base * 3600 / f.n;        // Wh → J → s
    if (id === "coolwater") want = base * f.n / 1000;     // mL → L
    if (id === "co2") want = base / 1000 * f.n;           // Wh → kWh
    if (id === "fabenergy") want = base * f.n * 1000;     // kWh → Wh
    const got = mid[id];
    if (Math.abs(want - got) > Math.abs(got) * 1e-9) {
      bad.push(`${id}: ${f.of} ${f.op} ${f.n} gives ${want}, but the chain shows ${got}`);
    }
  }
  return bad;
}

function fmtBig(v) {
  const e = Math.floor(Math.log10(v));
  return `${(v / Math.pow(10, e)).toFixed(1)} × 10${sup(e)}`;
}
