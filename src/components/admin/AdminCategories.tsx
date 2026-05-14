'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/hooks/use-i18n';
import { getIcon } from '@/lib/icons';
import { formatNumber } from '@/lib/format';
import { Pencil, ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { CategoryDTO } from '@/lib/types';

export function AdminCategories() {
  const { tp, locale } = useI18n();
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [editCat, setEditCat] = useState<CategoryDTO | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories');
      const data = await res.json();
      setCategories(data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/categories');
        const data = await res.json();
        if (!cancelled) setCategories(data || []);
      } catch {}
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const openEdit = (cat: CategoryDTO) => {
    setEditCat(cat);
    setEditForm({
      nameEs: cat.nameEs,
      nameEn: cat.nameEn,
      icon: cat.icon,
      color: cat.color,
      isActive: cat.isActive,
      isPaid: cat.isPaid,
      price: cat.price || '',
      highlightPrice: cat.highlightPrice || '',
      vipPrice: cat.vipPrice || '',
      sortOrder: cat.sortOrder,
      expiryDays: cat.expiryDays,
      maxImages: cat.maxImages,
    });
  };

  const handleSave = async () => {
    if (!editCat) return;
    setActionLoading(true);
    try {
      await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editCat.id, ...editForm }),
      });
      setEditCat(null);
      fetchCategories();
    } catch {}
    setActionLoading(false);
  };

  const parents = categories.filter((c) => !c.parentId);

  return (
    <div className="space-y-6">
      {loading ? (
        Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)
      ) : (
        <div className="space-y-2">
          {parents.map((parent) => {
            const children = categories.filter((c) => c.parentId === parent.id);
            return (
              <div key={parent.id} className="space-y-1">
                {/* Parent */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-card border hover:shadow-sm transition-shadow">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: parent.color + '20' }}>
                    {getIcon(parent.icon, 'w-5 h-5')}
                    <style>{`.__icon_color { color: ${parent.color} }`}</style>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{locale === 'es' ? parent.nameEs : parent.nameEn}</p>
                      {parent.isPaid && (
                        <Badge className="border-transparent text-[10px]" style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>
                          💰 Premium
                        </Badge>
                      )}
                      {!parent.isActive && (
                        <Badge className="border-transparent text-[10px]" style={{ backgroundColor: '#dc2626', color: '#ffffff' }}>Inactiva</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {parent.listingCount || 0} {tp('admin.listingCount')} · {children.length} subcategorías
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(parent)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Children */}
                {children.map((child) => (
                  <div key={child.id} className="flex items-center gap-3 p-3 rounded-lg bg-card border ml-8 hover:shadow-sm transition-shadow">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: child.color + '20' }}>
                      {getIcon(child.icon, 'w-4 h-4')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{locale === 'es' ? child.nameEs : child.nameEn}</p>
                        {child.isPaid && (
                          <Badge className="border-transparent text-[10px]" style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>
                            💰
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{child.listingCount || 0} {tp('admin.listingCount')}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(child)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editCat} onOpenChange={() => setEditCat(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tp('admin.editCategory')}</DialogTitle>
          </DialogHeader>
          {editCat && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Nombre (ES)</Label>
                  <Input value={editForm.nameEs || ''} onChange={(e) => setEditForm({ ...editForm, nameEs: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Nombre (EN)</Label>
                  <Input value={editForm.nameEn || ''} onChange={(e) => setEditForm({ ...editForm, nameEn: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Icono (Lucide)</Label>
                  <Input value={editForm.icon || ''} onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Color</Label>
                  <div className="flex gap-2">
                    <Input value={editForm.color || ''} onChange={(e) => setEditForm({ ...editForm, color: e.target.value })} />
                    <div className="w-10 h-10 rounded-md border flex-shrink-0" style={{ backgroundColor: editForm.color }} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Orden</Label>
                  <Input type="number" value={editForm.sortOrder || 0} onChange={(e) => setEditForm({ ...editForm, sortOrder: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Días expiración</Label>
                  <Input type="number" value={editForm.expiryDays || 30} onChange={(e) => setEditForm({ ...editForm, expiryDays: parseInt(e.target.value) || 30 })} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Activa</Label>
                <Switch checked={editForm.isActive} onCheckedChange={(v) => setEditForm({ ...editForm, isActive: v })} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">{tp('admin.paidCategory')}</Label>
                <Switch checked={editForm.isPaid} onCheckedChange={(v) => setEditForm({ ...editForm, isPaid: v })} />
              </div>
              {editForm.isPaid && (
                <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                  <div className="space-y-1">
                    <Label className="text-xs">Precio base</Label>
                    <Input type="number" step="0.01" value={editForm.price || ''} onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || null })} placeholder="€" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Destacado</Label>
                    <Input type="number" step="0.01" value={editForm.highlightPrice || ''} onChange={(e) => setEditForm({ ...editForm, highlightPrice: parseFloat(e.target.value) || null })} placeholder="€" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">VIP</Label>
                    <Input type="number" step="0.01" value={editForm.vipPrice || ''} onChange={(e) => setEditForm({ ...editForm, vipPrice: parseFloat(e.target.value) || null })} placeholder="€" />
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCat(null)}>{tp('common.cancel')}</Button>
            <Button onClick={handleSave} disabled={actionLoading}>{tp('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
