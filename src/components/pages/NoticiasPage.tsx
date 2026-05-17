// ═══════════════════════════════════════════════════════════════
// GRAN CANARIA CONECTA - NoticiasPage
// Full news/articles browser with filters, search, and pagination
// ═══════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { ArticleCard } from '@/components/shared/ArticleCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { AdBannerSlot } from '@/components/shared/AdBannerSlot';
import { useI18n } from '@/hooks/use-i18n';
import { useModalStore } from '@/lib/modal-store';
import { replaceNavigationState } from '@/hooks/use-navigation';
import { ARTICLE_CATEGORIES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { ArticleDTO, PaginatedResponse } from '@/lib/types';

const ITEMS_PER_PAGE = 9;

export function NoticiasPage() {
  const { locale, tp } = useI18n();
  const noticiasPage = useModalStore((s) => s.noticiasPage);
  const setNoticiasPage = useModalStore((s) => s.setNoticiasPage);
  const currentView = useModalStore((s) => s.currentView);
  const isArticleReadingView = useModalStore((s) => s.isArticleReadingView);
  const isArticleDetailOpen = useModalStore((s) => s.isArticleDetailOpen);

  // Filter state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [page, setPage] = useState(1);

  // Data state
  const [articles, setArticles] = useState<ArticleDTO[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');

  // ── Sync page from store on mount ──────────────────────
  useEffect(() => {
    if (noticiasPage > 1) setPage(noticiasPage);
  }, []);

  // ── Search debounce ────────────────────────────────────
  const prevSearchRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevSearchRef.current !== null && prevSearchRef.current !== search) {
      setPage(1);
      setNoticiasPage(1);
    }
    prevSearchRef.current = search;
  }, [search]);

  // Fetch articles
  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', String(ITEMS_PER_PAGE));
      params.set('page', String(page));
      if (category !== 'all') params.set('category', category);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/articles?${params.toString()}`);
      if (res.ok) {
        const data: PaginatedResponse<ArticleDTO> = await res.json();
        setArticles(data.data || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [page, category, search]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // ── Sync page number to history ──
  const hasMountedRef = useRef(false);
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    if (currentView === 'news' && !isArticleReadingView && !isArticleDetailOpen) {
      replaceNavigationState();
    }
  }, [page, currentView, isArticleReadingView, isArticleDetailOpen]);

  // ── Persist page to sessionStorage (for reload) ──
  useEffect(() => {
    if (currentView === 'news') {
      sessionStorage.setItem('gcc_noticias_page', String(page));
    }
  }, [page, currentView]);

  // ── Scroll Restoration ──
  useEffect(() => {
    if (!loading) {
      const y = (window as unknown as Record<string, number>).__gccRestoreScroll;
      if (y && y > 0) {
        (window as unknown as Record<string, number>).__gccRestoreScroll = 0;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior });
          });
        });
      }
    }
  }, [loading]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1); setNoticiasPage(1);
  }, [category, search]);

  const handleSearch = () => {
    setSearch(searchInput);
    setSearchInput('');
  };

  const handleClearSearch = () => {
    setSearch('');
    setSearchInput('');
  };

  // Pagination range
  const getPaginationRange = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('ellipsis');
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12"
    >
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          {tp('news', 'title')}
        </h1>
        <p className="text-muted-foreground mt-2">
          {locale === 'es'
            ? 'Últimas noticias y artículos de la comunidad'
            : 'Latest community news and articles'}
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={tp('hero', 'searchPlaceholder')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-9 pr-9"
          />
          {search && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={tp('common', 'close')}
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Category select */}
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue
              placeholder={
                locale === 'es'
                  ? 'Todas las categorías'
                  : 'All categories'
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {locale === 'es'
                ? 'Todas las categorías'
                : 'All categories'}
            </SelectItem>
            {Object.entries(ARTICLE_CATEGORIES).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {locale === 'es' ? label.es : label.en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* News banner slot */}
      <div className="mb-6">
        <AdBannerSlot position="news" variant="inline" />
      </div>

      {/* Active search indicator */}
      {search && (
        <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
          <Search className="size-4" />
          <span>
            {locale === 'es'
              ? `Buscando: "${search}"`
              : `Searching: "${search}"`}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearSearch}
            className="h-7 px-2 text-xs"
          >
            {tp('common', 'close')}
          </Button>
        </div>
      )}

      {/* Results count */}
      {!loading && articles.length > 0 && (
        <div className="mb-6 text-sm text-muted-foreground">
          {locale === 'es' ? 'Mostrando' : 'Showing'} {articles.length}{' '}
          {locale === 'es' ? 'de' : 'of'} {total}{' '}
          {total === 1
            ? locale === 'es'
              ? 'artículo'
              : 'article'
            : locale === 'es'
              ? 'artículos'
              : 'articles'}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[320px] rounded-xl" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && articles.length === 0 && (
        <EmptyState
          icon="file-text"
          title={
            search
              ? locale === 'es'
                ? 'No se encontraron artículos'
                : 'No articles found'
              : tp('news', 'noNews')
          }
          description={
            search
              ? locale === 'es'
                ? 'Intenta con otras palabras o cambia el filtro de categoría'
                : 'Try different keywords or change the category filter'
              : undefined
          }
          action={
            search
              ? {
                  label: tp('common', 'close'),
                  onClick: handleClearSearch,
                }
              : undefined
          }
        />
      )}

      {/* Articles Grid */}
      {!loading && articles.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {articles.map((article, index) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <ArticleCard article={article} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="mt-10">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => { setPage((p) => Math.max(1, p - 1)); setNoticiasPage((p) => Math.max(1, p - 1)); }}
                  className={cn(
                    'cursor-pointer',
                    page <= 1 && 'pointer-events-none opacity-50'
                  )}
                />
              </PaginationItem>

              {getPaginationRange().map((p, i) =>
                p === 'ellipsis' ? (
                  <PaginationItem key={`ellipsis-${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink
                      isActive={p === page}
                      onClick={() => { setPage(p as number); setNoticiasPage(p as number); }}
                      className="cursor-pointer"
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    {
                      setPage((p) => Math.min(totalPages, p + 1));
                      setNoticiasPage((p) => Math.min(totalPages, p + 1));
                    }
                  }
                  className={cn(
                    'cursor-pointer',
                    page >= totalPages && 'pointer-events-none opacity-50'
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </motion.div>
  );
}
