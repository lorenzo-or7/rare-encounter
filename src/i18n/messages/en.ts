/** Source locale. Every other locale must provide exactly these keys. */
export const en = {
  'shell.skipToContent': 'Skip to content',
  'brand.name': 'Rare Encounter',

  'nav.label': 'Sections',
  'nav.typography': 'Typography',
  'nav.themes': 'Themes',
  'nav.components': 'Components',
  'nav.cards': 'Cards',
  'nav.openSettings': 'Open settings',
  'nav.openMenu': 'Open menu',
  'menu.title': 'Menu',

  'settings.title': 'Settings',
  'settings.close': 'Close',
  'settings.language': 'Language',
  'settings.theme': 'Theme',
  'settings.themeHint': 'Themes only change colors. Your answers and results stay the same.',

  'theme.spectrum': 'Spectrum',
  'theme.amethyst': 'Amethyst',
  'theme.azure': 'Azure',
  'theme.ember': 'Ember',
  'theme.sakura': 'Sakura',
  'theme.verdant': 'Verdant',

  'foundation.title': 'Visual foundation',
  'foundation.lead':
    'The type, color, navigation and components every Rare Encounter screen will share. The landing page is built on top of them next.',

  'type.title': 'Typography',
  'type.lead': 'Clash Display carries the headlines. Inter carries everything you read and tap.',
  'type.role.display': 'Display',
  'type.role.heading': 'Heading',
  'type.role.title': 'Title',
  'type.role.body': 'Body',
  'type.role.small': 'Small',
  'type.sample.heading': 'Every connection is different',
  'type.sample.title': 'How discovery works',
  'type.sample.body':
    'Answer at your own pace. Your progress is saved after every question, so you can pause and come back.',
  'type.sample.small': 'Available in English, Português and Español.',

  'themes.title': 'Themes',
  'themes.lead': 'Six palettes over the same night sky. Choose one in settings.',
  'themes.current': 'In use',

  'components.title': 'Components',
  'components.lead': 'Actions are pills. Surfaces get softer corners as they grow.',
  'button.primary': 'Primary',
  'button.secondary': 'Secondary',
  'button.ghost': 'Ghost',
  'button.disabled': 'Unavailable',

  'cards.title': 'Archetype cards',
  'cards.lead':
    'The three approved mystery cards. Title, phrase and action are real text, so they translate and work with assistive technology.',
  'cards.artPending': 'Art-only version pending',

  'card.discover': 'Tap to discover',
  'card.hide': 'Hide',
  'archetype.ethereal.name': 'Ethereal',
  'archetype.ethereal.phrase': 'You find meaning in what others overlook.',
  'archetype.instinctive.name': 'Instinctive',
  'archetype.instinctive.phrase': 'Your intuition finds its own direction.',
  'archetype.radiant.name': 'Radiant',
  'archetype.radiant.phrase': 'You bring warmth wherever you go.',
} as const;

export type MessageKey = keyof typeof en;
export type Messages = Readonly<Record<MessageKey, string>>;
