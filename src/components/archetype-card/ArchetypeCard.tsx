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

        {/*
         * Discovery happens in the art's window, where the question mark lives: the mark
         * dissolves into light (a copy of the window lifting away), a field of the card's
         * hue opens from the centre, and the sigil and phrase appear in its place. The
         * plate below keeps the title and the button only, so nothing below moves.
         */}
        <AnimatePresence initial={false}>
          {revealed && (
            <motion.div
              key="window"
              className="archetype-card__window"
              aria-hidden="true"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, clipPath: 'circle(0% at 50% 45%)' }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, clipPath: 'circle(120% at 50% 45%)' }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, clipPath: 'circle(0% at 50% 45%)' }}
              transition={{ duration: reduceMotion ? 0.15 : 0.7, ease: [0.22, 1, 0.36, 1] }}
            />
          )}
        </AnimatePresence>

        {archetype.art && !reduceMotion && (
          <AnimatePresence initial={false}>
            {revealed && (
              <motion.div
                key="dissolve"
                className="archetype-card__dissolve"
                aria-hidden="true"
                initial={{ opacity: 1, scale: 1, filter: 'blur(0px) brightness(1)' }}
                animate={{ opacity: 0, scale: 1.18, filter: 'blur(14px) brightness(1.8)' }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                <img src={archetype.art.src} srcSet={archetype.art.srcSet} sizes="(min-width: 48em) 20rem, 80vw" alt="" width={1024} height={1536} />
              </motion.div>
            )}
          </AnimatePresence>
        )}

        <AnimatePresence initial={false}>
          {revealed && (
            <motion.div
              key="phrase"
              className="archetype-card__reveal"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, filter: 'blur(6px)' }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4, filter: 'blur(4px)' }}
              transition={{ duration: reduceMotion ? 0.15 : 0.45, delay: reduceMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="archetype-card__sigil" aria-hidden="true">
                <Icon name="sparkle" size={28} />
              </span>
              <p id={phraseId} className="archetype-card__phrase">
                {phrase}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="archetype-card__number">{archetype.number}</p>

        <div className="archetype-card__content">
          <h3 id={titleId} className="archetype-card__title">
            {name}
          </h3>

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
