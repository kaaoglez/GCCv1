'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Tag,
  ImageOff,
  Share2,
  Clock,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/hooks/use-i18n';
import { useModalStore } from '@/lib/modal-store';
import { formatDate } from '@/lib/format';
import { ARTICLE_CATEGORIES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import type { ArticleCategory } from '@/lib/types';

const ARTICLE_CATEGORY_COLORS: Record<ArticleCategory, string> = {
  ENVIRONMENT: '#52B788',
  COMMUNITY: '#6366F1',
  BUSINESS: '#7C3AED',
  SUSTAINABILITY: '#0D9488',
  TOURISM: '#0891B2',
  GENERAL: '#6B7280',
};

/** Strip HTML and return plain text, truncated */
function stripHtml(html: string, maxLength = 250): string {
  if (typeof document === 'undefined') return html.slice(0, maxLength) + '...';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  const text = tmp.textContent || tmp.innerText || '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '...';
}

/** Estimate reading time from HTML content */
function estimateReadingTime(html: string): number {
  const text = html.replace(/<[^>]+>/g, '');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function ArticleDetailModal() {
  const { locale, tp } = useI18n();
  const {
    selectedArticle,
    isArticleDetailOpen,
    closeArticleDetail,
    openArticleReadingView,
  } = useModalStore();

  // Blurred backdrop
  useEffect(() => {
    if (!isArticleDetailOpen) return;
    const interval = setInterval(() => {
      const overlay = document.querySelector(
        'div[data-slot="dialog-overlay"]'
      ) as HTMLElement | null;
      if (overlay) {
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
        overlay.style.backdropFilter = 'blur(6px)';
        (overlay.style as unknown as Record<string, string>)['webkitBackdropFilter'] = 'blur(6px)';
        clearInterval(interval);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [isArticleDetailOpen]);

  if (!selectedArticle || !isArticleDetailOpen) return null;

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
  const isLongArticle = readingTime > 2;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: article.title, url: window.location.href });
      } catch { /* cancelled */ }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleReadFull = () => {
    closeArticleDetail();
    // Small delay so the popup closes before the view transitions
    setTimeout(() => {
      openArticleReadingView(article);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)' }}
      onClick={closeArticleDetail}
    >
      <div
        className="relative bg-background rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image hero */}
        <div className="relative aspect-[16/7] w-full bg-muted shrink-0 overflow-hidden">
          {article.image ? (
            <Image
              src={article.image}
              alt={article.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageOff className="size-16 text-muted-foreground/20" />
            </div>
          )}

          {/* Category badge */}
          <div className="absolute top-3 left-3">
            <Badge
              className="text-xs font-medium border-0"
              style={{ backgroundColor: `${categoryColor}E6`, color: '#FFFFFF' }}
            >
              {categoryLabel}
            </Badge>
          </div>

          {/* Close button */}
          <button
            onClick={closeArticleDetail}
            className="absolute top-3 right-3 flex items-center justify-center size-9 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors z-10"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-4">
          {/* Title */}
          <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
            {article.title}
          </h2>

          {/* Author + Date + Reading time */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center justify-center size-9 rounded-full bg-muted shrink-0">
                {article.author.avatar ? (
                  <img
                    src={article.author.avatar}
                    alt={article.author.name}
                    className="size-9 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-bold text-muted-foreground">
                    {article.author.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">
                  {article.author.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(publishedAt, locale)}
                </p>
              </div>
            </div>
            {readingTime > 1 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <Clock className="size-3" />
                {readingTime} min
              </span>
            )}
          </div>

          <Separator />

          {/* Content preview */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {stripHtml(article.content || '', isLongArticle ? 280 : 600)}
          </p>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {article.tags.slice(0, 5).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <Button
              className="flex-1 gap-2 font-semibold"
              style={{ backgroundColor: categoryColor, color: '#fff' }}
              onClick={handleReadFull}
            >
              <BookOpen className="size-4" />
              {isLongArticle
                ? (locale === 'es' ? 'Leer artículo completo' : 'Read full article')
                : (locale === 'es' ? 'Leer artículo' : 'Read article')
              }
            </Button>
            <Button variant="outline" size="icon" onClick={handleShare}>
              <Share2 className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
