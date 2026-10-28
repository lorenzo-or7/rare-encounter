import { useId, type MouseEvent } from 'react';
import { usePreferences } from '../../../app/preferences-context';
import { PREPARATION, useEncounterTransition } from '../../../features/encounter-transition/context';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { MODES, MODE_IDS } from '../../../domain/modes';
import type { MessageKey } from '../../../i18n/messages';
import StarBorder from '../../../vendor/react-bits/StarBorder/StarBorder';
import './Begin.css';

const MODE_NAMES: Readonly<Record<(typeof MODE_IDS)[number], MessageKey>> = {
  30: 'landing.mode.glimpse',
  60: 'landing.mode.journey',
  90: 'landing.mode.deep',
};

/**
 * Begin Your Journey: closing statement, the three depths, and the start control.
 * The control runs the Liquid Flow transition toward the Preparation Screen. Until that
 * screen registers itself (Phase 02) the control is disabled and says so: it never
 * pretends to start something that does not exist yet.
 */
export function Begin() {
  const { theme, t } = usePreferences();
  const colors = useThemeColors(theme);
  const transition = useEncounterTransition();
  const ready = transition.canBegin(PREPARATION);
  const titleId = useId();
  const noteId = useId();

  const onBegin = (e: MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    transition.begin(PREPARATION, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
  };

  return (
    <section id="begin" className="begin" aria-labelledby={titleId}>
      <h2 id={titleId} className="begin__title">
        {t('landing.section.begin')}
      </h2>
      <p className="begin__statement">{t('landing.begin.statement')}</p>

      <ul className="begin__modes">
        {MODE_IDS.map((id) => (
          <li key={id} className="begin__mode">
            <span className="begin__mode-count">{MODES[id].id}</span>
            <span className="begin__mode-name">{t(MODE_NAMES[id])}</span>
            <span className="visually-hidden">{t('landing.mode.questions', { n: id })}</span>
          </li>
        ))}
      </ul>

      <div className="begin__action">
        <StarBorder
          className="begin__cta"
          color={colors.accent}
          trailColor={colors.accent2}
          backgroundColor={`color-mix(in oklab, ${colors.accent} 16%, ${colors.surface})`}
          textColor={colors.text}
          borderColor={`color-mix(in oklab, ${colors.accent} 42%, transparent)`}
          radius={32}
          disabled={!ready}
          aria-describedby={ready ? undefined : noteId}
          onClick={onBegin}
        >
          {t('landing.begin.cta')}
        </StarBorder>
        {!ready && (
          <p id={noteId} className="begin__note">
            {t('landing.begin.unavailable')}
          </p>
        )}
      </div>
    </section>
  );
}
