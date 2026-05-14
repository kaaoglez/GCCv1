// ═══════════════════════════════════════════════════════════════
// GRAN CANARIA CONECTA - CategoryBadge Component
// Small badge with category icon + translated name
// ═══════════════════════════════════════════════════════════════

'use client';

import { Badge } from '@/components/ui/badge';
import { getIcon } from '@/lib/icons';
import { useI18n } from '@/hooks/use-i18n';
import { cn } from '@/lib/utils';
import type { CategoryDTO } from '@/lib/types';

interface CategoryBadgeProps {
  category: CategoryDTO;
  size?: 'sm' | 'md';
  className?: string;
}

export function CategoryBadge({ category, size = 'sm', className }: CategoryBadgeProps) {
  const { locale } = useI18n();
  const name = locale === 'es' ? category.nameEs : category.nameEn;
  const iconSize = size === 'sm' ? 12 : 14;

  return (
    <Badge
      variant="secondary"
      className={cn(
        'gap-1 font-medium',
        size === 'sm' ? 'text-xs px-1.5 py-0' : 'text-sm px-2 py-0.5',
        className
      )}
      style={{
        backgroundColor: `${category.color}18`,
        color: category.color,
        borderColor: `${category.color}30`,
      }}
    >
      {getIcon(category.icon, undefined, iconSize)}
      {name}
    </Badge>
  );
}
