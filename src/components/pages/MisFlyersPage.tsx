// ═══════════════════════════════════════════════════════════════
// GRAN CANARIA CONECTA - MisFlyersPage
// Professional business flyer management dashboard
// ═══════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import {
  Home,
  Plus,
  Edit3,
  Trash2,
  Eye,
  MousePointerClick,
  Megaphone,
  Newspaper,
  CalendarRange,
  MapPin,
  Check,
  Loader2,
  AlertTriangle,
  FileText,
  Clock,
  Zap,
  Award,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useI18n } from '@/hooks/use-i18n';
import { navigateBack, navigateTo } from '@/hooks/use-navigation';
import { useModalStore } from '@/lib/modal-store';
import { formatNumber, getRelativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  FLYER_CATEGORIES,
  FLYER_PLANS,
  type FlyerDTO,
  type FlyerTier,
  type FlyerStatus,
  Locale,
} from '@/lib/types';

// ─── DB plan type (from /api/flyer-plans) ─────────────────
interface DBFlyerPlan {
  id: FlyerTier;
  nameEs: string;
  nameEn: string;
  badgeEs: string;
  badgeEn: string;
  color: string;
}

// ─────────────────────────────────────────────────────────────
// Constants & helpers
// ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<FlyerStatus, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  EXPIRED: 'bg-amber-100 text-amber-700',
  PAUSED: 'bg-gray-100 text-gray-600',
  DRAFT: 'bg-sky-100 text-sky-700',
};

function formatDateRange(from: string, until?: string, locale: Locale): string {
  const dFrom = new Date(from + 'T00:00:00');
  const dayFrom = dFrom.getDate();
  const monthFrom = locale === 'es'
    ? dFrom.toLocaleDateString('es-ES', { month: 'short' })
    : dFrom.toLocaleDateString('en-US', { month: 'short' });

  if (until) {
    const dUntil = new Date(until + 'T00:00:00');
    const dayUntil = dUntil.getDate();
    if (locale === 'es') return `Del ${dayFrom} al ${dayUntil} de ${monthFrom}`;
    return `${monthFrom} ${dayFrom} – ${dayUntil}`;
  }

  if (locale === 'es') return `Desde el ${dayFrom} de ${monthFrom}`;
  return `From ${monthFrom} ${dayFrom}`;
}

/** Inline i18n helper */
function t(es: string, en: string, locale: Locale): string {
  return locale === 'es' ? es : en;
}

