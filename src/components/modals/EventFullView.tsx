// ═══════════════════════════════════════════════════════════════
// GRAN CANARIA CONECTA - EventFullView Component
// INLINE EXPANDED VIEW — Full event details with large image + zoom
// Same pattern as ArticleReadingView: replaces main content, keeps Nav+Footer
// ═══════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  MapPin,
  Calendar,
  Clock,
  Users,
  Globe,
  Phone,
  Mail,
  Share2,
  CalendarPlus,
  Leaf,
  Ticket,
  UserCircle,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  ImageIcon,
  Home,
  CalendarIcon,
  ImageOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/hooks/use-i18n';
import { useModalStore } from '@/lib/modal-store';
import { formatCalendarDate, formatDate, formatTime } from '@/lib/format';
import { EVENT_CATEGORIES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { navigateBack } from '@/hooks/use-navigation';

export function EventFullView() {
  const { locale, tp } = useI18n();
  const {
    selectedEvent,
    isEventFullView,
  } = useModalStore();

  const [isZoomed, setIsZoomed] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Scroll to top when entering full view (DOM side-effect only)
  useEffect(() => {
    if (isEventFullView) {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, [isEventFullView]);

  // Zoom callbacks
  const enterZoom = useCallback(() => { setIsZoomed(true); setZoom(1); setPan({ x: 0, y: 0 }); }, []);
  const exitZoom = useCallback(() => { setIsZoomed(false); setZoom(1); setPan({ x: 0, y: 0 }); }, []);

  // Keyboard nav for zoomed image
  useEffect(() => {
    if (!isZoomed) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') exitZoom();
      if ((e.key === '+' || e.key === '=') && zoom < 3) setZoom((z) => z + 0.5);
      if (e.key === '-' && zoom > 1) { const nz = zoom - 0.5; setZoom(nz); if (nz <= 1) setPan({ x: 0, y: 0 }); }
      if (e.key === '0') { setZoom(1); setPan({ x: 0, y: 0 }); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isZoomed, zoom, exitZoom]);

  if (!isEventFullView || !selectedEvent) return null;

  const event = selectedEvent;
  const { day, month } = formatCalendarDate(event.startDate, locale);
  const startTime = event.allDay ? null : formatTime(event.startDate, locale);
  const endTime = event.endDate && !event.allDay ? formatTime(event.endDate, locale) : null;
  const timeDisplay = startTime && endTime ? `${startTime} - ${endTime}` : startTime;

  const categoryInfo = EVENT_CATEGORIES[event.category];
  const categoryLabel = categoryInfo
    ? locale === 'es' ? categoryInfo.es : categoryInfo.en
    : event.category;

  // enterZoom and exitZoom are useCallback hooks defined above

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
      try { await navigator.share({ title: event.title, url: window.location.href }); } catch { /* cancelled */ }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleBack = () => {
    navigateBack();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      {/* ═══ INLINE ZOOM OVERLAY ═══ */}
      <AnimatePresence>
        {isZoomed && event.image && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={exitZoom}
          >
            <button
              onClick={exitZoom}
              className="absolute top-4 right-4 z-10 flex items-center justify-center size-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="size-5" />
            </button>

            {/* Zoom controls */}
            <div className="absolute top-4 right-16 z-10 flex items-center gap-1">
              <Button
                variant="ghost" size="icon"
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
                variant="ghost" size="icon"
                onClick={(e) => { e.stopPropagation(); setZoom(Math.min(zoom + 0.5, 3)); }}
                disabled={zoom >= 3}
                className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/10"
              >
                <ZoomIn className="size-5" />
              </Button>
            </div>

            <div
              className="max-w-[90vw] max-h-[85vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={event.image}
                alt={event.title}
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ BREADCRUMB NAV ═══ */}
      <div className="border-b bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Button
            variant="ghost" size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
            onClick={handleBack}
          >
            <Home className="size-4" />
            {tp('eventDetail', 'backToEvents')}
          </Button>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">{categoryLabel}</Badge>
            {event.isFree && (
              <Badge className="text-xs bg-emerald-600 text-white border-emerald-600">
                {tp('eventDetail', 'free')}
              </Badge>
            )}
            {event.isEco && (
              <Badge className="text-xs gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                <Leaf className="size-3" /> Eco
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* ═══ FULL CONTENT ═══ */}
      <article className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10">
          {/* ── LEFT: Image + Description (3 cols) ── */}
          <div className="lg:col-span-3 space-y-6">
            {/* Main image */}
            {event.image ? (
              <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-muted shadow-sm">
                <img
                  src={event.image}
                  alt={event.title}
                  className="h-full w-full object-cover cursor-zoom-in"
                  onClick={enterZoom}
                />
                {/* Calendar date overlay */}
                <div className="absolute top-3 left-3 flex flex-col items-center justify-center bg-primary text-primary-foreground rounded-lg px-3 py-2 shadow-lg min-w-[52px]">
                  <span className="text-xl font-bold leading-none">{day}</span>
                  <span className="text-[10px] uppercase tracking-wide mt-0.5 opacity-90">{month}</span>
                </div>
                {/* Zoom button */}
                <button
                  onClick={enterZoom}
                  className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full hover:bg-black/70 transition-colors"
                >
                  <ZoomIn className="size-3" />
                  {locale === 'es' ? 'Ampliar' : 'Zoom'}
                </button>
              </div>
            ) : (
              <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-muted flex items-center justify-center">
                <ImageOff className="size-16 text-muted-foreground/20" />
                <div className="absolute top-3 left-3 flex flex-col items-center justify-center bg-primary text-primary-foreground rounded-lg px-3 py-2 shadow-lg min-w-[52px]">
                  <span className="text-xl font-bold leading-none">{day}</span>
                  <span className="text-[10px] uppercase tracking-wide mt-0.5 opacity-90">{month}</span>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">
                {tp('eventDetail', 'description')}
              </h3>
              <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {event.description}
              </div>
            </div>

            {/* Eco tags */}
            {event.ecoTags && event.ecoTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {event.ecoTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  >
                    <Leaf className="size-3" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: Info sidebar (2 cols) ── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
              {event.title}
            </h1>

            {/* Event details grid */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 shrink-0">
                  <Calendar className="size-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{tp('eventDetail', 'date')}</p>
                  <p className="text-muted-foreground">
                    {formatDate(event.startDate, locale)}
                    {event.endDate && event.endDate !== event.startDate && (
                      <> - {formatDate(event.endDate, locale)}</>
                    )}
                  </p>
                </div>
              </div>

              {!event.allDay && timeDisplay && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 shrink-0">
                    <Clock className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{tp('eventDetail', 'time')}</p>
                    <p className="text-muted-foreground">{timeDisplay}</p>
                  </div>
                </div>
              )}

              {event.allDay && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 shrink-0">
                    <Clock className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{tp('eventDetail', 'time')}</p>
                    <p className="text-muted-foreground">{tp('eventDetail', 'fullDay')}</p>
                  </div>
                </div>
              )}

              {event.location && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 shrink-0">
                    <MapPin className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{tp('eventDetail', 'location')}</p>
                    <p className="text-muted-foreground">{event.location}</p>
                    {event.municipality && (
                      <p className="text-xs text-muted-foreground">{event.municipality}</p>
                    )}
                  </div>
                </div>
              )}

              {event.capacity && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 shrink-0">
                    <Users className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{tp('eventDetail', 'capacity')}</p>
                    <p className="text-muted-foreground">
                      {event.capacity} {tp('eventDetail', 'spotsLeft')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Organizer */}
            {event.organizer && (
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-10 rounded-full bg-muted shrink-0">
                  <UserCircle className="size-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{tp('eventDetail', 'organizer')}</p>
                  <p className="font-medium text-sm text-foreground">{event.organizer}</p>
                </div>
              </div>
            )}

            {/* Contact */}
            {(event.website || event.contactEmail || event.contactPhone) && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-foreground">{tp('eventDetail', 'contact')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {event.website && (
                      <Button variant="outline" size="sm" className="gap-2" asChild>
                        <a href={event.website} target="_blank" rel="noopener noreferrer">
                          <Globe className="size-4" /> {tp('eventDetail', 'website')}
                        </a>
                      </Button>
                    )}
                    {event.contactEmail && (
                      <Button variant="outline" size="sm" className="gap-2" asChild>
                        <a href={`mailto:${event.contactEmail}`}>
                          <Mail className="size-4" /> {tp('eventDetail', 'email')}
                        </a>
                      </Button>
                    )}
                    {event.contactPhone && (
                      <Button variant="outline" size="sm" className="gap-2" asChild>
                        <a href={`tel:${event.contactPhone}`}>
                          <Phone className="size-4" /> {tp('eventDetail', 'phone')}
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              {event.ticketUrl ? (
                <Button className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold" asChild>
                  <a href={event.ticketUrl} target="_blank" rel="noopener noreferrer">
                    <Ticket className="size-4" />
                    {tp('eventDetail', 'getTickets')}
                    <ExternalLink className="size-3" />
                  </a>
                </Button>
              ) : (
                <Button className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                  <CalendarPlus className="size-4" />
                  {tp('eventDetail', 'register')}
                </Button>
              )}

              <Button variant="outline" className="w-full gap-2">
                <CalendarPlus className="size-4" />
                {tp('eventDetail', 'addToCalendar')}
              </Button>

              <Button variant="outline" className="w-full gap-2" onClick={handleShare}>
                <Share2 className="size-4" />
                {tp('events', 'share')}
              </Button>
            </div>
          </div>
        </div>
      </article>
    </motion.div>
  );
}
