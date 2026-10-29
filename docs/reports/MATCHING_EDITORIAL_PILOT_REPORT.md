# Matching Editorial Pilot Report (ME-02)

Branch `integration/approved-features-v1`. Status: **pilot structure, provenance and validation implemented; 60 Draft profiles with verified canonical facts only. Editorially approved profiles: 0 of 60.**

## Candidates
The candidates come from the Or7 companion pack (`species_pilot_candidates.csv`), converted without change into `src/matching/data/pilot-candidates.v1.json`. The approved governance is Stratified + Adversarial, with a Frozen Core and a Challenge Set. This is a **candidate selection**, not 60 approved profiles.

**Frozen Core (40):**
| Generation | Species |
| --- | --- |
| I | Bulbasaur, Arcanine, Lapras, Snorlax, Dragonite |
| II | Ampharos, Espeon, Umbreon, Heracross |
| III | Gardevoir, Flygon, Milotic, Torkoal, Altaria |
| IV | Lucario, Froslass, Roserade, Gastrodon |
| V | Chandelure, Galvantula, Whimsicott, Krookodile, Volcarona |
| VI | Aegislash, Sylveon, Noivern, Goodra |
| VII | Rowlet, Lycanroc, Toxapex, Komala |
| VIII | Corviknight, Dragapult, Snom, Appletun, Toxtricity |
| IX | Tinkaton, Clodsire, Ceruledge, Farigiraf |

**Challenge Set (20):**
| Group | Species |
| --- | --- |
| Similar profiles | Plusle, Minun, Solrock, Lunatone, Zangoose, Seviper |
| Forms | Vulpix, Rotom, Meowth, Zygarde |
| Editorial ambiguity | Unown, Sigilyph, Elgyem, Dhelmise |
| Appearance vs. personality | Darkrai, Mimikyu, Absol, Hatterene |
| Tie-break stress | Ditto, Smeargle |

## IDs and distinctness (verified)
`scripts/fetch-pilot-canonical.mjs` looked up each candidate in PokéAPI (https://pokeapi.co, a public mirror of the games' data) on 2026-10-29 at 01:17 UTC. The result is the snapshot `src/matching/data/pilot-canonical.v1.json`.
- **All 60 names resolve** to 60 distinct species and 60 distinct National Pokédex numbers.
- **All 40 Frozen Core species** belong to the generation of their group (checked by a unit test).
- The snapshot keeps structured game data only: types, colour, shape, habitat, genus, the legendary and mythical flags, varieties and cosmetic forms.
  - Habitat exists only for species from Generations I–III, so 26 records have one.
- **No Pokédex flavour text, images or descriptions were stored**, for rights reasons and because they aren't needed for identity.

## Pilot dataset
`scripts/build-pilot-profiles.mjs` writes `src/matching/data/pilot-profiles.v1.json`, version `pilot-profiles-0.1-draft`.

| | Count |
| --- | --- |
| Profiles | 60, all `draft`, `review: null` |
| Canonical facts | 388, each with a source URL and retrieval date (120 source records) |
| Direct observations | 0 |
| Editorial interpretations | 0 |
| Trait mappings | 0 |
| Form contexts | 70 (regional, mega, gigantamax, cosmetic, other), attached to their species, never candidates |

Each profile also carries two evidence boundaries:
- the game classification (type, colour, shape, habitat, genus) describes the species, not a temperament;
- nothing about behaviour, values or personality may be stated until an editorial reading is sourced and reviewed.

**What is not here, and why:**
- **Editorial interpretations and visual affinities.** These need a human reviewer, the approved trait vocabulary and verifiable official sources: Pokédex entries per game, official media, documented in-game behaviour. Writing them from memory would be fabrication, and inferring personality from appearance is explicitly ruled out.
- **Trait mappings.** There is no approved trait vocabulary to map to (see the architecture report).

## Forms (Challenge Set)
- **Rotom:** 5 alternate varieties (heat, wash, frost, fan, mow).
- **Meowth:** Alolan, Galarian and Gigantamax.
- **Zygarde:** 10%, Complete, Power Construct and Mega.
- **Vulpix:** Alolan.
- **Unown:** 27 cosmetic letter forms.

All stay on one species record. The validator rejects any species-level mapping that rests only on form-specific evidence.

**Form kinds are inferred from the PokéAPI variety name.** For example, `-alola` becomes regional and `-mega` becomes mega, and battle and appearance forms such as Rotom's appliances, Aegislash-blade or Lycanroc's Midnight form are classified "other". This is metadata, not evidence, and a reviewer should correct it during review.

## Editorial workflow (in the schema)
The schema has four states: `draft` → `evidence-reviewed` → `pilot-approved`, with `recalibration-required` available at any point.
- **Pilot Approved is refused** without a recorded reviewer and date, and without at least one mapping.
- **No script sets a state above Draft.** A unit test asserts that the shipped pilot is entirely Draft.

## Remaining work (owner and editorial)
1. **Approve the trait vocabulary:** the 12 pilot questions with their 48 Layered Traits, plus the rest of the registry. The source files are missing.
2. **Assign reviewers and sources per species** (official Pokédex entries per game, official media). Record them as `official` sources, not copied text, where rights require it.
3. **Write interpretations** that rest on the recorded facts or observations, then the mappings with their support levels.
4. **Review and set the states.** Only then can the coverage audit say anything about the real pilot.
