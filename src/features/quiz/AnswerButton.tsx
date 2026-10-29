import { HugeiconsIcon } from '@hugeicons/react';
import { motion } from 'motion/react';
import { useState, type MouseEvent } from 'react';
import { Icon } from '../../components/icon/Icon';
import type { ArtRatio } from '../../domain/answer-art';
import type { QuestionFormat } from '../../domain/questions';
import { AnswerArt } from './AnswerArt';
import { optionIcon } from './option-icons';

interface AnswerButtonProps {
  readonly format: QuestionFormat;
  readonly label: string;
  /** Image URL (photo) or `icon:<name>` (icon-text). */
  readonly media: string | undefined;
  /** Image answers: the question's shared art ratio. */
  readonly artRatio: ArtRatio;
  /** Saved for this question, or currently being saved. */
  readonly selected: boolean;
  /** While an answer saves, presses are ignored (not announced: the lock lasts a moment). */
  readonly disabled: boolean;
  readonly onChoose: () => void;
}

const PRESS = { type: 'spring', stiffness: 520, damping: 24, mass: 0.6 } as const;

interface Pulse {
  readonly key: number;
  readonly x: number;
  readonly y: number;
}

/**
 * One answer. Spring Press: the control dips under the finger and springs back (Motion;
 * reduced motion turns transforms off). Energy Pulse: one ring of accent light spreads from
 * where it was pressed, or from the center for keyboard (CSS; hidden under reduced motion).
 * The chosen state never depends on motion: border, tint and a check mark show it.
 */
export function AnswerButton({
  format,
  label,
  media,
  artRatio,
  selected,
  disabled,
  onChoose,
}: AnswerButtonProps) {
  const [pulse, setPulse] = useState<Pulse | null>(null);
  const glyph = format === 'icon-text' && media ? optionIcon(media) : undefined;
  const mark = (
    <span className="answer__mark" aria-hidden="true">
      <Icon name="check" size={14} strokeWidth={2.25} />
    </span>
  );

  const choose = (e: MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const r = e.currentTarget.getBoundingClientRect();
    // Keyboard activation reports (0, 0): start the pulse from the center instead.
    const fromPointer = e.clientX !== 0 || e.clientY !== 0;
    setPulse((p) => ({
      key: (p?.key ?? 0) + 1,
      x: fromPointer ? e.clientX - r.left : r.width / 2,
      y: fromPointer ? e.clientY - r.top : r.height / 2,
    }));
    onChoose();
  };

  return (
    <motion.button
      type="button"
      className={`answer answer--${format}`}
      aria-pressed={selected}
      data-selected={selected}
      whileTap={disabled ? {} : { scale: 0.97 }}
      transition={PRESS}
      onClick={choose}
    >
      {pulse && (
        <span
          key={pulse.key}
          className="answer__pulse"
          style={{ left: pulse.x, top: pulse.y }}
          aria-hidden="true"
        />
      )}
      {format === 'photo' ? (
        // Visual Answer Art: image above; caption with the name on the left, mark on the right.
        <>
          <AnswerArt key={media ?? 'none'} src={media} ratio={artRatio} />
          <span className="answer__caption">
            <span className="answer__label">{label}</span>
            {mark}
          </span>
        </>
      ) : (
        <>
          {glyph && (
            <span className="answer__icon" aria-hidden="true">
              <HugeiconsIcon icon={glyph} size={24} strokeWidth={1.6} />
            </span>
          )}
          <span className="answer__label">{label}</span>
          {mark}
        </>
      )}
    </motion.button>
  );
}
