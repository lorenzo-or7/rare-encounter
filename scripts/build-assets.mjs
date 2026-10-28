#!/usr/bin/env node
/**
 * Builds optimized runtime images from the approved originals in
 * design-references/approved/assets-01b/ (originals are never modified).
 *
 * Uses the Chromium that Playwright already installs (canvas resampling in halving steps,
 * WebP/PNG export), so no image library is added to the project.
 *
 *   node scripts/build-assets.mjs
 */
/* global OffscreenCanvas, Image -- used inside page.evaluate, which runs in Chromium */
import { chromium } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const SRC = 'design-references/approved/assets-01b';
const BG = '#0b0816';

/** [source, output, width, height, format, quality, background] */
const JOBS = [
  // Archetype cards (2:3 kept): 1x/2x for a 320px card, 3x for dense phones.
  ...['01-ethereal', '02-instinctive', '03-radiant'].flatMap((n) =>
    [480, 640, 960].map((w) => [`card-${n}-art-only.png`, `src/assets/cards/card-${n}-${w}.webp`, w, w * 1.5, 'webp', 0.86, null]),
  ),
  // Logotype for the nav (rendered at 32-40px tall): 2x and 3x of 40px.
  ['logo-rare-encounter-transparent.png', 'src/assets/brand/logo-80.webp', null, 80, 'webp', 0.92, null],
  ['logo-rare-encounter-transparent.png', 'src/assets/brand/logo-120.webp', null, 120, 'webp', 0.92, null],
  // Compact symbol for small UI (2x/3x of 32px).
  ['logo-symbol-transparent.png', 'src/assets/brand/symbol-64.webp', 64, 64, 'webp', 0.92, null],
  ['logo-symbol-transparent.png', 'src/assets/brand/symbol-96.webp', 96, 96, 'webp', 0.92, null],
  // Browser and app identity.
  ['logo-symbol-transparent.png', 'public/favicon-32.png', 32, 32, 'png', 1, null],
  ['logo-symbol-transparent.png', 'public/favicon-192.png', 192, 192, 'png', 1, null],
  ['logo-symbol-transparent.png', 'public/favicon-512.png', 512, 512, 'png', 1, null],
  // iOS fills transparency with black, so the touch icon carries the night background.
  ['logo-symbol-transparent.png', 'public/apple-touch-icon.png', 180, 180, 'png', 1, BG],
];

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<body></body>');

for (const [src, out, width, height, format, quality, background] of JOBS) {
  const dataUrl = `data:image/png;base64,${readFileSync(`${SRC}/${src}`).toString('base64')}`;
  const result = await page.evaluate(
    async ({ dataUrl, width, height, format, quality, background }) => {
      const img = new Image();
      img.src = dataUrl;
      await img.decode();
      const targetH = height ?? Math.round((img.naturalHeight * width) / img.naturalWidth);
      const targetW = width ?? Math.round((img.naturalWidth * height) / img.naturalHeight);

      // Halve until close to the target, then do the final resample: avoids aliasing.
      let source = img;
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      while (w / 2 >= targetW && h / 2 >= targetH) {
        w = Math.round(w / 2);
        h = Math.round(h / 2);
        const step = new OffscreenCanvas(w, h);
        const ctx = step.getContext('2d');
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(source, 0, 0, w, h);
        source = step;
      }
      const canvas = new OffscreenCanvas(targetW, targetH);
      const ctx = canvas.getContext('2d');
      if (background) {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, targetW, targetH);
      }
      ctx.imageSmoothingQuality = 'high';
      // Square icons get breathing room so the mark is not cropped by OS masks.
      const inset = background ? Math.round(targetW * 0.12) : 0;
      ctx.drawImage(source, inset, inset, targetW - inset * 2, targetH - inset * 2);
      const blob = await canvas.convertToBlob({ type: `image/${format}`, quality });
      const bytes = new Uint8Array(await blob.arrayBuffer());
      return { bytes: Array.from(bytes), w: targetW, h: targetH };
    },
    { dataUrl, width, height, format, quality, background },
  );
  mkdirSync(out.slice(0, out.lastIndexOf('/')), { recursive: true });
  writeFileSync(out, Buffer.from(result.bytes));
  console.log(`${out}  ${result.w}x${result.h}  ${(result.bytes.length / 1024).toFixed(1)} kB`);
}

await browser.close();
