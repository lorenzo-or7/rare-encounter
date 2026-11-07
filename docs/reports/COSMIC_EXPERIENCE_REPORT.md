# Prompt Mestre 02 — Cosmic Experience · Relatório

Branch `feature/cosmic-experience`, criada a partir de `feature/functional-refinement` (`1c3fa1b`). Commit local; sem push, merge, deploy ou publicação no Pages.

Capturas: `docs/reports/cosmic-experience/` (isoladas no Playwright/Chromium, contexto limpo).

## 1. Resumo visual
- Todas as telas vivem num **cosmos** compartilhado (`CosmicBackdrop`):
  - nebulosas feitas dos acentos do tema ativo e estrelas em duas profundidades com parallax leve de cursor;
  - faixas de energia, cristais facetados e orbes.
- As intensidades variam por tela: rica na landing, discreta no quiz, a mais profunda nos resultados, e um cenário estático no loading.
- **Desempenho:** só transform e opacity, uma camada `fixed` com `contain: strict`.
- **Temas e modos:** as 6 paletas e os modos claro e escuro continuam. O modo claro tem céu pálido e pontos de tinta, não noite invertida.
- **Linguagem:** menos caixas. Usa linhas finas de luz, cantos assimétricos (dois retos, dois arredondados), contornos luminosos e superfícies abertas.

## 2. Componentes novos ou alterados
- **Novos:**
  - `components/cosmos/CosmicBackdrop`;
  - `features/preparation/PortalGlyph`;
  - `pages/landing/sections/StepGlyph`;
  - `pages/landing/Landing.css` (storytelling);
  - `features/results/ResultsVoyage` + `voyage.ts` (lógica pura do loading);
  - `scripts/setup-media.mjs`.
- **Alterados:** SiteNav, Hero, LandingPage, Discovery, Begin, ArchetypeCard, ModeOption e PreparationScreen, QuizHeader, QuizScreen e QuestionView, ResultsPhase, ResultsExperience, ResultCard, `explain.ts`, `tokens.css`, mensagens nos 3 idiomas.
- **React Bits originais:** sem alteração (`check:vendor`: 10 arquivos intactos). O Stepper, o BorderGlow, o StarBorder, o GradientText e o GhostFibers continuam em uso.

## 3. Hero
- **Mensagem:** a aprovada continua.
- **Animações:**
  - entrada cinematográfica palavra por palavra (cada palavra sobe de uma máscara);
  - a frase em gradiente chega por último e acende um halo controlado, uma única vez;
  - luz volumetrica com parallax de scroll;
  - o texto sobe e esmaece ao sair da tela;
  - parallax de cursor no cosmos (só em ponteiro fino);
  - o CTA tem seta que avança no hover/foco, mantendo o StarBorder com a luz percorrendo a borda.
- **Reduced motion:** tudo estático e visível de imediato (teste existente).

## 4. Navbar
- **Composição:** sem cápsula. É uma linha aberta alinhada à coluna de conteúdo, com logo à esquerda e seções e configurações à direita.
- **Scroll:** ela encolhe e ganha uma faixa translúcida com blur controlado e uma linha de luz embaixo.
- **Indicador ativo:** linha luminosa com halo, posição animada por mola (Motion `layoutId`). O hover mostra uma linha fina.
- **Mobile:** composição própria (logo e menu), com o mesmo material.
- **Preservado:** navegação completa, folha de configurações, foco e a11y.

## 5. Tutorial ("Como a descoberta funciona")
- **Estrutura:** os mesmos 3 passos no Stepper original, sem moldura.
- **Linha de progressão:** passa pelo centro de 3 marcadores numerados luminosos. O ativo tem anel e brilho, e a luz embaixo dele se move com o glider original.
- **Cada passo:** tem um desenho próprio traçado em luz ao abrir (órbita, duas órbitas, carta com faísca).
- **Mobile:** o desenho fica acima do texto.
- **Divergência:** o restyle é feito só por CSS na seção, sem tocar no componente.

