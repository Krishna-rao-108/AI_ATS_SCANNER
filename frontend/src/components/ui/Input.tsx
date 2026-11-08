import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-[var(--color-ink-700)] tracking-wide"
          >
            {label}
            {props.required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-[var(--color-ink-300)] pointer-events-none flex items-center z-10">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full bg-white border border-[var(--border-default)] rounded-[var(--radius-md)] text-sm text-[var(--color-ink-900)] placeholder:text-[var(--color-ink-300)] px-3.5 py-2.5 transition-all duration-150',
              'focus:outline-none focus:border-violet-500 focus:ring-3 focus:ring-violet-400/15',
              'disabled:bg-[var(--color-raised)] disabled:text-[var(--color-ink-500)] disabled:border-[var(--border-subtle)] disabled:cursor-not-allowed',
              leftIcon && 'pl-9.5',
              rightIcon && 'pr-9.5',
              error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-400/15',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 text-[var(--color-ink-300)] flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-rose-600 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[var(--color-ink-500)]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
