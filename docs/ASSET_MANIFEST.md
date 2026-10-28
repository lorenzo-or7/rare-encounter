# Asset manifest and handling

## Approved references available in this package
- design-references/approved/card-01-ethereal.png — approved isolated translucent PNG; violet, 01, question mark.
- design-references/approved/card-02-instinctive.png — approved isolated translucent PNG; cyan, 02, question mark.
- design-references/approved/card-03-radiant.png — approved isolated translucent PNG; warm tone, 03, question mark.
- design-references/approved/logo-04-reference.png — proposed reference of the chosen logotype variant. Confirm this exact file is the approved logo before treating it as final.
These are high-res reference images, not an implemented HTML component.

## Critical UX rule
The baked-in words and Tap to discover icon in the PNGs are visual references. If cards need translated text and clickable reveal, render copy and action via semantic HTML / Motion, and prepare or request art-only assets. Do NOT put a fake button on top of a baked-in fake button. Do NOT use a background with hidden inaccessible interactions.

## Asset workflow
Keep original supplied art in design-references/approved; import final optimized runtime assets into src/assets/ as genuinely needed in Phase 01 onward. Avoid committing rejected media, video loops, or unsanctioned official Pokémon imagery. Question-image collage is a concept reference, NOT production-quality independent assets. Re-create individual question images only after question bank content requires them.
