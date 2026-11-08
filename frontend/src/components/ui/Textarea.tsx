import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showCharCount?: boolean;
  maxChars?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, showCharCount, maxChars, value, id, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
      <div className="w-full space-y-1.5 text-left">
        <div className="flex items-center justify-between">
          {label && (
            <label
              htmlFor={textareaId}
              className="block text-xs font-semibold text-[var(--color-ink-700)] tracking-wide"
            >
              {label}
              {props.required && <span className="text-rose-500 ml-1">*</span>}
            </label>
          )}
          {showCharCount && (
            <span
              className={cn(
                'text-xs tabular-nums',
                maxChars && currentLength > maxChars
                  ? 'text-rose-600 font-semibold'
                  : 'text-[var(--color-ink-300)]'
              )}
            >
              {currentLength}
              {maxChars ? ` / ${maxChars}` : ' chars'}
            </span>
          )}
        </div>
        <textarea
          id={textareaId}
          ref={ref}
          value={value}
          className={cn(
            'w-full bg-white border border-[var(--border-default)] rounded-[var(--radius-md)] text-sm text-[var(--color-ink-900)] placeholder:text-[var(--color-ink-300)] p-3.5 transition-all duration-150',
            'focus:outline-none focus:border-violet-500 focus:ring-3 focus:ring-violet-400/15',
            'disabled:bg-[var(--color-raised)] disabled:text-[var(--color-ink-500)] disabled:border-[var(--border-subtle)] disabled:cursor-not-allowed',
            'resize-y min-h-[120px] leading-relaxed',
            error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-400/15',
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-rose-600 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[var(--color-ink-500)] leading-relaxed">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
