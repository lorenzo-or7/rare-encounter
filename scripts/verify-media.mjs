#!/usr/bin/env node
/**
 * Verifies the loading video against scripts/media-manifest.json: file name, exact size,
 * SHA-256 and an MP4 signature. Exits 1 with a clear message on any mismatch, so a deploy
 * never goes out with a missing, truncated or different video.
 *
 *   node scripts/verify-media.mjs                 checks the manifest target (public/media/…)
 *   node scripts/verify-media.mjs --file <path>   checks another copy (e.g. dist/media/…)
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { basename } from 'node:path';

const manifest = JSON.parse(readFileSync(new URL('./media-manifest.json', import.meta.url), 'utf8'));
const at = process.argv.indexOf('--file');
const file = at > 0 ? process.argv[at + 1] : manifest.target;

const fail = (message) => {
  console.error(`Loading video check failed: ${message}`);
  console.error(`Expected ${manifest.asset} from release ${manifest.release} (${manifest.bytes} bytes, sha256 ${manifest.sha256}).`);
  process.exit(1);
};

if (!file || !existsSync(file)) fail(`${file ?? '(no path)'} does not exist.`);
if (basename(file) !== manifest.asset) fail(`file name is ${basename(file)}, expected ${manifest.asset}.`);
const size = statSync(file).size;
if (size !== manifest.bytes) fail(`${file} is ${size} bytes, expected ${manifest.bytes}.`);
const data = readFileSync(file);
if (data.toString('latin1', 4, 8) !== 'ftyp') fail(`${file} is not an MP4 file (no ftyp box).`);
const sha = createHash('sha256').update(data).digest('hex');
if (sha !== manifest.sha256) fail(`${file} has sha256 ${sha}.`);
console.log(`Loading video verified: ${file} (${size} bytes, sha256 ${sha.slice(0, 12)}…, release ${manifest.release}).`);
