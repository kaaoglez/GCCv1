// ═══════════════════════════════════════════════════════════════
// GRAN CANARIA CONECTA - useFavoriteToggle Hook
// Shared favorite toggle logic for ListingCard, DetailModal, FullView
// listingId is passed as a parameter — NO internal state for it
// ═══════════════════════════════════════════════════════════════

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useI18n } from '@/hooks/use-i18n';
import { toast } from 'sonner';

/** Set of listing IDs that are currently favorited (cached client-side) */
let _favoriteIds = new Set<string>();

/** Subscribe to favorite changes across components */
type Listener = () => void;
const _listeners = new Set<Listener>();
function _emit() { _listeners.forEach((fn) => fn()); }
export function __setFavoriteIds(ids: string[]) {
  _favoriteIds = new Set(ids);
  _emit();
}

export function useFavoriteToggle(listingId: string | null) {
  const { data: session } = useSession();
  const { locale } = useI18n();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const prevListingIdRef = useRef<string | null>(null);

  // Sync isFavorite when listingId changes — stable, no loops
  useEffect(() => {
    if (!listingId || !session?.user) {
      setIsFavorite(false);
      prevListingIdRef.current = listingId;
      return;
    }

    // Only update if listingId actually changed
    if (listingId !== prevListingIdRef.current) {
      prevListingIdRef.current = listingId;
      setIsFavorite(_favoriteIds.has(listingId));
    }
  }, [listingId, session]);

  // Listen for external favorite changes (e.g., from FavoritosPage)
  useEffect(() => {
    const fn = () => {
      if (listingId && session?.user) {
        setIsFavorite(_favoriteIds.has(listingId));
      }
    };
    _listeners.add(fn);
    return () => { _listeners.delete(fn); };
  }, [listingId, session]);

  const toggle = useCallback(async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!listingId || !session?.user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId }),
      });
      const data = await res.json();
      if (data.isFavorite) {
        _favoriteIds.add(listingId);
        setIsFavorite(true);
        toast.success(locale === 'es' ? 'Guardado en favoritos' : 'Added to favorites');
      } else {
        _favoriteIds.delete(listingId);
        setIsFavorite(false);
        toast.success(locale === 'es' ? 'Eliminado de favoritos' : 'Removed from favorites');
      }
      _emit();
    } catch {
      toast.error('Error');
    } finally {
      setLoading(false);
    }
  }, [listingId, session, locale]);

  return { isFavorite, loading, toggle };
}
