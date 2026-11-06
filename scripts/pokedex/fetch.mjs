#!/usr/bin/env node
/**
 * Step 1 of the Pokédex import: downloads every National Pokédex species from PokéAPI
 * (https://pokeapi.co), with its default Pokémon record and evolution chain, into a local
 * cache (`.cache/pokeapi/`, ignored by Git). Responses are stored as data and never executed.
 * Re-running only fetches what the cache does not hold, so the import is reproducible and
 * nothing at runtime depends on the API.
 *
 *   node scripts/pokedex/fetch.mjs
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const API = 'https://pokeapi.co/api/v2';
const CACHE = '.cache/pokeapi';
const CONCURRENCY = 8;

for (const dir of ['species', 'pokemon', 'chain']) mkdirSync(join(CACHE, dir), { recursive: true });

async function getJson(url, attempt = 1) {
  try {
    const res = await fetch(url, { headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${String(res.status)}`);
    return await res.json();
  } catch (e) {
    if (attempt >= 4) throw new Error(`${url}: ${e.message}`, { cause: e });
    await new Promise((r) => setTimeout(r, 500 * attempt));
    return getJson(url, attempt + 1);
  }
}

async function cached(file, url) {
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'));
  const data = await getJson(url);
  writeFileSync(file, JSON.stringify(data));
  return data;
}

async function pool(items, fn) {
  let next = 0;
  const failures = [];
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < items.length) {
        const item = items[next++];
        try {
          await fn(item);
        } catch (e) {
          failures.push(String(e.message));
        }
      }
    }),
  );
  return failures;
}

const index = await getJson(`${API}/pokemon-species?limit=100000`);
writeFileSync(join(CACHE, 'index.json'), JSON.stringify({ retrievedAt: new Date().toISOString(), count: index.count }));
const ids = index.results.map((r) => Number(r.url.match(/\/(\d+)\/$/)[1]));
console.log(`PokéAPI reports ${String(index.count)} species`);

const chains = new Set();
let done = 0;
const failures = await pool(ids, async (id) => {
  const species = await cached(join(CACHE, 'species', `${String(id)}.json`), `${API}/pokemon-species/${String(id)}`);
  const def = species.varieties.find((v) => v.is_default)?.pokemon;
  if (!def) throw new Error(`species ${String(id)}: no default variety`);
  await cached(join(CACHE, 'pokemon', `${String(id)}.json`), def.url);
  if (species.evolution_chain?.url) chains.add(species.evolution_chain.url);
  if (++done % 100 === 0) console.log(`  ${String(done)} species`);
});
const chainFailures = await pool([...chains], async (url) => {
  const id = url.match(/\/(\d+)\/$/)[1];
  await cached(join(CACHE, 'chain', `${id}.json`), url);
});
const all = [...failures, ...chainFailures];
console.log(`done: ${String(ids.length)} species, ${String(chains.size)} evolution chains, ${String(all.length)} failures`);
if (all.length) {
  console.error(all.slice(0, 20).join('\n'));
  process.exit(1);
}
