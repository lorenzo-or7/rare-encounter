import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MotionGlobalConfig } from 'motion/react';
import { useState } from 'react';
import { isEncounterResult } from '../../storage/encounter-store';
import { ResultCard } from './ResultCard';
import { readReveals, saveReveals } from './reveals';

const BACK = { src: '/card-640.webp', srcSet: '/card-640.webp 640w' };
const FRONT = { name: 'Pikachu', dexLabel: 'No. 0025', art: '/pikachu.png', artAlt: 'Official artwork of Pikachu', dex: 25 };

function Harness({ locked = false, startRevealed = false }: { locked?: boolean; startRevealed?: boolean }) {
  const [revealed, setRevealed] = useState(startRevealed);
  return (
    <ResultCard
      tone="ethereal"
      back={BACK}
      style="soul"
      revealed={revealed}
      locked={locked}
      front={revealed ? FRONT : null}
      revealLabel="Reveal Soul Match"
      flipLabel="Turn the card over"
      flipBackLabel="Show the front"
      unrevealedLabel="Soul Match card, not revealed yet"
      frontLabel="Pikachu card, No. 0025"
      onReveal={() => {
        setRevealed(true);
      }}
    />
  );
}

describe('ResultCard', () => {
  beforeAll(() => {
    MotionGlobalConfig.skipAnimations = true;
  });
  afterAll(() => {
    MotionGlobalConfig.skipAnimations = false;
  });

  it('starts face down with nothing of the species on the page', () => {
    const { container } = render(<Harness />);
    expect(screen.getByRole('img', { name: 'Soul Match card, not revealed yet' })).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/Pikachu|0025/);
    expect(container.querySelectorAll('img')).toHaveLength(1);
  });

  it('reveals with one button, then turns both ways without forgetting', async () => {
    render(<Harness />);
    const button = screen.getByRole('button', { name: 'Reveal Soul Match' });
    await userEvent.click(button);
    expect(screen.getByRole('img', { name: 'Pikachu card, No. 0025' })).toBeInTheDocument();
    // The same element stays focused through the reveal.
    expect(screen.getByRole('button', { name: 'Turn the card over' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('img', { name: 'Soul Match card, not revealed yet' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Reveal/ })).toBeNull();
    await userEvent.keyboard(' ');
    expect(screen.getByRole('img', { name: 'Pikachu card, No. 0025' })).toBeInTheDocument();
  });

  it('waits for the encounter before it', () => {
    render(<Harness locked />);
    expect(screen.getByRole('button', { name: 'Reveal Soul Match' })).toBeDisabled();
  });

  it('a stored discovery opens face up', () => {
    render(<Harness startRevealed />);
    expect(screen.getByRole('img', { name: 'Pikachu card, No. 0025' })).toBeInTheDocument();
  });
});

describe('reveal persistence', () => {
  it('keeps discoveries per result and honours the earlier Hidden Match key', () => {
    localStorage.clear();
    saveReveals('r1', new Set(['soul', 'alternative']));
    localStorage.setItem('rare-encounter:hidden-revealed:r2', '1');
    expect([...readReveals('r1')].sort()).toEqual(['alternative', 'soul']);
    expect([...readReveals('r2')]).toEqual(['hidden']);
    expect(readReveals('r3').size).toBe(0);
  });
});

describe('stored results', () => {
  const base = { sessionId: 's', mode: 30, completedAt: 'x', engineVersion: 'e' };
  const match = { kind: 'soul', speciesId: 'pikachu', affinity: 0.6, explanation: { drivers: [] } };

  it('accepts results saved before outcomes existed, and the three outcomes', () => {
    expect(isEncounterResult({ ...base, soul: match, hidden: match, alternatives: [match] })).toBe(true);
    expect(isEncounterResult({ ...base, outcome: 'matches', soul: match, hidden: match, alternatives: [] })).toBe(true);
    expect(isEncounterResult({ ...base, outcome: 'mystery', speciesId: 'unown' })).toBe(true);
    expect(isEncounterResult({ ...base, outcome: 'insufficient' })).toBe(true);
  });

  it('rejects malformed or unknown outcomes', () => {
    expect(isEncounterResult({ ...base, outcome: 'mystery' })).toBe(false);
    expect(isEncounterResult({ ...base, outcome: 'other' })).toBe(false);
    expect(isEncounterResult({ ...base })).toBe(false);
  });
});
