#!/usr/bin/env node
/**
 * Snapshots verifiable canonical data for the editorial pilot candidates from PokéAPI
 * (https://pokeapi.co, a public mirror of the games' data). Only structured game data is
 * kept: National Pokédex number, generation, types, colour, shape, habitat, legendary and
 * mythical flags, the genus label, varieties and cosmetic forms. No Pokédex flavour text,
 * images or descriptions are stored, and nothing about personality is derived here.
 *
 * Every record keeps the URLs it came from and the retrieval time, so it can be re-checked.
 * Input and output are plain JSON; responses are parsed as data, never executed.
 *
 *   node scripts/fetch-pilot-canonical.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';

const IN = 'src/matching/data/pilot-candidates.v1.json';
const OUT = 'src/matching/data/pilot-canonical.v1.json';
const API = 'https://pokeapi.co/api/v2';

const candidates = JSON.parse(readFileSync(IN, 'utf8')).candidates;

async function get(url) {
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`${url}: HTTP ${String(res.status)}`);
  return res.json();
}

const en = (list, key) => list.find((x) => x.language?.name === 'en')?.[key] ?? null;

const records = [];
for (const c of candidates) {
  const slug = c.name.toLowerCase();
  const speciesUrl = `${API}/pokemon-species/${slug}`;
  const species = await get(speciesUrl);
  const defaultVariety = species.varieties.find((v) => v.is_default)?.pokemon;
  if (!defaultVariety) throw new Error(`${slug}: no default variety`);
  const pokemon = await get(defaultVariety.url);

  records.push({
    name: c.name,
    slug: species.name,
    nationalDex: species.id,
    generation: species.generation.name,
    genus: en(species.genera, 'genus'),
    types: pokemon.types.sort((a, b) => a.slot - b.slot).map((t) => t.type.name),
    color: species.color?.name ?? null,
    shape: species.shape?.name ?? null,
    habitat: species.habitat?.name ?? null,
    legendary: species.is_legendary,
    mythical: species.is_mythical,
    varieties: species.varieties.map((v) => ({ name: v.pokemon.name, isDefault: v.is_default })),
    defaultForms: pokemon.forms.map((f) => f.name),
    formsSwitchable: species.forms_switchable,
    sources: [
      { url: speciesUrl, fields: ['nationalDex', 'generation', 'genus', 'color', 'shape', 'habitat', 'legendary', 'mythical', 'varieties', 'formsSwitchable'] },
      { url: defaultVariety.url, fields: ['types', 'defaultForms'] },
    ],
  });
  process.stdout.write('.');
}

const snapshot = {
  version: 'pilot-canonical-v1',
  source: { name: 'PokéAPI', url: 'https://pokeapi.co', retrievedAt: new Date().toISOString() },
  scope:
    'Structured game data only. No flavour text, artwork or personality claims. Habitat exists only for species introduced up to Generation III.',
  records,
};
writeFileSync(OUT, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`\nwrote ${OUT}: ${String(records.length)} records`);
