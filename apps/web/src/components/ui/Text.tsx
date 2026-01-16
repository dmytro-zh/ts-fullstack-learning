'use client';

import type { ElementType, HTMLAttributes } from 'react';
import styles from './Text.module.css';

type TextVariant = 'body' | 'muted' | 'title' | 'subtitle' | 'label' | 'caption';

type TextProps<T extends ElementType> = {
  as?: T;
  variant?: TextVariant;
  className?: string | undefined;
} & Omit<HTMLAttributes<HTMLElement>, 'as' | 'className'>;

const VARIANT_CLASS: Record<TextVariant, string> = {
  body: styles.body ?? '',
  muted: styles.muted ?? '',
  title: styles.title ?? '',
  subtitle: styles.subtitle ?? '',
  label: styles.label ?? '',
  caption: styles.caption ?? '',
};

export function Text<T extends ElementType = 'span'>({
  as,
  variant = 'body',
  className,
  ...props
}: TextProps<T>) {
  const Tag = (as ?? 'span') as ElementType;
  const classes = [styles.text, VARIANT_CLASS[variant], className].filter(Boolean).join(' ');

  return <Tag className={classes} {...props} />;
}
