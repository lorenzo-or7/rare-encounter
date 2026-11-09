import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useId, useState, type ReactNode } from 'react';
import { usePreferences } from '../../app/preferences-context';
import { ARCHETYPES, type CardArt } from '../../components/archetype-card/archetypes';
import { Button } from '../../components/button/Button';
import { CosmicBackdrop } from '../../components/cosmos/CosmicBackdrop';
import type { Catalog, CatalogSpecies } from '../../content/pokedex/catalog';
import { isMatchesResult, type EncounterResult, type Match } from '../../domain/results';
import { MODE_NAMES } from '../preparation/mode-names';
import { explain, speciesName, type Explanation } from './explain';
import { ResultCard, type CardFront, type CardTone } from './ResultCard';
import { readReveals, saveReveals, type RevealKey } from './reveals';
import './Results.css';

interface ResultsExperienceProps {
  readonly result: EncounterResult;
  readonly catalog: Catalog;
  readonly onNewEncounter: () => void;
  readonly onHome: () => void;
}

/** The official cards: Soul is Ethereal, Alternative Radiant, Hidden Instinctive. */
const CARD_ART = new Map(ARCHETYPES.flatMap((a) => (a.art ? [[a.id, a.art] as const] : [])));
const art = (tone: CardTone): CardArt => {
  const found = CARD_ART.get(tone);
  if (!found) throw new Error(`results: card art ${tone} is missing`);
  return found;
};

const EASE = [0.22, 1, 0.36, 1] as const;

