import { useCallback, useEffect, useRef } from 'react';
import { openEncounterStore, type EncounterStore } from '../../storage/encounter-store';

/**
 * Opens the IndexedDB store on first use and closes it when the screen unmounts. A failed
 * open is not cached, so "try again" really tries again.
 */
export function useEncounterStore(): () => Promise<EncounterStore> {
  const pending = useRef<Promise<EncounterStore> | null>(null);

  useEffect(
    () => () => {
      void pending.current?.then((store) => {
        store.close();
      });
      pending.current = null;
    },
    [],
  );

  return useCallback(() => {
    pending.current ??= openEncounterStore().catch((error: unknown) => {
      pending.current = null;
      throw error;
    });
    return pending.current;
  }, []);
}
