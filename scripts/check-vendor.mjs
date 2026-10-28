#!/usr/bin/env node
/**
 * Verifies vendored React Bits files are byte-for-byte the originals recorded in
 * src/vendor/react-bits/manifest.json. Any edit to a vendored file fails the check.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const DIR = 'src/vendor/react-bits';
const { sha256 } = JSON.parse(readFileSync(`${DIR}/manifest.json`, 'utf8'));
const failures = [];

for (const [file, expected] of Object.entries(sha256)) {
  let actual;
  try {
    actual = createHash('sha256').update(readFileSync(`${DIR}/${file}`)).digest('hex');
  } catch {
    failures.push(`${file}: missing`);
    continue;
  }
  if (actual !== expected) failures.push(`${file}: modified (sha256 mismatch)`);
}

if (failures.length > 0) {
  console.error(`Vendor integrity check failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log(`Vendor integrity check passed: ${Object.keys(sha256).length} original files unchanged.`);
