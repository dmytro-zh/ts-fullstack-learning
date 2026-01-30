'use client';

import { useState } from 'react';
import styles from './admin.module.css';
import { AdminConfirmDialog } from './admin-confirm-dialog';

type MerchantPlanButtonProps = {
  id: string;
  plan: 'FREE' | 'PRO';
};

export function MerchantPlanButton({ id, plan }: MerchantPlanButtonProps) {
  const isPro = plan === 'PRO';
  const [confirmOpen, setConfirmOpen] = useState(false);

  const onConfirm = async () => {
    await fetch(`/api/admin/merchants/${id}/plan`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ plan: isPro ? 'FREE' : 'PRO' }),
    });
    window.location.reload();
  };

  return (
    <>
      <button type="button" className={styles.actionButton} onClick={() => setConfirmOpen(true)}>
        {isPro ? 'Downgrade to Free' : 'Upgrade to Pro'}
      </button>
      <AdminConfirmDialog
        open={confirmOpen}
        title={isPro ? 'Downgrade merchant?' : 'Upgrade merchant?'}
        description={
          isPro
            ? 'This will move the merchant to the Free plan.'
            : 'This will set the merchant plan to Pro (ACTIVE).'
        }
        confirmLabel={isPro ? 'Downgrade' : 'Upgrade'}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          void onConfirm();
        }}
      />
    </>
  );
}
