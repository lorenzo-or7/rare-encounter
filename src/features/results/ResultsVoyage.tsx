import { motion, useAnimationFrame, useMotionValue, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePreferences } from '../../app/preferences-context';
import { ARCHETYPES } from '../../components/archetype-card/archetypes';
import { Button } from '../../components/button/Button';
import { CosmicBackdrop } from '../../components/cosmos/CosmicBackdrop';
import { VOYAGE_SETTLE_MS, voyageComplete, voyageProgress, voyageSlow } from './voyage';
import './ResultsVoyage.css';

/**
 * The approved loading video (Google Flow, made for Rare Encounter), served as is from
 * public/media/. It is not in the repository (see scripts/setup-media.mjs); when it is
 * missing, fails, cannot autoplay or reduced motion is on, the static scene stands in.
 */
const VIDEO_SRC = `${import.meta.env.BASE_URL}media/encounter-loading.mp4`;

/** The static stand-in echoes the video: the three official card backs, floating. */
const BACKS = (['instinctive', 'ethereal', 'radiant'] as const).flatMap((id) => {
  const art = ARCHETYPES.find((a) => a.id === id)?.art;
  return art ? [{ id, art }] : [];
});

type VideoState = 'loading' | 'playing' | 'off';

interface ResultsVoyageProps {
  /** The result is computed and stored. */
  readonly ready: boolean;
  /** Computing failed: the screen says so and offers to try again. */
  readonly failed: boolean;
  readonly onRetry: () => void;
  /** 100 % has been shown: hand over to the results. */
  readonly onDone: () => void;
}

/**
 * Cinematic loading after the last answer. Text, progress and every state are rendered
 * here (localized), never baked into the video. The progress is honest: it runs for the
 * nominal 7 s minimum, holds short of 100 % until the result exists, says so if it takes
 * longer, and reaches 100 % only when both are true.
 */
export function ResultsVoyage({ ready, failed, onRetry, onDone }: ResultsVoyageProps) {
  const { t } = usePreferences();
  const reduce = useReducedMotion() ?? false;
  const fill = useMotionValue(0);
  const start = useRef<number | null>(null);
  const readyRef = useRef(ready);
  const pctRef = useRef<HTMLSpanElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const stepRef = useRef(0);
  const [step, setStep] = useState(0);
  const [slow, setSlow] = useState(false);
  const [complete, setComplete] = useState(false);
  const [video, setVideo] = useState<VideoState>(reduce ? 'off' : 'loading');

  useLayoutEffect(() => {
    readyRef.current = ready;
  }, [ready]);

  // The screen replaces the quiz: focus moves to its title so it is announced.
  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
  }, []);

  useAnimationFrame((time) => {
    if (failed || complete) return;
    start.current ??= time;
    const elapsed = time - start.current;
    const isReady = readyRef.current;
    const p = voyageProgress(elapsed, isReady);
    fill.set(p);
    if (pctRef.current) pctRef.current.textContent = `${String(Math.round(p * 100))}%`;
    // Assistive tech hears the progress in steps of ten, not sixty times a second.
    const next = Math.floor(p * 10) * 10;
    if (next !== stepRef.current) {
      stepRef.current = next;
      setStep(next);
    }
    setSlow(voyageSlow(elapsed, isReady));
    if (voyageComplete(elapsed, isReady)) setComplete(true);
  });

  useEffect(() => {
    if (!complete) return;
    const id = window.setTimeout(onDone, VOYAGE_SETTLE_MS);
    return () => {
      window.clearTimeout(id);
    };
  }, [complete, onDone]);

  // Muted autoplay, set on the element itself (some engines ignore the React prop for
  // autoplay); a refused play keeps the static scene.
  const attachVideo = useCallback((el: HTMLVideoElement | null) => {
    if (!el) return;
    el.muted = true;
    el.defaultMuted = true;
    void el.play().catch(() => {
      setVideo('off');
    });
  }, []);

  const status = failed ? null : complete ? t('loading.ready') : slow ? t('loading.slow') : t('loading.subtitle');

  return (
    <div className="voyage" data-mode="dark" data-video={video} data-complete={complete}>
      <CosmicBackdrop variant="loading" />
      <div className="voyage__still" aria-hidden="true">
        {BACKS.map(({ id, art }) => (
          <img key={id} className="voyage__card" data-card={id} src={art.src} alt="" width={1024} height={1536} decoding="async" />
        ))}
      </div>
      {video !== 'off' && (
        <video
          ref={attachVideo}
          className="voyage__video"
          src={VIDEO_SRC}
          muted
          autoPlay
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          aria-hidden="true"
          tabIndex={-1}
          onPlaying={() => {
            setVideo('playing');
          }}
          onError={() => {
            setVideo('off');
          }}
        />
      )}
      <div className="voyage__scrim" aria-hidden="true" />

      <div className="voyage__copy">
        <h1 ref={titleRef} className="voyage__title" tabIndex={-1}>
          {failed ? t('results.error.title') : t('loading.title')}
        </h1>
        {failed ? (
          <div className="voyage__error" role="alert">
            <p>{t('results.error.body')}</p>
            <Button onClick={onRetry}>{t('results.error.retry')}</Button>
          </div>
        ) : (
          <>
            <p className="voyage__status" aria-live="polite">
              {status}
            </p>
            <div className="voyage__meter">
              <div
                className="voyage__bar"
                data-slow={slow}
                role="progressbar"
                aria-label={t('loading.progress')}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={step}
              >
                <motion.span className="voyage__fill" style={{ scaleX: fill }} />
              </div>
              <span ref={pctRef} className="voyage__pct" aria-hidden="true" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
