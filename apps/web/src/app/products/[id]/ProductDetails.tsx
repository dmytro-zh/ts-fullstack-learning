'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ProductByIdQuery } from '../../../graphql/generated/graphql';
import { updateProductAction } from '../../actions/updateProduct';
import { deleteProductAction } from '../../actions/deleteProduct';

type ProductData = NonNullable<ProductByIdQuery['product']>;
type ProductImage = NonNullable<NonNullable<ProductData['images']>[number]>;

type DraftImage = {
  id: string;
  productId: string | null;
  uploadSession: string;
  key: string;
  url: string;
  mime: string;
  size: number;
  width: number | null;
  height: number | null;
  isPrimary: boolean;
  createdAt: string;
};

type AttachResponse = {
  ok: boolean;
  productId: string;
  images: Array<{ id: string; url: string; isPrimary: boolean }>;
};

type DeleteResponse = {
  ok: boolean;
  images: Array<{ id: string; url: string; isPrimary: boolean }>;
};

function sortDraftImagesNewestFirst(images: DraftImage[]) {
  return [...images].sort((a, b) => {
    const ta = Date.parse(a.createdAt);
    const tb = Date.parse(b.createdAt);
    return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
  });
}

function sortSavedImagesPrimaryFirst(images: ProductImage[]) {
  const primary = images.filter((i) => i.isPrimary);
  const rest = images.filter((i) => !i.isPrimary);
  return [...primary, ...rest];
}

function pickPrimaryDraftImage(images: DraftImage[], selectedId: string | null) {
  if (selectedId) return images.find((i) => i.id === selectedId) ?? null;
  return images.find((i) => i.isPrimary) ?? images[0] ?? null;
}

function pickPrimarySavedImage(images: ProductImage[], selectedId: string | null) {
  if (selectedId) return images.find((i) => i.id === selectedId) ?? null;
  return images.find((i) => i.isPrimary) ?? images[0] ?? null;
}

function normalizeQuantityInput(value: string) {
  const onlyDigits = value.replace(/[^\d]/g, '');
  if (onlyDigits === '') return '';
  const num = Number(onlyDigits);
  if (!Number.isFinite(num) || Number.isNaN(num)) return '';
  return String(Math.max(0, Math.floor(num)));
}

