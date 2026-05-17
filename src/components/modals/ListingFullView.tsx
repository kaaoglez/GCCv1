// ═══════════════════════════════════════════════════════════════
// GRAN CANARIA CONECTA - ListingFullView Component
// INLINE EXPANDED VIEW — Large gallery + thumbnails + inline zoom
// Same pattern as ArticleReadingView: replaces main content, keeps Nav+Footer
// ═══════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Eye,
  MessageSquare,
  Phone,
  Mail,
  Share2,
  Clock,
  ArrowUpCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Check,
  ImageIcon,
  ZoomIn,
  ZoomOut,
  Home,
  ImageOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/hooks/use-i18n';
import { useModalStore } from '@/lib/modal-store';
import { useSession } from 'next-auth/react';
import { navigateBack } from '@/hooks/use-navigation';
import { TierBadge } from '@/components/shared/TierBadge';
import { CategoryBadge } from '@/components/shared/CategoryBadge';
import { formatPrice, getRelativeTime, formatDate } from '@/lib/format';
import { PRICING_PLANS } from '@/lib/types';
import type { DynamicField } from '@/lib/types';
import { cn } from '@/lib/utils';
// Using native <img> for maximum reliability across proxy setups

// Complete translation map for ALL listing metadata keys
const METADATA_LABELS: Record<string, Record<string, string>> = {
  // Contact
  phone:        { es: 'Teléfono', en: 'Phone' },
  whatsapp:     { es: 'WhatsApp', en: 'WhatsApp' },
  email:        { es: 'Email', en: 'Email' },
  website:      { es: 'Sitio web', en: 'Website' },
  socialMedia:  { es: 'Redes sociales', en: 'Social media' },
  // Location & hours
  hours:        { es: 'Horario', en: 'Hours' },
  schedule:     { es: 'Horario', en: 'Schedule' },
  address:      { es: 'Dirección', en: 'Address' },
  location:     { es: 'Ubicación', en: 'Location' },
  parking:      { es: 'Aparcamiento', en: 'Parking' },
  // Product details
  condition:    { es: 'Estado', en: 'Condition' },
  brand:        { es: 'Marca', en: 'Brand' },
  model:        { es: 'Modelo', en: 'Model' },
  size:         { es: 'Talla', en: 'Size' },
  color:        { es: 'Color', en: 'Color' },
  material:     { es: 'Material', en: 'Material' },
  year:         { es: 'Año', en: 'Year' },
  km:           { es: 'Kilómetros', en: 'Kilometers' },
  fuel:         { es: 'Combustible', en: 'Fuel' },
  genre:        { es: 'Género', en: 'Genre' },
  quantity:     { es: 'Cantidad', en: 'Quantity' },
  dimensions:   { es: 'Dimensiones', en: 'Dimensions' },
  weight:       { es: 'Peso', en: 'Weight' },
  // Housing
  rooms:        { es: 'Habitaciones', en: 'Rooms' },
  bedrooms:     { es: 'Habitaciones', en: 'Bedrooms' },
  bathrooms:    { es: 'Baños', en: 'Bathrooms' },
  area:         { es: 'Superficie m²', en: 'Area m²' },
  floor:        { es: 'Planta', en: 'Floor' },
  capacity:     { es: 'Capacidad', en: 'Capacity' },
  furnished:    { es: 'Amueblado', en: 'Furnished' },
  pets:         { es: 'Mascotas', en: 'Pets' },
  longTerm:     { es: 'Larga temporada', en: 'Long term' },
  pool:         { es: 'Piscina', en: 'Pool' },
  garden:       { es: 'Jardín', en: 'Garden' },
  // Services & business
  type:         { es: 'Tipo', en: 'Type' },
  listingType:  { es: 'Tipo de anuncio', en: 'Listing type' },
  specialty:    { es: 'Especialidad', en: 'Specialty' },
  cuisine:      { es: 'Tipo de cocina', en: 'Cuisine type' },
  delivery:     { es: 'Entrega a domicilio', en: 'Delivery' },
  terrace:      { es: 'Terraza', en: 'Terrace' },
  isEco:        { es: 'Km 0 / Ecológico', en: 'Km 0 / Eco' },
  organic:      { es: 'Ecológico', en: 'Organic' },
  products:     { es: 'Productos', en: 'Products' },
  homeVisit:    { es: 'Visita a domicilio', en: 'Home visit' },
  emergency:    { es: 'Urgencias 24h', en: '24h Emergency' },
  certified:    { es: 'Certificado', en: 'Certified' },
  wifi:         { es: 'Wifi', en: 'Wifi' },
  accessibility:{ es: 'Accesibilidad', en: 'Accessibility' },
  // Tourism
  activityType: { es: 'Tipo de actividad', en: 'Activity type' },
  priceRange:   { es: 'Rango de precio', en: 'Price range' },
  difficulty:   { es: 'Dificultad', en: 'Difficulty' },
  // Jobs
  jobType:      { es: 'Tipo de contrato', en: 'Job type' },
  sector:       { es: 'Sector', en: 'Sector' },
  experience:   { es: 'Experiencia', en: 'Experience' },
  remote:       { es: 'Teletrabajo', en: 'Remote' },
  // Pets & community
  animalType:   { es: 'Tipo de animal', en: 'Animal type' },
  breed:        { es: 'Raza', en: 'Breed' },
  age:          { es: 'Edad', en: 'Age' },
  ageRange:     { es: 'Rango de edad', en: 'Age range' },
  volunteerType:{ es: 'Tipo de voluntariado', en: 'Volunteer type' },
  commitment:   { es: 'Compromiso', en: 'Commitment' },
  date:         { es: 'Fecha', en: 'Date' },
  budget:       { es: 'Presupuesto', en: 'Budget' },
  preferences:  { es: 'Preferencias', en: 'Preferences' },
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

export function ListingFullView() {
  const { locale, tp } = useI18n();
  const {
    selectedListing,
    isListingFullView,
    openPayment,
    openMessage,
    openAuth,
  } = useModalStore();
  const { data: session } = useSession();

  // Derived values needed by hooks (before early return)
  const images = selectedListing?.images || [];
  const imagesLength = images.length;
  const currentView = useModalStore((s) => s.currentView);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showUpgrade, setShowUpgrade] = useState(false);
  const thumbsRef = useRef<HTMLDivElement>(null);

  // Scroll to top when entering full view (DOM side-effect only)
  useEffect(() => {
    if (isListingFullView) {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, [isListingFullView]);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (!thumbsRef.current) return;
    const activeThumb = thumbsRef.current.children[currentImageIndex] as HTMLElement | undefined;
    if (activeThumb) {
      activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentImageIndex]);

  // Filter out broken images (template strings from old bug)
  const safeImages = images.filter((img) => {
    if (!img || typeof img !== 'string') return false;
    if (img.includes('${')) return false;
    return img.startsWith('/') || img.startsWith('http');
  });

  // Image navigation callbacks (needed by keyboard effect)
  const prevImage = useCallback(() => {
    setCurrentImageIndex((i) => (i > 0 ? i - 1 : safeImages.length - 1));
    setZoom(1); setPan({ x: 0, y: 0 });
  }, [safeImages.length]);
  const nextImage = useCallback(() => {
    setCurrentImageIndex((i) => (i < safeImages.length - 1 ? i + 1 : 0));
    setZoom(1); setPan({ x: 0, y: 0 });
  }, [safeImages.length]);
  const enterZoom = useCallback(() => { setIsZoomed(true); setZoom(1); setPan({ x: 0, y: 0 }); }, []);
  const exitZoom = useCallback(() => { setIsZoomed(false); setZoom(1); setPan({ x: 0, y: 0 }); }, []);

  // Keyboard nav for zoomed image
  useEffect(() => {
    if (!isZoomed) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { exitZoom(); return; }
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
      if ((e.key === '+' || e.key === '=') && zoom < 3) setZoom((z) => z + 0.5);
      if (e.key === '-' && zoom > 1) { const nz = zoom - 0.5; setZoom(nz); if (nz <= 1) setPan({ x: 0, y: 0 }); }
      if (e.key === '0') { setZoom(1); setPan({ x: 0, y: 0 }); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isZoomed, zoom, prevImage, nextImage, exitZoom]);

  // Show loading skeleton while fetching data on reload
  if (isListingFullView && !selectedListing) {
    return (
      <div className="w-full">
        <div className="border-b bg-muted/30">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
            <div className="h-8 w-40 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 space-y-4">
              <div className="aspect-[4/3] w-full rounded-2xl bg-muted animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-3 w-full bg-muted animate-pulse rounded" />
                <div className="h-3 w-3/4 bg-muted animate-pulse rounded" />
                <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
              </div>
            </div>
            <div className="lg:col-span-2 space-y-5">
              <div className="h-8 w-3/4 bg-muted animate-pulse rounded" />
              <div className="h-14 w-full bg-muted animate-pulse rounded-xl" />
              <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
              <div className="h-10 w-full bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isListingFullView || !selectedListing) return null;

  const listing = selectedListing;
  const listingId = listing?.id || '';
  const price = listing.metadata?.price as number | undefined;
  const isFree = !price || price === 0;
  const isVipOrBusiness = listing.tier === 'VIP' || listing.tier === 'BUSINESS';
  const canUpgrade = listing.tier === 'FREE' || listing.tier === 'HIGHLIGHTED';
  const backLabel = currentView === 'directory'
    ? (locale === 'es' ? 'Volver a Directorio' : 'Back to Directory')
    : tp('listings', 'backToListings');
  const nextTier =
    listing.tier === 'FREE'
      ? PRICING_PLANS.find((p) => p.id === 'HIGHLIGHTED')
      : listing.tier === 'HIGHLIGHTED'
        ? PRICING_PLANS.find((p) => p.id === 'VIP')
        : null;
  const allowedFields = listing.category?.allowedFields;

  // Drag to pan when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleMouseUp = () => setIsDragging(false);

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: listing.title, url: window.location.href }); } catch { /* cancelled */ }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleBack = () => {
    navigateBack();
  };

  // Filter metadata: exclude 'price' and empty values
  const metadataEntries = listing.metadata
    ? Object.entries(listing.metadata).filter(
        ([key, val]) => key !== 'price' && val !== '' && val !== null && val !== undefined
      )
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      {/* ═══ INLINE ZOOM OVERLAY ═══ */}
      <AnimatePresence>
        {isZoomed && safeImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={exitZoom}
          >
            {/* Close button */}
            <button
              onClick={exitZoom}
              className="absolute top-4 right-4 z-10 flex items-center justify-center size-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="size-5" />
            </button>

            {/* Zoom controls */}
            <div className="absolute top-4 right-16 z-10 flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); if (zoom > 1) { setZoom(zoom - 0.5); if (zoom - 0.5 <= 1) setPan({ x: 0, y: 0 }); } }}
                disabled={zoom <= 1}
                className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/10"
              >
                <ZoomOut className="size-5" />
              </Button>
              <span className="text-xs text-white/60 min-w-[36px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); setZoom(Math.min(zoom + 0.5, 3)); }}
                disabled={zoom >= 3}
                className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/10"
              >
                <ZoomIn className="size-5" />
              </Button>
            </div>

            {/* Counter */}
            <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-white/10 text-white text-sm px-3 py-1.5 rounded-full">
              <ImageIcon className="size-4" />
              {currentImageIndex + 1} / {safeImages.length}
            </div>

            {/* Nav arrows */}
            {safeImages.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center size-11 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <ChevronLeft className="size-6" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center size-11 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <ChevronRight className="size-6" />
                </button>
              </>
            )}

            {/* Zoomed image */}
            <div
              className="max-w-[90vw] max-h-[85vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={safeImages[currentImageIndex]}
                alt={listing.title}
                className={cn(
                  'max-w-full max-h-[85vh] object-contain transition-transform duration-200 select-none',
                  isDragging && zoom > 1 ? 'cursor-grabbing' : zoom > 1 ? 'cursor-grab' : 'cursor-zoom-out'
                )}
                style={{
                  transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                  transformOrigin: 'center center',
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                draggable={false}
              />
            </div>

            {/* Thumbnail strip */}
            {safeImages.length > 1 && (
              <div className="absolute bottom-0 left-0 right-0 flex-shrink-0 px-4 py-3 bg-black/60 border-t border-white/10">
                <div className="flex gap-2 overflow-x-auto justify-center max-w-3xl mx-auto pb-1">
                  {safeImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i); setZoom(1); setPan({ x: 0, y: 0 }); }}
                      className={cn(
                        'flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-all',
                        i === currentImageIndex
                          ? 'border-primary opacity-100 scale-105'
                          : 'border-transparent opacity-50 hover:opacity-80'
                      )}
                    >
                      {imageErrors[i] ? (
                        <div className="w-full h-full flex items-center justify-center bg-white/10">
                          <ImageOff className="size-5 text-white/30" />
                        </div>
                      ) : (
                        <img src={img} alt="" className="w-full h-full object-cover" onError={() => setImageErrors((prev) => ({ ...prev, [i]: true }))} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ BREADCRUMB NAV ═══ */}
      <div className="border-b bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
            onClick={handleBack}
          >
            <Home className="size-4" />
            {backLabel}
          </Button>
          <div className="flex items-center gap-2">
            <TierBadge tier={listing.tier} />
            <CategoryBadge category={listing.category} size="sm" />
          </div>
        </div>
      </div>

      {/* ═══ FULL CONTENT ═══ */}
      <article className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10">
          {/* ── LEFT: Gallery (3 cols) ── */}
          <div className="lg:col-span-3 space-y-4">
            {/* Main image */}
            <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-muted shadow-sm">
              {safeImages.length > 0 && !imageErrors[currentImageIndex] ? (
                <>
                  <img
                    src={safeImages[currentImageIndex]}
                    alt={listing.title}
                    className="absolute inset-0 w-full h-full object-cover cursor-zoom-in"
                    onClick={enterZoom}
                    onError={() => setImageErrors((prev) => ({ ...prev, [currentImageIndex]: true }))}
                  />
                  {/* Nav arrows on main image */}
                  {safeImages.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center size-9 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
                      >
                        <ChevronLeft className="size-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center size-9 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
                      >
                        <ChevronRight className="size-5" />
                      </button>
                    </>
                  )}
                  {/* Zoom hint + counter */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
                    <ImageIcon className="size-3" />
                    {currentImageIndex + 1}/{safeImages.length}
                  </div>
                  <button
                    onClick={enterZoom}
                    className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <ZoomIn className="size-3" />
                    {locale === 'es' ? 'Ampliar' : 'Zoom'}
                  </button>
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <ImageOff className="size-16 text-muted-foreground/20" />
                </div>
              )}

              {/* SOLD overlay */}
              {listing.status === 'SOLD' && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                  <span className="bg-red-600 text-white text-xs sm:text-sm font-bold px-3 py-1.5 rounded-md shadow-lg uppercase tracking-wider">
                    {locale === 'es' ? 'Vendido' : 'Sold'}
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {safeImages.length > 1 && (
              <div ref={thumbsRef} className="flex gap-2 overflow-x-auto pb-1">
                {safeImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => { setCurrentImageIndex(i); }}
                    className={cn(
                      'flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all',
                      i === currentImageIndex
                        ? 'border-primary opacity-100 shadow-md'
                        : 'border-transparent opacity-60 hover:opacity-90'
                    )}
                  >
                    {imageErrors[i] ? (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <ImageOff className="size-5 text-muted-foreground/30" />
                      </div>
                    ) : (
                      <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover" onError={() => setImageErrors((prev) => ({ ...prev, [i]: true }))} />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Description */}
            <div className="space-y-3 pt-2">
              <h3 className="font-semibold text-foreground">
                {tp('listings', 'description')}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {listing.description}
              </p>
            </div>

            {/* Metadata fields */}
            {metadataEntries.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="font-semibold text-foreground">
                  {tp('listings', 'details')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {metadataEntries.map(([key, value]) => (
                    <div
                      key={key}
                      className="flex justify-between text-sm bg-muted/50 rounded-lg px-4 py-2.5"
                    >
                      <span className="text-muted-foreground">
                        {getFieldLabel(key, locale, allowedFields)}
                      </span>
                      <span className="font-medium text-foreground">
                        {formatMetadataValue(value, locale)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Info sidebar (2 cols) ── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                {listing.title}
              </h1>
            </div>

            {/* Price */}
            <div
              className={cn(
                'rounded-xl px-4 py-3 text-center',
                isFree
                  ? 'bg-emerald-100 dark:bg-emerald-900/30'
                  : 'bg-muted'
              )}
            >
              <span
                className={cn(
                  'text-2xl font-extrabold',
                  isFree
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-foreground'
                )}
              >
                {isFree
                  ? (locale === 'es' ? 'Gratis' : 'Free')
                  : formatPrice(price!, locale)}
              </span>
            </div>

            {/* Quick stats */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {listing.municipality && (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="size-4" />
                  {listing.municipality}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Eye className="size-4" />
                {listing.viewCount} {tp('listings', 'views')}
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="size-4" />
                {getRelativeTime(listing.createdAt, locale)}
              </span>
            </div>

            <Separator />

            {/* Author */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-11 rounded-full bg-muted shrink-0">
                {listing.author.avatar ? (
                  <img src={listing.author.avatar} alt={listing.author.name} className="size-11 rounded-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-muted-foreground">
                    {listing.author.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm truncate">{listing.author.name}</span>
                  {listing.author.isVerified && (
                    <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
                  )}
                </div>
                {listing.author.businessName && (
                  <span className="text-xs text-muted-foreground truncate block">{listing.author.businessName}</span>
                )}
                <span className="text-xs text-muted-foreground">
                  {tp('listings', 'by')} {listing.author.name}
                </span>
              </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <Button
                className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                onClick={() => {
                  if (!session?.user?.id) {
                    openAuth();
                    return;
                  }
                  openMessage({
                    receiverId: listing.author.id,
                    receiverName: listing.author.name,
                    listingId: listing.id,
                    listingTitle: listing.title,
                    listingImage: listing.images?.[0],
                  });
                }}
              >
                <MessageSquare className="size-4" />
                {tp('listings', 'contact')}
              </Button>
              {listing.showPhone && (
                <Button variant="outline" className="w-full gap-2">
                  <Phone className="size-4" />
                  {tp('form', 'phone')}
                </Button>
              )}
              {listing.contactMethods?.includes('whatsapp') && (
                <Button
                  variant="outline"
                  className="w-full gap-2"
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
                  💬 WhatsApp
                </Button>
              )}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-2" onClick={handleShare}>
                  <Share2 className="size-4" />
                  {tp('listings', 'share')}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {/* Future: report */}}
                >
                  <MessageSquare className="size-4" />
                </Button>
              </div>
            </div>

            {/* Bump */}
            {listing.tier !== 'BUSINESS' && (
              <Button
                variant="outline"
                className="w-full gap-2 border-dashed"
                onClick={() => {
                  openPayment({
                    type: 'BUMP',
                    listingId: listing.id,
                    amount: 3,
                    listingTitle: listing.title,
                  });
                }}
              >
                <ArrowUpCircle className="size-4" />
                {tp('listings', 'bump')} (€3)
              </Button>
            )}

            {/* Upgrade Prompt */}
            <AnimatePresence>
              {canUpgrade && nextTier && !showUpgrade && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="overflow-hidden"
                >
                  <div
                    className="rounded-xl p-4 text-white cursor-pointer transition-transform hover:scale-[1.01]"
                    style={{ background: `linear-gradient(135deg, ${nextTier.color}, ${nextTier.color}CC)` }}
                    onClick={() => setShowUpgrade(true)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center size-10 rounded-lg bg-white/20 shrink-0">
                        <Sparkles className="size-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm mb-1">
                          {locale === 'es'
                            ? `Actualiza a ${nextTier.nameEs} por solo €${nextTier.price}`
                            : `Upgrade to ${nextTier.nameEn} for only €${nextTier.price}`}
                        </h3>
                        <ul className="space-y-0.5 mt-1">
                          {(locale === 'es' ? nextTier.featuresEs : nextTier.featuresEn)
                            .slice(1, 4)
                            .map((f, i) => (
                              <li key={i} className="flex items-center gap-1.5 text-xs text-white/90">
                                <Check className="size-3 shrink-0" />
                                {f}
                              </li>
                            ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {showUpgrade && nextTier && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="overflow-hidden"
                >
                  <div className="rounded-xl border-2 p-4 space-y-3" style={{ borderColor: nextTier.color }}>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center size-9 rounded-lg" style={{ backgroundColor: `${nextTier.color}18` }}>
                        <Sparkles className="size-4" style={{ color: nextTier.color }} />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm">
                          {locale === 'es' ? `Plan ${nextTier.nameEs}` : `${nextTier.nameEn} Plan`}
                        </h3>
                        <span className="text-lg font-extrabold" style={{ color: nextTier.color }}>
                          €{nextTier.price}{' '}
                          <span className="text-xs font-normal text-muted-foreground">
                            {locale === 'es' ? '/anuncio' : '/listing'}
                          </span>
                        </span>
                      </div>
                    </div>
                    <ul className="space-y-1">
                      {(locale === 'es' ? nextTier.featuresEs : nextTier.featuresEn).map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Check className="size-3.5 shrink-0" style={{ color: nextTier.color }} />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 font-semibold text-white text-sm"
                        style={{ backgroundColor: nextTier.color }}
                        onClick={() => {
                          const paymentType = nextTier.id === 'HIGHLIGHTED' ? 'HIGHLIGHT_UPGRADE' : 'VIP_UPGRADE';
                          openPayment({
                            type: paymentType,
                            listingId: listing.id,
                            amount: nextTier.price,
                            listingTitle: listing.title,
                          });
                        }}
                      >
                        {locale === 'es'
                          ? `Mejorar a ${nextTier.nameEs} — €${nextTier.price}`
                          : `Upgrade to ${nextTier.nameEn} — €${nextTier.price}`}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setShowUpgrade(false)}>
                        {tp('common', 'close')}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Published date */}
            <p className="text-xs text-muted-foreground text-center pt-2">
              {tp('listings', 'postedOn')} {formatDate(listing.createdAt, locale)}
              {listing.expiresAt && (
                <> · {tp('listings', 'expiresOn')} {formatDate(listing.expiresAt, locale)}</>
              )}
            </p>
          </div>
        </div>
      </article>
    </motion.div>
  );
}
