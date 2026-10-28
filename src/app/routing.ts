import { useSyncExternalStore } from 'react';

/**
 * Two public screens on the History API, without a router dependency: the landing at `/`
 * and the encounter at `/encounter` (Preparation now; the questions join it later). The
 * dev-only Visual Foundation specimen keeps `/foundation`.
 */
export const ENCOUNTER_PATH = '/encounter';

export type Route = 'landing' | 'encounter' | 'foundation';

export function routeFromPath(pathname: string, dev: boolean): Route {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === ENCOUNTER_PATH) return 'encounter';
  if (dev && path === '/foundation') return 'foundation';
  return 'landing';
}

const CHANGE = 'rare-encounter:navigate';

/** Becomes true after the first in-app navigation, so screens know focus should move to them. */
let navigatedInApp = false;

export function hasNavigatedInApp(): boolean {
  return navigatedInApp;
}

/** Pushes a new history entry and starts the new screen at the top. */
export function navigate(path: string): void {
  if (window.location.pathname === path) return;
  window.history.pushState(null, '', path);
  navigatedInApp = true;
  window.scrollTo(0, 0);
  window.dispatchEvent(new Event(CHANGE));
}

function subscribe(notify: () => void): () => void {
  const onPop = () => {
    navigatedInApp = true;
    notify();
  };
  window.addEventListener('popstate', onPop);
  window.addEventListener(CHANGE, notify);
  return () => {
    window.removeEventListener('popstate', onPop);
    window.removeEventListener(CHANGE, notify);
  };
}

export function useRoute(): Route {
  const pathname = useSyncExternalStore(
    subscribe,
    () => window.location.pathname,
    () => '/',
  );
  return routeFromPath(pathname, import.meta.env.DEV);
}
