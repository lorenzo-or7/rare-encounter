#!/usr/bin/env node
/**
 * Derives the light-surface variant of the approved logotype. The original file is never
 * modified; the result is written next to it.
 *
 * On the night background "ENCOUNTER" reads as white letters (a white fill whose thin navy
 * outline disappears into the dark). On paper the white fill vanishes and only the outline
 * shows. The fix is a colour finish only: the ENCOUNTER lettering (its opaque body and the
 * antialiased edge within 2 px of it) takes one ink, the logo's own outline navy, and every
 * pixel keeps its exact alpha. Shape, antialiasing, spacing, the soft halo around the letters,
 * "RARE", the symbol and its gradient are untouched.
 *
 * The band is separable: the script finds fully transparent rows between the "RARE" block
 * and "ENCOUNTER", and stops unless they exist. It also fails unless:
 * - no pixel above the gap changed,
 * - alpha is identical everywhere.
 *
 *   node scripts/make-logo-onlight.mjs
 */
import { readPng, writePng } from './lib/png.mjs';

const SRC = 'design-references/approved/assets-01b/logo-rare-encounter-transparent.png';
const OUT = 'design-references/approved/assets-01b/logo-rare-encounter-transparent-onlight.png';

/** Where to look for the gap: between the RARE block and ENCOUNTER (measured). */
const SEARCH = { y0: 560, y1: 600 };
/** Body of a letter, and how far its antialiased edge reaches. */
const BODY_ALPHA = 128;
const EDGE_PX = 2;

const { w, h, px } = readPng(SRC);
const at = (x, y) => (y * w + x) * 4;
const rowEmpty = (y) => {
  for (let x = 0; x < w; x++) if (px[at(x, y) + 3] > 0) return false;
  return true;
};

// 1. The fully transparent gap. Without it the band is not separable and nothing is written.
let gapStart = -1;
let gapEnd = -1;
for (let y = SEARCH.y0; y <= SEARCH.y1; y++) {
  if (rowEmpty(y)) {
    if (gapStart === -1) gapStart = y;
    gapEnd = y;
  } else if (gapStart !== -1) break;
}
if (gapStart === -1 || gapEnd - gapStart + 1 < 3) {
  throw new Error('No fully transparent gap between RARE and ENCOUNTER: band not separable');
}
let bandEnd = h - 1;
while (bandEnd > gapEnd && rowEmpty(bandEnd)) bandEnd--;
const BAND = { y0: gapEnd + 1, y1: bandEnd };

// 2. Lettering mask: body pixels, grown by EDGE_PX to take in their antialiased edge.
const body = new Uint8Array(w * h);
for (let y = BAND.y0; y <= BAND.y1; y++) {
  for (let x = 0; x < w; x++) if (px[at(x, y) + 3] > BODY_ALPHA) body[y * w + x] = 1;
}
const lettering = (x, y) => {
  for (let dy = -EDGE_PX; dy <= EDGE_PX; dy++) {
    for (let dx = -EDGE_PX; dx <= EDGE_PX; dx++) {
      const xx = x + dx;
      const yy = y + dy;
      if (xx >= 0 && xx < w && yy >= BAND.y0 && yy <= BAND.y1 && body[yy * w + xx]) return true;
    }
  }
  return false;
};

// 3. Ink: the mean of the darkest opaque outline pixels already in the lettering.
let r = 0;
let g = 0;
let b = 0;
let n = 0;
for (let y = BAND.y0; y <= BAND.y1; y++) {
  for (let x = 0; x < w; x++) {
    const i = at(x, y);
    if (px[i + 3] < 230) continue;
    if (0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2] > 40) continue;
    r += px[i];
    g += px[i + 1];
    b += px[i + 2];
    n++;
  }
}
if (n === 0) throw new Error('No outline pixels found in the lettering');
const ink = [Math.round(r / n), Math.round(g / n), Math.round(b / n)];

// 4. Recolour the lettering only.
const out = Buffer.from(px);
let recoloured = 0;
let haloKept = 0;
for (let y = BAND.y0; y <= BAND.y1; y++) {
  for (let x = 0; x < w; x++) {
    const i = at(x, y);
    if (out[i + 3] === 0) continue;
    if (!lettering(x, y)) {
      haloKept++;
      continue;
    }
    out[i] = ink[0];
    out[i + 1] = ink[1];
    out[i + 2] = ink[2];
    recoloured++;
  }
}

// 5. Proofs.
let changedAbove = 0;
let alphaChanged = 0;
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const i = at(x, y);
    if (out[i + 3] !== px[i + 3]) alphaChanged++;
    if (y < BAND.y0 && (out[i] !== px[i] || out[i + 1] !== px[i + 1] || out[i + 2] !== px[i + 2])) {
      changedAbove++;
    }
  }
}
if (changedAbove !== 0 || alphaChanged !== 0) {
  throw new Error(
    `Proof failed: ${String(changedAbove)} px changed above the gap, ${String(alphaChanged)} alpha changed`,
  );
}

writePng(OUT, { w, h, px: out });
const hex = `#${ink.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
console.log(`gap: fully transparent rows ${String(gapStart)}-${String(gapEnd)}`);
console.log(`ENCOUNTER band: rows ${String(BAND.y0)}-${String(BAND.y1)}`);
console.log(`ink ${hex} (mean of ${String(n)} outline px already in the logo)`);
console.log(`lettering recoloured: ${String(recoloured)} px; soft halo kept as is: ${String(haloKept)} px`);
console.log('changed above the gap (RARE, symbol, gradient): 0 px; alpha changed anywhere: 0 px');
console.log(`wrote ${OUT}`);
