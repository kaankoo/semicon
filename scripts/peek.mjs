/* Pull one record out of the corpus without reading a 239 KB file.
   stations.json is 8,887 lines — never open it whole.

     npm run peek -- hpq              one station, full record
     npm run peek -- hpq --brief      just the identity line
     npm run peek -- --stratum 8      every station in a stratum
     npm run peek -- --find quartz    search names, taglines and prose
     npm run peek -- --org ASML       every station an organisation appears at
     npm run peek -- --ids            all 131 ids with their stratum
*/

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const D = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../data/static");
const read = f => JSON.parse(fs.readFileSync(path.join(D, f), "utf8"));
const L = read("strata.json"), S = read("stations.json"), E = read("edges.json");

const args = process.argv.slice(2);
const flag = n => { const i = args.indexOf("--" + n); return i < 0 ? null : (args[i + 1] ?? true); };
const brief = args.includes("--brief");
const pad = n => String(n).padStart(2, "0");
const line = s => `${pad(s.L)} ${L[s.L - 1].t.padEnd(18)} ${s.i.padEnd(10)} ${s.n}`;

if (args.includes("--ids") || !args.length) {
  S.forEach(s => console.log(line(s)));
  console.log(`\n${S.length} stations across ${L.length} strata`);
  process.exit(0);
}

if (flag("stratum")) {
  const n = +flag("stratum");
  console.log(`\n${pad(n)} ${L[n - 1].t}\n${L[n - 1].a}\n`);
  S.filter(s => s.L === n).forEach(s => console.log(`  ${s.i.padEnd(10)} ${s.n.padEnd(34)} ${s.s}`));
  process.exit(0);
}

if (flag("find")) {
  const q = String(flag("find")).toLowerCase();
  const hits = S.filter(s => (s.n + s.s + s.w + s.i).toLowerCase().includes(q));
  hits.forEach(s => console.log(line(s)));
  console.log(`\n${hits.length} station${hits.length === 1 ? "" : "s"} match "${q}"`);
  process.exit(0);
}

if (flag("org")) {
  const q = String(flag("org")).toLowerCase();
  let n = 0;
  S.forEach(s => s.co.forEach(c => {
    if (c[0].toLowerCase().includes(q)) { n++; console.log(`${line(s).padEnd(56)} ${c[0]} — ${c[1]}`); }
  }));
  console.log(`\n${n} appearance${n === 1 ? "" : "s"}`);
  process.exit(0);
}

/* a single station */
const id = args.find(a => !a.startsWith("--"));
const s = S.find(x => x.i === id);
if (!s) {
  console.error(`\n  no station "${id}". Try: npm run peek -- --find ${id}\n`);
  process.exit(1);
}
if (brief) { console.log(line(s)); process.exit(0); }

const up = E[s.i] || [], dn = Object.keys(E).filter(k => (E[k] || []).includes(s.i));
console.log(`
${pad(s.L)} ${L[s.L - 1].t} · ${s.i}
${s.n} — ${s.s}
criticality ${s.c}/3

${s.w}

HOW IT WORKS
${s.h.map(x => "  · " + x).join("\n")}

BY THE NUMBERS
${s.k.map(k => `  ${k[0].padEnd(16)} ${k[1]}`).join("\n")}
${s.x ? `\nCHOKEPOINT\n  ${s.x}` : ""}

ORGANISATIONS (${s.co.length})
${s.co.map(c => `  ${c[0].padEnd(30)} ${(c[3] || "").padEnd(7)} ${c[1]}`).join("\n")}

DEPENDS ON   ${up.join(", ") || "—"}
FEEDS INTO   ${dn.join(", ") || "—"}
`);
