/* ============================================================
   DESCENT — the cross-section: hero, core sample, rail, and the
   27 stratum sections with their station cards.
   ============================================================ */

import { app } from "../core/app.js";

/* ---------- station card ---------- */
function card(s, c) {
  const b = document.createElement("button");
  b.className = "card";
  b.style.setProperty("--c", c);
  b.dataset.id = s.i;
  b.innerHTML =
    `<div class="card__id"><span>${app.pad(s.L)}·${s.i}</span></div>
     <div class="card__n">${s.n}</div>
     <div class="card__s">${s.s}</div>
     <div class="card__f"><span>${s.co.length} orgs</span>
       <span class="pips">${[1, 2, 3].map(i =>
        `<i class="pip ${i <= s.c ? (s.c >= 3 ? "on hi" : "on") : ""}"></i>`).join("")}</span>
     </div>`;
  b.addEventListener("click", () => app.openStation(s.i));
  return b;
}

/* ---------- rail ---------- */
function litRail(n) {
  document.querySelectorAll(".stratum").forEach(e => e.classList.toggle("on", +e.dataset.s === n));
}

/* The Descent reports its depth the same way every other view does, so
   that coming back to this tab restores where you had scrolled to
   rather than leaving the rail on the last chart you looked at. */
function go(n) {
  app.show("strata");
  const el = document.getElementById("s" + n);
  if (el) el.scrollIntoView({ behavior: app.RM ? "auto" : "smooth", block: "start" });
  app.depth("strata", n);
}

/* ---------- init ---------- */
export function initDescent() {
  const { L, S, byL, pad, RM } = app;

  /* ---- hero stats + core sample ---- */
  const nCo = new Set(), nCtry = new Set();
  S.forEach(s => s.co.forEach(c => {
    if (c[0] !== "—") nCo.add(c[0]);
    if (c[3] && c[3] !== "—") c[3].split("/").forEach(x => nCtry.add(x));
  }));
  const stats = [[L.length, "strata"], [S.length, "stations"], [nCo.size + "+", "companies"], [nCtry.size, "jurisdictions"]];
  document.getElementById("heroStats").innerHTML = stats
    .map(s => `<div class="hstat"><b>${s[0]}</b><span>${s[1]}</span></div>`).join("");

  const core = document.getElementById("core");
  const counts = L.map(l => (byL[l.n] || []).length), mx = Math.max(...counts);
  L.forEach((l, idx) => {
    const w = (.42 + .58 * (counts[idx] / mx)).toFixed(3);
    const b = document.createElement("div");
    b.className = "core__b";
    b.style.setProperty("--c", l.c);
    b.style.setProperty("--w", w);
    b.style.setProperty("--d", (RM ? 0 : .12 + idx * .062) + "s");
    b.dataset.l = pad(l.n) + " " + l.t;
    b.title = l.t;
    b.addEventListener("click", () => go(l.n));
    core.appendChild(b);
  });

  /* ---- rail ---- */
  const r = document.getElementById("railStack");
  L.slice().reverse().forEach(l => {
    const d = document.createElement("button");
    d.className = "stratum";
    d.style.setProperty("--c", l.c);
    d.dataset.n = pad(l.n) + " · " + l.t;
    d.dataset.s = l.n;
    d.setAttribute("aria-label", l.t);
    d.addEventListener("click", () => go(l.n));
    r.appendChild(d);
  });

  /* ---- stratum sections ---- */
  const host = document.getElementById("strata");
  L.forEach(l => {
    const st = byL[l.n] || [], crit = st.filter(s => s.c >= 3).length;
    const sec = document.createElement("section");
    sec.className = "sec";
    sec.id = "s" + l.n;
    sec.style.setProperty("--c", l.c);
    sec.innerHTML =
      `<div class="sec__head">
         <div class="sec__no">${pad(l.n)}<br>/${pad(L.length)}</div>
         <div>
           <h2 class="sec__ttl">${l.t}</h2>
           <p class="sec__as">${l.a}</p>
           <div class="sec__meta">
             <span>${st.length} station${st.length > 1 ? "s" : ""}</span>
             <span>${st.reduce((a, b) => a + b.co.length, 0)} organisations</span>
             ${crit ? `<span style="color:var(--mag)">${crit} single point${crit > 1 ? "s" : ""} of failure</span>` : ""}
           </div>
         </div>
       </div>
       <div class="grid"></div>`;
    const g = sec.querySelector(".grid");
    st.forEach(s => g.appendChild(card(s, l.c)));
    host.appendChild(sec);
  });

  const io = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) app.depth("strata", +e.target.id.slice(1)); });
  }, { rootMargin: "-15% 0px -70% 0px" });
  document.querySelectorAll(".sec").forEach(e => io.observe(e));

  /* ---- register ---- */
  app.go = go;
  app.litRail = litRail;
}
