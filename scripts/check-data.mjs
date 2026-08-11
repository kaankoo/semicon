/* Integrity check for the static corpus.  npm run check
   Runs in CI before deploy, so a broken edge never ships. */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const D = path.join(ROOT, "data/static");
const read = f => JSON.parse(fs.readFileSync(path.join(D, f), "utf8"));

const L = read("strata.json");
const S = read("stations.json");
const E = read("edges.json");

const problems = [];
const ok = [];

/* ---- strata ---- */
const nums = L.map(l => l.n);
if (nums.join() !== L.map((_, i) => i + 1).join()) problems.push("strata are not numbered 1..n in order");
L.forEach(l => {
  if (!/^#[0-9A-Fa-f]{6}$/.test(l.c)) problems.push(`stratum ${l.n} has a bad colour: ${l.c}`);
  if (!l.t || !l.a) problems.push(`stratum ${l.n} is missing a title or abstract`);
});
ok.push(`${L.length} strata`);

/* ---- stations ---- */
const ids = new Set();
S.forEach(s => {
  if (ids.has(s.i)) problems.push(`duplicate station id: ${s.i}`);
  ids.add(s.i);
  if (!(s.L >= 1 && s.L <= L.length)) problems.push(`station ${s.i} points at stratum ${s.L}`);
  if (!(s.c >= 0 && s.c <= 3)) problems.push(`station ${s.i} has criticality ${s.c}`);
  ["n", "s", "w"].forEach(k => { if (!s[k]) problems.push(`station ${s.i} is missing "${k}"`); });
  if (!Array.isArray(s.h) || !s.h.length) problems.push(`station ${s.i} has no mechanism list`);
  if (!Array.isArray(s.k) || !s.k.length) problems.push(`station ${s.i} has no key figures`);
  if (!Array.isArray(s.co) || !s.co.length) problems.push(`station ${s.i} has no organisations`);
  (s.co || []).forEach((c, j) => {
    if (!Array.isArray(c) || c.length !== 4) problems.push(`station ${s.i} org #${j} is malformed`);
  });
});
ok.push(`${S.length} stations`);

/* ---- coverage: every stratum has at least one station ---- */
L.forEach(l => {
  if (!S.some(s => s.L === l.n)) problems.push(`stratum ${l.n} (${l.t}) has no stations`);
});

/* ---- edges ---- */
Object.keys(E).forEach(k => {
  if (!ids.has(k)) problems.push(`edge key "${k}" is not a station`);
  E[k].forEach(u => {
    if (!ids.has(u)) problems.push(`edge ${k} -> ${u}: "${u}" is not a station`);
    if (u === k) problems.push(`edge ${k} -> itself`);
  });
});
S.forEach(s => { if (!(s.i in E)) problems.push(`station ${s.i} has no entry in edges.json`); });
ok.push(`${Object.values(E).flat().length} edges`);

/* ---- organisations ---- */
const orgs = new Set();
S.forEach(s => s.co.forEach(c => { if (c[0] !== "—") orgs.add(c[0]); }));
ok.push(`${orgs.size} organisations`);

/* ---- report ---- */
if (problems.length) {
  console.error(`\n  ✗ ${problems.length} problem${problems.length > 1 ? "s" : ""}\n`);
  problems.forEach(p => console.error("    " + p));
  console.error("");
  process.exit(1);
}
console.log(`\n  ✓ corpus is sound — ${ok.join(" · ")}\n`);
