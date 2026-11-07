#!/usr/bin/env node
/**
 * Places the approved loading video (created for Rare Encounter in Google Flow) in
 * public/media/ (gitignored), byte for byte: it is copied, never re-encoded or edited.
 *
 * Why not commit the file: it is 9.1 MB and the repository safety check (check-repo-safety)
 * keeps video media and files over 5 MB out of the public repo. Without the file the
 * loading screen shows its static cosmic fallback, so every build still works.
 *
 * Source: the path in RARE_ENCOUNTER_VIDEO, or the file as delivered by Or7 in Downloads.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import { join } from 'node:path';

const OUT_DIR = 'public/media';
const OUT = `${OUT_DIR}/encounter-loading.mp4`;
const SOURCE =
  process.env.RARE_ENCOUNTER_VIDEO ?? join(homedir(), 'Downloads', 'gemini_generated_video_0e15bf70.mp4');

if (!existsSync(SOURCE)) {
  console.warn(`Loading video not found at ${SOURCE}. Set RARE_ENCOUNTER_VIDEO to its path.`);
  console.warn('The loading screen will use its static fallback.');
  process.exit(0);
}

const sha = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');
if (existsSync(OUT) && sha(OUT) === sha(SOURCE)) {
  console.log(`${OUT} is already the approved video.`);
  process.exit(0);
}

mkdirSync(OUT_DIR, { recursive: true });
copyFileSync(SOURCE, OUT);
if (sha(OUT) !== sha(SOURCE)) throw new Error('Copied video differs from the source');
console.log(`Copied ${SOURCE} -> ${OUT} (${(statSync(OUT).size / 1048576).toFixed(1)} MB, unchanged).`);
