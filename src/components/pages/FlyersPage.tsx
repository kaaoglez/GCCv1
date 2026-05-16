// ═══════════════════════════════════════════════════════════════
// GRAN CANARIA CONECTA - FlyersPage
// Professional flyer browsing experience – digital magazine style
// ═══════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Home,
  Eye,
  MousePointerClick,
  Phone,
  Mail,
  Globe,
  MapPin,
  CalendarRange,
  Tag,
  Award,
  Zap,
  Newspaper,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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
import { EmptyState } from '@/components/shared/EmptyState';
import { useI18n } from '@/hooks/use-i18n';
import { useModalStore } from '@/lib/modal-store';
import { navigateBack } from '@/hooks/use-navigation';
import {
  FLYER_CATEGORIES,
  MUNICIPALITIES,
  type FlyerDTO,
  type FlyerCategory,
  type PaginatedResponse,
} from '@/lib/types';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 12;
const SEARCH_DEBOUNCE_MS = 300;

const FLYER_CATEGORY_KEYS: FlyerCategory[] = [
  'SUPERMARKET',
  'RESTAURANT',
  'FASHION',
  'ELECTRONICS',
  'HOME',
  'BEAUTY',
  'SPORTS',
  'PHARMACY',
  'AUTOMOTIVE',
  'SERVICES',
  'OTHER',
];

// ─────────────────────────────────────────────────────────────
// Helper: format date range
// ─────────────────────────────────────────────────────────────

function formatDateRange(from: string, until?: string, locale: string): string {
  const dFrom = new Date(from + 'T00:00:00');
  const dayFrom = dFrom.getDate();
  const monthFrom = locale === 'es'
    ? dFrom.toLocaleDateString('es-ES', { month: 'long' })
    : dFrom.toLocaleDateString('en-US', { month: 'long' });

  if (until) {
    const dUntil = new Date(until + 'T00:00:00');
    const dayUntil = dUntil.getDate();
    if (locale === 'es') {
      return `Del ${dayFrom} al ${dayUntil} de ${monthFrom}`;
    }
    return `${monthFrom} ${dayFrom} – ${dayUntil}`;
  }

  if (locale === 'es') {
    return `Desde el ${dayFrom} de ${monthFrom}`;
  }
  return `From ${monthFrom} ${dayFrom}`;
}

// ─────────────────────────────────────────────────────────────
// Animation variants
// ─────────────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.15 },
  },
};

// ─────────────────────────────────────────────────────────────
// Skeleton Card
// ─────────────────────────────────────────────────────────────

function FlyerSkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden border bg-card shadow-sm">
      <Skeleton className="aspect-[3/4] w-full" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export function FlyersPage() {
  const { locale, tp } = useI18n();

  // ── Filter State ──────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('');
  const [municipality, setMunicipality] = useState<string>('');
  const [page, setPage] = useState(1);

  // ── Data State ────────────────────────────────────────────
  const [flyers, setFlyers] = useState<FlyerDTO[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // ── Selected Flyer (modal) ────────────────────────────────
  const [selectedFlyer, setSelectedFlyer] = useState<FlyerDTO | null>(null);

  // ── Debounced Search ──────────────────────────────────────
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  // ── Build query params ───────────────────────────────────
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set('locale', locale);
    params.set('limit', String(ITEMS_PER_PAGE));
    params.set('page', String(page));
    params.set('status', 'ACTIVE');
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (category) params.set('category', category);
    if (municipality) params.set('municipality', municipality);
    return params.toString();
  }, [debouncedSearch, category, municipality, page, locale]);

  // ── Fetch Flyers ─────────────────────────────────────────
  const fetchFlyers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/flyers?${queryParams}`);
      if (res.ok) {
        const data: PaginatedResponse<FlyerDTO> = await res.json();
        setFlyers(data.data);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      }
    } catch {
      // Silently fail — show empty state
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    fetchFlyers();
  }, [fetchFlyers]);

  // ── Handlers ─────────────────────────────────────────────
  const handleCategoryChange = (value: string) => {
    setCategory(value === '_all' ? '' : value);
    setPage(1);
  };

  const handleMunicipalityChange = (value: string) => {
    setMunicipality(value === '_all' ? '' : value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setMunicipality('');
    setPage(1);
  };

  const hasActiveFilters = search || category || municipality;

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

  // ── Labels ───────────────────────────────────────────────
  const isEs = locale === 'es';
  const labels = useMemo(() => ({
    title: isEs ? 'Ofertas de la Semana' : 'Weekly Offers',
    subtitle: isEs
      ? 'Descubre las mejores ofertas de negocios locales en Gran Canaria'
      : 'Discover the best deals from local businesses in Gran Canaria',
    totalFlyers: isEs
      ? `${total} ${total === 1 ? 'oferta activa' : 'ofertas activas'}`
      : `${total} active ${total === 1 ? 'offer' : 'offers'}`,
    allCategories: isEs ? 'Todas las categorías' : 'All categories',
    allMunicipalities: isEs ? 'Todos los municipios' : 'All municipalities',
    searchPlaceholder: isEs
      ? 'Buscar negocio o flyer...'
      : 'Search business or flyer...',
    clearFilters: isEs ? 'Limpiar filtros' : 'Clear filters',
    noFlyers: isEs ? 'No hay ofertas activas en este momento' : 'No active offers at the moment',
    noFlyersDesc: isEs
      ? 'Prueba con otros filtros o vuelve más tarde.'
      : 'Try different filters or come back later.',
    views: isEs ? 'vistas' : 'views',
    clicks: isEs ? 'clics' : 'clicks',
    contactBusiness: isEs ? 'Contactar negocio' : 'Contact business',
    phone: isEs ? 'Teléfono' : 'Phone',
    email: isEs ? 'Correo' : 'Email',
    website: isEs ? 'Web' : 'Website',
    address: isEs ? 'Dirección' : 'Address',
    validFrom: isEs ? 'Válido desde' : 'Valid from',
    noImageAlt: isEs ? 'Imagen del flyer' : 'Flyer image',
    badgeFeatured: isEs ? 'Destacado' : 'Featured',
    badgePremium: isEs ? 'Premium' : 'Premium',
  }), [isEs, total]);

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
            <BreadcrumbPage>
              <span className="flex items-center gap-1.5">
                <Newspaper className="size-4" />
                {labels.title}
              </span>
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* ── Page Header ─────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
              {labels.title}
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
              {labels.subtitle}
            </p>
          </div>
          {total > 0 && !loading && (
            <Badge
              variant="secondary"
              className="hidden sm:flex items-center gap-1.5 shrink-0 text-sm font-medium px-3 py-1.5 h-auto bg-primary/10 text-primary border-primary/20"
            >
              <Tag className="size-3.5" />
              {labels.totalFlyers}
            </Badge>
          )}
        </div>
        {/* Mobile total badge */}
        {total > 0 && !loading && (
          <Badge
            variant="secondary"
            className="sm:hidden mt-2 self-start text-xs font-medium px-2.5 py-1 h-auto bg-primary/10 text-primary border-primary/20"
          >
            {labels.totalFlyers}
          </Badge>
        )}
      </div>

      {/* ── Filter Bar ──────────────────────────────────── */}
      <div className="mb-8 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder={labels.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-full h-10"
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

          {/* Category Filter */}
          <Select value={category || '_all'} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full sm:w-[200px] h-10">
              <SelectValue placeholder={labels.allCategories} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">{labels.allCategories}</SelectItem>
              {FLYER_CATEGORY_KEYS.map((key) => {
                const cat = FLYER_CATEGORIES[key];
                return (
                  <SelectItem key={key} value={key}>
                    <span className="flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      {isEs ? cat.nameEs : cat.nameEn}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {/* Municipality Filter */}
          <Select value={municipality || '_all'} onValueChange={handleMunicipalityChange}>
            <SelectTrigger className="w-full sm:w-[200px] h-10">
              <SelectValue placeholder={labels.allMunicipalities} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">{labels.allMunicipalities}</SelectItem>
              {MUNICIPALITIES.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground gap-1.5 h-8 text-xs"
            >
              <X className="size-3.5" />
              {labels.clearFilters}
            </Button>
          </div>
        )}
      </div>

      <Separator className="mb-8" />

      {/* ── Loading State ───────────────────────────────── */}
      {loading && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <FlyerSkeletonCard key={i} />
          ))}
        </motion.div>
      )}

      {/* ── Results Grid ────────────────────────────────── */}
      {!loading && flyers.length > 0 && (
        <>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            key={`flyers-${debouncedSearch}-${category}-${municipality}-${page}`}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
          >
            {flyers.map((flyer, index) => (
              <FlyerCard
                key={flyer.id}
                flyer={flyer}
                index={index}
                locale={locale}
                labels={labels}
                onClick={() => setSelectedFlyer(flyer)}
              />
            ))}
          </motion.div>

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
                    …
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
      {!loading && flyers.length === 0 && (
        <EmptyState
          icon="Newspaper"
          title={labels.noFlyers}
          description={labels.noFlyersDesc}
          action={
            hasActiveFilters
              ? { label: labels.clearFilters, onClick: clearFilters }
              : undefined
          }
        />
      )}

      {/* ── Flyer Detail Modal ─────────────────────────── */}
      <AnimatePresence>
        {selectedFlyer && (
          <FlyerDetailModal
            flyer={selectedFlyer}
            locale={locale}
            labels={labels}
            onClose={() => setSelectedFlyer(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// FlyerCard
// ─────────────────────────────────────────────────────────────

interface FlyerCardProps {
  flyer: FlyerDTO;
  index: number;
  locale: string;
  labels: ReturnType<typeof useLabels>;
  onClick: () => void;
}

function useLabels() {
  return {
    views: '',
    clicks: '',
    noImageAlt: '',
    badgeFeatured: '',
    badgePremium: '',
  };
}

interface Labels {
  views: string;
  clicks: string;
  noImageAlt: string;
  badgeFeatured: string;
  badgePremium: string;
}

function FlyerCard({ flyer, index, locale, labels, onClick }: FlyerCardProps & { labels: Labels }) {
  const catInfo = FLYER_CATEGORIES[flyer.category];
  const isPremium = flyer.tier === 'PREMIUM';
  const isFeatured = flyer.tier === 'FEATURED';

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        'group relative rounded-xl overflow-hidden bg-card shadow-sm transition-shadow duration-300 cursor-pointer',
        'hover:shadow-lg hover:shadow-black/5',
        isPremium && 'ring-2 ring-amber-300/60',
        isFeatured && 'border-l-4 border-l-amber-400'
      )}
      onClick={onClick}
    >
      {/* ── Image Container ────────────────────────────── */}
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        {flyer.image ? (
          <img
            src={flyer.thumbnail || flyer.image}
            alt={flyer.businessName || labels.noImageAlt}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Newspaper className="size-12 text-muted-foreground/30" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Category Badge — top-left */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <Badge
            className="text-[10px] font-semibold px-2 py-0.5 h-5 shadow-sm backdrop-blur-sm"
            style={{
              backgroundColor: catInfo?.color + 'E6',
              color: '#fff',
              borderColor: 'transparent',
            }}
          >
            {isPremium || isFeatured ? null : catInfo && (
              <span className="flex items-center gap-1">
                {locale === 'es' ? catInfo.nameEs : catInfo.nameEn}
              </span>
            )}
            {(isPremium || isFeatured) && (
              <span className="flex items-center gap-1">
                {isFeatured && <Award className="size-3" />}
                {isPremium && <Zap className="size-3" />}
                {isFeatured ? labels.badgeFeatured : labels.badgePremium}
              </span>
            )}
          </Badge>
        </div>

        {/* Tier Badge — top-right (only for featured/premium) */}
        {(isPremium || isFeatured) && (
          <div className="absolute top-2.5 right-2.5 z-10">
            <Badge
              className={cn(
                'text-[10px] font-bold px-2 py-0.5 h-5 shadow-sm',
                isPremium
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-amber-500 text-white border-amber-500'
              )}
            >
              {isFeatured ? labels.badgeFeatured : labels.badgePremium}
            </Badge>
          </div>
        )}

        {/* Category badge below tier for premium/featured */}
        {(isPremium || isFeatured) && catInfo && (
          <div className="absolute top-10 left-2.5 z-10">
            <Badge
              className="text-[10px] font-semibold px-2 py-0.5 h-5 shadow-sm backdrop-blur-sm"
              style={{
                backgroundColor: catInfo.color + 'CC',
                color: '#fff',
                borderColor: 'transparent',
              }}
            >
              {locale === 'es' ? catInfo.nameEs : catInfo.nameEn}
            </Badge>
          </div>
        )}
      </div>

      {/* ── Info Section ────────────────────────────────── */}
      <div className="p-3.5 space-y-2">
        {/* Business name */}
        <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {flyer.businessName}
        </h3>

        {/* Municipality */}
        {flyer.municipality && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="size-3 shrink-0" />
            <span className="text-xs truncate">{flyer.municipality}</span>
          </div>
        )}

        {/* Valid dates */}
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <CalendarRange className="size-3 shrink-0" />
          <span className="text-xs">
            {formatDateRange(flyer.validFrom, flyer.validUntil, locale)}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 pt-1 text-muted-foreground">
          <span className="flex items-center gap-1 text-xs">
            <Eye className="size-3" />
            {flyer.viewCount} {labels.views}
          </span>
          <span className="flex items-center gap-1 text-xs">
            <MousePointerClick className="size-3" />
            {flyer.clickCount} {labels.clicks}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Flyer Detail Modal
// ─────────────────────────────────────────────────────────────

interface FlyerDetailModalProps {
  flyer: FlyerDTO;
  locale: string;
  labels: {
    views: string;
    clicks: string;
    noImageAlt: string;
    badgeFeatured: string;
    badgePremium: string;
    contactBusiness: string;
    phone: string;
    email: string;
    website: string;
    address: string;
    validFrom: string;
  };
  onClose: () => void;
}

function FlyerDetailModal({ flyer, locale, labels, onClose }: FlyerDetailModalProps) {
  const catInfo = FLYER_CATEGORIES[flyer.category];
  const isPremium = flyer.tier === 'PREMIUM';
  const isFeatured = flyer.tier === 'FEATURED';

  const contactMethods: { icon: typeof Phone; label: string; value?: string; href?: string }[] = [
    ...(flyer.businessPhone
      ? [{ icon: Phone, label: labels.phone, value: flyer.businessPhone, href: `tel:${flyer.businessPhone}` }]
      : []),
    ...(flyer.businessEmail
      ? [{ icon: Mail, label: labels.email, value: flyer.businessEmail, href: `mailto:${flyer.businessEmail}` }]
      : []),
    ...(flyer.businessWebsite
      ? [{ icon: Globe, label: labels.website, value: flyer.businessWebsite, href: flyer.businessWebsite }]
      : []),
  ];

  const handleContactClick = (href?: string) => {
    if (href) {
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <motion.div
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-background rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Close Button ─────────────────────────────── */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 flex items-center justify-center size-9 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors backdrop-blur-sm"
        >
          <X className="size-5" />
        </button>

        {/* ── Main Content ─────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Flyer Image */}
          <div className="relative bg-muted">
            {flyer.image ? (
              <img
                src={flyer.image}
                alt={flyer.businessName || labels.noImageAlt}
                className="w-full h-full object-cover md:min-h-[600px]"
              />
            ) : (
              <div className="w-full aspect-[3/4] md:aspect-auto md:min-h-[600px] flex items-center justify-center">
                <Newspaper className="size-20 text-muted-foreground/30" />
              </div>
            )}

            {/* Badges on image */}
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              <Badge
                className="text-xs font-semibold px-2.5 py-1 h-6 shadow-md"
                style={{
                  backgroundColor: catInfo?.color + 'E6',
                  color: '#fff',
                  borderColor: 'transparent',
                }}
              >
                {locale === 'es' ? catInfo?.nameEs : catInfo?.nameEn}
              </Badge>
              {(isPremium || isFeatured) && (
                <Badge
                  className={cn(
                    'text-xs font-bold px-2.5 py-1 h-6 shadow-md',
                    isPremium
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-amber-500 text-white border-amber-500'
                  )}
                >
                  {isFeatured ? (
                    <span className="flex items-center gap-1">
                      <Award className="size-3" />
                      {labels.badgeFeatured}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Zap className="size-3" />
                      {labels.badgePremium}
                    </span>
                  )}
                </Badge>
              )}
            </div>
          </div>

          {/* Info Panel */}
          <div className="p-5 md:p-8 flex flex-col gap-5">
            {/* Business name */}
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-foreground leading-snug">
                {flyer.businessName}
              </h2>
              {flyer.title && flyer.title !== flyer.businessName && (
                <p className="text-sm text-muted-foreground mt-1">{flyer.title}</p>
              )}
            </div>

            <Separator />

            {/* Business Details */}
            <div className="space-y-3">
              {flyer.businessAddress && (
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-foreground">{flyer.businessAddress}</span>
                </div>
              )}

              {flyer.municipality && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="size-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">{flyer.municipality}</span>
                </div>
              )}

              <div className="flex items-center gap-3 text-sm">
                <CalendarRange className="size-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">
                  {formatDateRange(flyer.validFrom, flyer.validUntil, locale)}
                </span>
              </div>
            </div>

            {flyer.description && (
              <>
                <Separator />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {flyer.description}
                </p>
              </>
            )}

            <Separator />

            {/* Contact Methods */}
            <div className="space-y-2.5">
              <h3 className="text-sm font-semibold text-foreground">
                {labels.contactBusiness}
              </h3>
              {contactMethods.length > 0 ? (
                <div className="space-y-2">
                  {contactMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.label}
                        onClick={() => handleContactClick(method.href)}
                        className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-sm group/item"
                      >
                        <Icon className="size-4 text-muted-foreground group-hover/item:text-primary transition-colors shrink-0" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs text-muted-foreground">
                            {method.label}
                          </span>
                          <span className="text-sm font-medium text-primary truncate group-hover/item:underline">
                            {method.value}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {locale === 'es'
                    ? 'Información de contacto no disponible'
                    : 'Contact information not available'}
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Eye className="size-3.5" />
                {flyer.viewCount} {labels.views}
              </span>
              <span className="flex items-center gap-1.5">
                <MousePointerClick className="size-3.5" />
                {flyer.clickCount} {labels.clicks}
              </span>
            </div>

            {/* CTA */}
            {contactMethods.length > 0 && (
              <Button
                onClick={() => handleContactClick(contactMethods[0]?.href)}
                className="w-full mt-auto"
                size="lg"
              >
                {labels.contactBusiness}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
