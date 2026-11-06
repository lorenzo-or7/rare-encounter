import coast from '../../features/quiz/preview/scenes/coast.svg';
import desert from '../../features/quiz/preview/scenes/desert.svg';
import forest from '../../features/quiz/preview/scenes/forest.svg';
import lake from '../../features/quiz/preview/scenes/lake.svg';
import mountains from '../../features/quiz/preview/scenes/mountains.svg';
import night from '../../features/quiz/preview/scenes/night.svg';
import { q, type QuestionDef } from './define';

/**
 * Environments: 45 questions (32 fundamental, 13 adaptive). Candidate content, v1.
 * The two image questions reuse the project's own scene illustrations (provisional art,
 * 4:3, Balanced Variety: four distinct places); final Hybrid Naturalism art is pending.
 */
const SCENES = { ratio: '4:3', comparison: 'balanced-variety' } as const;

export const ENVIRONMENTS: readonly QuestionDef[] = [
  q('en-001', 'f', ['Qual paisagem atrai você?', 'Which landscape draws you in?', '¿Qué paisaje te atrae?'], [
    ['woodland', 'Floresta', 'Forest', 'Bosque'],
    ['waters', 'Litoral', 'Coast', 'Costa'],
    ['heights', 'Montanhas', 'Mountains', 'Montañas'],
    ['extremes', 'Deserto', 'Desert', 'Desierto'],
  ], {
    format: 'photo',
    media: [forest, coast, mountains, desert],
    alt: [
      ['Uma floresta de pinheiros sob uma lua pálida', 'A pine forest under a pale moon', 'Un bosque de pinos bajo una luna pálida'],
      ['O mar ao pôr do sol', 'The sea at sunset', 'El mar al atardecer'],
      ['Picos com neve', 'Snow-capped peaks', 'Picos nevados'],
      ['Dunas sob um sol forte', 'Dunes under a bright sun', 'Dunas bajo un sol intenso'],
    ],
    art: SCENES,
    group: 'scene-photos',
  }),
  q('en-002', 'f', ['Onde você passaria um dia inteiro?', 'Where would you spend a whole day?', '¿Dónde pasarías un día entero?'], [
    ['skies', 'Sob o céu estrelado', 'Under the starry sky', 'Bajo el cielo estrellado'],
    ['waters', 'À beira de um lago', 'By a lake', 'Junto a un lago'],
    ['woodland', 'Na mata', 'In the woods', 'En el bosque'],
    ['heights', 'No alto das montanhas', 'High in the mountains', 'En lo alto de las montañas'],
  ], {
    format: 'photo',
    media: [night, lake, forest, mountains],
    alt: [
      ['Uma noite estrelada sobre colinas', 'A starry night over low hills', 'Una noche estrellada sobre colinas'],
      ['Um lago calmo com colinas verdes', 'A still lake with green hills', 'Un lago en calma con colinas verdes'],
      ['Uma floresta de pinheiros sob uma lua pálida', 'A pine forest under a pale moon', 'Un bosque de pinos bajo una luna pálida'],
      ['Picos com neve', 'Snow-capped peaks', 'Picos nevados'],
    ],
    art: SCENES,
    group: 'scene-photos',
  }),
  q('en-003', 'f', ['Qual elemento chama você?', 'Which element calls you?', '¿Qué elemento te llama?'], [
    ['extremes', 'Fogo', 'Fire', 'Fuego'],
    ['waters', 'Água', 'Water', 'Agua'],
    ['woodland', 'Terra', 'Earth', 'Tierra'],
    ['skies', 'Ar', 'Air', 'Aire'],
  ], { format: 'icon-text', media: ['fire', 'droplet', 'leaf', 'wind'], group: 'elements' }),
  q('en-004', 'f', ['Onde você montaria uma barraca por uma semana?', 'Where would you pitch a tent for a week?', '¿Dónde armarías una carpa por una semana?'], [
    ['woodland', 'Numa clareira no meio da floresta', 'In a clearing deep in the forest', 'En un claro en medio del bosque'],
    ['waters', 'Na areia, ouvindo o mar', 'On the sand, listening to the sea', 'En la arena, escuchando el mar'],
    ['heights', 'Num platô de pedra com vista', 'On a rocky ledge with a view', 'En una meseta de piedra con vista'],
    ['extremes', 'Nas dunas, sob um céu limpo', 'Among dunes, under a clear sky', 'En las dunas, bajo un cielo limpio'],
  ]),
  q('en-005', 'f', ['Qual caminho você escolheria para voltar para casa?', 'Which way home would you take?', '¿Qué camino elegirías para volver a casa?'], [
    ['settlements', 'Pelas ruas cheias de lojas e luzes', 'Through streets of shops and lights', 'Por calles llenas de tiendas y luces'],
    ['woodland', 'Por uma trilha entre árvores', 'Along a trail through the trees', 'Por un sendero entre árboles'],
    ['waters', 'Pela margem do rio', 'Along the riverbank', 'Por la orilla del río'],
    ['skies', 'Pelo alto, de teleférico', 'Up high, by cable car', 'Por lo alto, en teleférico'],
  ]),
  q('en-006', 'f', ['Que vista você gostaria da sua janela?', 'What view would you like from your window?', '¿Qué vista te gustaría desde tu ventana?'], [
    ['settlements', 'Telhados e luzes da cidade', 'Rooftops and city lights', 'Tejados y luces de la ciudad'],
    ['heights', 'Um pico nevado ao longe', 'A snowy peak in the distance', 'Un pico nevado a lo lejos'],
    ['waters', 'O mar até o horizonte', 'The sea out to the horizon', 'El mar hasta el horizonte'],
    ['woodland', 'Copas de árvores balançando', 'Treetops swaying', 'Copas de árboles meciéndose'],
  ]),
  q('en-007', 'f', ['Qual clima combina mais com você?', 'Which climate suits you best?', '¿Qué clima va más contigo?'], [
    ['extremes', 'Calor seco e intenso', 'Intense dry heat', 'Calor seco e intenso'],
    ['heights', 'Frio de montanha', 'Mountain cold', 'Frío de montaña'],
    ['waters', 'Brisa úmida do mar', 'A damp sea breeze', 'Brisa húmeda del mar'],
    ['woodland', 'Ameno, com chuva de vez em quando', 'Mild, with the odd rain shower', 'Templado, con lluvia de vez en cuando'],
  ]),
  q('en-008', 'f', ['Onde você se sente mais livre?', 'Where do you feel most free?', '¿Dónde te sientes más libre?'], [
    ['skies', 'No topo de um mirante, com vento no rosto', 'At a lookout, wind in your face', 'En un mirador, con viento en la cara'],
    ['waters', 'Boiando em água calma', 'Floating in calm water', 'Flotando en agua tranquila'],
    ['extremes', 'Num deserto sem ninguém', 'In an empty desert', 'En un desierto sin nadie'],
    ['settlements', 'Andando por uma cidade grande à noite', 'Walking a big city at night', 'Caminando por una gran ciudad de noche'],
  ]),
  q('en-009', 'f', ['Qual destes sons você ouviria para dormir?', 'Which of these sounds would you fall asleep to?', '¿Cuál de estos sonidos escucharías para dormir?'], [
    ['waters', 'Ondas na praia', 'Waves on the beach', 'Olas en la playa'],
    ['woodland', 'Grilos numa noite de campo', 'Crickets on a country night', 'Grillos en una noche de campo'],
    ['skies', 'Vento forte lá fora', 'Strong wind outside', 'Viento fuerte afuera'],
    ['settlements', 'O murmúrio distante da cidade', 'The distant hum of the city', 'El murmullo lejano de la ciudad'],
  ]),
  q('en-010', 'f', ['Qual destes lugares você exploraria primeiro?', 'Which of these places would you explore first?', '¿Cuál de estos lugares explorarías primero?'], [
    ['heights', 'Uma caverna com ecos', 'A cave full of echoes', 'Una cueva llena de ecos'],
    ['waters', 'Um recife de coral', 'A coral reef', 'Un arrecife de coral'],
    ['extremes', 'A cratera de um vulcão adormecido', 'The crater of a sleeping volcano', 'El cráter de un volcán dormido'],
    ['settlements', 'Uma cidade antiga abandonada', 'An abandoned ancient city', 'Una ciudad antigua abandonada'],
  ]),
  q('en-011', 'f', ['Que tipo de casa de férias você alugaria?', 'What kind of vacation home would you rent?', '¿Qué tipo de casa de vacaciones alquilarías?'], [
    ['woodland', 'Um chalé no meio do mato', 'A cabin deep in the woods', 'Una cabaña en medio del monte'],
    ['waters', 'Uma casa sobre palafitas', 'A house on stilts over water', 'Una casa sobre pilotes en el agua'],
    ['heights', 'Um refúgio de pedra na serra', 'A stone refuge in the hills', 'Un refugio de piedra en la sierra'],
    ['settlements', 'Um apartamento no centro histórico', 'An apartment in the old town', 'Un departamento en el casco histórico'],
  ]),
  q('en-012', 'f', ['O que você faria numa manhã de neve?', 'What would you do on a snowy morning?', '¿Qué harías en una mañana de nieve?'], [
    ['extremes', 'Sairia para caminhar na neve funda', 'Head out to walk in deep snow', 'Saldrías a caminar en la nieve profunda'],
    ['heights', 'Subiria até ver tudo branco lá de cima', 'Climb until everything is white below', 'Subirías hasta ver todo blanco desde arriba'],
    ['settlements', 'Ficaria num café vendo a rua mudar', 'Sit in a café watching the street change', 'Te quedarías en un café viendo cambiar la calle'],
    ['woodland', 'Procuraria pegadas de animais na mata', 'Look for animal tracks in the woods', 'Buscarías huellas de animales en el bosque'],
  ]),
  q('en-013', 'f', ['Qual destes caminhos tem mais a sua cara?', 'Which of these paths is most you?', '¿Cuál de estos caminos va más contigo?'], [
    ['heights', 'Um trilho estreito na encosta', 'A narrow track along a slope', 'Un sendero estrecho en la ladera'],
    ['waters', 'Uma ponte de madeira sobre o pântano', 'A wooden walkway over a marsh', 'Una pasarela de madera sobre el pantano'],
    ['woodland', 'Um caminho de terra entre campos', 'A dirt road between fields', 'Un camino de tierra entre campos'],
    ['settlements', 'Uma escadaria entre casas coloridas', 'A stairway between colorful houses', 'Una escalinata entre casas de colores'],
  ]),
  q('en-014', 'f', ['Onde você gostaria de ver o sol nascer?', 'Where would you like to watch the sunrise?', '¿Dónde te gustaría ver salir el sol?'], [
    ['heights', 'Do alto de uma montanha', 'From a mountaintop', 'Desde la cima de una montaña'],
    ['waters', 'De um barco no meio do mar', 'From a boat at sea', 'Desde un barco en alta mar'],
    ['skies', 'De um balão', 'From a hot-air balloon', 'Desde un globo aerostático'],
    ['extremes', 'Das dunas, com o deserto acordando', 'From the dunes as the desert wakes', 'Desde las dunas, con el desierto despertando'],
  ]),
  q('en-015', 'f', ['Qual destes passeios você faria sem pensar?', 'Which outing would you go on without thinking?', '¿Qué paseo harías sin pensarlo?'], [
    ['waters', 'Mergulho com snorkel', 'Snorkelling', 'Buceo con snorkel'],
    ['skies', 'Voo de parapente', 'A paragliding flight', 'Vuelo en parapente'],
    ['heights', 'Escalada em rocha', 'Rock climbing', 'Escalada en roca'],
    ['woodland', 'Trilha pela mata fechada', 'A hike through dense forest', 'Caminata por el bosque cerrado'],
  ]),
  q('en-016', 'f', ['Que lugar você gostaria de proteger para sempre?', 'Which place would you like to protect forever?', '¿Qué lugar te gustaría proteger para siempre?'], [
    ['woodland', 'Uma floresta antiga', 'An ancient forest', 'Un bosque antiguo'],
    ['waters', 'Uma baía de água cristalina', 'A bay of crystal water', 'Una bahía de agua cristalina'],
    ['extremes', 'Uma geleira', 'A glacier', 'Un glaciar'],
    ['settlements', 'Um bairro antigo cheio de histórias', 'An old neighborhood full of stories', 'Un barrio antiguo lleno de historias'],
  ]),
  q('en-017', 'f', ['Qual destes lugares parece mais com um lar?', 'Which of these places feels most like home?', '¿Cuál de estos lugares se siente más como un hogar?'], [
    ['settlements', 'Uma rua onde todos se conhecem', 'A street where everyone knows each other', 'Una calle donde todos se conocen'],
    ['woodland', 'Um sítio cercado de árvores', 'A smallholding surrounded by trees', 'Una granja rodeada de árboles'],
    ['waters', 'Uma vila de pescadores', 'A fishing village', 'Un pueblo de pescadores'],
    ['heights', 'Uma cidadezinha na serra', 'A small town in the hills', 'Un pueblito en la sierra'],
  ]),
  q('en-018', 'f', ['Onde você procuraria uma criatura rara?', 'Where would you look for a rare creature?', '¿Dónde buscarías una criatura rara?'], [
    ['heights', 'No fundo de uma caverna', 'Deep in a cave', 'En el fondo de una cueva'],
    ['waters', 'Nas profundezas de um lago', 'In the depths of a lake', 'En las profundidades de un lago'],
    ['skies', 'Entre as nuvens', 'Among the clouds', 'Entre las nubes'],
    ['extremes', 'Perto de um vulcão ativo', 'Near an active volcano', 'Cerca de un volcán activo'],
  ]),
  q('en-019', 'f', ['Qual destas estações do ano você escolheria para viajar?', 'Which season would you choose to travel in?', '¿Qué estación del año elegirías para viajar?'], [
    ['woodland', 'Primavera, com tudo florindo', 'Spring, with everything in bloom', 'Primavera, con todo en flor'],
    ['waters', 'Verão, para estar na água', 'Summer, to be in the water', 'Verano, para estar en el agua'],
    ['skies', 'Outono, com céu limpo e ventania', 'Autumn, with clear skies and gusts', 'Otoño, con cielo limpio y ventarrón'],
    ['extremes', 'Inverno rigoroso, com neve', 'Hard winter, with snow', 'Invierno riguroso, con nieve'],
  ]),
  q('en-020', 'f', ['Onde você colocaria um banco para pensar?', 'Where would you put a bench for thinking?', '¿Dónde pondrías un banco para pensar?'], [
    ['woodland', 'Debaixo de uma árvore enorme', 'Under a huge tree', 'Debajo de un árbol enorme'],
    ['waters', 'Num píer sobre a água', 'On a pier over the water', 'En un muelle sobre el agua'],
    ['heights', 'Num mirante de pedra', 'On a stone lookout', 'En un mirador de piedra'],
    ['settlements', 'Numa praça movimentada', 'In a busy square', 'En una plaza concurrida'],
  ]),
  q('en-021', 'f', ['Qual destas trilhas sonoras de viagem você escolheria?', 'Which travel soundtrack would you pick?', '¿Qué banda sonora de viaje elegirías?'], [
    ['settlements', 'Buzinas, vozes, música de rua', 'Horns, voices, street music', 'Bocinas, voces, música callejera'],
    ['skies', 'O vento assobiando no alto', 'Wind whistling up high', 'El viento silbando en lo alto'],
    ['waters', 'Gaivotas e marés', 'Gulls and tides', 'Gaviotas y mareas'],
    ['woodland', 'Pássaros acordando na mata', 'Birds waking in the woods', 'Pájaros despertando en el bosque'],
  ]),
  q('en-022', 'f', ['Que tipo de abrigo você construiria num lugar selvagem?', 'What kind of shelter would you build in the wild?', '¿Qué tipo de refugio construirías en un lugar salvaje?'], [
    ['woodland', 'Uma cabana de galhos e folhas', 'A hut of branches and leaves', 'Una choza de ramas y hojas'],
    ['heights', 'Um abrigo numa reentrância da rocha', 'A shelter in a rock overhang', 'Un refugio en un saliente de roca'],
    ['extremes', 'Um iglu', 'An igloo', 'Un iglú'],
    ['waters', 'Uma jangada coberta', 'A covered raft', 'Una balsa techada'],
  ]),
  q('en-023', 'f', ['Qual destes horizontes acalma você?', 'Which horizon calms you?', '¿Qué horizonte te calma?'], [
    ['waters', 'Água encontrando o céu', 'Water meeting sky', 'El agua encontrándose con el cielo'],
    ['heights', 'Cordilheiras em camadas', 'Layered mountain ranges', 'Cordilleras en capas'],
    ['extremes', 'Areia sem fim', 'Endless sand', 'Arena sin fin'],
    ['skies', 'Só céu, de cima de uma nuvem', 'Nothing but sky, from above the clouds', 'Solo cielo, desde encima de las nubes'],
  ]),
  q('en-024', 'f', ['Onde você passaria uma noite inteira acordado?', 'Where would you spend a whole night awake?', '¿Dónde pasarías una noche entera despierto?'], [
    ['skies', 'Deitado no campo olhando estrelas', 'Lying in a field watching the stars', 'Acostado en el campo mirando estrellas'],
    ['settlements', 'Numa cidade que nunca dorme', 'In a city that never sleeps', 'En una ciudad que nunca duerme'],
    ['extremes', 'Ao redor de uma fogueira no deserto', 'Around a fire in the desert', 'Alrededor de una fogata en el desierto'],
    ['waters', 'Num barco ouvindo o mar', 'On a boat listening to the sea', 'En un barco escuchando el mar'],
  ]),
  q('en-025', 'f', ['Qual destes lugares você escolheria para correr?', 'Where would you choose to go for a run?', '¿Dónde elegirías ir a correr?'], [
    ['waters', 'Na beira da praia', 'Along the beach', 'Por la orilla de la playa'],
    ['woodland', 'Por trilhas no bosque', 'On woodland trails', 'Por senderos en el bosque'],
    ['settlements', 'Pelas avenidas da cidade', 'Along city avenues', 'Por las avenidas de la ciudad'],
    ['heights', 'Subindo uma serra', 'Up a mountain road', 'Subiendo una sierra'],
  ]),
  q('en-026', 'f', ['Qual destes mercados você visitaria?', 'Which of these markets would you visit?', '¿Cuál de estos mercados visitarías?'], [
    ['settlements', 'Um mercado noturno lotado', 'A packed night market', 'Un mercado nocturno lleno de gente'],
    ['waters', 'Uma feira de peixes no porto', 'A fish market at the harbour', 'Una feria de pescado en el puerto'],
    ['woodland', 'Uma feira de produtores rurais', 'A farmers’ market', 'Una feria de productores rurales'],
    ['extremes', 'Um mercado de oásis no deserto', 'An oasis market in the desert', 'Un mercado de oasis en el desierto'],
  ]),
  q('en-027', 'f', ['Onde você encontraria silêncio de verdade?', 'Where would you find real silence?', '¿Dónde encontrarías silencio de verdad?'], [
    ['heights', 'Dentro de uma caverna', 'Inside a cave', 'Dentro de una cueva'],
    ['extremes', 'Num campo de neve', 'On a snowfield', 'En un campo de nieve'],
    ['skies', 'Num voo de planador', 'On a glider flight', 'En un vuelo en planeador'],
    ['woodland', 'Numa floresta depois da chuva', 'In a forest after rain', 'En un bosque después de la lluvia'],
  ]),
  q('en-028', 'f', ['Qual destes meios de viagem você escolheria?', 'Which way of traveling would you choose?', '¿Qué forma de viajar elegirías?'], [
    ['waters', 'Um veleiro', 'A sailboat', 'Un velero'],
    ['skies', 'Um avião pequeno', 'A small plane', 'Una avioneta'],
    ['settlements', 'Um trem cruzando cidades', 'A train through towns', 'Un tren cruzando ciudades'],
    ['extremes', 'Um jipe pelo deserto', 'A jeep across the desert', 'Un jeep por el desierto'],
  ]),
  q('en-029', 'f', ['Onde você ficaria mais à vontade numa chuva forte?', 'Where would you be most at ease in a heavy downpour?', '¿Dónde estarías más a gusto con una lluvia fuerte?'], [
    ['woodland', 'Debaixo das árvores', 'Under the trees', 'Bajo los árboles'],
    ['settlements', 'Numa marquise vendo a rua', 'Under an awning watching the street', 'Bajo un toldo mirando la calle'],
    ['waters', 'Dentro da água, se molhando de vez', 'In the water, getting soaked anyway', 'Dentro del agua, mojándote del todo'],
    ['heights', 'Numa gruta, ouvindo a chuva', 'In a grotto, listening to the rain', 'En una gruta, escuchando la lluvia'],
  ]),
  q('en-030', 'f', ['Que lugar você mostraria a um visitante?', 'Which place would you show a visitor?', '¿Qué lugar le mostrarías a un visitante?'], [
    ['settlements', 'O bairro mais vivo da cidade', 'The liveliest part of town', 'El barrio más animado de la ciudad'],
    ['woodland', 'Um parque cheio de árvores antigas', 'A park full of old trees', 'Un parque lleno de árboles antiguos'],
    ['waters', 'A praia escondida que poucos conhecem', 'The hidden beach few people know', 'La playa escondida que pocos conocen'],
    ['skies', 'O ponto mais alto, para ver tudo', 'The highest point, to see everything', 'El punto más alto, para verlo todo'],
  ]),
  q('en-031', 'f', ['Onde você gostaria de acordar amanhã?', 'Where would you like to wake up tomorrow?', '¿Dónde te gustaría despertar mañana?'], [
    ['extremes', 'Num acampamento no gelo', 'At a camp on the ice', 'En un campamento sobre el hielo'],
    ['woodland', 'Numa casa na árvore', 'In a treehouse', 'En una casa del árbol'],
    ['waters', 'Num barco ancorado', 'On an anchored boat', 'En un barco anclado'],
    ['settlements', 'Num hotel no centro de uma metrópole', 'In a hotel in the heart of a big city', 'En un hotel en el centro de una metrópoli'],
  ]),
  q('en-032', 'f', ['Qual destes lugares você desenharia?', 'Which of these places would you draw?', '¿Cuál de estos lugares dibujarías?'], [
    ['heights', 'Uma montanha', 'A mountain', 'Una montaña'],
    ['waters', 'Uma onda', 'A wave', 'Una ola'],
    ['skies', 'O vento', 'The wind', 'El viento'],
    ['settlements', 'Uma casa', 'A house', 'Una casa'],
  ], { format: 'icon-text', media: ['mountain', 'wave', 'wind', 'home'] }),
  // ---- Adaptive --------------------------------------------------------------------------
  q('en-033', 'a', ['Entre mar e montanha, para onde você iria agora?', 'Between sea and mountain, where would you go now?', 'Entre mar y montaña, ¿adónde irías ahora?'], [
    ['waters', 'Mar, sem dúvida', 'Sea, no question', 'Mar, sin duda'],
    ['heights', 'Montanha, sem dúvida', 'Mountain, no question', 'Montaña, sin duda'],
    ['woodland', 'Nenhum: uma floresta no meio', 'Neither: a forest in between', 'Ninguno: un bosque en el medio'],
    ['skies', 'O ponto mais alto de onde se vê os dois', 'The highest point that sees both', 'El punto más alto desde donde se ven los dos'],
  ]),
  q('en-034', 'a', ['O que mais encanta você numa cidade?', 'What enchants you most about a city?', '¿Qué te encanta más de una ciudad?'], [
    ['settlements', 'As ruas cheias de vida', 'Streets full of life', 'Las calles llenas de vida'],
    ['woodland', 'Os parques no meio dela', 'The parks within it', 'Los parques en medio de ella'],
    ['waters', 'O rio que a atravessa', 'The river running through it', 'El río que la atraviesa'],
    ['skies', 'A vista do alto dos prédios', 'The view from the rooftops', 'La vista desde lo alto de los edificios'],
  ]),
  q('en-035', 'a', ['Calor extremo ou frio extremo?', 'Extreme heat or extreme cold?', '¿Calor extremo o frío extremo?'], [
    ['extremes', 'Qualquer um, desde que seja intenso', 'Either, as long as it is intense', 'Cualquiera, mientras sea intenso'],
    ['heights', 'Frio de altitude, com ar rarefeito', 'Thin, high-altitude cold', 'Frío de altura, con aire enrarecido'],
    ['waters', 'Nenhum: prefiro a brisa do mar', 'Neither: I prefer a sea breeze', 'Ninguno: prefiero la brisa del mar'],
    ['woodland', 'Nenhum: prefiro a sombra das árvores', 'Neither: I prefer the shade of trees', 'Ninguno: prefiero la sombra de los árboles'],
  ]),
  q('en-036', 'a', ['Que lugar parece guardar mais segredos?', 'Which place seems to keep the most secrets?', '¿Qué lugar parece guardar más secretos?'], [
    ['heights', 'Uma caverna sem fim', 'An endless cave', 'Una cueva sin fin'],
    ['waters', 'O fundo do oceano', 'The ocean floor', 'El fondo del océano'],
    ['woodland', 'Uma floresta antiga', 'An ancient forest', 'Un bosque antiguo'],
    ['settlements', 'Os porões de uma cidade velha', 'The cellars of an old city', 'Los sótanos de una ciudad vieja'],
  ]),
  q('en-037', 'a', ['Onde você queria ter um esconderijo?', 'Where would you want a hideaway?', '¿Dónde querrías tener un escondite?'], [
    ['woodland', 'No meio do mato', 'Deep in the bush', 'En medio del monte'],
    ['heights', 'Numa fenda da montanha', 'In a mountain crevice', 'En una grieta de la montaña'],
    ['extremes', 'Num oásis perdido', 'At a lost oasis', 'En un oasis perdido'],
    ['skies', 'Numa torre acima das nuvens', 'In a tower above the clouds', 'En una torre sobre las nubes'],
  ]),
  q('en-038', 'a', ['Qual destes ventos você gostaria de sentir?', 'Which of these winds would you like to feel?', '¿Cuál de estos vientos te gustaría sentir?'], [
    ['skies', 'O vento lá no alto', 'The wind up high', 'El viento en lo alto'],
    ['waters', 'A brisa salgada', 'The salty breeze', 'La brisa salada'],
    ['extremes', 'O vento quente do deserto', 'The hot desert wind', 'El viento cálido del desierto'],
    ['woodland', 'O vento mexendo as folhas', 'The wind stirring the leaves', 'El viento moviendo las hojas'],
  ]),
  q('en-039', 'a', ['Se pudesse viver num lugar extremo por um mês, seria…', 'If you could live somewhere extreme for a month, it would be…', 'Si pudieras vivir un mes en un lugar extremo, sería…'], [
    ['extremes', 'Uma estação polar', 'A polar station', 'Una estación polar'],
    ['waters', 'Uma base submarina', 'An underwater base', 'Una base submarina'],
    ['heights', 'Um mosteiro no alto da montanha', 'A monastery high on a mountain', 'Un monasterio en lo alto de la montaña'],
    ['skies', 'Um dirigível', 'An airship', 'Un dirigible'],
  ]),
  q('en-040', 'a', ['O que você mais gosta de encontrar numa caminhada?', 'What do you most like to come across on a walk?', '¿Qué es lo que más te gusta encontrar en una caminata?'], [
    ['waters', 'Uma cachoeira', 'A waterfall', 'Una cascada'],
    ['woodland', 'Uma árvore gigantesca', 'A giant tree', 'Un árbol gigantesco'],
    ['heights', 'Uma formação de rocha estranha', 'A strange rock formation', 'Una formación rocosa extraña'],
    ['settlements', 'Uma vila escondida', 'A hidden village', 'Un pueblo escondido'],
  ]),
  q('en-041', 'a', ['Qual destes lugares tem a melhor noite?', 'Which of these places has the best night?', '¿Cuál de estos lugares tiene la mejor noche?'], [
    ['skies', 'Um campo sem luz com a Via Láctea', 'A dark field under the Milky Way', 'Un campo sin luz bajo la Vía Láctea'],
    ['settlements', 'Uma cidade iluminada', 'A city lit up', 'Una ciudad iluminada'],
    ['extremes', 'Um deserto gelado à noite', 'A desert, freezing at night', 'Un desierto helado de noche'],
    ['waters', 'Uma praia com lua cheia', 'A beach under a full moon', 'Una playa con luna llena'],
  ]),
  q('en-042', 'a', ['Para onde você fugiria por um dia?', 'Where would you escape to for a day?', '¿Adónde escaparías por un día?'], [
    ['woodland', 'Uma chácara cheia de bichos', 'A farm full of animals', 'Una granja llena de animales'],
    ['waters', 'Uma ilha deserta', 'A desert island', 'Una isla desierta'],
    ['settlements', 'Uma cidade que nunca visitei', 'A city I have never visited', 'Una ciudad que nunca visité'],
    ['heights', 'Um pico que dá para subir a pé', 'A peak you can climb on foot', 'Un pico que se puede subir a pie'],
  ]),
  q('en-043', 'a', ['Qual destes lugares você escolheria como seu ponto de encontro?', 'Which place would you choose as your meeting point?', '¿Qué lugar elegirías como tu punto de encuentro?'], [
    ['settlements', 'A fonte da praça principal', 'The fountain in the main square', 'La fuente de la plaza principal'],
    ['woodland', 'A árvore mais velha do parque', 'The oldest tree in the park', 'El árbol más viejo del parque'],
    ['waters', 'O fim do píer', 'The end of the pier', 'El final del muelle'],
    ['skies', 'O alto da torre', 'The top of the tower', 'Lo alto de la torre'],
  ]),
  q('en-044', 'a', ['Que paisagem você ouviria de olhos fechados?', 'Which landscape would you listen to with your eyes closed?', '¿Qué paisaje escucharías con los ojos cerrados?'], [
    ['waters', 'Um rio correndo', 'A river running', 'Un río corriendo'],
    ['extremes', 'Uma fogueira estalando', 'A crackling fire', 'Una fogata crepitando'],
    ['woodland', 'Folhas e pássaros', 'Leaves and birds', 'Hojas y pájaros'],
    ['skies', 'Vento num campo aberto', 'Wind across an open field', 'Viento en un campo abierto'],
  ], { format: 'icon-text', media: ['droplet', 'fire', 'leaf', 'wind'], group: 'elements' }),
  q('en-045', 'a', ['Onde a sua jornada terminaria?', 'Where would your journey end?', '¿Dónde terminaría tu viaje?'], [
    ['heights', 'No cume mais alto', 'At the highest summit', 'En la cumbre más alta'],
    ['waters', 'No fim do mundo, à beira-mar', 'At the end of the world, by the sea', 'En el fin del mundo, junto al mar'],
    ['settlements', 'De volta à cidade onde tudo começou', 'Back in the town where it all began', 'De vuelta en la ciudad donde todo empezó'],
    ['extremes', 'No coração do deserto', 'In the heart of the desert', 'En el corazón del desierto'],
  ]),
];
