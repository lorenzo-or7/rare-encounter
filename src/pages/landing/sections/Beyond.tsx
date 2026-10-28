import { useId } from 'react';
import { usePreferences } from '../../../app/preferences-context';
import type { MessageKey } from '../../../i18n/messages';
import './Beyond.css';

const PRINCIPLES = [
  { title: 'landing.beyond.p1.title', body: 'landing.beyond.p1.body' },
  { title: 'landing.beyond.p2.title', body: 'landing.beyond.p2.body' },
  { title: 'landing.beyond.p3.title', body: 'landing.beyond.p3.body' },
] as const satisfies readonly { title: MessageKey; body: MessageKey }[];

/** Beyond the Obvious: an editorial statement, then the three principles behind it. */
export function Beyond() {
  const { t } = usePreferences();
  const titleId = useId();

  return (
    <section id="beyond" className="beyond" aria-labelledby={titleId}>
      <h2 id={titleId} className="beyond__title">
        {t('landing.section.beyond')}
      </h2>
      <p className="beyond__statement">{t('landing.beyond.statement')}</p>
      <ul className="beyond__principles">
        {PRINCIPLES.map((p) => (
          <li key={p.title} className="beyond__principle">
            <h3 className="beyond__principle-title">{t(p.title)}</h3>
            <p className="beyond__principle-body">{t(p.body)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
