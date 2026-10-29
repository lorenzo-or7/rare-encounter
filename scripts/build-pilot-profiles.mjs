#!/usr/bin/env node
/**
 * Builds the editorial pilot dataset (ME-02) from the PokéAPI snapshot. Each candidate gets a
 * Draft profile holding only verified canonical facts with their sources, plus its official
 * forms as context. It writes no editorial interpretation, visual reading or trait mapping:
 * those need a human reviewer and sources this environment does not have. Nothing here is
 * marked as reviewed or approved.
 *
 *   node scripts/build-pilot-profiles.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';

const SNAPSHOT = 'src/matching/data/pilot-canonical.v1.json';
const OUT = 'src/matching/data/pilot-profiles.v1.json';

const snap = JSON.parse(readFileSync(SNAPSHOT, 'utf8'));
const retrievedAt = snap.source.retrievedAt;
const ROMAN = { i: 'I', ii: 'II', iii: 'III', iv: 'IV', v: 'V', vi: 'VI', vii: 'VII', viii: 'VIII', ix: 'IX' };
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** Classifies a variety by its PokéAPI name suffix; the kind is metadata, not evidence. */
function formKind(name) {
  if (/-mega(-[xyz])?$/.test(name)) return 'mega';
  if (/-gmax$/.test(name)) return 'gigantamax';
  if (/-(alola|galar|hisui|paldea)(-|$)/.test(name)) return 'regional';
  return 'other';
}

const sources = [];
const profiles = snap.records.map((r) => {
  const speciesSrc = `pokeapi:pokemon-species/${r.slug}`;
  const pokemonSrc = `pokeapi:pokemon/${r.varieties.find((v) => v.isDefault).name}`;
  sources.push(
    { id: speciesSrc, kind: 'game-data', title: `PokéAPI species record: ${r.slug}`, url: r.sources[0].url, retrievedAt },
    { id: pokemonSrc, kind: 'game-data', title: `PokéAPI default form record: ${r.slug}`, url: r.sources[1].url, retrievedAt },
  );
  const fact = (id, statement, src) => ({
    id: `${r.slug}.${id}`,
    kind: 'canonical-fact',
    statement,
    sourceIds: [src],
    scope: 'species',
    basedOn: [],
  });
  const gen = ROMAN[r.generation.replace('generation-', '')] ?? r.generation;
  const evidence = [
    fact('dex', `National Pokédex number ${String(r.nationalDex)}.`, speciesSrc),
    fact('generation', `Introduced in Generation ${gen}.`, speciesSrc),
    fact('types', `Type of the default form: ${r.types.map(cap).join(' / ')}.`, pokemonSrc),
  ];
  if (r.genus) evidence.push(fact('genus', `Genus: ${r.genus}.`, speciesSrc));
  if (r.color) evidence.push(fact('color', `Pokédex colour category: ${r.color}.`, speciesSrc));
  if (r.shape) evidence.push(fact('shape', `Pokédex body shape category: ${r.shape}.`, speciesSrc));
  if (r.habitat) evidence.push(fact('habitat', `Pokédex habitat category: ${r.habitat}.`, speciesSrc));
  if (r.legendary) evidence.push(fact('legendary', 'Classified as a Legendary Pokémon.', speciesSrc));
  if (r.mythical) evidence.push(fact('mythical', 'Classified as a Mythical Pokémon.', speciesSrc));

  const forms = [
    ...r.varieties.filter((v) => !v.isDefault).map((v) => ({ formId: v.name, kind: formKind(v.name), evidenceIds: [] })),
    ...(r.defaultForms.length > 1
      ? r.defaultForms.slice(1).map((f) => ({ formId: f, kind: 'cosmetic', evidenceIds: [] }))
      : []),
  ];

  return {
    speciesId: r.slug,
    nationalDex: r.nationalDex,
    profileVersion: 'profile-0.1-draft',
    editorialState: 'draft',
    evidence,
    traitMappings: [],
    evidenceBoundaries: [
      'Game classification data (type, colour, shape, habitat, genus) describes the species, not a temperament: no personality trait may be inferred from it.',
      'No editorial reading has been sourced or reviewed yet; nothing about behaviour, values or personality may be stated for this species.',
    ],
    forms,
    review: null,
  };
});

const dataset = {
  version: 'pilot-profiles-0.1-draft',
  registryVersion: 'registry-0',
  note: 'Editorial pilot, Draft. Canonical facts only (PokéAPI snapshot); no interpretations, visual readings or trait mappings; no profile is reviewed or approved.',
  sources,
  profiles,
};
writeFileSync(OUT, `${JSON.stringify(dataset, null, 2)}\n`);
console.log(`wrote ${OUT}: ${String(profiles.length)} draft profiles, ${String(sources.length)} sources`);
