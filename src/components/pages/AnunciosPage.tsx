// ═══════════════════════════════════════════════════════════════
// GRAN CANARIA CONECTA - AnunciosPage
// Full listing browser with filters, grid, and pagination
// ═══════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  Home,
  PackageSearch,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { ListingCard } from '@/components/shared/ListingCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { useI18n } from '@/hooks/use-i18n';
import { useModalStore } from '@/lib/modal-store';
import { navigateBack } from '@/hooks/use-navigation';
import { MUNICIPALITIES } from '@/lib/types';
import type { ListingDTO, CategoryDTO, PaginatedResponse } from '@/lib/types';

const ITEMS_PER_PAGE = 12;

export function AnunciosPage() {
  const { locale, tp } = useI18n();
  const setCurrentView = useModalStore((s) => s.setCurrentView);
  const openListingDetail = useModalStore((s) => s.openListingDetail);
  const selectedCategoryId = useModalStore((s) => s.selectedCategoryId);
  const setSelectedCategoryId = useModalStore((s) => s.setSelectedCategoryId);

  // ── Filter State ──────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [municipality, setMunicipality] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [page, setPage] = useState(1);

  // ── Apply selectedCategoryId from store on mount ──────────
  useEffect(() => {
    if (selectedCategoryId) {
      setCategoryId(selectedCategoryId);
      setSelectedCategoryId(null);
    }
  }, [selectedCategoryId, setSelectedCategoryId]);

  // ── Data State ────────────────────────────────────────────
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [listings, setListings] = useState<ListingDTO[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // ── Debounced Search ──────────────────────────────────────
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // ── Fetch Categories ─────────────────────────────────────
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data: CategoryDTO[] = await res.json();
          setCategories(data.filter((c) => !c.parentId));
        }
      } catch {
        // Categories are optional for the page to work
      }
    }
    fetchCategories();
  }, []);

  // ── Build query params ───────────────────────────────────
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set('limit', String(ITEMS_PER_PAGE));
    params.set('page', String(page));
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (categoryId) params.set('categoryId', categoryId);
    if (municipality) params.set('municipality', municipality);
    if (sortBy) params.set('sortBy', sortBy);
    return params.toString();
  }, [debouncedSearch, categoryId, municipality, sortBy, page]);

  // ── Fetch Listings ───────────────────────────────────────
  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/listings?${queryParams}`);
      if (res.ok) {
        const data: PaginatedResponse<ListingDTO> = await res.json();
        setListings(data.data);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // ── Handlers ─────────────────────────────────────────────
  const handleCategoryChange = (value: string) => {
    setCategoryId(value === '_all' ? '' : value);
    setPage(1);
  };

  const handleMunicipalityChange = (value: string) => {
    setMunicipality(value === '_all' ? '' : value);
    setPage(1);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setCategoryId('');
    setMunicipality('');
    setSortBy('newest');
    setPage(1);
  };

  const hasActiveFilters = search || categoryId || municipality || sortBy !== 'newest';

  // ── Pagination helpers ───────────────────────────────────
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
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

  const handleListingClick = (listing: ListingDTO) => {
    openListingDetail(listing);
  };

  // ── Sort options ─────────────────────────────────────────
  const sortOptions = [
    { value: 'newest', label: tp('search', 'newest') },
    { value: 'oldest', label: tp('search', 'oldest') },
    { value: 'price_asc', label: tp('search', 'priceAsc') },
    { value: 'price_desc', label: tp('search', 'priceDesc') },
    { value: 'popular', label: tp('search', 'popular') },
  ];

  // ── Render ───────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10"
    >
      {/* ── Breadcrumb ──────────────────────────────────── */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              asChild
            >
              <button
                onClick={() => navigateBack()}
                className="hover:text-primary transition-colors flex items-center gap-1"
              >
                <Home className="size-3.5" />
                {tp('common', 'home')}
              </button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{tp('pages', 'anuncios')}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* ── Page Header ─────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
          {tp('pages', 'anuncios')}
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          {tp('pages', 'anunciosDesc')}
        </p>
        {total > 0 && !loading && (
          <p className="text-xs text-muted-foreground mt-1">
            {tp('common', 'showing')} {((page - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(page * ITEMS_PER_PAGE, total)} {tp('common', 'of')} {total} {tp('common', 'results')}
          </p>
        )}
      </div>

      {/* ── Filter Bar ──────────────────────────────────── */}
      <div className="mb-6 space-y-3">
        {/* Top row: Search + Sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={tp('search', 'placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-full"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SlidersHorizontal className="size-4 mr-1 text-muted-foreground" />
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

        {/* Bottom row: Category + Municipality + Clear */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={categoryId || '_all'} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder={tp('search', 'allCategories')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">{tp('search', 'allCategories')}</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {locale === 'es' ? cat.nameEs : cat.nameEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={municipality || '_all'} onValueChange={handleMunicipalityChange}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder={tp('search', 'allMunicipalities')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">{tp('search', 'allMunicipalities')}</SelectItem>
              {MUNICIPALITIES.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground gap-1.5"
            >
              <X className="size-3.5" />
              {tp('search', 'clearFilters')}
            </Button>
          )}
        </div>
      </div>

      {/* ── Loading State ───────────────────────────────── */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[4/3] w-full rounded-lg" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* ── Results Grid ────────────────────────────────── */}
      {!loading && listings.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onClick={handleListingClick}
              />
            ))}
          </div>

          {/* ── Pagination ────────────────────────────── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-8">
              <Button
                variant="outline"
                size="icon"
                className="size-9"
                disabled={page <= 1}
                onClick={() => {
                  setPage((p) => p - 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <ChevronLeft className="size-4" />
              </Button>

              {getPageNumbers().map((p, idx) =>
                p === 'ellipsis' ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="flex size-9 items-center justify-center text-muted-foreground"
                  >
                    ...
                  </span>
                ) : (
                  <Button
                    key={p}
                    variant={page === p ? 'default' : 'outline'}
                    size="icon"
                    className="size-9"
                    onClick={() => {
                      setPage(p);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    {p}
                  </Button>
                )
              )}

              <Button
                variant="outline"
                size="icon"
                className="size-9"
                disabled={page >= totalPages}
                onClick={() => {
                  setPage((p) => p + 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* ── Empty State ────────────────────────────────── */}
      {!loading && listings.length === 0 && (
        <EmptyState
          icon="PackageSearch"
          title={tp('search', 'noListings')}
          description={tp('search', 'noListingsDesc')}
          action={
            hasActiveFilters
              ? {
                  label: tp('search', 'clearFilters'),
                  onClick: clearFilters,
                }
              : undefined
          }
        />
      )}
    </motion.div>
  );
}
