import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline' | 'violet';
  size?: 'sm' | 'md';
  dot?: boolean;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  dot = false,
  icon,
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-[var(--color-raised)] text-[var(--color-ink-700)] border-[var(--border-default)]',
    violet:  'bg-[var(--color-violet-50)] text-[var(--color-violet-700)] border-violet-200',
    success: 'bg-[var(--color-emerald-50)] text-emerald-800 border-emerald-200',
    warning: 'bg-[var(--color-amber-50)] text-amber-800 border-amber-200',
    danger:  'bg-[var(--color-rose-50)] text-rose-700 border-rose-200',
    info:    'bg-[var(--color-sky-50)] text-sky-700 border-sky-200',
    outline: 'bg-white text-[var(--color-ink-700)] border-[var(--border-strong)]',
  };

  const sizes = {
    sm: 'text-[11px] px-1.5 py-0.5 gap-1 font-medium rounded-md',
    md: 'text-xs px-2.5 py-0.5 gap-1.5 font-medium rounded-[6px]',
  };

  const dotColors: Record<string, string> = {
    default: 'bg-[var(--color-ink-300)]',
    violet:  'bg-violet-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger:  'bg-rose-500',
    info:    'bg-sky-500',
    outline: 'bg-[var(--color-ink-300)]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center border select-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])} />
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
