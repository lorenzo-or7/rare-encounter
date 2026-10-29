import type { QuestionArt } from '../../../domain/answer-art';
import type { CatalogVersion } from '../../../domain/catalog';
import { CATEGORY_IDS, type CategoryId } from '../../../domain/categories';
import type { LocalizedText } from '../../../domain/localized';
import { MODES, type ModeId } from '../../../domain/modes';
import type { QuestionSource } from '../../../domain/question-source';
import type {
  AnswerId,
  AnswerOption,
  Question,
  QuestionBankVersion,
  QuestionFormat,
  QuestionId,
} from '../../../domain/questions';
import coast from './scenes/coast.svg';
import desert from './scenes/desert.svg';
import forest from './scenes/forest.svg';
import lake from './scenes/lake.svg';
import mountains from './scenes/mountains.svg';
import night from './scenes/night.svg';

/**
 * PREVIEW CONTENT ONLY. Twelve sample questions, two per category, written to exercise
 * the three formats while the real bank (Phase 04) does not exist. They carry no trait
 * effects, so nothing can be scored from them. A session uses the real mode length and
 * category quotas; to fill it, the templates repeat under distinct question ids, and the
 * quiz says so in its preview notice.
 */

const L = (en: string, ptBR: string, es: string): LocalizedText => ({ en, 'pt-BR': ptBR, es });

interface Template {
  readonly key: string;
  readonly category: CategoryId;
  readonly format: QuestionFormat;
  readonly art?: QuestionArt;
  readonly prompt: LocalizedText;
  readonly options: readonly AnswerOption[];
}

const option = (
  key: string,
  label: LocalizedText,
  media?: { readonly src: string; readonly alt: LocalizedText },
): AnswerOption => ({ id: key as AnswerId, label, ...(media ? { media } : {}), effects: {} });

/** Icon-text options name a Hugeicons glyph as `icon:<name>`; the quiz maps it to the icon. */
const icon = (name: string, alt: LocalizedText) => ({ src: `icon:${name}`, alt });

/** The preview scenes are distinct places: 4:3, Balanced Variety. */
const SCENES: QuestionArt = { ratio: '4:3', comparison: 'balanced-variety' };

