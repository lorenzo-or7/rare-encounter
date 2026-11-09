import { motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';
import { Button } from '../../components/button/Button';
import type { CardArt } from '../../components/archetype-card/archetypes';
import { SpeciesArt } from './SpeciesArt';

export type CardTone = 'ethereal' | 'radiant' | 'instinctive';
/** Each encounter turns in its own way; the mechanics (state, keys, a11y) are the same. */
export type RevealStyle = 'soul' | 'alternative' | 'hidden' | 'mystery';

export interface CardFront {
  readonly name: string;
  readonly dexLabel: string;
  readonly art: string | null;
  readonly artAlt: string;
  readonly dex: number;
}

interface ResultCardProps {
  readonly tone: CardTone;
  readonly back: CardArt;
  readonly style: RevealStyle;
  /** Persistent discovery: once true the front exists and the card can be turned freely. */
  readonly revealed: boolean;
  /** The encounter before this one is still hidden: revealing waits for it. */
  readonly locked: boolean;
  /** Rendered only after the discovery, so nothing about the species reaches the page early. */
  readonly front: CardFront | null;
  readonly revealLabel: string;
  readonly flipLabel: string;
  readonly flipBackLabel: string;
  readonly unrevealedLabel: string;
  readonly frontLabel: string;
  readonly onReveal: () => void;
}

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The turn for each encounter: Soul is the main moment, Hidden the slowest and darkest.
 * Light and shade play on a separate layer: a filter on the 3D container would flatten it
 * and show the back through the front.
 */
const TURN: Readonly<
  Record<RevealStyle, { duration: number; scale: number[]; shade: number[]; light: number[]; burst: number }>
> = {
  soul: { duration: 0.9, scale: [1, 1.06, 1], shade: [0, 0, 0], light: [0, 0.55, 0], burst: 0.85 },
  alternative: { duration: 0.75, scale: [1, 1.03, 1], shade: [0, 0, 0], light: [0, 0.35, 0], burst: 0.6 },
  hidden: { duration: 1.15, scale: [1, 0.97, 1.02, 1], shade: [0, 0.6, 0, 0], light: [0, 0, 0.5, 0], burst: 0.75 },
  mystery: { duration: 1.4, scale: [1, 0.96, 1.04, 1], shade: [0, 0.7, 0, 0], light: [0, 0, 0.6, 0], burst: 0.75 },
};

/**
 * A result card with two independent faces: the back is the official card art with its
 * question mark; the front is the same official frame with the window cleared, the
 * Pokémon inside it and its name on the plate. The front is built from data, never baked.
 *
 * One button drives it (click, tap, Enter, Space): "Reveal" first, then turn the card over
 * and back. The button stays the same element, so focus stays put. Reduced motion: the
 * faces swap without turning.
 */
export function ResultCard({
  tone,
  back,
  style,
  revealed,
  locked,
  front,
  revealLabel,
  flipLabel,
  flipBackLabel,
  unrevealedLabel,
  frontLabel,
  onReveal,
}: ResultCardProps) {
  const reduce = useReducedMotion() ?? false;
  const [faceUp, setFaceUp] = useState(revealed);
  const [turned, setTurned] = useState(false);
  const turn = TURN[style];
  const showingFront = revealed && faceUp;

  return (
    <div className="rcard-wrap" data-tone={tone} data-style={style} data-revealed={revealed}>
      <div
        className="rcard"
        role="img"
        aria-label={showingFront ? frontLabel : unrevealedLabel}
        data-face={showingFront ? 'front' : 'back'}
        data-still={reduce}
      >
        <motion.div
          className="rcard__inner"
          initial={false}
          {...(reduce
            ? {}
            : {
                animate: {
                  rotateY: showingFront ? 180 : 0,
                  // The flourish plays on the discovery only, not on every later turn.
                  ...(turned ? { scale: turn.scale } : {}),
                },
                transition: { duration: turn.duration, ease: EASE },
              })}
        >
          <div className="rcard__face rcard__back" aria-hidden="true">
            <img src={back.src} srcSet={back.srcSet} sizes="(min-width: 56em) 20rem, 72vw" alt="" width={1024} height={1536} />
          </div>
          {front && (
            <div className="rcard__face rcard__front" aria-hidden="true">
              <img className="rcard__frame" src={back.src} srcSet={back.srcSet} sizes="(min-width: 56em) 20rem, 72vw" alt="" width={1024} height={1536} />
              <span className="rcard__window" />
              <span className="rcard__aura" />
              <span className="rcard__motes">
                <span />
                <span />
                <span />
                <span />
                <span />
              </span>
              <span className="rcard__floor" />
              <span className="rcard__species">
                <SpeciesArt src={front.art} alt={front.artAlt} dex={front.dex} eager />
              </span>
              <span className="rcard__foil" />
              <span className="rcard__dex">{front.dexLabel}</span>
              <span className="rcard__name">{front.name}</span>
            </div>
          )}
        </motion.div>
        {turned && !reduce && (
          <>
            {/* The moment of discovery: a ring of light opens behind the card (chromatic
                for the Hidden Match and the secret encounter). Opacity and scale only. */}
            <motion.span
              className="rcard__burst"
              data-style={style}
              aria-hidden="true"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: [0, turn.burst, 0], scale: [0.6, 1.15, 1.45] }}
              transition={{ duration: turn.duration * 1.2, times: [0, 0.55, 1], ease: EASE }}
            />
            <motion.span
              className="rcard__shade"
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: turn.shade }}
              transition={{ duration: turn.duration, ease: EASE }}
            />
            <motion.span
              className="rcard__light"
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: turn.light }}
              transition={{ duration: turn.duration, ease: EASE }}
            />
          </>
        )}
      </div>
      {revealed ? (
        <Button
          variant="secondary"
          onClick={() => {
            setTurned(false);
            setFaceUp((v) => !v);
          }}
        >
          {faceUp ? flipLabel : flipBackLabel}
        </Button>
      ) : (
        <Button
          disabled={locked}
          onClick={() => {
            setTurned(true);
            setFaceUp(true);
            onReveal();
          }}
        >
          {revealLabel}
        </Button>
      )}
    </div>
  );
}
