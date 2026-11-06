/**
 * Celestial Threads, card back. PROVISIONAL EMBLEM: the original celestial emblem has not
 * been drawn yet, so this is a temporary geometric mark (orbits, a central star, flowing
 * threads) in the theme's own accents. It copies no official symbol (no Poké Ball) and is
 * meant to be replaced by the approved artwork.
 */
export function CelestialEmblem() {
  return (
    <svg className="celestial" viewBox="0 0 200 280" aria-hidden="true" data-provisional="emblem">
      <defs>
        <linearGradient id="celestial-thread" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--accent)" />
          <stop offset="1" stopColor="var(--accent-2)" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#celestial-thread)" strokeLinecap="round">
        <path d="M-10 70 C 50 20, 150 120, 210 60" strokeWidth="0.8" opacity="0.55" />
        <path d="M-10 230 C 60 170, 140 270, 210 200" strokeWidth="0.8" opacity="0.55" />
        <path d="M-10 150 C 40 110, 160 190, 210 130" strokeWidth="0.6" opacity="0.4" />
        <circle cx="100" cy="140" r="54" strokeWidth="0.9" opacity="0.7" />
        <circle cx="100" cy="140" r="36" strokeWidth="0.6" opacity="0.5" />
        <ellipse cx="100" cy="140" rx="78" ry="22" strokeWidth="0.7" opacity="0.6" transform="rotate(-24 100 140)" />
        <ellipse cx="100" cy="140" rx="78" ry="22" strokeWidth="0.7" opacity="0.6" transform="rotate(24 100 140)" />
      </g>
      <path
        d="M100 118 C 102 132, 108 138, 122 140 C 108 142, 102 148, 100 162 C 98 148, 92 142, 78 140 C 92 138, 98 132, 100 118 Z"
        fill="url(#celestial-thread)"
      />
    </svg>
  );
}
