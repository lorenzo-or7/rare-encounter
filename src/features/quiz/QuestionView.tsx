import { motion, useIsPresent } from 'motion/react';
import { useEffect, useId, useRef } from 'react';
import type { Locale } from '../../i18n/locales';
import { VOID_ANSWER, type AnswerId, type Question } from '../../domain/questions';
import { AnswerButton } from './AnswerButton';
import type { Direction } from './flow';

/** Horizontal Flow: forward enters from the right and leaves left; back mirrors it. */
const SHIFT = 56;
const variants = {
  enter: (d: Direction) => ({ x: d * SHIFT, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: Direction) => ({ x: -d * SHIFT, opacity: 0 }),
};
const FLOW = {
  x: { type: 'spring', stiffness: 300, damping: 32, mass: 0.8 },
  opacity: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
} as const;

interface QuestionViewProps {
  readonly question: Question;
  readonly locale: Locale;
  readonly direction: Direction;
  /** Saved answer, or the one being saved. */
  readonly chosen: AnswerId | null;
  readonly busy: boolean;
  /** Move focus to the prompt when this view appears (every step after the first render). */
  readonly focusOnEnter: boolean;
  readonly onChoose: (answerId: AnswerId) => void;
  /** Label of the "none of these" action, in the current language. */
  readonly voidLabel: string;
}

export function QuestionView({
  question,
  locale,
  direction,
  chosen,
  busy,
  focusOnEnter,
  onChoose,
  voidLabel,
}: QuestionViewProps) {
  const present = useIsPresent();
  const promptId = useId();
  const promptRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (focusOnEnter) promptRef.current?.focus({ preventScroll: true });
  }, [focusOnEnter]);

  return (
    <motion.div
      className="question"
      data-format={question.format}
      data-art-ratio={question.art?.ratio}
      data-direction={direction}
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={FLOW}
      // The view sliding away can no longer be answered or focused.
      inert={!present}
    >
      <h1 id={promptId} ref={promptRef} className="question__prompt" tabIndex={-1}>
        {question.prompt[locale]}
      </h1>
      <div className="question__options" role="group" aria-labelledby={promptId}>
        {question.options.map((option) => (
          <AnswerButton
            key={option.id}
            format={question.format}
            label={option.label[locale]}
            media={option.media?.src}
            artRatio={question.art?.ratio ?? '4:3'}
            selected={chosen === option.id}
            disabled={busy || !present}
            onChoose={() => {
              onChoose(option.id);
            }}
          />
        ))}
      </div>
      {/* The fifth action: pass on a question none of whose options fit. Not an answer. */}
      <button
        type="button"
        className="question__void"
        aria-pressed={chosen === VOID_ANSWER}
        data-selected={chosen === VOID_ANSWER}
        disabled={busy || !present}
        onClick={() => {
          onChoose(VOID_ANSWER);
        }}
      >
        {voidLabel}
      </button>
    </motion.div>
  );
}
