'use client';

import type {
  ForwardedRef,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { forwardRef } from 'react';
import styles from './Input.module.css';

type FieldSize = 'sm' | 'md' | 'lg';

const SIZE_CLASS: Record<FieldSize, string> = {
  sm: styles.sizeSm ?? '',
  md: styles.sizeMd ?? '',
  lg: styles.sizeLg ?? '',
};

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'size'> & {
  size?: FieldSize;
  className?: string | undefined;
};

export const Input = forwardRef(function Input(
  { size = 'md', className, ...props }: InputProps,
  ref: ForwardedRef<HTMLInputElement>,
) {
  return (
    <input
      ref={ref}
      className={joinClasses(styles.field, SIZE_CLASS[size], className)}
      {...props}
    />
  );
});

export type TextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'className' | 'size'
> & {
  size?: FieldSize;
  className?: string | undefined;
};

export const Textarea = forwardRef(function Textarea(
  { size = 'md', className, ...props }: TextareaProps,
  ref: ForwardedRef<HTMLTextAreaElement>,
) {
  return (
    <textarea
      ref={ref}
      className={joinClasses(styles.field, styles.textarea, SIZE_CLASS[size], className)}
      {...props}
    />
  );
});

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className' | 'size'> & {
  size?: FieldSize;
  className?: string | undefined;
};

export const Select = forwardRef(function Select(
  { size = 'md', className, ...props }: SelectProps,
  ref: ForwardedRef<HTMLSelectElement>,
) {
  return (
    <select
      ref={ref}
      className={joinClasses(styles.field, styles.select, SIZE_CLASS[size], className)}
      {...props}
    />
  );
});
