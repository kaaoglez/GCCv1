// ═══════════════════════════════════════════════════════════════
// GRAN CANARIA CONECTA - TierBadge Component
// Renders the listing tier badge (FREE, HIGHLIGHTED, VIP, BUSINESS)
// ═══════════════════════════════════════════════════════════════

'use client';

import { Badge } from '@/components/ui/badge';
import { PRICING_PLANS } from '@/lib/types';
import { Sparkles, Star } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';
import type { ListingTier } from '@/lib/types';

interface TierBadgeProps {
  tier: ListingTier;
  className?: string;
}

const tierIcon: Record<ListingTier, React.ReactNode> = {
  FREE: null,
  HIGHLIGHTED: null,
  VIP: <Sparkles className="size-3" />,
  BUSINESS: <Star className="size-3" />,
};

export function TierBadge({ tier, className }: TierBadgeProps) {
  const { locale } = useI18n();
  const plan = PRICING_PLANS.find((p) => p.id === tier);

  if (!plan) return null;

  const label = locale === 'es' ? plan.badge : plan.badge;
  // For FREE/HIGHLIGHTED we use translated names
  const displayLabel =
    tier === 'FREE'
      ? locale === 'es'
        ? 'GRATIS'
        : 'FREE'
      : tier === 'HIGHLIGHTED'
        ? locale === 'es'
          ? 'DESTACADO'
          : 'HIGHLIGHTED'
        : tier === 'BUSINESS'
          ? locale === 'es'
            ? 'NEGOCIO'
            : 'BUSINESS'
          : label;

  return (
    <Badge
      className={className}
      style={{
        backgroundColor: plan.color,
        color: '#FFFFFF',
        borderColor: plan.color,
      }}
    >
      {tierIcon[tier]}
      {displayLabel}
    </Badge>
  );
}