const TEMPLATES: readonly Template[] = [
  {
    key: 'personality-plans',
    category: 'personality',
    format: 'text',
    prompt: L(
      'Plans change at the last minute. What do you do?',
      'Os planos mudam em cima da hora. O que você faz?',
      'Los planes cambian a último momento. ¿Qué haces?',
    ),
    options: [
      option('plans-enjoy', L('Enjoy the surprise', 'Aproveito a surpresa', 'Disfruto la sorpresa')),
      option('plans-new', L('Make a new plan right away', 'Faço um novo plano na hora', 'Hago un plan nuevo enseguida')),
      option('plans-pause', L('Take a quiet moment first', 'Tiro um momento de silêncio antes', 'Me tomo un momento de calma')),
      option('plans-ask', L('Ask the others what they think', 'Pergunto o que os outros acham', 'Pregunto qué piensan los demás')),
    ],
  },
  {
    key: 'personality-pace',
    category: 'personality',
    format: 'icon-text',
    prompt: L('Which pace feels most like you?', 'Qual ritmo mais combina com você?', '¿Qué ritmo se parece más a ti?'),
    options: [
      option('pace-spark', L('Quick and sudden', 'Rápido e repentino', 'Rápido y repentino'), icon('flash', L('Lightning', 'Raio', 'Rayo'))),
      option('pace-flow', L('Steady, like a current', 'Constante, como uma correnteza', 'Constante, como una corriente'), icon('wave', L('Wave', 'Onda', 'Ola'))),
      option('pace-still', L('Calm and unhurried', 'Calmo e sem pressa', 'Tranquilo y sin prisa'), icon('mountain', L('Mountain', 'Montanha', 'Montaña'))),
      option('pace-shift', L('Always changing', 'Sempre mudando', 'Siempre cambiante'), icon('wind', L('Wind', 'Vento', 'Viento'))),
    ],
  },
  {
    key: 'aesthetics-landscape',
    category: 'aesthetics',
    format: 'photo',
    art: SCENES,
    prompt: L('Which landscape draws you in?', 'Qual paisagem atrai você?', '¿Qué paisaje te atrae?'),
    options: [
      option('land-forest', L('Forest', 'Floresta', 'Bosque'), { src: forest, alt: L('A pine forest under a pale moon', 'Uma floresta de pinheiros sob uma lua pálida', 'Un bosque de pinos bajo una luna pálida') }),
      option('land-coast', L('Coast', 'Litoral', 'Costa'), { src: coast, alt: L('The sea at sunset', 'O mar ao pôr do sol', 'El mar al atardecer') }),
      option('land-mountains', L('Mountains', 'Montanhas', 'Montañas'), { src: mountains, alt: L('Snow-capped peaks', 'Picos com neve', 'Picos nevados') }),
      option('land-desert', L('Desert', 'Deserto', 'Desierto'), { src: desert, alt: L('Dunes under a bright sun', 'Dunas sob um sol forte', 'Dunas bajo un sol intenso') }),
    ],
  },
  {
    key: 'aesthetics-light',
    category: 'aesthetics',
    format: 'icon-text',
    prompt: L('Which light do you love most?', 'Qual luz você mais ama?', '¿Qué luz te gusta más?'),
    options: [
      option('light-dawn', L('First light at dawn', 'A primeira luz da manhã', 'La primera luz del alba'), icon('sunrise', L('Sunrise', 'Nascer do sol', 'Amanecer'))),
      option('light-noon', L('Full midday sun', 'O sol forte do meio-dia', 'El sol pleno del mediodía'), icon('sun', L('Sun', 'Sol', 'Sol'))),
      option('light-dusk', L('Golden dusk', 'O fim de tarde dourado', 'El atardecer dorado'), icon('sunset', L('Sunset', 'Pôr do sol', 'Puesta de sol'))),
      option('light-moon', L('Moonlight', 'A luz da lua', 'La luz de la luna'), icon('moon', L('Moon', 'Lua', 'Luna'))),
    ],
  },
  {
    key: 'values-friendship',
    category: 'values',
    format: 'text',
    prompt: L(
      'What matters most in a friendship?',
      'O que mais importa em uma amizade?',
      '¿Qué es lo más importante en una amistad?',
    ),
    options: [
      option('friend-loyal', L('Loyalty', 'Lealdade', 'Lealtad')),
      option('friend-honest', L('Honesty, even when it is hard', 'Sinceridade, mesmo quando é difícil', 'Sinceridad, aunque cueste')),
      option('friend-adventure', L('Adventures together', 'Aventuras juntos', 'Aventuras juntos')),
      option('friend-quiet', L('Understanding without words', 'Entender sem precisar falar', 'Entenderse sin palabras')),
    ],
  },
  {
    key: 'values-protect',
    category: 'values',
    format: 'text',
    prompt: L('What do you protect first?', 'O que você protege primeiro?', '¿Qué proteges primero?'),
    options: [
      option('protect-people', L('The people close to me', 'As pessoas próximas', 'A las personas cercanas')),
      option('protect-freedom', L('My freedom', 'Minha liberdade', 'Mi libertad')),
      option('protect-ideas', L('My ideas', 'Minhas ideias', 'Mis ideas')),
      option('protect-peace', L('My peace of mind', 'Minha paz', 'Mi tranquilidad')),
    ],
  },
  {
    key: 'environments-day',
    category: 'environments',
    format: 'photo',
    art: SCENES,
    prompt: L(
      'Where would you spend a whole day?',
      'Onde você passaria um dia inteiro?',
      '¿Dónde pasarías un día entero?',
    ),
    options: [
      option('day-night', L('Under the stars', 'Sob as estrelas', 'Bajo las estrellas'), { src: night, alt: L('A starry night over low hills', 'Uma noite estrelada sobre colinas', 'Una noche estrellada sobre colinas') }),
      option('day-lake', L('By a lake', 'À beira de um lago', 'Junto a un lago'), { src: lake, alt: L('A still lake with green hills', 'Um lago calmo com colinas verdes', 'Un lago en calma con colinas verdes') }),
      option('day-forest', L('In the woods', 'Na mata', 'En el bosque'), { src: forest, alt: L('A pine forest under a pale moon', 'Uma floresta de pinheiros sob uma lua pálida', 'Un bosque de pinos bajo una luna pálida') }),
      option('day-coast', L('On the shore', 'Na praia', 'En la orilla'), { src: coast, alt: L('The sea at sunset', 'O mar ao pôr do sol', 'El mar al atardecer') }),
    ],
  },
  {
    key: 'environments-element',
    category: 'environments',
    format: 'icon-text',
    prompt: L('Which element calls you?', 'Qual elemento chama você?', '¿Qué elemento te llama?'),
    options: [
      option('element-fire', L('Fire', 'Fogo', 'Fuego'), icon('fire', L('Flame', 'Chama', 'Llama'))),
      option('element-water', L('Water', 'Água', 'Agua'), icon('droplet', L('Drop of water', 'Gota de água', 'Gota de agua'))),
      option('element-earth', L('Earth', 'Terra', 'Tierra'), icon('leaf', L('Leaf', 'Folha', 'Hoja'))),
      option('element-air', L('Air', 'Ar', 'Aire'), icon('wind', L('Wind', 'Vento', 'Viento'))),
    ],
  },
  {
    key: 'behavior-group',
    category: 'behavior',
    format: 'text',
    prompt: L(
      'In a group, you are usually the one who…',
      'Em grupo, você costuma ser quem…',
      'En grupo, sueles ser quien…',
    ),
    options: [
      option('group-starts', L('Gets things started', 'Dá o primeiro passo', 'Da el primer paso')),
      option('group-holds', L('Keeps everyone together', 'Mantém todo mundo unido', 'Mantiene unido al grupo')),
      option('group-notices', L('Notices the details', 'Repara nos detalhes', 'Se fija en los detalles')),
      option('group-calms', L('Brings the calm', 'Traz a calma', 'Pone la calma')),
    ],
  },
  {
    key: 'behavior-recharge',
    category: 'behavior',
    format: 'photo',
    art: SCENES,
    prompt: L('Where do you recharge?', 'Onde você recarrega as energias?', '¿Dónde recargas energía?'),
    options: [
      option('recharge-mountains', L('High up', 'No alto', 'En lo alto'), { src: mountains, alt: L('Snow-capped peaks', 'Picos com neve', 'Picos nevados') }),
      option('recharge-desert', L('Somewhere vast and empty', 'Num lugar amplo e vazio', 'En un lugar amplio y vacío'), { src: desert, alt: L('Dunes under a bright sun', 'Dunas sob um sol forte', 'Dunas bajo un sol intenso') }),
      option('recharge-lake', L('Near still water', 'Perto de águas calmas', 'Cerca de aguas tranquilas'), { src: lake, alt: L('A still lake with green hills', 'Um lago calmo com colinas verdes', 'Un lago en calma con colinas verdes') }),
      option('recharge-night', L('Out in the night', 'Lá fora, à noite', 'Afuera, de noche'), { src: night, alt: L('A starry night over low hills', 'Uma noite estrelada sobre colinas', 'Una noche estrellada sobre colinas') }),
    ],
  },
  {
    key: 'instinct-path',
    category: 'instinct',
    format: 'icon-text',
    prompt: L('The path splits in two. You…', 'O caminho se divide em dois. Você…', 'El camino se divide en dos. Tú…'),
    options: [
      option('path-light', L('Take the sunlit path', 'Segue pelo caminho ensolarado', 'Tomas el camino soleado'), icon('sun', L('Sun', 'Sol', 'Sol'))),
      option('path-shadow', L('Take the shaded path', 'Segue pelo caminho na sombra', 'Tomas el camino en sombra'), icon('moon', L('Moon', 'Lua', 'Luna'))),
      option('path-listen', L('Stop and listen first', 'Para e escuta antes', 'Te detienes a escuchar'), icon('ear', L('Ear', 'Ouvido', 'Oído'))),
      option('path-own', L('Make your own way', 'Abre o seu próprio caminho', 'Abres tu propio camino'), icon('route', L('Route', 'Rota', 'Ruta'))),
    ],
  },
  {
    key: 'instinct-sound',
    category: 'instinct',
    format: 'text',
    prompt: L(
      'You hear a sound in the dark. You…',
      'Você ouve um som no escuro. Você…',
      'Oyes un ruido en la oscuridad. Tú…',
    ),
    options: [
      option('sound-toward', L('Walk toward it', 'Vai na direção dele', 'Vas hacia él')),
      option('sound-still', L('Stay perfectly still', 'Fica imóvel', 'Te quedas inmóvil')),
      option('sound-call', L('Call out', 'Chama em voz alta', 'Llamas en voz alta')),
      option('sound-away', L('Quietly move away', 'Se afasta em silêncio', 'Te alejas en silencio')),
    ],
  },
];

