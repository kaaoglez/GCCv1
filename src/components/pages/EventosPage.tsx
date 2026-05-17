// ═══════════════════════════════════════════════════════════════
// GRAN CANARIA CONECTA - EventosPage
// Events browser with filters, grid, and pagination
// ═══════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Home,
  CalendarOff,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { EventCard } from '@/components/shared/EventCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { useI18n } from '@/hooks/use-i18n';
import { useModalStore } from '@/lib/modal-store';
import { navigateBack, replaceNavigationState } from '@/hooks/use-navigation';
import { MUNICIPALITIES, type EventCategory } from '@/lib/types';
import { EVENT_CATEGORIES } from '@/lib/constants';
import type { EventDTO, PaginatedResponse } from '@/lib/types';

const ITEMS_PER_PAGE = 12;

const EVENT_CATEGORIES_KEYS: EventCategory[] = [
  'WORKSHOP',
  'CLEANUP',
  'MARKET',
  'CONCERT',
  'SPORT',
  'COMMUNITY',
  'CULTURE',
  'OTHER',
];

export function EventosPage() {
  const { locale, tp } = useI18n();
  const setCurrentView = useModalStore((s) => s.setCurrentView);
  const openEventDetail = useModalStore((s) => s.openEventDetail);
  const eventosPage = useModalStore((s) => s.eventosPage);
  const setEventosPage = useModalStore((s) => s.setEventosPage);
  const currentView = useModalStore((s) => s.currentView);
  const isEventFullView = useModalStore((s) => s.isEventFullView);
  const isEventDetailOpen = useModalStore((s) => s.isEventDetailOpen);

  // ── Filter State ──────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('');
  const [municipality, setMunicipality] = useState<string>('');
  const [isFree, setIsFree] = useState(false);
  const [isEco, setIsEco] = useState(false);
  const [page, setPage] = useState(1);

  // ── Data State ────────────────────────────────────────────
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // ── Sync page from store on mount ──────────────────────
  useEffect(() => {
    if (eventosPage > 1) setPage(eventosPage);
  }, []);

  // ── Debounced Search ──────────────────────────────────────
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const prevSearchRef = useRef<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      if (prevSearchRef.current !== null && prevSearchRef.current !== search) {
        setPage(1);
        setEventosPage(1);
      }
      prevSearchRef.current = search;
    }, 400);
    return () => clearTimeout(timer);
  }, [search, setEventosPage]);

  // ── Build query params ───────────────────────────────────
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set('limit', String(ITEMS_PER_PAGE));
    params.set('page', String(page));
    params.set('status', 'UPCOMING');
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (category) params.set('category', category);
    if (municipality) params.set('municipality', municipality);
    if (isFree) params.set('isFree', 'true');
    if (isEco) params.set('isEco', 'true');
    return params.toString();
  }, [debouncedSearch, category, municipality, isFree, isEco, page]);

  // ── Fetch Events ─────────────────────────────────────────
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events?${queryParams}`);
      if (res.ok) {
        const data: PaginatedResponse<EventDTO> = await res.json();
        setEvents(data.data);
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
    fetchEvents();
  }, [fetchEvents]);

  // ── Sync page number to history ──
  const hasMountedRef = useRef(false);
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    if (currentView === 'eventos' && !isEventFullView && !isEventDetailOpen) {
      replaceNavigationState();
    }
  }, [page, currentView, isEventFullView, isEventDetailOpen]);

  // ── Persist page to sessionStorage (for reload) ──
  useEffect(() => {
    if (currentView === 'eventos') {
      sessionStorage.setItem('gcc_eventos_page', String(page));
    }
  }, [page, currentView]);

  // ── Scroll Restoration ──
  useEffect(() => {
    if (!loading) {
      const y = (window as unknown as Record<string, number>).__gccRestoreScroll;
      if (y && y > 0) {
        (window as unknown as Record<string, number>).__gccRestoreScroll = 0;
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
    setCategory(value === '_all' ? '' : value);
    setPage(1); setEventosPage(1);
  };

  const handleMunicipalityChange = (value: string) => {
    setMunicipality(value === '_all' ? '' : value);
    setPage(1); setEventosPage(1);
  };

  const handleFreeToggle = (checked: boolean) => {
    setIsFree(checked);
    setPage(1); setEventosPage(1);
  };

  const handleEcoToggle = (checked: boolean) => {
    setIsEco(checked);
    setPage(1); setEventosPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setMunicipality('');
    setIsFree(false);
    setIsEco(false);
    setPage(1); setEventosPage(1);
  };

  const hasActiveFilters =
    search || category || municipality || isFree || isEco;

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

  // ── Event Card Click ────────────────────────────────
  const handleEventClick = (event: EventDTO) => {
    openEventDetail(event);
    replaceNavigationState();
  };

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
            <BreadcrumbLink asChild>
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
            <BreadcrumbPage>{tp('pages', 'eventos')}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* ── Page Header ─────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
          {tp('pages', 'eventos')}
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          {tp('pages', 'eventosDesc')}
        </p>
        {total > 0 && !loading && (
          <p className="text-xs text-muted-foreground mt-1">
            {tp('common', 'showing')} {((page - 1) * ITEMS_PER_PAGE) + 1}–
            {Math.min(page * ITEMS_PER_PAGE, total)} {tp('common', 'of')} {total}{' '}
            {tp('common', 'results')}
          </p>
        )}
      </div>

      {/* ── Filter Bar ──────────────────────────────────── */}
      <div className="mb-6 space-y-3">
        {/* Top row: Search */}
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
        </div>

        {/* Middle row: Category + Municipality */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={category || '_all'} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder={tp('search', 'allCategoriesEvent')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">
                {tp('search', 'allCategoriesEvent')}
              </SelectItem>
              {EVENT_CATEGORIES_KEYS.map((key) => {
                const catInfo = EVENT_CATEGORIES[key];
                return (
                  <SelectItem key={key} value={key}>
                    {catInfo
                      ? locale === 'es'
                        ? catInfo.es
                        : catInfo.en
                      : key}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <Select
            value={municipality || '_all'}
            onValueChange={handleMunicipalityChange}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder={tp('search', 'allMunicipalities')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">
                {tp('search', 'allMunicipalities')}
              </SelectItem>
              {MUNICIPALITIES.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bottom row: Toggle switches + Clear */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
          {/* Free toggle */}
          <div className="flex items-center gap-2">
            <Switch
              id="free-toggle"
              checked={isFree}
              onCheckedChange={handleFreeToggle}
            />
            <Label
              htmlFor="free-toggle"
              className="text-sm font-medium cursor-pointer select-none"
            >
              {tp('events', 'free')}
            </Label>
          </div>

          {/* Eco toggle */}
          <div className="flex items-center gap-2">
            <Switch
              id="eco-toggle"
              checked={isEco}
              onCheckedChange={handleEcoToggle}
            />
            <Label
              htmlFor="eco-toggle"
              className="text-sm font-medium cursor-pointer select-none"
            >
              {tp('events', 'eco')}
            </Label>
          </div>

          {/* Clear filters */}
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
              <div className="flex">
                <Skeleton className="w-16 h-28 rounded-none" />
                <Skeleton className="flex-1 h-28 rounded-none" />
              </div>
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* ── Results Grid ────────────────────────────────── */}
      {!loading && events.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} onClick={handleEventClick} />
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
                  setPage((p) => p - 1); setEventosPage((p) => p - 1);
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
                      setPage(p); setEventosPage(p);
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
                  setPage((p) => p + 1); setEventosPage((p) => p + 1);
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
      {!loading && events.length === 0 && (
        <EmptyState
          icon="CalendarOff"
          title={tp('search', 'noEvents')}
          description={tp('search', 'noEventsDesc')}
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
