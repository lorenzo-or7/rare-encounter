import type { MessageKey } from '../../i18n/messages';

export type ArchetypeId = 'ethereal' | 'instinctive' | 'radiant';

export interface Archetype {
  readonly id: ArchetypeId;
  /** Printed order on the approved art (01, 02, 03). */
  readonly number: string;
  /** CSS custom property holding the card's fixed hue. */
  readonly hue: string;
  readonly nameKey: MessageKey;
  readonly phraseKey: MessageKey;
  /**
   * Art-only runtime asset (no baked number, title, phrase or button).
   * null until delivered: the approved references in design-references/approved/ have the
   * copy and "Tap to discover" baked in, so they must not sit under real DOM text.
   */
  readonly art: string | null;
}

/** Editorial cards from the approved visual direction; not algorithm classes. */
export const ARCHETYPES: readonly Archetype[] = [
  {
    id: 'ethereal',
    number: '01',
    hue: 'var(--archetype-ethereal)',
    nameKey: 'archetype.ethereal.name',
    phraseKey: 'archetype.ethereal.phrase',
    art: null,
  },
  {
    id: 'instinctive',
    number: '02',
    hue: 'var(--archetype-instinctive)',
    nameKey: 'archetype.instinctive.name',
    phraseKey: 'archetype.instinctive.phrase',
    art: null,
  },
  {
    id: 'radiant',
    number: '03',
    hue: 'var(--archetype-radiant)',
    nameKey: 'archetype.radiant.name',
    phraseKey: 'archetype.radiant.phrase',
    art: null,
  },
];
