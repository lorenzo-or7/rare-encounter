import { useSyncExternalStore } from 'react';

/**
 * Two public screens on the History API, without a router dependency: the landing at `/`
 * and the encounter at `/encounter` (Preparation now; the questions join it later). The
 * dev-only Visual Foundation specimen keeps `/foundation`.
 */
export const ENCOUNTER_PATH = '/encounter';

export type Route = 'landing' | 'encounter' | 'foundation';

/**
 * Where the app is served from: `/` locally, `/rare-encounter/` on GitHub Pages (set at
 * build time with `--base`). App paths stay root-relative (`/`, `/encounter`); these two
 * helpers translate them to and from real URLs.
 */
const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '');

/** A real URL path for an app path, e.g. `/encounter` → `/rare-encounter/encounter`. */
export const appHref = (path: string): string => `${BASE}${path}` || '/';

/** The app path of a real URL path (the base removed). */
export function appPath(pathname: string): string {
  const rest = BASE && pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname;
  return rest.startsWith('/') ? rest : `/${rest}`;
}

export function routeFromPath(pathname: string, dev: boolean): Route {
  const path = appPath(pathname).replace(/\/+$/, '') || '/';
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

/**
 * What the encounter keeps in its history entries:
 * - `encounter: 'quiz'` marks an entry where questions were on screen, so a reload resumes them;
 * - `encounter: 'resume'` asks the encounter to continue the saved session directly;
 * - `encounter: 'result'` marks the entry where the three matches are shown, so a reload
 *   shows the stored result again;
 * - `guard` is the one extra entry that lets browser Back open Pause instead of leaving.
 */
export interface EncounterHistoryState {
  readonly encounter?: 'quiz' | 'resume' | 'result';
  readonly guard?: boolean;
}

export function encounterHistoryState(): EncounterHistoryState {
  const state: unknown = window.history.state;
  return typeof state === 'object' && state !== null ? state : {};
}

/** Pushes a new history entry and starts the new screen at the top. */
export function navigate(path: string, state: EncounterHistoryState | null = null): void {
  if (appPath(window.location.pathname) === path) return;
  window.history.pushState(state, '', appHref(path));
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
