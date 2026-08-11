/* ============================================================
   GLYPHS — schematic shapes for the Ruler.

   Every glyph draws inside a 100 × 100 box centred on (50,50) and is
   scaled by the renderer, so one function serves an object whether it
   is two pixels wide or nine hundred. Diagrammatic rather than
   illustrative: these are meant to read as technical notation, not
   as pictures.

   `c` is the object's accent colour. `detail` adds optional extras
   that only become legible at large sizes.
   ============================================================ */

const P = (d, extra = "") => `<path d="${d}" ${extra}/>`;

export const GLYPHS = {

  /* diamond-cubic cell, seen down a face */
  lattice: c => {
    let s = "";
    for (let i = 0; i <= 2; i++)
      for (let j = 0; j <= 2; j++)
        s += `<circle cx="${20 + i * 30}" cy="${20 + j * 30}" r="4.5" fill="${c}"/>`;
    s += `<circle cx="35" cy="35" r="4.5" fill="${c}" fill-opacity=".5"/>`;
    s += `<circle cx="65" cy="65" r="4.5" fill="${c}" fill-opacity=".5"/>`;
    return `<g>${P("M20 20h60v60H20z", `fill="none" stroke="${c}" stroke-opacity=".45" stroke-width="1.5"`)}${s}</g>`;
  },

  /* stacked thin films */
  layers: c => `
    <g>
      <rect x="14" y="56" width="72" height="16" fill="${c}" fill-opacity=".9"/>
      <rect x="14" y="40" width="72" height="12" fill="${c}" fill-opacity=".55"/>
      <rect x="14" y="28" width="72" height="8" fill="${c}" fill-opacity=".3"/>
      ${P("M14 76h72", `stroke="${c}" stroke-opacity=".35" stroke-width="2"`)}
    </g>`,

  /* one period of a wave */
  wave: c => `
    <g fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round">
      ${P("M8 50q10.5-30 21-0t21 0 21 0", `stroke-opacity=".95"`)}
      ${P("M8 50q10.5 30 21 0t21 0 21 0", `stroke-opacity=".25"`)}
    </g>`,

  /* two features and the distance between them */
  pitch: c => `
    <g>
      <rect x="22" y="26" width="13" height="48" fill="${c}" fill-opacity=".9"/>
      <rect x="65" y="26" width="13" height="48" fill="${c}" fill-opacity=".9"/>
      ${P("M28.5 84h43", `stroke="${c}" stroke-opacity=".6" stroke-width="2"`)}
      ${P("M28.5 80v8M71.5 80v8", `stroke="${c}" stroke-opacity=".6" stroke-width="2"`)}
    </g>`,

  /* a particle */
  dot: c => `<circle cx="50" cy="50" r="30" fill="${c}" fill-opacity=".85"/>`,

  /* a filled cylinder through a plate */
  via: c => `
    <g>
      <rect x="10" y="34" width="80" height="32" fill="${c}" fill-opacity=".2"/>
      ${P("M10 34h80M10 66h80", `stroke="${c}" stroke-opacity=".5" stroke-width="1.5"`)}
      <rect x="40" y="20" width="20" height="60" rx="3" fill="${c}" fill-opacity=".95"/>
    </g>`,

  strand: c => P("M50 4c-14 22 14 40 0 62s14 24 0 30",
    `fill="none" stroke="${c}" stroke-width="9" stroke-linecap="round" stroke-opacity=".85"`),

  /* stacked plates with vertical connections */
  stack: c => {
    let s = "";
    for (let i = 0; i < 8; i++)
      s += `<rect x="18" y="${20 + i * 7.4}" width="64" height="4.6" fill="${c}" fill-opacity="${.4 + i * .07}"/>`;
    s += `<rect x="14" y="80" width="72" height="9" fill="${c}" fill-opacity=".95"/>`;
    s += P("M32 20v60M50 20v60M68 20v60", `stroke="${c}" stroke-opacity=".3" stroke-width="1.6"`);
    return `<g>${s}</g>`;
  },

  rect: (c, detail) => {
    let s = `<rect x="14" y="24" width="72" height="52" rx="1.5" fill="${c}" fill-opacity=".82"/>`;
    if (detail === "grid") {
      s += P("M32 24v52M50 24v52M68 24v52M14 42h72M14 58h72",
        `stroke="var(--sub)" stroke-opacity=".45" stroke-width="1.2"`);
    }
    return `<g>${s}</g>`;
  },

  /* wafer: circle with the orientation notch */
  disc: (c, detail) => {
    const ghost = detail === "ghost";
    return `
      <g>
        <circle cx="50" cy="50" r="42" fill="${c}" fill-opacity="${ghost ? ".08" : ".78"}"
          stroke="${c}" stroke-opacity="${ghost ? ".8" : ".95"}" stroke-width="${ghost ? "2" : "1"}"
          ${ghost ? 'stroke-dasharray="6 5"' : ""}/>
        ${ghost ? "" : `<path d="M46 8.2a42 42 0 0 1 8 0L50 16z" fill="var(--sub)"/>`}
      </g>`;
  },

  /* accelerator module seen from above */
  board: c => `
    <g>
      <rect x="8" y="30" width="84" height="40" rx="2" fill="${c}" fill-opacity=".25"/>
      <rect x="34" y="38" width="32" height="24" fill="${c}" fill-opacity=".95"/>
      ${[14, 22, 70, 78].map(x => `<rect x="${x}" y="38" width="10" height="24" fill="${c}" fill-opacity=".6"/>`).join("")}
    </g>`,

  figure: c => `
    <g fill="${c}" fill-opacity=".85">
      <circle cx="50" cy="20" r="9"/>
      ${P("M50 31c-9 0-14 6-14 14v20h6v27h6V65h4v27h6V65h6V45c0-8-5-14-14-14z")}
    </g>`,

  /* rack: tall box with slots */
  rack: c => {
    let s = `<rect x="28" y="6" width="44" height="88" rx="2" fill="${c}" fill-opacity=".2" stroke="${c}" stroke-opacity=".7" stroke-width="1.5"/>`;
    for (let i = 0; i < 10; i++)
      s += `<rect x="33" y="${12 + i * 8}" width="34" height="5" fill="${c}" fill-opacity=".75"/>`;
    return `<g>${s}</g>`;
  },

  /* scanner: a machine with a column and a stage */
  machine: c => `
    <g>
      <rect x="10" y="34" width="80" height="46" rx="2" fill="${c}" fill-opacity=".22" stroke="${c}" stroke-opacity=".65" stroke-width="1.5"/>
      <rect x="24" y="12" width="26" height="26" rx="2" fill="${c}" fill-opacity=".8"/>
      <circle cx="70" cy="56" r="12" fill="none" stroke="${c}" stroke-opacity=".8" stroke-width="3"/>
      ${P("M37 38v14", `stroke="${c}" stroke-opacity=".7" stroke-width="3"`)}
      <rect x="22" y="80" width="56" height="6" fill="${c}" fill-opacity=".5"/>
    </g>`,

  /* floor plan */
  plan: (c, detail) => {
    let s = `<rect x="8" y="22" width="84" height="56" fill="${c}" fill-opacity=".14" stroke="${c}" stroke-opacity=".7" stroke-width="1.6"/>`;
    if (detail === "grid") {
      for (let i = 0; i < 6; i++)
        s += `<rect x="${14 + i * 13}" y="28" width="7" height="44" fill="${c}" fill-opacity=".55"/>`;
    } else {
      for (let i = 0; i < 3; i++)
        s += `<rect x="${18 + i * 24}" y="30" width="12" height="40" fill="${c}" fill-opacity=".6"/>`;
    }
    return `<g>${s}</g>`;
  },

  /* an irregular patch of ground */
  region: (c, detail) => detail === "island"
    ? P("M56 6c8 10 12 26 10 42s-8 30-16 40c-6 8-14 6-16-2s2-18 4-30 0-26 4-38 10-18 14-12z",
        `fill="${c}" fill-opacity=".7" stroke="${c}" stroke-opacity=".9" stroke-width="1.5"`)
    : P("M22 34c12-14 34-18 48-8s16 30 6 42-34 16-46 4-20-24-8-38z",
        `fill="${c}" fill-opacity=".55" stroke="${c}" stroke-opacity=".85" stroke-width="1.5" stroke-dasharray="5 4"`),

  globe: c => `
    <g fill="none" stroke="${c}" stroke-width="1.6" stroke-opacity=".8">
      <circle cx="50" cy="50" r="42" fill="${c}" fill-opacity=".14"/>
      <ellipse cx="50" cy="50" rx="18" ry="42"/>
      ${P("M8 50h84M14 30h72M14 70h72", `stroke-opacity=".5"`)}
    </g>`
};

export const drawGlyph = (kind, c, detail) =>
  (GLYPHS[kind] || GLYPHS.rect)(c, detail);
