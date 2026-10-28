import { useId, type CSSProperties } from 'react';
import { usePreferences } from '../../../app/preferences-context';
import { ArchetypeCard } from '../../../components/archetype-card/ArchetypeCard';
import { ARCHETYPES } from '../../../components/archetype-card/archetypes';
import './Connection.css';

/** Each card drifts on its own slow cycle so the three never move in lockstep. */
const FLOAT = [
  { duration: '7s', delay: '0s' },
  { duration: '8.5s', delay: '-3.2s' },
  { duration: '7.8s', delay: '-5.1s' },
] as const;

/** Every Connection Is Different: the three Floating Archetype Cards with Interactive Discovery. */
export function Connection() {
  const { t } = usePreferences();
  const titleId = useId();

  return (
    <section id="connection" className="connection" aria-labelledby={titleId}>
      <div className="connection__intro">
        <h2 id={titleId} className="connection__title">
          {t('landing.section.connection')}
        </h2>
        <p className="connection__lead">{t('landing.connection.intro')}</p>
      </div>

      <ul className="connection__cards">
        {ARCHETYPES.map((a, i) => {
          const float = FLOAT[i] ?? FLOAT[0];
          return (
            <li key={a.id} className="connection__slot">
              <div
                className="connection__float"
                style={
                  {
                    '--float-duration': float.duration,
                    '--float-delay': float.delay,
                  } as CSSProperties
                }
              >
                <ArchetypeCard
                  archetype={a}
                  name={t(a.nameKey)}
                  phrase={t(a.phraseKey)}
                  discoverLabel={t('card.discover')}
                  hideLabel={t('card.hide')}
                  artPendingLabel={t('cards.artPending')}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
