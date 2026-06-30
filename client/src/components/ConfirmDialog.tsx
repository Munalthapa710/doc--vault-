import { AlertTriangle, X } from 'lucide-react';

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'danger' | 'default';
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'default',
  busy = false,
  onCancel,
  onConfirm
}: Props) {
  if (!open) return null;

  const confirmClass = tone === 'danger' ? 'btn-danger' : 'btn-primary';

  return (
    <div className="confirm-layer" role="presentation">
      <button className="confirm-backdrop" type="button" aria-label={cancelLabel} onClick={onCancel} />
      <section className="confirm-panel" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
        <div className="confirm-head">
          <span className={tone === 'danger' ? 'confirm-icon danger' : 'confirm-icon'}>
            <AlertTriangle size={20} aria-hidden="true" />
          </span>
          <button className="icon-button" type="button" onClick={onCancel} aria-label={cancelLabel}>
            <X size={17} />
          </button>
        </div>
        <div className="confirm-copy">
          <h2 id="confirm-dialog-title">{title}</h2>
          <p>{message}</p>
        </div>
        <div className="confirm-actions">
          <button className="btn-secondary" type="button" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button className={confirmClass} type="button" onClick={onConfirm} disabled={busy}>
            {busy ? 'Working...' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
