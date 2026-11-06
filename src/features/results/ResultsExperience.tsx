import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useId, useState } from 'react';
import { usePreferences } from '../../app/preferences-context';
import { Button } from '../../components/button/Button';
import type { Catalog, CatalogSpecies } from '../../content/pokedex/catalog';
import type { EncounterResult, Match } from '../../domain/results';
import { MODE_NAMES } from '../preparation/mode-names';
import { explain, speciesName, type Explanation } from './explain';
import { HoloCard } from './HoloCard';
import { SpeciesArt } from './SpeciesArt';
import './Results.css';

interface ResultsExperienceProps {
  readonly result: EncounterResult;
  readonly catalog: Catalog;
  readonly onNewEncounter: () => void;
  readonly onHome: () => void;
}

const VEIL_KEY = (sessionId: string) => `rare-encounter:hidden-revealed:${sessionId}`;

function readRevealed(sessionId: string): boolean {
  try {
    return localStorage.getItem(VEIL_KEY(sessionId)) === '1';
  } catch {
    return false;
  }
}

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
 * Results Experience (Design Locked v1): Soul Match as a Hybrid Reveal into the Holo Card
 * with an Editorial Split explanation; Hidden Match behind a Chromatic Veil that stays open
 * once revealed; Alternative Match as a Connection Panel. Sharing is not offered yet: the
 * approved templates and phrases do not exist.
 */
export function ResultsExperience({ result, catalog, onNewEncounter, onHome }: ResultsExperienceProps) {
  const { t, locale } = usePreferences();
  const reduce = useReducedMotion() ?? false;
  const ids = { soul: useId(), hidden: useId(), alternative: useId() };
  const [revealed, setRevealed] = useState(() => readRevealed(result.sessionId));
  const bySlug = new Map(catalog.species.map((s) => [s.slug, s]));

  useEffect(() => {
    document.title = t('results.documentTitle');
  }, [t]);

  const reveal = () => {
    setRevealed(true);
    try {
      localStorage.setItem(VEIL_KEY(result.sessionId), '1');
    } catch {
      // Without storage the reveal still holds for this visit.
    }
  };

  const alternative = result.alternatives[0];
  const view = (m: Match | undefined) => {
    const s = m ? bySlug.get(m.speciesId) : undefined;
    if (!m || !s) return null;
    const name = speciesName(s, locale);
    return { m, s, name, why: explain(m.kind, m.explanation.traits ?? [], s, locale, t) };
  };
  const soul = view(result.soul);
  const hidden = view(result.hidden);
  const alt = view(alternative);
  // PokéAPI has no Portuguese genus: pt-BR shows the generation only, never English text.
  const facts = (s: CatalogSpecies) => {
    const genus = locale === 'es' ? s.genus.es : locale === 'en' ? s.genus.en : null;
    return genus
      ? t('results.facts', { genus, generation: s.generation })
      : t('results.generation', { generation: s.generation });
  };

  const rise = (delay: number) =>
    reduce
      ? {}
      : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } };

  return (
    <div className="results">
      <header className="results__head">
        <h1 className="results__title">{t('results.title')}</h1>
        <p className="results__summary">
          {t('results.summary', { total: result.mode, mode: t(MODE_NAMES[result.mode]) })}
        </p>
      </header>

      {soul && (
        <section className="soul" aria-labelledby={ids.soul}>
          <HoloCard
            name={soul.name}
            dex={soul.s.id}
            dexLabel={t('results.dex', { n: String(soul.s.id).padStart(4, '0') })}
            art={soul.s.art}
            artAlt={t('results.art', { name: soul.name })}
            flipLabel={t('results.card.flip')}
            flipBackLabel={t('results.card.flipBack')}
            backLabel={t('results.card.back', { name: soul.name })}
          />
          <motion.div className="soul__text" {...rise(reduce ? 0 : 1.2)}>
            <p className="match-role">{t('results.role.soul')}</p>
            <h2 className="match-name">{soul.name}</h2>
            <p className="match-facts">{facts(soul.s)}</p>
            <Why explanation={soul.why} titleId={ids.soul} title={t('results.why', { name: soul.name })} />
          </motion.div>
        </section>
      )}

      {hidden && (
        <section className="hidden-match" aria-labelledby={`${ids.hidden}-role`} data-revealed={revealed}>
          <p id={`${ids.hidden}-role`} className="match-role">
            {t('results.role.hidden')}
          </p>
          {revealed ? (
            <motion.div className="hidden-match__open" {...(reduce ? {} : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.6 } })}>
              <div className="hidden-match__art">
                <SpeciesArt src={hidden.s.art} alt={t('results.art', { name: hidden.name })} dex={hidden.s.id} />
              </div>
              <div>
                <h2 className="match-name">{hidden.name}</h2>
                <p className="match-facts">
                  {t('results.dex', { n: String(hidden.s.id).padStart(4, '0') })} · {facts(hidden.s)}
                </p>
                <Why explanation={hidden.why} titleId={ids.hidden} title={t('results.why', { name: hidden.name })} />
              </div>
            </motion.div>
          ) : (
            <button type="button" className="veil" onClick={reveal}>
              <span className="veil__art" aria-hidden="true">
                <SpeciesArt src={hidden.s.art} alt="" dex={hidden.s.id} silhouette />
                {/* The light passes only over the silhouette: the art itself is its mask. */}
                <span
                  className="veil__light"
                  {...(hidden.s.art
                    ? { style: { maskImage: `url(${hidden.s.art})`, WebkitMaskImage: `url(${hidden.s.art})` } }
                    : {})}
                />
              </span>
              <span className="veil__hint">{t('results.veil.hint')}</span>
              <span className="veil__cta">{t('results.veil.reveal')}</span>
            </button>
          )}
        </section>
      )}

      {alt && (
        <section className="connection" aria-labelledby={ids.alternative}>
          <div className="connection__art">
            <SpeciesArt src={alt.s.art} alt={t('results.art', { name: alt.name })} dex={alt.s.id} />
          </div>
          <div>
            <p className="match-role">{t('results.role.alternative')}</p>
            <h2 className="match-name">{alt.name}</h2>
            <p className="match-facts">
              {t('results.dex', { n: String(alt.s.id).padStart(4, '0') })} · {facts(alt.s)}
            </p>
            <Why explanation={alt.why} titleId={ids.alternative} title={t('results.why', { name: alt.name })} />
          </div>
        </section>
      )}

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
    </div>
  );
}
