import { lazy, Suspense, useState } from 'react';
import { readSessionMarker } from '../../storage/session-marker';

const Content = lazy(() => import('./ResumeBannerContent'));

/**
 * Landing entry point for the resume banner. Reading the localStorage marker is
 * synchronous and cheap; only when it says an encounter may be waiting does the banner's
 * code (IndexedDB, session checks, preview questions) load.
 */
export function ResumeBanner() {
  const [marked] = useState(() => readSessionMarker() !== null);
  if (!marked) return null;
  return (
    <Suspense fallback={null}>
      <Content />
    </Suspense>
  );
}
