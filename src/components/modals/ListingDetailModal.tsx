// ═══════════════════════════════════════════════════════════════
// GRAN CANARIA CONECTA - ListingDetailModal Component
// COMPACT PREVIEW — Quick look with horizontal image scroll
// "Ver anuncio completo" opens ListingFullView inline
// ═══════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect } from 'react';
import {
  MapPin,
  Eye,
  Share2,
  Clock,
  Maximize2,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/hooks/use-i18n';
import { useModalStore } from '@/lib/modal-store';
import { useSession } from 'next-auth/react';
import { TierBadge } from '@/components/shared/TierBadge';
import { CategoryBadge } from '@/components/shared/CategoryBadge';
import { formatPrice, getRelativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export function ListingDetailModal() {
  const { locale, tp } = useI18n();
  const {
    selectedListing,
    isListingDetailOpen,
    closeListingDetail,
    openListingFullView,
    openMessage,
    openAuth,
  } = useModalStore();
  const { data: session } = useSession();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Darker backdrop
  useEffect(() => {
    if (!isListingDetailOpen) return;
    const interval = setInterval(() => {
      const overlay = document.querySelector(
        'div[data-slot="dialog-overlay"]'
      ) as HTMLElement | null;
      if (overlay) {
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        overlay.style.backdropFilter = 'blur(4px)';
        (overlay.style as unknown as Record<string, string>)['webkitBackdropFilter'] = 'blur(4px)';
        clearInterval(interval);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [isListingDetailOpen]);

  if (!selectedListing) return null;

  const listing = selectedListing;
  const images = listing.images || [];
  const price = listing.metadata?.price as number | undefined;
  const isFree = !price || price === 0;

  const handleClose = () => {
    setCurrentImageIndex(0);
    closeListingDetail();
  };

  const handleViewFull = () => {
    setCurrentImageIndex(0);
    openListingFullView();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: listing.title, url: window.location.href });
      } catch { /* cancelled */ }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <Dialog open={isListingDetailOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0 [&>button]:hidden">
        <DialogTitle className="sr-only">{listing.title}</DialogTitle>

        {/* Image Carousel — horizontal scroll with thumbnails */}
        <div className="relative">
          {/* Main image */}
          <div className="relative aspect-[4/3] w-full bg-muted overflow-hidden">
            {images.length > 0 ? (
              <>
                <Image
                  src={images[currentImageIndex]}
                  alt={listing.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                />
                {/* Image nav arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex((p) => (p > 0 ? p - 1 : images.length - 1))}
                      className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center size-8 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex((p) => (p < images.length - 1 ? p + 1 : 0))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center size-8 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </>
                )}
                {/* Image counter */}
                <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                  <ImageIcon className="size-3" />
                  {currentImageIndex + 1}/{images.length}
                </div>
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ImageIcon className="size-12 text-muted-foreground/20" />
              </div>
            )}
            {/* Badges overlay */}
            <div className="absolute top-2 left-2 flex items-center gap-2">
              <TierBadge tier={listing.tier} />
            </div>
          </div>

          {/* Thumbnails strip */}
          {images.length > 1 && (
            <div className="flex gap-1.5 px-3 py-2 bg-muted/30 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImageIndex(i)}
                  className={cn(
                    'relative flex-shrink-0 w-14 h-14 rounded-md overflow-hidden border-2 transition-all',
                    i === currentImageIndex
                      ? 'border-primary opacity-100'
                      : 'border-transparent opacity-50 hover:opacity-80'
                  )}
                >
                  <Image src={img} alt="" fill sizes="56px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content — compact preview */}
        <div className="px-4 pb-4 space-y-3">
          {/* Category + Title */}
          <div className="space-y-1">
            <CategoryBadge category={listing.category} size="sm" />
            <h2 className="text-lg font-bold text-foreground leading-tight line-clamp-2">
              {listing.title}
            </h2>
          </div>

          {/* Price + Location + Views */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span
              className={cn(
                'rounded-lg px-2.5 py-1 text-sm font-bold',
                isFree
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-muted text-foreground'
              )}
            >
              {isFree
                ? (locale === 'es' ? 'Gratis' : 'Free')
                : formatPrice(price!, locale)}
            </span>
            {listing.municipality && (
              <span className="flex items-center gap-1 text-muted-foreground text-xs">
                <MapPin className="size-3.5" />
                {listing.municipality}
              </span>
            )}
            <span className="flex items-center gap-1 text-muted-foreground text-xs">
              <Eye className="size-3.5" />
              {listing.viewCount} {tp('listings', 'views')}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground text-xs">
              <Clock className="size-3.5" />
              {getRelativeTime(listing.createdAt, locale)}
            </span>
          </div>

          {/* Brief description */}
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {listing.description}
          </p>

          {/* Author */}
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center size-8 rounded-full bg-muted shrink-0">
              {listing.author.avatar ? (
                <img
                  src={listing.author.avatar}
                  alt={listing.author.name}
                  className="size-8 rounded-full object-cover"
                />
              ) : (
                <span className="text-xs font-bold text-muted-foreground">
                  {listing.author.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <span className="text-sm font-medium text-foreground truncate">
              {listing.author.name}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1">
            <Button
              className="flex-1 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm"
              onClick={() => {
                if (!session?.user?.id) {
                  openAuth();
                  return;
                }
                openMessage({
                  receiverId: listing.author.id,
                  receiverName: listing.author.name,
                  listingId: listing.id,
                  listingTitle: listing.title,
                  listingImage: listing.images?.[0],
                });
              }}
            >
              <MessageSquare className="size-4" />
              {tp('listings', 'contact')}
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2 text-sm"
              onClick={handleViewFull}
            >
              <Maximize2 className="size-4" />
              {tp('listings', 'viewFullListing')}
            </Button>
            <Button variant="outline" size="icon" className="shrink-0" onClick={handleShare}>
              <Share2 className="size-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