## 6. Jornadas 30 / 60 / 90 (portais)
- **Os portais:** 30 é um anel, leve e calmo. 60 tem dois anéis, um girando, energético. 90 tem três anéis em sentidos opostos em volta de um núcleo eclipsado, intenso e misterioso. Mais anéis indicam mais perguntas, sem alegação de precisão.
- **Landing ("Comece sua jornada"):** os portais são prévia, sem hover. Não fingem ser selecionáveis.
- **Preparação (seleção real, radio nativo):**
  - o hover aprofunda o portal;
  - a escolha abre o portal e acelera os anéis;
  - check e borda de destaque continuam;
  - nada começa sem "Confirmar profundidade".

## 7. Cards Etéreo, Instintivo e Radiante (landing)
- **Novo:** brilho holográfico espectral que segue o ponteiro, mascarado na arte, somado ao reflexo e ao tilt existentes.
- **Mantido do Prompt 01:** revelação e botão dentro da carta (verificado a 320, 375, 768, 1024 e 1440 px).

## 8. Quiz
- **Fundo:** cosmos discreto.
- **Cabeçalho:** faixa aberta com linha de luz.
- **Barra de progresso:** holográfica, uma linha com preenchimento iridescente, cabeça de cometa e uma varredura de luz a cada avanço. Só transform. O `progressbar` acessível é o mesmo.
- **Alternativas:** planos translúcidos com silhueta cristalina e linha fina.
  - Luz lateral que cresce no hover e preenche a borda na escolha, com onda de energia.
  - Indicador próprio: um anel que se enche com check e brilho, então a forma muda, não só a cor.
- **Ritmo:** a confirmação continua breve (300 ms aprovados), e a transição horizontal é a mesma.
- **"Nenhuma dessas opções":** segue secundário, centralizado entre duas linhas finas, fácil de achar.
- **Telas estreitas:** 320 e 375 px sem scroll lateral (testado).

## 9. Aviso das 3 anulações
- **Visual, conforme a referência:**
  - superfície violeta escura com moldura dourada e luz que percorre a borda superior uma vez;
  - pílula "ATENÇÃO", triângulo de alerta dourado;
  - título com a última palavra em ouro ("misteriosa…"), descrição e CTA "Continuar jornada →";
  - um traço cósmico sutil.
- **Comportamento:** entrada suave. Fica no fluxo da página, não é modal nem toast e não bloqueia as respostas.
- **Mantidos:** gatilho, persistência, traduções e região `role="status"`.
- **Chave nova:** `quiz.voidNotice.eyebrow` (Atenção / Attention / Atención).

## 10. Vídeo e loading cinematográfico
- **Arquivo:** o vídeo de Or7 foi verificado (1280×720, H.264, 10 s, 9,1 MB, com trilha de áudio, que fica muda). Foi usado sem alteração.
- **Divergência importante:** o vídeo não entra no Git.
  - O `check:safety` do repositório bloqueia vídeos e arquivos acima de 5 MB, e o arquivo não pode ser recomprimido.
  - Ele é copiado byte a byte (com verificação SHA-256) para `public/media/encounter-loading.mp4`, pasta ignorada, por `npm run media:setup`. O caminho de origem pode ser definido em `RARE_ENCOUNTER_VIDEO`.
  - Consequência: num deploy pelo workflow do Pages o vídeo não estará presente e a tela usa o fallback estático. Decisão pendente de Or7 (ver Pendências).
- **Reprodução:**
  - autoplay mudo, `playsInline`, loop, sem distorção;
  - `cover` em telas largas;
  - em retrato, o vídeo é mostrado inteiro com as bordas dissolvidas no cosmos, para nenhuma das três cartas ser cortada.
- **Texto:** todo renderizado pelo React e traduzido: "Preparando seu encontro…" / "Seu universo está se conectando.".
- **Progresso honesto** (`voyage.ts`, testado):
  - mínimo nominal de 7 s;
  - nunca 100% antes do resultado existir (para em 92%);
  - se passar do mínimo em 1,5 s e ainda faltar, mostra um estado lento ("Está levando um pouco mais que o normal. Suas respostas estão salvas.");
  - 100% só com o resultado salvo e o mínimo cumprido, depois 0,45 s e transição.
