import { Moon02Icon, Sun03Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { motion } from 'motion/react';
import type { ModeId } from '../../theme/themes';
import './LunarSlider.css';

interface LunarSliderProps {
  readonly mode: ModeId;
  readonly onChange: (mode: ModeId) => void;
  /** Accessible name when no visible label is linked, e.g. "Light mode". */
  readonly label?: string;
  /** Id of a visible label that names the control (preferred when one is shown). */
  readonly labelledBy?: string;
  readonly className?: string;
}

/** The knob travels the capsule's inner width minus its own size (see LunarSlider.css). */
const TRAVEL = 30;
const SPRING = { type: 'spring', stiffness: 520, damping: 34, mass: 0.7 } as const;

/**
 * Lunar Slider (Classic Celestial): the light/dark switch. One interactive element, a
 * native button with role="switch"; "on" means light mode. The moon sits on the left
 * (dark), the sun on the right (light), and a knob springs behind whichever is active.
 * Motion is a single spring on press; reduced motion (MotionConfig "user") moves it at once.
 *
 * Independent of where it lives: it takes the mode and reports changes, so the settings
 * sheet uses it today and an introduction screen can reuse it later.
 */
export function LunarSlider({ mode, onChange, label, labelledBy, className }: LunarSliderProps) {
  const light = mode === 'light';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={light}
      {...(labelledBy ? { 'aria-labelledby': labelledBy } : { 'aria-label': label })}
      className={['lunar-slider', className].filter(Boolean).join(' ')}
      data-state={mode}
      onClick={() => {
        onChange(light ? 'dark' : 'light');
      }}
    >
      <motion.span
        className="lunar-slider__knob"
        aria-hidden="true"
        initial={false}
        animate={{ x: light ? TRAVEL : 0 }}
        transition={SPRING}
      />
      <span className="lunar-slider__icon lunar-slider__icon--moon" aria-hidden="true">
        <HugeiconsIcon icon={Moon02Icon} size={16} strokeWidth={1.8} />
      </span>
      <span className="lunar-slider__icon lunar-slider__icon--sun" aria-hidden="true">
        <HugeiconsIcon icon={Sun03Icon} size={16} strokeWidth={1.8} />
      </span>
    </button>
  );
}
