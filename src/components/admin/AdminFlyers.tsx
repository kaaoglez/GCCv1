'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useI18n } from '@/hooks/use-i18n';
import { getIcon } from '@/lib/icons';
import { formatNumber } from '@/lib/format';
import {
  FLYER_CATEGORIES,
  FLYER_PLANS,
  MUNICIPALITIES,
  type FlyerDTO,
  type FlyerCategory,
  type FlyerTier,
  type FlyerStatus,
} from '@/lib/types';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Eye,
  ImageIcon,
  Upload,
  X,
  Loader2,
  Megaphone,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

// ─────────────────────────────────────────────────────────────
// DB plan type (from /api/flyer-plans)
// ─────────────────────────────────────────────────────────────
interface DBFlyerPlan {
  id: FlyerTier;
  nameEs: string;
  nameEn: string;
  price: number;
  priceLabelEs: string;
  priceLabelEn: string;
  badgeEs: string;
  badgeEn: string;
  color: string;
  featuresEs: string[];
  featuresEn: string[];
  flyersPerWeek: number;
  isPopular: boolean;
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const FLYER_STATUSES: FlyerStatus[] = ['ACTIVE', 'EXPIRED', 'PAUSED', 'DRAFT'];
const EMPTY_FORM = {
  title: '',
  description: '',
  businessName: '',
  businessPhone: '',
  businessEmail: '',
  businessWebsite: '',
  businessAddress: '',
  municipality: '',
  category: 'OTHER' as FlyerCategory,
  image: '',
  thumbnail: '',
  validFrom: new Date().toISOString().split('T')[0],
  validUntil: '',
  tier: 'BASIC' as FlyerTier,
  status: 'DRAFT' as FlyerStatus,
  authorId: '',
};

// ─────────────────────────────────────────────────────────────
// Badge color helpers
// ─────────────────────────────────────────────────────────────

function tierBadgeStyle(tier: FlyerTier): React.CSSProperties {
  const colors: Record<FlyerTier, { backgroundColor: string; color: string }> = {
    BASIC: { backgroundColor: '#6B7280', color: '#ffffff' },
    FEATURED: { backgroundColor: '#F59E0B', color: '#ffffff' },
    PREMIUM: { backgroundColor: '#EA580C', color: '#ffffff' },
  };
  return colors[tier] || colors.BASIC;
}

function tierLabel(
  tier: FlyerTier,
  locale: 'es' | 'en',
  plans?: DBFlyerPlan[] | typeof FLYER_PLANS,
): string {
  const source = plans || FLYER_PLANS;
  const plan = source.find((p) => p.id === tier);
  if (!plan) return tier;
  return locale === 'es' ? plan.badgeEs : plan.badgeEn;
}

function statusBadgeStyle(status: FlyerStatus): React.CSSProperties {
  const colors: Record<FlyerStatus, { backgroundColor: string; color: string }> = {
    ACTIVE: { backgroundColor: '#059669', color: '#ffffff' },
    EXPIRED: { backgroundColor: '#DC2626', color: '#ffffff' },
    PAUSED: { backgroundColor: '#F59E0B', color: '#ffffff' },
    DRAFT: { backgroundColor: '#6B7280', color: '#ffffff' },
  };
  return colors[status] || colors.DRAFT;
}

function statusLabel(status: FlyerStatus, locale: 'es' | 'en'): string {
  const labels: Record<FlyerStatus, { es: string; en: string }> = {
    ACTIVE: { es: 'Activo', en: 'Active' },
    EXPIRED: { es: 'Expirado', en: 'Expired' },
    PAUSED: { es: 'Pausado', en: 'Paused' },
    DRAFT: { es: 'Borrador', en: 'Draft' },
  };
  return labels[status]?.[locale] || status;
}

function categoryColor(category: FlyerCategory): string {
  return FLYER_CATEGORIES[category]?.color || '#6B7280';
}

function categoryName(category: FlyerCategory, locale: 'es' | 'en'): string {
  const cat = FLYER_CATEGORIES[category];
  if (!cat) return category;
  return locale === 'es' ? cat.nameEs : cat.nameEn;
}

function categoryIcon(category: FlyerCategory): string {
  return FLYER_CATEGORIES[category]?.icon || 'store';
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export function AdminFlyers() {
  const { tp, locale } = useI18n();

  // ── Data state ──
  const [flyers, setFlyers] = useState<FlyerDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  // ── Filters ──
  const [searchInput, setSearchInput] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Form state ──
  const [formOpen, setFormOpen] = useState(false);
  const [editingFlyer, setEditingFlyer] = useState<FlyerDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FlyerDTO | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // ── Form fields ──
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [formErrors, setFormErrors] = useState<string[]>([]);

  // ── File input ref & drag state ──
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDragging = useRef(false);
  const [dragOver, setDragOver] = useState(false);

  // ── DB plans ──
  const [dbPlans, setDbPlans] = useState<DBFlyerPlan[]>([]);

  // Use DB plans if available, fallback to hardcoded
  const plans = dbPlans.length > 0 ? dbPlans : FLYER_PLANS;

  // ── Derived stats (uses dynamic plans) ──
  const stats = useMemo(() => {
    const active = flyers.filter((f) => f.status === 'ACTIVE').length;
    const expired = flyers.filter((f) => f.status === 'EXPIRED').length;
    const revenue = flyers
      .filter((f) => f.status === 'ACTIVE')
      .reduce((sum, f) => {
        const plan = plans.find((p) => p.id === f.tier);
        return sum + (plan?.price ?? 0);
      }, 0);
    return {
      total: flyers.length,
      active,
      expired,
      revenue,
    };
  }, [flyers, plans]);

  // ═══════════════════════════════════════════════════════════════
  // Fetch DB plans
  // ═══════════════════════════════════════════════════════════════
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
      } catch {
        /* fallback to FLYER_PLANS */
      }
    })();
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // Debounced search
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setSearchDebounced(searchInput);
      setPage(1);
    }, 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchInput]);

  // ═══════════════════════════════════════════════════════════════
  // Fetch flyers
  // ═══════════════════════════════════════════════════════════════
  const fetchFlyers = useCallback(() => {
    let cancelled = false;
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (searchDebounced) params.set('search', searchDebounced);
    if (categoryFilter) params.set('category', categoryFilter);
    if (statusFilter) params.set('status', statusFilter);

    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/flyers?${params}`);
        const data = await res.json();
        if (!cancelled) {
          setFlyers(Array.isArray(data.data) ? data.data : []);
          setTotal(data.total || 0);
          setTotalPages(data.totalPages || 1);
        }
      } catch (err) {
        console.error('[AdminFlyers fetch]', err);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [searchDebounced, categoryFilter, statusFilter, page, limit]);

  useEffect(() => {
    const cleanup = fetchFlyers();
    return cleanup;
  }, [fetchFlyers]);

  const reload = useCallback(() => {
    setPage((p) => p);
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // Form helpers
  // ═══════════════════════════════════════════════════════════════
  const openCreate = () => {
    setEditingFlyer(null);
    setForm({
      ...EMPTY_FORM,
      validFrom: new Date().toISOString().split('T')[0],
    });
    setFormErrors([]);
    setFormOpen(true);
  };

  const openEdit = (flyer: FlyerDTO) => {
    setEditingFlyer(flyer);
    setForm({
      title: flyer.title,
      description: flyer.description || '',
      businessName: flyer.businessName,
      businessPhone: flyer.businessPhone || '',
      businessEmail: flyer.businessEmail || '',
      businessWebsite: flyer.businessWebsite || '',
      businessAddress: flyer.businessAddress || '',
      municipality: flyer.municipality || '',
      category: flyer.category,
      image: flyer.image,
      thumbnail: flyer.thumbnail || '',
      validFrom: flyer.validFrom ? flyer.validFrom.split('T')[0] : '',
      validUntil: flyer.validUntil ? flyer.validUntil.split('T')[0] : '',
      tier: flyer.tier,
      status: flyer.status,
      authorId: flyer.authorId,
    });
    setFormErrors([]);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingFlyer(null);
    setFormErrors([]);
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];
    if (!form.title.trim())
      errors.push(
        locale === 'es' ? 'El título es obligatorio' : 'Title is required',
      );
    if (!form.businessName.trim())
      errors.push(
        locale === 'es'
          ? 'El nombre del negocio es obligatorio'
          : 'Business name is required',
      );
    if (!form.image)
      errors.push(
        locale === 'es' ? 'La imagen es obligatoria' : 'Image is required',
      );
    if (editingFlyer && !form.authorId.trim())
      errors.push(
        locale === 'es' ? 'El autor es obligatorio' : 'Author ID is required',
      );
    setFormErrors(errors);
    return errors.length === 0;
  };

  // ═══════════════════════════════════════════════════════════════
  // Image upload
  // ═══════════════════════════════════════════════════════════════
  const uploadImage = async (file: File) => {
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      setFormErrors([
        locale === 'es'
          ? 'Solo se permiten JPG, PNG y WebP'
          : 'Only JPG, PNG and WebP are allowed',
      ]);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setFormErrors([
        locale === 'es'
          ? 'La imagen no puede superar los 2MB'
          : 'Image cannot exceed 2MB',
      ]);
      return;
    }

    setUploading(true);
    setFormErrors([]);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) {
        setForm((prev) => ({ ...prev, image: data.url }));
      } else {
        setFormErrors([
          locale === 'es'
            ? 'Error al subir la imagen'
            : 'Error uploading image',
        ]);
      }
    } catch {
      setFormErrors([
        locale === 'es'
          ? 'Error de conexión al subir'
          : 'Connection error uploading',
      ]);
    }
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    isDragging.current = false;
    const file = e.dataTransfer.files?.[0];
    if (file) uploadImage(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isDragging.current) {
      isDragging.current = true;
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    isDragging.current = false;
    setDragOver(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadImage(file);
  };

  // ═══════════════════════════════════════════════════════════════
  // Save (create or update)
  // ═══════════════════════════════════════════════════════════════
  const handleSave = async () => {
    if (!validateForm()) return;
    setActionLoading(true);

    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        businessName: form.businessName.trim(),
        businessPhone: form.businessPhone.trim() || undefined,
        businessEmail: form.businessEmail.trim() || undefined,
        businessWebsite: form.businessWebsite.trim() || undefined,
        businessAddress: form.businessAddress.trim() || undefined,
        municipality: form.municipality || undefined,
        category: form.category,
        image: form.image,
        thumbnail: form.thumbnail || undefined,
        validFrom: form.validFrom || new Date().toISOString(),
        validUntil: form.validUntil || undefined,
        tier: form.tier,
      };

      if (editingFlyer) {
        payload.id = editingFlyer.id;
        payload.status = form.status;
        payload.authorId = form.authorId;
        const res = await fetch('/api/admin/flyers', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          setFormErrors([
            data?.error ||
              (locale === 'es' ? 'Error al guardar' : 'Error saving'),
          ]);
          setActionLoading(false);
          return;
        }
      } else {
        payload.status = form.status;
        payload.authorId = form.authorId || 'admin';
        const res = await fetch('/api/admin/flyers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          setFormErrors([
            data?.error ||
              (locale === 'es' ? 'Error al crear' : 'Error creating'),
          ]);
          setActionLoading(false);
          return;
        }
      }

      closeForm();
      reload();
    } catch {
      setFormErrors([
        locale === 'es' ? 'Error de conexión' : 'Connection error',
      ]);
    }
    setActionLoading(false);
  };

  // ═══════════════════════════════════════════════════════════════
  // Delete (optimistic)
  // ═══════════════════════════════════════════════════════════════
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);

    const previousFlyers = [...flyers];

    // Optimistic removal
    setFlyers((prev) => prev.filter((f) => f.id !== deleteTarget.id));
    setDeleteTarget(null);

    try {
      const res = await fetch(`/api/admin/flyers?id=${deleteTarget.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        // Revert on error
        setFlyers(previousFlyers);
        console.error('[AdminFlyers delete] failed to delete');
      }
    } catch {
      setFlyers(previousFlyers);
      console.error('[AdminFlyers delete] connection error');
    }

    setActionLoading(false);
    reload();
  };

  // ═══════════════════════════════════════════════════════════════
  // Plan feature helpers
  // ═══════════════════════════════════════════════════════════════
  const getPlanFeatures = (planId: FlyerTier) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return [];
    return locale === 'es' ? plan.featuresEs : plan.featuresEn;
  };

  const getPlanName = (planId: FlyerTier) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return planId;
    return locale === 'es' ? plan.nameEs : plan.nameEn;
  };

  const getPlanPrice = (planId: FlyerTier) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return '';
    return locale === 'es' ? plan.priceLabelEs : plan.priceLabelEn;
  };

  const getPlanBadge = (planId: FlyerTier) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return '';
    return locale === 'es' ? plan.badgeEs : plan.badgeEn;
  };

  const getPlanColor = (planId: FlyerTier) => {
    const plan = plans.find((p) => p.id === planId);
    return plan?.color || '#6B7280';
  };

  const isPlanPopular = (planId: FlyerTier) => {
    const plan = plans.find((p) => p.id === planId);
    return plan?.isPopular || false;
  };

  const availableTiers: FlyerTier[] = plans.map((p) => p.id);

  // ═══════════════════════════════════════════════════════════════
  // Render: Full-page form
  // ═══════════════════════════════════════════════════════════════
  if (formOpen) {
    return (
      <div className="max-w-4xl mx-auto">
        {/* ── Breadcrumb-style header ── */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <button
            onClick={closeForm}
            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <ChevronRight className="size-4 rotate-180" />
            <span>
              {locale === 'es' ? 'Flyers' : 'Flyers'}
            </span>
          </button>
          <span className="text-muted-foreground/50">/</span>
          <span className="text-foreground font-medium">
            {editingFlyer
              ? locale === 'es'
                ? 'Editar Folleto'
                : 'Edit Flyer'
              : locale === 'es'
                ? 'Crear Folleto'
                : 'Create Flyer'}
          </span>
        </div>

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={closeForm}
              className="h-10 w-10 shrink-0"
            >
              <ArrowLeft className="size-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                {editingFlyer
                  ? locale === 'es'
                    ? 'Editar Folleto'
                    : 'Edit Flyer'
                  : locale === 'es'
                    ? 'Crear Folleto'
                    : 'Create Flyer'}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {editingFlyer
                  ? locale === 'es'
                    ? 'Modifica los datos del flyer. Los cambios se guardan inmediatamente.'
                    : 'Update the flyer details. Changes are saved immediately.'
                  : locale === 'es'
                    ? 'Rellena los datos para crear un nuevo flyer promocional.'
                    : 'Fill in the details to create a new promotional flyer.'}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={closeForm}
            disabled={actionLoading || uploading}
            className="shrink-0"
          >
            {tp('common.cancel')}
          </Button>
        </div>

        {/* ── Form Body ── */}
        <div className="space-y-8 pb-32">
          {/* ── Section 1: Flyer Info ── */}
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileText className="size-4 text-emerald-600" />
              {locale === 'es' ? 'Información del Folleto' : 'Flyer Information'}
            </h3>

            <div className="space-y-1.5">
              <Label>
                {locale === 'es' ? 'Título' : 'Title'}{' '}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={
                  locale === 'es'
                    ? 'Ej: Ofertas Semanales de Supermercado'
                    : 'e.g. Weekly Supermarket Deals'
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>
                {locale === 'es' ? 'Descripción' : 'Description'}
              </Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder={
                  locale === 'es'
                    ? 'Describe brevemente las ofertas...'
                    : 'Briefly describe the deals...'
                }
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>{locale === 'es' ? 'Categoría' : 'Category'}</Label>
                <Select
                  value={form.category}
                  onValueChange={(val) =>
                    setForm({ ...form, category: val as FlyerCategory })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {(Object.keys(FLYER_CATEGORIES) as FlyerCategory[]).map(
                      (cat) => (
                        <SelectItem key={cat} value={cat}>
                          <div className="flex items-center gap-2">
                            <span
                              className="size-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: categoryColor(cat) }}
                            />
                            {categoryName(cat, locale)}
                          </div>
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>
                  {locale === 'es' ? 'Válido desde' : 'Valid from'}
                </Label>
                <Input
                  type="date"
                  value={form.validFrom}
                  onChange={(e) =>
                    setForm({ ...form, validFrom: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label>
                  {locale === 'es' ? 'Válido hasta' : 'Valid until'}
                </Label>
                <Input
                  type="date"
                  value={form.validUntil}
                  onChange={(e) =>
                    setForm({ ...form, validUntil: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* ── Section 2: Tier / Plan Selector ── */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-600" />
              {locale === 'es' ? 'Plan del Folleto' : 'Flyer Plan'}
            </h3>

            <div
              className={`grid gap-3 ${availableTiers.length <= 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'}`}
            >
              {availableTiers.map((planId) => {
                const isSelected = form.tier === planId;
                const color = getPlanColor(planId);
                const popular = isPlanPopular(planId);

                return (
                  <button
                    key={planId}
                    type="button"
                    onClick={() => setForm({ ...form, tier: planId })}
                    className={
                      'relative flex flex-col items-start rounded-xl border-2 p-4 text-left transition-all duration-200 hover:shadow-md cursor-pointer ' +
                      (isSelected
                        ? 'shadow-md bg-card'
                        : 'bg-card/60 opacity-80 hover:opacity-100')
                    }
                    style={{
                      borderColor: isSelected ? '#059669' : 'var(--border)',
                    }}
                  >
                    {/* Popular badge */}
                    {popular && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                        {locale === 'es' ? 'Popular' : 'Popular'}
                      </span>
                    )}

                    {/* Check mark for selected */}
                    {isSelected && (
                      <div className="absolute top-3 right-3 flex items-center justify-center size-5 rounded-full bg-emerald-600 text-white">
                        <Check className="size-3" />
                      </div>
                    )}

                    {/* Plan name + price */}
                    <div className="flex flex-col gap-1 mb-3">
                      <span className="font-semibold text-sm text-foreground">
                        {getPlanName(planId)}
                      </span>
                      <span className="text-lg font-bold" style={{ color }}>
                        {getPlanPrice(planId)}
                      </span>
                    </div>

                    {/* Features */}
                    <ul className="space-y-1.5 flex-1">
                      {getPlanFeatures(planId).map((feature, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-xs text-muted-foreground"
                        >
                          <Check
                            className="size-3.5 shrink-0 mt-0.5"
                            style={{ color }}
                          />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Badge */}
                    <Badge
                      className="mt-3 text-[10px] font-bold self-start"
                      style={{
                        backgroundColor: color,
                        color: '#fff',
                        borderColor: color,
                      }}
                    >
                      {getPlanBadge(planId)}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* ── Section 3: Image Upload ── */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ImageIcon className="size-4 text-emerald-600" />
              {locale === 'es' ? 'Imagen del Folleto' : 'Flyer Image'}
            </h3>

            {form.image ? (
              <div className="relative rounded-xl overflow-hidden border bg-muted group/img">
                <img
                  src={form.image}
                  alt={form.title}
                  className="w-full max-h-72 object-contain bg-muted"
                />
                <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover/img:opacity-100">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="size-3.5" />
                    {locale === 'es' ? 'Cambiar imagen' : 'Change image'}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => setForm({ ...form, image: '' })}
                  >
                    <X className="size-3.5" />
                    {locale === 'es' ? 'Eliminar imagen' : 'Remove image'}
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={
                  'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 cursor-pointer transition-colors ' +
                  (dragOver
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
                    : 'border-muted-foreground/30 hover:border-emerald-400 hover:bg-muted/50')
                }
              >
                {uploading ? (
                  <>
                    <Loader2 className="size-8 text-emerald-600 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      {locale === 'es'
                        ? 'Subiendo imagen...'
                        : 'Uploading image...'}
                    </span>
                  </>
                ) : (
                  <>
                    <div
                      className={
                        'flex items-center justify-center size-12 rounded-full ' +
                        (dragOver
                          ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40'
                          : 'bg-muted text-muted-foreground')
                      }
                    >
                      <Upload className="size-6" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">
                        {locale === 'es'
                          ? 'Arrastra tu imagen aquí'
                          : 'Drag your image here'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {locale === 'es' ? 'o' : 'or'}
                      </p>
                      <p className="text-xs text-emerald-600 font-medium mt-1">
                        {locale === 'es'
                          ? 'Busca en tu dispositivo'
                          : 'Browse your device'}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        JPG, PNG, WebP —{' '}
                        {locale === 'es' ? 'Máximo 2MB' : 'Max 2MB'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileInput}
              disabled={uploading}
            />
          </div>

          <Separator />

          {/* ── Section 4: Business Info ── */}
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Megaphone className="size-4 text-emerald-600" />
              {locale === 'es'
                ? 'Información del Negocio'
                : 'Business Information'}
            </h3>

            <div className="space-y-1.5">
              <Label>
                {locale === 'es' ? 'Nombre del negocio' : 'Business name'}{' '}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.businessName}
                onChange={(e) =>
                  setForm({ ...form, businessName: e.target.value })
                }
                placeholder={
                  locale === 'es'
                    ? 'Ej: Supermercados Canarias'
                    : 'e.g. Canarias Supermarkets'
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{locale === 'es' ? 'Teléfono' : 'Phone'}</Label>
                <Input
                  value={form.businessPhone}
                  onChange={(e) =>
                    setForm({ ...form, businessPhone: e.target.value })
                  }
                  placeholder="+34 600 000 000"
                  type="tel"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  value={form.businessEmail}
                  onChange={(e) =>
                    setForm({ ...form, businessEmail: e.target.value })
                  }
                  placeholder="info@ejemplo.com"
                  type="email"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{locale === 'es' ? 'Sitio web' : 'Website'}</Label>
                <Input
                  value={form.businessWebsite}
                  onChange={(e) =>
                    setForm({ ...form, businessWebsite: e.target.value })
                  }
                  placeholder="https://www.ejemplo.com"
                  type="url"
                />
              </div>

              <div className="space-y-1.5">
                <Label>{locale === 'es' ? 'Municipio' : 'Municipality'}</Label>
                <Select
                  value={form.municipality}
                  onValueChange={(val) =>
                    setForm({ ...form, municipality: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        locale === 'es' ? 'Seleccionar...' : 'Select...'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {MUNICIPALITIES.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{locale === 'es' ? 'Dirección' : 'Address'}</Label>
              <Input
                value={form.businessAddress}
                onChange={(e) =>
                  setForm({ ...form, businessAddress: e.target.value })
                }
                placeholder={
                  locale === 'es'
                    ? 'Calle, número, barrio...'
                    : 'Street, number, neighborhood...'
                }
              />
            </div>
          </div>

          <Separator />

          {/* ── Section 5: Status (edit only) ── */}
          {editingFlyer && (
            <div className="space-y-5">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <AlertTriangle className="size-4 text-amber-500" />
                {locale === 'es'
                  ? 'Estado y Configuración'
                  : 'Status & Configuration'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{locale === 'es' ? 'Estado' : 'Status'}</Label>
                  <Select
                    value={form.status}
                    onValueChange={(val) =>
                      setForm({ ...form, status: val as FlyerStatus })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FLYER_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          <div className="flex items-center gap-2">
                            <Badge
                              className="border-transparent text-[10px] px-1.5 py-0"
                              style={statusBadgeStyle(s)}
                            >
                              {statusLabel(s, locale)}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Author ID</Label>
                  <Input
                    value={form.authorId}
                    onChange={(e) =>
                      setForm({ ...form, authorId: e.target.value })
                    }
                    placeholder="cuid..."
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Form Errors ── */}
          {formErrors.length > 0 && (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
              {formErrors.map((err, i) => (
                <p
                  key={i}
                  className="text-sm text-destructive flex items-center gap-1.5"
                >
                  <AlertTriangle className="size-3.5 shrink-0" />
                  {err}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* ── Sticky Bottom Bar ── */}
        <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t z-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={closeForm}
              disabled={actionLoading || uploading}
            >
              {tp('common.cancel')}
            </Button>
            <Button
              onClick={handleSave}
              disabled={actionLoading || uploading}
              className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-white gap-2 min-w-[140px]"
            >
              {actionLoading || uploading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {uploading
                    ? locale === 'es'
                      ? 'Subiendo...'
                      : 'Uploading...'
                    : locale === 'es'
                      ? 'Guardando...'
                      : 'Saving...'}
                </>
              ) : (
                <>
                  <CheckCircle className="size-4" />
                  {editingFlyer
                    ? tp('common.save')
                    : locale === 'es'
                      ? 'Crear Folleto'
                      : 'Create Flyer'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // Render: Table / List view
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* ═══ STATS BAR ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <FileText className="size-4" />
              <span className="text-xs font-medium">
                {locale === 'es' ? 'Total flyers' : 'Total flyers'}
              </span>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#1a2e1a' }}>
              {formatNumber(stats.total, locale)}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-emerald-600 mb-2">
              <CheckCircle className="size-4" />
              <span className="text-xs font-medium">
                {locale === 'es' ? 'Activos' : 'Active'}
              </span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">
              {formatNumber(stats.active, locale)}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <Clock className="size-4" />
              <span className="text-xs font-medium">
                {locale === 'es' ? 'Expirados' : 'Expired'}
              </span>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {formatNumber(stats.expired, locale)}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-primary mb-2">
              <DollarSign className="size-4" />
              <span className="text-xs font-medium">
                {locale === 'es' ? 'Ingresos totales' : 'Total revenue'}
              </span>
            </div>
            <p className="text-2xl font-bold text-primary">
              €{formatNumber(stats.revenue, locale)}
              <span className="text-sm font-normal text-muted-foreground">
                /mo
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ═══ TOOLBAR ═══ */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <Button
          size="sm"
          onClick={openCreate}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
        >
          <Plus className="size-4 mr-2" />
          {locale === 'es' ? 'Crear Flyer' : 'Create Flyer'}
        </Button>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={
              locale === 'es' ? 'Buscar flyers...' : 'Search flyers...'
            }
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={categoryFilter || '__all__'}
            onValueChange={(val) => {
              setCategoryFilter(val === '__all__' ? '' : val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-auto min-w-[140px] h-9 text-sm">
              <SelectValue
                placeholder={locale === 'es' ? 'Categoría' : 'Category'}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">
                {locale === 'es'
                  ? 'Todas las categorías'
                  : 'All categories'}
              </SelectItem>
              {(Object.keys(FLYER_CATEGORIES) as FlyerCategory[]).map(
                (cat) => (
                  <SelectItem key={cat} value={cat}>
                    <div className="flex items-center gap-2">
                      {getIcon(categoryIcon(cat), 'size-3.5', 14)}
                      {categoryName(cat, locale)}
                    </div>
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>

          <Select
            value={statusFilter || '__all__'}
            onValueChange={(val) => {
              setStatusFilter(val === '__all__' ? '' : val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-auto min-w-[120px] h-9 text-sm">
              <SelectValue
                placeholder={locale === 'es' ? 'Estado' : 'Status'}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">
                {locale === 'es' ? 'Todos' : 'All'}
              </SelectItem>
              {FLYER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {statusLabel(s, locale)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ═══ RESULTS INFO ═══ */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {locale === 'es' ? 'Mostrando' : 'Showing'} {flyers.length}{' '}
          {locale === 'es' ? 'de' : 'of'} {formatNumber(total, locale)}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="h-8 w-8"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="px-2 text-sm">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="h-8 w-8"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* ═══ FLYERS TABLE ═══ */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted text-muted-foreground">
                <th className="text-left px-4 py-3 font-medium min-w-[280px]">
                  {locale === 'es' ? 'Flyer' : 'Flyer'}
                </th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">
                  {locale === 'es' ? 'Negocio' : 'Business'}
                </th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">
                  {locale === 'es' ? 'Categoría' : 'Category'}
                </th>
                <th className="text-left px-4 py-3 font-medium">Tier</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">
                  {locale === 'es' ? 'Estado' : 'Status'}
                </th>
                <th className="text-left px-4 py-3 font-medium hidden xl:table-cell">
                  {locale === 'es' ? 'Vigencia' : 'Validity'}
                </th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">
                  {locale === 'es' ? 'Vistas' : 'Views'}
                </th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">
                  Clicks
                </th>
                <th className="text-right px-4 py-3 font-medium w-20">
                  {locale === 'es' ? 'Acciones' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Skeleton className="size-[45px] rounded-lg shrink-0" />
                          <Skeleton className="h-4 w-40" />
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <Skeleton className="h-4 w-28" />
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <Skeleton className="h-4 w-10" />
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <Skeleton className="h-4 w-10" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-8 w-16 ml-auto" />
                      </td>
                    </tr>
                  ))
                : flyers.length === 0
                  ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-4 py-16 text-center"
                        >
                          <div className="flex flex-col items-center gap-3">
                            <Megaphone className="size-12 text-muted-foreground/30" />
                            <p className="text-muted-foreground">
                              {locale === 'es'
                                ? 'No se encontraron flyers'
                                : 'No flyers found'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )
                  : flyers.map((flyer) => (
                      <tr
                        key={flyer.id}
                        className="border-b hover:bg-muted/30 transition-colors"
                      >
                        {/* Thumbnail + Title */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {flyer.thumbnail || flyer.image ? (
                              <img
                                src={flyer.thumbnail || flyer.image}
                                alt=""
                                className="size-[45px] rounded-lg object-cover shrink-0 bg-muted"
                              />
                            ) : (
                              <div className="size-[45px] rounded-lg bg-muted flex items-center justify-center shrink-0">
                                <ImageIcon className="size-4 text-muted-foreground" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p
                                className="font-semibold truncate max-w-[220px]"
                                style={{ color: '#1a2e1a' }}
                              >
                                {flyer.title}
                              </p>
                              <p className="text-xs text-muted-foreground md:hidden">
                                {flyer.businessName}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5 md:hidden">
                                <Badge
                                  className="border-transparent text-[10px] px-1.5 py-0"
                                  style={tierBadgeStyle(flyer.tier)}
                                >
                                  {tierLabel(
                                    flyer.tier,
                                    locale,
                                    plans,
                                  )}
                                </Badge>
                                <Badge
                                  className="border-transparent text-[10px] px-1.5 py-0"
                                  style={statusBadgeStyle(flyer.status)}
                                >
                                  {statusLabel(flyer.status, locale)}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Business name */}
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                          <span className="truncate block max-w-[160px]">
                            {flyer.businessName}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <Badge
                            className="border-transparent text-xs"
                            style={{
                              backgroundColor:
                                categoryColor(flyer.category) + '18',
                              color: categoryColor(flyer.category),
                            }}
                          >
                            <span className="flex items-center gap-1.5">
                              {getIcon(
                                categoryIcon(flyer.category),
                                'size-3',
                                12,
                              )}
                              {categoryName(flyer.category, locale)}
                            </span>
                          </Badge>
                        </td>

                        {/* Tier */}
                        <td className="px-4 py-3">
                          <Badge
                            className="border-transparent text-xs"
                            style={tierBadgeStyle(flyer.tier)}
                          >
                            {tierLabel(flyer.tier, locale, plans)}
                          </Badge>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <Badge
                            className="border-transparent text-xs"
                            style={statusBadgeStyle(flyer.status)}
                          >
                            {statusLabel(flyer.status, locale)}
                          </Badge>
                        </td>

                        {/* Validity dates */}
                        <td className="px-4 py-3 hidden xl:table-cell">
                          <div className="text-xs text-muted-foreground">
                            <span>
                              {flyer.validFrom?.split('T')[0]}
                            </span>
                            {flyer.validUntil && (
                              <>
                                <span className="mx-1">→</span>
                                <span>
                                  {flyer.validUntil.split('T')[0]}
                                </span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Views */}
                        <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                          <div className="flex items-center gap-1">
                            <Eye className="size-3" />
                            <span>
                              {formatNumber(flyer.viewCount, locale)}
                            </span>
                          </div>
                        </td>

                        {/* Clicks */}
                        <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                          {formatNumber(flyer.clickCount, locale)}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEdit(flyer)}
                              title={
                                locale === 'es' ? 'Editar' : 'Edit'
                              }
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteTarget(flyer)}
                              title={
                                locale === 'es'
                                  ? 'Expirar'
                                  : 'Expire'
                              }
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ═══ DELETE CONFIRMATION DIALOG ═══ */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {locale === 'es' ? 'Expirar Flyer' : 'Expire Flyer'}
            </DialogTitle>
            <DialogDescription>
              {locale === 'es'
                ? '¿Estás seguro de que quieres expirar este flyer?'
                : 'Are you sure you want to expire this flyer?'}
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <div className="p-3 rounded-lg bg-muted/50 border space-y-2">
              <div className="flex items-center gap-3">
                {deleteTarget.thumbnail || deleteTarget.image ? (
                  <img
                    src={deleteTarget.thumbnail || deleteTarget.image}
                    alt=""
                    className="size-12 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="size-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <ImageIcon className="size-4 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0">
                  <p
                    className="font-semibold text-sm truncate"
                    style={{ color: '#1a2e1a' }}
                  >
                    {deleteTarget.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {deleteTarget.businessName}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={actionLoading}
            >
              {tp('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  ...
                </>
              ) : (
                <>
                  <Trash2 className="size-4 mr-2" />
                  {locale === 'es' ? 'Expirar' : 'Expire'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
