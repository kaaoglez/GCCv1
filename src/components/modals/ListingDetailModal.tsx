// ═══════════════════════════════════════════════════════════════
// GRAN CANARIA CONECTA - ListingDetailModal Component
// Simple preview popup with "Ver completo" navigation to full page
// ═══════════════════════════════════════════════════════════════

'use client';

import { useState, useCallback } from 'react';
import {
  MapPin,
  Eye,
  Share2,
  Clock,
  ImageIcon,
  ImageOff,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Phone,
  X,
  ArrowUpCircle,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/hooks/use-i18n';
import { useModalStore } from '@/lib/modal-store';
import { useSession } from 'next-auth/react';
import { TierBadge } from '@/components/shared/TierBadge';
import { CategoryBadge } from '@/components/shared/CategoryBadge';
import { formatPrice, getRelativeTime, formatDate, truncateText } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { DynamicField } from '@/lib/types';

const METADATA_LABELS: Record<string, Record<string, string>> = {
  phone: { es: 'Teléfono', en: 'Phone' }, whatsapp: { es: 'WhatsApp', en: 'WhatsApp' },
  email: { es: 'Email', en: 'Email' }, website: { es: 'Sitio web', en: 'Website' },
  socialMedia: { es: 'Redes sociales', en: 'Social media' },
  hours: { es: 'Horario', en: 'Hours' }, schedule: { es: 'Horario', en: 'Schedule' },
  address: { es: 'Dirección', en: 'Address' }, location: { es: 'Ubicación', en: 'Location' },
  parking: { es: 'Aparcamiento', en: 'Parking' },
  condition: { es: 'Estado', en: 'Condition' }, brand: { es: 'Marca', en: 'Brand' },
  model: { es: 'Modelo', en: 'Model' }, size: { es: 'Talla', en: 'Size' },
  color: { es: 'Color', en: 'Color' }, material: { es: 'Material', en: 'Material' },
  year: { es: 'Año', en: 'Year' }, km: { es: 'Kilómetros', en: 'Kilometers' },
  fuel: { es: 'Combustible', en: 'Fuel' }, genre: { es: 'Género', en: 'Genre' },
  quantity: { es: 'Cantidad', en: 'Quantity' }, dimensions: { es: 'Dimensiones', en: 'Dimensions' },
  weight: { es: 'Peso', en: 'Weight' }, rooms: { es: 'Habitaciones', en: 'Rooms' },
  bedrooms: { es: 'Habitaciones', en: 'Bedrooms' }, bathrooms: { es: 'Baños', en: 'Bathrooms' },
  area: { es: 'Superficie m²', en: 'Area m²' }, floor: { es: 'Planta', en: 'Floor' },
  capacity: { es: 'Capacidad', en: 'Capacity' }, furnished: { es: 'Amueblado', en: 'Furnished' },
  pets: { es: 'Mascotas', en: 'Pets' }, longTerm: { es: 'Larga temporada', en: 'Long term' },
  pool: { es: 'Piscina', en: 'Pool' }, garden: { es: 'Jardín', en: 'Garden' },
  type: { es: 'Tipo', en: 'Type' }, listingType: { es: 'Tipo de anuncio', en: 'Listing type' },
  specialty: { es: 'Especialidad', en: 'Specialty' },
  cuisine: { es: 'Tipo de cocina', en: 'Cuisine type' },
  delivery: { es: 'Entrega a domicilio', en: 'Delivery' }, terrace: { es: 'Terraza', en: 'Terrace' },
  isEco: { es: 'Km 0 / Ecológico', en: 'Km 0 / Eco' }, organic: { es: 'Ecológico', en: 'Organic' },
  products: { es: 'Productos', en: 'Products' }, homeVisit: { es: 'Visita a domicilio', en: 'Home visit' },
  emergency: { es: 'Urgencias 24h', en: '24h Emergency' }, certified: { es: 'Certificado', en: 'Certified' },
  wifi: { es: 'Wifi', en: 'Wifi' }, accessibility: { es: 'Accesibilidad', en: 'Accessibility' },
  activityType: { es: 'Tipo de actividad', en: 'Activity type' },
  priceRange: { es: 'Rango de precio', en: 'Price range' }, difficulty: { es: 'Dificultad', en: 'Difficulty' },
  jobType: { es: 'Tipo de contrato', en: 'Job type' }, sector: { es: 'Sector', en: 'Sector' },
  experience: { es: 'Experiencia', en: 'Experience' }, remote: { es: 'Teletrabajo', en: 'Remote' },
  animalType: { es: 'Tipo de animal', en: 'Animal type' }, breed: { es: 'Raza', en: 'Breed' },
  age: { es: 'Edad', en: 'Age' }, ageRange: { es: 'Rango de edad', en: 'Age range' },
  volunteerType: { es: 'Tipo de voluntariado', en: 'Volunteer type' },
  commitment: { es: 'Compromiso', en: 'Commitment' }, date: { es: 'Fecha', en: 'Date' },
  budget: { es: 'Presupuesto', en: 'Budget' }, preferences: { es: 'Preferencias', en: 'Preferences' },
};

function getFieldLabel(key: string, locale: string, allowedFields?: DynamicField[]): string {
  if (allowedFields) {
    const field = allowedFields.find((f) => f.key === key);
    if (field) return locale === 'en' ? field.labelEn : field.labelEs;
  }
  return METADATA_LABELS[key]?.[locale] || METADATA_LABELS[key]?.es || key;
}

function formatMetadataValue(value: unknown, locale: string): string {
  if (typeof value === 'boolean') return value ? (locale === 'es' ? 'Sí' : 'Yes') : (locale === 'es' ? 'No' : 'No');
  return String(value);
}

export function ListingDetailModal() {
  const { locale, tp } = useI18n();
  const {
    selectedListing,
    isListingDetailOpen,
    closeListingDetail,
    openMessage,
    openAuth,
    openPayment,
    setListingForFullView,
  } = useModalStore();
  const { data: session } = useSession();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  const handleClose = useCallback(() => {
    // Clear saved scrollY — user closed popup without going to full view
    delete (window as unknown as Record<string, number>).__gccAnunciosScrollY;
    setCurrentImageIndex(0);
    setImageErrors({});
    closeListingDetail();
  }, [closeListingDetail]);

  // Navigate to full individual page — keeps __gccAnunciosScrollY for pushNavigationState
  const handleViewFull = useCallback(() => {
    if (!selectedListing) return;
    setListingForFullView(selectedListing);
  }, [selectedListing, setListingForFullView]);

  if (!selectedListing) return null;

  const listing = selectedListing;
  const safeImages = (listing.images || []).filter((img: string) => {
    if (!img || typeof img !== 'string') return false;
    if (img.includes('${')) return false;
    return img.startsWith('/') || img.startsWith('http');
  });
  const price = listing.metadata?.price as number | undefined;
  const isFree = !price || price === 0;
  const allowedFields = listing.category?.allowedFields;
  const metadataEntries = listing.metadata
    ? Object.entries(listing.metadata).filter(
        ([key, val]) => key !== 'price' && val !== '' && val !== null && val !== undefined
      )
    : [];

  const prevImage = () => {
    setCurrentImageIndex((i) => (i > 0 ? i - 1 : safeImages.length - 1));
  };
  const nextImage = () => {
    setCurrentImageIndex((i) => (i < safeImages.length - 1 ? i + 1 : 0));
  };

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: listing.title, url: window.location.href }); } catch { /* cancelled */ }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  const priceLabel = isFree
    ? (locale === 'es' ? 'Gratis' : 'Free')
    : typeof price === 'number'
      ? formatPrice(price, locale)
      : (locale === 'es' ? 'Negociar' : 'Negotiable');

  // Use key to remount content when listing changes (resets all state)
  const listingKey = selectedListing?.id ?? 'none';

  return (
    <Dialog
      open={isListingDetailOpen}
      onOpenChange={(open) => { if (!open) handleClose(); }}
    >
      <DialogContent key={listingKey} className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-xl">
        <DialogTitle className="sr-only">{listing.title}</DialogTitle>

        {/* ── Image Gallery ── */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted rounded-t-xl">
          {safeImages.length > 0 && !imageErrors[currentImageIndex] ? (
            <img
              src={safeImages[currentImageIndex]}
              alt={listing.title}
              className="absolute inset-0 w-full h-full object-cover"
              onError={() => setImageErrors((p) => ({ ...p, [currentImageIndex]: true }))}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="text-center space-y-2">
                <ImageOff className="size-10 text-muted-foreground/30 mx-auto" />
                <p className="text-muted-foreground text-xs">{locale === 'es' ? 'Sin imagen' : 'No image'}</p>
              </div>
            </div>
          )}

          {/* Image nav arrows */}
          {safeImages.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center size-8 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center size-8 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
              >
                <ChevronRight className="size-4" />
              </button>
            </>
          )}

          {/* Top badges */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5">
            <TierBadge tier={listing.tier} />
            <CategoryBadge category={listing.category} size="sm" />
          </div>

          {/* Image counter */}
          {safeImages.length > 0 && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
              <ImageIcon className="size-3" />
              {currentImageIndex + 1}/{safeImages.length}
            </div>
          )}

          {/* SOLD overlay */}
          {listing.status === 'SOLD' && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
              <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded shadow uppercase">
                {locale === 'es' ? 'Vendido' : 'Sold'}
              </span>
            </div>
          )}
        </div>

        {/* ── Thumbnail strip ── */}
        {safeImages.length > 1 && (
          <div className="flex gap-1.5 px-3 py-2 bg-muted/30 overflow-x-auto">
            {safeImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setCurrentImageIndex(i)}
                className={cn(
                  'relative flex-shrink-0 w-14 h-10 rounded-md overflow-hidden border-2 transition-all',
                  i === currentImageIndex
                    ? 'border-primary opacity-100'
                    : 'border-transparent opacity-50 hover:opacity-80'
                )}
              >
                {imageErrors[i] ? (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <ImageOff className="size-3 text-muted-foreground/30" />
                  </div>
                ) : (
                  <img
                    src={img}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={() => setImageErrors((p) => ({ ...p, [i]: true }))}
                  />
                )}
              </button>
            ))}
          </div>
        )}

        {/* ── Content ── */}
        <div className="px-4 py-4 space-y-4">
          {/* Title + Price */}
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-foreground leading-tight">
              {listing.title}
            </h2>
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  'text-xl font-extrabold',
                  isFree
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-foreground'
                )}
              >
                {priceLabel}
              </span>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {listing.municipality && (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3" />
                    {listing.municipality}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Eye className="size-3" />
                  {listing.viewCount}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  {getRelativeTime(listing.createdAt, locale)}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Author */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center size-9 rounded-full bg-muted shrink-0">
              {listing.author.avatar ? (
                <img
                  src={listing.author.avatar}
                  alt={listing.author.name}
                  className="size-9 rounded-full object-cover"
                />
              ) : (
                <span className="text-xs font-bold text-muted-foreground">
                  {listing.author.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-sm truncate">{listing.author.name}</span>
                {listing.author.isVerified && (
                  <ShieldCheck className="size-3.5 text-emerald-600 shrink-0" />
                )}
              </div>
              {listing.author.businessName && (
                <span className="text-xs text-muted-foreground truncate block">
                  {listing.author.businessName}
                </span>
              )}
            </div>
          </div>

          {/* Description (truncated) */}
          {listing.description && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {truncateText(listing.description, 180)}
              </p>
              {listing.description.length > 180 && (
                <button
                  onClick={handleViewFull}
                  className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                >
                  {locale === 'es' ? 'Leer más' : 'Read more'}
                </button>
              )}
            </div>
          )}

          {/* Metadata fields (up to 4 shown) */}
          {metadataEntries.length > 0 && (
            <div className="grid grid-cols-2 gap-1.5">
              {metadataEntries.slice(0, 4).map(([key, value]) => (
                <div
                  key={key}
                  className="text-xs bg-muted/50 rounded-md px-2.5 py-1.5"
                >
                  <span className="text-muted-foreground">{getFieldLabel(key, locale, allowedFields)}</span>
                  <span className="font-medium text-foreground ml-1">{formatMetadataValue(value, locale)}</span>
                </div>
              ))}
              {metadataEntries.length > 4 && (
                <button
                  onClick={handleViewFull}
                  className="text-xs font-medium text-primary hover:underline col-span-2 text-center"
                >
                  +{metadataEntries.length - 4} {locale === 'es' ? 'más detalles' : 'more details'}
                </button>
              )}
            </div>
          )}

          <Separator />

          {/* ── "Ver completo" button ── */}
          <Button
            className="w-full gap-2 font-semibold"
            onClick={handleViewFull}
          >
            <ExternalLink className="size-4" />
            {locale === 'es' ? 'Ver anuncio completo' : 'View full listing'}
          </Button>

          {/* ── Action buttons ── */}
          <div className="flex gap-2">
            <Button
              className="flex-1 gap-1.5 text-sm bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => {
                if (!session?.user?.id) { openAuth(); return; }
                openMessage({
                  receiverId: listing.author.id,
                  receiverName: listing.author.name,
                  listingId: listing.id,
                  listingTitle: listing.title,
                  listingImage: listing.images?.[0],
                });
              }}
            >
              <MessageSquare className="size-3.5" />
              {tp('listings', 'contact')}
            </Button>

            {listing.contactMethods?.includes('whatsapp') && (
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={() =>
                  window.open(
                    `https://wa.me/?text=${encodeURIComponent(
                      locale === 'es'
                        ? `Hola, me interesa tu anuncio: ${listing.title}`
                        : `Hi, I'm interested in your listing: ${listing.title}`
                    )}`,
                    '_blank'
                  )
                }
              >
                💬
              </Button>
            )}

            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={handleShare}
            >
              <Share2 className="size-3.5" />
            </Button>
          </div>

          {/* Secondary actions */}
          <div className="flex gap-2">
            {listing.showPhone && (
              <Button variant="ghost" size="sm" className="flex-1 gap-1.5 text-xs">
                <Phone className="size-3" />
                {tp('form', 'phone')}
              </Button>
            )}
            {listing.tier !== 'BUSINESS' && (
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 gap-1.5 text-xs"
                onClick={() =>
                  openPayment({
                    type: 'BUMP',
                    listingId: listing.id,
                    amount: 3,
                    listingTitle: listing.title,
                  })
                }
              >
                <ArrowUpCircle className="size-3" />
                {tp('listings', 'bump')} (€3)
              </Button>
            )}
          </div>

          {/* Published date */}
          <p className="text-xs text-muted-foreground text-center">
            {tp('listings', 'postedOn')} {formatDate(listing.createdAt, locale)}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
