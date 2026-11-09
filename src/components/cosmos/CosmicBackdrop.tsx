import { useReducedMotion } from 'motion/react';
import { useEffect, useMemo, useRef } from 'react';
import './CosmicBackdrop.css';

/**
 * Where the backdrop sits sets how much of the cosmos shows:
 * - landing: the full scene behind the story (nebulae, stars, bands, two crystals);
 * - quiz: discreet, so questions stay the only thing that asks for attention;
 * - results: the deepest scene (orbs, crystals, light bands) around the encounters;
 * - loading: the static stand-in for the video (no file, reduced motion, failure).
 */
export type CosmosVariant = 'landing' | 'quiz' | 'results' | 'loading';

interface CosmicBackdropProps {
  readonly variant: CosmosVariant;
  /** Results: the lights come on once the scene is ready (entrance). */
  readonly lit?: boolean;
}

interface Star {
  readonly x: number;
  readonly y: number;
  readonly r: number;
  readonly o: number;
  readonly twinkle: boolean;
}

/** Deterministic: the same sky on every visit, no layout shift, no randomness at render. */
function sky(seed: number, count: number, maxR: number, twinkles: number): readonly Star[] {
  let s = seed;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  return Array.from({ length: count }, (_, i) => ({
    x: rnd() * 1600,
    y: rnd() * 1000,
    r: 0.4 + rnd() * maxR,
    o: 0.25 + rnd() * 0.65,
    twinkle: i < twinkles,
  }));
}

const DENSITY: Readonly<Record<CosmosVariant, readonly [number, number, number]>> = {
  landing: [110, 46, 14],
  quiz: [70, 22, 6],
  results: [120, 54, 18],
  loading: [120, 54, 16],
};

/**
 * One fixed layer behind the page. Every movement is transform or opacity: nebulae drift
 * on long cycles, a few stars twinkle, and on a fine pointer the layers lean a few pixels
 * toward the cursor (depth by distance). Reduced motion: a still sky.
 */
export function CosmicBackdrop({ variant, lit = true }: CosmicBackdropProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion() ?? false;
  const [far, near, twinkles] = DENSITY[variant];
  const layers = useMemo(
    () => ({ far: sky(7, far, 0.9, 0), near: sky(91, near, 1.5, twinkles) }),
    [far, near, twinkles],
  );

  // Pointer parallax: one rAF-batched style write per frame, fine pointers only.
  useEffect(() => {
    const el = ref.current;
    const fine = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: fine)').matches;
    if (!el || reduce || !fine) return;
    let frame = 0;
    let x = 0;
    let y = 0;
    const onMove = (e: PointerEvent) => {
      x = (e.clientX / window.innerWidth) * 2 - 1;
      y = (e.clientY / window.innerHeight) * 2 - 1;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        el.style.setProperty('--px', x.toFixed(3));
        el.style.setProperty('--py', y.toFixed(3));
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(frame);
    };
  }, [reduce]);

  const rich = variant === 'landing' || variant === 'results' || variant === 'loading';

  return (
    <div ref={ref} className="cosmos" data-variant={variant} data-lit={lit} data-still={reduce} aria-hidden="true">
      <div className="cosmos__nebula cosmos__nebula--a" />
      <div className="cosmos__nebula cosmos__nebula--b" />
      <div className="cosmos__nebula cosmos__nebula--c" />
      <svg className="cosmos__stars cosmos__stars--far" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
        {layers.far.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} opacity={s.o * 0.7} />
        ))}
      </svg>
      <svg className="cosmos__stars cosmos__stars--near" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
        {layers.near.map((s, i) => (
          <circle
            key={i}
            className={s.twinkle ? 'cosmos__twinkle' : undefined}
            style={s.twinkle ? { animationDelay: `${String(-(i * 1.7) % 9)}s` } : undefined}
            cx={s.x}
            cy={s.y}
            r={s.r}
            opacity={s.o}
          />
        ))}
      </svg>
      {variant !== 'quiz' && (
        <>
          <span className="cosmos__band cosmos__band--a" />
          <span className="cosmos__band cosmos__band--b" />
        </>
      )}
      {rich && (
        <div className="cosmos__float">
          <Crystal className="cosmos__crystal cosmos__crystal--a" />
          <Crystal className="cosmos__crystal cosmos__crystal--b" />
          {variant !== 'landing' && <Crystal className="cosmos__crystal cosmos__crystal--c" />}
          <span className="cosmos__orb cosmos__orb--a" />
          <span className="cosmos__orb cosmos__orb--b" />
          {variant === 'results' && <span className="cosmos__orb cosmos__orb--c" />}
        </div>
      )}
      <div className="cosmos__veil" />
    </div>
  );
}

/** A faceted shard: outline in light, faint inner facets. */
function Crystal({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 60 120">
      <polygon className="cosmos__facet" points="30,2 52,38 40,118 20,118 8,38" />
      <polyline className="cosmos__edge" points="30,2 30,118" />
      <polyline className="cosmos__edge" points="8,38 30,52 52,38" />
    </svg>
  );
}
