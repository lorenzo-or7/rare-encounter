#!/usr/bin/env node
/**
 * Fetches the official Clash Display kit from Fontshare and places the unmodified
 * variable WOFF2 in public/fonts/ (gitignored).
 *
 * Why not commit the file: the ITF Free Font License v2.0 allows self-hosting on our own
 * site but forbids making the Font Software available through a repository or publicly
 * accessible server (section 02). Each developer obtains their own copy from Fontshare.
 */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';

const KIT_URL = 'https://api.fontshare.com/v2/fonts/download/clash-display';
const WANTED = {
  'ClashDisplay_Complete/Fonts/WEB/fonts/ClashDisplay-Variable.woff2': 'ClashDisplay-Variable.woff2',
  'ClashDisplay_Complete/License/FFL.txt': 'ClashDisplay-FFL.txt',
};
const OUT_DIR = 'public/fonts';

if (existsSync(`${OUT_DIR}/ClashDisplay-Variable.woff2`) && !process.argv.includes('--force')) {
  console.log('Clash Display already present in public/fonts (use --force to refetch).');
  process.exit(0);
}

const res = await fetch(KIT_URL);
if (!res.ok) throw new Error(`Fontshare download failed: HTTP ${res.status}`);
const zip = Buffer.from(await res.arrayBuffer());

/** Minimal ZIP reader: central directory -> local header -> stored/deflated data. */
function extract(buf, wanted) {
  const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocd < 0) throw new Error('Not a ZIP archive');
  const count = buf.readUInt16LE(eocd + 10);
  let ptr = buf.readUInt32LE(eocd + 16);
  const found = new Map();
  for (let i = 0; i < count; i++) {
    const method = buf.readUInt16LE(ptr + 10);
    const size = buf.readUInt32LE(ptr + 20);
    const nameLen = buf.readUInt16LE(ptr + 28);
    const extraLen = buf.readUInt16LE(ptr + 30);
    const commentLen = buf.readUInt16LE(ptr + 32);
    const local = buf.readUInt32LE(ptr + 42);
    const name = buf.toString('utf8', ptr + 46, ptr + 46 + nameLen);
    if (name in wanted) {
      const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
      const raw = buf.subarray(start, start + size);
      found.set(name, method === 0 ? raw : inflateRawSync(raw));
    }
    ptr += 46 + nameLen + extraLen + commentLen;
  }
  return found;
}

const files = extract(zip, WANTED);
mkdirSync(OUT_DIR, { recursive: true });
for (const [source, target] of Object.entries(WANTED)) {
  const data = files.get(source);
  if (!data) throw new Error(`Missing ${source} in the official kit`);
  writeFileSync(`${OUT_DIR}/${target}`, data);
  console.log(`✓ ${OUT_DIR}/${target} (${data.length} bytes)`);
}
console.log('Clash Display installed locally. Do not commit these files (ITF FFL v2.0 §02).');
