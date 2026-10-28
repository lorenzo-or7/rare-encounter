import { MotionConfig } from 'motion/react';
import { lazy, Suspense } from 'react';
import { LandingPage } from '../pages/landing/LandingPage';
import { PreferencesProvider } from './PreferencesProvider';

// Dev-only Visual Foundation specimen. `import.meta.env.DEV` is statically false in
// production builds, so the page and its import are dropped from the bundle.
const FoundationPage = import.meta.env.DEV
  ? lazy(() => import('../pages/foundation/FoundationPage'))
  : null;

export function App() {
  const showFoundation = FoundationPage !== null && window.location.pathname === '/foundation';

  return (
    <MotionConfig reducedMotion="user">
      <PreferencesProvider>
        {showFoundation ? (
          <Suspense fallback={null}>
            <FoundationPage />
          </Suspense>
        ) : (
          <LandingPage />
        )}
      </PreferencesProvider>
    </MotionConfig>
  );
}
