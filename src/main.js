/* ============================================================
   SAND TO SENTENCE — entry point.

   Loads the static corpus, then initialises each view. Views
   register their public actions on `app`, so nothing imports
   anything else circularly.
   ============================================================ */

import { app } from "./core/app.js";
import { loadData } from "./core/data.js";
import { initRouter } from "./core/router.js";
import { initDescent } from "./views/descent.js";
import { initSheet } from "./views/sheet.js";
import { initWeb } from "./views/web.js";
import { initTable } from "./views/table.js";
import { initTour } from "./views/tour.js";
import { initCascade } from "./views/cascade.js";
import { initRuler } from "./views/ruler.js";
import { initAtlas } from "./views/atlas.js";
import { initTimeline } from "./views/timeline.js";
import { initFaults } from "./views/faults.js";
import { initMoney } from "./views/money.js";
import { initMethod } from "./views/method.js";
import { loadNotes } from "./core/notes.js";

function fail(err) {
  console.error(err);
  const host = document.getElementById("strata") || document.body;
  host.innerHTML =
    `<div style="max-width:60ch;margin:80px auto;padding:0 6vw;font-family:var(--mono);font-size:13px;color:var(--ash);line-height:1.7">
       <p style="color:var(--mag);letter-spacing:.14em;text-transform:uppercase;font-size:11px">Could not load the corpus</p>
       <p>${err.message}</p>
       <p style="margin-top:18px">If you opened this file directly from disk, the browser blocks the data fetch.
       Serve the folder over HTTP instead — <b style="color:var(--qz)">npm run dev</b> — and reload.</p>
     </div>`;
}

async function boot() {
  await loadData();
  await loadNotes();

  initDescent();
  initSheet();
  initWeb();
  initTable();
  initTour();
  await initRuler();
  await initAtlas();
  await initTimeline();
  await initMoney();
  await initFaults();
  await initCascade();
  await initMethod();
  initRouter();

  document.documentElement.classList.add("ready");
}

boot().catch(fail);

/* handy in the console while building */
window.app = app;
