#!/usr/bin/env node
/**
 * Public-repo safety check. Scans files Git would publish (tracked + untracked, not ignored)
 * for secrets, env files, rejected video media and oversized files. Exits 1 on any finding.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';

const MAX_BYTES = 5 * 1024 * 1024;
const VIDEO_EXT = /\.(mp4|webm|mov|m4v|avi|mkv)$/i;
const ENV_FILE = /(^|\/)\.env(\.(?!example$)[^/]+)?$/;
const TEXT_EXT = /\.(ts|tsx|js|mjs|cjs|json|md|html|css|txt|ya?ml|toml|env|example)$/i;
const SECRET_PATTERNS = [
  ['private key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['AWS access key', /\bAKIA[0-9A-Z]{16}\b/],
  ['GitHub token', /\bgh[pousr]_[A-Za-z0-9]{36,}\b/],
  ['API secret key', /\bsk-[A-Za-z0-9_-]{20,}\b/],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['assigned secret', /\b(api[_-]?key|secret|password|token)\s*[:=]\s*['"][^'"\s]{12,}['"]/i],
];

const git = (...args) =>
  execFileSync('git', args, { encoding: 'utf8' }).split('\n').filter(Boolean);

const files = [
  ...new Set([...git('ls-files'), ...git('ls-files', '--others', '--exclude-standard')]),
];
const findings = [];

for (const file of files) {
  let size;
  try {
    size = statSync(file).size;
  } catch {
    continue; // deleted in working tree
  }
  if (ENV_FILE.test(file)) findings.push(`${file}: environment file must not be published`);
  if (VIDEO_EXT.test(file)) findings.push(`${file}: video media is not approved for this repo`);
  if (size > MAX_BYTES) findings.push(`${file}: ${(size / 1048576).toFixed(1)} MB exceeds 5 MB`);
  if (!TEXT_EXT.test(file) || file === 'scripts/check-repo-safety.mjs') continue;

  const text = readFileSync(file, 'utf8');
  for (const [label, pattern] of SECRET_PATTERNS) {
    if (pattern.test(text)) findings.push(`${file}: possible ${label}`);
  }
}

if (findings.length > 0) {
  console.error(`Repo safety check failed (${findings.length}):\n- ${findings.join('\n- ')}`);
  process.exit(1);
}
console.log(`Repo safety check passed: ${files.length} files scanned.`);