/** Content that arrives in sequence once a card is revealed (or the page enters). */
function Arrive({ children, delay = 0, still }: { children: ReactNode; delay?: number; still: boolean }) {
  if (still) return <>{children}</>;
  return (
    <motion.div
      className="arrive"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

function Why({
  explanation,
  titleId,
  title,
  evidenceTitle,
  still,
}: {
  explanation: Explanation;
  titleId: string;
  title: string;
  evidenceTitle: string;
  still: boolean;
}) {
  return (
    <div className="why">
      <Arrive still={still} delay={0.15}>
        <h3 id={titleId} className="why__title">
          {title}
        </h3>
        <p className="why__lead">{explanation.lead}</p>
      </Arrive>
      {explanation.reading && (
        <Arrive still={still} delay={0.3}>
          <p className="why__reading">{explanation.reading}</p>
        </Arrive>
      )}
      {explanation.reasons.length > 0 && (
        <Arrive still={still} delay={0.45}>
          <div className="why__evidence">
            <p className="why__evidence-title">{evidenceTitle}</p>
            <ul className="why__reasons">
              {explanation.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        </Arrive>
      )}
      {explanation.cautious && <p className="why__cautious">{explanation.cautious}</p>}
    </div>
  );
}

/**
 * The three encounters, in their fixed order: Soul → Alternative → Hidden. Every card
 * starts face down; nothing about a species (name, number, image, explanation) is on the
 * page before its card is revealed, and each reveal waits for the one before it. Once
 * revealed, a discovery stays revealed, across turns of the card and reloads.
 *
 * Composition (Prompt 02): a deep cosmos whose lights come on as the page enters; the Soul
 * Match as the protagonist (its card on the left, an interpretive panel with a luminous
 * outline on the right); the Alternative (Radiant) and the Hidden (Instinctive, darker, with
 * more suspense) side by side beneath it.
 * Special outcomes: all questions voided (the secret Unown encounter) and too little
 * evidence (no species invented). Sharing is not offered: its templates are not approved.
 */
export function ResultsExperience({ result, catalog, onNewEncounter, onHome }: ResultsExperienceProps) {
  const { t, locale } = usePreferences();
  const still = useReducedMotion() ?? false;
  const headingIds = { soul: useId(), alternative: useId(), hidden: useId(), mystery: useId() };
  const traitsLabelId = useId();
  const [reveals, setReveals] = useState(() => readReveals(result.sessionId));
  // Entrance: the cosmos starts dark and its lights come on once the page is in place.
  const [lit, setLit] = useState(still);
  const bySlug = new Map(catalog.species.map((s) => [s.slug, s]));

  useEffect(() => {
    document.title = t('results.documentTitle');
  }, [t]);

  useEffect(() => {
    if (lit) return;
    const id = requestAnimationFrame(() => {
      setLit(true);
    });
    return () => {
      cancelAnimationFrame(id);
    };
  }, [lit]);

  const reveal = (key: RevealKey) => {
    const next = new Set(reveals).add(key);
    setReveals(next);
    saveReveals(result.sessionId, next);
  };

  const dex = (s: CatalogSpecies) => String(s.id).padStart(4, '0');
  // PokéAPI has no Portuguese genus: pt-BR shows the generation only, never English text.
  const facts = (s: CatalogSpecies) => {
    const genus = locale === 'es' ? s.genus.es : locale === 'en' ? s.genus.en : null;
    const tail = genus
      ? t('results.facts', { genus, generation: s.generation })
      : t('results.generation', { generation: s.generation });
    return `${t('results.dex', { n: dex(s) })} · ${tail}`;
  };
  const frontOf = (s: CatalogSpecies): CardFront => {
    const name = speciesName(s, locale);
    return { name, dexLabel: t('results.dex', { n: dex(s) }), art: s.art, artAlt: t('results.art', { name }), dex: s.id };
  };

  const mode = t(MODE_NAMES[result.mode]);
  const summary = result.counts?.voided
    ? t('results.counts', { answered: result.counts.answered, voided: result.counts.voided, mode })
    : t('results.summary', { total: result.mode, mode });

  const head = (title: string, extra?: ReactNode) => (
    <motion.header
      className="results__head"
      {...(still
        ? {}
        : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.8, ease: EASE } })}
    >
      <h1 className="results__title">{title}</h1>
      <p className="results__summary">{summary}</p>
      {extra}
    </motion.header>
  );

  const actions = (
    <footer className="results__foot">
      <div className="results__actions">
        <Button size="lg" onClick={onNewEncounter}>
          {t('results.again')}
        </Button>
        <Button size="lg" variant="secondary" onClick={onHome}>
          {t('results.home')}
        </Button>
      </div>
      <p className="results__note">{t('results.note')}</p>
    </footer>
  );

  const enter = (delay: number) =>
    still
      ? {}
      : {
          initial: { opacity: 0, y: 28 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.9, delay, ease: EASE },
        };

  // ---- Every question voided: the secret encounter ----------------------------------------
  if (result.outcome === 'mystery') {
    const s = bySlug.get(result.speciesId);
    const open = reveals.has('mystery');
    return (
      <div className="results" data-outcome="mystery">
        <CosmicBackdrop variant="results" lit={lit} />
        {head(t('results.mystery.heading'))}
        <motion.section className="encounter" data-kind="mystery" aria-labelledby={headingIds.mystery} {...enter(0.25)}>
          <ResultCard
            tone="ethereal"
            back={art('ethereal')}
            style="mystery"
            revealed={open}
            locked={false}
            front={open && s ? frontOf(s) : null}
            revealLabel={t('results.mystery.reveal')}
            flipLabel={t('results.card.flip')}
            flipBackLabel={t('results.card.flipBack')}
            unrevealedLabel={t('results.card.unrevealed', { role: t('results.mystery.role') })}
            frontLabel={s ? t('results.card.face', { name: speciesName(s, locale), n: dex(s) }) : ''}
            onReveal={() => {
              reveal('mystery');
            }}
          />
          <div className="encounter__text" data-open={open}>
            <p className="match-role">{t('results.mystery.role')}</p>
            {open && s ? (
              <>
                <h2 id={headingIds.mystery} className="match-name">
                  {speciesName(s, locale)}
                </h2>
                <p className="match-facts">{facts(s)}</p>
                <Arrive still={still} delay={0.15}>
                  <p className="mystery__title">{t('results.mystery.title')}</p>
                  <p className="why__lead">{t('results.mystery.body')}</p>
                </Arrive>
              </>
            ) : (
              <Waiting id={headingIds.mystery} text={t('results.waiting')} />
            )}
          </div>
        </motion.section>
        {actions}
      </div>
    );
  }

  // ---- Too little evidence: say so, invent nothing ----------------------------------------
  if (!isMatchesResult(result)) {
    return (
      <div className="results" data-outcome="insufficient">
        <CosmicBackdrop variant="results" lit={lit} />
        {head(t('results.insufficient.title'), <p className="why__lead">{t('results.insufficient.body')}</p>)}
        {actions}
      </div>
    );
  }

  // ---- Three encounters ------------------------------------------------------------------
  const order: readonly { key: 'soul' | 'alternative' | 'hidden'; match: Match | undefined; tone: CardTone }[] = [
    { key: 'soul', match: result.soul, tone: 'ethereal' },
    { key: 'alternative', match: result.alternatives[0], tone: 'radiant' },
    { key: 'hidden', match: result.hidden, tone: 'instinctive' },
  ];
  const soulRole = t('results.role.soul');

  const encounter = ({ key, match, tone }: (typeof order)[number], i: number) => {
    const s = match ? bySlug.get(match.speciesId) : undefined;
    if (!match || !s) return null;
    const open = reveals.has(key);
    const previous = order[i - 1];
    const locked = previous !== undefined && !reveals.has(previous.key);
    const name = speciesName(s, locale);
    const role = t(`results.role.${key}`);
    const explanation = open
      ? explain(
          {
            kind: match.kind,
            traits: match.explanation.traits ?? [],
            drivers: match.explanation.drivers,
            species: s,
            soulTraits: result.soul.explanation.traits ?? [],
            soulRole,
          },
          locale,
          t,
        )
      : null;
    return (
      <motion.section
        key={key}
        className="encounter"
        data-kind={key}
        data-open={open}
        aria-labelledby={headingIds[key]}
        {...enter(0.25 + i * 0.15)}
      >
        <ResultCard
          tone={tone}
          back={art(tone)}
          style={key}
          revealed={open}
          locked={locked}
          front={open ? frontOf(s) : null}
          revealLabel={t(`results.reveal.${key}`)}
          flipLabel={t('results.card.flip')}
          flipBackLabel={t('results.card.flipBack')}
          unrevealedLabel={t('results.card.unrevealed', { role })}
          frontLabel={t('results.card.face', { name, n: dex(s) })}
          onReveal={() => {
            reveal(key);
          }}
        />
        <div className="encounter__text" data-open={open}>
          <p className="match-role">{role}</p>
          {open && explanation ? (
            <>
              <Arrive still={still}>
                <h2 id={headingIds[key]} className="match-name">
                  {name}
                </h2>
                <p className="match-facts">{facts(s)}</p>
              </Arrive>
              {explanation.traits.length > 0 && (
                <Arrive still={still} delay={0.08}>
                  <p id={`${traitsLabelId}-${key}`} className="visually-hidden">
                    {t('results.traits.title')}
                  </p>
                  <ul className="match-traits" aria-labelledby={`${traitsLabelId}-${key}`}>
                    {explanation.traits.map((tr) => (
                      <li key={tr.id}>{tr.label}</li>
                    ))}
                  </ul>
                </Arrive>
              )}
              <Why
                explanation={explanation}
                titleId={`${headingIds[key]}-why`}
                title={t('results.why', { name })}
                evidenceTitle={t('results.evidence.title')}
                still={still}
              />
            </>
          ) : (
            <Waiting id={headingIds[key]} text={t('results.waiting')} locked={locked ? t('results.locked') : null} />
          )}
        </div>
      </motion.section>
    );
  };

  const [soul, alternative, hidden] = order;

  return (
    <div className="results" data-outcome="matches">
      <CosmicBackdrop variant="results" lit={lit} />
      {head(t('results.title'))}
      {soul && encounter(soul, 0)}
      <div className="results__pair">
        {alternative && encounter(alternative, 1)}
        {hidden && encounter(hidden, 2)}
      </div>
      {actions}
    </div>
  );
}

/** Before the reveal: the heading waits, with faint lines where the reading will appear. */
function Waiting({ id, text, locked = null }: { id: string; text: string; locked?: string | null }) {
  return (
    <>
      <h2 id={id} className="encounter__waiting">
        {text}
      </h2>
      {locked && <p className="encounter__locked">{locked}</p>}
      <span className="encounter__veil" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
    </>
  );
}
