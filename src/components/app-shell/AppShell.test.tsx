import { render, screen } from '@testing-library/react';
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

describe('AppShell', () => {
  it('exposes landmarks, a single h1 and a skip link', () => {
    renderShell();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main');
  });

  it('follows the browser language when nothing is saved', () => {
    renderShell(['pt-BR']);
    expect(document.documentElement.lang).toBe('pt-BR');
    expect(screen.getByLabelText('Idioma')).toHaveValue('pt-BR');
  });

  it('switches language, updates <html lang> and saves the explicit choice', async () => {
    renderShell();
    await userEvent.selectOptions(screen.getByLabelText('Language'), 'es');
    expect(document.documentElement.lang).toBe('es');
    expect(screen.getByLabelText('Tema')).toBeInTheDocument();
    expect(loadPreferences().locale).toBe('es');
  });

  it('applies and saves the theme, defaulting to Spectrum', async () => {
    renderShell();
    expect(document.documentElement.dataset['theme']).toBe('spectrum');
    await userEvent.selectOptions(screen.getByLabelText('Theme'), 'verdant');
    expect(document.documentElement.dataset['theme']).toBe('verdant');
    expect(loadPreferences().theme).toBe('verdant');
  });
});
