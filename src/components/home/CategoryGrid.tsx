// Gran Canaria Conecta - CategoryGrid Component
// Grid of top-level parent categories with icons and hover effects

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { SectionContainer } from '@/components/shared/SectionContainer';
import { EmptyState } from '@/components/shared/EmptyState';
import { getIcon } from '@/lib/icons';
import { useI18n } from '@/hooks/use-i18n';
import { useModalStore } from '@/lib/modal-store';
import type { CategoryDTO } from '@/lib/types';

export function CategoryGrid() {
  const { locale, t, tp } = useI18n();
  const openSearch = useModalStore((s) => s.openSearch);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch(`/api/categories?locale=${locale}`);
        if (res.ok) {
          const data = await res.json();
          const parents = (data || []).filter((c: CategoryDTO) => !c.parentId);
          setCategories(parents);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, [locale]);

  return (
    <motion.div
      id="category-grid-section"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5 }}
    >
      <SectionContainer
        title={t('categoriesSection', 'title')}
        subtitle={t('categoriesSection', 'subtitle')}
        action={{ label: { es: 'Ver todo', en: 'View all' }, href: '/categorias' }}
      >
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <EmptyState
            icon="search"
            title={tp('common', 'noResults')}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {categories.map((cat, index) => {
              const name = locale === 'es' ? cat.nameEs : cat.nameEn;
              const desc = locale === 'es' ? cat.descEs : cat.descEn;

              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ scale: 1.03, y: -4 }}
                  className="group"
                >
                  <div
                    className="relative flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-center transition-shadow duration-300 hover:shadow-lg cursor-pointer"
                    onClick={() => openSearch('', cat.id)}
                  >
                    {/* Premium badge */}
                    {cat.isPaid && (
                      <div className="absolute -top-2 -right-2">
                        <Badge className="text-[10px] px-1.5 py-0 bg-amber-500 text-white border-amber-500">
                          {tp('categoriesSection', 'paidBadge')}
                        </Badge>
                      </div>
                    )}

                    {/* Icon */}
                    <div
                      className="flex items-center justify-center size-12 rounded-xl transition-transform duration-300 group-hover:scale-110"
                      style={{ backgroundColor: `${cat.color}18`, color: cat.color }}
                    >
                      {getIcon(cat.icon, 'size-6', 24)}
                    </div>

                    {/* Name */}
                    <h3 className="font-semibold text-sm text-foreground leading-tight line-clamp-1">
                      {name}
                    </h3>

                    {/* Description */}
                    {desc && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {desc}
                      </p>
                    )}

                    {/* Count */}
                    {(cat.listingCount ?? 0) > 0 && (
                      <span className="text-xs text-muted-foreground font-medium">
                        {cat.listingCount} {locale === 'es' ? 'anuncios' : 'listings'}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </SectionContainer>
    </motion.div>
  );
}
