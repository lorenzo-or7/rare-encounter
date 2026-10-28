import { render, screen, waitFor } from '@testing-library/react';
import { useRef } from 'react';
import { useLocalizedStepLabels } from './useLocalizedStepLabels';

const format = (n: string, title: string) => `Etapa ${n}: ${title}`;

function Harness({ label }: { label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useLocalizedStepLabels(ref, format);
  return (
    <div ref={ref}>
      <button type="button" aria-label={label}>
        1
      </button>
      <button type="button" aria-label="Close">
        x
      </button>
    </div>
  );
}

describe('useLocalizedStepLabels', () => {
  it('rewrites the Stepper indicator labels and leaves other labels alone', async () => {
    render(<Harness label="Step 1: Descubra-se" />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Etapa 1: Descubra-se' })).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('re-applies when the component re-renders a new English label', async () => {
    const { rerender } = render(<Harness label="Step 1: Descubra-se" />);
    rerender(<Harness label="Step 1: Encontre sua conexão" />);
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Etapa 1: Encontre sua conexão' }),
      ).toBeInTheDocument();
    });
  });
});