- **Sequência:** a última resposta é salva, o loading começa junto com o cálculo, o resultado é salvo, o mínimo passa, chega a 100% e a tela de resultados abre.
- **Casos especiais:**
  - **vídeo ausente, com erro ou sem autoplay:** cenário estático com os três versos oficiais flutuando sobre o cosmos;
  - **reduced motion:** sem vídeo, cenário estático;
  - **erro de cálculo:** mensagem e "Tentar novamente" na própria tela;
  - **reload durante ou depois:** abre o resultado salvo sem repetir os 7 s;
  - **Unown:** passa pelo mesmo fluxo.
- **A11y:** o foco vai para o título. A barra é `progressbar` com valor em passos de 10, e o status fica numa região `aria-live`. A cena é sempre noturna (`data-mode="dark"`), porque o texto fica sobre o vídeo.

## 11. Resultados
- **Ambiente:** o cosmos mais profundo, com orbes, cristais e faixas. As luzes acendem na entrada.
- **Cabeçalho:** título grande, contagem da jornada e das respostas, e uma linha de luz.
- **Soul:**
  - carta à esquerda, menor que antes (16,5 rem), ainda a protagonista;
  - painel interpretativo à direita com contorno luminoso em gradiente e luz no canto;
  - nome em DM Serif Display, ficha, traços em comum como etiquetas e explicação em 3 camadas.
- **Alternative (Radiant) e Hidden (Instinctive):** lado a lado abaixo, cada um com sua linha de luz. O Hidden tem mais suspense (respiração mais lenta e escura, anel cromático na revelação).
- **Antes da revelação:** linhas tênues onde a leitura vai aparecer. Nenhum spoiler: nome, imagem e texto não existem no DOM (testes mantidos).
- **Regras mantidas:** ordem Soul → Alternative → Hidden, revelação individual e persistida.

## 12. Cartas e animações
- **Verso:** a arte oficial com "?".
- **Frente composta dinamicamente:**
  - moldura oficial e janela com gradientes internos na cor da carta;
  - núcleo de luz volumétrico atrás do Pokémon e poça de luz onde ele pisa;
  - luz de contorno (rim light) e sombra colorida na arte;
  - partículas discretas e brilho holográfico passando pelo vidro;
  - número e nome com brilho.
- **Arte:** nunca distorcida ou cortada (`contain`). O fallback por número continua.
- **Revelação:** o giro 3D existente, mais um anel de luz atrás da carta. É cromático no Hidden e no Unown.
  - Luz e sombra continuam em camadas separadas, nunca com filtro no container 3D.
  - Duração de 0,75 a 1,4 s, sem flash intenso (opacidade de luz até 0,55).
  - O painel revela em sequência: nome, traços, camada 1, 2 e 3.
- **Reduced motion:** troca de faces sem giro e sem anel.

## 13. Explicações
`explain()` agora recebe o papel, os traços, as categorias que mais contribuíram (`drivers` do motor), a espécie e os traços do Soul.
- **Camada 1:** um parágrafo com a inclinação das respostas, as mesmas tendências registradas para a espécie (só as que ela tem de fato no catálogo) e as categorias de perguntas que carregaram a sintonia.
- **Camada 2** (interpretação, diferente por papel):
  - **Soul:** a tendência que mais aproxima, com sua definição, e o fato de ser onde a maioria das respostas concorda.
  - **Alternative:** a tendência que a diferencia do Soul. Se não houver diferença, diz isso em vez de inventar uma.
  - **Hidden:** explica que vem de tendências com menos peso (fiel ao motor) e qual é esse lado.
- **Camada 3:** as evidências registradas, de forma discreta. A ressalva aparece quando há poucos dados.
- **Garantias:** determinística, sem texto por Pokémon, sem pseudociência, nos 3 idiomas.
- **Testes novos:** `explain.test.ts` cobre os placeholders preenchidos em pt-BR, en e es, o determinismo, nenhum traço inventado, a diferença entre os papéis e o caso de poucos dados.

## 14. Responsividade
- **Capturas e medições:**
  - landing a 1280 e 375 px;
  - preparação e quiz a 320, 375, 768, 1280 e 1440 px;
  - jornada completa a 375, 768, 1280 e 1440 px.
- **Correções feitas:**
  - luz do CTA "Comece" a 375 e 360 px;
  - luz das cartas nos resultados a 375 px;
  - texto dos portais a 320 px.

  Overflow final: 0 em todas as medidas.
