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

/** Cinematic staged entry: one sequence, played once. Fibers run their own built-in intro. */
const STAGE = {
  line: 0.15,
  highlight: 0.45,
  lead: 0.85,
  cta: 1.05,
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
          initial: { opacity: 0, y: '0.35em', filter: 'blur(10px)' },
          animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
          transition: { duration: 1.1, delay, ease: EASE },
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
        <h1 id={titleId} className="hero__title">
          <motion.span className="hero__line" {...enter(STAGE.line)}>
            {t('landing.hero.before')}
          </motion.span>{' '}
          <motion.span className="hero__line hero__line--highlight" {...enter(STAGE.highlight)}>
            <GradientText
              className="hero__gradient"
              colors={[colors.accent, colors.accent2, colors.accent]}
              animationSpeed={10}
            >
              {t('landing.hero.highlight')}
            </GradientText>
            {t('landing.hero.after')}
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
            backgroundColor={colors.surface}
            textColor={colors.text}
            borderColor={colors.line}
            radius={28}
          >
            {t('landing.hero.cta')}
          </StarBorder>
        </motion.div>
      </div>
    </section>
  );
}
