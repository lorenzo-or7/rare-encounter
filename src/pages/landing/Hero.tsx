import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionStyle,
} from "motion/react";
import { Fragment, lazy, Suspense, useId, useRef, type ReactNode } from "react";
import { usePreferences } from "../../app/preferences-context";
import { Icon } from "../../components/icon/Icon";
import { useThemeColors } from "../../hooks/useThemeColors";
import GradientText from "../../vendor/react-bits/GradientText/GradientText";
import StarBorder from "../../vendor/react-bits/StarBorder/StarBorder";
import "./Hero.css";

// WebGL fibers load after first paint; the headline (LCP) never waits for them.
const GhostFibers = lazy(
  () => import("../../vendor/react-bits/GhostFibers/GhostFibers"),
);

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/**
 * Cinematic staged entry, played once and done in about 1.9 s: the words of the headline
 * rise out of a mask one after another, the highlighted phrase lands last and its light
 * comes on, then the lead and the CTA. The fibers fade in through their own intro.
 */
const STAGE = {
  words: 0.12,
  step: 0.07,
  lead: 0.95,
  cta: 1.1,
} as const;

interface HeroProps {
  /** Section the CTA scrolls to. */
  readonly ctaTarget: string;
  /**
   * Shown under the CTA, in the page flow (the resume banner). Renders nothing when absent,
   * so the approved hero is unchanged for a first visit.
   */
  readonly after?: ReactNode;
}

/** The Encounter: Editorial Split hero over the cosmos. */
export function Hero({ ctaTarget, after }: HeroProps) {
  const { theme, mode, t } = usePreferences();
  const colors = useThemeColors(theme);
  const reduceMotion = useReducedMotion() ?? false;
  const titleId = useId();
  const ref = useRef<HTMLElement>(null);

  // Scroll: the copy drifts up and dims as the hero leaves (transform and opacity only).
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const copyY = useTransform(scrollYProgress, [0, 1], ["0%", "-18%"]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0.15]);
  const lightY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

  const enter = (delay: number) =>
    reduceMotion
      ? { initial: false as const }
      : {
          initial: { opacity: 0, y: "0.6em" },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.9, delay, ease: EASE },
        };

  // Each word rises out of its own mask; the order is reading order across both phrases.
  const words = (text: string, offset: number) =>
    text
      .split(" ")
      .filter(Boolean)
      .map((word, i) => (
        <Fragment key={`${word}-${String(i)}`}>
          <span className="hero__word">
            <motion.span
              className="hero__word-inner"
              {...(reduceMotion
                ? { initial: false as const }
                : {
                    initial: { y: "110%" },
                    animate: { y: 0 },
                    transition: {
                      duration: 0.85,
                      delay: STAGE.words + (offset + i) * STAGE.step,
                      ease: EASE,
                    },
                  })}
            >
              {word}
            </motion.span>
          </span>{" "}
        </Fragment>
      ));

  const openingText = t("landing.hero.opening");
  const openingCount = openingText.split(" ").filter(Boolean).length;
  const bridgeText = t("landing.hero.bridge");
  const opening = words(openingText, 0);
  const bridge = words(bridgeText, openingCount);
  const highlightDelay =
    STAGE.words +
    (openingCount + bridgeText.split(" ").filter(Boolean).length) * STAGE.step +
    0.05;

  return (
    <section
      ref={ref}
      id="encounter"
      className="hero"
      aria-labelledby={titleId}
    >
      <motion.div
        className="hero__light"
        style={reduceMotion ? {} : { y: lightY }}
        aria-hidden="true"
      />
      <div className="hero__fibers" aria-hidden="true">
        <Suspense fallback={null}>
          <GhostFibers
            glowColor={colors.accent}
            secondaryColor={colors.accent2}
            pulseOnClick={false}
            // Light mode: the original's own ink rendering instead of additive glow.
            lightMode={mode === "light"}
            vignette={0.45}
          />
        </Suspense>
      </div>

      <motion.div
        className="hero__copy"
        style={reduceMotion ? {} : { y: copyY, opacity: copyOpacity }}
      >
        {/* Two phrases: they break at the comma from tablet up, and flow freely on phones */}
        <h1 id={titleId} className="hero__title">
          <span className="hero__phrase hero__line">{opening}</span>
          <span className="hero__phrase hero__line">
            {bridge}
            <motion.span
              className="hero__highlight"
              data-lit={reduceMotion ? "still" : "on"}
              style={
                {
                  "--hero-glow-delay": `${String(highlightDelay + 0.5)}s`,
                } as MotionStyle
              }
              {...(reduceMotion
                ? { initial: false as const }
                : {
                    initial: { opacity: 0, y: "0.35em", scale: 0.98 },
                    animate: { opacity: 1, y: 0, scale: 1 },
                    transition: {
                      duration: 1,
                      delay: highlightDelay,
                      ease: EASE,
                    },
                  })}
            >
              <GradientText
                className="hero__gradient"
                colors={[colors.accent, colors.accent2, colors.accent]}
                animationSpeed={10}
              >
                {t("landing.hero.highlight")}
              </GradientText>
              {t("landing.hero.after")}
            </motion.span>
          </span>
        </h1>

        <motion.p className="hero__lead" {...enter(STAGE.lead)}>
          {t("landing.hero.lead")}
        </motion.p>

        <motion.div className="hero__actions" {...enter(STAGE.cta)}>
          <StarBorder
            theme={mode}
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
            <span className="hero__cta-label">{t("landing.hero.cta")}</span>
            <Icon className="hero__cta-icon" name="arrowRight" size={18} />
          </StarBorder>
        </motion.div>
        {after}
      </motion.div>
    </section>
  );
}
