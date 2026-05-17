'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/hooks/use-i18n';
import { getIcon } from '@/lib/icons';
import { getRelativeTime, formatNumber } from '@/lib/format';
import {
  Search, Sparkles, Star, Store, Image as ImageIcon, Zap,
  Eye, MousePointer, ToggleLeft, ToggleRight, ChevronRight, Copy, Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import type { ListingDTO, ListingTier, CategoryDTO, Locale } from '@/lib/types';
import { PRICING_PLANS } from '@/lib/types';

const PAID_TIERS: ListingTier[] = ['HIGHLIGHTED', 'VIP'];

const tierBadge = (tier: string): React.CSSProperties => {
  const colors: Record<string, { backgroundColor: string; color: string }> = {
    FREE: { backgroundColor: '#6b7280', color: '#ffffff' },
    HIGHLIGHTED: { backgroundColor: '#f59e0b', color: '#ffffff' },
    VIP: { backgroundColor: '#f97316', color: '#ffffff' },

  };
  return colors[tier] || colors.FREE;
};

// ── Tab 1: VIP Slider Management ────────────────────────────────
function VipSliderTab({ locale, tp }: { locale: Locale; tp: (k: string) => string }) {
  const [listings, setListings] = useState<ListingDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [sliderIds, setSliderIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([
      fetch('/api/listings/featured').then((r) => r.json()),
      fetch('/api/listings?tier=VIP&limit=50').then((r) => r.json()),
    ]).then(([featured, vipList]) => {
      const vipData = Array.isArray(vipList.data) ? vipList.data : [];
      const allListings = [...featured, ...vipData.filter((l: ListingDTO) => !featured.find((f: ListingDTO) => f.id === l.id))];
      setListings(allListings);
      setSliderIds(new Set(allListings.filter((l: ListingDTO) => l.tier === 'VIP').map((l: ListingDTO) => l.id)));
    }).finally(() => setLoading(false));
  }, []);

  const toggleSlider = (id: string) => {
    setSliderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Gestiona qué anuncios VIP aparecen en el slider principal de la página de inicio. Activa o desactiva con el interruptor.
      </p>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-32 w-full mb-3 rounded-lg" /><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2 mt-2" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing) => {
            const inSlider = sliderIds.has(listing.id);
            return (
              <Card key={listing.id} className={`overflow-hidden transition-all ${inSlider ? 'ring-2 ring-primary' : 'opacity-70'}`}>
                <div className="relative">
                  {listing.images[0] ? (
                    <img src={listing.images[0]} alt="" className="w-full h-36 object-cover" />
                  ) : (
                    <div className="w-full h-36 bg-muted flex items-center justify-center">{getIcon('image-off', 'w-8 h-8 text-muted-foreground')}</div>
                  )}
                  <Badge className="absolute top-2 left-2" style={{
                    backgroundColor: PRICING_PLANS.find((p) => p.id === listing.tier)?.color,
                    color: '#fff',
                  }}>
                    {listing.tier}
                  </Badge>
                  {inSlider && (
                    <Badge className="absolute top-2 right-2 bg-emerald-500 text-white">✓ Slider</Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <p className="font-medium text-sm truncate">{listing.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{listing.author?.name} · {listing.municipality}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{formatNumber(listing.viewCount, locale)}</span>
                    </div>
                    <button onClick={() => toggleSlider(listing.id)} className="focus:outline-none">
                      {inSlider ? (
                        <ToggleRight className="w-8 h-8 text-primary" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Tab 2: Featured by Category ─────────────────────────────────
function CategoryFeaturedTab({ locale, tp }: { locale: Locale; tp: (k: string) => string }) {
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [selectedCat, setSelectedCat] = useState('');
  const [listings, setListings] = useState<ListingDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/categories?locale=' + locale).then((r) => r.json()).then((data) => {
      const cats = Array.isArray(data) ? data : [];
      setCategories(cats);
      if (cats.length > 0 && !selectedCat) setSelectedCat(cats[0].id);
    }).finally(() => setLoading(false));
  }, [locale]);

  useEffect(() => {
    if (!selectedCat) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/listings?categoryId=${selectedCat}&limit=50&sortBy=popular`);
        const data = await res.json();
        if (!cancelled) setListings(data.data || []);
      } catch (err) { console.error('[AdminPromotions listings]', err); }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [selectedCat]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Selecciona una categoría para gestionar los anuncios destacados que aparecen primero en los resultados.
      </p>
      <select
        value={selectedCat}
        onChange={(e) => setSelectedCat(e.target.value)}
        className="h-10 rounded-md border bg-background px-3 text-sm w-full max-w-xs"
      >
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {locale === 'es' ? cat.nameEs : cat.nameEn}
            {cat.isPaid ? ' 💰' : ''}
          </option>
        ))}
      </select>
      <div className="space-y-2">
        {listings
          .filter((l) => l.tier !== 'FREE')
          .map((listing, idx) => (
            <div key={listing.id} className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
              <span className="text-lg font-bold text-muted-foreground w-6 text-center">#{idx + 1}</span>
              {listing.images[0] ? (
                <img src={listing.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">{getIcon('image-off', 'w-5 h-5 text-muted-foreground')}</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{listing.title}</p>
                <p className="text-xs text-muted-foreground">{listing.author?.name}</p>
              </div>
              <Badge style={{
                backgroundColor: PRICING_PLANS.find((p) => p.id === listing.tier)?.color + '20',
                color: PRICING_PLANS.find((p) => p.id === listing.tier)?.color,
              }}>
                {listing.tier}
              </Badge>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          ))}
        {listings.filter((l) => l.tier !== 'FREE').length === 0 && !loading && (
          <p className="text-center text-muted-foreground py-8">{tp('admin.noListings')}</p>
        )}
      </div>
    </div>
  );
}

// ── Tab 3: Business Directory ───────────────────────────────────
function BusinessDirectoryTab({ locale, tp }: { locale: Locale; tp: (k: string) => string }) {
  const [listings, setListings] = useState<ListingDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [directoryIds, setDirectoryIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/listings?tier=BUSINESS&limit=50').then((r) => r.json()).then((data) => {
      setListings(data.data || []);
      setDirectoryIds(new Set((data.data || []).map((l: ListingDTO) => l.id)));
    }).finally(() => setLoading(false));
  }, []);

  const toggleDirectory = (id: string) => {
    setDirectoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Gestiona qué negocios aparecen en la sección &quot;Directorio Comercial&quot; de la página principal.
      </p>
      {loading ? (
        Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => {
            const inDir = directoryIds.has(listing.id);
            return (
              <Card key={listing.id} className={`overflow-hidden ${inDir ? '' : 'opacity-60'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {listing.images[0] ? (
                      <img src={listing.images[0]} alt="" className="w-16 h-16 rounded-xl object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <Store className="w-6 h-6 text-purple-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{listing.title}</p>
                      <p className="text-sm text-muted-foreground">{listing.author?.businessName || listing.author?.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{listing.municipality}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-muted-foreground">{tp('listings.views')}</p>
                        <p className="font-semibold text-sm">{formatNumber(listing.viewCount, locale)}</p>
                      </div>
                      <button onClick={() => toggleDirectory(listing.id)} className="focus:outline-none">
                        {inDir ? (
                          <ToggleRight className="w-10 h-10 text-primary" />
                        ) : (
                          <ToggleLeft className="w-10 h-10 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Tab 4: Banner Ads (Full CRUD) ─────────────────────────────────
function BannerAdsTab({ locale, tp }: { locale: Locale; tp: (k: string) => string }) {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [filterPos, setFilterPos] = useState('');
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    position: 'leaderboard', title: '', imageUrl: '', linkUrl: '', altText: '',
    businessName: '', businessEmail: '', businessPhone: '', businessSite: '',
    description: '', width: '', height: '', active: true, sortOrder: 0, validFrom: '', validUntil: '',
  });

  const POSITIONS = [
    { id: 'nav_promo', labelEs: 'Barra Superior', labelEn: 'Top Bar (Navbar)', size: '728 × 90 px' },
    { id: 'leaderboard', labelEs: 'Cabecera (Leaderboard)', labelEn: 'Header (Leaderboard)', size: '728 × 90 px' },
    { id: 'sidebar', labelEs: 'Barra Lateral', labelEn: 'Sidebar', size: '300 × 250 px' },
    { id: 'between_sections', labelEs: 'Entre Secciones', labelEn: 'Between Sections', size: 'Responsive' },
    { id: 'news', labelEs: 'Noticias', labelEn: 'News', size: '728 × 90 px' },
    { id: 'directory', labelEs: 'Directorio', labelEn: 'Directory', size: 'Responsive' },
  ];

  const fetchBanners = useCallback(() => {
    setLoading(true);
    const q = filterPos ? `?position=${filterPos}` : '';
    fetch('/api/admin/banners' + q)
      .then((r) => r.json())
      .then((data) => { setBanners(Array.isArray(data) ? data : []); })
      .catch(() => setBanners([]))
      .finally(() => setLoading(false));
  }, [filterPos]);

  useEffect(() => { fetchBanners(); }, [fetchBanners]);

  const openCreate = () => {
    setEditing(null);
    setForm({ position: 'leaderboard', title: '', imageUrl: '', linkUrl: '', altText: '', businessName: '', businessEmail: '', businessPhone: '', businessSite: '', description: '', width: '', height: '', active: true, sortOrder: 0, validFrom: '', validUntil: '' });
    setShowForm(true);
  };

  const openEdit = (b: any) => {
    setEditing(b);
    setForm({
      position: b.position, title: b.title || '', imageUrl: b.imageUrl || '', linkUrl: b.linkUrl || '', altText: b.altText || '',
      businessName: b.businessName || '', businessEmail: b.businessEmail || '', businessPhone: b.businessPhone || '', businessSite: b.businessSite || '',
      description: b.description || '', width: b.width?.toString() || '', height: b.height?.toString() || '', active: b.active, sortOrder: b.sortOrder || 0,
      validFrom: b.validFrom ? b.validFrom.slice(0, 10) : '', validUntil: b.validUntil ? b.validUntil.slice(0, 10) : '',
    });
    setShowForm(true);
  };

  const { toast } = useToast();

  const handleSave = async () => {
    if (!form.position || !form.imageUrl) {
      toast({ title: locale === 'es' ? 'Error' : 'Error', description: locale === 'es' ? 'Posición e imagen son obligatorios' : 'Position and image are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const body = { ...form, id: editing?.id };
      const res = await fetch('/api/admin/banners', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowForm(false);
        fetchBanners();
        toast({ title: editing ? (locale === 'es' ? 'Banner actualizado' : 'Banner updated') : (locale === 'es' ? 'Banner creado' : 'Banner created') });
      } else {
        const errData = await res.json().catch(() => ({}));
        toast({ title: locale === 'es' ? 'Error' : 'Error', description: errData.error || res.statusText, variant: 'destructive' });
      }
    } catch (err) {
      console.error('[BannerAdsTab save]', err);
      toast({ title: locale === 'es' ? 'Error de conexión' : 'Connection error', variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(locale === 'es' ? '¿Eliminar este banner?' : 'Delete this banner?')) return;
    try {
      await fetch('/api/admin/banners?id=' + id, { method: 'DELETE' });
      fetchBanners();
    } catch (err) { console.error('[BannerAdsTab delete]', err); }
  };

  const handleDuplicate = async (b: any) => {
    // Create a copy without id — server assigns new id
    const copy = { ...b };
    delete copy.id;
    delete copy.createdAt;
    delete copy.updatedAt;
    delete copy.impressions;
    delete copy.clicks;
    copy.title = (copy.title || '') + (locale === 'es' ? ' (copia)' : ' (copy)');
    try {
      const res = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(copy),
      });
      if (res.ok) {
        toast({ title: locale === 'es' ? 'Banner duplicado' : 'Banner duplicated' });
        fetchBanners();
      } else {
        toast({ title: locale === 'es' ? 'Error' : 'Error', description: locale === 'es' ? 'No se pudo duplicar' : 'Could not duplicate', variant: 'destructive' });
      }
    } catch (err) { console.error('[BannerAdsTab duplicate]', err); }
  };

  const handleToggle = async (b: any) => {
    try {
      await fetch('/api/admin/banners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: b.id, active: !b.active }),
      });
      fetchBanners();
    } catch {}
  };

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('purpose', 'listing');
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) { const data = await res.json(); setForm((f: any) => ({ ...f, imageUrl: data.url })); }
    } catch (err) { console.error('[BannerAdsTab upload]', err); }
  };

  const posLabel = (id: string) => POSITIONS.find((p) => p.id === id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">
          Gestiona los banners publicitarios del sitio. {banners.length} banner(es) total.
        </p>
        <Button size="sm" onClick={openCreate}>
          <ImageIcon className="w-4 h-4 mr-2" />
          {locale === 'es' ? 'Nuevo Banner' : 'New Banner'}
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterPos('')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!filterPos ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
          {locale === 'es' ? 'Todas' : 'All'}
        </button>
        {POSITIONS.map((p) => (
          <button key={p.id} onClick={() => setFilterPos(p.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterPos === p.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            {locale === 'es' ? p.labelEs : p.labelEn}
          </button>
        ))}
      </div>

      {/* Banner List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <Card key={i}><CardContent className="p-4"><Skeleton className="h-32 w-full rounded-lg" /></CardContent></Card>)}</div>
      ) : banners.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p>{locale === 'es' ? 'No hay banners' : 'No banners'}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={openCreate}>{locale === 'es' ? 'Crear Banner' : 'Create Banner'}</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {banners.map((b) => {
            const pos = posLabel(b.position);
            const isExpired = b.validUntil && new Date(b.validUntil) < new Date();
            return (
              <Card key={b.id} className={`overflow-hidden transition-all ${!b.active ? 'opacity-50' : ''} ${isExpired ? 'ring-2 ring-red-300' : ''}`}>
                <div className="relative">
                  <img src={b.imageUrl} alt={b.altText || ''} className="w-full h-32 object-cover bg-muted" />
                  <div className="absolute top-2 left-2 flex gap-1">
                    <Badge className="bg-primary/90 text-white border-transparent text-[10px]">{locale === 'es' ? pos?.labelEs : pos?.labelEn}</Badge>
                    {!b.active && <Badge className="bg-gray-500 text-white border-transparent text-[10px]">OFF</Badge>}
                    {isExpired && <Badge className="bg-red-500 text-white border-transparent text-[10px]">{locale === 'es' ? 'Expirado' : 'Expired'}</Badge>}
                  </div>
                </div>
                <CardContent className="p-3 space-y-2">
                  <p className="font-medium text-sm truncate">{b.title || b.description || (locale === 'es' ? 'Sin título' : 'No title')}</p>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{b.impressions || 0}</span>
                    <span className="flex items-center gap-1"><MousePointer className="w-3 h-3" />{b.clicks || 0}</span>
                    {b.width && b.height ? <span>{b.width}×{b.height}</span> : <span>{pos?.size}</span>}
                  </div>
                  <div className="flex items-center gap-1 pt-1">
                    <button onClick={() => handleToggle(b)} className="focus:outline-none">
                      {b.active ? <ToggleRight className="w-7 h-7 text-primary" /> : <ToggleLeft className="w-7 h-7 text-muted-foreground" />}
                    </button>
                    <div className="flex-1" />
                    <Button variant="ghost" size="sm" onClick={() => handleDuplicate(b)} title={locale === 'es' ? 'Duplicar banner' : 'Duplicate banner'}>
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(b)}>{locale === 'es' ? 'Editar' : 'Edit'}</Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(b.id)} title={locale === 'es' ? 'Eliminar banner' : 'Delete banner'}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? (locale === 'es' ? 'Editar Banner' : 'Edit Banner') : (locale === 'es' ? 'Nuevo Banner' : 'New Banner')}</DialogTitle>
            <DialogDescription>
              {locale === 'es' ? 'Configura el banner publicitario' : 'Configure the ad banner'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Position */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Posición *</label>
              <select value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="w-full h-10 rounded-md border bg-background px-3 text-sm">
                {POSITIONS.map((p) => (
                  <option key={p.id} value={p.id}>{locale === 'es' ? p.labelEs : p.labelEn} ({p.size})</option>
                ))}
              </select>
            </div>
            {/* Image upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Imagen *</label>
              <input type="file" accept="image/*" onChange={uploadImage} className="w-full text-sm" />
              {form.imageUrl && (
                <div className="relative rounded-lg overflow-hidden border">
                  <img src={form.imageUrl} alt="Preview" className="w-full h-24 object-cover" />
                  <button onClick={() => setForm({ ...form, imageUrl: '' })} className="absolute top-1 right-1 size-6 rounded-full bg-black/60 text-white flex items-center justify-center text-xs hover:bg-destructive">✕</button>
                </div>
              )}
              {!form.imageUrl && <Input placeholder="O pega la URL de la imagen" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />}
            </div>
            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{locale === 'es' ? 'Título' : 'Title'}</label>
              <Input placeholder={locale === 'es' ? 'Título del banner (opcional)' : 'Banner title (optional)'} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            {/* Link URL */}
            <div className="space-y-2">
              <label className="text-sm font-medium">URL del enlace</label>
              <Input placeholder="https://www.tu-sitio.com" value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} />
            </div>
            {/* Business info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">{locale === 'es' ? 'Negocio' : 'Business'}</label>
                <Input placeholder={locale === 'es' ? 'Nombre del negocio' : 'Business name'} value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input placeholder="email@site.com" value={form.businessEmail} onChange={(e) => setForm({ ...form, businessEmail: e.target.value })} />
              </div>
            </div>
            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{locale === 'es' ? 'Descripción (overlay)' : 'Description (overlay)'}</label>
              <Input placeholder={locale === 'es' ? 'Texto que aparece sobre la imagen' : 'Text shown over the image'} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            {/* Banner Dimensions */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">{locale === 'es' ? 'Ancho (px)' : 'Width (px)'}</label>
                <Input type="number" placeholder={locale === 'es' ? 'ej: 728' : 'e.g. 728'} value={form.width} onChange={(e) => setForm({ ...form, width: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{locale === 'es' ? 'Alto (px)' : 'Height (px)'}</label>
                <Input type="number" placeholder={locale === 'es' ? 'ej: 90' : 'e.g. 90'} value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} />
              </div>
            </div>
            {/* Dates + Sort + Active */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">{locale === 'es' ? 'Desde' : 'Valid from'}</label>
                <Input type="date" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{locale === 'es' ? 'Hasta' : 'Valid until'}</label>
                <Input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">{locale === 'es' ? 'Orden' : 'Sort order'}</label>
                <Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{locale === 'es' ? 'Estado' : 'Status'}</label>
                <button onClick={() => setForm({ ...form, active: !form.active })} className="flex items-center gap-2 h-10 px-3 rounded-md border w-full">
                  {form.active ? <ToggleRight className="w-6 h-6 text-primary" /> : <ToggleLeft className="w-6 h-6 text-muted-foreground" />}
                  <span className="text-sm">{form.active ? (locale === 'es' ? 'Activo' : 'Active') : (locale === 'es' ? 'Inactivo' : 'Inactive')}</span>
                </button>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>{locale === 'es' ? 'Cancelar' : 'Cancel'}</Button>
            <Button onClick={handleSave} disabled={saving || !form.position || !form.imageUrl}>
              {saving ? (locale === 'es' ? 'Guardando...' : 'Saving...') : (locale === 'es' ? 'Guardar' : 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Tab 5: Promote Listing (Quick Workflow) ─────────────────────
function PromoteListingTab({ locale, tp }: { locale: Locale; tp: (k: string) => string }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<ListingDTO[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedListing, setSelectedListing] = useState<ListingDTO | null>(null);
  const [newTier, setNewTier] = useState<ListingTier>('VIP');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSearch = () => {
    if (!search.trim()) return;
    setSearching(true);
    fetch(`/api/admin/listings?search=${encodeURIComponent(search)}&limit=10`)
      .then((r) => r.json())
      .then((data) => setResults(data.data || []))
      .finally(() => setSearching(false));
  };

  const handlePromote = async () => {
    if (!selectedListing) return;
    setLoading(true);
    try {
      await fetch(`/api/admin/listings/${selectedListing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: newTier }),
      });
      setSuccess(true);
      setSelectedListing(null);
      setSearch('');
      setResults([]);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) { console.error('[AdminPromotions promote]', err); }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Busca un anuncio por título y cámbialo a un plan superior con un solo clic.
      </p>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={tp('admin.searchListing')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch} disabled={searching}>
          {searching ? tp('common.loading') : tp('search.button')}
        </Button>
      </div>

      {/* Search Results */}
      {results.length > 0 && !selectedListing && (
        <div className="space-y-2">
          {results.map((listing) => (
            <button
              key={listing.id}
              onClick={() => setSelectedListing(listing)}
              className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
            >
              {listing.images[0] ? (
                <img src={listing.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">{getIcon('image-off', 'w-5 h-5 text-muted-foreground')}</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{listing.title}</p>
                <p className="text-xs text-muted-foreground">{listing.tier} · {listing.author?.name}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* Promote Form */}
      {selectedListing && (
        <Card className="ring-2 ring-primary">
          <CardHeader>
            <CardTitle className="text-lg">{selectedListing.title}</CardTitle>
            <CardDescription>
              {locale === 'es' ? selectedListing.category?.nameEs : selectedListing.category?.nameEn} ·
              Tier actual: <Badge className="border-transparent" style={tierBadge(selectedListing.tier)}>{selectedListing.tier}</Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{tp('admin.selectTier')}</label>
              <div className="grid grid-cols-2 gap-3">
                {PAID_TIERS.map((t) => {
                  const plan = PRICING_PLANS.find((p) => p.id === t);
                  const isSelected = newTier === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setNewTier(t)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        isSelected ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/30'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: plan?.color + '20' }}>
                          <Sparkles className="w-4 h-4" style={{ color: plan?.color }} />
                        </div>
                        <span className="font-semibold" style={{ color: plan?.color }}>
                          {locale === 'es' ? plan?.nameEs : plan?.nameEn}
                        </span>
                      </div>
                      <p className="text-2xl font-bold">€{plan?.price}</p>
                      <p className="text-xs text-muted-foreground">{t === 'BUSINESS' ? tp('pricing.monthly') : tp('pricing.perPost')}</p>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSelectedListing(null)}>{tp('common.cancel')}</Button>
              <Button onClick={handlePromote} disabled={loading || newTier === selectedListing.tier}>
                {loading ? tp('common.loading') : <><Zap className="w-4 h-4 mr-2" />{tp('admin.applyPromotion')}</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success */}
      {success && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <p className="font-semibold text-emerald-700 dark:text-emerald-400">{tp('admin.promotionApplied')}</p>
        </div>
      )}
    </div>
  );
}

// ── Main Promotions Page ────────────────────────────────────────
export function AdminPromotions() {
  const { locale } = useI18n();
  const { tp } = useI18n();

  return (
    <Tabs defaultValue="promote" className="space-y-6">
      <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full h-auto p-1">
        <TabsTrigger value="slider" className="text-xs sm:text-sm py-2">
          <Star className="w-4 h-4 mr-1.5 hidden sm:block" />
          {tp('admin.sliderVip')}
        </TabsTrigger>
        <TabsTrigger value="category" className="text-xs sm:text-sm py-2">
          <Eye className="w-4 h-4 mr-1.5 hidden sm:block" />
          {tp('admin.categoryFeatured')}
        </TabsTrigger>
        <TabsTrigger value="directory" className="text-xs sm:text-sm py-2">
          <Store className="w-4 h-4 mr-1.5 hidden sm:block" />
          {tp('admin.businessDirectory')}
        </TabsTrigger>
        <TabsTrigger value="banners" className="text-xs sm:text-sm py-2">
          <ImageIcon className="w-4 h-4 mr-1.5 hidden sm:block" />
          {tp('admin.adBanners')}
        </TabsTrigger>
        <TabsTrigger value="promote" className="text-xs sm:text-sm py-2 col-span-2 md:col-span-1">
          <Zap className="w-4 h-4 mr-1.5 hidden sm:block" />
          {tp('admin.promoteListing')}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="slider">
        <VipSliderTab locale={locale} tp={tp} />
      </TabsContent>
      <TabsContent value="category">
        <CategoryFeaturedTab locale={locale} tp={tp} />
      </TabsContent>
      <TabsContent value="directory">
        <BusinessDirectoryTab locale={locale} tp={tp} />
      </TabsContent>
      <TabsContent value="banners">
        <BannerAdsTab locale={locale} tp={tp} />
      </TabsContent>
      <TabsContent value="promote">
        <PromoteListingTab locale={locale} tp={tp} />
      </TabsContent>
    </Tabs>
  );
}
