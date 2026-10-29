import { flip, poseFromPointer, REST_POSE, reveal, DEFAULT_MAX_TILT_DEG } from './card-motion';
import {
  buildSharePayload,
  SHARE_FORMATS,
  SHARE_PAYLOAD_KEYS,
  SHARE_PHRASES,
  SHARE_TEMPLATES,
  type ShareChoices,
} from './share';

const rect = { left: 100, top: 100, width: 200, height: 300 };

describe('Holo Card motion model', () => {
  it('tilts moderately toward the pointer, clamped at the edges', () => {
    const corner = poseFromPointer(100, 100, rect, { reducedMotion: false });
    expect(corner).toEqual({ rotateX: DEFAULT_MAX_TILT_DEG, rotateY: -DEFAULT_MAX_TILT_DEG, foilX: 0, foilY: 0 });
    const outside = poseFromPointer(10_000, 10_000, rect, { reducedMotion: false });
    expect(Math.abs(outside.rotateX)).toBe(DEFAULT_MAX_TILT_DEG);
    expect(poseFromPointer(200, 250, rect, { reducedMotion: false })).toEqual(REST_POSE);
  });

  it('stays at rest under reduced motion', () => {
    expect(poseFromPointer(100, 100, rect, { reducedMotion: true })).toEqual(REST_POSE);
  });

  it('flips both ways; the veil only ever reveals', () => {
    expect(flip(flip('front'))).toBe('front');
    expect(reveal()).toBe('revealed');
  });
});

describe('sharing contract', () => {
  const soul = { speciesId: 'fixture-north', speciesName: 'DEMO' };
  const choices: ShareChoices = { format: 'story', templateId: 't1', phraseId: 'p1', aura: true, outerFrame: false };
  const approved = { templates: ['t1'], phrases: ['p1'] };

  it('exports the two approved sizes', () => {
    expect(SHARE_FORMATS.story).toMatchObject({ width: 1080, height: 1920 });
    expect(SHARE_FORMATS.square).toMatchObject({ width: 1080, height: 1080 });
  });

  it('copies only allow-listed fields: answers or scores can never reach an image', () => {
    const leaky = { ...soul, answers: { q1: 'a' }, sessionId: 's', score: 0.9 };
    const r = buildSharePayload(leaky, choices, 'spectrum', approved);
    expect(r.ok).toBe(true);
    if (r.ok) expect(Object.keys(r.payload).sort()).toEqual([...SHARE_PAYLOAD_KEYS].sort());
  });

  it('refuses templates and phrases that are not approved; none are approved yet', () => {
    expect(SHARE_TEMPLATES).toEqual([]);
    expect(SHARE_PHRASES).toEqual([]);
    expect(buildSharePayload(soul, choices, 'spectrum')).toEqual({ ok: false, error: 'unknown-template' });
  });
});
