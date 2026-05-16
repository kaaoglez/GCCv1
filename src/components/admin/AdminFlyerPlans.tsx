'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/hooks/use-i18n';
import {
  Save,
  Loader2,
  Plus,
  Trash2,
  Star,
  Eye,
  EyeOff,
  DollarSign,
  Tag,
  Palette,
  FileText,
  Newspaper,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────

interface FlyerPlanFeature {
  es: string;
  en: string;
}

interface FlyerPlanForm {
  id?: string;
  tier: string;
  nameEs: string;
  nameEn: string;
  price: number;
  priceLabelEs: string;
  priceLabelEn: string;
  badgeEs: string;
  badgeEn: string;
  color: string;
  featuresEs: FlyerPlanFeature[];
  featuresEn: FlyerPlanFeature[];
  flyersPerWeek: number;
  isPopular: boolean;
  isActive: boolean;
  sortOrder: number;
}

interface FlyerPlanDTO {
  id: string;
  tier: string;
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
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

const t = (es: string, en: string, locale: string) => (locale === 'es' ? es : en);

const TIER_META: Record<string, { icon: typeof Star; defaultColor: string; labelEs: string; labelEn: string }> = {
  BASIC: { icon: FileText, defaultColor: '#6B7280', labelEs: 'Básico', labelEn: 'Basic' },
  FEATURED: { icon: Star, defaultColor: '#F59E0B', labelEs: 'Destacado', labelEn: 'Featured' },
  PREMIUM: { icon: Newspaper, defaultColor: '#EA580C', labelEs: 'Premium', labelEn: 'Premium' },
};

// ─── Component ───────────────────────────────────────────────────

export function AdminFlyerPlans() {
  const { locale } = useI18n();
  const [plans, setPlans] = useState<FlyerPlanForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch plans on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/flyer-plans');
        const data: FlyerPlanDTO[] = await res.json();
        if (!cancelled && Array.isArray(data)) {
          const mapped: FlyerPlanForm[] = data.map((p) => ({
            id: p.id,
            tier: p.tier,
            nameEs: p.nameEs,
            nameEn: p.nameEn,
            price: p.price,
            priceLabelEs: p.priceLabelEs,
            priceLabelEn: p.priceLabelEn,
            badgeEs: p.badgeEs,
            badgeEn: p.badgeEn,
            color: p.color,
            featuresEs: buildFeatures(p.featuresEs, p.featuresEn, 'es'),
            featuresEn: buildFeatures(p.featuresEs, p.featuresEn, 'en'),
            flyersPerWeek: p.flyersPerWeek,
            isPopular: p.isPopular,
            isActive: p.isActive,
            sortOrder: p.sortOrder,
          }));
          setPlans(mapped);
        }
      } catch {
        toast.error(t('Error al cargar los planes', 'Failed to load plans', locale));
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [locale]);

  // Save all plans
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      // Ensure featuresEs and featuresEn are aligned by index
      const payload = plans.map((p, _idx) => {
        // Build plain string arrays for features
        const maxLen = Math.max(p.featuresEs.length, p.featuresEn.length);
        const plainFeaturesEs: string[] = [];
        const plainFeaturesEn: string[] = [];
        for (let i = 0; i < maxLen; i++) {
          plainFeaturesEs.push(p.featuresEs[i]?.es || '');
          plainFeaturesEn.push(p.featuresEn[i]?.en || '');
        }
        return {
          tier: p.tier,
          nameEs: p.nameEs,
          nameEn: p.nameEn,
          price: p.price,
          priceLabelEs: p.priceLabelEs,
          priceLabelEn: p.priceLabelEn,
          badgeEs: p.badgeEs,
          badgeEn: p.badgeEn,
          color: p.color,
          featuresEs: plainFeaturesEs,
          featuresEn: plainFeaturesEn,
          flyersPerWeek: p.flyersPerWeek,
          isPopular: p.isPopular,
          isActive: p.isActive,
          sortOrder: p.sortOrder,
        };
      });

      const res = await fetch('/api/admin/flyer-plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(t('Error del servidor', 'Server error', locale));
      }

      toast.success(t('Planes guardados correctamente', 'Plans saved successfully', locale));
    } catch (err: any) {
      toast.error(err.message || t('Error al guardar', 'Failed to save', locale));
    }
    setSaving(false);
  }, [plans, locale]);

  // Plan field updaters
  const updatePlan = useCallback((index: number, field: keyof FlyerPlanForm, value: any) => {
    setPlans((prev) =>
      prev.map((p, i) => {
        if (i !== index) return p;
        const updated = { ...p, [field]: value };
        // When price changes, auto-update both price labels
        if (field === 'price') {
          const numVal = Number(value) || 0;
          const isWhole = numVal === Math.floor(numVal);
          updated.priceLabelEs = isWhole ? `${numVal}€/mes` : `${numVal.toFixed(2)}€/mes`;
          updated.priceLabelEn = isWhole ? `€${numVal}/month` : `€${numVal.toFixed(2)}/month`;
        }
        return updated;
      })
    );
  }, []);

  // Feature management
  const addFeature = useCallback((planIndex: number) => {
    setPlans((prev) =>
      prev.map((p, i) => {
        if (i !== planIndex) return p;
        return {
          ...p,
          featuresEs: [...p.featuresEs, { es: '', en: '' }],
          featuresEn: [...p.featuresEn, { es: '', en: '' }],
        };
      })
    );
  }, []);

  const removeFeature = useCallback((planIndex: number, featureIndex: number) => {
    setPlans((prev) =>
      prev.map((p, i) => {
        if (i !== planIndex) return p;
        return {
          ...p,
          featuresEs: p.featuresEs.filter((_, fi) => fi !== featureIndex),
          featuresEn: p.featuresEn.filter((_, fi) => fi !== featureIndex),
        };
      })
    );
  }, []);

  const updateFeatureEs = useCallback((planIndex: number, featureIndex: number, value: string) => {
    setPlans((prev) =>
      prev.map((p, i) => {
        if (i !== planIndex) return p;
        const newFeaturesEs = [...p.featuresEs];
        newFeaturesEs[featureIndex] = { ...newFeaturesEs[featureIndex], es: value };
        // Keep en in sync: if es changed at index, update en array too
        const newFeaturesEn = [...p.featuresEn];
        if (newFeaturesEn[featureIndex]) {
          newFeaturesEn[featureIndex] = { ...newFeaturesEn[featureIndex], es: value };
        }
        return { ...p, featuresEs: newFeaturesEs, featuresEn: newFeaturesEn };
      })
    );
  }, []);

  const updateFeatureEn = useCallback((planIndex: number, featureIndex: number, value: string) => {
    setPlans((prev) =>
      prev.map((p, i) => {
        if (i !== planIndex) return p;
        const newFeaturesEn = [...p.featuresEn];
        newFeaturesEn[featureIndex] = { ...newFeaturesEn[featureIndex], en: value };
        // Keep es in sync
        const newFeaturesEs = [...p.featuresEs];
        if (newFeaturesEs[featureIndex]) {
          newFeaturesEs[featureIndex] = { ...newFeaturesEs[featureIndex], en: value };
        }
        return { ...p, featuresEs: newFeaturesEs, featuresEn: newFeaturesEn };
      })
    );
  }, []);

  // ─── Render ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">
              {t('Planes de Folletos', 'Flyer Plans', locale)}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('Gestiona los planes de precios para folletos', 'Manage flyer pricing plans', locale)}
            </p>
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[600px] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">
            {t('Planes de Folletos', 'Flyer Plans', locale)}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('Gestiona los planes de precios para folletos', 'Manage flyer pricing plans', locale)}
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2"
          style={{ backgroundColor: '#1B4332', color: '#fff' }}
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {saving
            ? t('Guardando...', 'Saving...', locale)
            : t('Guardar cambios', 'Save changes', locale)}
        </Button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Newspaper className="size-4" />
            <span className="text-xs font-medium">{t('Total planes', 'Total plans', locale)}</span>
          </div>
          <p className="text-2xl font-bold">{plans.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2 text-emerald-600">
            <Eye className="size-4" />
            <span className="text-xs font-medium">{t('Activos', 'Active', locale)}</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">
            {plans.filter((p) => p.isActive).length}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2 text-amber-600">
            <Star className="size-4" />
            <span className="text-xs font-medium">{t('Popular', 'Popular', locale)}</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">
            {plans.filter((p) => p.isPopular).length}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <DollarSign className="size-4" />
            <span className="text-xs font-medium">{t('Rango precios', 'Price range', locale)}</span>
          </div>
          <p className="text-2xl font-bold text-primary">
            {plans.length > 0
              ? `€${Math.min(...plans.map((p) => p.price))}–€${Math.max(...plans.map((p) => p.price))}`
              : '–'}
          </p>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan, planIdx) => {
          const meta = TIER_META[plan.tier] || TIER_META.BASIC;
          const TierIcon = meta.icon;

          return (
            <Card
              key={plan.tier}
              className={`relative overflow-hidden transition-shadow hover:shadow-lg ${
                plan.isPopular ? 'ring-2 ring-amber-400 shadow-md' : ''
              } ${!plan.isActive ? 'opacity-60' : ''}`}
            >
              {/* Popular badge */}
              {plan.isPopular && (
                <div className="absolute top-3 right-3">
                  <Badge
                    className="gap-1 text-xs"
                    style={{ backgroundColor: plan.color, color: '#fff' }}
                  >
                    <Star className="size-3" />
                    {t('Popular', 'Popular', locale)}
                  </Badge>
                </div>
              )}

              {/* Inactive overlay */}
              {!plan.isActive && (
                <div className="absolute top-3 right-3">
                  <Badge variant="secondary" className="text-xs text-muted-foreground">
                    <EyeOff className="size-3 mr-1" />
                    {t('Inactivo', 'Inactive', locale)}
                  </Badge>
                </div>
              )}

              {/* Card header with color stripe */}
              <div
                className="h-2 w-full"
                style={{ backgroundColor: plan.color }}
              />

              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center size-10 rounded-xl shrink-0"
                    style={{ backgroundColor: plan.color + '20', color: plan.color }}
                  >
                    <TierIcon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-base">{plan.nameEs}</CardTitle>
                    <p className="text-xs text-muted-foreground">{plan.nameEn}</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-0">
                {/* Name fields */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
                      Nombre (ES)
                    </Label>
                    <Input
                      value={plan.nameEs}
                      onChange={(e) => updatePlan(planIdx, 'nameEs', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
                      Nombre (EN)
                    </Label>
                    <Input
                      value={plan.nameEn}
                      onChange={(e) => updatePlan(planIdx, 'nameEn', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                <Separator />

                {/* Price */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <DollarSign className="size-3.5" />
                    {t('Precio', 'Price', locale)}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">€</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={plan.price || ''}
                        onChange={(e) => updatePlan(planIdx, 'price', parseFloat(e.target.value) || 0)}
                        className="h-8 text-sm font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">{t('Etiqueta ES', 'Label ES', locale)}</Label>
                      <Input
                        value={plan.priceLabelEs}
                        onChange={(e) => updatePlan(planIdx, 'priceLabelEs', e.target.value)}
                        className="h-8 text-sm"
                        placeholder="15€/mes"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">{t('Etiqueta EN', 'Label EN', locale)}</Label>
                    <Input
                      value={plan.priceLabelEn}
                      onChange={(e) => updatePlan(planIdx, 'priceLabelEn', e.target.value)}
                      className="h-8 text-sm"
                      placeholder="€15/month"
                    />
                  </div>
                </div>

                <Separator />

                {/* Badge */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <Tag className="size-3.5" />
                    {t('Badge', 'Badge', locale)}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Badge (ES)</Label>
                      <Input
                        value={plan.badgeEs}
                        onChange={(e) => updatePlan(planIdx, 'badgeEs', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Badge (EN)</Label>
                      <Input
                        value={plan.badgeEn}
                        onChange={(e) => updatePlan(planIdx, 'badgeEn', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Color */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <Palette className="size-3.5" />
                    {t('Color', 'Color', locale)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={plan.color}
                      onChange={(e) => updatePlan(planIdx, 'color', e.target.value)}
                      className="h-8 text-sm flex-1 font-mono"
                      placeholder="#6B7280"
                    />
                    <div
                      className="w-10 h-8 rounded-lg border shrink-0"
                      style={{ backgroundColor: plan.color }}
                    />
                  </div>
                </div>

                <Separator />

                {/* Flyers per week */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <Newspaper className="size-3.5" />
                    {t('Folletos por semana', 'Flyers per week', locale)}
                  </div>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={plan.flyersPerWeek}
                    onChange={(e) => updatePlan(planIdx, 'flyersPerWeek', parseInt(e.target.value) || 1)}
                    className="h-8 text-sm"
                  />
                </div>

                <Separator />

                {/* Features */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      <FileText className="size-3.5" />
                      {t('Características', 'Features', locale)}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs gap-1"
                      onClick={() => addFeature(planIdx)}
                    >
                      <Plus className="size-3" />
                      {t('Añadir', 'Add', locale)}
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {plan.featuresEs.map((feature, fIdx) => (
                      <div key={fIdx} className="space-y-1.5 p-2 rounded-lg bg-muted/50 border">
                        <div className="grid grid-cols-[1fr_auto] gap-1">
                          <Input
                            value={feature.es}
                            onChange={(e) => updateFeatureEs(planIdx, fIdx, e.target.value)}
                            placeholder={t('Español...', 'Spanish...', locale)}
                            className="h-7 text-xs"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => removeFeature(planIdx, fIdx)}
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                        <Input
                          value={feature.en}
                          onChange={(e) => updateFeatureEn(planIdx, fIdx, e.target.value)}
                          placeholder={t('Inglés...', 'English...', locale)}
                          className="h-7 text-xs"
                        />
                      </div>
                    ))}
                    {plan.featuresEs.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        {t('Sin características', 'No features', locale)}
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Toggles */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="size-3.5 text-amber-500" />
                      <Label className="text-sm">{t('Popular', 'Popular', locale)}</Label>
                    </div>
                    <Switch
                      checked={plan.isPopular}
                      onCheckedChange={(v) => updatePlan(planIdx, 'isPopular', v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {plan.isActive ? (
                        <Eye className="size-3.5 text-emerald-600" />
                      ) : (
                        <EyeOff className="size-3.5 text-muted-foreground" />
                      )}
                      <Label className="text-sm">{t('Activo', 'Active', locale)}</Label>
                    </div>
                    <Switch
                      checked={plan.isActive}
                      onCheckedChange={(v) => updatePlan(planIdx, 'isActive', v)}
                    />
                  </div>
                </div>

                {/* Sort order */}
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
                    {t('Orden', 'Sort order', locale)}
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={plan.sortOrder}
                    onChange={(e) => updatePlan(planIdx, 'sortOrder', parseInt(e.target.value) || 0)}
                    className="h-8 text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bottom save button */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSave}
          disabled={saving}
          size="lg"
          className="gap-2"
          style={{ backgroundColor: '#1B4332', color: '#fff' }}
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {saving
            ? t('Guardando...', 'Saving...', locale)
            : t('Guardar cambios', 'Save changes', locale)}
        </Button>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────

/** Build bilingual features from plain string arrays */
function buildFeatures(featuresEs: string[], featuresEn: string[], _lang: 'es' | 'en'): FlyerPlanFeature[] {
  const maxLen = Math.max(featuresEs.length, featuresEn.length);
  const result: FlyerPlanFeature[] = [];
  for (let i = 0; i < maxLen; i++) {
    result.push({
      es: featuresEs[i] || '',
      en: featuresEn[i] || '',
    });
  }
  return result;
}
