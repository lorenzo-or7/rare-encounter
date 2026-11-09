import {
  VOYAGE_HOLD,
  VOYAGE_MIN_MS,
  VOYAGE_SLOW_AFTER_MS,
  voyageComplete,
  voyageProgress,
  voyageSlow,
} from './voyage';

describe('voyage progress', () => {
  it('starts at zero and grows steadily over the nominal minimum', () => {
    expect(voyageProgress(0, false)).toBe(0);
    const samples = [500, 1500, 3000, 4500, 6000].map((t) => voyageProgress(t, true));
    for (let i = 1; i < samples.length; i++) expect(samples[i]).toBeGreaterThan(samples[i - 1] ?? 0);
  });

  it('never reads 100 % before the result exists, however long it takes', () => {
    for (const t of [VOYAGE_MIN_MS, VOYAGE_MIN_MS * 2, 60_000]) {
      expect(voyageProgress(t, false)).toBe(VOYAGE_HOLD);
      expect(voyageComplete(t, false)).toBe(false);
    }
  });

  it('respects the minimum even when the result is ready at once', () => {
    expect(voyageComplete(100, true)).toBe(false);
    expect(voyageProgress(VOYAGE_MIN_MS - 1, true)).toBeLessThan(1);
    expect(voyageComplete(VOYAGE_MIN_MS, true)).toBe(true);
    expect(voyageProgress(VOYAGE_MIN_MS, true)).toBe(1);
  });

  it('a late result completes as soon as it arrives', () => {
    expect(voyageProgress(VOYAGE_MIN_MS * 3, true)).toBe(1);
  });

  it('says it is slow only when clearly past the minimum and still working', () => {
    expect(voyageSlow(VOYAGE_MIN_MS, false)).toBe(false);
    expect(voyageSlow(VOYAGE_MIN_MS + VOYAGE_SLOW_AFTER_MS, false)).toBe(true);
    expect(voyageSlow(VOYAGE_MIN_MS * 5, true)).toBe(false);
  });
});
