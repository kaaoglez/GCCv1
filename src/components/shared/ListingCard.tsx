// ═══════════════════════════════════════════════════════════════
// GRAN CANARIA CONECTA - ListingCard Component
// Main reusable card for listing display
// ═══════════════════════════════════════════════════════════════

'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { TierBadge } from './TierBadge';
import { CategoryBadge } from './CategoryBadge';
import { getIcon } from '@/lib/icons';
import { useI18n } from '@/hooks/use-i18n';
import { useFavoriteToggle } from '@/hooks/use-favorite-toggle';
import { formatPrice, getRelativeTime, truncateText } from '@/lib/format';
import { cn } from '@/lib/utils';
// Using native <img> for maximum reliability across proxy setups
import { useModalStore } from '@/lib/modal-store';
import { useSession } from 'next-auth/react';
import { MapPin, ShieldCheck, ImageOff, Heart } from 'lucide-react';
import type { ListingDTO } from '@/lib/types';

interface ListingCardProps {
  listing: ListingDTO;
  className?: string;
  onClick?: (listing: ListingDTO) => void;
}

export function ListingCard({ listing, className, onClick }: ListingCardProps) {
  const openListingDetail = useModalStore((s) => s.openListingDetail);
  const { data: session } = useSession();
  const { isFavorite, toggle } = useFavoriteToggle(listing.id);
  const { locale } = useI18n();

  const handleClick = () => {
    if (onClick) {
      onClick(listing);
    } else {
      openListingDetail(listing);
    }
  };
  const image = listing.images?.[0];
  const price = listing.metadata?.price as number | undefined;
  const isFree = !price || price === 0;
  const isVipOrBusiness = listing.tier === 'VIP' || listing.tier === 'BUSINESS';
  const isHighlighted = listing.tier === 'HIGHLIGHTED';

  const priceLabel = isFree
    ? locale === 'es'
      ? 'Gratis'
      : 'Free'
    : typeof price === 'number'
      ? formatPrice(price, locale)
      : locale === 'es'
        ? 'Negociar'
        : 'Negotiable';

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card
        className={cn(
          'group relative overflow-hidden cursor-pointer gap-0 py-0 transition-shadow duration-300',
          'hover:shadow-lg',
          isVipOrBusiness && 'border-l-4',
          isHighlighted && 'bg-amber-50/50 dark:bg-amber-950/20',
          className
        )}
        onClick={handleClick}
        style={
          isVipOrBusiness
            ? {
                borderLeftColor:
                  listing.tier === 'VIP'
                    ? '#EA580C'
                    : '#7C3AED',
              }
            : undefined
        }
      >
        {/* Image */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {image ? (
            <img
              src={image}
              alt={listing.title}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <ImageOff className="size-10 opacity-40" />
            </div>
          )}

          {/* Tier badge overlay */}
          <div className="absolute top-2 left-2">
            <TierBadge tier={listing.tier} />
          </div>

          {/* SOLD overlay */}
          {listing.status === 'SOLD' && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
              <span className="bg-red-600 text-white text-xs sm:text-sm font-bold px-3 py-1.5 rounded-md shadow-lg uppercase tracking-wider">
                {locale === 'es' ? 'Vendido' : 'Sold'}
              </span>
            </div>
          )}

          {/* Favorite heart button */}
          {session?.user && (
            <button
              onClick={(e) => toggle(e)}
              className={cn(
                'absolute top-2 right-2 z-10 flex items-center justify-center size-8 rounded-full transition-all',
                isFavorite
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-background/80 text-muted-foreground hover:text-red-500 hover:bg-background'
              )}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={cn('size-4', isFavorite && 'fill-current')} />
            </button>
          )}

          {/* Price overlay */}
          <div className="absolute bottom-2 right-2">
            <span
              className={cn(
                'rounded-md px-2 py-1 text-sm font-bold',
                isFree
                  ? 'bg-emerald-600 text-white'
                  : 'bg-background/90 text-foreground backdrop-blur-sm'
              )}
            >
              {priceLabel}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-2 p-3">
          {/* Category badge */}
          <div className="flex items-center gap-2">
            <CategoryBadge category={listing.category} size="sm" />
          </div>

          {/* Title */}
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 text-foreground">
            {truncateText(listing.title, 60)}
          </h3>

          {/* Municipality */}
          {listing.municipality && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3" />
              <span className="truncate">{listing.municipality}</span>
            </div>
          )}

          {/* Author + Time */}
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
              <span className="truncate font-medium">{listing.author.name}</span>
              {listing.author.isVerified && (
                <ShieldCheck className="size-3.5 text-emerald-600 shrink-0" />
              )}
            </div>
            <time className="text-xs text-muted-foreground whitespace-nowrap">
              {getRelativeTime(listing.createdAt, locale)}
            </time>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