// ─────────────────────────────────────────────────────────────
// Animation variants
// ─────────────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export function MisFlyersPage() {
  const { data: session, status } = useSession();
  const { locale } = useI18n();
  const openAuth = useModalStore((s) => s.openAuth);

  // ── Data State ────────────────────────────────────────────
  const [flyers, setFlyers] = useState<FlyerDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [dbPlans, setDbPlans] = useState<DBFlyerPlan[]>([]);

  // ── Delete dialog state ───────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<FlyerDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch flyers ──────────────────────────────────────────
  const fetchFlyers = useCallback(async () => {
    if (!session?.user?.id) { setLoading(false); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams({ mine: 'true', limit: '50' });
      if (activeTab !== 'all') params.set('status', activeTab.toUpperCase());
      const res = await fetch(`/api/flyers?${params}`);
      if (res.ok) {
        const data = await res.json();
        setFlyers(data.data || []);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [session?.user?.id, activeTab]);

  useEffect(() => { fetchFlyers(); }, [fetchFlyers]);

  // ── Fetch plans from database ─────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/flyer-plans');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setDbPlans(data);
          }
        }
      } catch { /* fallback to FLYER_PLANS */ }
    })();
  }, []);

  const plans = dbPlans.length > 0 ? dbPlans : FLYER_PLANS;

  // ── Derived stats ─────────────────────────────────────────
  const stats = useMemo(() => {
    const all = flyers;
    const active = all.filter((f) => f.status === 'ACTIVE').length;
    const drafts = all.filter((f) => f.status === 'DRAFT').length;
    const totalViews = all.reduce((sum, f) => sum + (f.viewCount || 0), 0);
    return { total: all.length, active, drafts, totalViews };
  }, [flyers]);

  // ── Handlers ──────────────────────────────────────────────
  const handleCreate = () => {
    useModalStore.getState().setEditingFlyerId(null);
    navigateTo('crear-folleto');
  };

  const handleEdit = (flyer: FlyerDTO) => {
    useModalStore.getState().setEditingFlyerId(flyer.id);
    navigateTo('crear-folleto');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/flyers?id=${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(t('Folleto eliminado', 'Flyer deleted', locale));
        setDeleteTarget(null);
        fetchFlyers();
      } else {
        toast.error(t('Error al eliminar', 'Failed to delete', locale));
      }
    } catch {
      toast.error(t('Error de conexión', 'Connection error', locale));
    } finally {
      setDeleting(false);
    }
  };

  // ── Filtered list by tab ─────────────────────────────────
  const filteredFlyers = useMemo(() => {
    if (activeTab === 'all') return flyers;
    return flyers.filter((f) => f.status === activeTab.toUpperCase());
  }, [flyers, activeTab]);

  // ── i18n Labels ───────────────────────────────────────────
  const l = useMemo(() => ({
    pageTitle: t('Mis Folletos', 'My Flyers', locale),
    pageDesc: t(
      'Gestiona tus folletos promocionales y alcanza a toda la comunidad de Gran Canaria.',
      'Manage your promotional flyers and reach the entire Gran Canaria community.',
      locale,
    ),
    createBtn: t('Crear Folleto', 'Create Flyer', locale),
    statTotal: t('Total Folletos', 'Total Flyers', locale),
    statActive: t('Activos', 'Active', locale),
    statDraft: t('En revisión', 'Under review', locale),
    statViews: t('Vistas totales', 'Total views', locale),
    tabAll: t('Todos', 'All', locale),
    tabActive: t('Activos', 'Active', locale),
    tabDraft: t('Borradores', 'Drafts', locale),
    tabExpired: t('Expirados', 'Expired', locale),
    emptyTitle: t('No tienes folletos todavía', 'No flyers yet', locale),
    emptyDesc: t(
      'Crea tu primer folleto promocional y llega a miles de personas en Gran Canaria.',
      'Create your first promotional flyer and reach thousands of people in Gran Canaria.',
      locale,
    ),
    emptyFiltered: t('No hay folletos en esta categoría', 'No flyers in this category', locale),
    views: t('vistas', 'views', locale),
    clicks: t('clics', 'clicks', locale),
    edit: t('Editar', 'Edit', locale),
    delete: t('Eliminar', 'Delete', locale),
    cancel: t('Cancelar', 'Cancel', locale),
    confirmDeleteTitle: t('¿Eliminar folleto?', 'Delete flyer?', locale),
    confirmDeleteDesc: t(
      'Esta acción desactivará tu folleto. No se podrá recuperar.',
      'This action will deactivate your flyer. It cannot be recovered.',
      locale,
    ),
    noImageAlt: t('Imagen del folleto', 'Flyer image', locale),
    statusActive: t('Activo', 'Active', locale),
    statusExpired: t('Expirado', 'Expired', locale),
    statusPaused: t('Pausado', 'Paused', locale),
    statusDraft: t('Borrador', 'Draft', locale),
    signIn: t('Inicia sesión', 'Sign in', locale),
    signInDesc: t(
      'Necesitas iniciar sesión para gestionar tus folletos.',
      'Sign in to manage your flyers.',
      locale),
  }), [locale]);

  // ── Loading session ───────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // ── Not authenticated ─────────────────────────────────────
  if (!session) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md mx-auto px-4 sm:px-6 py-16 text-center space-y-4"
      >
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <Megaphone className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        <h2 className="text-xl font-bold">{l.signIn}</h2>
        <p className="text-muted-foreground text-sm">{l.signInDesc}</p>
        <Button onClick={openAuth} className="bg-primary hover:bg-primary/90">
          {l.signIn}
        </Button>
      </motion.div>
    );
  }

  // ── Status label helper ───────────────────────────────────
  const getStatusLabel = (s: FlyerStatus) => {
    const map: Record<FlyerStatus, string> = {
      ACTIVE: l.statusActive,
      EXPIRED: l.statusExpired,
      PAUSED: l.statusPaused,
      DRAFT: l.statusDraft,
    };
    return map[s] || s;
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10"
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
                {t('Inicio', 'Home', locale)}
              </button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              <span className="flex items-center gap-1.5">
                <Megaphone className="size-4" />
                {l.pageTitle}
              </span>
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Megaphone className="size-7 text-primary" />
            {l.pageTitle}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
            {l.pageDesc}
          </p>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-semibold shadow-sm shrink-0"
          onClick={handleCreate}
        >
          <Plus className="size-4" />
          {l.createBtn}
        </Button>
      </div>

      {/* ── Stats Bar ───────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
        <Card className="py-4 px-4">
          <CardContent className="p-0 flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-full bg-primary/10 text-primary shrink-0">
              <FileText className="size-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-foreground leading-tight">
                {formatNumber(stats.total, locale)}
              </span>
              <span className="text-xs text-muted-foreground">{l.statTotal}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="py-4 px-4">
          <CardContent className="p-0 flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-full bg-emerald-100 text-emerald-600 shrink-0">
              <Check className="size-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-foreground leading-tight">
                {formatNumber(stats.active, locale)}
              </span>
              <span className="text-xs text-muted-foreground">{l.statActive}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="py-4 px-4">
          <CardContent className="p-0 flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-full bg-sky-100 text-sky-600 shrink-0">
              <Clock className="size-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-foreground leading-tight">
                {formatNumber(stats.drafts, locale)}
              </span>
              <span className="text-xs text-muted-foreground">{l.statDraft}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="py-4 px-4">
          <CardContent className="p-0 flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-full bg-violet-100 text-violet-600 shrink-0">
              <Eye className="size-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-foreground leading-tight">
                {formatNumber(stats.totalViews, locale)}
              </span>
              <span className="text-xs text-muted-foreground">{l.statViews}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Tabs ────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="all">{l.tabAll}</TabsTrigger>
          <TabsTrigger value="active">{l.tabActive}</TabsTrigger>
          <TabsTrigger value="draft">{l.tabDraft}</TabsTrigger>
          <TabsTrigger value="expired">{l.tabExpired}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* ── Loading Skeletons ───────────────────────────── */}
      {loading && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden border bg-card">
              <Skeleton className="aspect-[4/3] w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* ── Flyer Grid ──────────────────────────────────── */}
      {!loading && filteredFlyers.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          key={`flyers-${activeTab}`}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
        >
          {filteredFlyers.map((flyer, index) => (
            <motion.div key={flyer.id} variants={cardVariants}>
              <FlyerManagementCard
                flyer={flyer}
                locale={locale}
                labels={l}
                plans={plans}
                getStatusLabel={getStatusLabel}
                onEdit={() => handleEdit(flyer)}
                onDelete={() => setDeleteTarget(flyer)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ── Empty State ─────────────────────────────────── */}
      {!loading && filteredFlyers.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 py-16 px-4 text-center">
          <div className="flex items-center justify-center size-16 rounded-full bg-muted text-muted-foreground">
            <Newspaper className="size-8" />
          </div>
          <div className="flex flex-col gap-1.5 max-w-md">
            <h3 className="text-lg font-semibold text-foreground">
              {activeTab === 'all' ? l.emptyTitle : l.emptyFiltered}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {activeTab === 'all' ? l.emptyDesc : ''}
            </p>
          </div>
          {activeTab === 'all' && (
            <Button
              className="mt-2 bg-primary hover:bg-primary/90 gap-2"
              onClick={handleCreate}
            >
              <Plus className="size-4" />
              {l.createBtn}
            </Button>
          )}
        </div>
      )}

      {/* ── Delete Confirmation Dialog ──────────────────── */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              {l.confirmDeleteTitle}
            </DialogTitle>
            <DialogDescription>{l.confirmDeleteDesc}</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
            {deleteTarget?.image && (
              <img
                src={deleteTarget.thumbnail || deleteTarget.image}
                alt=""
                className="w-16 h-16 rounded-md object-cover shrink-0"
              />
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{deleteTarget?.title}</p>
              <p className="text-xs text-muted-foreground truncate">{deleteTarget?.businessName}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              {l.cancel}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="size-4 animate-spin mr-2" /> : <Trash2 className="size-4 mr-2" />}
              {l.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// FlyerManagementCard
// ═══════════════════════════════════════════════════════════════

interface FlyerManagementCardProps {
  flyer: FlyerDTO;
  locale: Locale;
  labels: Record<string, string>;
  plans: DBFlyerPlan[] | typeof FLYER_PLANS;
  getStatusLabel: (s: FlyerStatus) => string;
  onEdit: () => void;
  onDelete: () => void;
}

function FlyerManagementCard({
  flyer,
  locale,
  labels,
  plans,
  getStatusLabel,
  onEdit,
  onDelete,
}: FlyerManagementCardProps) {
  const catInfo = FLYER_CATEGORIES[flyer.category];
  const isPremium = flyer.tier === 'PREMIUM';
  const isFeatured = flyer.tier === 'FEATURED';

  const tierLabel = useMemo(() => {
    const plan = plans.find((p) => p.id === flyer.tier);
    return plan ? (locale === 'es' ? plan.badgeEs : plan.badgeEn) : flyer.tier;
  }, [flyer.tier, locale, plans]);

  return (
    <Card className="overflow-hidden group hover:shadow-md transition-shadow duration-300">
      <CardContent className="p-0">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {flyer.image ? (
            <img
              src={flyer.thumbnail || flyer.image}
              alt={flyer.title || labels.noImageAlt}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Newspaper className="size-12 text-muted-foreground/30" />
            </div>
          )}

          {/* Status Badge — top left */}
          <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5">
            <Badge className={cn('text-[10px] font-semibold px-2 py-0.5 h-5 shadow-sm', STATUS_COLORS[flyer.status])}>
              {getStatusLabel(flyer.status)}
            </Badge>
          </div>

          {/* Tier Badge — top right */}
          <div className="absolute top-2.5 right-2.5 z-10 flex flex-col gap-1.5">
            <Badge
              className={cn(
                'text-[10px] font-bold px-2 py-0.5 h-5 shadow-sm border',
                isPremium
                  ? 'bg-orange-500 text-white border-orange-500'
                  : isFeatured
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-gray-500 text-white border-gray-500',
              )}
            >
              {isFeatured && <Award className="size-3 mr-0.5" />}
              {isPremium && <Zap className="size-3 mr-0.5" />}
              {tierLabel}
            </Badge>
          </div>

          {/* Category badge — below status */}
          {catInfo && (
            <div className="absolute bottom-2.5 left-2.5 z-10">
              <Badge
                className="text-[10px] font-semibold px-2 py-0.5 h-5 shadow-sm backdrop-blur-sm"
                style={{ backgroundColor: catInfo.color + 'E6', color: '#fff', borderColor: 'transparent' }}
              >
                {locale === 'es' ? catInfo.nameEs : catInfo.nameEn}
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Title */}
          <h3 className="font-semibold text-sm leading-snug line-clamp-1 text-foreground">
            {flyer.title || flyer.businessName}
          </h3>

          {/* Business name if different */}
          {flyer.title && flyer.title !== flyer.businessName && (
            <p className="text-xs text-muted-foreground line-clamp-1">{flyer.businessName}</p>
          )}

          {/* Municipality + Date range */}
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            {flyer.municipality && (
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3 shrink-0" />
                {flyer.municipality}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <CalendarRange className="size-3 shrink-0" />
              {formatDateRange(flyer.validFrom, flyer.validUntil, locale)}
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="size-3" />
              {formatNumber(flyer.viewCount, locale)} {labels.views}
            </span>
            <span className="flex items-center gap-1">
              <MousePointerClick className="size-3" />
              {formatNumber(flyer.clickCount, locale)} {labels.clicks}
            </span>
            <span className="ml-auto text-[11px]">
              {getRelativeTime(flyer.createdAt, locale)}
            </span>
          </div>

          {/* Actions */}
          <Separator />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5 text-xs h-8"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
            >
              <Edit3 className="size-3.5" />
              {labels.edit}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5 text-xs h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            >
              <Trash2 className="size-3.5" />
              {labels.delete}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
