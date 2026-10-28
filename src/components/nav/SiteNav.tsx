import { LayoutGroup, motion } from 'motion/react';
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
 * Floating Liquid Nav (desktop): a pill that condenses once the page scrolls, with an
 * active-section indicator that flows between links.
 * Floating Top Bar (mobile): brand + menu, opening the bottom sheet.
 * Both render; CSS shows one per breakpoint so there is no layout flash on load.
 */
export function SiteNav({
  brand,
  label,
  items,
  activeId,
  settingsLabel,
  menuLabel,
  sheetOpen,
  onOpenSheet,
}: SiteNavProps) {
  const scrolled = useScrolled();

  return (
    <header className="site-nav" data-scrolled={scrolled}>
      <motion.div className="liquid-nav" layout transition={SPRING}>
        <Logo name={brand} />
        <nav aria-label={label}>
          <LayoutGroup id="liquid-nav">
            <ul className="liquid-nav__list">
              {items.map((item) => {
                const active = item.id === activeId;
                return (
                  <li key={item.id}>
                    <a
                      className="liquid-nav__link"
                      href={`#${item.id}`}
                      aria-current={active ? 'location' : undefined}
                    >
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
        <IconButton
          icon="settings"
          label={settingsLabel}
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
          onClick={onOpenSheet}
        />
      </motion.div>

      <div className="top-bar">
        <Logo name={brand} />
        <IconButton
          icon="menu"
          label={menuLabel}
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
          onClick={onOpenSheet}
        />
      </div>
    </header>
  );
}
