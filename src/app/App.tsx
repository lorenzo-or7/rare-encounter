import { MotionConfig } from 'motion/react';
import { lazy, Suspense } from 'react';
import { EncounterTransitionProvider } from '../features/encounter-transition/EncounterTransition';
import { PreparationDestination } from '../features/preparation/PreparationDestination';
import { loadEncounterPage } from '../pages/encounter/load';
import { LandingPage } from '../pages/landing/LandingPage';
import { PreferencesProvider } from './PreferencesProvider';
import { useRoute } from './routing';

// Dev-only Visual Foundation specimen. `import.meta.env.DEV` is statically false in
// production builds, so the page and its import are dropped from the bundle.
const FoundationPage = import.meta.env.DEV
  ? lazy(() => import('../pages/foundation/FoundationPage'))
  : null;

// The encounter screen loads on demand, so the landing does not carry its code.
const EncounterPage = lazy(loadEncounterPage);

export function App() {
  const route = useRoute();

  return (
    <MotionConfig reducedMotion="user">
      <PreferencesProvider>
        {route === 'foundation' && FoundationPage ? (
          <Suspense fallback={null}>
            <FoundationPage />
          </Suspense>
        ) : (
          <EncounterTransitionProvider>
            {route === 'encounter' ? (
              <Suspense fallback={null}>
                <EncounterPage />
              </Suspense>
            ) : (
              <>
                <PreparationDestination />
                <LandingPage />
              </>
            )}
          </EncounterTransitionProvider>
        )}
      </PreferencesProvider>
    </MotionConfig>
  );
}
