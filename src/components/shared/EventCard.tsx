// Gran Canaria Conecta - EventCard Component
// Card for event display with calendar-style date

'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/hooks/use-i18n';
import { useModalStore } from '@/lib/modal-store';
import { formatCalendarDate, formatTime } from '@/lib/format';
import { EVENT_CATEGORIES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { MapPin, Clock, Leaf, ImageOff } from 'lucide-react';
import type { EventDTO } from '@/lib/types';

interface EventCardProps {
  event: EventDTO;
  className?: string;
}

export function EventCard({ event, className }: EventCardProps) {
  const { locale } = useI18n();
  const openEventDetail = useModalStore((s) => s.openEventDetail);
  const { day, month } = formatCalendarDate(event.startDate, locale);
  const startTime = event.allDay ? null : formatTime(event.startDate, locale);
  const endTime = event.endDate && !event.allDay ? formatTime(event.endDate, locale) : null;
  const timeDisplay = startTime && endTime ? `${startTime} - ${endTime}` : startTime;

  const categoryInfo = EVENT_CATEGORIES[event.category];
  const categoryLabel = categoryInfo
    ? locale === 'es'
      ? categoryInfo.es
      : categoryInfo.en
    : event.category;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card
        className={cn(
          'group relative overflow-hidden cursor-pointer gap-0 py-0 transition-shadow duration-300',
          'hover:shadow-lg',
          className
        )}
        onClick={() => openEventDetail(event)}
      >
        {/* Calendar date + Image row */}
        <div className="flex">
          {/* Calendar date block */}
          <div className="flex flex-col items-center justify-center bg-primary text-primary-foreground px-3 py-3 min-w-[64px]">
            <span className="text-2xl font-bold leading-none">{day}</span>
            <span className="text-xs uppercase tracking-wide mt-0.5 opacity-90">{month}</span>
          </div>

          {/* Image */}
          <div className="relative flex-1 aspect-[16/9] min-w-0 overflow-hidden bg-muted">
            {event.image ? (
              <Image
                src={event.image}
                alt={event.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <ImageOff className="size-8 opacity-40" />
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-2 p-3">
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge
              variant="secondary"
              className="text-xs bg-muted text-muted-foreground"
            >
              {categoryLabel}
            </Badge>
            {event.isFree && (
              <Badge className="text-xs bg-emerald-600 text-white border-emerald-600">
                {locale === 'es' ? 'Gratis' : 'Free'}
              </Badge>
            )}
            {event.isEco && (
              <Badge
                variant="secondary"
                className="text-xs gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              >
                <Leaf className="size-3" />
                {locale === 'es' ? 'Eco' : 'Eco'}
              </Badge>
            )}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 text-foreground">
            {event.title}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">{event.location}</span>
            {event.municipality && (
              <span className="text-muted-foreground/80">· {event.municipality}</span>
            )}
          </div>

          {/* Time */}
          {timeDisplay && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3 shrink-0" />
              <span>
                {event.allDay
                  ? locale === 'es'
                    ? 'Todo el día'
                    : 'All day'
                  : timeDisplay}
              </span>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
