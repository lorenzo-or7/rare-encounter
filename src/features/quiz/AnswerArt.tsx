import { ImageNotFound01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useState } from 'react';
import type { ArtRatio } from '../../domain/answer-art';

type ArtState = 'loading' | 'ready' | 'failed';

interface AnswerArtProps {
  /** Missing in the data counts as unavailable: the neutral fallback shows at once. */
  readonly src: string | undefined;
  readonly ratio: ArtRatio;
}

/**
 * The image of an image answer. The frame owns the ratio, so loading, loaded and failed
 * states occupy exactly the same box and nothing shifts. While loading, a quiet skeleton;
 * if the image cannot be shown, a neutral surface with a small glyph. The option's name is
 * always printed beneath it, so the answer stays understandable and choosable either way.
 *
 * The image is decorative (alt=""): the visible caption names the choice.
 * Callers key this component by `src`, so a new image starts from `loading`.
 */
export function AnswerArt({ src, ratio }: AnswerArtProps) {
  const [state, setState] = useState<ArtState>(src ? 'loading' : 'failed');

  return (
    <span className="answer-art" data-ratio={ratio} data-state={state}>
      {src && state !== 'failed' && (
        <img
          className="answer-art__image"
          src={src}
          alt=""
          width={400}
          height={ratio === '1:1' ? 400 : 300}
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
        <span className="answer-art__fallback" aria-hidden="true">
          <HugeiconsIcon icon={ImageNotFound01Icon} size={22} strokeWidth={1.5} />
        </span>
      )}
    </span>
  );
}
