import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const base =
      'inline-flex items-center justify-center font-medium tracking-tight select-none transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-[10px] active:scale-[0.98]';

    const variants = {
      primary:
        'bg-violet-600 text-white hover:bg-violet-700 active:bg-violet-800 shadow-[0_1px_3px_rgba(109,40,217,0.25)] hover:shadow-[0_2px_8px_rgba(109,40,217,0.30)]',
      secondary:
        'bg-[var(--color-raised)] text-[var(--color-ink-700)] hover:bg-[var(--color-ink-100)] border border-[var(--border-default)]',
      outline:
        'bg-white text-[var(--color-ink-700)] hover:bg-[var(--color-raised)] border border-[var(--border-default)] hover:border-[var(--border-strong)]',
      ghost:
        'bg-transparent text-[var(--color-ink-500)] hover:bg-[var(--color-overlay)] hover:text-[var(--color-ink-900)]',
      danger:
        'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-[0_1px_3px_rgba(225,29,72,0.25)]',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
      md: 'text-sm px-4 py-2 gap-2 h-9',
      lg: 'text-sm px-5 py-2.5 gap-2 h-10',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
