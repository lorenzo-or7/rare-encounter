import { useId } from 'react';
import { usePreferences } from '../../app/preferences-context';
import { ArchetypeCard } from '../../components/archetype-card/ArchetypeCard';
import { ARCHETYPES } from '../../components/archetype-card/archetypes';
import { Button, IconButton } from '../../components/button/Button';
import { SiteLayout } from '../../components/layout/SiteLayout';
import { THEME_IDS, THEME_LABEL_KEYS } from '../../theme/themes';
import './FoundationPage.css';
import { FOUNDATION_MESSAGES, type FoundationKey } from './messages';

const SECTIONS = [
  { id: 'typography', key: 'nav.typography' },
  { id: 'themes', key: 'nav.themes' },
  { id: 'components', key: 'nav.components' },
  { id: 'cards', key: 'nav.cards' },
] as const satisfies readonly { id: string; key: FoundationKey }[];

/**
 * Development-only Visual Foundation specimen, served at /foundation by the Vite dev server.
 * Excluded from production builds; not part of the product.
 */
export default function FoundationPage() {
  const { theme, locale, t } = usePreferences();
  const ft = (key: FoundationKey) => FOUNDATION_MESSAGES[locale][key];
  const uid = useId();

  return (
    <SiteLayout sections={SECTIONS.map((s) => ({ id: s.id, label: ft(s.key) }))}>
      <div className="foundation">
        <div className="intro">
          <h1 className="intro__title">{ft('foundation.title')}</h1>
          <p className="intro__lead">{ft('foundation.lead')}</p>
        </div>

        <section id="typography" className="section" aria-labelledby={`${uid}-type`}>
          <SectionHeader id={`${uid}-type`} title={ft('type.title')} lead={ft('type.lead')} />
          <dl className="type-scale">
            <div className="type-scale__row">
              <dt>{ft('type.role.display')}</dt>
              <dd className="type-sample type-sample--display">{t('brand.name')}</dd>
            </div>
            <div className="type-scale__row">
              <dt>{ft('type.role.heading')}</dt>
              <dd className="type-sample type-sample--heading">{ft('type.sample.heading')}</dd>
            </div>
            <div className="type-scale__row">
              <dt>{ft('type.role.title')}</dt>
              <dd className="type-sample type-sample--title">{ft('type.sample.title')}</dd>
            </div>
            <div className="type-scale__row">
              <dt>{ft('type.role.body')}</dt>
              <dd className="type-sample type-sample--body">{ft('type.sample.body')}</dd>
            </div>
            <div className="type-scale__row">
              <dt>{ft('type.role.small')}</dt>
              <dd className="type-sample type-sample--small">{ft('type.sample.small')}</dd>
            </div>
          </dl>
        </section>

        <section id="themes" className="section" aria-labelledby={`${uid}-themes`}>
          <SectionHeader id={`${uid}-themes`} title={ft('themes.title')} lead={ft('themes.lead')} />
          <ul className="theme-grid">
            {THEME_IDS.map((id) => (
              <li key={id} className="theme-tile" data-theme={id}>
                <span className="theme-tile__band" aria-hidden="true" />
                <span className="theme-tile__name">{t(THEME_LABEL_KEYS[id])}</span>
                {id === theme && <span className="theme-tile__current">{ft('themes.current')}</span>}
              </li>
            ))}
          </ul>
        </section>

        <section id="components" className="section" aria-labelledby={`${uid}-components`}>
          <SectionHeader
            id={`${uid}-components`}
            title={ft('components.title')}
            lead={ft('components.lead')}
          />
          <div className="component-groups">
            <div className="component-group">
              <div className="component-group__header">
                <h3 className="component-group__title">{ft('components.buttons')}</h3>
                <p className="component-group__hint">{ft('components.buttonsHint')}</p>
              </div>
              <div className="component-stage">
                <Button variant="primary" size="lg" icon="sparkle">
                  {ft('button.primary')}
                </Button>
                <Button variant="secondary" size="lg">
                  {ft('button.secondary')}
                </Button>
                <Button variant="ghost" size="lg">
                  {ft('button.ghost')}
                </Button>
                <Button variant="primary" size="lg" disabled>
                  {ft('button.disabled')}
                </Button>
              </div>
            </div>
            <div className="component-group">
              <div className="component-group__header">
                <h3 className="component-group__title">{ft('components.iconButtons')}</h3>
                <p className="component-group__hint">{ft('components.iconButtonsHint')}</p>
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
          <SectionHeader id={`${uid}-cards`} title={ft('cards.title')} lead={ft('cards.lead')} />
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
      </div>
    </SiteLayout>
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
