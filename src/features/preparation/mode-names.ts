import type { ModeId } from '../../domain/modes';
import type { MessageKey } from '../../i18n/messages';

/** Approved depth names, shared with the landing's closing section. */
export const MODE_NAMES: Readonly<Record<ModeId, MessageKey>> = {
  30: 'landing.mode.glimpse',
  60: 'landing.mode.journey',
  90: 'landing.mode.deep',
};
