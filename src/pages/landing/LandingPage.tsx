import { motion, useReducedMotion, useScroll, useSpring } from 'motion/react';
import { useEffect } from 'react';
import { usePreferences } from '../../app/preferences-context';
import { CosmicBackdrop } from '../../components/cosmos/CosmicBackdrop';
import { SiteLayout } from '../../components/layout/SiteLayout';
import { ResumeBanner } from '../../features/resume/ResumeBanner';
import type { MessageKey } from '../../i18n/messages';
import { Hero } from './Hero';
import { Begin } from './sections/Begin';
import { Beyond } from './sections/Beyond';
import { Connection } from './sections/Connection';
import { Discovery } from './sections/Discovery';
import './Landing.css';

/** The four narrative sections after the hero, as listed in the nav. */
const LANDING_SECTIONS = [
  { id: 'beyond', nav: 'landing.nav.beyond' },
  { id: 'discovery', nav: 'landing.nav.discovery' },
  { id: 'connection', nav: 'landing.nav.connection' },
  { id: 'begin', nav: 'landing.nav.begin' },
] as const satisfies readonly { id: string; nav: MessageKey }[];

/**
 * Storytelling on scroll, without scrolljacking: each chapter's content rises into place
 * the first time it enters the view (once, never on the way back), and a thin line of
 * light on the page edge follows how far the story has gone. Nothing waits on scroll to
 * become usable: content is in the page from the start, and reduced motion shows it still.
 */
function useChapterReveal(enabled: boolean) {
  useEffect(() => {
    const root = document.documentElement;
    if (!enabled || !('IntersectionObserver' in window)) return;
    root.dataset.reveal = 'ready';
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.inview = 'true';
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    );
    document.querySelectorAll('main > section:not(#encounter)').forEach((s) => {
      observer.observe(s);
    });
    return () => {
      observer.disconnect();
      delete root.dataset.reveal;
    };
  }, [enabled]);
}

export function LandingPage() {
  const { t } = usePreferences();
  const reduce = useReducedMotion() ?? false;
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });
  useChapterReveal(!reduce);

  return (
    <SiteLayout sections={LANDING_SECTIONS.map((s) => ({ id: s.id, label: t(s.nav) }))}>
      <CosmicBackdrop variant="landing" />
      <motion.span className="story-progress" style={{ scaleY: reduce ? scrollYProgress : progress }} aria-hidden="true" />
      <Hero ctaTarget="begin" after={<ResumeBanner />} />
      <Beyond />
      <Discovery />
      <Connection />
      <Begin />
    </SiteLayout>
  );
}
