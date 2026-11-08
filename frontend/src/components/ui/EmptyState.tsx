import React from 'react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-10 sm:p-14 text-center rounded-[var(--radius-xl)] border border-dashed border-[var(--border-default)] bg-[var(--color-raised)]/50',
        className
      )}
    >
      <div className="w-11 h-11 rounded-[var(--radius-lg)] bg-[var(--color-raised)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--color-ink-300)] mb-4">
        {icon}
      </div>
      <h4 className="text-sm font-semibold text-[var(--color-ink-900)] mb-1.5">{title}</h4>
      <p className="text-xs text-[var(--color-ink-500)] max-w-xs mb-5 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary" size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
