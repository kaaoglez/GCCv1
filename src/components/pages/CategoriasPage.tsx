// ═══════════════════════════════════════════════════════════════
// GRAN CANARIA CONECTA - CategoriasPage
// Compact 10-column grid with centered last row
// Subcategories shown in full-width panel below grid
// ═══════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  ArrowRight,
  LayoutGrid,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { EmptyState } from '@/components/shared/EmptyState';
import { getIcon } from '@/lib/icons';
import { useI18n } from '@/hooks/use-i18n';
import { navigateBack, navigateTo } from '@/hooks/use-navigation';
import type { CategoryDTO } from '@/lib/types';

export function CategoriasPage() {
  const { locale, tp } = useI18n();

  // ── State ────────────────────────────────────────────────
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── Fetch Categories ─────────────────────────────────────
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data: CategoryDTO[] = await res.json();
          setCategories(data);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

  // ── The API returns root categories with nested children ──
  const parentCategories = categories;

  // ── Helpers ──────────────────────────────────────────────
  const getChildren = (parent: CategoryDTO): CategoryDTO[] =>
    parent.children ?? [];

  const getTotalCount = (parent: CategoryDTO): number =>
    parent.listingCount ?? 0;

  const getCategoryName = (cat: CategoryDTO) =>
    locale === 'es' ? cat.nameEs : cat.nameEn;

  const getCategoryDesc = (cat: CategoryDTO) =>
    locale === 'es' ? cat.descEs : cat.descEn;

  const navigateToAnuncios = (categoryId: string) => {
    navigateTo('anuncios', { categoryId });
  };

  const handleCardClick = (parent: CategoryDTO) => {
    const children = getChildren(parent);
    if (children.length > 0) {
      setExpandedId(expandedId === parent.id ? null : parent.id);
    } else {
      navigateToAnuncios(parent.id);
    }
  };

  const handleSubcategoryClick = (categoryId: string) => {
    navigateToAnuncios(categoryId);
  };

  const handleViewAll = (categoryId: string) => {
    navigateToAnuncios(categoryId);
  };

  // ── Expanded category data ───────────────────────────────
  const expandedCategory = parentCategories.find((c) => c.id === expandedId);
  const expandedChildren = expandedCategory ? getChildren(expandedCategory) : [];

  // ── Loading State ────────────────────────────────────────
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10"
      >
        <div className="mb-6">
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="mb-8 flex items-center gap-3">
          <Skeleton className="size-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-80" />
          </div>
        </div>
        {/* Compact skeleton grid */}
        <div className="flex flex-wrap justify-center gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-[100px] w-[calc(20%-9.6px)] md:w-[calc(10%-10.8px)] rounded-xl" />
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10"
    >
      {/* ── Breadcrumb ────────────────────────────────────── */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <button
                onClick={() => navigateBack()}
                className="hover:text-primary transition-colors flex items-center gap-1"
              >
                <Home className="size-3.5" />
                {tp('common', 'home')}
              </button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{tp('pages', 'categorias')}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* ── Page Header ──────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 text-primary">
            <LayoutGrid className="size-5" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            {tp('categoriasPage', 'title')}
          </h1>
        </div>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          {tp('categoriasPage', 'subtitle')}
        </p>
      </div>

      {/* ── Empty State ──────────────────────────────────── */}
      {!loading && parentCategories.length === 0 && (
        <EmptyState
          icon="LayoutGrid"
          title={tp('categoriasPage', 'noCategories')}
          description={tp('categoriasPage', 'noCategoriesDesc')}
        />
      )}

      {/* ── Compact Categories Grid (flexbox = centered last row) ── */}
      {parentCategories.length > 0 && (
        <>
          {/* 
            Flexbox with justify-center automatically centers 
            incomplete last rows. Width per card calculated:
            N cols, gap 12px → width = calc(100%/N - (N-1)*12px/N)
            
            2 cols: calc(50% - 6px)
            3 cols: calc(33.333% - 8px)  
            5 cols: calc(20% - 9.6px)
            10 cols: calc(10% - 10.8px)
          */}
          <div className="flex flex-wrap justify-center gap-3">
            {parentCategories.map((parent, index) => {
              const children = getChildren(parent);
              const totalCount = getTotalCount(parent);
              const hasChildren = children.length > 0;
              const name = getCategoryName(parent);
              const isExpanded = expandedId === parent.id;

              return (
                <motion.div
                  key={parent.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  className={`
                    w-[calc(50%-6px)] 
                    sm:w-[calc(33.333%-8px)] 
                    md:w-[calc(20%-9.6px)] 
                    lg:w-[calc(10%-10.8px)]
                  `}
                >
                  <Card
                    className={`
                      group cursor-pointer overflow-hidden border transition-all duration-200 hover:shadow-lg h-full
                      ${isExpanded
                        ? 'border-primary ring-1 ring-primary/20'
                        : 'border-border/60 hover:border-primary/30'
                      }
                    `}
                    onClick={() => handleCardClick(parent)}
                  >
                    <CardContent className="flex flex-col items-center text-center p-3 gap-1.5">
                      {/* Icon */}
                      <div
                        className="flex items-center justify-center size-9 rounded-lg transition-transform duration-200 group-hover:scale-110"
                        style={{
                          backgroundColor: `${parent.color}18`,
                          color: parent.color,
                        }}
                      >
                        {getIcon(parent.icon, 'size-5', 20)}
                      </div>

                      {/* Name + Paid badge */}
                      <div className="flex items-center gap-1 leading-none">
                        <h2 className="text-[11px] font-semibold text-foreground line-clamp-2">
                          {name}
                        </h2>
                        {parent.isPaid && (
                          <Badge className="text-[7px] px-1 py-0 bg-amber-500 text-white border-amber-500 shrink-0 leading-none">
                            ★
                          </Badge>
                        )}
                      </div>

                      {/* Count badge */}
                      {hasChildren ? (
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {children.length} sub
                        </span>
                      ) : totalCount > 0 ? (
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {totalCount}
                        </span>
                      ) : null}

                      {/* Active indicator */}
                      {isExpanded && (
                        <motion.div
                          layoutId="active-bar"
                          className="w-6 h-0.5 rounded-full bg-primary"
                        />
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* ── Expanded Subcategories Panel ──────────────── */}
          <AnimatePresence>
            {expandedCategory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="mt-4 p-4 bg-muted/40 rounded-xl border border-primary/20">
                  {/* Panel header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex items-center justify-center size-8 rounded-lg"
                        style={{
                          backgroundColor: `${expandedCategory.color}18`,
                          color: expandedCategory.color,
                        }}
                      >
                        {getIcon(expandedCategory.icon, 'size-4.5', 18)}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">
                          {getCategoryName(expandedCategory)}
                        </h3>
                        {getCategoryDesc(expandedCategory) && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {getCategoryDesc(expandedCategory)}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setExpandedId(null)}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  {/* Subcategory chips */}
                  <div className="flex flex-wrap gap-2">
                    {expandedChildren.map((child, i) => {
                      const childName = getCategoryName(child);
                      const childCount = child.listingCount ?? 0;

                      return (
                        <motion.button
                          key={child.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.15, delay: i * 0.02 }}
                          onClick={() => handleSubcategoryClick(child.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background border border-border/60 hover:border-primary/40 hover:bg-primary/5 text-xs font-medium text-foreground transition-colors"
                        >
                          <div
                            className="flex items-center justify-center size-5 rounded-md shrink-0"
                            style={{
                              backgroundColor: `${child.color || expandedCategory.color}18`,
                              color: child.color || expandedCategory.color,
                            }}
                          >
                            {getIcon(child.icon || expandedCategory.icon, 'size-3', 12)}
                          </div>
                          {childName}
                          {childCount > 0 && (
                            <span className="text-[10px] text-muted-foreground">({childCount})</span>
                          )}
                        </motion.button>
                      );
                    })}

                    {/* View all button */}
                    {getTotalCount(expandedCategory) > 0 && (
                      <motion.button
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15, delay: expandedChildren.length * 0.02 }}
                        onClick={() => handleViewAll(expandedCategory.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                      >
                        {tp('categoriasPage', 'viewListings')}
                        <ArrowRight className="size-3" />
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
}
