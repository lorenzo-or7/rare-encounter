#!/usr/bin/env node
/**
 * Removes the residue of the erased "02" from the Instinctive art-only card.
 *
 * Only a tight box around the residue is touched (it excludes the art's vertical guide
 * lines above and below). Each pixel in the box is rebuilt by Coons-patch interpolation
 * of the box's own border (RGBA, including alpha), which reproduces the smooth night
 * background there. The script then proves that every pixel outside the box is
 * unchanged and that no residue remains inside it.
 *
 *   node scripts/fix-card-02.mjs
 */
import { readPng, writePng } from './lib/png.mjs';

const DIR = 'design-references/approved/assets-01b';
const SRC = `${DIR}/card-02-instinctive-art-only.png`;
const OUT = `${DIR}/card-02-instinctive-art-only-v2.png`;
const BOX = { x0: 478, x1: 552, y0: 152, y1: 171 }; // inclusive border rows/cols are kept

const img = readPng(SRC);
const { w, px } = img;
const out = Buffer.from(px);
const at = (x, y, c) => px[(y * w + x) * 4 + c];

const { x0, x1, y0, y1 } = BOX;
for (let y = y0 + 1; y < y1; y++) {
  const v = (y - y0) / (y1 - y0);
  for (let x = x0 + 1; x < x1; x++) {
    const u = (x - x0) / (x1 - x0);
    for (let c = 0; c < 4; c++) {
      const ruled =
        (1 - v) * at(x, y0, c) + v * at(x, y1, c) + (1 - u) * at(x0, y, c) + u * at(x1, y, c);
      const corners =
        (1 - u) * (1 - v) * at(x0, y0, c) + u * (1 - v) * at(x1, y0, c) +
        (1 - u) * v * at(x0, y1, c) + u * v * at(x1, y1, c);
      out[(y * w + x) * 4 + c] = Math.max(0, Math.min(255, Math.round(ruled - corners)));
    }
  }
}

// Proof 1: nothing outside the box changed.
let outside = 0;
for (let y = 0; y < img.h; y++)
  for (let x = 0; x < w; x++) {
    if (x > x0 && x < x1 && y > y0 && y < y1) continue;
    const o = (y * w + x) * 4;
    if (px[o] !== out[o] || px[o + 1] !== out[o + 1] || px[o + 2] !== out[o + 2] || px[o + 3] !== out[o + 3]) outside++;
  }

// Proof 2: no pixel in the number band stands out from the background any more.
const lum = (buf, x, y) => {
  const o = (y * w + x) * 4;
  return 0.2126 * buf[o] + 0.7152 * buf[o + 1] + 0.0722 * buf[o + 2];
};
const residue = (buf) => {
  let n = 0;
  for (let y = 145; y < 230; y++) for (let x = 440; x < 600; x++) {
    if (x >= 512 && x <= 518) continue; // the art's own vertical guide line
    if (lum(buf, x, y) > 11.7 + 5) n++;
  }
  return n;
};

writePng(OUT, { ...img, px: out });
console.log(
  JSON.stringify({ out: OUT, box: BOX, changedOutsideBox: outside, residueBefore: residue(px), residueAfter: residue(out) }),
);
if (outside !== 0 || residue(out) !== 0) process.exit(1);
