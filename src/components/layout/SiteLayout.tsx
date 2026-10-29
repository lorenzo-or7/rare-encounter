import { useState, type ReactNode } from 'react';
import { usePreferences } from '../../app/preferences-context';
import { useActiveSection } from '../../hooks/useActiveSection';
import { DESKTOP_QUERY, useMediaQuery } from '../../hooks/useMediaQuery';
import { SiteNav, type NavItem } from '../nav/SiteNav';
import { SettingsPanel } from '../settings/SettingsPanel';
import { Sheet } from '../sheet/Sheet';
import './SiteLayout.css';

interface SiteLayoutProps {
  /** In-page sections listed in the nav; their ids must exist in `children`. */
  readonly sections: readonly NavItem[];
  /** Brand link target; the page top unless given. */
  readonly brandHref?: string;
  readonly children: ReactNode;
}

/**
 * Shared page frame: skip link, Floating Liquid Nav / Top Bar, main landmark and the
 * settings drawer (desktop) / menu bottom sheet (mobile).
 */
export function SiteLayout({ sections, brandHref, children }: SiteLayoutProps) {
  const { t, mode } = usePreferences();
  const [sheetOpen, setSheetOpen] = useState(false);
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  // With no sections to list, the mobile sheet holds the settings only.
  const showSheetNav = !isDesktop && sections.length > 0;
  const activeId = useActiveSection(sections.map((s) => s.id));
  const closeSheet = () => {
    setSheetOpen(false);
  };

  return (
    <div className="site" id="top">
      <a className="site__skip" href="#main">
        {t('shell.skipToContent')}
      </a>

      <SiteNav
        brand={t('brand.name')}
        logoTone={mode}
        {...(brandHref ? { brandHref } : {})}
        label={t('nav.label')}
        items={sections}
        activeId={activeId}
        settingsLabel={t('nav.openSettings')}
        menuLabel={t('nav.openMenu')}
        sheetOpen={sheetOpen}
        onOpenSheet={() => {
          setSheetOpen(true);
        }}
      />

      <main id="main" className="site__main" tabIndex={-1}>
        {children}
      </main>

      <Sheet
        open={sheetOpen}
        onClose={closeSheet}
        title={t(showSheetNav ? 'menu.title' : 'settings.title')}
        closeLabel={t('settings.close')}
      >
        {showSheetNav && (
          <nav className="sheet-nav" aria-label={t('nav.label')}>
            <ul>
              {sections.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    aria-current={item.id === activeId ? 'location' : undefined}
                    onClick={closeSheet}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
        <SettingsPanel />
      </Sheet>
    </div>
  );
}
