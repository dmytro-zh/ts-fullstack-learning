'use client';

import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonShape = 'pill' | 'rounded';

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  className?: string | undefined;
};

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: styles.variantPrimary ?? '',
  secondary: styles.variantSecondary ?? '',
  ghost: styles.variantGhost ?? '',
  danger: styles.variantDanger ?? '',
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: styles.sizeSm ?? '',
  md: styles.sizeMd ?? '',
  lg: styles.sizeLg ?? '',
};

const SHAPE_CLASS: Record<ButtonShape, string> = {
  pill: styles.shapePill ?? '',
  rounded: styles.shapeRounded ?? '',
};

export function Button({
  variant = 'primary',
  size = 'md',
  shape = 'pill',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  const classes = [
    styles.button,
    VARIANT_CLASS[variant],
    SIZE_CLASS[size],
    SHAPE_CLASS[shape],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <button type={type} className={classes} {...props} />;
}
