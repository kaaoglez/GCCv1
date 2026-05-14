// ═══════════════════════════════════════════════════════════════
// GRAN CANARIA CONECTA - EventsSection Component
// Upcoming events grid
// ═══════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { EventCard } from '@/components/shared/EventCard';
import { SectionContainer } from '@/components/shared/SectionContainer';
import { EmptyState } from '@/components/shared/EmptyState';
import { useI18n } from '@/hooks/use-i18n';
import type { EventDTO, PaginatedResponse } from '@/lib/types';

export function EventsSection() {
  const { t, tp } = useI18n();
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch('/api/events?limit=6');
        if (res.ok) {
          const data: PaginatedResponse<EventDTO> = await res.json();
          setEvents(data.data || []);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5 }}
    >
      <SectionContainer
        title={t('events', 'title')}
        action={{ label: t('events', 'viewAll'), href: '/eventos' }}
      >
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[260px] rounded-xl" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            icon="calendar"
            title={tp('events', 'noEvents')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.06 }}
              >
                <EventCard event={event} />
              </motion.div>
            ))}
          </div>
        )}
      </SectionContainer>
    </motion.div>
  );
}
