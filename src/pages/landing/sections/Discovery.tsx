import { useCallback, useId, useRef } from 'react';
import { usePreferences } from '../../../app/preferences-context';
import { useLocalizedStepLabels } from '../../../hooks/useLocalizedStepLabels';
import { useThemeColors } from '../../../hooks/useThemeColors';
import type { MessageKey } from '../../../i18n/messages';
import Stepper, { Step } from '../../../vendor/react-bits/Stepper/Stepper';
import { StepGlyph } from './StepGlyph';
import './Discovery.css';

/** Exactly the three approved steps (D9). */
const STEPS = [
  { title: 'landing.discovery.step1.title', body: 'landing.discovery.step1.body' },
  { title: 'landing.discovery.step2.title', body: 'landing.discovery.step2.body' },
  { title: 'landing.discovery.step3.title', body: 'landing.discovery.step3.body' },
] as const satisfies readonly { title: MessageKey; body: MessageKey }[];

/**
 * How Discovery Works: the original React Bits Stepper. Its own step indicators are the
 * navigation (no footer), so every control on screen does exactly what it shows.
 */
export function Discovery() {
  const { theme, mode, t } = usePreferences();
  const colors = useThemeColors(theme);
  const titleId = useId();
  const stepperRef = useRef<HTMLDivElement>(null);
  useLocalizedStepLabels(
    stepperRef,
    useCallback((n: string, title: string) => t('landing.discovery.stepLabel', { n, title }), [t]),
  );

  return (
    <section id="discovery" className="discovery" aria-labelledby={titleId}>
      <div className="discovery__intro">
        <h2 id={titleId} className="discovery__title">
          {t('landing.section.discovery')}
        </h2>
        <p className="discovery__lead">{t('landing.discovery.intro')}</p>
      </div>

      <div ref={stepperRef} className="discovery__stepper">
        <Stepper
          showFooter={false}
          theme={mode}
          accentColor={colors.accent}
          width="100%"
          radius={24}
          // Open surface: the progression line and the pane sit directly on the cosmos.
          frame={false}
          transition="fade"
          className="discovery__frame"
          contentClassName="discovery__content"
        >
          {STEPS.map((s, i) => (
            <Step key={s.title} title={t(s.title)}>
              <div className="discovery__step">
                <StepGlyph step={(i + 1) as 1 | 2 | 3} />
                <div className="discovery__step-text">
                  <h3 className="discovery__step-title">{t(s.title)}</h3>
                  <p className="discovery__step-body">{t(s.body)}</p>
                </div>
              </div>
            </Step>
          ))}
        </Stepper>
      </div>
    </section>
  );
}
