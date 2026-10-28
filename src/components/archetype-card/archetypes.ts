import ethereal480 from '../../assets/cards/card-01-ethereal-480.webp';
import ethereal640 from '../../assets/cards/card-01-ethereal-640.webp';
import ethereal960 from '../../assets/cards/card-01-ethereal-960.webp';
import instinctive480 from '../../assets/cards/card-02-instinctive-480.webp';
import instinctive640 from '../../assets/cards/card-02-instinctive-640.webp';
import instinctive960 from '../../assets/cards/card-02-instinctive-960.webp';
import radiant480 from '../../assets/cards/card-03-radiant-480.webp';
import radiant640 from '../../assets/cards/card-03-radiant-640.webp';
import radiant960 from '../../assets/cards/card-03-radiant-960.webp';
import type { MessageKey } from '../../i18n/messages';

export type ArchetypeId = 'ethereal' | 'instinctive' | 'radiant';

/** Responsive art-only image (no baked number, title, phrase or button). */
export interface CardArt {
  readonly src: string;
  readonly srcSet: string;
}

export interface Archetype {
  readonly id: ArchetypeId;
  /** Printed order of the approved cards (01, 02, 03), rendered as real text. */
  readonly number: string;
  /** CSS custom property holding the card's fixed hue. */
  readonly hue: string;
  readonly nameKey: MessageKey;
  readonly phraseKey: MessageKey;
  /** Optimized from design-references/approved/assets-01b (see scripts/build-assets.mjs). */
  readonly art: CardArt | null;
}

const art = (w480: string, w640: string, w960: string): CardArt => ({
  src: w640,
  srcSet: `${w480} 480w, ${w640} 640w, ${w960} 960w`,
});

/** Editorial cards from the approved visual direction; not algorithm classes. */
export const ARCHETYPES: readonly Archetype[] = [
  {
    id: 'ethereal',
    number: '01',
    hue: 'var(--archetype-ethereal)',
    nameKey: 'archetype.ethereal.name',
    phraseKey: 'archetype.ethereal.phrase',
    art: art(ethereal480, ethereal640, ethereal960),
  },
  {
    id: 'instinctive',
    number: '02',
    hue: 'var(--archetype-instinctive)',
    nameKey: 'archetype.instinctive.name',
    phraseKey: 'archetype.instinctive.phrase',
    art: art(instinctive480, instinctive640, instinctive960),
  },
  {
    id: 'radiant',
    number: '03',
    hue: 'var(--archetype-radiant)',
    nameKey: 'archetype.radiant.name',
    phraseKey: 'archetype.radiant.phrase',
    art: art(radiant480, radiant640, radiant960),
  },
];
