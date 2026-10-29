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
  'settings.appearance': 'Appearance',
  'settings.lightMode': 'Light mode',
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
  'landing.beyond.statement':
    'Strength, rarity and fame play no part in the comparison. It looks at how a Pokémon moves through the world, and whether that feels like you.',
  'landing.beyond.p1.title': 'The whole Pokédex is in play',
  'landing.beyond.p1.body':
    'Every eligible species is a candidate, from the legends everyone knows to the ones most people walk past.',
  'landing.beyond.p2.title': 'Six sides of you',
  'landing.beyond.p2.body':
    'Personality, aesthetics, values, environments, energy and instinct all shape the result.',
  'landing.beyond.p3.title': 'Reasons you can read',
  'landing.beyond.p3.body':
    "Each match lists the answers that shaped it. Affinity measures how closely you align; it isn't a probability.",
  'landing.discovery.intro': 'Three steps, at your own pace.',
  'landing.discovery.stepLabel': 'Step {n}: {title}',
  'landing.discovery.step1.title': 'Discover Yourself',
  'landing.discovery.step1.body':
    'Pick A Glimpse (30 questions), The Journey (60) or Deep Connection (90), then answer one question at a time. Your progress is saved after every answer.',
  'landing.discovery.step2.title': 'Find Your Connection',
  'landing.discovery.step2.body':
    'Your answers are compared with every eligible species across six dimensions, on equal terms.',
  'landing.discovery.step3.title': 'Reveal Your Encounter',
  'landing.discovery.step3.body':
    'Meet your Soul Match first, then your Hidden and Alternative Matches, each with the reasons behind it.',
  'landing.connection.intro':
    'Ethereal, Instinctive and Radiant describe moods a connection can have; your result is always a species. Tap a card to read it.',
  'landing.begin.statement':
    'Start with 30 questions or go deeper with 90. You can pause whenever you like, and your answers will be waiting.',
  'landing.mode.glimpse': 'A Glimpse',
  'landing.mode.journey': 'The Journey',
  'landing.mode.deep': 'Deep Connection',
  'landing.mode.questions': '{n} questions',
  'landing.begin.cta': 'Begin your journey',
  'landing.begin.unavailable': 'Not available yet. The encounter will start from here once it opens.',
} as const;

export type MessageKey = keyof typeof en;
export type Messages = Readonly<Record<MessageKey, string>>;
