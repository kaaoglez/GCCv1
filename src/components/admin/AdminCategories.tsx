'use client';

import { useState, useEffect, useMemo } from 'react';
import { useI18n } from '@/hooks/use-i18n';
import { getIcon } from '@/lib/icons';
import {
  Pencil,
  Search,
  ChevronDown,
  ChevronRight,
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
  Check,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import type { CategoryDTO } from '@/lib/types';

interface AdminCategoryDTO extends CategoryDTO {
  revenue: number;
  children?: AdminCategoryDTO[];
}

export function AdminCategories() {
  const { tp, locale } = useI18n();
  const [categories, setCategories] = useState<AdminCategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());
  const [editCat, setEditCat] = useState<AdminCategoryDTO | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [priceDraft, setPriceDraft] = useState('');

  // Stats
  const totalCategories = useMemo(() => {
    let count = categories.length;
    categories.forEach((p) => { count += (p.children || []).length; });
    return count;
  }, [categories]);
  const paidCategories = useMemo(() => {
    let count = categories.filter((c) => c.isPaid).length;
    categories.forEach((p) => { count += (p.children || []).filter((c) => c.isPaid).length; });
    return count;
  }, [categories]);
  const freeCategories = totalCategories - paidCategories;

  // Fetch categories on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/categories');
        const data = await res.json();
        if (!cancelled) setCategories(Array.isArray(data) ? data : []);
      } catch { /* silent */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const parents = useMemo(
    () => categories.sort((a, b) => a.sortOrder - b.sortOrder),
    [categories]
  );

  const filteredParents = useMemo(() => {
    if (!search.trim()) return parents;
    const q = search.toLowerCase();
    return parents.filter((p) => {
      const nameMatch = p.nameEs.toLowerCase().includes(q) || p.nameEn.toLowerCase().includes(q);
      const childMatch = (p.children || []).some(
        (c) => c.nameEs.toLowerCase().includes(q) || c.nameEn.toLowerCase().includes(q)
      );
      return nameMatch || childMatch;
    });
  }, [parents, search]);

  const toggleParent = (id: string) => {
    setExpandedParents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedParents(new Set(parents.map((p) => p.id)));
  };

  const collapseAll = () => {
    setExpandedParents(new Set());
  };

  // Toggle isPaid with API call
  const toggleIsPaid = async (cat: AdminCategoryDTO) => {
    const newVal = !cat.isPaid;
    setTogglingId(cat.id);

    // If turning ON and no price, set default price
    const updatePayload: Record<string, any> = { id: cat.id, isPaid: newVal };
    if (newVal && !cat.price) {
      updatePayload.price = 5;
    }

    // Optimistic update
    setCategories((prev) =>
      prev.map((p) => {
        if (p.id === cat.id) return { ...p, isPaid: newVal, price: newVal && !cat.price ? 5 : cat.price };
        const children = p.children?.map((c) => {
          if (c.id === cat.id) return { ...c, isPaid: newVal, price: newVal && !cat.price ? 5 : cat.price };
          return c;
        });
        return children ? { ...p, children } : p;
      })
    );

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });
      if (!res.ok) {
        // Revert on error
        setCategories((prev) =>
          prev.map((p) => {
            if (p.id === cat.id) return { ...p, isPaid: !newVal };
            const children = p.children?.map((c) => {
              if (c.id === cat.id) return { ...c, isPaid: !newVal };
              return c;
            });
            return children ? { ...p, children } : p;
          })
        );
      }
    } catch {
      setCategories((prev) =>
        prev.map((p) => {
          if (p.id === cat.id) return { ...p, isPaid: !newVal };
          const children = p.children?.map((c) => {
            if (c.id === cat.id) return { ...c, isPaid: !newVal };
            return c;
          });
          return children ? { ...p, children } : p;
        })
      );
    }
    setTogglingId(null);
  };

  // Save price inline
  const savePrice = async (cat: AdminCategoryDTO) => {
    const numPrice = parseFloat(priceDraft);
    if (isNaN(numPrice) || numPrice < 0) {
      setEditingPriceId(null);
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cat.id, price: numPrice }),
      });
      if (res.ok) {
        setCategories((prev) =>
          prev.map((p) => {
            if (p.id === cat.id) return { ...p, price: numPrice };
            const children = p.children?.map((c) => {
              if (c.id === cat.id) return { ...c, price: numPrice };
              return c;
            });
            return children ? { ...p, children } : p;
          })
        );
      }
    } catch { /* silent */ }
    setEditingPriceId(null);
    setActionLoading(false);
  };

  // Toggle isActive
  const toggleIsActive = async (cat: AdminCategoryDTO) => {
    const newVal = !cat.isActive;
    setCategories((prev) =>
      prev.map((p) => {
        if (p.id === cat.id) return { ...p, isActive: newVal };
        const children = p.children?.map((c) => {
          if (c.id === cat.id) return { ...c, isActive: newVal };
          return c;
        });
        return children ? { ...p, children } : p;
      })
    );
    try {
      await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cat.id, isActive: newVal }),
      });
    } catch { /* silent */ }
  };

  // Edit dialog
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
      price: cat.price ?? '',
      highlightPrice: cat.highlightPrice || '',
      vipPrice: cat.vipPrice || '',
      sortOrder: cat.sortOrder,
      expiryDays: cat.expiryDays,
      maxImages: cat.maxImages,
      showPrice: cat.showPrice,
      showLocation: cat.showLocation,
      showImages: cat.showImages,
    });
  };

  const handleSave = async () => {
    if (!editCat) return;
    setActionLoading(true);
    setSaveError('');
    try {
      const payload = { id: editCat.id, ...editForm };
      const res = await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setSaveError(data?.error || 'Error al guardar');
        setActionLoading(false);
        return;
      }
      setEditCat(null);
      // Re-fetch to get updated data
      try {
        const refetch = await fetch('/api/admin/categories');
        const refetchData = await refetch.json();
        setCategories(Array.isArray(refetchData) ? refetchData : []);
      } catch { /* silent */ }
    } catch {
      setSaveError('Error de conexión');
    }
    setActionLoading(false);
  };

  return (
    <div className="space-y-5">
      {/* ═══ STATS BAR ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Package className="size-4" />
            <span className="text-xs font-medium">{locale === 'es' ? 'Total categorías' : 'Total categories'}</span>
          </div>
          <p className="text-2xl font-bold">{totalCategories}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2 text-emerald-600">
            <ToggleLeft className="size-4" />
            <span className="text-xs font-medium">{locale === 'es' ? 'Gratuitas' : 'Free'}</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{freeCategories}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2 text-amber-600">
            <DollarSign className="size-4" />
            <span className="text-xs font-medium">{locale === 'es' ? 'De pago' : 'Paid'}</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{paidCategories}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <BarChart3 className="size-4" />
            <span className="text-xs font-medium">{locale === 'es' ? 'Ingresos' : 'Revenue'}</span>
          </div>
          <p className="text-2xl font-bold text-primary">
            €{categories.reduce((sum, p) => sum + (p.revenue || 0) + (p.children || []).reduce((s, c) => s + (c.revenue || 0), 0), 0).toFixed(0)}
          </p>
        </div>
      </div>

      {/* ═══ TOOLBAR ═══ */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={locale === 'es' ? 'Buscar categoría...' : 'Search category...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            <ChevronDown className="size-3.5 mr-1" />
            {locale === 'es' ? 'Expandir' : 'Expand'}
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            <ChevronRight className="size-3.5 mr-1" />
            {locale === 'es' ? 'Colapsar' : 'Collapse'}
          </Button>
        </div>
      </div>

      {/* ═══ LEGEND ═══ */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground px-1">
        <div className="flex items-center gap-1.5">
          <div className="size-3 rounded-sm bg-emerald-100 border border-emerald-300" />
          <span>{locale === 'es' ? 'Gratis — publicación sin costo' : 'Free — no cost to publish'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-3 rounded-sm bg-amber-100 border border-amber-300" />
          <span>{locale === 'es' ? 'De pago — el usuario paga al publicar' : 'Paid — user pays to publish'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Eye className="size-3" />
          <span>{locale === 'es' ? 'Activa' : 'Active'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <EyeOff className="size-3" />
          <span>{locale === 'es' ? 'Inactiva' : 'Inactive'}</span>
        </div>
      </div>

      {/* ═══ CATEGORY LIST ═══ */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredParents.length === 0 ? (
        <div className="text-center py-12">
          <Search className="size-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">
            {locale === 'es' ? 'No se encontraron categorías' : 'No categories found'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredParents.map((parent) => {
            const children = (parent.children || []);
            const hasChildren = children.length > 0;
            const isExpanded = expandedParents.has(parent.id) || !!search.trim();
            const isTogglingParent = togglingId === parent.id;

            return (
              <div
                key={parent.id}
                className={`rounded-xl border overflow-hidden transition-colors ${
                  parent.isPaid
                    ? 'border-amber-300 bg-amber-50/40 dark:border-amber-700 dark:bg-amber-950/10'
                    : 'border-border bg-card'
                }`}
              >
                {/* ── Parent row ── */}
                <div className="flex items-center gap-3 p-3 sm:p-4">
                  {/* Expand/collapse */}
                  {hasChildren ? (
                    <button
                      onClick={() => toggleParent(parent.id)}
                      className="flex items-center justify-center size-7 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                    >
                      {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                    </button>
                  ) : (
                    <div className="w-7" />
                  )}

                  {/* Icon */}
                  <div
                    className="flex items-center justify-center size-10 rounded-xl shrink-0"
                    style={{ backgroundColor: parent.color + '20', color: parent.color }}
                  >
                    {getIcon(parent.icon, undefined, 20)}
                  </div>

                  {/* Name & info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm">{locale === 'es' ? parent.nameEs : parent.nameEn}</span>
                      {!parent.isActive && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                          {locale === 'es' ? 'Inactiva' : 'Inactive'}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        {hasChildren
                          ? `${children.length} ${locale === 'es' ? 'subcategorías' : 'subcategories'}`
                          : locale === 'es' ? 'Sin subcategorías' : 'No subcategories'}
                      </span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">
                        {parent.listingCount || 0} {locale === 'es' ? 'anuncios' : 'listings'}
                      </span>
                      {parent.revenue > 0 && (
                        <>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs font-medium text-primary">€{parent.revenue.toFixed(2)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Price display / edit */}
                  {parent.isPaid && editingPriceId !== parent.id && (
                    <button
                      onClick={() => {
                        setEditingPriceId(parent.id);
                        setPriceDraft(String(parent.price ?? 0));
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors group"
                    >
                      <DollarSign className="size-3.5 text-amber-700 dark:text-amber-400" />
                      <span className="text-sm font-bold text-amber-800 dark:text-amber-300">
                        €{parent.price?.toFixed(2) ?? '0.00'}
                      </span>
                      <Pencil className="size-3 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  )}

                  {/* Price edit input */}
                  {editingPriceId === parent.id && (
                    <div className="flex items-center gap-1">
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={priceDraft}
                          onChange={(e) => setPriceDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { savePrice(parent); }
                            if (e.key === 'Escape') { setEditingPriceId(null); }
                          }}
                          className="w-24 h-8 pl-7 text-sm"
                          autoFocus
                        />
                      </div>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600" onClick={() => savePrice(parent)}>
                        <Check className="size-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingPriceId(null)}>
                        <X className="size-4" />
                      </Button>
                    </div>
                  )}

                  {/* Controls */}
                  <div className="flex items-center gap-1.5">
                    {/* isPaid toggle */}
                    <div className="relative">
                      {isTogglingParent && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="size-5 animate-spin text-muted-foreground" />
                        </div>
                      )}
                      <Switch
                        checked={parent.isPaid}
                        onCheckedChange={() => toggleIsPaid(parent)}
                        className="scale-90"
                        disabled={isTogglingParent}
                      />
                    </div>

                    {/* Active toggle */}
                    <button
                      onClick={() => toggleIsActive(parent)}
                      className="p-1.5 rounded-md hover:bg-muted transition-colors"
                      title={parent.isActive ? (locale === 'es' ? 'Desactivar' : 'Deactivate') : (locale === 'es' ? 'Activar' : 'Activate')}
                    >
                      {parent.isActive
                        ? <Eye className="size-4 text-emerald-600" />
                        : <EyeOff className="size-4 text-muted-foreground/50" />}
                    </button>

                    {/* Edit */}
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => openEdit(parent)}>
                      <Pencil className="size-3.5" />
                    </Button>
                  </div>
                </div>

                {/* ── Children ── */}
                {hasChildren && isExpanded && (
                  <div className="border-t bg-muted/20">
                    {children.map((child, idx) => {
                      const isTogglingChild = togglingId === child.id;
                      const isEditingChildPrice = editingPriceId === child.id;

                      return (
                        <div
                          key={child.id}
                          className={`flex items-center gap-3 px-4 py-3 pl-12 sm:pl-16 hover:bg-muted/50 transition-colors ${
                            idx < children.length - 1 ? 'border-b border-border/40' : ''
                          } ${child.isPaid ? 'bg-amber-50/30 dark:bg-amber-950/5' : ''}`}
                        >
                          {/* Child icon */}
                          <div
                            className="flex items-center justify-center size-8 rounded-lg shrink-0"
                            style={{ backgroundColor: child.color + '20', color: child.color }}
                          >
                            {getIcon(child.icon, undefined, 16)}
                          </div>

                          {/* Name & info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium">{locale === 'es' ? child.nameEs : child.nameEn}</span>
                              {!child.isActive && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                                  {locale === 'es' ? 'Inactiva' : 'Inactive'}
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {child.listingCount || 0} {locale === 'es' ? 'anuncios' : 'listings'}
                              {child.revenue > 0 && ` · €${child.revenue.toFixed(2)}`}
                            </span>
                          </div>

                          {/* Price display / edit */}
                          {child.isPaid && !isEditingChildPrice && (
                            <button
                              onClick={() => {
                                setEditingPriceId(child.id);
                                setPriceDraft(String(child.price ?? 0));
                              }}
                              className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors group"
                            >
                              <DollarSign className="size-3 text-amber-700 dark:text-amber-400" />
                              <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                                €{child.price?.toFixed(2) ?? '0.00'}
                              </span>
                              <Pencil className="size-2.5 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          )}

                          {/* Price edit input */}
                          {isEditingChildPrice && (
                            <div className="flex items-center gap-1">
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={priceDraft}
                                  onChange={(e) => setPriceDraft(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') { savePrice(child); }
                                    if (e.key === 'Escape') { setEditingPriceId(null); }
                                  }}
                                  className="w-20 h-7 pl-6 text-xs"
                                  autoFocus
                                />
                              </div>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600" onClick={() => savePrice(child)}>
                                <Check className="size-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingPriceId(null)}>
                                <X className="size-3.5" />
                              </Button>
                            </div>
                          )}

                          {/* Controls */}
                          <div className="flex items-center gap-1">
                            <div className="relative">
                              {isTogglingChild && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                                </div>
                              )}
                              <Switch
                                checked={child.isPaid}
                                onCheckedChange={() => toggleIsPaid(child)}
                                className="scale-75"
                                disabled={isTogglingChild}
                              />
                            </div>

                            <button
                              onClick={() => toggleIsActive(child)}
                              className="p-1 rounded-md hover:bg-muted transition-colors"
                              title={child.isActive ? (locale === 'es' ? 'Desactivar' : 'Deactivate') : (locale === 'es' ? 'Activar' : 'Activate')}
                            >
                              {child.isActive
                                ? <Eye className="size-3.5 text-emerald-600" />
                                : <EyeOff className="size-3.5 text-muted-foreground/50" />}
                            </button>

                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => openEdit(child)}>
                              <Pencil className="size-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ EDIT DIALOG ═══ */}
      <Dialog open={!!editCat} onOpenChange={() => setEditCat(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tp('admin.editCategory')}</DialogTitle>
            <DialogDescription>
              {locale === 'es'
                ? 'Edita los detalles de la categoría. Los cambios se guardan inmediatamente.'
                : 'Edit category details. Changes are saved immediately.'}
            </DialogDescription>
          </DialogHeader>
          {editCat && (
            <div className="space-y-5">
              {/* Names */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Nombre (ES)</Label>
                  <Input value={editForm.nameEs || ''} onChange={(e) => setEditForm({ ...editForm, nameEs: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Nombre (EN)</Label>
                  <Input value={editForm.nameEn || ''} onChange={(e) => setEditForm({ ...editForm, nameEn: e.target.value })} />
                </div>
              </div>

              {/* Icon & Color */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Icono (Lucide)</Label>
                  <Input value={editForm.icon || ''} onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Color</Label>
                  <div className="flex gap-2">
                    <Input value={editForm.color || ''} onChange={(e) => setEditForm({ ...editForm, color: e.target.value })} />
                    <div className="w-10 h-10 rounded-lg border flex-shrink-0" style={{ backgroundColor: editForm.color }} />
                  </div>
                </div>
              </div>

              {/* Order & Expiry */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Orden</Label>
                  <Input type="number" value={editForm.sortOrder || 0} onChange={(e) => setEditForm({ ...editForm, sortOrder: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Días expiración</Label>
                  <Input type="number" value={editForm.expiryDays || 30} onChange={(e) => setEditForm({ ...editForm, expiryDays: parseInt(e.target.value) || 30 })} />
                </div>
              </div>

              {/* Display settings */}
              <div className="space-y-3 p-3 rounded-lg bg-muted/40 border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {locale === 'es' ? 'Configuración de visualización' : 'Display settings'}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="size-3.5 text-muted-foreground" />
                    <Label className="text-sm">{locale === 'es' ? 'Mostrar precio' : 'Show price'}</Label>
                  </div>
                  <Switch checked={editForm.showPrice} onCheckedChange={(v) => setEditForm({ ...editForm, showPrice: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="size-3.5 text-muted-foreground" />
                    <Label className="text-sm">{locale === 'es' ? 'Mostrar ubicación' : 'Show location'}</Label>
                  </div>
                  <Switch checked={editForm.showLocation} onCheckedChange={(v) => setEditForm({ ...editForm, showLocation: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImagePlus className="size-3.5 text-muted-foreground" />
                    <Label className="text-sm">{locale === 'es' ? 'Mostrar imágenes' : 'Show images'}</Label>
                  </div>
                  <Switch checked={editForm.showImages} onCheckedChange={(v) => setEditForm({ ...editForm, showImages: v })} />
                </div>
              </div>

              {/* Active toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  {editForm.isActive ? <Eye className="size-4 text-emerald-600" /> : <EyeOff className="size-4 text-muted-foreground" />}
                  <Label className="text-sm">{locale === 'es' ? 'Categoría activa' : 'Active category'}</Label>
                </div>
                <Switch checked={editForm.isActive} onCheckedChange={(v) => setEditForm({ ...editForm, isActive: v })} />
              </div>

              <Separator />

              {/* ═══ PAYMENT SECTION ═══ */}
              <div className={`space-y-3 p-4 rounded-xl border-2 transition-colors ${
                editForm.isPaid
                  ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/10'
                  : 'border-border'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className={`size-5 ${editForm.isPaid ? 'text-amber-600' : 'text-muted-foreground'}`} />
                    <div>
                      <Label className="text-sm font-semibold">
                        {locale === 'es' ? 'Categoría de pago' : 'Paid category'}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {locale === 'es'
                          ? 'El usuario deberá pagar para publicar en esta categoría'
                          : 'User must pay to publish in this category'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={editForm.isPaid}
                    onCheckedChange={(v) => setEditForm({ ...editForm, isPaid: v, price: v ? (editForm.price || 5) : '' })}
                  />
                </div>

                {editForm.isPaid && (
                  <div className="pt-3 border-t border-amber-200 dark:border-amber-800 space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-amber-700 dark:text-amber-400">
                        {locale === 'es' ? 'Precio de publicación (€)' : 'Publication price (€)'}
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">€</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editForm.price || ''}
                          onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || null })}
                          placeholder="0.00"
                          className="h-12 pl-9 text-lg font-bold"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {locale === 'es'
                          ? 'Puedes cambiar este precio en cualquier momento según tus promociones de marketing'
                          : 'You can change this price at any time based on your marketing promotions'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-100/60 dark:bg-amber-900/20">
                      <Clock className="size-4 text-amber-600 shrink-0" />
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        {locale === 'es'
                          ? 'Tip: Puedes activar/desactivar el pago segun tus campanas. Si desactivas, la categoria vuelve a ser gratuita automaticamente.'
                          : 'Tip: You can enable/disable payment based on your campaigns. Disabling it makes the category free automatically.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Stats */}
              {editCat.listingCount > 0 && (
                <div className="p-3 rounded-lg bg-muted/40 border flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">{locale === 'es' ? 'Anuncios' : 'Listings'}:</span>{' '}
                    <span className="font-semibold">{editCat.listingCount}</span>
                  </div>
                  {'revenue' in editCat && (editCat as AdminCategoryDTO).revenue > 0 && (
                    <div>
                      <span className="text-muted-foreground">{locale === 'es' ? 'Ingresos' : 'Revenue'}:</span>{' '}
                      <span className="font-semibold text-primary">€{(editCat as AdminCategoryDTO).revenue.toFixed(2)}</span>
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
              <X className="size-4 mr-1" />{tp('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={actionLoading}>
              {actionLoading ? (
                <Loader2 className="size-4 mr-1 animate-spin" />
              ) : (
                <Save className="size-4 mr-1" />
              )}
              {actionLoading ? (locale === 'es' ? 'Guardando...' : 'Saving...') : tp('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
