// ═══════════════════════════════════════════════════════════════
// GRAN CANARIA CONECTA - EventDetailModal Component
// COMPACT PREVIEW — Quick look with essential event info
// "Ver evento completo" opens EventFullView inline
// ═══════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/hooks/use-i18n';
import { useModalStore } from '@/lib/modal-store';
import { formatCalendarDate, formatDate, formatTime } from '@/lib/format';
import { EVENT_CATEGORIES } from '@/lib/constants';
import {
  MapPin,
  Calendar,
  Clock,
  Maximize2,
  Share2,
  CalendarPlus,
  Leaf,
  CalendarIcon,
} from 'lucide-react';
// Using native <img> for maximum reliability across proxy setups

export function EventDetailModal() {
  const { locale, tp } = useI18n();
  const {
    selectedEvent,
    isEventDetailOpen,
    closeEventDetail,
    openEventFullView,
  } = useModalStore();

  // Darker backdrop
  useEffect(() => {
    if (!isEventDetailOpen) return;
    const interval = setInterval(() => {
      const overlay = document.querySelector(
        'div[data-slot="dialog-overlay"]'
      ) as HTMLElement | null;
      if (overlay) {
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        overlay.style.backdropFilter = 'blur(4px)';
        (overlay.style as unknown as Record<string, string>)['webkitBackdropFilter'] = 'blur(4px)';
        clearInterval(interval);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [isEventDetailOpen]);

  if (!selectedEvent) return null;

  const event = selectedEvent;
  const { day, month } = formatCalendarDate(event.startDate, locale);
  const startTime = event.allDay ? null : formatTime(event.startDate, locale);
  const endTime = event.endDate && !event.allDay ? formatTime(event.endDate, locale) : null;
  const timeDisplay = startTime && endTime ? `${startTime} - ${endTime}` : startTime;

  const categoryInfo = EVENT_CATEGORIES[event.category];
  const categoryLabel = categoryInfo
    ? locale === 'es' ? categoryInfo.es : categoryInfo.en
    : event.category;

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: event.title, url: window.location.href }); } catch { /* cancelled */ }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleClose = () => closeEventDetail();
  const handleViewFull = () => openEventFullView();

  return (
    <Dialog open={isEventDetailOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0 [&>button]:hidden">
        <DialogTitle className="sr-only">{event.title}</DialogTitle>

        {/* Image with calendar date overlay */}
        <div className="relative aspect-[4/3] w-full bg-muted overflow-hidden">
          {event.image ? (
            <img src={event.image} alt={event.title} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary/10">
              <CalendarIcon className="size-12 text-primary/30" />
            </div>
          )}

          {/* Calendar date overlay */}
          <div className="absolute top-2 left-2 flex flex-col items-center justify-center bg-primary text-primary-foreground rounded-lg px-2.5 py-1.5 shadow-lg min-w-[48px]">
            <span className="text-lg font-bold leading-none">{day}</span>
            <span className="text-[9px] uppercase tracking-wide mt-0.5 opacity-90">{month}</span>
          </div>

          {/* Badges */}
          <div className="absolute top-2 left-[64px] flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-[10px] bg-white/90 text-foreground">
              {categoryLabel}
            </Badge>
            {event.isFree && (
              <Badge className="text-[10px] bg-emerald-600 text-white border-emerald-600">
                {tp('eventDetail', 'free')}
              </Badge>
            )}
            {event.isEco && (
              <Badge className="text-[10px] gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                <Leaf className="size-3" /> Eco
              </Badge>
            )}
          </div>
        </div>

        {/* Compact content */}
        <div className="px-4 pb-4 space-y-3">
          {/* Title */}
          <h2 className="text-lg font-bold text-foreground leading-tight line-clamp-2">
            {event.title}
          </h2>

          {/* Date/Time/Location — compact */}
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="size-3.5 shrink-0" />
              <span>{formatDate(event.startDate, locale)}{event.endDate && event.endDate !== event.startDate && ` - ${formatDate(event.endDate, locale)}`}</span>
            </div>
            {!event.allDay && timeDisplay && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="size-3.5 shrink-0" />
                <span>{timeDisplay}</span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="size-3.5 shrink-0" />
                <span className="line-clamp-1">{event.location}</span>
              </div>
            )}
          </div>

          {/* Brief description */}
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {event.description}
          </p>

          {/* Organizer */}
          {event.organizer && (
            <p className="text-xs text-muted-foreground">
              {tp('eventDetail', 'organizer')}: <span className="font-medium text-foreground">{event.organizer}</span>
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1">
            <Button
              className="flex-1 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm"
              onClick={handleViewFull}
            >
              <Maximize2 className="size-4" />
              {tp('eventDetail', 'viewFullEvent')}
            </Button>
            <Button variant="outline" size="icon" className="shrink-0" onClick={handleShare}>
              <Share2 className="size-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
