import type { CategoryId } from '../domain/categories';
import type { LocalizedText } from '../domain/localized';
import type { TraitId } from '../domain/traits';
import type { TraitRecord, TraitRegistry } from '../matching/registry';

/**
 * Trait Registry v1, candidate (Or7 review pending).
 *
 * The approved 12 pilot questions and their 48 Layered Traits were not available in the
 * repository or the companion pack, so this vocabulary was written for the 300-question
 * candidate bank. It is deliberately smaller than the blueprint's "48 editorial attributes
 * per species" and does not claim to be either set: it is the shared language between
 * answers and species profiles in this version.
 *
 * Every trait is descriptive (no "good", "strong", "special"), names a tendency rather than
 * a diagnosis, and states what it must never be used to claim.
 */

const L = (ptBR: string, en: string, es: string): LocalizedText => ({ 'pt-BR': ptBR, en, es });

interface TraitCopy {
  readonly label: LocalizedText;
  readonly definition: LocalizedText;
  /** Completes "Your answers leaned toward …". */
  readonly person: LocalizedText;
  readonly boundary: string;
}

const COPY = {
  // ---- Personality ---------------------------------------------------------------------
  'personality.curious': {
    label: L('Curiosidade', 'Curiosity', 'Curiosidad'),
    definition: L(
      'Vontade de investigar o que ainda não se conhece.',
      'An urge to look into what is still unknown.',
      'Ganas de investigar lo que aún no se conoce.',
    ),
    person: L('investigar o desconhecido', 'looking into the unknown', 'investigar lo desconocido'),
    boundary: 'Describes a pull toward novelty; never intelligence or ability.',
  },
  'personality.serene': {
    label: L('Serenidade', 'Serenity', 'Serenidad'),
    definition: L(
      'Um ritmo calmo, que não se apressa nem se agita à toa.',
      'A calm pace that does not hurry or stir without reason.',
      'Un ritmo tranquilo, que no se apura ni se agita sin motivo.',
    ),
    person: L('a calma e o ritmo tranquilo', 'calm and an unhurried pace', 'la calma y un ritmo tranquilo'),
    boundary: 'Describes a preferred pace; never emotional health.',
  },
  'personality.playful': {
    label: L('Leveza brincalhona', 'Playfulness', 'Espíritu juguetón'),
    definition: L(
      'Prazer em brincar, provocar e transformar o comum em jogo.',
      'Enjoying play, teasing and turning the ordinary into a game.',
      'Disfrutar del juego, las bromas y convertir lo común en juego.',
    ),
    person: L('o jogo e o bom humor', 'play and good humor', 'el juego y el buen humor'),
    boundary: 'Describes a taste for play; never immaturity.',
  },
  'personality.daring': {
    label: L('Ousadia', 'Daring', 'Audacia'),
    definition: L(
      'Disposição para dar o primeiro passo diante do risco.',
      'Readiness to take the first step when there is risk.',
      'Disposición a dar el primer paso ante el riesgo.',
    ),
    person: L('dar o primeiro passo', 'taking the first step', 'dar el primer paso'),
    boundary: 'Describes initiative under risk; never recklessness or aggression.',
  },
  'personality.reserved': {
    label: L('Recolhimento', 'Reserve', 'Reserva'),
    definition: L(
      'Preferência por espaço próprio, silêncio e poucos holofotes.',
      'A preference for room of one’s own, quiet and little spotlight.',
      'Preferencia por el espacio propio, el silencio y pocos reflectores.',
    ),
    person: L('o silêncio e o espaço próprio', 'quiet and room of your own', 'el silencio y el espacio propio'),
    boundary: 'Describes a preference for quiet; never shyness as a flaw or isolation.',
  },
  'personality.warm': {
    label: L('Afeto', 'Warmth', 'Calidez'),
    definition: L(
      'Proximidade, cuidado e gestos de carinho com quem está perto.',
      'Closeness, care and small kindnesses toward those nearby.',
      'Cercanía, cuidado y gestos de cariño con quien está cerca.',
    ),
    person: L('a proximidade e o cuidado', 'closeness and care', 'la cercanía y el cuidado'),
    boundary: 'Describes a way of relating; never how lovable someone is.',
  },
  // ---- Aesthetics ----------------------------------------------------------------------
  'aesthetics.luminous': {
    label: L('Luminosidade', 'Luminosity', 'Luminosidad'),
    definition: L('Gosto por brilho, claridade e cores que irradiam.', 'A taste for glow, brightness and radiant color.', 'Gusto por el brillo, la claridad y los colores que irradian.'),
    person: L('o brilho e a claridade', 'glow and brightness', 'el brillo y la claridad'),
    boundary: 'Visual preference only.',
  },
  'aesthetics.shadowed': {
    label: L('Penumbra', 'Shade', 'Penumbra'),
    definition: L('Gosto por tons escuros, contraste e mistério visual.', 'A taste for dark tones, contrast and visual mystery.', 'Gusto por los tonos oscuros, el contraste y el misterio visual.'),
    person: L('os tons escuros e o mistério', 'dark tones and mystery', 'los tonos oscuros y el misterio'),
    boundary: 'Visual preference only; never a mood or temperament.',
  },
  'aesthetics.organic': {
    label: L('Formas naturais', 'Organic forms', 'Formas naturales'),
    definition: L('Folhas, pétalas, madeira: o que cresce e tem textura viva.', 'Leaves, petals, wood: things that grow and have living texture.', 'Hojas, pétalos, madera: lo que crece y tiene textura viva.'),
    person: L('as formas que crescem', 'forms that grow', 'las formas que crecen'),
    boundary: 'Visual preference only.',
  },
  'aesthetics.mineral': {
    label: L('Mineral e cristal', 'Mineral and crystal', 'Mineral y cristal'),
    definition: L('Pedra, metal, gelo e facetas que refletem a luz.', 'Stone, metal, ice and facets that catch the light.', 'Piedra, metal, hielo y facetas que reflejan la luz.'),
    person: L('a pedra, o metal e o cristal', 'stone, metal and crystal', 'la piedra, el metal y el cristal'),
    boundary: 'Visual preference only.',
  },
  'aesthetics.soft': {
    label: L('Maciez', 'Softness', 'Suavidad'),
    definition: L('Contornos arredondados, pelos, plumas e superfícies acolhedoras.', 'Rounded outlines, fur, feathers and welcoming surfaces.', 'Contornos redondeados, pelaje, plumas y superficies acogedoras.'),
    person: L('o macio e o arredondado', 'the soft and the rounded', 'lo suave y lo redondeado'),
    boundary: 'Visual preference only; never gentleness of character.',
  },
  'aesthetics.sleek': {
    label: L('Linhas precisas', 'Sleek lines', 'Líneas precisas'),
    definition: L('Silhuetas afiladas, ângulos e movimento desenhado.', 'Sharp silhouettes, angles and drawn-out motion.', 'Siluetas afiladas, ángulos y movimiento dibujado.'),
    person: L('as linhas afiadas e precisas', 'sharp, precise lines', 'las líneas afiladas y precisas'),
    boundary: 'Visual preference only; never hostility.',
  },
  // ---- Values --------------------------------------------------------------------------
  'values.loyalty': {
    label: L('Lealdade', 'Loyalty', 'Lealtad'),
    definition: L('Ficar ao lado de quem se escolheu, mesmo quando custa.', 'Standing by those you chose, even when it costs.', 'Quedarse al lado de quien se eligió, aunque cueste.'),
    person: L('permanecer ao lado de quem importa', 'standing by the people who matter', 'quedarse al lado de quien importa'),
    boundary: 'Describes what is valued; never a measure of trustworthiness.',
  },
  'values.freedom': {
    label: L('Liberdade', 'Freedom', 'Libertad'),
    definition: L('Escolher o próprio caminho e manter espaço para mudar.', 'Choosing one’s own path and keeping room to change.', 'Elegir el propio camino y conservar espacio para cambiar.'),
    person: L('escolher o próprio caminho', 'choosing your own path', 'elegir tu propio camino'),
    boundary: 'Describes what is valued; never a lack of commitment.',
  },
  'values.harmony': {
    label: L('Harmonia', 'Harmony', 'Armonía'),
    definition: L('Equilíbrio entre as partes e convivência sem atrito.', 'Balance between parts and living together without friction.', 'Equilibrio entre las partes y convivencia sin roces.'),
    person: L('o equilíbrio e a convivência', 'balance and getting along', 'el equilibrio y la convivencia'),
    boundary: 'Describes what is valued; never conflict avoidance as a flaw.',
  },
  'values.growth': {
    label: L('Superação', 'Growth', 'Superación'),
    definition: L('Treinar, evoluir e ir além do que se era ontem.', 'Training, evolving and going beyond who you were yesterday.', 'Entrenar, evolucionar e ir más allá de quien eras ayer.'),
    person: L('evoluir e ir além', 'growing and going further', 'evolucionar e ir más allá'),
    boundary: 'Describes what is valued; never competitiveness as a judgement.',
  },
  'values.protection': {
    label: L('Proteção', 'Protection', 'Protección'),
    definition: L('Guardar, defender e cuidar de quem é mais vulnerável.', 'Guarding, defending and looking after the more vulnerable.', 'Resguardar, defender y cuidar a quien es más vulnerable.'),
    person: L('proteger e guardar', 'protecting and keeping safe', 'proteger y resguardar'),
    boundary: 'Describes what is valued; never a role imposed on someone.',
  },
  'values.wisdom': {
    label: L('Sabedoria', 'Wisdom', 'Sabiduría'),
    definition: L('Entender antes de agir e guardar o que se aprende.', 'Understanding before acting and keeping what one learns.', 'Entender antes de actuar y guardar lo que se aprende.'),
    person: L('entender antes de agir', 'understanding before acting', 'entender antes de actuar'),
    boundary: 'Describes what is valued; never intelligence.',
  },
  // ---- Environments --------------------------------------------------------------------
  'environments.woodland': {
    label: L('Matas e campos', 'Woods and meadows', 'Bosques y campos'),
    definition: L('Florestas, campos e lugares onde o verde domina.', 'Forests, meadows and places where green takes over.', 'Bosques, campos y lugares donde domina el verde.'),
    person: L('as matas e os campos', 'woods and meadows', 'los bosques y los campos'),
    boundary: 'Describes a place of preference.',
  },
  'environments.waters': {
    label: L('Águas', 'Waters', 'Aguas'),
    definition: L('Mar, rios, lagos e a beira de qualquer água.', 'Sea, rivers, lakes and the edge of any water.', 'Mar, ríos, lagos y la orilla de cualquier agua.'),
    person: L('a beira da água', 'the water’s edge', 'la orilla del agua'),
    boundary: 'Describes a place of preference.',
  },
  'environments.heights': {
    label: L('Montanhas e cavernas', 'Mountains and caves', 'Montañas y cuevas'),
    definition: L('Terreno de pedra: picos, encostas e o que fica sob a rocha.', 'Stone country: peaks, slopes and what lies under rock.', 'Terreno de piedra: picos, laderas y lo que hay bajo la roca.'),
    person: L('as montanhas e as cavernas', 'mountains and caves', 'las montañas y las cuevas'),
    boundary: 'Describes a place of preference.',
  },
  'environments.skies': {
    label: L('Céu aberto', 'Open sky', 'Cielo abierto'),
    definition: L('Ventos, altitude e horizontes sem teto.', 'Wind, altitude and horizons with no ceiling.', 'Vientos, altura y horizontes sin techo.'),
    person: L('o céu aberto e o vento', 'open sky and wind', 'el cielo abierto y el viento'),
    boundary: 'Describes a place of preference.',
  },
  'environments.settlements': {
    label: L('Cidades e casas', 'Towns and homes', 'Ciudades y casas'),
    definition: L('Ruas, casas, oficinas: lugares feitos por e para pessoas.', 'Streets, homes, workshops: places made by and for people.', 'Calles, casas, talleres: lugares hechos por y para la gente.'),
    person: L('as cidades e os lugares habitados', 'towns and lived-in places', 'las ciudades y los lugares habitados'),
    boundary: 'Describes a place of preference.',
  },
  'environments.extremes': {
    label: L('Extremos', 'Extremes', 'Extremos'),
    definition: L('Desertos, vulcões e neve: lugares de calor ou frio intensos.', 'Deserts, volcanoes and snow: places of fierce heat or cold.', 'Desiertos, volcanes y nieve: lugares de calor o frío intensos.'),
    person: L('os desertos, a neve e o fogo', 'deserts, snow and fire', 'los desiertos, la nieve y el fuego'),
    boundary: 'Describes a place of preference.',
  },
  // ---- Behavior ------------------------------------------------------------------------
  'behavior.nocturnal': {
    label: L('Ritmo noturno', 'Night rhythm', 'Ritmo nocturno'),
    definition: L('Ganhar energia quando o dia termina.', 'Gaining energy as the day ends.', 'Cobrar energía cuando el día termina.'),
    person: L('a noite e suas horas quietas', 'the night and its quiet hours', 'la noche y sus horas quietas'),
    boundary: 'Describes a rhythm; never sleep habits as health.',
  },
  'behavior.gregarious': {
    label: L('Vida em grupo', 'Group life', 'Vida en grupo'),
    definition: L('Fazer as coisas em bando, em equipe, junto.', 'Doing things as a pack, a team, together.', 'Hacer las cosas en manada, en equipo, juntos.'),
    person: L('fazer as coisas em grupo', 'doing things together', 'hacer las cosas en grupo'),
    boundary: 'Describes a way of acting.',
  },
  'behavior.swift': {
    label: L('Rapidez', 'Swiftness', 'Rapidez'),
    definition: L('Responder rápido e se mover com agilidade.', 'Responding fast and moving with agility.', 'Responder rápido y moverse con agilidad.'),
    person: L('a agilidade e a resposta rápida', 'agility and quick responses', 'la agilidad y la respuesta rápida'),
    boundary: 'Describes a pace; never competence.',
  },
  'behavior.unhurried': {
    label: L('Sem pressa', 'Unhurried', 'Sin prisa'),
    definition: L('Descansar, esperar e deixar o tempo correr.', 'Resting, waiting and letting time pass.', 'Descansar, esperar y dejar que el tiempo pase.'),
    person: L('descansar e não ter pressa', 'resting and taking your time', 'descansar y no tener prisa'),
    boundary: 'Describes a pace; never laziness as a judgement.',
  },
  'behavior.maker': {
    label: L('Construir e guardar', 'Building and keeping', 'Construir y guardar'),
    definition: L('Montar, colecionar, construir abrigo e guardar coisas.', 'Assembling, collecting, building shelter and storing things.', 'Montar, coleccionar, construir refugio y guardar cosas.'),
    person: L('construir e guardar', 'building and keeping things', 'construir y guardar'),
    boundary: 'Describes a way of acting.',
  },
  // ---- Instinct ------------------------------------------------------------------------
  'instinct.vigilant': {
    label: L('Vigilância', 'Vigilance', 'Vigilancia'),
    definition: L('Perceber o que muda ao redor antes dos outros.', 'Noticing what changes nearby before others do.', 'Percibir lo que cambia alrededor antes que los demás.'),
    person: L('perceber o que muda ao redor', 'noticing what changes around you', 'percibir lo que cambia alrededor'),
    boundary: 'Describes attention; never anxiety.',
  },
  'instinct.fierce': {
    label: L('Ímpeto', 'Ferocity', 'Ímpetu'),
    definition: L('Reagir com força quando é preciso enfrentar.', 'Answering with force when something must be faced.', 'Reaccionar con fuerza cuando hay que enfrentar algo.'),
    person: L('enfrentar com força', 'facing things head-on', 'enfrentar con fuerza'),
    boundary: 'Describes a reaction; never violence.',
  },
  'instinct.elusive': {
    label: L('Discrição', 'Elusiveness', 'Sigilo'),
    definition: L('Passar despercebido, se camuflar e escolher quando aparecer.', 'Going unnoticed, blending in and choosing when to appear.', 'Pasar desapercibido, camuflarse y elegir cuándo aparecer.'),
    person: L('passar despercebido', 'going unnoticed', 'pasar desapercibido'),
    boundary: 'Describes a reaction; never deceit.',
  },
  'instinct.intuitive': {
    label: L('Intuição', 'Intuition', 'Intuición'),
    definition: L('Sentir o clima e as emoções antes de explicá-los.', 'Sensing moods and feelings before explaining them.', 'Sentir el ambiente y las emociones antes de explicarlos.'),
    person: L('sentir antes de explicar', 'sensing before explaining', 'sentir antes de explicar'),
    boundary: 'Describes a way of reading situations; never a supernatural claim.',
  },
  'instinct.resilient': {
    label: L('Resistência', 'Resilience', 'Resistencia'),
    definition: L('Aguentar, se adaptar e seguir mesmo em condições difíceis.', 'Enduring, adapting and carrying on in hard conditions.', 'Aguantar, adaptarse y seguir incluso en condiciones difíciles.'),
    person: L('resistir e se adaptar', 'enduring and adapting', 'resistir y adaptarse'),
    boundary: 'Describes a reaction; never a judgement of strength.',
  },
} as const satisfies Record<string, TraitCopy>;

