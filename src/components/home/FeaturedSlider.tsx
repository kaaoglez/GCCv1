// ═══════════════════════════════════════════════════════════════
// GRAN CANARIA CONECTA - FeaturedSlider Component
// Fair carousel — random shuffle, equal exposure for all paid listings
// ═══════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ListingCard } from '@/components/shared/ListingCard';
import { SectionContainer } from '@/components/shared/SectionContainer';
import { EmptyState } from '@/components/shared/EmptyState';
import { useI18n } from '@/hooks/use-i18n';
import type { ListingDTO } from '@/lib/types';

const AUTO_SCROLL_INTERVAL = 4500; // ms per slide
const RESHUFFLE_EVERY = 3; // re-shuffle every N full cycles

// Fisher-Yates shuffle
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function FeaturedSlider() {
  const { t, tp } = useI18n();
  const [allListings, setAllListings] = useState<ListingDTO[]>([]);
  const [displayList, setDisplayList] = useState<ListingDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [shuffleCount, setShuffleCount] = useState(0);
  const [visibleCount, setVisibleCount] = useState(4);
  const [justShuffled, setJustShuffled] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cycleCountRef = useRef(0);

  // Responsive visible count
  useEffect(() => {
    function updateVisible() {
      if (window.innerWidth < 640) setVisibleCount(1);
      else if (window.innerWidth < 1024) setVisibleCount(2);
      else setVisibleCount(4);
    }
    updateVisible();
    window.addEventListener('resize', updateVisible);
    return () => window.removeEventListener('resize', updateVisible);
  }, []);

  // Fetch featured listings
  useEffect(() => {
    async function fetchFeatured() {
      try {
        const res = await fetch('/api/listings/featured');
        if (res.ok) {
          const json = await res.json();
          // API returns paginated { data: [...], total, ... } — extract array
          const list = Array.isArray(json) ? json : (Array.isArray(json.data) ? json.data : []);
          setAllListings(list);
          setDisplayList(shuffle(list)); // Random order on first load
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchFeatured();
  }, []);

  const total = displayList.length;
  const maxIndex = Math.max(0, total - visibleCount);

  // Reset index when visibleCount changes
  useEffect(() => {
    if (currentIndex > maxIndex) setCurrentIndex(Math.max(0, maxIndex));
  }, [currentIndex, maxIndex]);

  // Re-shuffle after every N full cycles for fairness
  const reshuffleList = useCallback(() => {
    if (total <= visibleCount) return;
    setDisplayList(shuffle(allListings));
    setCurrentIndex(0);
    setShuffleCount((c) => c + 1);
    setJustShuffled(true);
    setTimeout(() => setJustShuffled(false), 1200); // brief visual feedback
    cycleCountRef.current = 0;
  }, [allListings, total, visibleCount]);

  // Auto-scroll: advance 1 card, re-shuffle after full cycle
  const advanceSlide = useCallback(() => {
    setCurrentIndex((prev) => {
      const next = prev >= maxIndex ? 0 : prev + 1;
      // Count a full cycle when we wrap back to 0
      if (next === 0) {
        cycleCountRef.current += 1;
        if (cycleCountRef.current >= RESHUFFLE_EVERY) {
          // Schedule reshuffle after this render
          setTimeout(reshuffleList, 700);
        }
      }
      return next;
    });
  }, [maxIndex, reshuffleList]);

  useEffect(() => {
    if (total <= visibleCount || isPaused) return;
    intervalRef.current = setInterval(advanceSlide, AUTO_SCROLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [total, visibleCount, isPaused, advanceSlide]);

  // Translate track
  useEffect(() => {
    if (!trackRef.current || total === 0) return;
    const offset = (currentIndex / total) * 100;
    trackRef.current.style.transition = 'transform 600ms cubic-bezier(0.25, 0.1, 0.25, 1)';
    trackRef.current.style.transform = `translateX(-${offset}%)`;
  }, [currentIndex, total]);

  const scrollPrev = () => setCurrentIndex((p) => (p <= 0 ? maxIndex : p - 1));
  const scrollNext = () => setCurrentIndex((p) => (p >= maxIndex ? 0 : p + 1));

  const title = tp('listings', 'featured');
  const totalPages = maxIndex + 1;

  // Dimensions: track is wider than viewport
  const cardPercent = 100 / total;
  const trackWidthPercent = (total / visibleCount) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5 }}
    >
      <SectionContainer
        title={{ es: title, en: title }}
        subtitle={
          (locale) =>
            locale === 'es'
              ? 'Los mejores anuncios destacados de la comunidad'
              : 'The best featured listings from the community'
        }
        action={{ label: t('listings', 'viewAll'), href: '/anuncios' }}
      >
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <div className="aspect-[4/3] bg-muted rounded-xl animate-pulse" />
                <div className="mt-3 h-4 bg-muted rounded animate-pulse w-3/4" />
                <div className="mt-2 h-3 bg-muted rounded animate-pulse w-1/2" />
              </div>
            ))}
          </div>
        ) : displayList.length === 0 ? (
          <EmptyState
            icon="Sparkles"
            title={tp('common', 'noResults')}
            description={title}
          />
        ) : (
          <div
            className="relative group"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Left arrow */}
            {total > visibleCount && (
              <Button
                variant="outline"
                size="icon"
                onClick={scrollPrev}
                className="absolute left-1 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-sm shadow-lg rounded-full h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Anterior"
              >
                <ChevronLeft className="size-5" />
              </Button>
            )}

            {/* Shuffle button */}
            {total > visibleCount && (
              <Button
                variant="outline"
                size="icon"
                onClick={reshuffleList}
                className={`absolute right-1 top-0 -translate-y-full mb-2 z-10 rounded-full h-8 w-8 transition-all ${
                  justShuffled
                    ? 'bg-primary text-primary-foreground scale-110'
                    : 'bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100'
                }`}
                aria-label="Aleatorizar orden"
                title={tp('common', 'shuffle')}
              >
                <Shuffle className="size-4" />
              </Button>
            )}

            {/* Viewport */}
            <div className="overflow-hidden rounded-xl">
              {/* Track */}
              <div
                ref={trackRef}
                className="flex"
                style={{
                  width: `${trackWidthPercent}%`,
                  willChange: 'transform',
                }}
              >
                {displayList.map((listing) => (
                  <div
                    key={listing.id}
                    className="flex-shrink-0 px-1 sm:px-2"
                    style={{ width: `${cardPercent}%` }}
                  >
                    <ListingCard listing={listing} />
                  </div>
                ))}
              </div>
            </div>

            {/* Right arrow */}
            {total > visibleCount && (
              <Button
                variant="outline"
                size="icon"
                onClick={scrollNext}
                className="absolute right-1 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-sm shadow-lg rounded-full h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Siguiente"
              >
                <ChevronRight className="size-5" />
              </Button>
            )}

            {/* Dots + fairness indicator */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-5">
                <div className="flex gap-2">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentIndex(i)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        i === currentIndex
                          ? 'w-8 bg-primary'
                          : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                      }`}
                      aria-label={`Página ${i + 1}`}
                    />
                  ))}
                </div>
                {/* Shuffle count badge */}
                <span className="text-xs text-muted-foreground/60 hidden sm:inline">
                  #{shuffleCount + 1}
                </span>
              </div>
            )}
          </div>
        )}
      </SectionContainer>
    </motion.div>
  );
}
