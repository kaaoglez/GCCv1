'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import {
  Home,
  Plus,
  Edit3,
  Trash2,
  RefreshCw,
  CheckCircle,
  Eye,
  MoreVertical,
  AlertTriangle,
  ImageIcon,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useI18n } from '@/hooks/use-i18n';
import { navigateBack, navigateTo } from '@/hooks/use-navigation';
import { useModalStore } from '@/lib/modal-store';
import { formatPrice, getRelativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { toast } from 'sonner';
import type { ListingDTO } from '@/lib/types';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  DRAFT: 'bg-gray-100 text-gray-700',
  EXPIRED: 'bg-amber-100 text-amber-700',
  SOLD: 'bg-red-100 text-red-700',
  ARCHIVED: 'bg-gray-200 text-gray-500',
};

export function MisAnunciosPage() {
  const { data: session, status } = useSession();
  const { locale, tp } = useI18n();
  const openListingDetail = useModalStore((s) => s.openListingDetail);
  const { openAuth } = useModalStore();

  const [listings, setListings] = useState<ListingDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editListing, setEditListing] = useState<ListingDTO | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchListings = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/listings?authorId=${session.user.id}&limit=50`);
      const data = await res.json();
      setListings(data.data || []);
      setTotal(data.total || 0);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Loading session
  if (status === 'loading') {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      </div>
    );
  }

  // Not logged in
  if (!session) {
    return (
      <div className="w-full max-w-md mx-auto px-4 sm:px-6 py-16 text-center space-y-4">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        <h2 className="text-xl font-bold">{locale === 'es' ? 'Inicia sesión' : 'Sign in'}</h2>
        <p className="text-muted-foreground text-sm">
          {locale === 'es' ? 'Necesitas iniciar sesión para ver tus anuncios.' : 'Sign in to view your listings.'}
        </p>
        <Button onClick={openAuth} className="bg-primary hover:bg-primary/90">{locale === 'es' ? 'Iniciar sesión' : 'Sign in'}</Button>
      </div>
    );
  }

  const handleRenew = async (listing: ListingDTO) => {
    try {
      const res = await fetch(`/api/listings/${listing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ renew: true }),
      });
      if (res.ok) {
        toast.success(locale === 'es' ? 'Anuncio renovado por 30 días' : 'Listing renewed for 30 days');
        fetchListings();
        useModalStore.getState().bumpListingsRefreshKey();
      }
    } catch { toast.error('Error'); }
  };

  const handleSoldToggle = async (listing: ListingDTO) => {
    const newStatus = listing.status === 'SOLD' ? 'ACTIVE' : 'SOLD';
    try {
      const res = await fetch(`/api/listings/${listing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(newStatus === 'SOLD'
          ? (locale === 'es' ? '¡Felicidades! Anuncio marcado como vendido' : 'Listing marked as sold!')
          : (locale === 'es' ? 'Anuncio marcado como disponible' : 'Listing marked as available'));
        fetchListings();
        useModalStore.getState().bumpListingsRefreshKey();
      }
    } catch { toast.error('Error'); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/listings/${deleteId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(locale === 'es' ? 'Anuncio eliminado' : 'Listing deleted');
        setDeleteId(null);
        fetchListings();
        useModalStore.getState().bumpListingsRefreshKey();
      }
    } catch { toast.error('Error'); }
    setDeleting(false);
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, { es: string; en: string }> = {
      ACTIVE: { es: 'Activo', en: 'Active' },
      DRAFT: { es: 'Borrador', en: 'Draft' },
      EXPIRED: { es: 'Expirado', en: 'Expired' },
      SOLD: { es: 'Vendido', en: 'Sold' },
      ARCHIVED: { es: 'Archivado', en: 'Archived' },
    };
    return map[status]?.[locale] || status;
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10"
      >
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10"
    >
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <button onClick={() => navigateBack()} className="hover:text-primary transition-colors flex items-center gap-1">
                <Home className="size-3.5" />
                {locale === 'es' ? 'Inicio' : 'Home'}
              </button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <button onClick={() => navigateTo('perfil')} className="hover:text-primary transition-colors">
                {locale === 'es' ? 'Perfil' : 'Profile'}
              </button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{locale === 'es' ? 'Mis Anuncios' : 'My Listings'}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            {locale === 'es' ? 'Mis Anuncios' : 'My Listings'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {total} {locale === 'es' ? 'anuncios publicados' : 'published listings'}
          </p>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-semibold shadow-sm"
          onClick={() => useModalStore.getState().openPostAd()}
        >
          <Plus className="size-4" />
          {tp('nav', 'postAd')}
        </Button>
      </div>

      {/* Listings */}
      {listings.length === 0 ? (
        <Card className="py-16">
          <CardContent className="flex flex-col items-center text-center gap-3">
            <ImageIcon className="size-12 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold">{locale === 'es' ? 'No tienes anuncios' : 'No listings yet'}</h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              {locale === 'es'
                ? 'Publica tu primer anuncio y llega a toda la comunidad de Gran Canaria.'
                : 'Post your first listing and reach the entire Gran Canaria community.'}
            </p>
            <Button className="mt-4 bg-primary hover:bg-primary/90" onClick={() => useModalStore.getState().openPostAd()}>
              <Plus className="size-4 mr-2" />
              {tp('nav', 'postAd')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {listings.map((listing, index) => {
            const price = listing.metadata?.price as number | undefined;
            const image = listing.images?.[0];

            return (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                      {/* Image */}
                      <div className="relative w-full sm:w-40 h-32 sm:h-auto bg-muted flex-shrink-0">
                        {image ? (
                          <Image src={image} alt={listing.title} fill className="object-cover" sizes="160px" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <ImageIcon className="size-8 opacity-30" />
                          </div>
                        )}
                        {listing.status === 'SOLD' && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Badge className="bg-red-600 text-white text-sm font-bold px-3 py-1">
                              VENDIDO
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-4 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => openListingDetail(listing)}
                          >
                            <h3 className="font-semibold text-sm hover:text-primary transition-colors line-clamp-1">
                              {listing.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span className="font-semibold text-foreground">
                                {price ? formatPrice(price, locale) : (locale === 'es' ? 'Gratis' : 'Free')}
                              </span>
                              <span>•</span>
                              <span>{listing.category[locale === 'es' ? 'nameEs' : 'nameEn']}</span>
                              {listing.municipality && <><span>•</span><span>{listing.municipality}</span></>}
                              <span>•</span>
                              <span>{getRelativeTime(listing.createdAt, locale)}</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground">
                                <MoreVertical className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditListing(listing)}>
                                <Edit3 className="mr-2 size-4" />
                                {locale === 'es' ? 'Editar' : 'Edit'}
                              </DropdownMenuItem>
                              {listing.status === 'SOLD' ? (
                                <DropdownMenuItem onClick={() => handleSoldToggle(listing)}>
                                  <RefreshCw className="mr-2 size-4" />
                                  {locale === 'es' ? 'Marcar disponible' : 'Mark available'}
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleSoldToggle(listing)}>
                                  <CheckCircle className="mr-2 size-4" />
                                  {locale === 'es' ? 'Marcar vendido' : 'Mark as sold'}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleRenew(listing)}>
                                <RefreshCw className="mr-2 size-4" />
                                {locale === 'es' ? 'Renovar' : 'Renew'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteId(listing.id)}>
                                <Trash2 className="mr-2 size-4" />
                                {locale === 'es' ? 'Eliminar' : 'Delete'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          {/* Status badge */}
                          <Badge className={cn('shrink-0 text-xs', STATUS_COLORS[listing.status] || '')}>
                            {getStatusLabel(listing.status)}
                          </Badge>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="size-3" />{listing.viewCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <EditListingDialog
        listing={editListing}
        onClose={() => setEditListing(null)}
        onSaved={fetchListings}
        locale={locale}
      />

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              {locale === 'es' ? '¿Eliminar anuncio?' : 'Delete listing?'}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {locale === 'es'
              ? 'Esta acción no se puede deshacer. El anuncio se eliminará permanentemente.'
              : 'This action cannot be undone. The listing will be permanently deleted.'}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>
              {locale === 'es' ? 'Cancelar' : 'Cancel'}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? '...' : <><Trash2 className="size-4 mr-2" />{locale === 'es' ? 'Eliminar' : 'Delete'}</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

/* ── Edit Listing Dialog ──────────────────────────────────── */
function EditListingDialog({
  listing,
  onClose,
  onSaved,
  locale,
}: {
  listing: ListingDTO | null;
  onClose: () => void;
  onSaved: () => void;
  locale: string;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (listing) {
      setTitle(listing.title);
      setDescription(listing.description);
      const p = listing.metadata?.price as number | undefined;
      setPrice(p ? String(p) : '');
      setMunicipality(listing.municipality || '');
    }
  }, [listing]);

  if (!listing) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const metadata = { ...(listing.metadata || {}), price: price ? Number(price) : 0 };
      const res = await fetch(`/api/listings/${listing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          municipality: municipality.trim() || null,
          metadata,
        }),
      });
      if (res.ok) {
        toast.success(locale === 'es' ? 'Anuncio actualizado' : 'Listing updated');
        onSaved();
        onClose();
      }
    } catch {
      toast.error('Error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!listing} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{locale === 'es' ? 'Editar anuncio' : 'Edit listing'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label>{locale === 'es' ? 'Título' : 'Title'}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>{locale === 'es' ? 'Descripción' : 'Description'}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label>{locale === 'es' ? 'Precio (€)' : 'Price (€)'}</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={locale === 'es' ? '0 = Gratis' : '0 = Free'}
            />
          </div>
          <div className="space-y-2">
            <Label>{locale === 'es' ? 'Municipio' : 'Municipality'}</Label>
            <Input
              value={municipality}
              onChange={(e) => setMunicipality(e.target.value)}
              placeholder={locale === 'es' ? 'Ej: Las Palmas de GC' : 'e.g. Las Palmas de GC'}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {locale === 'es' ? 'Cancelar' : 'Cancel'}
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              {locale === 'es' ? 'Guardar' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