function PrimaryButton({
  children,
  disabled,
  onClick,
  title,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={title}
      style={{
        padding: '10px 14px',
        borderRadius: 999,
        border: '1px solid #1d4ed8',
        background: disabled ? '#93c5fd' : '#2563eb',
        color: '#ffffff',
        fontWeight: 900,
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: '0 12px 26px rgba(37,99,235,0.22)',
        lineHeight: '20px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  children,
  disabled,
  onClick,
  title,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={title}
      style={{
        padding: '10px 14px',
        borderRadius: 999,
        border: '1px solid rgba(226,232,240,0.95)',
        background: disabled ? '#f1f5f9' : '#ffffff',
        color: '#0f172a',
        fontWeight: 900,
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: '0 8px 22px rgba(15,23,42,0.06)',
        lineHeight: '20px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}

function DangerButton({
  children,
  disabled,
  onClick,
  title,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={title}
      style={{
        padding: '10px 14px',
        borderRadius: 999,
        border: '1px solid rgba(239,68,68,0.35)',
        background: disabled ? '#fecaca' : '#ef4444',
        color: '#ffffff',
        fontWeight: 900,
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: '0 12px 26px rgba(239,68,68,0.18)',
        lineHeight: '20px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}

function SubtleTag({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: 'success' | 'warning' | 'neutral';
}) {
  const map =
    tone === 'success'
      ? { color: '#065f46', bg: '#ecfdf5', border: '#6ee7b7' }
      : tone === 'warning'
        ? { color: '#92400e', bg: '#fffbeb', border: '#fcd34d' }
        : { color: '#334155', bg: '#f1f5f9', border: '#cbd5e1' };

  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 900,
        padding: '4px 10px',
        borderRadius: 999,
        color: map.color,
        background: map.bg,
        border: `1px solid ${map.border}`,
        lineHeight: '16px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

function Toast({ text, tone }: { text: string; tone: 'success' | 'error' | 'info' }) {
  const map =
    tone === 'success'
      ? { color: '#065f46', bg: '#ecfdf5', border: '#6ee7b7' }
      : tone === 'error'
        ? { color: '#991b1b', bg: '#fef2f2', border: '#fecaca' }
        : { color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe' };

  return (
    <div
      role="status"
      style={{
        borderRadius: 14,
        border: `1px solid ${map.border}`,
        background: map.bg,
        color: map.color,
        padding: '10px 12px',
        fontWeight: 900,
        fontSize: 13,
        lineHeight: 1.35,
      }}
    >
      {text}
    </div>
  );
}

export function ProductDetails({
  product,
  storeId,
}: {
  product: ProductData;
  storeId: string | null;
}) {
  const router = useRouter();

  const initialPrice = String(product.price);
  const initialDescription = product.description ?? '';
  const initialQuantity = String(product.quantity ?? 0);

  const [price, setPrice] = useState(initialPrice);
  const [description, setDescription] = useState(initialDescription);
  const [quantity, setQuantity] = useState(initialQuantity);

  const [toast, setToast] = useState<{ tone: 'success' | 'error' | 'info'; text: string } | null>(
    null,
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingSaved, setIsDeletingSaved] = useState(false);
  const [deleteProductModalOpen, setDeleteProductModalOpen] = useState(false);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  const [uploadSession, setUploadSession] = useState<string | null>(null);
  const [draftImages, setDraftImages] = useState<DraftImage[]>([]);
  const [selectedPrimaryDraftId, setSelectedPrimaryDraftId] = useState<string | null>(null);

  const [selectedSavedImageId, setSelectedSavedImageId] = useState<string | null>(null);

  const [optimisticSavedImages, setOptimisticSavedImages] = useState<ProductImage[] | null>(null);

  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const [deleteModal, setDeleteModal] = useState<{ open: boolean; imageId: string | null }>(() => ({
    open: false,
    imageId: null,
  }));

  // IMPORTANT: keep same-origin so cookies/auth always work.
  // If your API is mounted under apps/web (same Next app), use relative URLs.
  const apiBaseUrl = '/api';

  const fetchJson = async <T,>(input: RequestInfo | URL, init?: RequestInit): Promise<T> => {
    const res = await fetch(input, {
      ...init,
      credentials: 'include',
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error ?? `Request failed (${res.status})`);
    }

    return (await res.json()) as T;
  };

  const savedImagesFromProps = useMemo(
    () => (product.images ?? []) as ProductImage[],
    [product.images],
  );

  const savedImages = useMemo(() => {
    const base = optimisticSavedImages ?? savedImagesFromProps;
    return sortSavedImagesPrimaryFirst(base);
  }, [optimisticSavedImages, savedImagesFromProps]);

  const hasDraft = draftImages.length > 0;

  const draftPrimaryImage = useMemo(
    () => pickPrimaryDraftImage(draftImages, selectedPrimaryDraftId),
    [draftImages, selectedPrimaryDraftId],
  );

  const savedPrimaryImage = useMemo(
    () => pickPrimarySavedImage(savedImages, selectedSavedImageId),
    [savedImages, selectedSavedImageId],
  );

  const galleryImages = useMemo(() => {
    if (hasDraft) return sortDraftImagesNewestFirst(draftImages);
    return savedImages;
  }, [hasDraft, draftImages, savedImages]);

  const selectedImageUrl = useMemo(() => {
    if (hasDraft) return draftPrimaryImage?.url ?? null;
    return savedPrimaryImage?.url ?? null;
  }, [hasDraft, draftPrimaryImage?.url, savedPrimaryImage?.url]);

  const selectedId = useMemo(() => {
    if (hasDraft) return selectedPrimaryDraftId ?? draftPrimaryImage?.id ?? null;
    return selectedSavedImageId ?? savedPrimaryImage?.id ?? null;
  }, [
    hasDraft,
    selectedPrimaryDraftId,
    draftPrimaryImage?.id,
    selectedSavedImageId,
    savedPrimaryImage?.id,
  ]);

  const isDirtyFields =
    price !== initialPrice || description !== initialDescription || quantity !== initialQuantity;

  const isDirtyImages = draftImages.length > 0;
  const isDirty = isDirtyFields || isDirtyImages;

  async function createSession() {
    const data = await fetchJson<{ uploadSession: string }>(`${apiBaseUrl}/uploads/sessions`, {
      method: 'POST',
    });
    return data.uploadSession;
  }

  async function loadSessionImages(session: string) {
    const data = await fetchJson<{ uploadSession: string; images: DraftImage[] }>(
      `${apiBaseUrl}/uploads/sessions/${encodeURIComponent(session)}`,
    );
    return data.images ?? [];
  }

  async function cleanupSession(session: string) {
    await fetch(`${apiBaseUrl}/uploads/sessions/${encodeURIComponent(session)}`, {
      method: 'DELETE',
      credentials: 'include',
    });
  }

  async function deleteDraftImage(id: string) {
    await fetch(`${apiBaseUrl}/uploads/product-image/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include',
    }).then(async (res) => {
      if (res.ok) return;
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error ?? `Delete failed (${res.status})`);
    });
  }

  async function deleteSavedImage(productId: string, imageId: string) {
    const data = await fetchJson<DeleteResponse>(
      `${apiBaseUrl}/products/${encodeURIComponent(productId)}/images/${encodeURIComponent(imageId)}`,
      { method: 'DELETE' },
    );
    return data.images ?? [];
  }

  async function uploadToSession(session: string, file: File) {
    const form = new FormData();
    form.append('uploadSession', session);
    form.append('makePrimary', 'true');
    form.append('file', file);

    const res = await fetch(`${apiBaseUrl}/uploads/product-image`, {
      method: 'POST',
      body: form,
      credentials: 'include',
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error ?? `Upload failed (${res.status})`);
    }

    const created = (await res.json()) as DraftImage;
    return created;
  }

  async function attachSessionToProduct(session: string, primaryImageId: string | null) {
    const data = await fetchJson<AttachResponse>(`${apiBaseUrl}/uploads/attach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uploadSession: session,
        productId: product.id,
        primaryImageId: primaryImageId ?? null,
      }),
    });

    return data.images ?? [];
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const session = await createSession();
        if (cancelled) return;
        setUploadSession(session);
        setDraftImages([]);
        setSelectedPrimaryDraftId(null);
      } catch (e) {
        if (cancelled) return;
        setToast({
          tone: 'error',
          text: e instanceof Error ? e.message : 'Failed to init upload session',
        });
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = '';
    };

    const onClickCapture = (e: MouseEvent) => {
      if (!isDirty) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      const anchor = target.closest('a') as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.href;
      if (!href) return;

      e.preventDefault();
      e.stopPropagation();

      setPendingHref(href);
      setLeaveModalOpen(true);
    };

    const onPopState = () => {
      if (!isDirty) return;
      history.pushState(null, '', window.location.href);
      setPendingHref('BACK');
      setLeaveModalOpen(true);
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('click', onClickCapture, true);
    window.addEventListener('popstate', onPopState);

    if (typeof window !== 'undefined') {
      history.pushState(null, '', window.location.href);
    }

    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('click', onClickCapture, true);
      window.removeEventListener('popstate', onPopState);
    };
  }, [isDirty]);

  useEffect(() => {
    if (!toast) return;
    if (toast.tone === 'error') return;

    const t = window.setTimeout(() => setToast(null), 2500);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (isDirty) return;

    setPrice(String(product.price));
    setDescription(product.description ?? '');
    setQuantity(String(product.quantity ?? 0));

    setOptimisticSavedImages(null);
    setSelectedSavedImageId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id, product.price, product.description, product.quantity]);

  const onPickFile = () => {
    setToast(null);
    fileInputRef.current?.click();
  };

  const onUploadSelected = async (file: File) => {
    setToast(null);

    if (!uploadSession) {
      setToast({ tone: 'error', text: 'Upload session is not ready yet' });
      return;
    }

    setIsUploading(true);

    try {
      const created = await uploadToSession(uploadSession, file);
      const images = await loadSessionImages(uploadSession);
      const sorted = sortDraftImagesNewestFirst(images);

      setDraftImages(sorted);
      setSelectedPrimaryDraftId(created.id);

      setToast({ tone: 'info', text: 'Image added as draft. Save to apply.' });
    } catch (err) {
      setToast({ tone: 'error', text: err instanceof Error ? err.message : 'Upload failed' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onRemoveDraftImage = async (id: string) => {
    setToast(null);
    if (!uploadSession) return;

    try {
      await deleteDraftImage(id);
      const images = await loadSessionImages(uploadSession);
      const sorted = sortDraftImagesNewestFirst(images);

      setDraftImages(sorted);

      if (selectedPrimaryDraftId === id) {
        setSelectedPrimaryDraftId(sorted[0]?.id ?? null);
      }

      if (sorted.length === 0) {
        setToast({ tone: 'info', text: 'Draft cleared.' });
      }
    } catch (err) {
      setToast({ tone: 'error', text: err instanceof Error ? err.message : 'Delete failed' });
    }
  };

  const onSelectPrimary = (id: string) => {
    if (hasDraft) {
      setSelectedPrimaryDraftId(id);
      setToast({ tone: 'info', text: 'Primary selected in draft. Save to apply.' });
      return;
    }

    setSelectedSavedImageId(id);
    setToast(null);
  };

  const onClearDraftOnly = async () => {
    setToast(null);

    if (uploadSession && draftImages.length > 0) {
      try {
        await cleanupSession(uploadSession);
      } catch {
        // ignore
      }
    }

    setDraftImages([]);
    setSelectedPrimaryDraftId(null);
    setToast({ tone: 'info', text: 'Draft cleared.' });
  };

  const onCancel = async () => {
    setToast(null);

    if (uploadSession && draftImages.length > 0) {
      try {
        await cleanupSession(uploadSession);
      } catch {
        // ignore
      }
    }

    setPrice(initialPrice);
    setDescription(initialDescription);
    setQuantity(initialQuantity);

    setDraftImages([]);
    setSelectedPrimaryDraftId(null);

    setOptimisticSavedImages(null);
    setSelectedSavedImageId(null);

    setToast({ tone: 'info', text: 'Changes discarded.' });
  };

  const onSave = async () => {
    setToast(null);
    setIsSaving(true);

    const priceNumber = Number(price.replace(',', '.'));
    if (Number.isNaN(priceNumber)) {
      setToast({ tone: 'error', text: 'Price must be a number' });
      setIsSaving(false);
      return;
    }

    const quantityNumberLocal = Number(quantity);
    if (
      Number.isNaN(quantityNumberLocal) ||
      !Number.isInteger(quantityNumberLocal) ||
      quantityNumberLocal < 0
    ) {
      setToast({ tone: 'error', text: 'Quantity must be a non-negative integer' });
      setIsSaving(false);
      return;
    }

    try {
      await updateProductAction({
        id: product.id,
        price: priceNumber,
        description: description || undefined,
        quantity: quantityNumberLocal,
      });

      if (uploadSession && draftImages.length > 0) {
        const primaryDraftId =
          selectedPrimaryDraftId ??
          draftImages.find((i) => i.isPrimary)?.id ??
          draftImages[0]?.id ??
          null;

        const imagesFromServer = await attachSessionToProduct(uploadSession, primaryDraftId);

        setOptimisticSavedImages(imagesFromServer as unknown as ProductImage[]);
        const nextPrimary =
          imagesFromServer.find((i) => i.isPrimary) ?? imagesFromServer[0] ?? null;
        setSelectedSavedImageId(nextPrimary?.id ?? null);

        await cleanupSession(uploadSession);
        setDraftImages([]);
        setSelectedPrimaryDraftId(null);

        setToast({ tone: 'success', text: 'Changes saved.' });
        router.refresh();
      } else {
        setToast({ tone: 'success', text: 'Changes saved.' });
        router.refresh();
      }
    } catch (err) {
      setToast({ tone: 'error', text: err instanceof Error ? err.message : 'Failed to save' });
    } finally {
      setIsSaving(false);
    }
  };

  const discardAndLeave = async () => {
    setLeaveModalOpen(false);
    await onCancel();

    if (!pendingHref) return;

    if (pendingHref === 'BACK') {
      router.back();
      return;
    }

    try {
      const url = new URL(pendingHref);
      const sameOrigin = url.origin === window.location.origin;
      if (sameOrigin) {
        router.push(url.pathname + url.search + url.hash);
      } else {
        window.location.href = pendingHref;
      }
    } finally {
      setPendingHref(null);
    }
  };

  const continueEditing = () => {
    setLeaveModalOpen(false);
    setPendingHref(null);
  };

  const openDeleteSaved = (imageId: string) => {
    setDeleteModal({ open: true, imageId });
  };

  const closeDeleteSaved = () => {
    setDeleteModal({ open: false, imageId: null });
  };

  const confirmDeleteSaved = async () => {
    const imageId = deleteModal.imageId;
    if (!imageId) return;

    setIsDeletingSaved(true);
    setToast(null);

    try {
      const nextImages = await deleteSavedImage(product.id, imageId);

      setOptimisticSavedImages(nextImages as unknown as ProductImage[]);

      const nextPrimary = nextImages.find((i) => i.isPrimary) ?? nextImages[0] ?? null;
      setSelectedSavedImageId(nextPrimary?.id ?? null);

      setToast({ tone: 'success', text: 'Image deleted.' });

      closeDeleteSaved();
      router.refresh();
    } catch (err) {
      setToast({
        tone: 'error',
        text: err instanceof Error ? err.message : 'Failed to delete image',
      });
    } finally {
      setIsDeletingSaved(false);
    }
  };

  const pageCardStyle: React.CSSProperties = {
    width: '100%',
    background: '#ffffff',
    border: '1px solid rgba(226,232,240,0.95)',
    borderRadius: 18,
    padding: 18,
    boxShadow: '0 18px 50px rgba(15, 23, 42, 0.08)',
    display: 'grid',
    gap: 16,
    color: '#0f172a',
  };

  const inputBaseStyle: React.CSSProperties = {
    padding: '10px 12px',
    borderRadius: 12,
    border: '1px solid rgba(226,232,240,0.95)',
    background: '#f8fafc',
    color: '#0f172a',
    caretColor: '#2563eb',
    fontSize: 14,
    lineHeight: 1.4,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'grid',
    gap: 6,
    fontWeight: 900,
    color: '#0f172a',
    fontSize: 12,
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
  };

  const helperText: React.CSSProperties = {
    margin: 0,
    fontSize: 12,
    color: '#64748b',
    fontWeight: 700,
    lineHeight: 1.4,
  };

  const previewBoxStyle: React.CSSProperties = {
    borderRadius: 18,
    border: '1px solid rgba(226,232,240,0.95)',
    background: '#ffffff',
    overflow: 'hidden',
    boxShadow: '0 10px 26px rgba(15, 23, 42, 0.06)',
  };

  const isStoreBlocked = product.store?.isActive === false;
  const checkoutHref = storeId
    ? `/checkout-links?productId=${encodeURIComponent(product.id)}&store=${encodeURIComponent(storeId)}`
    : `/checkout-links?productId=${encodeURIComponent(product.id)}`;

  const deleteProductDisabled =
    isSaving || isUploading || isDeletingSaved || isDeletingProduct || isDirty;

  return (
    <div style={pageCardStyle}>
      {leaveModalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            display: 'grid',
            placeItems: 'center',
            padding: 16,
            zIndex: 9999,
          }}
        >
          <div
            style={{
              width: 'min(520px, 100%)',
              background: '#fff',
              borderRadius: 18,
              border: '1px solid rgba(226,232,240,0.95)',
              boxShadow: '0 20px 60px rgba(15, 23, 42, 0.25)',
              padding: 16,
              display: 'grid',
              gap: 12,
            }}
          >
            <div style={{ fontWeight: 900, fontSize: 16 }}>Unsaved changes</div>
            <div style={{ color: '#475569', fontSize: 13, lineHeight: 1.5, fontWeight: 700 }}>
              You have unsaved changes. Save them or discard before leaving this page.
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <SecondaryButton onClick={continueEditing}>Continue editing</SecondaryButton>
              <DangerButton
                onClick={() => void discardAndLeave()}
                title="Discard changes and leave"
              >
                Discard and leave
              </DangerButton>
            </div>
          </div>
        </div>
      ) : null}

      {deleteModal.open ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            display: 'grid',
            placeItems: 'center',
            padding: 16,
            zIndex: 9999,
          }}
        >
          <div
            style={{
              width: 'min(520px, 100%)',
              background: '#fff',
              borderRadius: 18,
              border: '1px solid rgba(226,232,240,0.95)',
              boxShadow: '0 20px 60px rgba(15, 23, 42, 0.25)',
              padding: 16,
              display: 'grid',
              gap: 12,
            }}
          >
            <div style={{ fontWeight: 900, fontSize: 16 }}>Delete image?</div>
            <div style={{ color: '#475569', fontSize: 13, lineHeight: 1.5, fontWeight: 700 }}>
              This will permanently delete the image from the product.
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <SecondaryButton disabled={isDeletingSaved} onClick={closeDeleteSaved}>
                Cancel
              </SecondaryButton>
              <DangerButton disabled={isDeletingSaved} onClick={() => void confirmDeleteSaved()}>
                {isDeletingSaved ? 'Deleting...' : 'Delete'}
              </DangerButton>
            </div>
          </div>
        </div>
      ) : null}

      {deleteProductModalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            display: 'grid',
            placeItems: 'center',
            padding: 16,
            zIndex: 9999,
          }}
        >
          <div
            style={{
              width: 'min(520px, 100%)',
              background: '#fff',
              borderRadius: 18,
              border: '1px solid rgba(226,232,240,0.95)',
              boxShadow: '0 20px 60px rgba(15, 23, 42, 0.25)',
              padding: 16,
              display: 'grid',
              gap: 12,
            }}
          >
            <div style={{ fontWeight: 900, fontSize: 16 }}>Archive product?</div>
            <div style={{ color: '#475569', fontSize: 13, lineHeight: 1.5, fontWeight: 700 }}>
              This will hide the product from the store. Existing orders will stay intact. Checkout
              links will be deactivated.
            </div>

            {isDirty ? (
              <div style={{ color: '#991b1b', fontSize: 13, lineHeight: 1.5, fontWeight: 800 }}>
                You have unsaved changes. Save or cancel before archiving the product.
              </div>
            ) : null}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <SecondaryButton
                disabled={isDeletingProduct}
                onClick={() => setDeleteProductModalOpen(false)}
              >
                Cancel
              </SecondaryButton>
              <DangerButton
                disabled={isDeletingProduct || isDirty}
                onClick={() =>
                  void (async () => {
                    try {
                      setIsDeletingProduct(true);
                      setToast(null);

                      await deleteProductAction(product.id);

                      setToast({ tone: 'success', text: 'Product archived.' });

                      if (storeId) router.push(`/products?store=${encodeURIComponent(storeId)}`);
                      else router.push('/products');
                    } catch (e) {
                      setToast({
                        tone: 'error',
                        text: e instanceof Error ? e.message : 'Failed to archive product',
                      });
                    } finally {
                      setIsDeletingProduct(false);
                      setDeleteProductModalOpen(false);
                    }
                  })()
                }
              >
                {isDeletingProduct ? 'Archiving...' : 'Archive'}
              </DangerButton>
            </div>
          </div>
        </div>
      ) : null}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'grid', gap: 6 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ fontSize: 14, fontWeight: 900 }}>Images</div>
            {hasDraft ? (
              <SubtleTag tone="warning">Draft</SubtleTag>
            ) : (
              <SubtleTag tone="success">Saved</SubtleTag>
            )}
          </div>
          <p style={helperText}>Upload images, choose the primary, then Save to apply.</p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {isStoreBlocked ? (
            <span
              title="Store is blocked"
              style={{
                padding: '10px 14px',
                borderRadius: 999,
                border: '1px solid #e5e7eb',
                background: '#f1f5f9',
                color: '#94a3b8',
                fontWeight: 900,
                lineHeight: '20px',
                whiteSpace: 'nowrap',
              }}
            >
              Store blocked
            </span>
          ) : (
            <Link
              href={checkoutHref}
              style={{
                padding: '10px 14px',
                borderRadius: 999,
                border: '1px solid rgba(37,99,235,0.35)',
                background: '#ffffff',
                color: '#2563eb',
                fontWeight: 900,
                textDecoration: 'none',
                boxShadow: '0 8px 22px rgba(15,23,42,0.06)',
                lineHeight: '20px',
                whiteSpace: 'nowrap',
              }}
              title="Create a shareable checkout link for this product"
            >
              Create checkout link
            </Link>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              if (file) void onUploadSelected(file);
            }}
          />

          <SecondaryButton disabled={isUploading || !uploadSession} onClick={onPickFile}>
            {isUploading ? 'Uploading...' : 'Upload image'}
          </SecondaryButton>

          {hasDraft ? (
            <SecondaryButton onClick={() => void onClearDraftOnly()} title="Remove draft images">
              Clear draft
            </SecondaryButton>
          ) : null}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.35fr 0.85fr',
          gap: 16,
          alignItems: 'start',
        }}
      >
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={previewBoxStyle}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 3' }}>
              {selectedImageUrl ? (
                <Image
                  src={selectedImageUrl}
                  alt={product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 760px"
                  style={{ objectFit: 'contain', background: '#ffffff' }}
                  priority
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#64748b',
                    fontSize: 13,
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #ffffff 0, #f8fafc 100%)',
                  }}
                >
                  No image yet
                </div>
              )}
            </div>
          </div>

          {galleryImages.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(92px, 1fr))',
                gap: 10,
              }}
            >
              {galleryImages.map((img) => {
                const isSelected = selectedId ? selectedId === img.id : false;

                return (
                  <div
                    key={img.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectPrimary(img.id)}
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter' && e.key !== ' ') return;
                      e.preventDefault();
                      onSelectPrimary(img.id);
                    }}
                    style={{
                      borderRadius: 16,
                      border: isSelected ? '2px solid #2563eb' : '1px solid rgba(226,232,240,0.95)',
                      background: '#ffffff',
                      overflow: 'hidden',
                      position: 'relative',
                      cursor: 'pointer',
                      boxShadow: isSelected
                        ? '0 10px 22px rgba(37,99,235,0.18)'
                        : '0 8px 18px rgba(15,23,42,0.04)',
                      transform: isSelected ? 'translateY(-1px)' : 'none',
                    }}
                    title={hasDraft ? 'Set as primary in draft' : 'Preview'}
                  >
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1' }}>
                      <Image
                        src={img.url}
                        alt={product.name}
                        fill
                        sizes="120px"
                        style={{ objectFit: 'contain', background: '#ffffff' }}
                      />
                    </div>

                    {hasDraft ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          void onRemoveDraftImage(img.id);
                        }}
                        aria-label="Remove draft image"
                        title="Remove"
                        style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          width: 26,
                          height: 26,
                          borderRadius: 999,
                          border: '1px solid rgba(226,232,240,0.95)',
                          background: 'rgba(255,255,255,0.92)',
                          color: '#0f172a',
                          cursor: 'pointer',
                          fontWeight: 900,
                          lineHeight: '24px',
                          textAlign: 'center',
                        }}
                      >
                        x
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openDeleteSaved(img.id);
                        }}
                        aria-label="Delete saved image"
                        title="Delete"
                        style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          width: 26,
                          height: 26,
                          borderRadius: 999,
                          border: '1px solid rgba(239,68,68,0.25)',
                          background: 'rgba(255,255,255,0.92)',
                          color: '#991b1b',
                          cursor: 'pointer',
                          fontWeight: 900,
                          lineHeight: '24px',
                          textAlign: 'center',
                        }}
                      >
                        x
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : null}

          {toast ? <Toast tone={toast.tone} text={toast.text} /> : null}
        </div>

        <div
          style={{
            borderRadius: 18,
            border: '1px solid rgba(226,232,240,0.95)',
            background: '#ffffff',
            boxShadow: '0 10px 26px rgba(15, 23, 42, 0.06)',
            padding: 16,
            display: 'grid',
            gap: 12,
          }}
        >
          <label style={labelStyle}>
            Price
            <input
              type="text"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="49.99"
              style={inputBaseStyle}
            />
          </label>

          <label style={labelStyle}>
            Quantity
            <input
              type="text"
              inputMode="numeric"
              value={quantity}
              onChange={(e) => setQuantity(normalizeQuantityInput(e.target.value))}
              placeholder="0"
              style={inputBaseStyle}
            />
          </label>

          <label style={labelStyle}>
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              placeholder="Short description for your buyers..."
              style={{ ...inputBaseStyle, resize: 'vertical', minHeight: 140 }}
            />
          </label>

          {isDirty ? (
            <div style={{ display: 'grid', gap: 10, marginTop: 6 }}>
              <PrimaryButton disabled={isSaving} onClick={() => void onSave()} title="Save changes">
                {isSaving ? 'Saving...' : 'Save'}
              </PrimaryButton>

              <SecondaryButton
                disabled={isSaving}
                onClick={() => void onCancel()}
                title="Discard changes"
              >
                Cancel
              </SecondaryButton>
            </div>
          ) : (
            <p style={helperText}>Edit fields or upload an image to enable Save.</p>
          )}

          <div style={{ marginTop: 6 }}>
            <div style={{ height: 1, background: 'rgba(226,232,240,0.95)', margin: '12px 0' }} />
            <div style={{ display: 'grid', gap: 8 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                }}
              >
                Danger zone
              </div>
              <p style={helperText}>
                Archive will hide the product and deactivate checkout links. Existing orders remain.
              </p>

              <DangerButton
                disabled={deleteProductDisabled}
                onClick={() => setDeleteProductModalOpen(true)}
                title={isDirty ? 'Save or cancel changes before archiving' : 'Archive this product'}
              >
                Archive product
              </DangerButton>

              {isDirty ? (
                <div style={{ color: '#991b1b', fontSize: 12, fontWeight: 800, lineHeight: 1.4 }}>
                  You have unsaved changes. Save or cancel before archiving.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
