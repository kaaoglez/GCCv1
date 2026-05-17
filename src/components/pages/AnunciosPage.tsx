// ═══════════════════════════════════════════════════════════════
// GRAN CANARIA CONECTA - AnunciosPage
// Full listing browser with filters, list view, and pagination
// ═══════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  Home,
  PackageSearch,
  MapPin,
  ShieldCheck,
  ImageOff,
  Heart,
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
import { TierBadge } from '@/components/shared/TierBadge';
import { CategoryBadge } from '@/components/shared/CategoryBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { useI18n } from '@/hooks/use-i18n';
import { useModalStore } from '@/lib/modal-store';
import { navigateBack, replaceNavigationState } from '@/hooks/use-navigation';
import { useFavoriteToggle } from '@/hooks/use-favorite-toggle';
import { useSession } from 'next-auth/react';
import { MUNICIPALITIES } from '@/lib/types';
import { formatPrice, getRelativeTime, truncateText } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ListingDTO, CategoryDTO, PaginatedResponse } from '@/lib/types';

const ITEMS_PER_PAGE = 12;

// ── List Item Component (separate to use hooks properly) ──
function ListingListItem({ listing, onClick }: { listing: ListingDTO; onClick: (listing: ListingDTO) => void }) {
  const { locale } = useI18n();
  const { data: session } = useSession();
  const { isFavorite, toggle } = useFavoriteToggle(listing.id);

  const image = listing.images?.[0];
  const price = listing.metadata?.price as number | undefined;
  const isFree = !price || price === 0;
  const isVipOrBusiness = listing.tier === 'VIP' || listing.tier === 'BUSINESS';
  const isHighlighted = listing.tier === 'HIGHLIGHTED';
  const priceLabel = isFree
    ? locale === 'es' ? 'Gratis' : 'Free'
    : typeof price === 'number'
      ? formatPrice(price, locale)
      : locale === 'es' ? 'Negociar' : 'Negotiable';

  return (
    <div
      onClick={() => onClick(listing)}
      className={cn(
        'group flex gap-3 sm:gap-4 p-3 cursor-pointer transition-colors hover:bg-muted/50',
        isHighlighted && 'bg-amber-50/50 dark:bg-amber-950/20',
      )}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] w-[100px] sm:w-[140px] md:w-[180px] shrink-0 overflow-hidden rounded-md bg-muted">
        {image ? (
          <img
            src={image}
            alt={listing.title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-8 opacity-40" />
          </div>
        )}
        {listing.status === 'SOLD' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
            <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow uppercase">
              {locale === 'es' ? 'Vendido' : 'Sold'}
            </span>
          </div>
        )}
        {isVipOrBusiness && (
          <div className="absolute top-1 left-1">
            <TierBadge tier={listing.tier} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1 sm:gap-1.5 py-0.5 flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <CategoryBadge category={listing.category} size="sm" />
          {session?.user && (
            <button
              onClick={(e) => toggle(e)}
              className={cn(
                'ml-auto flex items-center justify-center size-7 rounded-full transition-all shrink-0',
                isFavorite
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'text-muted-foreground hover:text-red-500'
              )}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={cn('size-3.5', isFavorite && 'fill-current')} />
            </button>
          )}
        </div>

        <h3 className="font-semibold text-sm sm:text-base leading-tight line-clamp-2 text-foreground">
          {truncateText(listing.title, 80)}
        </h3>

        {listing.municipality && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3" />
            <span className="truncate">{listing.municipality}</span>
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
            <span className="truncate font-medium">{listing.author.name}</span>
            {listing.author.isVerified && (
              <ShieldCheck className="size-3.5 text-emerald-600 shrink-0" />
            )}
            <span className="ml-1 opacity-60">·</span>
            <time className="whitespace-nowrap opacity-60">{getRelativeTime(listing.createdAt, locale)}</time>
          </div>
          <span
            className={cn(
              'rounded-md px-2.5 py-1 text-sm font-bold shrink-0',
              isFree
                ? 'bg-emerald-600 text-white'
                : 'bg-muted text-foreground'
            )}
          >
            {priceLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

export function AnunciosPage() {
  const { locale, tp } = useI18n();
  const setCurrentView = useModalStore((s) => s.setCurrentView);
  const openListingDetail = useModalStore((s) => s.openListingDetail);
  const selectedCategoryId = useModalStore((s) => s.selectedCategoryId);
  const setSelectedCategoryId = useModalStore((s) => s.setSelectedCategoryId);
  const listingsRefreshKey = useModalStore((s) => s.listingsRefreshKey);
  const anunciosPage = useModalStore((s) => s.anunciosPage);
  const setAnunciosPage = useModalStore((s) => s.setAnunciosPage);

  // ── Filter State ──────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [municipality, setMunicipality] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');

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
  const prevSearchRef = useRef<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      // Only reset page to 1 when search TEXT actually changes.
      // On initial mount prevSearchRef is null — skip to preserve page from popstate.
      if (prevSearchRef.current !== null && prevSearchRef.current !== search) {
        setAnunciosPage(1);
      }
      prevSearchRef.current = search;
    }, 400);
    return () => clearTimeout(timer);
  }, [search, setAnunciosPage]);

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
    params.set('page', String(anunciosPage));
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (categoryId) params.set('categoryId', categoryId);
    if (municipality) params.set('municipality', municipality);
    if (sortBy) params.set('sortBy', sortBy);
    return params.toString();
  }, [debouncedSearch, categoryId, municipality, sortBy, anunciosPage]);

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
  }, [queryParams, listingsRefreshKey]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // ── Sync page number to history (so back navigation preserves it) ──
  const currentView = useModalStore((s) => s.currentView);
  const isListingFullView = useModalStore((s) => s.isListingFullView);
  const isListingDetailOpen = useModalStore((s) => s.isListingDetailOpen);
  const hasMountedRef = useRef(false);
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return; // Skip first run — don't overwrite scrollY:500 with scrollY:0 from mount
    }
    if (currentView === 'anuncios' && !isListingFullView && !isListingDetailOpen) {
      replaceNavigationState();
    }
  }, [anunciosPage, currentView, isListingFullView, isListingDetailOpen]);

  // ── Persist page number to sessionStorage (for reload) ──
  useEffect(() => {
    if (currentView === 'anuncios') {
      sessionStorage.setItem('gcc_anuncios_page', String(anunciosPage));
    }
  }, [anunciosPage, currentView]);

  // ── Scroll Restoration ───────────────────────────────
  // Uses a global flag set by restoreState() (popstate handler).
  // This avoids the double-mount problem: when entering full view,
  // AnunciosPage remounts inside a hidden div — we must NOT consume
  // the scroll value there, only on the real mount after back navigation.
  useEffect(() => {
    if (!loading) {
      const y = (window as unknown as Record<string, number>).__gccRestoreScroll;
      if (y && y > 0) {
        (window as unknown as Record<string, number>).__gccRestoreScroll = 0;
        // Double rAF ensures the DOM has painted the listing items
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior });
          });
        });
      }
    }
  }, [loading]);

  // ── Handlers ─────────────────────────────────────────────
  const handleCategoryChange = (value: string) => {
    setCategoryId(value === '_all' ? '' : value);
    setAnunciosPage(1);
  };

  const handleMunicipalityChange = (value: string) => {
    setMunicipality(value === '_all' ? '' : value);
    setAnunciosPage(1);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setAnunciosPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setCategoryId('');
    setMunicipality('');
    setSortBy('newest');
    setAnunciosPage(1);
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
      if (anunciosPage > 3) pages.push('ellipsis');

      const start = Math.max(2, anunciosPage - 1);
      const end = Math.min(totalPages - 1, anunciosPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);

      if (anunciosPage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  const handleListingClick = (listing: ListingDTO) => {
    // openListingDetail saves scrollY to __gccAnunciosScrollY (see modal-store.ts)
    openListingDetail(listing);
    // Update current history entry with the saved scrollY so that
    // back navigation from full view restores the correct scroll position
    replaceNavigationState();
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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
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
            {tp('common', 'showing')} {((anunciosPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(anunciosPage * ITEMS_PER_PAGE, total)} {tp('common', 'of')} {total} {tp('common', 'results')}
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
        <div className="flex flex-col gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4 p-3">
              <Skeleton className="aspect-[4/3] w-full max-w-[160px] sm:max-w-[200px] rounded-lg shrink-0" />
              <div className="flex flex-col gap-2 py-1 flex-1 min-w-0">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Results List ────────────────────────────────── */}
      {!loading && listings.length > 0 && (
        <>
          <div className="flex flex-col divide-y divide-border rounded-lg border bg-card overflow-hidden">
            {listings.map((listing) => (
              <ListingListItem
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
                disabled={anunciosPage <= 1}
                onClick={() => {
                  setAnunciosPage(anunciosPage - 1);
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
                    variant={anunciosPage === p ? 'default' : 'outline'}
                    size="icon"
                    className="size-9"
                    onClick={() => {
                      setAnunciosPage(p);
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
                disabled={anunciosPage >= totalPages}
                onClick={() => {
                  setAnunciosPage(anunciosPage + 1);
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
    </div>
  );
}