- **Layouts mobile próprios:**
  - nav;
  - passos com o desenho acima do texto;
  - portais com numeral em linha;
  - resultados empilhados com cartas proporcionais;
  - aviso com o ícone acima;
  - vídeo inteiro em retrato.

## 15. Acessibilidade
- **Preservado:** foco visível, teclado, labels, `aria-pressed` e `aria-current`, regiões `status` e `alert`.
- **Novos progressbars:** loading e quiz.
- **Foco:** vai para o título no loading.
- **Imagens e vídeo:** decorativos com `aria-hidden`.
- **Traços em comum:** lista rotulada.
- **Reduced motion:** cosmos parado, sem vídeo, sem giros nem anéis, revelação no scroll desativada.
- **Contraste:** o texto em dourado tem uma versão escurecida no modo claro (`--signal-gold-text`), e o papel do encontro usa a cor da carta misturada ao texto.

## 16. Desempenho
- **Animações:** só transform e opacity. O cosmos é uma camada `fixed` com `contain: strict`; as estrelas são SVG determinístico, sem canvas nem loop JS. O parallax usa um `style` por frame via rAF, só com ponteiro fino. O progresso do loading escreve no DOM por ref, sem re-render a 60 fps.
- **Carregamento:** o loading e os resultados continuam no chunk lazy, e o vídeo é carregado só na tela de loading.
- **Mobile:** menos elementos animados.

## 17. Testes executados (Chromium)
| Verificação | Resultado |
| --- | --- |
| `tsc -b` | passou |
| `eslint .` | passou |
| Vitest | 26 arquivos, 185/185 passaram (inclui `voyage.test.ts` e `explain.test.ts`) |
| `check:vendor` | passou (10 originais intactos) |
| `check:safety` | passou (vídeo fora do Git) |
| E2E, 1ª rodada completa (build anterior às correções finais) | 215 passaram, 2 falharam (overflow de 4 px a 360 px; texto dos portais a 320 px), 68 pulados |
| E2E dos testes afetados + novo `voyage.spec.ts`, depois das correções | 11 passaram, 9 pulados |
| E2E, 2ª rodada completa (build final, 3 projetos) | **217 passaram, 0 falharam**, 68 pulados (varreduras por projeto, como antes) — 28,3 min |
| `build` (pela suíte E2E) e `build:pages` | passaram; `dist/404.html` gerado. Localmente o vídeo entra em `dist/media/` (vem de `public/media/`); no workflow do Pages ele não existe |

- **Visual isolado:** 3 idiomas, 5 paletas (Spectrum, Ember, Sakura, Verdant, Azure), claro e escuro, reduced motion. Amethyst foi verificada só pelos tokens (mesma estrutura).
- **Navegadores:** só o Chromium está instalado. **Firefox e WebKit não foram testados**, e não afirmo compatibilidade neles (`mask-composite`, `overflow-clip-margin` e autoplay de vídeo merecem checagem).

## 18. Pendências
1. **Vídeo no deploy:** decidir se o vídeo vai para o Pages (Git LFS, hospedagem externa, ou exceção ao `check:safety`). Sem isso, o Pages mostra o fallback estático.
2. **Firefox e WebKit:** não verificados.
3. **Revisão de texto:** a copy nova (loading, camadas de explicação, "Atenção") precisa da revisão editorial de Or7.
4. **Contraste no modo claro:** o percentual do loading e o texto sobre o vídeo são sempre noturnos, por decisão. Se o modo claro precisar de loading claro, isso é uma decisão de design.
5. **Direitos:** os assets Pokémon/TCG ainda exigem revisão de direitos antes de publicação pública. Uma captura do loading inclui um quadro do vídeo de Or7.

## Contratos
- Nenhuma alteração no motor, nas perguntas, no banco de espécies, nos perfis, na seleção adaptativa, nas jornadas, nas anulações, no Unown, na persistência, nos idiomas, nos temas ou no Pages.
- A única mudança de contrato interno é a assinatura de `explain()`, que agora recebe um objeto com `drivers` e `soulTraits`, todos já armazenados no resultado. Os resultados calculados não mudaram.
