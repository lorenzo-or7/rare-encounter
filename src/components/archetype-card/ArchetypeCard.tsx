import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react';
import { useId, useState, type CSSProperties, type PointerEvent } from 'react';
import { Icon } from '../icon/Icon';
import type { Archetype } from './archetypes';
import './ArchetypeCard.css';

interface ArchetypeCardProps {
  readonly archetype: Archetype;
  readonly name: string;
  readonly phrase: string;
  readonly discoverLabel: string;
  readonly hideLabel: string;
  readonly artPendingLabel: string;
}

const TILT_DEG = 6;
const SPRING = { stiffness: 260, damping: 24, mass: 0.6 };

/**
 * Floating Archetype Card. Art is a decorative layer; number, title, phrase and the
 * discover action are real, localized DOM. Interactive Discovery: tilt + glow on hover
 * (fine pointers only), brief phrase reveal on click/tap, no modal.
 */
export function ArchetypeCard({
  archetype,
  name,
  phrase,
  discoverLabel,
  hideLabel,
  artPendingLabel,
}: ArchetypeCardProps) {
  const [revealed, setRevealed] = useState(false);
  const reduceMotion = useReducedMotion() ?? false;
  const phraseId = useId();
  const titleId = useId();

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [TILT_DEG, -TILT_DEG]), SPRING);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-TILT_DEG, TILT_DEG]), SPRING);

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (reduceMotion || e.pointerType !== 'mouse') return;
    const rect = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width - 0.5);
    py.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const resetTilt = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <article
      className="archetype-card"
      aria-labelledby={titleId}
      data-archetype={archetype.id}
      data-revealed={revealed}
      style={{ '--card-hue': archetype.hue } as CSSProperties}
      onPointerMove={onPointerMove}
      onPointerLeave={resetTilt}
    >
      <motion.div className="archetype-card__body" style={{ rotateX, rotateY }}>
        <div className="archetype-card__art">
          {archetype.art ? (
            <img src={archetype.art} alt="" width={1024} height={1536} decoding="async" />
          ) : (
            <p className="archetype-card__pending">
              <Icon name="sparkle" size={14} />
              {artPendingLabel}
            </p>
          )}
        </div>

        <div className="archetype-card__content">
          <p className="archetype-card__number">{archetype.number}</p>
          <h3 id={titleId} className="archetype-card__title">
            {name}
          </h3>

          <AnimatePresence initial={false}>
            {revealed && (
              <motion.p
                key="phrase"
                id={phraseId}
                className="archetype-card__phrase"
                initial={{ opacity: 0, y: 8, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: 4, filter: 'blur(4px)' }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              >
                {phrase}
              </motion.p>
            )}
          </AnimatePresence>

          <button
            type="button"
            className="archetype-card__action"
            aria-expanded={revealed}
            aria-controls={revealed ? phraseId : undefined}
            onClick={() => {
              setRevealed((v) => !v);
            }}
          >
            <Icon name="sparkle" size={16} />
            <span>{revealed ? hideLabel : discoverLabel}</span>
          </button>
        </div>
      </motion.div>
    </article>
  );
}
