'use client';

import { useState } from 'react';
import styles from './admin.module.css';
import { AdminConfirmDialog } from './admin-confirm-dialog';

type StoreStatusButtonProps = {
  id: string;
  isActive: boolean;
};

export function StoreStatusButton({ id, isActive }: StoreStatusButtonProps) {
  const [submitting, setSubmitting] = useState(false);
  const [currentActive, setCurrentActive] = useState(isActive);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const onConfirm = async () => {
    if (submitting) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/admin/stores/${id}/status`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !currentActive }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const message = data?.error ?? 'Failed to update store status';
        window.alert(message);
        return;
      }

      const data = (await res.json().catch(() => null)) as {
        store?: { isActive?: boolean };
      } | null;
      const nextActive = data?.store?.isActive;
      setCurrentActive(typeof nextActive === 'boolean' ? nextActive : !currentActive);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.actionStack}>
      {!currentActive ? <span className={styles.statusText}>Blocked</span> : null}
      <button
        type="button"
        className={currentActive ? styles.actionButtonDanger : styles.actionButton}
        onClick={() => setConfirmOpen(true)}
        disabled={submitting}
      >
        {submitting ? 'Updating…' : currentActive ? 'Block' : 'Unblock'}
      </button>
      <AdminConfirmDialog
        open={confirmOpen}
        title={currentActive ? 'Block store?' : 'Unblock store?'}
        description={
          currentActive
            ? 'This will disable checkout links for this store.'
            : 'This will re-enable checkout links for this store.'
        }
        confirmLabel={currentActive ? 'Block store' : 'Unblock store'}
        danger={currentActive}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          void onConfirm();
        }}
      />
    </div>
  );
}