const BY_CATEGORY = new Map<CategoryId, readonly Template[]>(
  CATEGORY_IDS.map((c) => [c, TEMPLATES.filter((t) => t.category === c)]),
);
const BY_KEY = new Map(TEMPLATES.map((t) => [t.key, t]));

/** Instance ids look like `preview-07~values-friendship`: unique per slot, template after `~`. */
const instanceId = (slot: number, key: string) =>
  `preview-${String(slot).padStart(2, '0')}~${key}` as QuestionId;

/**
 * Fills the mode's category quotas round-robin (one question per category per round), so
 * every category and all three formats appear within the first six questions.
 */
function sequence(mode: ModeId): QuestionId[] {
  const remaining = new Map(CATEGORY_IDS.map((c) => [c, MODES[mode].quotas[c]]));
  const used = new Map(CATEGORY_IDS.map((c) => [c, 0]));
  const ids: QuestionId[] = [];
  while (ids.length < mode) {
    for (const category of CATEGORY_IDS) {
      const left = remaining.get(category) ?? 0;
      const pool = BY_CATEGORY.get(category) ?? [];
      if (left === 0 || pool.length === 0) continue;
      const n = used.get(category) ?? 0;
      const template = pool[n % pool.length];
      if (!template) continue;
      ids.push(instanceId(ids.length + 1, template.key));
      remaining.set(category, left - 1);
      used.set(category, n + 1);
    }
  }
  return ids;
}

export const PREVIEW_SOURCE: QuestionSource = {
  bankVersion: 'preview-1' as QuestionBankVersion,
  catalogVersion: 'none' as CatalogVersion,
  preview: true,
  start: sequence,
  question(id) {
    const key = id.split('~')[1];
    const template = key ? BY_KEY.get(key) : undefined;
    if (!template) return undefined;
    const question: Question = {
      id,
      revision: 1,
      category: template.category,
      role: 'fundamental',
      format: template.format,
      ...(template.art ? { art: template.art } : {}),
      prompt: template.prompt,
      options: template.options,
    };
    return question;
  },
};
