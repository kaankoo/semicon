/* ============================================================
   APP — shared state and late-bound actions.

   View modules read data from here and register the actions that
   other views need to call. This keeps the modules decoupled and
   sidesteps circular imports entirely: a view never imports another
   view, it calls app.<action>().
   ============================================================ */

export const app = {
  /* ---- data (populated by core/data.js) ---- */
  L: [],        // strata
  S: [],        // stations
  E: {},        // raw dependency edges
  byId: {},     // station id -> station
  byL: {},      // stratum number -> [stations]
  UP: {},       // station id -> [upstream ids]   (resolved)
  DN: {},       // station id -> [downstream ids] (resolved)

  /* ---- environment ---- */
  RM: false,    // prefers-reduced-motion

  /* ---- helpers (populated by core/data.js) ---- */
  col: () => "#fff",
  lname: () => "",
  pad: n => String(n).padStart(2, "0"),

  /* ---- actions (registered by the view that owns them) ---- */
  openStation: () => {},   // views/sheet
  closeSheet: () => {},    // views/sheet
  show: () => {},          // core/router
  go: () => {},            // views/descent
  litRail: () => {},       // views/descent
  trace: () => {},         // views/web
  clearTrace: () => {},    // views/web
  fitWeb: () => {},        // views/web
  focusSearch: () => {},   // views/table
  rulerFit: () => {},      // views/ruler
  rulerGoTo: () => {},     // views/ruler
  atlasFit: () => {},      // views/atlas
  atlasGoTo: () => {},     // views/atlas
  lagFit: () => {},        // views/timeline
  lagGoTo: () => {},       // views/timeline
  faultsFit: () => {},     // views/faults
  faultsGoTo: () => {},    // views/faults
  moneyFit: () => {},      // views/money
  showNote: () => {},      // views/method
  tourStop: () => {}       // views/tour
};
