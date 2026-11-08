import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  variant?: 'default' | 'ghost' | 'bordered';
}

export const Card: React.FC<CardProps> = ({
  className,
  hoverEffect = false,
  variant = 'default',
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-white border border-[var(--border-subtle)] shadow-[var(--shadow-xs)]',
    ghost: 'bg-[var(--color-raised)] border border-[var(--border-subtle)]',
    bordered: 'bg-white border-2 border-[var(--border-default)]',
  };

  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)] overflow-hidden transition-all duration-200',
        variants[variant],
        hoverEffect && 'hover:shadow-[var(--shadow-sm)] hover:border-[var(--border-strong)] hover:-translate-y-px',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div
    className={cn('px-6 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between', className)}
    {...props}
  >
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  children,
  ...props
}) => (
  <h3
    className={cn('text-sm font-semibold text-[var(--color-ink-900)] tracking-tight', className)}
    {...props}
  >
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  children,
  ...props
}) => (
  <p className={cn('text-xs text-[var(--color-ink-500)] mt-0.5 leading-relaxed', className)} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={cn('p-6', className)} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div
    className={cn('px-6 py-3.5 bg-[var(--color-raised)] border-t border-[var(--border-subtle)] flex items-center', className)}
    {...props}
  >
    {children}
  </div>
);
