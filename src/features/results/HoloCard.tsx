import { motion, useReducedMotion } from 'motion/react';
import { useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { flip, poseFromPointer, REST_POSE, type CardFace, type CardPose } from '../../results/card-motion';
import { CelestialEmblem } from './CelestialEmblem';
import { SpeciesArt } from './SpeciesArt';

interface HoloCardProps {
  readonly name: string;
  readonly dexLabel: string;
  readonly dex: number;
  readonly art: string | null;
  readonly artAlt: string;
  readonly flipLabel: string;
  readonly flipBackLabel: string;
  readonly backLabel: string;
}

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Holo Card (Results Experience, Design Locked v1): Ethereal Frame + Full Art on the front,
 * Celestial Threads on the back. Moderate tilt and a restrained foil follow the pointer or
 * touch and settle back at rest; the flip is a real button (click, tap, Enter, Space).
 * Hybrid Reveal: the art arrives first, then the frame and the name settle around it.
 * Reduced motion: no tilt, no reveal choreography, and the flip swaps faces without turning.
 */
export function HoloCard({ name, dexLabel, dex, art, artAlt, flipLabel, flipBackLabel, backLabel }: HoloCardProps) {
  const reduce = useReducedMotion() ?? false;
  const [pose, setPose] = useState<CardPose>(REST_POSE);
  const [face, setFace] = useState<CardFace>('front');
  const ref = useRef<HTMLDivElement>(null);

  const move = (e: PointerEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) setPose(poseFromPointer(e.clientX, e.clientY, rect, { reducedMotion: reduce }));
  };
  const rest = () => {
    setPose(REST_POSE);
  };

  const style = {
    '--rx': `${String(pose.rotateX)}deg`,
    '--ry': `${String(pose.rotateY)}deg`,
    '--fx': `${String(pose.foilX * 100)}%`,
    '--fy': `${String(pose.foilY * 100)}%`,
  } as CSSProperties;

  const intro = (delay: number) =>
    reduce
      ? {}
      : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay, duration: 0.7, ease: EASE } };

  return (
    <div className="holo-wrap">
      <div
        ref={ref}
        className="holo"
        style={style}
        data-face={face}
        data-still={reduce}
        onPointerMove={move}
        onPointerLeave={rest}
        onPointerCancel={rest}
      >
        <motion.div
          className="holo__inner"
          {...(reduce
            ? {}
            : { animate: { rotateY: face === 'back' ? 180 : 0 }, transition: { duration: 0.7, ease: EASE } })}
        >
          <div className="holo__face holo__front" aria-hidden={face === 'back'}>
            <motion.div
              className="holo__art"
              {...(reduce
                ? {}
                : { initial: { opacity: 0, scale: 1.12 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 1.1, ease: EASE } })}
            >
              <SpeciesArt src={art} alt={artAlt} dex={dex} eager />
            </motion.div>
            <motion.span className="holo__frame" aria-hidden="true" {...intro(0.8)} />
            <span className="holo__foil" aria-hidden="true" />
            <motion.p className="holo__dex" {...intro(1)}>
              {dexLabel}
            </motion.p>
            <motion.p className="holo__name" {...intro(1.1)}>
              {name}
            </motion.p>
          </div>
          <div className="holo__face holo__back" role="img" aria-label={backLabel} aria-hidden={face === 'front'}>
            <span className="holo__frame" aria-hidden="true" />
            <CelestialEmblem />
          </div>
        </motion.div>
      </div>
      <button
        type="button"
        className="holo__flip"
        aria-pressed={face === 'back'}
        onClick={() => {
          setFace(flip);
        }}
      >
        {face === 'front' ? flipLabel : flipBackLabel}
      </button>
    </div>
  );
}
