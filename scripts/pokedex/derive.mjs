#!/usr/bin/env node
/**
 * Step 2 of the Pokédex import: turns the cached PokéAPI responses into the versioned local
 * catalog the app reads (`src/content/pokedex/pokedex.v1.json`). Nothing here calls the
 * network, so the same cache always produces the same catalog.
 *
 * Species First, Forms Aware: one record per National Pokédex species; varieties and
 * cosmetic forms are listed on it and never become records of their own.
 *
 * Trait mappings are AUTOMATIC CANDIDATES, never "reviewed": each one names the evidence it
 * came from, so a reviewer can check it.
 * - pokedex-text: keywords in the species' English Pokédex entries. Strength follows the
 *   SHARE of entries that mention it, not the count, so species with many games of entries
 *   are not favoured. The entries themselves are not stored (rights); only the keywords.
 * - habitat: the games' habitat category (exists for Generations I–III only).
 * - game-stats: the Speed base stat, for swift / unhurried only.
 * - appearance: the Pokédex colour and body-shape categories, for aesthetics only:
 *   appearance never feeds personality, values or instinct.
 * - type: a weak signal for environment and aesthetics only, never enough on its own for
 *   a well-supported mapping.
 * Unknown stays unknown: a trait without evidence is simply absent from the profile.
 *
 *   node scripts/pokedex/derive.mjs
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const CACHE = '.cache/pokeapi';
const OUT_DIR = 'src/content/pokedex';
const VERSION = 'pokedex-1.0';
/** Per-dimension and total caps keep heavily documented species from dominating. */
const PER_DIMENSION = 2;
const MAX_TRAITS = 10;
const MIN_INTENSITY = 0.3;

const read = (...p) => JSON.parse(readFileSync(join(CACHE, ...p), 'utf8'));
const index = read('index.json');

