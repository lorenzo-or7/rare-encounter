import {
  clearSessionMarker,
  onSessionMarkerChange,
  readSessionMarker,
  SESSION_MARKER_KEY,
  writeSessionMarker,
  type SessionMarker,
} from './session-marker';

const marker: SessionMarker = {
  sessionId: 's1',
  mode: 60,
  answered: 12,
  total: 60,
  revision: 12,
  updatedAt: '2026-10-28T10:00:00.000Z',
};

describe('session marker (localStorage)', () => {
  it('round-trips in a versioned envelope', () => {
    writeSessionMarker(marker);
    expect(JSON.parse(localStorage.getItem(SESSION_MARKER_KEY) ?? '')).toMatchObject({
      schemaVersion: 1,
      data: marker,
    });
    expect(readSessionMarker()).toEqual(marker);
    clearSessionMarker();
    expect(readSessionMarker()).toBeNull();
  });

  it('ignores malformed or future data without erasing it', () => {
    for (const raw of ['{not json', '{"schemaVersion":1,"data":{"mode":45}}', '{"schemaVersion":9,"data":{}}']) {
      localStorage.setItem(SESSION_MARKER_KEY, raw);
      expect(readSessionMarker()).toBeNull();
      expect(localStorage.getItem(SESSION_MARKER_KEY)).toBe(raw);
    }
  });

  it('survives unavailable storage', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });
    expect(() => {
      writeSessionMarker(marker);
    }).not.toThrow();
  });

  it('reports changes made by another tab', () => {
    const seen: (SessionMarker | null)[] = [];
    const stop = onSessionMarkerChange((m) => seen.push(m));
    writeSessionMarker(marker);
    window.dispatchEvent(new StorageEvent('storage', { key: SESSION_MARKER_KEY }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'unrelated' }));
    stop();
    window.dispatchEvent(new StorageEvent('storage', { key: SESSION_MARKER_KEY }));
    expect(seen).toEqual([marker]);
  });
});
