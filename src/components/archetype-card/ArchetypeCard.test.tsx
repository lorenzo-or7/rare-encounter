import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MESSAGES } from '../../i18n/messages';
import { LOCALES } from '../../i18n/locales';
import { ArchetypeCard } from './ArchetypeCard';
import { ARCHETYPES, type CardArt } from './archetypes';

const [ethereal] = ARCHETYPES;
if (!ethereal) throw new Error('Missing archetypes');

const renderCard = (art: CardArt | null = null) =>
  render(
    <ArchetypeCard
      archetype={{ ...ethereal, art }}
      name="Ethereal"
      phrase="You find meaning in what others overlook."
      discoverLabel="Tap to discover"
      hideLabel="Hide"
      artPendingLabel="Art-only version pending"
    />,
  );

describe('ArchetypeCard', () => {
  it('renders number and title as real text, labelled by the title', () => {
    renderCard();
    expect(screen.getByRole('article', { name: 'Ethereal' })).toBeInTheDocument();
    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('Art-only version pending')).toBeInTheDocument();
  });

  it('reveals and hides the phrase with a real, stateful button', async () => {
    renderCard();
    const action = screen.getByRole('button', { name: 'Tap to discover' });
    expect(action).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(/find meaning/)).not.toBeInTheDocument();

    await userEvent.click(action);
    const phrase = screen.getByText('You find meaning in what others overlook.');
    const hide = screen.getByRole('button', { name: 'Hide' });
    expect(hide).toHaveAttribute('aria-expanded', 'true');
    expect(hide).toHaveAttribute('aria-controls', phrase.id);
  });

  it('treats supplied art as decoration', () => {
    const { container } = renderCard({ src: '/art-640.webp', srcSet: '/art-640.webp 640w' });
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
    expect(container.querySelector('img')).toHaveAttribute('srcset', '/art-640.webp 640w');
    expect(screen.queryByText('Art-only version pending')).not.toBeInTheDocument();
  });

  it('ships art-only images for all three approved cards', () => {
    for (const a of ARCHETYPES) {
      expect(a.art?.srcSet).toMatch(/480w.*640w.*960w/);
    }
  });

  it('defines the three approved archetypes, all translated', () => {
    expect(ARCHETYPES.map((a) => [a.id, a.number])).toEqual([
      ['ethereal', '01'],
      ['instinctive', '02'],
      ['radiant', '03'],
    ]);
    for (const locale of LOCALES) {
      for (const a of ARCHETYPES) {
        expect(MESSAGES[locale][a.nameKey]).not.toBe('');
        expect(MESSAGES[locale][a.phraseKey]).not.toBe('');
      }
    }
  });
});
