/* ============================================================
   CASCADE — the view.  Sand to Sentence, actually quantified.
   ============================================================ */

import { app } from "../core/app.js";
import { compute, fmt, UNIT_OF } from "../lib/cascade.js";
import { forStep, renderInline, wireNotes } from "../core/notes.js";

let D = null;
const picks = {};
let openSource = null;

/* ---------- rendering ---------- */

function stationLink(id) {
  if (!id || !app.byId[id]) return "";
  const s = app.byId[id];
  return `<button class="cas__st" data-station="${id}" style="--c:${app.col(s.L)}">
            <b>${app.pad(s.L)}</b>${s.n}</button>`;
}

function sourceNote(cid) {
  const c = D.constants[cid];
  if (!c) return "";
  const s = c.source;
  const cite = s.url
    ? `<a href="${s.url}" target="_blank" rel="noopener">${s.who} — ${s.what}${s.when && s.when !== "—" ? `, ${s.when}` : ""} ↗</a>`
    : `${s.who} — ${s.what}`;
  return `<div class="cas__src" id="src-${cid}" hidden>
            <p>${c.derivation}</p>
            <p class="cas__cite">${cite}</p>
          </div>`;
}

/* The operator shown is the factor the engine actually applied — read
   back out of the computation, never re-derived. It cannot disagree
   with the arithmetic it describes. */
function num(v) {
  const a = Math.abs(v);
  if (a === 0) return "0";
  if (a >= 1e5 || a < 1e-2) return fmt(v, "");
  if (a >= 1000) return v.toLocaleString("en", { maximumFractionDigits: 0 });
  if (a >= 100) return v.toFixed(0);
  if (a >= 10) return v.toFixed(1);
  return v.toFixed(2);
}

function opLabel(f) {
  if (!f) return "";
  return `<span class="cas__op"><em>${f.op} ${num(f.n)}</em><i>${f.unit}</i></span>`;
}

function row(step, res, isFirst) {
  const { mid, lo, hi, factors } = res;
  const v = mid[step.id], unit = UNIT_OF[step.id];
  const src = D.stepSources[step.id];
  const spread = lo[step.id] && hi[step.id] && hi[step.id] / lo[step.id] > 1.05;

  return `
    <div class="cas__row" data-step="${step.id}">
      <div class="cas__rail"><i></i></div>
      <div class="cas__body">
        ${isFirst ? "" : `<div class="cas__conv">${opLabel(factors[step.id])}</div>`}
        <div class="cas__val">
          <b>${fmt(v, unit)}</b>
          <span class="cas__lbl">${step.label}</span>
        </div>
        <div class="cas__meta">
          <span class="cas__sub">${step.sub}</span>
          ${spread ? `<span class="cas__rng">${fmt(lo[step.id], unit)} – ${fmt(hi[step.id], unit)}</span>` : ""}
          ${step.station ? stationLink(step.station) : ""}
          ${src ? `<button class="cas__how" data-src="${src}">how ▾</button>` : ""}
        </div>
        ${src ? sourceNote(src) : ""}
        ${forStep(step.id).map(renderInline).join("")}
      </div>
    </div>`;
}

function branchCard(b, res) {
  const v = res.mid[b.id], unit = UNIT_OF[b.id];
  const f = res.factors[b.id];
  const fromStep = [...D.chain, ...D.branches].find(s => s.id === b.from);
  return `
    <div class="cas__br">
      <div class="cas__brv"><b>${fmt(v, unit)}</b></div>
      <div class="cas__brl">${b.label}</div>
      <div class="cas__brs">${b.sub}</div>
      ${f ? `<div class="cas__brop"><em>${f.op} ${num(f.n)}</em> ${f.unit}
              <i>from ${(fromStep?.label || b.from).toLowerCase()}</i></div>` : ""}
      <div class="cas__brf">
        ${b.station ? stationLink(b.station) : ""}
        ${b.via && D.constants[b.via] ? `<button class="cas__how" data-src="${b.via}">how ▾</button>` : ""}
      </div>
      ${b.via && D.constants[b.via] ? sourceNote(b.via) : ""}
      ${forStep(b.id).map(renderInline).join("")}
    </div>`;
}