export type TraitKey = keyof typeof COPY;
export const TRAIT_KEYS = Object.keys(COPY) as TraitKey[];

/** Pairs that pull in opposite directions; mirrored so the registry validator accepts them. */
const OPPOSES: readonly (readonly [TraitKey, TraitKey])[] = [
  ['behavior.swift', 'behavior.unhurried'],
  ['aesthetics.luminous', 'aesthetics.shadowed'],
  ['aesthetics.soft', 'aesthetics.sleek'],
];
/** Pairs that share meaning; the engine must not count them as independent evidence. */
const OVERLAPS: readonly (readonly [TraitKey, TraitKey])[] = [
  ['personality.serene', 'behavior.unhurried'],
  ['personality.reserved', 'instinct.elusive'],
  ['values.protection', 'values.loyalty'],
];

export const REGISTRY_VERSION = 'registry-1.0-candidate';

function relations(key: TraitKey): TraitRecord['relations'] {
  const out: { kind: 'opposes' | 'overlaps'; target: TraitId }[] = [];
  for (const [a, b] of OPPOSES) {
    if (a === key) out.push({ kind: 'opposes', target: b as TraitId });
    if (b === key) out.push({ kind: 'opposes', target: a as TraitId });
  }
  for (const [a, b] of OVERLAPS) {
    if (a === key) out.push({ kind: 'overlaps', target: b as TraitId });
    if (b === key) out.push({ kind: 'overlaps', target: a as TraitId });
  }
  return out;
}

export const TRAIT_REGISTRY: TraitRegistry = {
  version: REGISTRY_VERSION,
  status: 'draft',
  traits: TRAIT_KEYS.map((key) => ({
    id: key as TraitId,
    dimension: key.split('.')[0] as CategoryId,
    label: COPY[key].label,
    definition: COPY[key].definition,
    signals: [],
    relations: relations(key),
    evidenceBoundary: COPY[key].boundary,
    ambiguities: [],
    introducedIn: REGISTRY_VERSION,
    status: 'draft',
  })),
};

export const traitCopy = (id: string): TraitCopy | undefined =>
  (COPY as Record<string, TraitCopy>)[id];

/** Short keys within a category, e.g. `curious` → `personality.curious`. */
export const traitsOf = (category: CategoryId): TraitKey[] =>
  TRAIT_KEYS.filter((k) => k.startsWith(`${category}.`));
