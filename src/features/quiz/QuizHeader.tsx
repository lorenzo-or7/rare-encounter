import { motion } from 'motion/react';
import { IconButton } from '../../components/button/Button';
import { LOGO_ASSET } from '../../components/logo/logo-asset';

interface QuizHeaderProps {
  readonly brand: string;
  readonly answered: number;
  readonly total: number;
  readonly progressLabel: string;
  readonly pauseLabel: string;
  readonly pauseOpen: boolean;
  readonly onPause: () => void;
  readonly settingsLabel: string;
  readonly settingsOpen: boolean;
  readonly onOpenSettings: () => void;
}

const FILL = { type: 'spring', stiffness: 140, damping: 26, mass: 0.9 } as const;

/**
 * Focused header for the questions (Or7, E8 A): the compact symbol, one continuous progress
 * bar with its counter, Pause and Settings. The symbol is not a link here: leaving goes
 * through Pause, so nobody drops out of a session by accident.
 */
export function QuizHeader({
  brand,
  answered,
  total,
  progressLabel,
  pauseLabel,
  pauseOpen,
  onPause,
  settingsLabel,
  settingsOpen,
  onOpenSettings,
}: QuizHeaderProps) {
  const symbol = LOGO_ASSET.symbol;

  return (
    <header className="quiz-header">
      <div className="quiz-header__bar">
        <img
          className="quiz-header__symbol"
          src={symbol.src}
          srcSet={symbol.srcSet}
          alt={brand}
          width={Math.round(34 * symbol.ratio)}
          height={34}
        />

        <div className="quiz-header__progress">
          <div
            className="quiz-progress"
            role="progressbar"
            aria-label={progressLabel}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={answered}
            aria-valuetext={`${String(answered)} / ${String(total)}`}
          >
            <motion.span
              className="quiz-progress__fill"
              initial={false}
              animate={{ scaleX: total > 0 ? answered / total : 0 }}
              transition={FILL}
            />
          </div>
          <span className="quiz-header__count" aria-hidden="true">
            {answered}
            <span className="quiz-header__total">/{total}</span>
          </span>
        </div>

        <IconButton
          className="quiz-header__action"
          icon="pause"
          label={pauseLabel}
          aria-haspopup="dialog"
          aria-expanded={pauseOpen}
          onClick={onPause}
        />
        <IconButton
          className="quiz-header__action"
          icon="settings"
          label={settingsLabel}
          aria-haspopup="dialog"
          aria-expanded={settingsOpen}
          onClick={onOpenSettings}
        />
      </div>
    </header>
  );
}
