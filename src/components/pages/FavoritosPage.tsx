'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import {
  Home,
  Heart,
  ImageOff,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { EmptyState } from '@/components/shared/EmptyState';
import { useI18n } from '@/hooks/use-i18n';
import { __setFavoriteIds, __removeFavoriteId, __resetFavoriteLoad } from '@/hooks/use-favorite-toggle';
import { navigateBack, navigateTo } from '@/hooks/use-navigation';
import { useModalStore } from '@/lib/modal-store';
import { formatPrice, getRelativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';
// Using native <img> for maximum reliability across proxy setups
import { toast } from 'sonner';
import type { ListingDTO } from '@/lib/types';

export function FavoritosPage() {
  const { data: session, status } = useSession();
  const { locale } = useI18n();
  const openListingDetail = useModalStore((s) => s.openListingDetail);
  const { openAuth } = useModalStore();

  const [favorites, setFavorites] = useState<ListingDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchFavorites = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    // Force fresh load from server
    __resetFavoriteLoad();
    setLoading(true);
    try {
      const res = await fetch('/api/favorites');
      if (!res.ok) {
        console.error('[FavoritosPage] GET /api/favorites error:', res.status);
        setLoading(false);
        return;
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      console.log('[FavoritosPage] Loaded', list.length, 'favorites from server');
      setFavorites(list);
      __setFavoriteIds(list.map((l: ListingDTO) => l.id));
    } catch (err) {
      console.error('[FavoritosPage] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Loading session
  if (status === 'loading') {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      </div>
    );
  }

  // Not logged in
  if (!session) {
    return (
      <div className="w-full max-w-md mx-auto px-4 sm:px-6 py-16 text-center space-y-4">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <Heart className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        <h2 className="text-xl font-bold">{locale === 'es' ? 'Inicia sesión' : 'Sign in'}</h2>
        <p className="text-muted-foreground text-sm">
          {locale === 'es' ? 'Necesitas iniciar sesión para ver tus favoritos.' : 'Sign in to view your favorites.'}
        </p>
        <Button onClick={openAuth} className="bg-primary hover:bg-primary/90">{locale === 'es' ? 'Iniciar sesión' : 'Sign in'}</Button>
      </div>
    );
  }

  const toggleFavorite = async (listing: ListingDTO) => {
    setTogglingId(listing.id);
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listing.id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Error' }));
        console.error('[toggleFavorite] API error:', res.status, err.error);
        toast.error(locale === 'es' ? 'Error al guardar favorito' : 'Failed to save favorite');
        setTogglingId(null);
        return;
      }
      const data = await res.json();
      if (data.isFavorite === false) {
        setFavorites((prev) => prev.filter((l) => l.id !== listing.id));
        __removeFavoriteId(listing.id);
      }
      toast.success(data.isFavorite
        ? (locale === 'es' ? '❤️ Guardado en favoritos' : '❤️ Added to favorites')
        : (locale === 'es' ? 'Eliminado de favoritos' : 'Removed from favorites'));
    } catch (err) {
      console.error('[toggleFavorite] Network error:', err);
      toast.error('Error de conexión');
    }
    setTogglingId(null);
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10"
      >
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10"
    >
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <button onClick={() => navigateBack()} className="hover:text-primary transition-colors flex items-center gap-1">
                <Home className="size-3.5" />
                {locale === 'es' ? 'Inicio' : 'Home'}
              </button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <button onClick={() => navigateTo('perfil')} className="hover:text-primary transition-colors">
                {locale === 'es' ? 'Perfil' : 'Profile'}
              </button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{locale === 'es' ? 'Favoritos' : 'Favorites'}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
          {locale === 'es' ? 'Mis Favoritos' : 'My Favorites'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {favorites.length} {locale === 'es' ? 'anuncios guardados' : 'saved listings'}
        </p>
      </div>

      {favorites.length === 0 ? (
        <EmptyState
          icon="Heart"
          title={locale === 'es' ? 'Sin favoritos' : 'No favorites yet'}
          description={locale === 'es'
            ? 'Guarda anuncios que te interesen para encontrarlos fácilmente. Haz clic en el ❤️ en cualquier anuncio.'
            : 'Save listings you like by clicking the ❤️ on any listing.'}
          actionLabel={locale === 'es' ? 'Explorar anuncios' : 'Browse listings'}
          onAction={() => navigateTo('anuncios')}
        />
      ) : (
        <div className="space-y-3">
          {favorites.map((listing, index) => {
            const price = listing.metadata?.price as number | undefined;
            const image = listing.images?.[0];

            return (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
              >
                <Card className="overflow-hidden group hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                      {/* Image */}
                      <div className="relative w-full sm:w-40 h-32 sm:h-auto bg-muted flex-shrink-0">
                        {image ? (
                          <img src={image} alt={listing.title} className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <ImageOff className="size-8 opacity-30" />
                          </div>
                        )}
                        {listing.status === 'SOLD' && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Badge className="bg-red-600 text-white text-sm font-bold px-3 py-1">VENDIDO</Badge>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-4 min-w-0">
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => openListingDetail(listing)}
                        >
                          <h3 className="font-semibold text-sm hover:text-primary transition-colors line-clamp-1">
                            {listing.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">
                              {price ? formatPrice(price, locale) : (locale === 'es' ? 'Gratis' : 'Free')}
                            </span>
                            <span>•</span>
                            <span>{listing.category[locale === 'es' ? 'nameEs' : 'nameEn']}</span>
                            {listing.municipality && <><span>•</span><span>{listing.municipality}</span></>}
                            <span>•</span>
                            <span>{getRelativeTime(listing.createdAt, locale)}</span>
                          </div>
                        </div>

                        {/* Remove button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                          disabled={togglingId === listing.id}
                          onClick={() => toggleFavorite(listing)}
                        >
                          <Heart className={cn('size-5', favorites.some((f) => f.id === listing.id) && 'fill-current')} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