// ---- Rules --------------------------------------------------------------------------------
/** Keyword rules on Pokédex entries. Each regex runs on lowercased English text. */
const TEXT = {
  'personality.curious': /\b(curious|curiosity|inquisitive|investigat\w*|explor(e|es|ing)|interested in|inspects?|nosy|peeks? (at|into))\b/,
  'personality.serene': /\b(calm|calmly|gentle|docile|placid|peaceful|tranquil|serene|easygoing|composed|mild|relaxed|laid-back|unflappable)\b/,
  'personality.playful': /\b(plays?|playful|playing|mischie\w*|pranks?|prankster|teas(e|es|ing)|frolics?|dances?|dancing|games?|jokes?|tricks? (people|others|its foes))\b/,
  'personality.daring': /\b(brave|bold|boldly|fearless(ly)?|courage(ous)?|daring|reckless|challeng\w*|undaunted|unafraid|head-on|never backs? down)\b/,
  'personality.reserved': /\b(shy|timid|cautious|reclusive|solitary|loners?|alone|secluded|seldom seen|rarely seen|keeps? to itself|avoids? (people|contact)|quiet)\b/,
  'personality.warm': /\b(affection(ate|ately)?|kind(?! of)|kind-?hearted|kindness|caring|cares for|friendly|cuddl\w*|hugs?|loving|compassion\w*|comforts?|nurtur\w*|tender(ly)?|motherly)\b/,
  'aesthetics.luminous': /\b(glow(s|ing)?|shin(e|es|ing)|shiny|sparkl\w*|radian\w*|luminous|lights? up|bright(ly)?|gleam\w*|glitter\w*|dazzl\w*)\b/,
  'aesthetics.shadowed': /\b(dark(ness)?|shadows?|gloom\w*|eerie|pitch-black)\b/,
  // Not "leaves" (also the verb) or "stones" (evolution stones): too many false readings.
  'aesthetics.organic': /\b(leaf|leafy|petals?|flowers?|blooms?|blossoms?|buds?|seeds?|vines?|bark|moss|fruits?|pollen|sprouts?)\b/,
  'aesthetics.mineral': /\b(crystals?|gems?|jewels?|diamonds?|rocky|stony|boulders?|metal(lic)?|steel|iron|glass|magnets?|ore)\b/,
  'aesthetics.soft': /\b(fluff(y)?|fur|soft|downy|plush|feathers?|wool|cotton|squish\w*|bouncy|fleece|round)\b/,
  'aesthetics.sleek': /\b(blades?|sharp|scythes?|sleek|claws?|spikes?|horns?|fins?|streamlined|edges?)\b/,
  'values.loyalty': /\b(loyal(ty)?|faithful|devot(ed|ion)|obeys?|its trainer|bonds? with)\b/,
  'values.freedom': /\b(roams?|roaming|wanders?|wandering|migrat\w*|freely|freedom|travels?|traveling|journeys?)\b/,
  'values.harmony': /\b(peace|harmony|balance|sooth\w*|heals?|healing|cooperat\w*|coexist\w*)\b/,
  // Not "master" (usually "its master", a bond, not growth).
  'values.growth': /\b(trains?|training|stronger|rivals?|toughen\w*|hones?|discipline)\b/,
  'values.protection': /\b(protect\w*|guards?|guarding|defends?|defending|shields?|its young|its eggs|its offspring)\b/,
  'values.wisdom': /\b(intelligen(t|ce)|wise|wisdom|knowledge|clever|smart|memor(y|ies|ize)|understands?)\b/,
  // Not "fields" (magnetic, electric) or "waves" (radio, psychic, sound).
  'environments.woodland': /\b(forests?|woods|woodlands?|trees?|meadows?|grasslands?|jungles?|prairies?)\b/,
  'environments.waters': /\b(seas?|oceans?|rivers?|lakes?|ponds?|swims?|swimming|shores?|beach(es)?|marsh\w*|swamps?|seafloor|underwater)\b/,
  'environments.heights': /\b(mountains?|caves?|caverns?|cliffs?|peaks?|underground|highlands?|craggy)\b/,
  'environments.skies': /\b(sky|skies|soars?|soaring|clouds?|stratosphere|flies|flying|wings?)\b/,
  // Not "home" ("makes its home in caves" is not a town).
  'environments.settlements': /\b(cit(y|ies)|towns?|houses?|buildings?|power plants?|garbage|trash|factor(y|ies)|ruins)\b/,
  'environments.extremes': /\b(deserts?|sands?|sandy|volcan\w*|lava|magma|snow\w*|blizzards?|glaciers?|arctic|icy|scorching|frigid)\b/,
  'behavior.nocturnal': /\b(night|nights|nighttime|nocturnal|moonlight|moonlit|after dark|dusk)\b/,
  'behavior.gregarious': /\b(groups?|flocks?|herds?|packs?|colon(y|ies)|swarms?|schools? of|together|in numbers|in pairs)\b/,
  'behavior.swift': /\b(fast|swift(ly)?|quick(ly)?|speeds?|darts?|agile|rapid(ly)?)\b/,
  'behavior.unhurried': /\b(slow(ly)?|sleeps?|sleeping|naps?|napping|lazy|lazily|dozes?|dozing|rests?|resting|motionless|idle)\b/,
  'behavior.maker': /\b(builds?|building|nests?|collects?|collecting|gathers?|gathering|stores?|storing|hoards?|crafts?|weav(e|es|ing)|burrows?|tunnels?|tools?)\b/,
  'instinct.vigilant': /\b(alert|wary|watchful|keen|detects?|senses? danger|lookout|sentr(y|ies))\b/,
  'instinct.fierce': /\b(fierce(ly)?|ferocious|aggressive|vicious|violent|rages?|savage|ruthless|furious)\b/,
  'instinct.elusive': /\b(camouflag\w*|disguis\w*|mimic\w*|blends? in(to)?|invisible|vanish\w*|hides?|hiding|hidden|stealth\w*|unseen|transparent|sneak\w*)\b/,
  'instinct.intuitive': /\b(emotions?|feelings|aura|empath\w*|telepath\w*|premonitions?|predicts?|foresee\w*|dreams?)\b/,
  'instinct.resilient': /\b(endures?|surviv\w*|harsh|withstands?|regenerat\w*|adapts?|adaptable|resilient|durable|hardy)\b/,
};

