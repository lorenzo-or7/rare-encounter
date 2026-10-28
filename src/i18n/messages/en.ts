/** Source locale. Every other locale must provide exactly these keys. */
export const en = {
  'shell.skipToContent': 'Skip to content',
  'brand.name': 'Rare Encounter',

  'nav.label': 'Sections',
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

  'cards.artPending': 'Art-only version pending',

  'card.discover': 'Tap to discover',
  'card.hide': 'Hide',
  'archetype.ethereal.name': 'Ethereal',
  'archetype.ethereal.phrase': 'You find meaning in what others overlook.',
  'archetype.instinctive.name': 'Instinctive',
  'archetype.instinctive.phrase': 'Your intuition finds its own direction.',
  'archetype.radiant.name': 'Radiant',
  'archetype.radiant.phrase': 'You bring warmth wherever you go.',

  'landing.nav.beyond': 'Beyond the obvious',
  'landing.nav.discovery': 'How it works',
  'landing.nav.connection': 'Connections',
  'landing.nav.begin': 'Begin',
  'landing.hero.opening': 'Somewhere out there,',
  'landing.hero.bridge': "there's",
  'landing.hero.highlight': 'your Pokémon',
  'landing.hero.after': '.',
  'landing.hero.lead':
    'Answer 30, 60 or 90 questions about who you are and what draws you in. Every species is compared on equal terms, and you see why you match.',
  'landing.hero.cta': 'Begin your journey',
  'landing.section.beyond': 'Beyond the Obvious',
  'landing.section.discovery': 'How Discovery Works',
  'landing.section.connection': 'Every Connection Is Different',
  'landing.section.begin': 'Begin Your Journey',
} as const;

export type MessageKey = keyof typeof en;
export type Messages = Readonly<Record<MessageKey, string>>;
