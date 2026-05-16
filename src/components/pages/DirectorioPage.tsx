// ═══════════════════════════════════════════════════════════════
// GRAN CANARIA CONECTA - DirectorioPage
// Full business directory with filters, promotional banner, pagination
// ═══════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Sparkles, ArrowRight, Store } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { ListingCard } from '@/components/shared/ListingCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { useI18n } from '@/hooks/use-i18n';
import { useModalStore } from '@/lib/modal-store';
import { MUNICIPALITIES } from '@/lib/types';
import { cn } from '@/lib/utils';
import type { ListingDTO, PaginatedResponse } from '@/lib/types';

const ITEMS_PER_PAGE = 12;

export function DirectorioPage() {
  const { locale, tp } = useI18n();
  const openPromoteBusinessPage = useModalStore((s) => s.openPromoteBusinessPage);

  // Filter state
  const [search, setSearch] = useState('');
  const [municipality, setMunicipality] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');

  // Data state
  const [listings, setListings] = useState<ListingDTO[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Sort options
  const sortOptions = [
    { value: 'newest', label: tp('search', 'newest') },
    { value: 'popular', label: tp('search', 'popular') },
  ];

  // Fetch listings
  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('tier', 'BUSINESS');
      params.set('limit', String(ITEMS_PER_PAGE));
      params.set('page', String(page));
      params.set('sortBy', sortBy);
      if (municipality !== 'all') params.set('municipality', municipality);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/listings?${params.toString()}`);
      if (res.ok) {
        const data: PaginatedResponse<ListingDTO> = await res.json();
        setListings(data.data || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [page, municipality, search, sortBy]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [municipality, search, sortBy]);

  const handleSearch = () => {
    setSearch(searchInput);
    setSearchInput('');
  };

  const handleClearSearch = () => {
    setSearch('');
    setSearchInput('');
  };

  // Pagination range
  const getPaginationRange = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('ellipsis');
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  // Sort municipalities alphabetically
  const sortedMunicipalities = [...MUNICIPALITIES].sort((a, b) =>
    a.localeCompare(b, 'es')
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12"
    >
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 text-primary">
            <Store className="size-5" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            {tp('directory', 'title')}
          </h1>
        </div>
        <p className="text-muted-foreground">
          {tp('directory', 'subtitle')}
        </p>
      </div>

      {/* Promotional Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-8"
      >
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary via-primary/90 to-secondary text-primary-foreground p-6 sm:p-8">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center size-12 rounded-xl bg-white/15 shrink-0">
                <Sparkles className="size-6" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold mb-1">
                  {tp('directory', 'promote')}
                </h3>
                <p className="text-sm text-primary-foreground/90 leading-relaxed max-w-lg">
                  {tp('directory', 'promoteDesc')}
                </p>
              </div>
            </div>
            <Button
              size="lg"
              onClick={openPromoteBusinessPage}
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold gap-2 shrink-0 shadow-lg"
            >
              {tp('directory', 'promoteCta')}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={tp('hero', 'searchPlaceholder')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-9 pr-9"
          />
          {search && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={tp('common', 'close')}
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Municipality select */}
        <Select value={municipality} onValueChange={setMunicipality}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder={tp('search', 'allMunicipalities')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {tp('search', 'allMunicipalities')}
            </SelectItem>
            {sortedMunicipalities.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort select */}
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={tp('search', 'sortBy')} />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active search indicator */}
      {search && (
        <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
          <Search className="size-4" />
          <span>
            {locale === 'es'
              ? `Buscando: "${search}"`
              : `Searching: "${search}"`}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearSearch}
            className="h-7 px-2 text-xs"
          >
            {tp('common', 'close')}
          </Button>
        </div>
      )}

      {/* Results count */}
      {!loading && listings.length > 0 && (
        <div className="mb-6 text-sm text-muted-foreground">
          {locale === 'es' ? 'Mostrando' : 'Showing'} {listings.length}{' '}
          {locale === 'es' ? 'de' : 'of'} {total}{' '}
          {total === 1
            ? locale === 'es'
              ? 'negocio'
              : 'business'
            : locale === 'es'
              ? 'negocios'
              : 'businesses'}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[320px] rounded-xl" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && listings.length === 0 && (
        <EmptyState
          icon="store"
          title={
            search || municipality !== 'all'
              ? locale === 'es'
                ? 'No se encontraron negocios'
                : 'No businesses found'
              : tp('common', 'noResults')
          }
          description={
            search || municipality !== 'all'
              ? locale === 'es'
                ? 'Intenta con otras palabras o cambia el filtro de municipio'
                : 'Try different keywords or change the municipality filter'
              : undefined
          }
          action={
            search || municipality !== 'all'
              ? {
                  label: locale === 'es' ? 'Limpiar filtros' : 'Clear filters',
                  onClick: () => {
                    handleClearSearch();
                    setMunicipality('all');
                  },
                }
              : undefined
          }
        />
      )}

      {/* Listings Grid */}
      {!loading && listings.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {listings.map((listing, index) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <ListingCard listing={listing} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="mt-10">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={cn(
                    'cursor-pointer',
                    page <= 1 && 'pointer-events-none opacity-50'
                  )}
                />
              </PaginationItem>

              {getPaginationRange().map((p, i) =>
                p === 'ellipsis' ? (
                  <PaginationItem key={`ellipsis-${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink
                      isActive={p === page}
                      onClick={() => setPage(p as number)}
                      className="cursor-pointer"
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setPage((p) => Math.min(totalPages, p + 1))
                  }
                  className={cn(
                    'cursor-pointer',
                    page >= totalPages && 'pointer-events-none opacity-50'
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </motion.div>
  );
}
