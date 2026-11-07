import { useEffect, useId, useState } from 'react';
import { usePreferences } from '../../app/preferences-context';
import { ARCHETYPES, type CardArt } from '../../components/archetype-card/archetypes';
import { Button } from '../../components/button/Button';
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

function Why({ explanation, titleId, title }: { explanation: Explanation; titleId: string; title: string }) {
  return (
    <div className="why">
      <h3 id={titleId} className="why__title">
        {title}
      </h3>
      <p className="why__lead">{explanation.lead}</p>
      {explanation.reasons.length > 0 && (
        <ul className="why__reasons">
          {explanation.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
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
 * Special outcomes: all questions voided (the secret Unown encounter) and too little
 * evidence (no species invented). Sharing is not offered: its templates are not approved.
 */
export function ResultsExperience({ result, catalog, onNewEncounter, onHome }: ResultsExperienceProps) {
  const { t, locale } = usePreferences();
  const headingIds = { soul: useId(), alternative: useId(), hidden: useId(), mystery: useId() };
  const [reveals, setReveals] = useState(() => readReveals(result.sessionId));
  const bySlug = new Map(catalog.species.map((s) => [s.slug, s]));

  useEffect(() => {
    document.title = t('results.documentTitle');
  }, [t]);

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

  // ---- Every question voided: the secret encounter ----------------------------------------
  if (result.outcome === 'mystery') {
    const s = bySlug.get(result.speciesId);
    const open = reveals.has('mystery');
    return (
      <div className="results">
        <header className="results__head">
          <h1 className="results__title">{t('results.mystery.heading')}</h1>
          <p className="results__summary">{summary}</p>
        </header>
        <section className="encounter" data-kind="mystery" aria-labelledby={headingIds.mystery}>
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
          <div className="encounter__text">
            <p className="match-role">{t('results.mystery.role')}</p>
            {open && s ? (
              <>
                <h2 id={headingIds.mystery} className="match-name">
                  {speciesName(s, locale)}
                </h2>
                <p className="match-facts">{facts(s)}</p>
                <p className="mystery__title">{t('results.mystery.title')}</p>
                <p className="why__lead">{t('results.mystery.body')}</p>
              </>
            ) : (
              <h2 id={headingIds.mystery} className="encounter__waiting">
                {t('results.waiting')}
              </h2>
            )}
          </div>
        </section>
        {actions}
      </div>
    );
  }

  // ---- Too little evidence: say so, invent nothing ----------------------------------------
  if (!isMatchesResult(result)) {
    return (
      <div className="results">
        <header className="results__head">
          <h1 className="results__title">{t('results.insufficient.title')}</h1>
          <p className="results__summary">{summary}</p>
          <p className="why__lead">{t('results.insufficient.body')}</p>
        </header>
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

  return (
    <div className="results">
      <header className="results__head">
        <h1 className="results__title">{t('results.title')}</h1>
        <p className="results__summary">{summary}</p>
      </header>

      {order.map(({ key, match, tone }, i) => {
        const s = match ? bySlug.get(match.speciesId) : undefined;
        if (!match || !s) return null;
        const open = reveals.has(key);
        const previous = order[i - 1];
        const locked = previous !== undefined && !reveals.has(previous.key);
        const name = speciesName(s, locale);
        const role = t(`results.role.${key}`);
        return (
          <section key={key} className="encounter" data-kind={key} aria-labelledby={headingIds[key]}>
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
            <div className="encounter__text">
              <p className="match-role">{role}</p>
              {open ? (
                <>
                  <h2 id={headingIds[key]} className="match-name">
                    {name}
                  </h2>
                  <p className="match-facts">{facts(s)}</p>
                  <Why
                    explanation={explain(match.kind, match.explanation.traits ?? [], s, locale, t)}
                    titleId={`${headingIds[key]}-why`}
                    title={t('results.why', { name })}
                  />
                </>
              ) : (
                <>
                  <h2 id={headingIds[key]} className="encounter__waiting">
                    {t('results.waiting')}
                  </h2>
                  {locked && <p className="encounter__locked">{t('results.locked')}</p>}
                </>
              )}
            </div>
          </section>
        );
      })}

      {actions}
    </div>
  );
}
