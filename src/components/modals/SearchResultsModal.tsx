// Gran Canaria Conecta - SearchResultsModal Component
// Full-screen modal showing filtered listing search results

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/hooks/use-i18n';
import { useModalStore } from '@/lib/modal-store';
import { ListingCard } from '@/components/shared/ListingCard';
import { SearchX } from 'lucide-react';
import type { ListingDTO, PaginatedResponse } from '@/lib/types';

export function SearchResultsModal() {
  const { locale, tp } = useI18n();
  const { isSearchOpen, searchQuery, searchCategoryId, closeSearch } = useModalStore();
  const [results, setResults] = useState<ListingDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 12;

  // Darker, blurred backdrop when modal is open
  useEffect(() => {
    if (!isSearchOpen) return;
    const interval = setInterval(() => {
      const overlay = document.querySelector(
        'div[data-slot="dialog-overlay"]'
      ) as HTMLElement | null;
      if (overlay) {
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
        overlay.style.backdropFilter = 'blur(6px)';
        (overlay.style as unknown as Record<string, string>)['webkitBackdropFilter'] = 'blur(6px)';
        clearInterval(interval);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [isSearchOpen]);

  const fetchResults = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (searchCategoryId) params.set('categoryId', searchCategoryId);
      params.set('page', String(p));
      params.set('limit', String(limit));

      const res = await fetch(`/api/listings?${params.toString()}`);
      if (res.ok) {
        const data: PaginatedResponse<ListingDTO> = await res.json();
        setResults(data.data);
        setTotal(data.total);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [searchQuery, searchCategoryId]);

  useEffect(() => {
    if (isSearchOpen) {
      setPage(1);
      fetchResults(1);
    }
  }, [isSearchOpen, fetchResults]);

  useEffect(() => {
    if (isSearchOpen && page > 1) {
      fetchResults(page);
    }
  }, [page, isSearchOpen, fetchResults]);

  const handleClose = () => {
    setResults([]);
    setTotal(0);
    setPage(1);
    closeSearch();
  };

  const hasQuery = searchQuery || searchCategoryId;
  const totalPages = Math.ceil(total / limit);

  return (
    <Dialog open={isSearchOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0 [&>button]:hidden">
        <DialogTitle className="sr-only">
          {hasQuery
            ? tp('searchResults', 'resultsFor').replace('{query}', searchQuery || (searchCategoryId ? tp('search', 'allCategories') : ''))
            : locale === 'es' ? 'Todos los anuncios' : 'All listings'}
        </DialogTitle>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div>
            {hasQuery ? (
              <h2 className="text-lg font-semibold text-foreground">
                {tp('searchResults', 'resultsFor').replace('{query}', searchQuery || (searchCategoryId ? tp('search', 'allCategories') : ''))}
              </h2>
            ) : (
              <h2 className="text-lg font-semibold text-foreground">
                {locale === 'es' ? 'Todos los anuncios' : 'All listings'}
              </h2>
            )}
            {!loading && total > 0 && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {tp('searchResults', 'showing')} {Math.min(page * limit, total)} {tp('searchResults', 'results')}
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="flex items-center justify-center size-9 rounded-full bg-muted hover:bg-muted/80 text-foreground transition-colors"
          >
            <span className="sr-only">{tp('common', 'close')}</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="1" y1="1" x2="13" y2="13" />
              <line x1="13" y1="1" x2="1" y2="13" />
            </svg>
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-56 rounded-xl" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex items-center justify-center size-16 rounded-full bg-muted mb-4">
                <SearchX className="size-8 text-muted-foreground" />
              </div>
              <p className="text-base font-medium text-foreground mb-1">
                {tp('searchResults', 'noResultsFor').replace('{query}', searchQuery || '')}
              </p>
              <p className="text-sm text-muted-foreground max-w-sm">
                {tp('searchResults', 'tryDifferent')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 px-6 py-3 border-t shrink-0">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              {tp('common', 'previous')}
            </Button>
            <span className="text-sm text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              {tp('common', 'next')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
