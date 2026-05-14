// ═══════════════════════════════════════════════════════════════
// GRAN CANARIA CONECTA - RecyclingSection Component
// Recycling points grid
// ═══════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { RecyclingCard } from '@/components/shared/RecyclingCard';
import { SectionContainer } from '@/components/shared/SectionContainer';
import { EmptyState } from '@/components/shared/EmptyState';
import { useI18n } from '@/hooks/use-i18n';
import type { RecyclingPointDTO } from '@/lib/types';

export function RecyclingSection() {
  const { t, tp } = useI18n();
  const [points, setPoints] = useState<RecyclingPointDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecycling() {
      try {
        const res = await fetch('/api/recycling');
        if (res.ok) {
          const data = await res.json();
          setPoints(Array.isArray(data) ? data.slice(0, 6) : []);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchRecycling();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5 }}
    >
      <SectionContainer
        title={t('recycling', 'title')}
        subtitle={t('recycling', 'subtitle')}
        action={{ label: t('recycling', 'viewMap'), href: '/reciclaje' }}
      >
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[260px] rounded-xl" />
            ))}
          </div>
        ) : points.length === 0 ? (
          <EmptyState
            icon="recycle"
            title={tp('common', 'noResults')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {points.map((point, index) => (
              <motion.div
                key={point.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.06 }}
              >
                <RecyclingCard point={point} />
              </motion.div>
            ))}
          </div>
        )}
      </SectionContainer>
    </motion.div>
  );
}
