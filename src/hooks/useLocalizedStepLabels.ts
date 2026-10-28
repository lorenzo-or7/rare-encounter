import { useEffect, type RefObject } from 'react';

/** The vendored React Bits Stepper writes indicator labels as `Step N: <title>`. */
const ORIGINAL = /^Step (\d+): (.+)$/;

/**
 * Localizes the accessible name of the React Bits Stepper's indicators without editing the
 * vendored component or its visuals: it rewrites only their `aria-label`, and re-applies
 * whenever the Stepper re-renders a label (React only re-sets an attribute whose prop
 * changed, so the rewrite holds between renders).
 *
 * @param format builds the label, e.g. (n, title) => `Etapa ${n}: ${title}`
 */
export function useLocalizedStepLabels(
  root: RefObject<HTMLElement | null>,
  format: (step: string, title: string) => string,
): void {
  useEffect(() => {
    const container = root.current;
    if (!container) return;

    const apply = () => {
      for (const el of container.querySelectorAll<HTMLElement>('[aria-label^="Step "]')) {
        const match = ORIGINAL.exec(el.getAttribute('aria-label') ?? '');
        if (!match?.[1] || !match[2]) continue;
        const next = format(match[1], match[2]);
        if (next !== el.getAttribute('aria-label')) el.setAttribute('aria-label', next);
      }
    };

    apply();
    const observer = new MutationObserver(apply);
    observer.observe(container, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['aria-label'],
    });
    return () => {
      observer.disconnect();
    };
  }, [root, format]);
}
