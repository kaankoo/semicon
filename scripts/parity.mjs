/* Parity check — boots the pre-refactor monolith and the post-refactor
   modular app in identical jsdom environments and diffs the DOM each
   produces. If the rendered body markup matches, and the stylesheet is
   byte-identical, the two versions render identically by construction.

   Usage:  node scripts/parity.mjs <path-to-original-index.html>          */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { JSDOM } from "jsdom";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ORIGINAL = process.argv[2];

if (!ORIGINAL || !fs.existsSync(ORIGINAL)) {
  console.error("\n  usage: node scripts/parity.mjs <path-to-original-index.html>\n");
  process.exit(2);
}

/* ---- the shims both versions get, identically ---- */
function shim(window) {
  window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
  window.requestAnimationFrame = cb => setTimeout(cb, 0);
  window.scrollTo = () => {};
  window.Element.prototype.scrollIntoView = () => {};
  window.Element.prototype.getBoundingClientRect = () =>
    ({ width: 1200, height: 800, top: 0, left: 0, right: 1200, bottom: 800 });
  window.fetch = async url => {
    const u = String(url);
    const file = u.startsWith("file:") ? fileURLToPath(u)
      : path.join(ROOT, new URL(u, "http://localhost/").pathname);
    if (!fs.existsSync(file)) return { ok: false, status: 404 };
    return { ok: true, status: 200, json: async () => JSON.parse(fs.readFileSync(file, "utf8")) };
  };
}

/* strip the script tags — they legitimately differ (inline vs module) */
const normalise = html => html
  .replace(/<script\b[\s\S]*?<\/script>/gi, "")
  .replace(/\s+$/gm, "")
  .trim();

/* ---- A: the original monolith, inline script executed by jsdom ---- */
function bootOriginal() {
  const dom = new JSDOM(fs.readFileSync(ORIGINAL, "utf8"), {
    url: "http://localhost/",
    pretendToBeVisual: true,
    runScripts: "dangerously",
    beforeParse: shim
  });
  return new Promise(r => setTimeout(() => r(dom.window.document.body.innerHTML), 300));
}

/* ---- B: the refactor, modules imported into a shimmed window ---- */
async function bootRefactor() {
  const dom = new JSDOM(fs.readFileSync(path.join(ROOT, "index.html"), "utf8"), {
    url: "http://localhost/", pretendToBeVisual: true, runScripts: "outside-only"
  });
  const { window } = dom;
  shim(window);
  for (const k of ["document", "matchMedia", "IntersectionObserver", "requestAnimationFrame",
                   "fetch", "addEventListener", "scrollTo", "Element", "Node", "getComputedStyle"]) {
    globalThis[k] = typeof window[k] === "function" && !/^[A-Z]/.test(k)
      ? window[k].bind(window) : window[k];
  }
  globalThis.window = window;
  await import(pathToFileURL(path.join(ROOT, "src/main.js")).href);
  await new Promise(r => setTimeout(r, 300));
  return window.document.body.innerHTML;
}

const a = normalise(await bootOriginal());
const b = normalise(await bootRefactor());

if (a === b) {
  console.log(`\n  ✓ DOM parity — both versions produce byte-identical body markup (${a.length.toLocaleString()} chars)\n`);
  process.exit(0);
}

/* ---- report the first divergence ---- */
let i = 0;
while (i < a.length && i < b.length && a[i] === b[i]) i++;
const ctx = 220;
console.error(`\n  ✗ DOM diverges at character ${i.toLocaleString()} of ${a.length.toLocaleString()} / ${b.length.toLocaleString()}\n`);
console.error("  original:\n    …" + a.slice(Math.max(0, i - 60), i + ctx).replace(/\n/g, "\n    ") + "\n");
console.error("  refactor:\n    …" + b.slice(Math.max(0, i - 60), i + ctx).replace(/\n/g, "\n    ") + "\n");
process.exit(1);
