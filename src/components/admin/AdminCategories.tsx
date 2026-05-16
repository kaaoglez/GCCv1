'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useI18n } from '@/hooks/use-i18n';
import { getIcon } from '@/lib/icons';
import { ICON_LIST } from '@/lib/icons';
import {
  Pencil,
  Search,
  DollarSign,
  Save,
  X,
  AlertCircle,
  Tag,
  ToggleLeft,
  ImagePlus,
  BarChart3,
  Clock,
  Eye,
  EyeOff,
  Package,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { CategoryDTO } from '@/lib/types';

interface AdminCategoryDTO extends CategoryDTO {
  revenue: number;
  children?: AdminCategoryDTO[];
}

// ═══════════════════════════════════════════════════════════════
// Default form values for create / edit
// ═══════════════════════════════════════════════════════════════
const DEFAULT_FORM = {
  nameEs: '',
  nameEn: '',
  icon: '',
  color: '#6366f1',
  isActive: true,
  isPaid: false,
  price: null as number | null,
  sortOrder: 0,
  expiryDays: 30,
  maxImages: 5,
  showPrice: true,
  showLocation: true,
  showImages: true,
  parentId: null as string | null,
};

type CategoryForm = typeof DEFAULT_FORM;

// ═══════════════════════════════════════════════════════════════
// Shared category form used in both Create & Edit dialogs
// ═══════════════════════════════════════════════════════════════
function CategoryFormFields({
  form,
  setForm,
  locale,
  parentOptions,
  isCreate,
}: {
  form: CategoryForm;
  setForm: React.Dispatch<React.SetStateAction<CategoryForm>>;
  locale: string;
  parentOptions: { id: string; nameEs: string; nameEn: string }[];
  isCreate: boolean;
}) {
  const L = (es: string, en: string) => (locale === 'es' ? es : en);

  return (
    <div className="space-y-5">
      {/* ── Names ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Nombre (ES) *</Label>
          <Input
            value={form.nameEs}
            onChange={(e) => setForm((f) => ({ ...f, nameEs: e.target.value }))}
            placeholder="Ej: Vehículos"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Nombre (EN) *</Label>
          <Input
            value={form.nameEn}
            onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
            placeholder="Eg: Vehicles"
          />
        </div>
      </div>

      {/* ── Parent (create only, optional) ── */}
      {isCreate && parentOptions.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">
            {L('Categoría padre (opcional)', 'Parent category (optional)')}
          </Label>
          <select
            value={form.parentId ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value || null }))}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">— {L('Raíz (sin padre)', 'Root (no parent)')} —</option>
            {parentOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {locale === 'es' ? p.nameEs : p.nameEn}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ── Icon & Color ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Icono</Label>
          <div className="flex items-center gap-2">
            {form.icon && (
              <div
                className="flex items-center justify-center size-9 rounded-lg shrink-0"
                style={{ backgroundColor: form.color + '20', color: form.color }}
              >
                {getIcon(form.icon, undefined, 18)}
              </div>
            )}
            <Select
              value={form.icon}
              onValueChange={(val) => setForm((f) => ({ ...f, icon: val }))}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Seleccionar icono" />
              </SelectTrigger>
              <SelectContent className="max-h-64 overflow-y-auto">
                {ICON_LIST.map((icon) => (
                  <SelectItem key={icon.value} value={icon.value}>
                    <span className="flex items-center gap-2">
                      {getIcon(icon.value, undefined, 16)}
                      <span>{icon.label}</span>
                      <span className="text-muted-foreground text-xs ml-1">{icon.value}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Color</Label>
          <div className="flex gap-2">
            <Input
              value={form.color}
              onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
              placeholder="#6366f1"
            />
            <div
              className="w-10 h-10 rounded-lg border shrink-0"
              style={{ backgroundColor: form.color }}
            />
          </div>
        </div>
      </div>

      {/* ── Order, Expiry, Max Images ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">{L('Orden', 'Order')}</Label>
          <Input
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">{L('Días expiración', 'Expiry days')}</Label>
          <Input
            type="number"
            value={form.expiryDays}
            onChange={(e) => setForm((f) => ({ ...f, expiryDays: parseInt(e.target.value) || 30 }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">{L('Max imágenes', 'Max images')}</Label>
          <Input
            type="number"
            value={form.maxImages}
            onChange={(e) => setForm((f) => ({ ...f, maxImages: parseInt(e.target.value) || 5 }))}
          />
        </div>
      </div>

      {/* ── Display settings ── */}
      <div className="space-y-3 p-3 rounded-lg bg-muted/40 border">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {L('Configuración de visualización', 'Display settings')}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="size-3.5 text-muted-foreground" />
            <Label className="text-sm">{L('Mostrar precio', 'Show price')}</Label>
          </div>
          <Switch checked={form.showPrice} onCheckedChange={(v) => setForm((f) => ({ ...f, showPrice: v }))} />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="size-3.5 text-muted-foreground" />
            <Label className="text-sm">{L('Mostrar ubicación', 'Show location')}</Label>
          </div>
          <Switch checked={form.showLocation} onCheckedChange={(v) => setForm((f) => ({ ...f, showLocation: v }))} />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImagePlus className="size-3.5 text-muted-foreground" />
            <Label className="text-sm">{L('Mostrar imágenes', 'Show images')}</Label>
          </div>
          <Switch checked={form.showImages} onCheckedChange={(v) => setForm((f) => ({ ...f, showImages: v }))} />
        </div>
      </div>

      {/* ── Active toggle ── */}
      <div className="flex items-center justify-between p-3 rounded-lg border">
        <div className="flex items-center gap-2">
          {form.isActive ? (
            <Eye className="size-4 text-emerald-600" />
          ) : (
            <EyeOff className="size-4 text-muted-foreground" />
          )}
          <Label className="text-sm">{L('Categoría activa', 'Active category')}</Label>
        </div>
        <Switch checked={form.isActive} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
      </div>

      <Separator />

      {/* ── Payment section ── */}
      <div
        className={`space-y-3 p-4 rounded-xl border-2 transition-colors ${
          form.isPaid
            ? 'border-amber-300 bg-amber-50'
            : 'border-border'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className={`size-5 ${form.isPaid ? 'text-amber-600' : 'text-muted-foreground'}`} />
            <div>
              <Label className="text-sm font-semibold">{L('Categoría de pago', 'Paid category')}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                {L(
                  'El usuario deberá pagar para publicar en esta categoría',
                  'User must pay to publish in this category',
                )}
              </p>
            </div>
          </div>
          <Switch
            checked={form.isPaid}
            onCheckedChange={(v) => setForm((f) => ({ ...f, isPaid: v, price: v ? (f.price || 5) : null }))}
          />
        </div>

        {form.isPaid && (
          <div className="pt-3 border-t border-amber-200 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-amber-700">
                {L('Precio de publicación (€)', 'Publication price (€)')}
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">
                  €
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, price: parseFloat(e.target.value) || null }))}
                  placeholder="0.00"
                  className="h-12 pl-9 text-lg font-bold"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-100/60">
              <Clock className="size-4 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-700">
                {L(
                  'Puedes activar/desactivar el pago según tus campañas. Si desactivas, la categoría vuelve a ser gratuita automáticamente.',
                  'You can enable/disable payment based on your campaigns. Disabling makes the category free automatically.',
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════════════════
export function AdminCategories() {
  const { tp, locale } = useI18n();
  const L = (es: string, en: string) => (locale === 'es' ? es : en);

  // ── State ──
  const [categories, setCategories] = useState<AdminCategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CategoryForm>({ ...DEFAULT_FORM });
  const [editCat, setEditCat] = useState<AdminCategoryDTO | null>(null);
  const [editForm, setEditForm] = useState<CategoryForm>({ ...DEFAULT_FORM });
  const [deleteCat, setDeleteCat] = useState<AdminCategoryDTO | null>(null);

  // Loading / error
  const [actionLoading, setActionLoading] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // ── Stats ──
  const totalCategories = useMemo(() => {
    let count = categories.length;
    categories.forEach((p) => {
      count += (p.children || []).length;
    });
    return count;
  }, [categories]);

  const paidCategories = useMemo(() => {
    let count = categories.filter((c) => c.isPaid).length;
    categories.forEach((p) => {
      count += (p.children || []).filter((c) => c.isPaid).length;
    });
    return count;
  }, [categories]);

  const freeCategories = totalCategories - paidCategories;

  const totalRevenue = useMemo(
    () =>
      categories.reduce(
        (sum, p) =>
          sum + (p.revenue || 0) + (p.children || []).reduce((s, c) => s + (c.revenue || 0), 0),
        0,
      ),
    [categories],
  );

  // ── Fetch categories ──
  const refetch = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/categories');
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/categories');
        const data = await res.json();
        if (!cancelled) setCategories(Array.isArray(data) ? data : []);
      } catch {
        /* silent */
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Parent options for create dialog ──
  const parentOptions = useMemo(
    () =>
      categories
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((p) => ({ id: p.id, nameEs: p.nameEs, nameEn: p.nameEn })),
    [categories],
  );

  // ── Filtered parents ──
  const sortedParents = useMemo(
    () => [...categories].sort((a, b) => a.sortOrder - b.sortOrder),
    [categories],
  );

  const filteredParents = useMemo(() => {
    if (!search.trim()) return sortedParents;
    const q = search.toLowerCase();
    return sortedParents.filter((p) => {
      const nameMatch = p.nameEs.toLowerCase().includes(q) || p.nameEn.toLowerCase().includes(q);
      const childMatch = (p.children || []).some(
        (c) => c.nameEs.toLowerCase().includes(q) || c.nameEn.toLowerCase().includes(q),
      );
      return nameMatch || childMatch;
    });
  }, [sortedParents, search]);

  // ── Helper: update a category in local state ──
  const updateCategoryInState = (id: string, patch: Partial<AdminCategoryDTO>) => {
    setCategories((prev) =>
      prev.map((p) => {
        if (p.id === id) return { ...p, ...patch };
        const children = p.children?.map((c) => (c.id === id ? { ...c, ...patch } : c));
        return children ? { ...p, children } : p;
      }),
    );
  };

  // ═══════════════════════════════════════════════════════════
  // Actions
  // ═══════════════════════════════════════════════════════════

  // ── Toggle isPaid ──
  const toggleIsPaid = async (cat: AdminCategoryDTO) => {
    const newVal = !cat.isPaid;
    setTogglingId(cat.id);
    const patch: Partial<AdminCategoryDTO> = {
      isPaid: newVal,
      price: newVal && !cat.price ? 5 : cat.price,
    };
    updateCategoryInState(cat.id, patch);

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cat.id, ...patch }),
      });
      if (!res.ok) {
        updateCategoryInState(cat.id, { isPaid: !newVal, price: cat.price });
      }
    } catch {
      updateCategoryInState(cat.id, { isPaid: !newVal, price: cat.price });
    }
    setTogglingId(null);
  };

  // ── Toggle isActive ──
  const toggleIsActive = async (cat: AdminCategoryDTO) => {
    const newVal = !cat.isActive;
    updateCategoryInState(cat.id, { isActive: newVal });
    try {
      await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cat.id, isActive: newVal }),
      });
    } catch {
      /* silent */
    }
  };

  // ── Open edit ──
  const openEdit = (cat: AdminCategoryDTO) => {
    setSaveError('');
    setEditCat(cat);
    setEditForm({
      nameEs: cat.nameEs,
      nameEn: cat.nameEn,
      icon: cat.icon,
      color: cat.color,
      isActive: cat.isActive,
      isPaid: cat.isPaid,
      price: cat.price ?? null,
      sortOrder: cat.sortOrder,
      expiryDays: cat.expiryDays,
      maxImages: cat.maxImages,
      showPrice: cat.showPrice,
      showLocation: cat.showLocation,
      showImages: cat.showImages,
      parentId: null,
    });
  };

  // ── Open create ──
  const openCreate = () => {
    setSaveError('');
    setCreateForm({ ...DEFAULT_FORM });
    setCreateOpen(true);
  };

  // ── Handle create save ──
  const handleCreate = async () => {
    if (!createForm.nameEs.trim() || !createForm.nameEn.trim()) {
      setSaveError(L('Nombre ES y EN son obligatorios', 'Name ES and EN are required'));
      return;
    }
    setActionLoading(true);
    setSaveError('');
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameEs: createForm.nameEs,
          nameEn: createForm.nameEn,
          icon: createForm.icon || undefined,
          color: createForm.color,
          parentId: createForm.parentId || undefined,
          sortOrder: createForm.sortOrder,
          expiryDays: createForm.expiryDays,
          maxImages: createForm.maxImages,
          isPaid: createForm.isPaid,
          price: createForm.isPaid ? createForm.price : undefined,
          showPrice: createForm.showPrice,
          showLocation: createForm.showLocation,
          showImages: createForm.showImages,
          isActive: createForm.isActive,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setSaveError(data?.error || L('Error al crear categoría', 'Error creating category'));
        setActionLoading(false);
        return;
      }
      setCreateOpen(false);
      await refetch();
    } catch {
      setSaveError(L('Error de conexión', 'Connection error'));
    }
    setActionLoading(false);
  };

  // ── Handle edit save ──
  const handleSave = async () => {
    if (!editCat) return;
    setActionLoading(true);
    setSaveError('');
    try {
      const payload = {
        id: editCat.id,
        nameEs: editForm.nameEs,
        nameEn: editForm.nameEn,
        icon: editForm.icon,
        color: editForm.color,
        isActive: editForm.isActive,
        isPaid: editForm.isPaid,
        price: editForm.isPaid ? editForm.price : null,
        sortOrder: editForm.sortOrder,
        expiryDays: editForm.expiryDays,
        maxImages: editForm.maxImages,
        showPrice: editForm.showPrice,
        showLocation: editForm.showLocation,
        showImages: editForm.showImages,
      };
      const res = await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setSaveError(data?.error || L('Error al guardar', 'Error saving'));
        setActionLoading(false);
        return;
      }
      setEditCat(null);
      await refetch();
    } catch {
      setSaveError(L('Error de conexión', 'Connection error'));
    }
    setActionLoading(false);
  };

  // ── Handle delete ──
  const handleDelete = async () => {
    if (!deleteCat) return;
    setActionLoading(true);
    setDeleteError('');
    try {
      const res = await fetch(`/api/admin/categories?id=${deleteCat.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setDeleteError(
          data?.error || L('No se pudo eliminar la categoría', 'Could not delete category'),
        );
        setActionLoading(false);
        return;
      }
      setDeleteCat(null);
      await refetch();
    } catch {
      setDeleteError(L('Error de conexión', 'Connection error'));
    }
    setActionLoading(false);
  };

  // ═══════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="space-y-5">
      {/* ═══ STATS BAR ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Package className="size-4" />
            <span className="text-xs font-medium">{L('Total categorías', 'Total categories')}</span>
          </div>
          <p className="text-2xl font-bold">{totalCategories}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2 text-emerald-600">
            <ToggleLeft className="size-4" />
            <span className="text-xs font-medium">{L('Gratuitas', 'Free')}</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{freeCategories}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2 text-amber-600">
            <DollarSign className="size-4" />
            <span className="text-xs font-medium">{L('De pago', 'Paid')}</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{paidCategories}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <BarChart3 className="size-4" />
            <span className="text-xs font-medium">{L('Ingresos', 'Revenue')}</span>
          </div>
          <p className="text-2xl font-bold text-primary">€{totalRevenue.toFixed(0)}</p>
        </div>
      </div>

      {/* ═══ TOOLBAR ═══ */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={L('Buscar categoría...', 'Search category...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4 mr-1.5" />
          {L('Nueva categoría', 'New category')}
        </Button>
      </div>

      {/* ═══ GRID ═══ */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-52 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredParents.length === 0 ? (
        <div className="text-center py-16">
          <Search className="size-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">
            {L('No se encontraron categorías', 'No categories found')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredParents.map((parent) => {
            const children = parent.children || [];
            const isToggling = togglingId === parent.id;

            return (
              <div
                key={parent.id}
                className={`group relative rounded-xl border p-4 flex flex-col gap-3 transition-all hover:shadow-md ${
                  parent.isPaid
                    ? 'border-amber-200 bg-gradient-to-br from-amber-50/80 to-white'
                    : 'border-border bg-card'
                } ${!parent.isActive ? 'opacity-60' : ''}`}
              >
                {/* ── Card header: icon + name ── */}
                <div className="flex items-start gap-3">
                  <div
                    className="flex items-center justify-center size-10 rounded-xl shrink-0"
                    style={{ backgroundColor: parent.color + '18', color: parent.color }}
                  >
                    {getIcon(parent.icon, undefined, 20)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm leading-tight truncate">
                      {locale === 'es' ? parent.nameEs : parent.nameEn}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {locale === 'es' ? parent.nameEn : parent.nameEs}
                    </p>
                  </div>
                </div>

                {/* ── Badges ── */}
                <div className="flex flex-wrap gap-1.5">
                  {parent.isPaid && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
                      <DollarSign className="size-2.5 mr-0.5" />
                      {L('De pago', 'Paid')}
                      {parent.price ? ` €${parent.price.toFixed(2)}` : ''}
                    </Badge>
                  )}
                  {!parent.isActive && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                      <EyeOff className="size-2.5 mr-0.5" />
                      {L('Inactiva', 'Inactive')}
                    </Badge>
                  )}
                  {parent.isActive && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-50">
                      <Eye className="size-2.5 mr-0.5" />
                      {L('Activa', 'Active')}
                    </Badge>
                  )}
                </div>

                {/* ── Stats row ── */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>
                    {parent.listingCount || 0} {L('anuncios', 'listings')}
                  </span>
                  {parent.revenue > 0 && (
                    <span className="font-medium text-primary">€{parent.revenue.toFixed(2)}</span>
                  )}
                  {children.length > 0 && (
                    <span>
                      {children.length} {L('sub', 'sub')}
                    </span>
                  )}
                </div>

                {/* ── Children as pill badges ── */}
                {children.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {children.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => openEdit(child)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-muted/80 hover:bg-muted transition-colors text-foreground/80 max-w-full truncate"
                        title={`${child.nameEs} / ${child.nameEn} — ${child.listingCount || 0} ${L('anuncios', 'listings')}${child.isPaid ? ` — €${(child.price ?? 0).toFixed(2)}` : ''}`}
                      >
                        <span
                          className="size-2.5 rounded-sm shrink-0"
                          style={{ backgroundColor: child.color }}
                        />
                        <span className="truncate">
                          {locale === 'es' ? child.nameEs : child.nameEn}
                        </span>
                        {!child.isActive && (
                          <EyeOff className="size-2.5 text-muted-foreground shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* ── Card actions ── */}
                <div className="flex items-center gap-1 mt-auto pt-2 border-t border-border/60">
                  {/* isPaid toggle */}
                  <div className="relative mr-auto">
                    {isToggling && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="size-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    <Switch
                      checked={parent.isPaid}
                      onCheckedChange={() => toggleIsPaid(parent)}
                      className="scale-[0.85]"
                      disabled={isToggling}
                      title={L('Activar/desactivar pago', 'Toggle paid')}
                    />
                  </div>

                  {/* Toggle active */}
                  <button
                    onClick={() => toggleIsActive(parent)}
                    className="p-1.5 rounded-md hover:bg-muted transition-colors"
                    title={parent.isActive ? L('Desactivar', 'Deactivate') : L('Activar', 'Activate')}
                  >
                    {parent.isActive ? (
                      <Eye className="size-3.5 text-emerald-600" />
                    ) : (
                      <EyeOff className="size-3.5 text-muted-foreground/50" />
                    )}
                  </button>

                  {/* Edit */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => openEdit(parent)}
                    title={L('Editar categoría', 'Edit category')}
                  >
                    <Pencil className="size-3.5" />
                  </Button>

                  {/* Delete */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => {
                      setDeleteCat(parent);
                      setDeleteError('');
                    }}
                    disabled={children.length > 0 || (parent.listingCount ?? 0) > 0}
                    title={
                      children.length > 0
                        ? L('No se puede eliminar: tiene subcategorías', 'Cannot delete: has subcategories')
                        : (parent.listingCount ?? 0) > 0
                          ? L('No se puede eliminar: tiene anuncios', 'Cannot delete: has listings')
                          : L('Eliminar categoría', 'Delete category')
                    }
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ CREATE DIALOG ═══ */}
      <Dialog open={createOpen} onOpenChange={(v) => !v && setCreateOpen(false)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{L('Nueva categoría', 'New category')}</DialogTitle>
            <DialogDescription>
              {L(
                'Crea una nueva categoría para el directorio. Los campos con * son obligatorios.',
                'Create a new directory category. Fields marked with * are required.',
              )}
            </DialogDescription>
          </DialogHeader>

          <CategoryFormFields
            form={createForm}
            setForm={setCreateForm}
            locale={locale}
            parentOptions={parentOptions}
            isCreate
          />

          {saveError && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="size-4" />
              {saveError}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              <X className="size-4 mr-1" />
              {tp('common.cancel')}
            </Button>
            <Button onClick={handleCreate} disabled={actionLoading || !createForm.nameEs.trim() || !createForm.nameEn.trim()}>
              {actionLoading ? (
                <Loader2 className="size-4 mr-1 animate-spin" />
              ) : (
                <Plus className="size-4 mr-1" />
              )}
              {actionLoading ? L('Creando...', 'Creating...') : L('Crear', 'Create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ EDIT DIALOG ═══ */}
      <Dialog open={!!editCat} onOpenChange={() => setEditCat(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tp('admin.editCategory')}</DialogTitle>
            <DialogDescription>
              {L(
                'Edita los detalles de la categoría. Los cambios se guardan inmediatamente.',
                'Edit category details. Changes are saved immediately.',
              )}
            </DialogDescription>
          </DialogHeader>

          {editCat && (
            <div className="space-y-5">
              <CategoryFormFields
                form={editForm}
                setForm={setEditForm}
                locale={locale}
                parentOptions={[]}
                isCreate={false}
              />

              {/* Stats section for edit */}
              {editCat.listingCount > 0 && (
                <div className="p-3 rounded-lg bg-muted/40 border flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">{L('Anuncios', 'Listings')}:</span>{' '}
                    <span className="font-semibold">{editCat.listingCount}</span>
                  </div>
                  {editCat.revenue > 0 && (
                    <div>
                      <span className="text-muted-foreground">{L('Ingresos', 'Revenue')}:</span>{' '}
                      <span className="font-semibold text-primary">€{editCat.revenue.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {saveError && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="size-4" />
              {saveError}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCat(null)}>
              <X className="size-4 mr-1" />
              {tp('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={actionLoading}>
              {actionLoading ? (
                <Loader2 className="size-4 mr-1 animate-spin" />
              ) : (
                <Save className="size-4 mr-1" />
              )}
              {actionLoading ? L('Guardando...', 'Saving...') : tp('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ DELETE CONFIRMATION ═══ */}
      <AlertDialog open={!!deleteCat} onOpenChange={(v) => !v && setDeleteCat(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{L('¿Borrar esta categoría?', 'Delete this category?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteCat && (
                <>
                  {L(
                    `Se eliminará permanentemente la categoría "${deleteCat.nameEs}".`,
                    `The category "${deleteCat.nameEs}" will be permanently deleted.`,
                  )}
                  {deleteCat.children && deleteCat.children.length > 0 && (
                    <span className="block mt-2 font-medium text-destructive">
                      {L(
                        'Esta categoría tiene subcategorías y no puede ser eliminada.',
                        'This category has subcategories and cannot be deleted.',
                      )}
                    </span>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="size-4" />
              {deleteError}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              {tp('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={
                actionLoading ||
                !deleteCat ||
                (deleteCat.children && deleteCat.children.length > 0) ||
                (deleteCat.listingCount ?? 0) > 0
              }
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {actionLoading ? (
                <Loader2 className="size-4 mr-1 animate-spin" />
              ) : (
                <Trash2 className="size-4 mr-1" />
              )}
              {L('Eliminar', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
