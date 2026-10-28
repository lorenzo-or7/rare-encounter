import { usePreferences } from '../../app/preferences-context';
import { SiteLayout } from '../../components/layout/SiteLayout';
import { ResumeBanner } from '../../features/resume/ResumeBanner';
import type { MessageKey } from '../../i18n/messages';
import { Hero } from './Hero';
import { Begin } from './sections/Begin';
import { Beyond } from './sections/Beyond';
import { Connection } from './sections/Connection';
import { Discovery } from './sections/Discovery';

/** The four narrative sections after the hero, as listed in the nav. */
const LANDING_SECTIONS = [
  { id: 'beyond', nav: 'landing.nav.beyond' },
  { id: 'discovery', nav: 'landing.nav.discovery' },
  { id: 'connection', nav: 'landing.nav.connection' },
  { id: 'begin', nav: 'landing.nav.begin' },
] as const satisfies readonly { id: string; nav: MessageKey }[];

export function LandingPage() {
  const { t } = usePreferences();

  return (
    <SiteLayout sections={LANDING_SECTIONS.map((s) => ({ id: s.id, label: t(s.nav) }))}>
      <Hero ctaTarget="begin" />
      <Beyond />
      <Discovery />
      <Connection />
      <Begin />
      <ResumeBanner />
    </SiteLayout>
  );
}
