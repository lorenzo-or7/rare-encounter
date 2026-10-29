import { fireEvent, render, screen } from '@testing-library/react';
import { validateQuestionArt } from '../../domain/answer-art';
import type { AnswerId, Question, QuestionId } from '../../domain/questions';
import { AnswerButton } from './AnswerButton';
import { PREVIEW_SOURCE } from './preview/preview-bank';

const frame = (container: HTMLElement) => container.querySelector('.answer-art');

function renderPhoto(media: string | undefined, selected = false, ratio: '4:3' | '1:1' = '4:3') {
  const onChoose = vi.fn();
  const view = render(
    <AnswerButton
      format="photo"
      label="Coast"
      media={media}
      artRatio={ratio}
      selected={selected}
      disabled={false}
      onChoose={onChoose}
    />,
  );
  return { ...view, onChoose };
}

describe('Visual Answer Art: answer card states', () => {
  it('holds the frame while loading, then shows the image', () => {
    const { container } = renderPhoto('/scene.svg');
    expect(frame(container)).toHaveAttribute('data-state', 'loading');
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    if (img) fireEvent.load(img);
    expect(frame(container)).toHaveAttribute('data-state', 'ready');
  });

  it('falls back to a neutral surface when the image fails, keeping the name and the choice', () => {
    const { container, onChoose } = renderPhoto('/missing.png', true);
    const img = container.querySelector('img');
    if (img) fireEvent.error(img);
    expect(frame(container)).toHaveAttribute('data-state', 'failed');
    expect(container.querySelector('img')).toBeNull();
    const button = screen.getByRole('button', { name: 'Coast' });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(button);
    expect(onChoose).toHaveBeenCalledOnce();
  });

  it('treats a missing image reference as unavailable from the start', () => {
    const { container } = renderPhoto(undefined);
    expect(frame(container)).toHaveAttribute('data-state', 'failed');
  });

  it('applies the question ratio to the frame', () => {
    const { container } = renderPhoto('/swatch.png', false, '1:1');
    expect(frame(container)).toHaveAttribute('data-ratio', '1:1');
  });

  it('names the card by its caption only, with the mark after the name', () => {
    const { container } = renderPhoto('/scene.svg');
    expect(screen.getByRole('button')).toHaveAccessibleName('Coast');
    const caption = container.querySelector('.answer__caption');
    expect(caption?.firstElementChild).toHaveClass('answer__label');
    expect(caption?.lastElementChild).toHaveClass('answer__mark');
  });
});

describe('Visual Answer Art: data contract', () => {
  const bare: Question = {
    id: 'q' as QuestionId,
    revision: 1,
    category: 'environments',
    role: 'fundamental',
    format: 'photo',
    prompt: { en: 'p', 'pt-BR': 'p', es: 'p' },
    options: ['a', 'b', 'c', 'd'].map((k) => ({
      id: k as AnswerId,
      label: { en: k, 'pt-BR': k, es: k },
      media: { src: `/${k}.png`, alt: { en: k, 'pt-BR': k, es: k } },
      effects: {},
    })),
  };
  const base: Question = { ...bare, art: { ratio: '4:3', comparison: 'balanced-variety' } };

  it('accepts four images sharing one ratio', () => {
    expect(validateQuestionArt(base)).toEqual([]);
  });

  it('flags a missing art spec, a wrong option count and an option without an image', () => {
    const broken: Question = {
      ...bare,
      options: base.options.slice(0, 3).map((o, i) => (i === 0 ? { ...o, media: undefined } : o)) as Question['options'],
    };
    const kinds = validateQuestionArt(broken).map((i) => i.kind);
    expect(kinds).toEqual(['missing-art', 'option-count', 'missing-media']);
  });

  it('flags art on a question that has no images', () => {
    expect(validateQuestionArt({ ...base, format: 'text' }).map((i) => i.kind)).toEqual([
      'unexpected-art',
    ]);
  });

  it('every preview image question meets the contract', () => {
    for (const id of PREVIEW_SOURCE.start(90)) {
      const q = PREVIEW_SOURCE.question(id);
      if (q) expect(validateQuestionArt(q)).toEqual([]);
    }
  });
});
