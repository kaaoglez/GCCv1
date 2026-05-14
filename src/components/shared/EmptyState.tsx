// ═══════════════════════════════════════════════════════════════
// GRAN CANARIA CONECTA - EmptyState Component
// Reusable centered empty state with icon, title, description, action
// ═══════════════════════════════════════════════════════════════

'use client';

import { Button } from '@/components/ui/button';
import { getIcon } from '@/lib/icons';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon = 'Circle',
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 py-16 px-4 text-center',
        className
      )}
    >
      <div className="flex items-center justify-center size-16 rounded-full bg-muted text-muted-foreground">
        {getIcon(icon, 'size-8', 32)}
      </div>

      <div className="flex flex-col gap-1.5 max-w-md">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {action && (
        <Button variant="outline" onClick={action.onClick} className="mt-2">
          {action.label}
        </Button>
      )}
    </div>
  );
}
