// Gran Canaria Conecta - HeroSection Component
// Full-width hero with gradient overlay, search bar, and CTAs

'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useI18n } from '@/hooks/use-i18n';
import { useModalStore } from '@/lib/modal-store';
import type { CategoryDTO } from '@/lib/types';

export function HeroSection() {
  const { locale, tp } = useI18n();
  const openPostAd = useModalStore((s) => s.openPostAd);
  const openSearch = useModalStore((s) => s.openSearch);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [searchText, setSearchText] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

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
      }
    }
    fetchCategories();
  }, [locale]);

  const handleSearch = () => {
    openSearch(searchText, categoryId || undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const scrollToCategories = () => {
    const el = document.getElementById('category-grid-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (!mounted) {
    return (
      <section className="relative w-full min-h-[520px] sm:min-h-[600px] flex items-center overflow-hidden bg-muted" />
    );
  }

  return (
    <section className="relative w-full min-h-[520px] sm:min-h-[600px] flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=1920&h=800&fit=crop"
          alt="Gran Canaria landscape"
          className="h-full w-full object-cover"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        <div className="max-w-2xl text-center lg:text-left">
          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-4"
          >
            {tp('hero', 'title')}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
            className="text-base sm:text-lg md:text-xl text-white/80 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed"
          >
            {tp('hero', 'subtitle')}
          </motion.p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
            className="flex flex-col sm:flex-row gap-2 mb-6"
          >
            <Input
              placeholder={tp('hero', 'searchPlaceholder')}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-12 bg-white/95 backdrop-blur-sm text-foreground placeholder:text-muted-foreground border-0 rounded-lg sm:rounded-r-none text-sm sm:text-base shadow-lg"
            />
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="h-12 w-full sm:w-48 bg-white/95 backdrop-blur-sm border-0 rounded-lg sm:rounded-none text-sm shadow-lg">
                <SelectValue placeholder={tp('search', 'allCategories')} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {locale === 'es' ? cat.nameEs : cat.nameEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="lg"
              onClick={handleSearch}
              className="h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg sm:rounded-l-none font-semibold shadow-lg gap-2"
            >
              <Search className="size-4" />
              <span className="hidden sm:inline">{tp('search', 'button')}</span>
            </Button>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45, ease: 'easeOut' }}
            className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
          >
            <Button
              size="lg"
              onClick={openPostAd}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg gap-2 px-6"
            >
              <Plus className="size-5" />
              {tp('hero', 'cta')}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={scrollToCategories}
              className="bg-white/15 hover:bg-white/25 text-white border-white/30 backdrop-blur-sm font-semibold gap-2 px-6"
            >
              <Compass className="size-5" />
              {tp('hero', 'ctaSecondary')}
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
