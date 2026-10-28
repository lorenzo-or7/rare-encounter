import { useId, type PointerEvent } from 'react';
import { Icon } from '../../components/icon/Icon';
import type { ModeId } from '../../domain/modes';
import type { ThemeColors } from '../../hooks/useThemeColors';
import BorderGlow from '../../vendor/react-bits/BorderGlow/BorderGlow';
import { hexToHslTriplet } from './glow-color';

interface ModeOptionProps {
  readonly mode: ModeId;
  readonly name: string;
  /** e.g. "30 questions" */
  readonly count: string;
  /** One short line on what this depth offers. */
  readonly description: string;
  readonly group: string;
  readonly checked: boolean;
  readonly locked: boolean;
  readonly reduceMotion: boolean;
  readonly colors: ThemeColors;
  readonly onSelect: (mode: ModeId) => void;
}

/**
 * One depth on the Preparation Screen: a native radio inside the original React Bits
 * Border Glow. The glow is a pointer affordance only, so everything it does not cover is
 * handled here, outside the vendored file:
 * - selection: an accent border, a tinted surface and a check mark (shape, not color alone);
 * - keyboard focus: a ring drawn around the whole card;
 * - reduced motion: pointer movement never reaches the glow, which stays dark.
 */
export function ModeOption({
  mode,
  name,
  count,
  description,
  group,
  checked,
  locked,
  reduceMotion,
  colors,
  onSelect,
}: ModeOptionProps) {
  const nameId = useId();
  const countId = useId();
  const descriptionId = useId();
  const glowColor = hexToHslTriplet(colors.accent);

  // Capture-phase stop: the event never reaches Border Glow's own pointermove handler.
  const holdGlow = (e: PointerEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="mode-option"
      data-checked={checked}
      data-locked={locked}
      onPointerMoveCapture={reduceMotion ? holdGlow : undefined}
    >
      <BorderGlow
        className={`mode-option__glow${checked ? ' is-checked' : ''}`}
        {...(glowColor ? { glowColor } : {})}
        colors={[colors.accent, colors.accent2, colors.accent]}
        backgroundColor={
          checked ? `color-mix(in oklab, ${colors.accent} 12%, ${colors.surface})` : colors.surface
        }
        borderRadius={24}
        glowRadius={32}
        glowIntensity={0.9}
        fillOpacity={0.35}
        animated={false}
      >
        <label className="mode-option__body">
          <input
            className="mode-option__input"
            type="radio"
            name={group}
            value={mode}
            checked={checked}
            disabled={locked}
            aria-labelledby={`${nameId} ${countId}`}
            aria-describedby={descriptionId}
            onChange={() => {
              onSelect(mode);
            }}
          />
          <span className="mode-option__number" aria-hidden="true">
            {mode}
          </span>
          <span className="mode-option__text">
            <span id={nameId} className="mode-option__name">
              {name}
            </span>
            <span id={countId} className="mode-option__count">
              {count}
            </span>
            <span id={descriptionId} className="mode-option__description">
              {description}
            </span>
          </span>
          <span className="mode-option__mark" aria-hidden="true">
            <Icon name="check" size={14} strokeWidth={2.25} />
          </span>
        </label>
      </BorderGlow>
    </div>
  );
}
