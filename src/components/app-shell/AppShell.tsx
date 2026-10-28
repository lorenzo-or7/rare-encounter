import { useId, useState } from 'react';
import { usePreferences } from '../../app/preferences-context';
import { DESKTOP_QUERY, useMediaQuery } from '../../hooks/useMediaQuery';
import { useActiveSection } from '../../hooks/useActiveSection';
import type { MessageKey } from '../../i18n/messages';
import { THEME_IDS, THEME_LABEL_KEYS } from '../../theme/themes';
import { ArchetypeCard } from '../archetype-card/ArchetypeCard';
import { ARCHETYPES } from '../archetype-card/archetypes';
import { Button, IconButton } from '../button/Button';
import { SiteNav, type NavItem } from '../nav/SiteNav';
import { SettingsPanel } from '../settings/SettingsPanel';
import { Sheet } from '../sheet/Sheet';
import './AppShell.css';

const SECTIONS = [
  { id: 'typography', key: 'nav.typography' },
  { id: 'themes', key: 'nav.themes' },
  { id: 'components', key: 'nav.components' },
  { id: 'cards', key: 'nav.cards' },
] as const satisfies readonly { id: string; key: MessageKey }[];

const SECTION_IDS = SECTIONS.map((s) => s.id);

/**
 * Phase 01A shell: navigation, settings and a foundation page that exercises the
 * type scale, themes, components and archetype cards. Not the landing (Phase 01B).
 */
export function AppShell() {
  const { theme, t } = usePreferences();
  const [sheetOpen, setSheetOpen] = useState(false);
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const activeId = useActiveSection(SECTION_IDS);
  const uid = useId();
  const navItems: NavItem[] = SECTIONS.map((s) => ({ id: s.id, label: t(s.key) }));
  const closeSheet = () => {
    setSheetOpen(false);
  };

  return (
    <div className="shell" id="top">
      <a className="shell__skip" href="#main">
        {t('shell.skipToContent')}
      </a>

      <SiteNav
        brand={t('brand.name')}
        label={t('nav.label')}
        items={navItems}
        activeId={activeId}
        settingsLabel={t('nav.openSettings')}
        menuLabel={t('nav.openMenu')}
        sheetOpen={sheetOpen}
        onOpenSheet={() => {
          setSheetOpen(true);
        }}
      />

      <main id="main" className="shell__main" tabIndex={-1}>
        <div className="intro">
          <h1 className="intro__title">{t('foundation.title')}</h1>
          <p className="intro__lead">{t('foundation.lead')}</p>
        </div>

        <section id="typography" className="section" aria-labelledby={`${uid}-type`}>
          <SectionHeader id={`${uid}-type`} title={t('type.title')} lead={t('type.lead')} />
          <dl className="type-scale">
            <div className="type-scale__row">
              <dt>{t('type.role.display')}</dt>
              <dd className="type-sample type-sample--display">{t('brand.name')}</dd>
            </div>
            <div className="type-scale__row">
              <dt>{t('type.role.heading')}</dt>
              <dd className="type-sample type-sample--heading">{t('type.sample.heading')}</dd>
            </div>
            <div className="type-scale__row">
              <dt>{t('type.role.title')}</dt>
              <dd className="type-sample type-sample--title">{t('type.sample.title')}</dd>
            </div>
            <div className="type-scale__row">
              <dt>{t('type.role.body')}</dt>
              <dd className="type-sample type-sample--body">{t('type.sample.body')}</dd>
            </div>
            <div className="type-scale__row">
              <dt>{t('type.role.small')}</dt>
              <dd className="type-sample type-sample--small">{t('type.sample.small')}</dd>
            </div>
          </dl>
        </section>

        <section id="themes" className="section" aria-labelledby={`${uid}-themes`}>
          <SectionHeader id={`${uid}-themes`} title={t('themes.title')} lead={t('themes.lead')} />
          <ul className="theme-grid">
            {THEME_IDS.map((id) => (
              <li key={id} className="theme-tile" data-theme={id}>
                <span className="theme-tile__band" aria-hidden="true" />
                <span className="theme-tile__name">{t(THEME_LABEL_KEYS[id])}</span>
                {id === theme && <span className="theme-tile__current">{t('themes.current')}</span>}
              </li>
            ))}
          </ul>
        </section>

        <section id="components" className="section" aria-labelledby={`${uid}-components`}>
          <SectionHeader
            id={`${uid}-components`}
            title={t('components.title')}
            lead={t('components.lead')}
          />
          <div className="component-groups">
            <div className="component-group">
              <div className="component-group__header">
                <h3 className="component-group__title">{t('components.buttons')}</h3>
                <p className="component-group__hint">{t('components.buttonsHint')}</p>
              </div>
              <div className="component-stage">
                <Button variant="primary" size="lg" icon="sparkle">
                  {t('button.primary')}
                </Button>
                <Button variant="secondary" size="lg">
                  {t('button.secondary')}
                </Button>
                <Button variant="ghost" size="lg">
                  {t('button.ghost')}
                </Button>
                <Button variant="primary" size="lg" disabled>
                  {t('button.disabled')}
                </Button>
              </div>
            </div>
            <div className="component-group">
              <div className="component-group__header">
                <h3 className="component-group__title">{t('components.iconButtons')}</h3>
                <p className="component-group__hint">{t('components.iconButtonsHint')}</p>
              </div>
              <div className="component-stage">
                <IconButton icon="settings" label={t('nav.openSettings')} />
                <IconButton icon="menu" label={t('nav.openMenu')} />
                <IconButton icon="close" label={t('settings.close')} />
              </div>
            </div>
          </div>
        </section>

        <section id="cards" className="section" aria-labelledby={`${uid}-cards`}>
          <SectionHeader id={`${uid}-cards`} title={t('cards.title')} lead={t('cards.lead')} />
          <div className="card-row">
            {ARCHETYPES.map((a) => (
              <ArchetypeCard
                key={a.id}
                archetype={a}
                name={t(a.nameKey)}
                phrase={t(a.phraseKey)}
                discoverLabel={t('card.discover')}
                hideLabel={t('card.hide')}
                artPendingLabel={t('cards.artPending')}
              />
            ))}
          </div>
        </section>
      </main>

      <Sheet
        open={sheetOpen}
        onClose={closeSheet}
        title={t(isDesktop ? 'settings.title' : 'menu.title')}
        closeLabel={t('settings.close')}
      >
        {!isDesktop && (
          <nav className="sheet-nav" aria-label={t('nav.label')}>
            <ul>
              {navItems.map((item) => (
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

function SectionHeader({ id, title, lead }: { id: string; title: string; lead: string }) {
  return (
    <div className="section__header">
      <h2 id={id} className="section__title">
        {title}
      </h2>
      <p className="section__lead">{lead}</p>
    </div>
  );
}
