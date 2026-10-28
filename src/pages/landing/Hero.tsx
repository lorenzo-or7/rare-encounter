import { motion, useReducedMotion } from 'motion/react';
import { lazy, Suspense, useId } from 'react';
import { usePreferences } from '../../app/preferences-context';
import { useThemeColors } from '../../hooks/useThemeColors';
import GradientText from '../../vendor/react-bits/GradientText/GradientText';
import StarBorder from '../../vendor/react-bits/StarBorder/StarBorder';
import './Hero.css';

// WebGL fibers load after first paint; the headline (LCP) never waits for them.
const GhostFibers = lazy(() => import('../../vendor/react-bits/GhostFibers/GhostFibers'));

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const DURATION = 0.9;

/**
 * Cinematic staged entry: one sequence, played once, done in about 1.75s.
 * The two headline phrases land first, then the lead and the CTA. The fibers fade in
 * through their own built-in intro behind it.
 */
const STAGE = {
  opening: 0.1,
  payoff: 0.32,
  lead: 0.68,
  cta: 0.84,
} as const;

interface HeroProps {
  /** Section the CTA scrolls to until the Preparation Screen exists (Phase 02). */
  readonly ctaTarget: string;
}

/** The Encounter: Editorial Split hero. */
export function Hero({ ctaTarget }: HeroProps) {
  const { theme, t } = usePreferences();
  const colors = useThemeColors(theme);
  const reduceMotion = useReducedMotion() ?? false;
  const titleId = useId();

  const enter = (delay: number) =>
    reduceMotion
      ? { initial: false as const }
      : {
          initial: { opacity: 0, y: '0.25em', filter: 'blur(6px)' },
          animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
          transition: { duration: DURATION, delay, ease: EASE },
        };

  return (
    <section id="encounter" className="hero" aria-labelledby={titleId}>
      <div className="hero__fibers" aria-hidden="true">
        <Suspense fallback={null}>
          <GhostFibers
            glowColor={colors.accent}
            secondaryColor={colors.accent2}
            pulseOnClick={false}
            vignette={0.45}
          />
        </Suspense>
      </div>

      <div className="hero__copy">
        {/* Two phrases: they break at the comma from tablet up, and flow freely on phones */}
        <h1 id={titleId} className="hero__title">
          <motion.span className="hero__phrase" {...enter(STAGE.opening)}>
            {t('landing.hero.opening')}
          </motion.span>{' '}
          <motion.span className="hero__phrase" {...enter(STAGE.payoff)}>
            {t('landing.hero.bridge')}{' '}
            <span className="hero__highlight">
              <GradientText
                className="hero__gradient"
                colors={[colors.accent, colors.accent2, colors.accent]}
                animationSpeed={10}
              >
                {t('landing.hero.highlight')}
              </GradientText>
              {t('landing.hero.after')}
            </span>
          </motion.span>
        </h1>

        <motion.p className="hero__lead" {...enter(STAGE.lead)}>
          {t('landing.hero.lead')}
        </motion.p>

        <motion.div className="hero__actions" {...enter(STAGE.cta)}>
          <StarBorder
            as="a"
            href={`#${ctaTarget}`}
            className="hero__cta"
            color={colors.accent}
            trailColor={colors.accent2}
            backgroundColor={`color-mix(in oklab, ${colors.accent} 16%, ${colors.surface})`}
            textColor={colors.text}
            borderColor={`color-mix(in oklab, ${colors.accent} 42%, transparent)`}
            radius={30}
          >
            {t('landing.hero.cta')}
          </StarBorder>
        </motion.div>
      </div>
    </section>
  );
}