const HABITAT = {
  forest: ['environments.woodland'],
  grassland: ['environments.woodland'],
  sea: ['environments.waters'],
  'waters-edge': ['environments.waters'],
  mountain: ['environments.heights'],
  cave: ['environments.heights'],
  'rough-terrain': ['environments.heights', 'environments.extremes'],
  urban: ['environments.settlements'],
};
const TYPE = {
  water: ['environments.waters'],
  flying: ['environments.skies'],
  grass: ['environments.woodland', 'aesthetics.organic'],
  bug: ['environments.woodland'],
  rock: ['environments.heights', 'aesthetics.mineral'],
  ground: ['environments.extremes'],
  ice: ['environments.extremes', 'aesthetics.mineral'],
  fire: ['environments.extremes'],
  steel: ['aesthetics.mineral'],
  dark: ['aesthetics.shadowed'],
  ghost: ['aesthetics.shadowed'],
  fairy: ['aesthetics.luminous'],
  electric: ['aesthetics.luminous'],
};
const COLOR = { white: 'aesthetics.luminous', yellow: 'aesthetics.luminous', black: 'aesthetics.shadowed', pink: 'aesthetics.soft' };
const SHAPE = { ball: 'aesthetics.soft', blob: 'aesthetics.soft', squiggle: 'aesthetics.sleek', fish: 'aesthetics.sleek', blade: 'aesthetics.sleek' };

const KIND_WEIGHT = { 'pokedex-text': 1, habitat: 0.6, 'game-stats': 0.5, appearance: 0.3, type: 0.2 };

function formKind(name) {
  if (/-mega(-[xyz])?$/.test(name)) return 'mega';
  if (/-gmax$/.test(name)) return 'gigantamax';
  if (/-(alola|galar|hisui|paldea)(-|$)/.test(name)) return 'regional';
  return 'other';
}

/** Evolution stage of a species in its chain (0 = basic). */
function stageIn(chain, slug) {
  const walk = (node, depth) => {
    if (node.species.name === slug) return depth;
    for (const next of node.evolves_to) {
      const d = walk(next, depth + 1);
      if (d !== null) return d;
    }
    return null;
  };
  return walk(chain.chain, 0) ?? 0;
}

const TRAIT_ORDER = Object.keys(TEXT);
const records = [];
const species = readdirSync(join(CACHE, 'species')).map((f) => Number(f.replace('.json', ''))).sort((a, b) => a - b);

