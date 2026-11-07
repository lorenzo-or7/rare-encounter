import type { ModeId } from '../../domain/modes';
import './PortalGlyph.css';

/**
 * The face of each depth, drawn as a portal. Depth shows as structure, not as a claim:
 * - 30, A Glimpse: one ring, an open core; light and calm;
 * - 60, The Journey: two rings, one turning, a body in orbit; energetic;
 * - 90, Deep Connection: three rings turning against each other around an eclipsed core;
 *   intense and mysterious.
 * More rings mean more questions, nothing more: no precision is implied.
 * Decorative; the depth's name and question count carry the meaning.
 */
export function PortalGlyph({ mode, active = false }: { mode: ModeId; active?: boolean }) {
  const id = `portal-${String(mode)}`;
  return (
    <svg className="portal" data-depth={mode} data-active={active} viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`${id}-core`}>
          <stop offset="0" stopColor="var(--portal-core)" stopOpacity="0.95" />
          <stop offset="0.55" stopColor="var(--accent)" stopOpacity="0.35" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-ring`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--accent)" />
          <stop offset="1" stopColor="var(--accent-2)" />
        </linearGradient>
      </defs>
      <circle className="portal__halo" cx="60" cy="60" r="44" fill={`url(#${id}-core)`} />
      <g fill="none" stroke={`url(#${id}-ring)`} strokeLinecap="round">
        <circle className="portal__ring portal__ring--1" cx="60" cy="60" r="34" strokeWidth="1.4" />
        {mode >= 60 && (
          <g className="portal__spin portal__spin--a">
            <circle className="portal__ring" cx="60" cy="60" r="46" strokeWidth="1" strokeDasharray="3 7" />
            <circle cx="106" cy="60" r="2.6" fill="var(--accent-2)" stroke="none" />
          </g>
        )}
        {mode >= 90 && (
          <g className="portal__spin portal__spin--b">
            <ellipse className="portal__ring" cx="60" cy="60" rx="56" ry="20" strokeWidth="0.9" opacity="0.8" />
            <circle cx="4" cy="60" r="1.8" fill="var(--accent)" stroke="none" />
          </g>
        )}
      </g>
      {mode >= 90 ? (
        <>
          <circle cx="60" cy="60" r="13" fill="var(--portal-eclipse)" />
          <circle cx="60" cy="60" r="13" fill="none" stroke="var(--accent-2)" strokeWidth="1.2" className="portal__rim" />
        </>
      ) : (
        <circle className="portal__core" cx="60" cy="60" r={mode >= 60 ? 7 : 5} fill="var(--portal-core)" />
      )}
    </svg>
  );
}
