import { SiteLayout } from '../../components/layout/SiteLayout';
import { PreparationScreen } from '../../features/preparation/PreparationScreen';

/**
 * The encounter screen at `/encounter`. It holds the Preparation Screen; the questions
 * arrive in a later checkpoint. No section nav here: the brand link returns to the landing.
 */
export default function EncounterPage() {
  return (
    <SiteLayout sections={[]} brandHref="/">
      <PreparationScreen />
    </SiteLayout>
  );
}
