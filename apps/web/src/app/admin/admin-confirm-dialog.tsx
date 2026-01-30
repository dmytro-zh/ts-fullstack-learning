'use client';

import styles from './admin.module.css';

type AdminConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
};

export function AdminConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
  danger = false,
}: AdminConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className={styles.dialogOverlay} role="dialog" aria-modal="true">
      <div className={styles.dialogCard}>
        <div className={styles.dialogTitle}>{title}</div>
        <p className={styles.dialogDescription}>{description}</p>
        <div className={styles.dialogActions}>
          <button type="button" className={styles.dialogButton} onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className={danger ? styles.dialogButtonDanger : styles.dialogButtonPrimary}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
