/* ============================================================
   METHOD — where every claim on this site comes from.

   Rendered from the same JSON the rest of the site runs on, so it
   cannot drift out of date relative to what the reader is looking at.
   The assumption ledger in particular is generated from cascade.json;
   nothing here is transcribed by hand.
   ============================================================ */

import { app } from "../core/app.js";
import { render as renderNote, wireNotes } from "../core/notes.js";

const KIND = {
  judgement: ["Judgement", "An editorial claim. Argue with it."],
  curated: ["Curated", "Compiled from public sources; incomplete by construction."],
  cited: ["Cited", "Taken from a named published source."],
  derived: ["Derived", "Computed from first principles, with the working shown."]
};

let M = null, C = null;

function counts() {
  const orgs = new Set();
  app.S.forEach(s => s.co.forEach(c => { if (c[0] !== "—") orgs.add(c[0]); }));
  const edges = Object.values(app.UP).reduce((a, b) => a + b.length, 0);
  const crit = app.S.filter(s => s.c >= 3).length;
  return [
    [app.L.length, "strata"],
    [app.S.length, "stations"],
    [edges, "dependency edges"],
    [orgs.size, "organisations"],
    [crit, "single points of failure"],
    [Object.keys(C.constants).length, "cascade parameters"]
  ];
}

function ledgerRow(id, c) {
  const s = c.source;
  const cite = s.url
    ? `<a href="${s.url}" target="_blank" rel="noopener">${s.who} ↗</a>`
    : s.who;
  const range = (c.lo != null && c.hi != null && c.lo !== c.hi)
    ? `${trim(c.lo)} – ${trim(c.hi)}`
    : "—";
  return `
    <tr>
      <td class="mth__p"><b>${c.label}</b><code>${id}</code></td>
      <td class="mth__v">${trim(c.value)} <i>${c.unit}</i></td>
      <td class="mth__r">${range}</td>
      <td class="mth__d">${c.derivation}</td>
      <td class="mth__s">${cite}<span>${s.when && s.when !== "—" ? s.when : ""}</span></td>
    </tr>`;
}

const trim = v =>
  Math.abs(v) >= 1000 ? v.toLocaleString("en")
  : Math.abs(v) < 0.001 ? v.toExponential(2)
  : String(+v.toPrecision(4));

function assumptionRow(a) {
  return `
    <tr>
      <td class="mth__p"><b>${a.label}</b><code>${a.id}</code></td>
      <td class="mth__v">${a.options.map((o, i) =>
        `<span class="${i === a.default ? "mth__on" : ""}">${o.label}</span>`).join("")}</td>
      <td class="mth__d" colspan="3">${a.help}</td>
    </tr>`;
}

export async function initMethod() {
  const [rm, rc] = await Promise.all([
    fetch(new URL("../../data/static/method.json", import.meta.url)),
    fetch(new URL("../../data/static/cascade.json", import.meta.url))
  ]);
  if (!rm.ok) throw new Error(`Could not load method.json (${rm.status})`);
  M = await rm.json();
  C = await rc.json();

  const el = id => document.getElementById(id);

  el("mthIntro").textContent = M.intro;
  el("mthVintage").textContent = M.meta.vintage;
  el("mthUpd").textContent = M.meta.updated;

  el("mthCount").innerHTML = counts()
    .map(([n, l]) => `<div class="mth__ct"><b>${n.toLocaleString("en")}</b><span>${l}</span></div>`).join("");

  el("mthRead").innerHTML = M.reading
    .map(r => `<div class="mth__rd"><b>${r.term}</b><p>${r.def}</p></div>`).join("");

  /* provenance, grouped so the judgement calls sit together and first */
  const order = ["judgement", "curated", "cited", "derived"];
  el("mthProv").innerHTML = order.map(k => {
    const rows = M.provenance.filter(p => p.kind === k);
    if (!rows.length) return "";
    return `
      <div class="mth__grp">
        <div class="mth__gh mth__gh--${k}">
          <b>${KIND[k][0]}</b><span>${KIND[k][1]}</span>
        </div>
        ${rows.map(p => `
          <div class="mth__pv">
            <div class="mth__pvh">
              <b>${p.class}</b>
              <span class="mth__who">${p.url
                ? `<a href="${p.url}" target="_blank" rel="noopener">${p.who} ↗</a>` : p.who}</span>
              <span class="mth__vt">${p.vintage}</span>
            </div>
            <p>${p.detail}</p>
          </div>`).join("")}
      </div>`;
  }).join("");

  el("mthAssume").innerHTML = C.assumptions.map(assumptionRow).join("");
  el("mthLedger").innerHTML = Object.entries(C.constants).map(([k, c]) => ledgerRow(k, c)).join("");

  el("mthGrain").innerHTML = app.notes.all
    .slice().sort((a, b) => b.weight - a.weight)
    .map(n => renderNote(n)).join("");

  el("mthLimits").innerHTML = M.limits
    .map(l => `<div class="mth__lim"><h4>${l.title}</h4><p>${l.body}</p></div>`).join("");

  el("mthCorr").innerHTML =
    `<p>${M.corrections.body}</p>
     <a class="btn" href="${M.corrections.repo}/issues/new" target="_blank" rel="noopener">Open an issue ↗</a>
     <a class="btn" href="${M.corrections.repo}" target="_blank" rel="noopener">Read the data ↗</a>`;

  wireNotes(document.getElementById("v-mth"));

  /* inline grain flags elsewhere on the site jump here */
  app.showNote = id => {
    app.show("mth");
    const t = document.querySelector(`#mthGrain [data-note="${id}"]`);
    if (!t) return;
    t.scrollIntoView({ behavior: app.RM ? "auto" : "smooth", block: "center" });
    t.classList.remove("grain--flash");
    void t.offsetWidth;
    t.classList.add("grain--flash");
  };
}
