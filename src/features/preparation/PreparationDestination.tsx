import { useEffect } from 'react';
import { ENCOUNTER_PATH, navigate } from '../../app/routing';
import { loadEncounterPage } from '../../pages/encounter/load';
import { PREPARATION, useEncounterTransition } from '../encounter-transition/context';
import { takeResumeRequest } from '../resume/intent';

/**
 * Registers the Preparation Screen as the Liquid Flow destination while the landing is
 * shown. Once the liquid covers the page the encounter route mounts underneath it, and the
 * layer drains away over the new screen. Registering also enables the closing CTA.
 */
export function PreparationDestination() {
  const { register } = useEncounterTransition();

  useEffect(
    () =>
      register(PREPARATION, () => {
        // From the resume banner the encounter continues the saved session directly.
        navigate(ENCOUNTER_PATH, takeResumeRequest() ? { encounter: 'resume' } : null);
      }),
    [register],
  );

  // Fetch the encounter chunk while the visitor reads, so the reveal never waits on it.
  useEffect(() => {
    const prefetch = () => {
      void loadEncounterPage();
    };
    // Safari has no requestIdleCallback; a short timeout serves the same purpose there.
    if ('requestIdleCallback' in window) window.requestIdleCallback(prefetch);
    else setTimeout(prefetch, 1500);
  }, []);

  return null;
}