for (const id of species) {
  const s = read('species', `${String(id)}.json`);
  const p = read('pokemon', `${String(id)}.json`);
  const chainId = s.evolution_chain?.url.match(/\/(\d+)\/$/)?.[1] ?? null;
  const chain = chainId ? read('chain', `${chainId}.json`) : null;

  const entries = [
    ...new Set(
      s.flavor_text_entries
        .filter((e) => e.language.name === 'en')
        .map((e) => e.flavor_text.replace(/[\f\n\r­]+/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase()),
    ),
  ];
  const types = p.types.sort((a, b) => a.slot - b.slot).map((t) => t.type.name);
  const speed = p.stats.find((st) => st.stat.name === 'speed')?.base_stat ?? null;

  /** trait -> { score, kinds: Set, detail: [] } */
  const ev = new Map();
  const add = (trait, kind, score, detail) => {
    const e = ev.get(trait) ?? { score: 0, kinds: new Set(), detail: [] };
    e.score += score * KIND_WEIGHT[kind];
    e.kinds.add(kind);
    e.detail.push(detail);
    ev.set(trait, e);
  };

  for (const trait of TRAIT_ORDER) {
    const re = TEXT[trait];
    const hits = entries.filter((t) => re.test(t));
    if (hits.length === 0) continue;
    const share = hits.length / entries.length;
    const words = [...new Set(hits.flatMap((t) => t.match(new RegExp(re.source, 'g')) ?? []))].slice(0, 3);
    add(trait, 'pokedex-text', 0.5 + 0.5 * share, `text:${words.join('|')}:${String(hits.length)}/${String(entries.length)}`);
  }
  for (const trait of HABITAT[s.habitat?.name] ?? []) add(trait, 'habitat', 1, `habitat:${s.habitat.name}`);
  for (const t of types) for (const trait of TYPE[t] ?? []) add(trait, 'type', 1, `type:${t}`);
  if (COLOR[s.color?.name]) add(COLOR[s.color.name], 'appearance', 1, `color:${s.color.name}`);
  if (SHAPE[s.shape?.name]) add(SHAPE[s.shape.name], 'appearance', 1, `shape:${s.shape.name}`);
  if (speed !== null) {
    if (speed >= 100) add('behavior.swift', 'game-stats', 1, `speed:${String(speed)}`);
    else if (speed >= 85) add('behavior.swift', 'game-stats', 0.6, `speed:${String(speed)}`);
    else if (speed <= 35) add('behavior.unhurried', 'game-stats', 1, `speed:${String(speed)}`);
    else if (speed <= 50) add('behavior.unhurried', 'game-stats', 0.6, `speed:${String(speed)}`);
  }

  const candidates = [...ev.entries()]
    .map(([trait, e]) => {
      const intensity = Math.min(1, e.score);
      const textual = e.kinds.has('pokedex-text');
      const support =
        e.kinds.size >= 2 && intensity >= 0.6
          ? 'well-supported'
          : e.kinds.has('type') && e.kinds.size === 1
            ? 'insufficient-evidence'
            : textual || e.kinds.has('habitat') || e.kinds.has('game-stats') || e.kinds.has('appearance')
              ? 'partially-supported'
              : 'insufficient-evidence';
      return { trait, intensity: Math.round(intensity * 100) / 100, support, kinds: [...e.kinds].sort(), detail: e.detail };
    })
    .filter((c) => c.intensity >= MIN_INTENSITY && c.support !== 'insufficient-evidence')
    .sort((a, b) => b.intensity - a.intensity || (a.trait < b.trait ? -1 : 1));

  const perDim = new Map();
  const traits = [];
  for (const c of candidates) {
    const dim = c.trait.split('.')[0];
    const n = perDim.get(dim) ?? 0;
    if (n >= PER_DIMENSION || traits.length >= MAX_TRAITS) continue;
    perDim.set(dim, n + 1);
    traits.push(c);
  }

  const name = (lang) => s.names.find((n) => n.language.name === lang)?.name ?? null;
  const genus = (lang) => s.genera.find((g) => g.language.name === lang)?.genus ?? null;
  const art = p.sprites?.other?.['official-artwork']?.front_default ?? null;
  const varieties = s.varieties.filter((v) => !v.is_default).map((v) => ({ id: v.pokemon.name, kind: formKind(v.pokemon.name) }));
  const cosmetic = p.forms.length > 1 ? p.forms.slice(1).map((f) => ({ id: f.name, kind: 'cosmetic' })) : [];

  records.push({
    id,
    slug: s.name,
    name: { en: name('en') ?? s.name, es: name('es') ?? name('en') ?? s.name },
    genus: { en: genus('en'), es: genus('es') ?? genus('en') },
    generation: s.generation.name.replace('generation-', '').toUpperCase(),
    types,
    color: s.color?.name ?? null,
    shape: s.shape?.name ?? null,
    habitat: s.habitat?.name ?? null,
    legendary: s.is_legendary,
    mythical: s.is_mythical,
    chain: chainId ? Number(chainId) : null,
    stage: chain ? stageIn(chain, s.name) : 0,
    forms: [...varieties, ...cosmetic],
    art,
    entries: entries.length,
    traits: traits.map((t) => ({ t: t.trait, v: t.intensity, s: t.support, k: t.kinds, d: t.detail })),
    completeness: {
      text: entries.length > 0,
      habitat: s.habitat !== null,
      art: art !== null,
      traits: traits.length,
    },
  });
}

mkdirSync(OUT_DIR, { recursive: true });
const catalog = {
  version: VERSION,
  source: { name: 'PokéAPI', url: 'https://pokeapi.co', retrievedAt: index.retrievedAt, speciesReported: index.count },
  rules: { perDimension: PER_DIMENSION, maxTraits: MAX_TRAITS, minIntensity: MIN_INTENSITY },
  status: 'automatic-candidate',
  species: records,
};
writeFileSync(join(OUT_DIR, 'pokedex.v1.json'), JSON.stringify(catalog));

const counts = records.map((r) => r.traits.length);
const hist = {};
for (const n of counts) hist[n] = (hist[n] ?? 0) + 1;
const traitFreq = {};
for (const r of records) for (const t of r.traits) traitFreq[t.t] = (traitFreq[t.t] ?? 0) + 1;
console.log(`species ${String(records.length)} (PokéAPI reports ${String(index.count)})`);
console.log('traits per species', JSON.stringify(hist));
console.log('species per trait', JSON.stringify(Object.fromEntries(Object.entries(traitFreq).sort((a, b) => b[1] - a[1]))));
console.log('no text entries', records.filter((r) => !r.completeness.text).map((r) => r.slug).join(' ') || 'none');
console.log('no art', records.filter((r) => !r.art).map((r) => r.slug).join(' ') || 'none');
