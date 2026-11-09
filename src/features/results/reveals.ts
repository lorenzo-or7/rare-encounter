/**
 * Which encounters of a result have been discovered. This is the persistent `revealed`
 * state; which face a card currently shows (`faceUp`) is a separate, local choice: turning
 * a discovered card back over never forgets the discovery.
 */
export type RevealKey = 'soul' | 'alternative' | 'hidden' | 'mystery';

const KEY = (sessionId: string) => `rare-encounter:reveals:${sessionId}`;
/** Before the three-card results, only the Hidden Match had a veil; its key is honoured. */
const LEGACY_HIDDEN = (sessionId: string) => `rare-encounter:hidden-revealed:${sessionId}`;
const KEYS: readonly RevealKey[] = ['soul', 'alternative', 'hidden', 'mystery'];

export function readReveals(sessionId: string): ReadonlySet<RevealKey> {
  const out = new Set<RevealKey>();
  try {
    const raw = localStorage.getItem(KEY(sessionId));
    const list: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(list)) for (const k of KEYS) if (list.includes(k)) out.add(k);
    if (localStorage.getItem(LEGACY_HIDDEN(sessionId)) === '1') out.add('hidden');
  } catch {
    // Unreadable storage: everything starts hidden again, which is the safe direction.
  }
  return out;
}

export function saveReveals(sessionId: string, reveals: ReadonlySet<RevealKey>): void {
  try {
    localStorage.setItem(KEY(sessionId), JSON.stringify([...reveals]));
  } catch {
    // Without storage the discovery still holds for this visit.
  }
}
