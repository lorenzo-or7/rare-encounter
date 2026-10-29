import type { ThemeId } from '../theme/themes';

/**
 * Results Experience, Design Locked v1: sharing contract (RE-01 foundation).
 *
 * Two approved formats and the Curated Customization choices. A share payload is built from
 * an explicit allow-list, so quiz answers, session ids or scores can never reach an image,
 * whatever the result object carries. The editorial phrases and templates are not approved
 * yet: both registries ship empty, and building a payload with an unknown id fails.
 */
export const SHARE_FORMATS = {
  story: { width: 1080, height: 1920, ratio: '9:16' },
  square: { width: 1080, height: 1080, ratio: '1:1' },
} as const;

export type ShareFormat = keyof typeof SHARE_FORMATS;

/** Approved template and phrase ids. Empty until Or7 approves the editorial set. */
export const SHARE_TEMPLATES: readonly string[] = [];
export const SHARE_PHRASES: readonly string[] = [];

export interface ShareChoices {
  readonly format: ShareFormat;
  readonly templateId: string;
  readonly phraseId: string;
  readonly aura: boolean;
  readonly outerFrame: boolean;
}

/** Everything a shared image may show. Nothing else is ever read from the result. */
export interface SharePayload extends ShareChoices {
  readonly speciesId: string;
  readonly speciesName: string;
  /** Inherited from the active theme; not a separate choice. */
  readonly theme: ThemeId;
}

export const SHARE_PAYLOAD_KEYS = [
  'format',
  'templateId',
  'phraseId',
  'aura',
  'outerFrame',
  'speciesId',
  'speciesName',
  'theme',
] as const satisfies readonly (keyof SharePayload)[];

export type ShareError = 'unknown-template' | 'unknown-phrase';

export function buildSharePayload(
  soul: { readonly speciesId: string; readonly speciesName: string },
  choices: ShareChoices,
  theme: ThemeId,
  approved: { readonly templates: readonly string[]; readonly phrases: readonly string[] } = {
    templates: SHARE_TEMPLATES,
    phrases: SHARE_PHRASES,
  },
): { readonly ok: true; readonly payload: SharePayload } | { readonly ok: false; readonly error: ShareError } {
  if (!approved.templates.includes(choices.templateId)) return { ok: false, error: 'unknown-template' };
  if (!approved.phrases.includes(choices.phraseId)) return { ok: false, error: 'unknown-phrase' };
  return {
    ok: true,
    payload: {
      format: choices.format,
      templateId: choices.templateId,
      phraseId: choices.phraseId,
      aura: choices.aura,
      outerFrame: choices.outerFrame,
      speciesId: soul.speciesId,
      speciesName: soul.speciesName,
      theme,
    },
  };
}
