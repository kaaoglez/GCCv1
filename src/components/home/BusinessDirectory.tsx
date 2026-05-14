// ═══════════════════════════════════════════════════════════════
// GRAN CANARIA CONECTA - BusinessDirectory Component
// BUSINESS tier listings + promotional CTA banner
// ═══════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ListingCard } from '@/components/shared/ListingCard';
import { SectionContainer } from '@/components/shared/SectionContainer';
import { EmptyState } from '@/components/shared/EmptyState';
import { useI18n } from '@/hooks/use-i18n';
import type { ListingDTO, PaginatedResponse } from '@/lib/types';

export function BusinessDirectory() {
  const { t, tp } = useI18n();
  const [listings, setListings] = useState<ListingDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBusiness() {
      try {
        const res = await fetch('/api/listings?tier=BUSINESS&limit=6');
        if (res.ok) {
          const data: PaginatedResponse<ListingDTO> = await res.json();
          setListings(data.data || []);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchBusiness();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5 }}
    >
      <SectionContainer
        title={t('directory', 'title')}
        subtitle={t('directory', 'subtitle')}
        action={{ label: t('directory', 'viewAll'), href: '/directorio' }}
      >
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[300px] rounded-xl" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <EmptyState
            icon="store"
            title={tp('common', 'noResults')}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {listings.map((listing, index) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.06 }}
                >
                  <ListingCard listing={listing} />
                </motion.div>
              ))}
            </div>

            {/* Promotional CTA Banner */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary via-primary/90 to-secondary text-primary-foreground p-6 sm:p-8">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

                <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center size-12 rounded-xl bg-white/15 shrink-0">
                      <Sparkles className="size-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold mb-1">
                        {tp('directory', 'promote')}
                      </h3>
                      <p className="text-sm text-primary-foreground/90 leading-relaxed max-w-lg">
                        {tp('directory', 'promoteDesc')}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="lg"
                    className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold gap-2 shrink-0 shadow-lg"
                  >
                    {tp('directory', 'promoteCta')}
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </SectionContainer>
    </motion.div>
  );
}
