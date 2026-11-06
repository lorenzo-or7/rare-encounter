import { useState } from 'react';

interface SpeciesArtProps {
  readonly src: string | null;
  /** Accessible description; empty when the art is decorative or must stay secret. */
  readonly alt: string;
  readonly dex: number;
  readonly silhouette?: boolean;
  readonly eager?: boolean;
}

/**
 * Official artwork with a stable box: while loading, a quiet surface; if the image cannot
 * load (offline, blocked host), the National Pokédex number stands in, so the result stays
 * readable. The species name is always printed next to the art by the caller.
 */
export function SpeciesArt({ src, alt, dex, silhouette = false, eager = false }: SpeciesArtProps) {
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>(src ? 'loading' : 'failed');
  return (
    <span className="species-art" data-state={state} data-silhouette={silhouette}>
      {src && state !== 'failed' && (
        <img
          className="species-art__image"
          src={src}
          alt={alt}
          width={475}
          height={475}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => {
            setState('ready');
          }}
          onError={() => {
            setState('failed');
          }}
        />
      )}
      {state === 'failed' && (
        <span className="species-art__fallback" aria-hidden="true">
          {String(dex).padStart(4, '0')}
        </span>
      )}
    </span>
  );
}
