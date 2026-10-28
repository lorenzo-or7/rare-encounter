import { useEffect, useId, useRef, type ReactNode } from 'react';
import { IconButton } from '../button/Button';
import './Sheet.css';

interface SheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly closeLabel: string;
  readonly children: ReactNode;
}

/**
 * Right-side drawer on desktop, bottom sheet on mobile (pure CSS breakpoint).
 * Built on the native modal <dialog>: focus containment, Esc, inert background and
 * focus return come from the platform.
 */
export function Sheet({ open, onClose, title, closeLabel, children }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // A click on the dialog box itself (not its content) is a click on the backdrop.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sheet__panel">
        <div className="sheet__header">
          <h2 id={titleId} className="sheet__title">
            {title}
          </h2>
          <IconButton icon="close" label={closeLabel} onClick={onClose} />
        </div>
        <div className="sheet__body">{children}</div>
      </div>
    </dialog>
  );
}
