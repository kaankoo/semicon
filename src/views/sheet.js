/* ============================================================
   SHEET — the station dossier that slides in from the right.
   ============================================================ */

import { app } from "../core/app.js";

const CRIT = ["Widely sourced", "Concentrated", "Highly concentrated", "Single point of failure"];

let sheet, scrim, cur = null;

function openStation(id) {
  const { byId, S, UP, DN, col, lname, pad } = app;
  const s = byId[id];
  if (!s) return;
  cur = id;

  sheet.style.setProperty("--c", col(s.L));
  document.getElementById("shK").innerHTML =
    `<span>${pad(s.L)} · ${lname(s.L)}</span><b>${s.i}</b>`;
  document.getElementById("shN").textContent = s.n;
  document.getElementById("shS").textContent = s.s;

  let h = `<div class="blk"><p>${s.w}</p></div>`;
  h += `<div class="blk"><h4 class="blk__h">How it actually works</h4>
      <ul class="mech">${s.h.map(x => `<li><span>${x}</span></li>`).join("")}</ul></div>`;
  h += `<div class="blk"><h4 class="blk__h">By the numbers</h4>
      <div class="kv">${s.k.map(k => `<div><b>${k[0]}</b><span>${k[1]}</span></div>`).join("")}</div></div>`;
  if (s.x) h += `<div class="blk"><div class="warn"><b>${CRIT[s.c]}</b>${s.x}</div></div>`;
  h += `<div class="blk"><h4 class="blk__h">Who does this — ${s.co.length} organisations</h4>
      <div class="co">${s.co.map(c => {
        const inner = `<span class="cnm">${c[0]}${c[3] && c[3] !== "—" ? ` <i>${c[3]}</i>` : ""}</span>
                     <span class="crl">${c[1]}</span>`;
        return c[2] && c[2] !== "—"
          ? `<a href="https://${c[2].replace(/^https?:\/\//, "")}" target="_blank" rel="noopener">${inner}<span class="cgo">↗</span></a>`
          : `<div class="nolink">${inner}</div>`;
      }).join("")}</div></div>`;

  const up = UP[s.i] || [], dn = DN[s.i] || [];
  if (up.length) h += `<div class="blk"><h4 class="blk__h">Depends on</h4><div class="links">${
    up.map(u => `<button class="lnk" data-go="${u}" style="--c:${col(byId[u].L)}"><b>${pad(byId[u].L)}</b>${byId[u].n}</button>`).join("")}</div></div>`;
  if (dn.length) h += `<div class="blk"><h4 class="blk__h">Feeds into</h4><div class="links">${
    dn.map(u => `<button class="lnk" data-go="${u}" style="--c:${col(byId[u].L)}"><b>${pad(byId[u].L)}</b>${byId[u].n}</button>`).join("")}</div></div>`;
  h += `<div class="blk"><button class="btn" id="traceBtn" style="width:100%;justify-content:center">Trace this back to sand →</button></div>`;

  const body = document.getElementById("shB");
  body.innerHTML = h;
  body.scrollTop = 0;
  body.querySelectorAll("[data-go]").forEach(b => b.addEventListener("click", () => openStation(b.dataset.go)));
  const tb = document.getElementById("traceBtn");
  if (tb) tb.addEventListener("click", () => {
    closeSheet();
    app.show("web");
    setTimeout(() => app.trace(s.i), 120);
  });

  const flat = S.map(x => x.i), k = flat.indexOf(id);
  const p = byId[flat[(k - 1 + flat.length) % flat.length]], nx = byId[flat[(k + 1) % flat.length]];
  const pb = document.getElementById("shPrev"), nb = document.getElementById("shNext");
  pb.textContent = "← " + p.n;
  nb.textContent = nx.n + " →";
  pb.onclick = () => openStation(p.i);
  nb.onclick = () => openStation(nx.i);

  sheet.classList.add("on");
  scrim.classList.add("on");
  sheet.setAttribute("aria-hidden", "false");
  app.litRail(s.L);
}

function closeSheet() {
  sheet.classList.remove("on");
  scrim.classList.remove("on");
  sheet.setAttribute("aria-hidden", "true");
  cur = null;
}

export function initSheet() {
  sheet = document.getElementById("sheet");
  scrim = document.getElementById("scrim");

  document.getElementById("shX").addEventListener("click", closeSheet);
  scrim.addEventListener("click", closeSheet);
  addEventListener("keydown", e => {
    if (e.key === "Escape") { closeSheet(); app.tourStop(); }
    if (!cur) return;
    if (e.key === "ArrowRight") document.getElementById("shNext").click();
    if (e.key === "ArrowLeft") document.getElementById("shPrev").click();
  });

  app.openStation = openStation;
  app.closeSheet = closeSheet;
}
