/** Source locale. Every other locale must provide exactly these keys. */
export const en = {
  'shell.skipToContent': 'Skip to content',
  'shell.title': 'Rare Encounter',
  'shell.status': 'Foundation build',
  'shell.lead': 'The groundwork is in place. The encounter itself arrives in the next phases.',
  'settings.title': 'Preferences',
  'settings.language': 'Language',
  'settings.theme': 'Theme',
  'theme.spectrum': 'Spectrum',
  'theme.amethyst': 'Amethyst',
  'theme.azure': 'Azure',
  'theme.ember': 'Ember',
  'theme.sakura': 'Sakura',
  'theme.verdant': 'Verdant',
} as const;

export type MessageKey = keyof typeof en;
export type Messages = Readonly<Record<MessageKey, string>>;
