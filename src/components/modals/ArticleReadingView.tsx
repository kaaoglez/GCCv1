'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Tag,
  ImageOff,
  Share2,
  Clock,
  BookOpen,
  Home,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/hooks/use-i18n';
import { useModalStore } from '@/lib/modal-store';
import { formatDate } from '@/lib/format';
import { ARTICLE_CATEGORIES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { ArticleCategory } from '@/lib/types';
import { navigateBack } from '@/hooks/use-navigation';

const ARTICLE_CATEGORY_COLORS: Record<ArticleCategory, string> = {
  ENVIRONMENT: '#52B788',
  COMMUNITY: '#6366F1',
  BUSINESS: '#7C3AED',
  SUSTAINABILITY: '#0D9488',
  TOURISM: '#0891B2',
  GENERAL: '#6B7280',
};

/** Estimate reading time from HTML content */
function estimateReadingTime(html: string): number {
  const text = html.replace(/<[^>]+>/g, '');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function ArticleReadingView() {
  const { locale, tp } = useI18n();
  const {
    selectedArticle,
    isArticleReadingView,
  } = useModalStore();

  // Scroll to top when entering reading view
  useEffect(() => {
    if (isArticleReadingView) {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, [isArticleReadingView]);

  // Show loading skeleton while fetching data on reload
  if (isArticleReadingView && !selectedArticle) {
    return (
      <div className="w-full">
        <div className="border-b bg-muted/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
            <div className="h-8 w-40 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="h-10 w-3/4 bg-muted animate-pulse rounded mb-6" />
          <div className="flex items-center gap-3 mb-8">
            <div className="size-11 rounded-full bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-3 w-24 bg-muted animate-pulse rounded" />
            </div>
          </div>
          <div className="aspect-[16/8] w-full rounded-2xl bg-muted animate-pulse mb-8" />
          <div className="space-y-3">
            <div className="h-3 w-full bg-muted animate-pulse rounded" />
            <div className="h-3 w-full bg-muted animate-pulse rounded" />
            <div className="h-3 w-4/5 bg-muted animate-pulse rounded" />
            <div className="h-3 w-full bg-muted animate-pulse rounded" />
            <div className="h-3 w-3/4 bg-muted animate-pulse rounded" />
            <div className="h-3 w-5/6 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!isArticleReadingView || !selectedArticle) return null;

  const article = selectedArticle;
  const categoryInfo = ARTICLE_CATEGORIES[article.category];
  const categoryLabel = categoryInfo
    ? locale === 'es'
      ? categoryInfo.es
      : categoryInfo.en
    : article.category;
  const categoryColor = ARTICLE_CATEGORY_COLORS[article.category] || '#6B7280';
  const publishedAt = article.publishedAt || article.createdAt;
  const readingTime = estimateReadingTime(article.content || '');

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: article.title, url: window.location.href });
      } catch { /* cancelled */ }
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
      {/* Breadcrumb / Back navigation */}
      <div className="border-b bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
            onClick={handleBack}
          >
            <Home className="size-4" />
            {tp('nav', 'news')}
          </Button>

          <div className="flex items-center gap-2">
            {/* Category badge */}
            <Badge
              className="text-xs font-medium border-0"
              style={{ backgroundColor: `${categoryColor}18`, color: categoryColor }}
            >
              {categoryLabel}
            </Badge>

            {/* Reading time */}
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3" />
              {readingTime} {tp('articleDetail', 'minRead')}
            </span>

            {/* Share */}
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={handleShare}
            >
              <Share2 className="size-4" />
              <span className="hidden sm:inline">{tp('articleDetail', 'share')}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Article content */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Title */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground leading-tight mb-6">
          {article.title}
        </h1>

        {/* Author row */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center justify-center size-11 rounded-full bg-muted shrink-0">
            {article.author.avatar ? (
              <img
                src={article.author.avatar}
                alt={article.author.name}
                className="size-11 rounded-full object-cover"
              />
            ) : (
              <span className="text-sm font-bold text-muted-foreground">
                {article.author.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">
              {article.author.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {tp('articleDetail', 'publishedBy')} {article.author.name}{' '}
              {tp('articleDetail', 'onDate')} {formatDate(publishedAt, locale)}
            </p>
          </div>
        </div>

        {/* Hero image */}
        {article.image && (
          <div className="relative aspect-[16/8] w-full rounded-2xl overflow-hidden mb-8 shadow-sm">
            <img
              src={article.image}
              alt={article.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Full HTML content with comfortable reading typography */}
        <div
          className={cn(
            'prose prose-base sm:prose-lg max-w-none',
            'prose-headings:text-foreground prose-headings:font-bold',
            'prose-p:text-muted-foreground prose-p:leading-relaxed',
            'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
            'prose-img:rounded-xl',
            'prose-blockquote:border-l-4 prose-blockquote:border-primary',
            'prose-li:text-muted-foreground',
            'prose-strong:text-foreground',
            'prose-hr:border-muted'
          )}
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-10 pt-6 border-t">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {tp('articleDetail', 'tags')}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs px-3 py-1"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Bottom bar with share + back */}
        <div className="mt-10 pt-6 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Button
            variant="outline"
            className="gap-2 font-medium"
            onClick={handleBack}
          >
            <Home className="size-4" />
            {tp('articleDetail', 'backToNews')}
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="size-3" />
              {formatDate(publishedAt, locale)}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleShare}
            >
              <Share2 className="size-4" />
              {tp('articleDetail', 'share')}
            </Button>
          </div>
        </div>
      </article>
    </motion.div>
  );
}
