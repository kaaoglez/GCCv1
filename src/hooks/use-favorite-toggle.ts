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

/** Track if we've already loaded favorites for the current session */
let _loaded = false;

/** Subscribe to favorite changes across components */
type Listener = () => void;
const _listeners = new Set<Listener>();
function _emit() { _listeners.forEach((fn) => fn()); }
export function __setFavoriteIds(ids: string[]) {
  // Full replace — call this with authoritative server data only
  _favoriteIds = new Set(ids);
  _loaded = true;
  _emit();
}

/** Add a single ID to cache (optimistic local update after toggle) */
export function __addFavoriteId(id: string) {
  _favoriteIds.add(id);
  _loaded = true;
  _emit();
}

/** Remove IDs from cache (used when explicitly unfavorited) */
export function __removeFavoriteId(id: string) {
  _favoriteIds.delete(id);
  _emit();
}

/** Allow forcing a full reload of favorites from the API */
export function __resetFavoriteLoad() {
  _loaded = false;
}

/** Fetch favorite IDs from the API (called once per session) */
async function _loadFavorites() {
  if (_loaded) return;
  _loaded = true;
  try {
    const res = await fetch('/api/favorites');
    if (res.ok) {
      const data = await res.json();
      const ids = Array.isArray(data) ? data.map((l: { id: string }) => l.id) : [];
      _favoriteIds = new Set(ids);
      _emit();
    } else {
      console.error('[loadFavorites] API error:', res.status);
      // Don't clear cache on error — keep local state intact
    }
  } catch (err) {
    console.error('[loadFavorites] Network error:', err);
    // Don't clear cache on error
  }
}

export function useFavoriteToggle(listingId: string | null) {
  const { data: session } = useSession();
  const { locale } = useI18n();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const prevListingIdRef = useRef<string | null>(null);

  // Load favorites once on first hook use (if user is logged in)
  useEffect(() => {
    if (session?.user) {
      _loadFavorites();
    }
  }, [session?.user]);

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
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Error' }));
        console.error('[toggle favorite] API error:', res.status, err.error);
        const msg = `Error ${res.status}: ${err.error || 'desconocido'}`;
        toast.error(msg);
        return;
      }
      const data = await res.json();
      if (data.isFavorite) {
        _favoriteIds.add(listingId);
        setIsFavorite(true);
        toast.success(locale === 'es' ? '❤️ Guardado en favoritos' : '❤️ Added to favorites');
      } else {
        _favoriteIds.delete(listingId);
        setIsFavorite(false);
        toast.success(locale === 'es' ? 'Eliminado de favoritos' : 'Removed from favorites');
      }
      _emit();
    } catch (err) {
      console.error('[toggle favorite] Network error:', err);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [listingId, session, locale]);

  return { isFavorite, loading, toggle };
}
