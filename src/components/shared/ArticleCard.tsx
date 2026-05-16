// Gran Canaria Conecta - ArticleCard Component
// Card for news article display

'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/hooks/use-i18n';
import { useModalStore } from '@/lib/modal-store';
import { ARTICLE_CATEGORIES } from '@/lib/constants';
import { getRelativeTime, truncateText } from '@/lib/format';
import { cn } from '@/lib/utils';
// Using native <img> for maximum reliability across proxy setups
import { ImageOff } from 'lucide-react';
import type { ArticleDTO, ArticleCategory } from '@/lib/types';

interface ArticleCardProps {
  article: ArticleDTO;
  className?: string;
}

const ARTICLE_CATEGORY_COLORS: Record<ArticleCategory, string> = {
  ENVIRONMENT: '#52B788',
  COMMUNITY: '#6366F1',
  BUSINESS: '#7C3AED',
  SUSTAINABILITY: '#0D9488',
  TOURISM: '#0891B2',
  GENERAL: '#6B7280',
};

export function ArticleCard({ article, className }: ArticleCardProps) {
  const { locale } = useI18n();
  const openArticleDetail = useModalStore((s) => s.openArticleDetail);
  const categoryInfo = ARTICLE_CATEGORIES[article.category];
  const categoryLabel = categoryInfo
    ? locale === 'es'
      ? categoryInfo.es
      : categoryInfo.en
    : article.category;
  const categoryColor = ARTICLE_CATEGORY_COLORS[article.category] || '#6B7280';

  const excerpt = article.excerpt
    ? truncateText(article.excerpt, 120)
    : truncateText(article.content.replace(/<[^>]*>/g, ''), 120);

  const publishedAt = article.publishedAt || article.createdAt;

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
        onClick={() => openArticleDetail(article)}
      >
        {/* Image */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
          {article.image ? (
            <img
              src={article.image}
              alt={article.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <ImageOff className="size-10 opacity-40" />
            </div>
          )}

          {/* Category badge overlay */}
          <div className="absolute top-2 left-2">
            <Badge
              className="text-xs font-medium border-0"
              style={{
                backgroundColor: `${categoryColor}E6`,
                color: '#FFFFFF',
              }}
            >
              {categoryLabel}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-2 p-3">
          {/* Title */}
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 text-foreground">
            {article.title}
          </h3>

          {/* Excerpt */}
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {excerpt}
          </p>

          {/* Author + Time */}
          <div className="flex items-center justify-between gap-1 mt-auto">
            <span className="text-xs font-medium text-muted-foreground truncate">
              {article.author.name}
            </span>
            <time className="text-xs text-muted-foreground whitespace-nowrap">
              {getRelativeTime(publishedAt, locale)}
            </time>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
