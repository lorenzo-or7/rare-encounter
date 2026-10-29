#!/usr/bin/env node
/**
 * Builds optimized runtime images from the approved originals in
 * design-references/approved/assets-01b/ (originals are never modified).
 *
 * Uses the Chromium that Playwright already installs (canvas resampling in halving steps,
 * WebP/PNG export), so no image library is added to the project.
 *
 *   node scripts/build-assets.mjs              (every asset)
 *   node scripts/build-assets.mjs logo-onlight (only outputs whose path contains the word)
 */
/* global OffscreenCanvas, Image -- used inside page.evaluate, which runs in Chromium */
import { chromium } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const SRC = 'design-references/approved/assets-01b';
const BG = '#0b0816';

/** Card 02 uses the residue-free v2 (scripts/fix-card-02.mjs); the supplied file is kept. */
const CARD_SOURCES = {
  '01-ethereal': 'card-01-ethereal-art-only.png',
  '02-instinctive': 'card-02-instinctive-art-only-v2.png',
  '03-radiant': 'card-03-radiant-art-only.png',
};

/**
 * Transparent margin trimmed from the brand files (measured alpha bounds plus ~10px).
 * Trimming changes no pixel of the mark; it only lets the mark fill its box.
 */
const LOGO_CROP = { x: 85, y: 132, w: 1831, h: 591 };
const SYMBOL_CROP = { x: 100, y: 383, w: 1061, h: 492 };

/**
 * Each job: source, output, target height (width follows the crop's ratio) or a square
 * icon size, format and quality. Icons fit the trimmed symbol inside a padded square.
 */
const JOBS = [
  // Archetype cards (2:3 kept): 1x/2x for a 320px card, 3x for dense phones.
  ...Object.entries(CARD_SOURCES).flatMap(([n, src]) =>
    [480, 640, 960].map((w) => ({ src, out: `src/assets/cards/card-${n}-${w}.webp`, width: w, height: w * 1.5, format: 'webp', quality: 0.86 })),
  ),
  // Logotype for the expanded desktop nav (44px tall): 2x and 3x.
  { src: 'logo-rare-encounter-transparent.png', crop: LOGO_CROP, out: 'src/assets/brand/logo-88.webp', height: 88, format: 'webp', quality: 0.92 },
  { src: 'logo-rare-encounter-transparent.png', crop: LOGO_CROP, out: 'src/assets/brand/logo-132.webp', height: 132, format: 'webp', quality: 0.92 },
  // Light-surface variant (scripts/make-logo-onlight.mjs): same crop and sizes as the original.
  { src: 'logo-rare-encounter-transparent-onlight.png', crop: LOGO_CROP, out: 'src/assets/brand/logo-onlight-88.webp', height: 88, format: 'webp', quality: 0.92 },
  { src: 'logo-rare-encounter-transparent-onlight.png', crop: LOGO_CROP, out: 'src/assets/brand/logo-onlight-132.webp', height: 132, format: 'webp', quality: 0.92 },
  // Compact symbol for the condensed nav and phones (up to 36px tall): 2x and 3x.
  { src: 'logo-symbol-transparent.png', crop: SYMBOL_CROP, out: 'src/assets/brand/symbol-72.webp', height: 72, format: 'webp', quality: 0.92 },
  { src: 'logo-symbol-transparent.png', crop: SYMBOL_CROP, out: 'src/assets/brand/symbol-108.webp', height: 108, format: 'webp', quality: 0.92 },
  // Browser and app identity: the trimmed symbol centered in a square.
  ...[32, 192, 512].map((s) => ({ src: 'logo-symbol-transparent.png', crop: SYMBOL_CROP, out: `public/favicon-${s}.png`, icon: s, pad: 0.04, format: 'png', quality: 1 })),
  // iOS fills transparency with black, so the touch icon carries the night background.
  { src: 'logo-symbol-transparent.png', crop: SYMBOL_CROP, out: 'public/apple-touch-icon.png', icon: 180, pad: 0.14, background: BG, format: 'png', quality: 1 },
];

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<body></body>');

const only = process.argv[2];
for (const job of only ? JOBS.filter((j) => j.out.includes(only)) : JOBS) {
  const dataUrl = `data:image/png;base64,${readFileSync(`${SRC}/${job.src}`).toString('base64')}`;
  const result = await page.evaluate(
    async ({ dataUrl, job }) => {
      const img = new Image();
      img.src = dataUrl;
      await img.decode();
      const crop = job.crop ?? { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight };

      // Box the mark is drawn into, and the final canvas size.
      let drawW, drawH, canvasW, canvasH;
      if (job.icon) {
        canvasW = canvasH = job.icon;
        const avail = job.icon * (1 - job.pad * 2);
        const scale = Math.min(avail / crop.w, avail / crop.h);
        drawW = Math.round(crop.w * scale);
        drawH = Math.round(crop.h * scale);
      } else {
        drawH = canvasH = job.height;
        drawW = canvasW = job.width ?? Math.round((crop.w * job.height) / crop.h);
      }

      // Crop, then halve until close to the target before the final resample (no aliasing).
      let w = crop.w;
      let h = crop.h;
      let source = new OffscreenCanvas(w, h);
      source.getContext('2d').drawImage(img, crop.x, crop.y, w, h, 0, 0, w, h);
      while (w / 2 >= drawW && h / 2 >= drawH) {
        w = Math.round(w / 2);
        h = Math.round(h / 2);
        const step = new OffscreenCanvas(w, h);
        const ctx = step.getContext('2d');
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(source, 0, 0, w, h);
        source = step;
      }

      const canvas = new OffscreenCanvas(canvasW, canvasH);
      const ctx = canvas.getContext('2d');
      if (job.background) {
        ctx.fillStyle = job.background;
        ctx.fillRect(0, 0, canvasW, canvasH);
      }
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(source, Math.round((canvasW - drawW) / 2), Math.round((canvasH - drawH) / 2), drawW, drawH);
      const blob = await canvas.convertToBlob({ type: `image/${job.format}`, quality: job.quality });
      return { bytes: Array.from(new Uint8Array(await blob.arrayBuffer())), w: canvasW, h: canvasH };
    },
    { dataUrl, job },
  );
  mkdirSync(job.out.slice(0, job.out.lastIndexOf('/')), { recursive: true });
  writeFileSync(job.out, Buffer.from(result.bytes));
  console.log(`${job.out}  ${result.w}x${result.h}  ${(result.bytes.length / 1024).toFixed(1)} kB`);
}

await browser.close();
