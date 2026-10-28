import { useId } from 'react';
import { usePreferences } from '../../app/preferences-context';
import { SiteLayout } from '../../components/layout/SiteLayout';
import type { MessageKey } from '../../i18n/messages';
import { Hero } from './Hero';
import './LandingPage.css';

/** The four narrative sections after the hero. Content arrives in 01B checkpoint 02. */
const LANDING_SECTIONS = [
  { id: 'beyond', nav: 'landing.nav.beyond', title: 'landing.section.beyond' },
  { id: 'discovery', nav: 'landing.nav.discovery', title: 'landing.section.discovery' },
  { id: 'connection', nav: 'landing.nav.connection', title: 'landing.section.connection' },
  { id: 'begin', nav: 'landing.nav.begin', title: 'landing.section.begin' },
] as const satisfies readonly { id: string; nav: MessageKey; title: MessageKey }[];

export function LandingPage() {
  const { t } = usePreferences();
  const uid = useId();

  return (
    <SiteLayout sections={LANDING_SECTIONS.map((s) => ({ id: s.id, label: t(s.nav) }))}>
      <Hero ctaTarget="begin" />
      {LANDING_SECTIONS.map((s) => (
        <section
          key={s.id}
          id={s.id}
          className="landing-section"
          aria-labelledby={`${uid}-${s.id}`}
        >
          <h2 id={`${uid}-${s.id}`} className="landing-section__title">
            {t(s.title)}
          </h2>
        </section>
      ))}
    </SiteLayout>
  );
}
