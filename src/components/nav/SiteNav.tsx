import { LayoutGroup, motion } from 'motion/react';
import { useState } from 'react';
import { useScrolled } from '../../hooks/useScrolled';
import { IconButton } from '../button/Button';
import { Logo } from '../logo/Logo';
import './SiteNav.css';

export interface NavItem {
  readonly id: string;
  readonly label: string;
}

interface SiteNavProps {
  readonly brand: string;
  /** The surface tone the nav sits on: picks the logotype's dark or light-surface finish. */
  readonly logoTone?: 'dark' | 'light';
  /** Brand link target: the page top on the landing, the landing from other screens. */
  readonly brandHref?: string;
  readonly label: string;
  readonly items: readonly NavItem[];
  readonly activeId: string | null;
  readonly settingsLabel: string;
  readonly menuLabel: string;
  readonly sheetOpen: boolean;
  readonly onOpenSheet: () => void;
}

const SPRING = { type: 'spring', stiffness: 420, damping: 36, mass: 0.9 } as const;

/**
 * Editorial floating nav (desktop): an open row that condenses once the page scrolls, with
 * a luminous active-section line that flows between links.
 * Top bar (mobile): brand + menu, opening the bottom sheet.
 * Both render; CSS shows one per breakpoint so there is no layout flash on load.
 * Without in-page sections (the encounter screen) only the brand and settings remain.
 */
export function SiteNav({
  brand,
  logoTone = 'dark',
  brandHref = '#top',
  label,
  items,
  activeId,
  settingsLabel,
  menuLabel,
  sheetOpen,
  onOpenSheet,
}: SiteNavProps) {
  const scrolled = useScrolled();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const hasItems = items.length > 0;

  return (
    <header className="site-nav" data-scrolled={scrolled}>
      <motion.div className="liquid-nav" layout transition={SPRING}>
        <Logo name={brand} href={brandHref} tone={logoTone} variant={scrolled ? 'symbol' : 'full'} />
        {hasItems && (
          <nav aria-label={label}>
            <LayoutGroup id="liquid-nav">
              <ul
                className="liquid-nav__list"
                onPointerLeave={() => {
                  setHoveredId(null);
                }}
              >
                {items.map((item) => {
                  const active = item.id === activeId;
                  return (
                    <li key={item.id}>
                      <a
                        className="liquid-nav__link"
                        href={`#${item.id}`}
                        aria-current={active ? 'location' : undefined}
                        onPointerEnter={() => {
                          setHoveredId(item.id);
                        }}
                      >
                        {hoveredId === item.id && !active && (
                          <motion.span
                            className="liquid-nav__hover"
                            layoutId="liquid-nav-hover"
                            transition={SPRING}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            aria-hidden="true"
                          />
                        )}
                        {active && (
                          <motion.span
                            className="liquid-nav__indicator"
                            layoutId="liquid-nav-indicator"
                            transition={SPRING}
                            aria-hidden="true"
                          />
                        )}
                        <span className="liquid-nav__text">{item.label}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </LayoutGroup>
          </nav>
        )}
        {hasItems && <span className="liquid-nav__divider" aria-hidden="true" />}
        <IconButton
          className="liquid-nav__action"
          icon="settings"
          label={settingsLabel}
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
          onClick={onOpenSheet}
        />
      </motion.div>

      <div className="top-bar">
        <Logo name={brand} href={brandHref} variant="symbol" />
        <IconButton
          className="top-bar__action"
          icon={hasItems ? 'menu' : 'settings'}
          label={hasItems ? menuLabel : settingsLabel}
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
          onClick={onOpenSheet}
        />
      </div>
    </header>
  );
}
