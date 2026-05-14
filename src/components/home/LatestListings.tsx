// ═══════════════════════════════════════════════════════════════
// GRAN CANARIA CONECTA - LatestListings Component
// Grid of latest active listings (non-VIP/BUSINESS to avoid duplicates)
// ═══════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { ListingCard } from '@/components/shared/ListingCard';
import { SectionContainer } from '@/components/shared/SectionContainer';
import { EmptyState } from '@/components/shared/EmptyState';
import { useI18n } from '@/hooks/use-i18n';
import type { ListingDTO, PaginatedResponse } from '@/lib/types';

export function LatestListings() {
  const { t, tp } = useI18n();
  const [listings, setListings] = useState<ListingDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchListings() {
      try {
        const res = await fetch('/api/listings?limit=12&sortBy=newest');
        if (res.ok) {
          const data: PaginatedResponse<ListingDTO> = await res.json();
          // Filter out VIP/BUSINESS to avoid duplicates with FeaturedSlider
          const filtered = (data.data || []).filter(
            (l) => l.tier === 'FREE' || l.tier === 'HIGHLIGHTED'
          );
          setListings(filtered);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchListings();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5 }}
    >
      <SectionContainer
        title={t('listings', 'latest')}
        action={{ label: t('listings', 'viewAll'), href: '/anuncios' }}
      >
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-[300px] rounded-xl" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <EmptyState
            icon="file-text"
            title={tp('common', 'noResults')}
            description={
              tp('search', 'noResults')
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {listings.map((listing, index) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
              >
                <ListingCard listing={listing} />
              </motion.div>
            ))}
          </div>
        )}
      </SectionContainer>
    </motion.div>
  );
}
