/**
 * A small drawing for each discovery step, traced in light when the step opens:
 * 1. an orbit around a centre (looking inward);
 * 2. two orbits meeting (a connection);
 * 3. a card with a spark (the reveal).
 * Decorative: the step's heading and text carry the meaning.
 */
export function StepGlyph({ step }: { step: 1 | 2 | 3 }) {
  return (
    <svg className="step-glyph" data-step={step} viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`step-glyph-${String(step)}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--accent)" />
          <stop offset="1" stopColor="var(--accent-2)" />
        </linearGradient>
      </defs>
      <g stroke={`url(#step-glyph-${String(step)})`} fill="none" strokeWidth="1.5" strokeLinecap="round">
        {step === 1 && (
          <>
            <circle className="step-glyph__trace" cx="60" cy="60" r="44" pathLength={1} />
            <circle className="step-glyph__trace step-glyph__trace--late" cx="60" cy="60" r="28" pathLength={1} strokeDasharray="0.02 0.03" />
            <circle className="step-glyph__core" cx="60" cy="60" r="6" fill="var(--accent)" stroke="none" />
            <circle className="step-glyph__core" cx="104" cy="60" r="3" fill="var(--accent-2)" stroke="none" />
          </>
        )}
        {step === 2 && (
          <>
            <circle className="step-glyph__trace" cx="44" cy="60" r="30" pathLength={1} />
            <circle className="step-glyph__trace step-glyph__trace--late" cx="76" cy="60" r="30" pathLength={1} />
            <path className="step-glyph__trace step-glyph__trace--last" d="M60 36v48" pathLength={1} />
            <circle className="step-glyph__core" cx="60" cy="60" r="4" fill="var(--accent-2)" stroke="none" />
          </>
        )}
        {step === 3 && (
          <>
            <rect className="step-glyph__trace" x="32" y="16" width="56" height="88" rx="8" pathLength={1} />
            <rect className="step-glyph__trace step-glyph__trace--late" x="39" y="24" width="42" height="50" rx="5" pathLength={1} />
            <path
              className="step-glyph__core"
              d="M60 34c.6 6 3.8 9.2 12 12-8.2 2.8-11.4 6-12 12-.6-6-3.8-9.2-12-12 8.2-2.8 11.4-6 12-12Z"
              fill="var(--accent)"
              stroke="none"
            />
            <path className="step-glyph__trace step-glyph__trace--last" d="M44 88h32" pathLength={1} />
          </>
        )}
      </g>
    </svg>
  );
}
