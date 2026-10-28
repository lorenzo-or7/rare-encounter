import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PreferencesProvider } from '../../app/PreferencesProvider';
import { loadPreferences } from '../../storage/preferences';
import { AppShell } from './AppShell';

const renderShell = (languages: readonly string[] = ['en-US']) =>
  render(
    <PreferencesProvider languages={languages}>
      <AppShell />
    </PreferencesProvider>,
  );

// jsdom has no CSS, so both nav variants render; the banner holds them.
const openSheet = async () => {
  const banner = screen.getByRole('banner');
  const [trigger] = within(banner).getAllByRole('button', { name: /Open (settings|menu)/ });
  if (!trigger) throw new Error('No sheet trigger');
  await userEvent.click(trigger);
  return screen.getByRole('dialog', { hidden: true });
};

describe('AppShell', () => {
  it('exposes landmarks, one h1, a skip link and section navigation', () => {
    renderShell();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main');
    const nav = screen.getByRole('navigation', { name: 'Sections' });
    expect(within(nav).getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual([
      '#typography',
      '#themes',
      '#components',
      '#cards',
    ]);
  });

  it('follows the browser language when nothing is saved', () => {
    renderShell(['pt-BR']);
    expect(document.documentElement.lang).toBe('pt-BR');
    expect(screen.getByRole('heading', { level: 1, name: 'Base visual' })).toBeInTheDocument();
  });

  it('switches language and theme from the settings sheet and saves both', async () => {
    renderShell();
    const dialog = await openSheet();
    await userEvent.click(within(dialog).getByRole('radio', { name: 'Español', hidden: true }));
    expect(document.documentElement.lang).toBe('es');
    await userEvent.click(within(dialog).getByRole('radio', { name: 'Verdor', hidden: true }));
    expect(document.documentElement.dataset['theme']).toBe('verdant');
    expect(loadPreferences()).toEqual({ locale: 'es', theme: 'verdant' });
  });

  it('defaults to the Spectrum theme', () => {
    renderShell();
    expect(document.documentElement.dataset['theme']).toBe('spectrum');
  });
});