function render() {
  const res = compute(D, picks);
  const host = document.getElementById("casChain");

  host.innerHTML = D.chain.map((s, i) => row(s, res, i === 0)).join("");

  document.getElementById("casBranch").innerHTML =
    D.branches.map(b => branchCard(b, res)).join("");

  document.getElementById("casFind").innerHTML = res.findings.map(f => `
    <div class="cas__fi">
      <b>${f.headline}</b>
      <h4>${f.title}</h4>
      <p>${f.body}</p>
    </div>`).join("");

  /* headline */
  const m = res.mid;
  document.getElementById("casLead").innerHTML =
    `<span>${fmt(m.socket, "Wh")}</span> of electricity ·
     <span>${fmt(m.coolwater, "L")}</span> of cooling water ·
     <span>${fmt(m.silicon, "g")}</span> of silicon ·
     <span>${fmt(m.quartz, "g")}</span> of rock`;

  wire();
  if (openSource) {
    const el = document.getElementById("src-" + openSource);
    if (el) {
      el.hidden = false;
      const btn = document.querySelector(`[data-src="${openSource}"]`);
      if (btn) btn.textContent = "how ▴";
    }
  }
}

function wire() {
  wireNotes(document.getElementById("v-cas"));
  document.querySelectorAll("#v-cas [data-station]").forEach(b =>
    b.addEventListener("click", () => app.openStation(b.dataset.station)));

  document.querySelectorAll("#v-cas [data-src]").forEach(b =>
    b.addEventListener("click", () => {
      const id = b.dataset.src;
      const el = document.getElementById("src-" + id);
      const opening = el.hidden;
      document.querySelectorAll("#v-cas .cas__src").forEach(x => { x.hidden = true; });
      document.querySelectorAll("#v-cas .cas__how").forEach(x => { x.textContent = "how ▾"; });
      el.hidden = !opening;
      b.textContent = opening ? "how ▴" : "how ▾";
      openSource = opening ? id : null;
    }));
}

function controls() {
  document.getElementById("casCtl").innerHTML = D.assumptions.map(a => `
    <div class="cas__as">
      <div class="cas__ash">
        <span>${a.label}</span>
        <button class="cas__q" data-help="${a.id}" aria-label="What this means">?</button>
      </div>
      <div class="cas__seg" data-as="${a.id}">
        ${a.options.map((o, i) =>
          `<button data-i="${i}" aria-pressed="${i === a.default}" title="${o.note}">${o.label}</button>`).join("")}
      </div>
      <p class="cas__help" id="help-${a.id}" hidden>${a.help}</p>
    </div>`).join("");

  document.querySelectorAll("#casCtl .cas__seg").forEach(seg =>
    seg.addEventListener("click", e => {
      const b = e.target.closest("button");
      if (!b) return;
      const a = D.assumptions.find(x => x.id === seg.dataset.as);
      picks[a.id] = a.options[+b.dataset.i].value;
      [...seg.children].forEach(x => x.setAttribute("aria-pressed", x === b));
      render();
    }));

  document.querySelectorAll("#casCtl .cas__q").forEach(b =>
    b.addEventListener("click", () => {
      const el = document.getElementById("help-" + b.dataset.help);
      el.hidden = !el.hidden;
    }));
}

/* ---------- init ---------- */

export async function initCascade() {
  const url = new URL("../../data/static/cascade.json", import.meta.url);
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Could not load cascade.json (${r.status})`);
  D = await r.json();

  D.assumptions.forEach(a => { picks[a.id] = a.options[a.default].value; });

  document.getElementById("casUpd").textContent = D.meta.updated;
  controls();
  render();
}
