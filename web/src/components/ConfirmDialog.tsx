import { useEffect } from 'react';

export function ConfirmDialog({ title, message, confirmLabel, busy, danger, onCancel, onConfirm }: {
  title: string;
  message: string;
  confirmLabel: string;
  busy?: boolean;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onCancel();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [busy, onCancel]);

  return (
    <div className="confirm-backdrop" role="presentation">
      <section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <header>
          <h2 id="confirm-title">{title}</h2>
          <button className="icon-button" type="button" aria-label="Close dialog" disabled={busy} onClick={onCancel}>×</button>
        </header>
        <p>{message}</p>
        <footer>
          <button className="ghost" type="button" disabled={busy} onClick={onCancel}>Cancel</button>
          <button className={danger ? 'danger-confirm' : 'primary'} type="button" disabled={busy} onClick={onConfirm}>{confirmLabel}</button>
        </footer>
      </section>
    </div>
  );
}
