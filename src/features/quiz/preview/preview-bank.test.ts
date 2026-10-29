import { CATEGORY_IDS } from '../../../domain/categories';
import { LOCALES } from '../../../i18n/locales';
import { MODE_IDS, MODES } from '../../../domain/modes';
import { PREVIEW_SOURCE } from './preview-bank';

describe('preview question source', () => {
  it('is marked as a preview and carries no scoring effects', () => {
    expect(PREVIEW_SOURCE.preview).toBe(true);
    for (const id of PREVIEW_SOURCE.start(30)) {
      for (const option of PREVIEW_SOURCE.question(id)?.options ?? []) {
        expect(option.effects).toEqual({});
      }
    }
  });

  it.each(MODE_IDS)('fills mode %i with its exact length, category quotas and unique ids', (mode) => {
    const ids = PREVIEW_SOURCE.start(mode);
    expect(ids).toHaveLength(mode);
    expect(new Set(ids).size).toBe(mode);
    for (const category of CATEGORY_IDS) {
      const count = ids.filter((id) => PREVIEW_SOURCE.question(id)?.category === category).length;
      expect(count).toBe(MODES[mode].quotas[category]);
    }
  });

  it('shows all three formats within the first six questions', () => {
    const formats = PREVIEW_SOURCE.start(30)
      .slice(0, 6)
      .map((id) => PREVIEW_SOURCE.question(id)?.format);
    expect(new Set(formats)).toEqual(new Set(['text', 'photo', 'icon-text']));
  });

  it('has every prompt, label and image description in all three languages', () => {
    for (const id of PREVIEW_SOURCE.start(90)) {
      const q = PREVIEW_SOURCE.question(id);
      expect(q).toBeDefined();
      for (const locale of LOCALES) {
        expect(q?.prompt[locale]).toBeTruthy();
        for (const o of q?.options ?? []) {
          expect(o.label[locale]).toBeTruthy();
          if (o.media) expect(o.media.alt[locale]).toBeTruthy();
        }
      }
      if (q?.format !== 'text') expect(q?.options.every((o) => o.media)).toBe(true);
    }
  });
});
