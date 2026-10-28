import {
  AnimatePresence,
  motion,
  useMotionTemplate,
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
/** Slightly under-damped: the card settles back with one small, controlled overshoot. */
const SPRING = { stiffness: 220, damping: 17, mass: 0.7 };
const GLARE_SPRING = { stiffness: 160, damping: 26 };

/**
 * Floating Archetype Card. The approved art is a decorative layer; number, title, phrase
 * and the discover action are real, localized DOM placed in the art's cleared areas.
 * Interactive Discovery: tilt with a light reflection that follows the pointer (fine
 * pointers only), phrase reveal on click/tap, no modal.
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

  // Reflection: a soft highlight that sits where the pointer is, fading in and out.
  const glareX = useSpring(useTransform(px, [-0.5, 0.5], [0, 100]), GLARE_SPRING);
  const glareY = useSpring(useTransform(py, [-0.5, 0.5], [0, 100]), GLARE_SPRING);
  const glareOpacity = useSpring(0, GLARE_SPRING);
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgb(255 255 255 / 0.22), transparent 55%)`;

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (reduceMotion || e.pointerType !== 'mouse') return;
    const rect = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width - 0.5);
    py.set((e.clientY - rect.top) / rect.height - 0.5);
    glareOpacity.set(1);
  };

  const release = () => {
    px.set(0);
    py.set(0);
    glareOpacity.set(0);
  };

  const hasArt = archetype.art !== null;

  return (
    <article
      className="archetype-card"
      // The approved art is dark glass in every mode, so its text keeps the dark tokens.
      data-mode="dark"
      aria-labelledby={titleId}
      data-archetype={archetype.id}
      data-art={hasArt}
      data-revealed={revealed}
      style={
        {
          '--card-hue': archetype.hue,
          '--card-mask': archetype.art ? `url(${archetype.art.src})` : 'none',
        } as CSSProperties
      }
      onPointerMove={onPointerMove}
      onPointerLeave={release}
    >
      <motion.div className="archetype-card__body" style={{ rotateX, rotateY }}>
        <div className="archetype-card__art">
          {archetype.art ? (
            <img
              src={archetype.art.src}
              srcSet={archetype.art.srcSet}
              sizes="(min-width: 48em) 20rem, 80vw"
              alt=""
              width={1024}
              height={1536}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <p className="archetype-card__pending">
              <Icon name="sparkle" size={14} />
              {artPendingLabel}
            </p>
          )}
        </div>

        {!reduceMotion && (
          <motion.div
            className="archetype-card__glare"
            style={{ backgroundImage: glare, opacity: glareOpacity }}
            aria-hidden="true"
          />
        )}

        <p className="archetype-card__number">{archetype.number}</p>

        <div className="archetype-card__content">
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
