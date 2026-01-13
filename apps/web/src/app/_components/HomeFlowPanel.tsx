'use client';

import { useEffect, useState } from 'react';

type StepId = 1 | 2 | 3 | 4;

const DEMO_STORE_NAME = 'Evening light market';
const DEMO_PRODUCT_NAME = 'Soft wool scarf';
const DEMO_PRODUCT_PRICE = 59.9;

type PurchasePhase = 'idle' | 'buying' | 'paid';
type LinkPhase = 'idle' | 'generating' | 'ready';
type ProductPhase = 'idle' | 'pressing' | 'attached';

export function HomeFlowPanel() {
  const [step, setStep] = useState<StepId>(1);

  const [demoStoreName, setDemoStoreName] = useState('');
  const [storeSaved, setStoreSaved] = useState(false);

  const [demoProductName, setDemoProductName] = useState('');
  const [productAttached, setProductAttached] = useState(false);
  const [productPhase, setProductPhase] = useState<ProductPhase>('idle');

  const [linkPhase, setLinkPhase] = useState<LinkPhase>('idle');
  const [linkPulse, setLinkPulse] = useState(false);

  const [isLeaving, setIsLeaving] = useState(false);
  const [orderPulse, setOrderPulse] = useState(false);
  const [purchasePhase, setPurchasePhase] = useState<PurchasePhase>('idle');

  const progress = (step / 4) * 100;

  useEffect(() => {
    if (step !== 1) {
      setDemoStoreName('');
      setStoreSaved(false);
      return;
    }

    let cancelled = false;
    const chars = DEMO_STORE_NAME.split('');
    let index = 0;
    setDemoStoreName('');
    setStoreSaved(false);

    const tick = () => {
      if (cancelled) return;
      if (index <= chars.length) {
        setDemoStoreName(chars.slice(0, index).join(''));
        index += 1;
        setTimeout(tick, index === 1 ? 260 : 60);
      } else {
        setTimeout(() => {
          if (!cancelled) setStoreSaved(true);
        }, 260);
      }
    };

    setTimeout(tick, 260);

    return () => {
      cancelled = true;
    };
  }, [step]);

  useEffect(() => {
    if (step !== 2) {
      setDemoProductName('');
      setProductAttached(false);
      setProductPhase('idle');
      return;
    }

    let cancelled = false;
    const chars = DEMO_PRODUCT_NAME.split('');
    let index = 0;
    setDemoProductName('');
    setProductAttached(false);
    setProductPhase('idle');

    const tick = () => {
      if (cancelled) return;
      if (index <= chars.length) {
        setDemoProductName(chars.slice(0, index).join(''));
        index += 1;
        setTimeout(tick, index === 1 ? 240 : 55);
      } else {
        setTimeout(() => {
          if (!cancelled) {
            setProductAttached(true);
            setProductPhase('attached');
          }
        }, 220);
      }
    };

    setTimeout(() => {
      if (cancelled) return;
      setProductPhase('pressing');
      tick();
    }, 220);

    return () => {
      cancelled = true;
    };
  }, [step]);

  useEffect(() => {
    if (step !== 3) {
      setLinkPhase('idle');
      setLinkPulse(false);
      return;
    }

    setLinkPhase('idle');
    setLinkPulse(false);

    const t1 = setTimeout(() => {
      setLinkPhase('generating');
    }, 400);

    const t2 = setTimeout(() => {
      setLinkPhase('ready');
      setLinkPulse(true);
    }, 900);

    const t3 = setTimeout(() => {
      setLinkPulse(false);
    }, 1500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [step]);

  useEffect(() => {
    if (step !== 4) {
      setPurchasePhase('idle');
      setOrderPulse(false);
      return;
    }

    setPurchasePhase('idle');
    setOrderPulse(false);

    const t1 = setTimeout(() => {
      setPurchasePhase('buying');
    }, 450);

    const t2 = setTimeout(() => {
      setPurchasePhase('paid');
      setOrderPulse(true);
    }, 950);

    const t3 = setTimeout(() => {
      setOrderPulse(false);
    }, 1500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [step]);

  const goTo = (next: StepId) => {
    if (next === step) return;
    setIsLeaving(true);
    setTimeout(() => {
      setStep(next);
      setIsLeaving(false);
    }, 160);
  };

  const onNext = () => {
    const next = step === 4 ? 1 : ((step + 1) as StepId);
    goTo(next);
  };

  const onPrev = () => {
    const prev = step === 1 ? 4 : ((step - 1) as StepId);
    goTo(prev);
  };

  const cardAnimStyle = {
    opacity: isLeaving ? 0 : 1,
    transform: isLeaving ? 'scale(0.96) translateY(4px)' : 'scale(1) translateY(0)',
    transition: 'opacity 160ms ease-out, transform 160ms ease-out',
    pointerEvents: isLeaving ? 'none' : 'auto',
  } as const;

  return (
    <section
      aria-label="Demo of how Creator checkout works"
      style={{
        marginTop: 10,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 1180,
          borderRadius: 40,
          padding: 30,
          border: '1px solid rgba(191,219,254,0.9)',
          background: 'radial-gradient(circle at top left, #e0f2fe, #f5f3ff 45%, #f9fafb 100%)',
          boxShadow: '0 30px 80px rgba(15,23,42,0.18), 0 0 0 1px rgba(148,163,184,0.12)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gap: 10,
            textAlign: 'center',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 13,
              color: '#6b7280',
            }}
          >
            Under 5 minutes from idea to first link
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: 26,
              letterSpacing: -0.02,
            }}
          >
            Four tiny steps, one neat checkout
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: '#6b7280',
            }}
          >
            Tap through. Watch a store name appear, a product land, a link form, and a paid order
            show up.
          </p>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 10,
              marginTop: 8,
            }}
          >
            <div
              style={{
                width: 190,
                height: 5,
                borderRadius: 999,
                background: '#e5e7eb',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  borderRadius: 999,
                  background: 'linear-gradient(90deg, #22c55e, #0ea5e9, #6366f1)',
                  transition: 'width 200ms ease-out',
                }}
              />
            </div>
            <div
              style={{
                fontSize: 11,
                color: '#6b7280',
              }}
            >
              Step {step} of 4
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 10,
            borderRadius: 30,
            border: '1px solid rgba(209,213,219,0.95)',
            background: '#fefefe',
            padding: 28,
            display: 'grid',
            gap: 16,
            ...cardAnimStyle,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 16,
              }}
            >
              <span
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 999,
                  border: '1px solid #d4d4d8',
                  background: '#fafaf9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 15,
                  fontWeight: 600,
                  color: '#020617',
                }}
              >
                {step}
              </span>
              <span
                style={{
                  fontWeight: 600,
                  color: '#020617',
                }}
              >
                {step === 1 && 'Name your space'}
                {step === 2 && 'Drop in a product'}
                {step === 3 && 'Create a checkout link'}
                {step === 4 && 'Share a link, see an order'}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                color: '#6b7280',
              }}
            >
              <button
                type="button"
                onClick={onPrev}
                aria-label="Previous step"
                style={{
                  borderRadius: 999,
                  border: '1px solid #e5e7eb',
                  background: '#f9fafb',
                  padding: '7px 13px',
                  cursor: 'pointer',
                  fontSize: 11,
                  color: '#4b5563',
                }}
              >
                ← Prev
              </button>
              <button
                type="button"
                onClick={onNext}
                aria-label="Next step"
                style={{
                  borderRadius: 999,
                  border: '1px solid #020617',
                  background: 'linear-gradient(135deg, #020617 0, #0f172a 45%, #020617 100%)',
                  padding: '7px 16px',
                  cursor: 'pointer',
                  fontSize: 11,
                  color: '#ecfeff',
                  fontWeight: 500,
                }}
              >
                Next step →
              </button>
            </div>
          </div>

          {step === 1 && (
            <div
              style={{
                marginTop: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 18,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: '#4b5563',
                }}
              >
                A name is enough to start a tiny store.
              </p>

              <div
                style={{
                  borderRadius: 22,
                  border: '1px solid #e5e7eb',
                  background: '#f9fafb',
                  padding: 20,
                  maxWidth: 820,
                  width: '100%',
                  display: 'grid',
                  gap: 10,
                  fontSize: 13,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      color: '#6b7280',
                    }}
                  >
                    Store name
                  </div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 11,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        background: storeSaved
                          ? 'radial-gradient(circle at 30% 30%, #22c55e 0, #16a34a 60%, #166534 100%)'
                          : '#e5e7eb',
                        transition: 'background 180ms ease-out',
                      }}
                    />
                    <span
                      style={{
                        color: storeSaved ? '#16a34a' : '#9ca3af',
                      }}
                    >
                      {storeSaved ? 'Saved' : 'Saving...'}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    borderRadius: 999,
                    border: '1px solid #d1d5db',
                    background: '#ffffff',
                    padding: '12px 20px',
                    display: 'flex',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <span
                    style={{
                      flex: 1,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      color: demoStoreName ? '#020617' : '#9ca3af',
                    }}
                  >
                    {demoStoreName || 'Evening light market'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div
              style={{
                marginTop: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 18,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: '#4b5563',
                }}
              >
                One product, clear price, made for this tiny shop.
              </p>

              <div
                style={{
                  borderRadius: 22,
                  border: '1px solid #e5e7eb',
                  background: 'linear-gradient(135deg, #f0f9ff 0, #ecfeff 40%, #faf5ff 100%)',
                  padding: 20,
                  maxWidth: 820,
                  width: '100%',
                  display: 'grid',
                  gap: 10,
                  fontSize: 13,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      color: '#6b7280',
                    }}
                  >
                    Evening light market · Products
                  </span>
                  <button
                    type="button"
                    style={{
                      borderRadius: 999,
                      border:
                        productPhase === 'attached' ? '1px solid #16a34a' : '1px solid #0f172a',
                      padding: '7px 16px',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'default',
                      color: '#f9fafb',
                      background:
                        productPhase === 'attached'
                          ? 'linear-gradient(135deg, #16a34a, #22c55e)'
                          : 'linear-gradient(135deg, #0f172a, #1f2937)',
                      boxShadow:
                        productPhase === 'pressing'
                          ? '0 0 0 3px rgba(34,197,94,0.25)'
                          : '0 10px 24px rgba(15,23,42,0.35)',
                      transform:
                        productPhase === 'pressing' ? 'scale(0.97) translateY(1px)' : 'scale(1)',
                      transition:
                        'box-shadow 220ms ease-out, transform 220ms ease-out, background 220ms ease-out, border-color 220ms ease-out',
                    }}
                  >
                    {productPhase === 'attached' ? 'Product added' : 'Add product'}
                  </button>
                </div>

                <div
                  style={{
                    borderRadius: 18,
                    border: '1px solid rgba(148,163,184,0.5)',
                    background: 'rgba(255,255,255,0.88)',
                    padding: 14,
                    display: 'grid',
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      gap: 12,
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '70%',
                        color: demoProductName ? '#020617' : '#9ca3af',
                      }}
                    >
                      {demoProductName || 'Your product name'}
                    </span>
                    <span
                      style={{
                        fontWeight: 600,
                      }}
                    >
                      ${DEMO_PRODUCT_PRICE.toFixed(2)}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      color: '#6b7280',
                    }}
                  >
                    Soft scarf for cold evening walks. In stock and ready to sell from Evening light
                    market.
                  </span>
                  <div
                    style={{
                      marginTop: 4,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 11,
                      padding: '4px 9px',
                      borderRadius: 999,
                      background: productAttached ? '#ecfdf3' : '#f3f4f6',
                      border: productAttached ? '1px solid #86efac' : '1px solid #e5e7eb',
                      color: productAttached ? '#166534' : '#6b7280',
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: 999,
                        background: productAttached
                          ? 'radial-gradient(circle at 30% 30%, #22c55e 0, #16a34a 60%, #166534 100%)'
                          : '#d1d5db',
                      }}
                    />
                    <span>{productAttached ? 'Attached to store' : 'Attaching to store...'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div
              style={{
                marginTop: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 18,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: '#4b5563',
                }}
              >
                One tap turns that product into a link you can drop anywhere.
              </p>

              <div
                style={{
                  borderRadius: 22,
                  border: '1px solid #e5e7eb',
                  background: 'linear-gradient(135deg, #eff6ff 0, #e0f2fe 35%, #f5f3ff 100%)',
                  padding: 20,
                  maxWidth: 820,
                  width: '100%',
                  display: 'grid',
                  gap: 10,
                  fontSize: 13,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gap: 2,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        color: '#6b7280',
                      }}
                    >
                      Evening light market
                    </span>
                    <span
                      style={{
                        fontWeight: 500,
                      }}
                    >
                      {DEMO_PRODUCT_NAME}
                    </span>
                  </div>
                  <span
                    style={{
                      fontWeight: 600,
                    }}
                  >
                    ${DEMO_PRODUCT_PRICE.toFixed(2)}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginTop: 8,
                  }}
                >
                  <button
                    type="button"
                    style={{
                      borderRadius: 999,
                      border: linkPhase === 'ready' ? '1px solid #0ea5e9' : '1px solid #0f172a',
                      padding: '8px 18px',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'default',
                      color: '#f9fafb',
                      background:
                        linkPhase === 'ready'
                          ? 'linear-gradient(135deg, #0ea5e9, #38bdf8)'
                          : 'linear-gradient(135deg, #0f172a, #1f2937)',
                      boxShadow:
                        linkPhase === 'ready'
                          ? '0 10px 26px rgba(56,189,248,0.4)'
                          : '0 10px 24px rgba(15,23,42,0.45)',
                      transform:
                        linkPhase === 'generating' ? 'scale(0.97) translateY(1px)' : 'scale(1)',
                      transition:
                        'box-shadow 220ms ease-out, transform 220ms ease-out, background 220ms ease-out, border-color 220ms ease-out',
                    }}
                  >
                    {linkPhase === 'idle' && 'Create checkout link'}
                    {linkPhase === 'generating' && 'Generating link...'}
                    {linkPhase === 'ready' && 'Link copied'}
                  </button>
                </div>

                <div
                  style={{
                    marginTop: 8,
                    borderRadius: 999,
                    border: linkPhase === 'ready' ? '1px solid #0ea5e9' : '1px solid #d1d5db',
                    background: '#ffffff',
                    padding: '9px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    boxShadow: linkPulse
                      ? '0 12px 30px rgba(56,189,248,0.35)'
                      : '0 6px 14px rgba(15,23,42,0.08)',
                    transform: linkPulse ? 'scale(1.02)' : 'scale(1)',
                    transition:
                      'box-shadow 220ms ease-out, transform 220ms ease-out, border-color 220ms ease-out',
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      color: '#111827',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {linkPhase === 'ready'
                      ? 'creatorcheckout.com/evening-light-market/soft-wool-scarf'
                      : 'Your checkout link will show up here'}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      borderRadius: 999,
                      border: linkPhase === 'ready' ? '1px solid #0ea5e9' : '1px solid #d1d5db',
                      padding: '5px 10px',
                      background: linkPhase === 'ready' ? '#eff6ff' : '#f9fafb',
                      color: linkPhase === 'ready' ? '#075985' : '#4b5563',
                      fontWeight: 500,
                    }}
                  >
                    {linkPhase === 'ready' ? 'Copied' : 'Copy'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div
              style={{
                marginTop: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 20,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: '#4b5563',
                }}
              >
                The buyer sees a tiny checkout. You see a tiny paid line item.
              </p>

              {purchasePhase !== 'paid' && (
                <div
                  style={{
                    borderRadius: 22,
                    border: '1px solid #e5e7eb',
                    background: 'linear-gradient(135deg, #f9fafb 0, #eff6ff 40%, #ecfdf3 100%)',
                    padding: 20,
                    maxWidth: 820,
                    width: '100%',
                    display: 'grid',
                    gap: 10,
                    fontSize: 13,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        display: 'grid',
                        gap: 2,
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 500,
                        }}
                      >
                        {DEMO_PRODUCT_NAME}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: '#6b7280',
                        }}
                      >
                        Soft scarf for cold evening walks.
                      </span>
                    </div>
                    <span
                      style={{
                        fontWeight: 600,
                      }}
                    >
                      ${DEMO_PRODUCT_PRICE.toFixed(2)}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12,
                      marginTop: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        color: '#6b7280',
                      }}
                    >
                      Paying as guest · No account needed
                    </span>
                    <button
                      type="button"
                      style={{
                        borderRadius: 999,
                        border: '1px solid #15803d',
                        padding: '8px 18px',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'default',
                        color: '#ecfdf3',
                        background:
                          purchasePhase === 'buying'
                            ? 'linear-gradient(135deg, #16a34a, #22c55e)'
                            : 'linear-gradient(135deg, #16a34a, #22c55e, #15803d)',
                        boxShadow:
                          purchasePhase === 'buying'
                            ? '0 0 0 3px rgba(34,197,94,0.25)'
                            : '0 10px 24px rgba(22,163,74,0.45)',
                        transform:
                          purchasePhase === 'buying' ? 'scale(0.97) translateY(1px)' : 'scale(1)',
                        transition:
                          'box-shadow 220ms ease-out, transform 220ms ease-out, background 220ms ease-out',
                      }}
                    >
                      {purchasePhase === 'buying'
                        ? 'Processing...'
                        : `Pay $${DEMO_PRODUCT_PRICE.toFixed(2)}`}
                    </button>
                  </div>
                </div>
              )}

              {purchasePhase === 'paid' && (
                <div
                  style={{
                    maxWidth: 820,
                    width: '100%',
                    borderRadius: 26,
                    padding: 26,
                    border: '1px solid #86efac',
                    background:
                      'radial-gradient(circle at top left, #bbf7d0, #ecfdf3 55%, #f0fdf4 100%)',
                    boxShadow: orderPulse
                      ? '0 26px 60px rgba(22,163,74,0.45)'
                      : '0 18px 40px rgba(22,163,74,0.32)',
                    transform: orderPulse ? 'scale(1.02)' : 'scale(1)',
                    transition: 'box-shadow 260ms ease-out, transform 260ms ease-out',
                    display: 'grid',
                    gap: 10,
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: 10,
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 999,
                        background:
                          'radial-gradient(circle at 30% 30%, #22c55e 0, #16a34a 50%, #166534 100%)',
                      }}
                    />
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#166534',
                      }}
                    >
                      Payment successful
                    </span>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      color: '#166534',
                    }}
                  >
                    Soft wool scarf has been paid for and added to your orders dashboard.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
