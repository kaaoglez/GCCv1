'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { useI18n } from '@/hooks/use-i18n';

interface BannerData {
  id: string;
  position: string;
  title: string | null;
  imageUrl: string;
  linkUrl: string | null;
  altText: string | null;
  description: string | null;
  width: number | null;
  height: number | null;
  validFrom: string;
  validUntil: string | null;
}

interface AdBannerSlotProps {
  position: 'nav_promo' | 'leaderboard' | 'sidebar' | 'news' | 'directory' | 'between_sections';
  variant?: 'leaderboard' | 'sidebar' | 'inline' | 'nav_promo';
  className?: string;
  fallback?: ReactNode;
}

/* ── Default aspect ratios per variant ── */
const DEFAULT_ASPECT: Record<string, string> = {
  nav_promo: '728/90',
  leaderboard: '728/90',
  sidebar: '300/250',
  inline: '728/90',
};

/* ── Shuffle helper (Fisher-Yates) ── */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ── Single banner card (static, no carousel) ── */
function BannerCard({
  banner,
  variant,
  sponsored,
  onClick,
}: {
  banner: BannerData;
  variant: string;
  sponsored: string;
  onClick: (b: BannerData) => void;
}) {
  const overlayTitle = banner.title || '';
  const overlayDesc = banner.description || '';

  const aspectRatio = (banner.width && banner.height)
    ? `${banner.width}/${banner.height}`
    : DEFAULT_ASPECT[variant] || '728/90';

  const maxWidth = banner.width ? `${banner.width}px` : undefined;

  return (
    <a
      href={banner.linkUrl || '#'}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => { if (!banner.linkUrl) e.preventDefault(); onClick(banner); }}
      className="group block"
    >
      <div
        className="relative rounded-lg overflow-hidden"
        style={{
          aspectRatio,
          maxWidth,
          width: '100%',
        }}
      >
        <img
          src={banner.imageUrl}
          alt={banner.altText || banner.title || 'Ad'}
          className="w-full h-full object-cover"
        />

        {/* Sponsored badge — always visible */}
        <span className="absolute top-1.5 right-1.5 text-[9px] px-1.5 py-0.5 rounded bg-black/50 text-white/80 font-medium backdrop-blur-sm">
          {sponsored}
        </span>

        {/* Hover overlay — title + description appear only on hover */}
        {(overlayTitle || overlayDesc) && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300">
            <div className="absolute bottom-0 inset-x-0 p-2.5 sm:p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              {overlayTitle && (
                <p className="text-white text-xs sm:text-sm font-semibold truncate drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                  {overlayTitle}
                </p>
              )}
              {overlayDesc && (
                <p className="text-white/80 text-[11px] sm:text-xs mt-0.5 line-clamp-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
                  {overlayDesc}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </a>
  );
}

/* ── Main AdBannerSlot ── */
export function AdBannerSlot({ position, variant = 'inline', className = '', fallback }: AdBannerSlotProps) {
  const { locale } = useI18n();
  const [banners, setBanners] = useState<BannerData[]>([]);
  const [loaded, setLoaded] = useState(false);

  const isSidebar = variant === 'sidebar';

  useEffect(() => {
    let cancelled = false;
    async function fetchBanners() {
      try {
        const res = await fetch(`/api/banners?position=${position}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            const arr = Array.isArray(data) ? data : [];
            // Random order every load — all banners get equal top position
            setBanners(shuffle(arr));
            setLoaded(true);
          }
        }
      } catch {
        if (!cancelled) setLoaded(true);
      }
    }
    fetchBanners();
    // Re-shuffle every 5 minutes
    const interval = setInterval(fetchBanners, 300000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [position]);

  const handleClick = useCallback(async (banner: BannerData) => {
    if (!banner.linkUrl) return;
    fetch('/api/banners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bannerId: banner.id }),
    }).catch(() => {});
    window.open(banner.linkUrl, '_blank', 'noopener,noreferrer');
  }, []);

  if (!loaded || banners.length === 0) return fallback ? <>{fallback}</> : null;

  const sponsored = locale === 'es' ? 'Patrocinado' : 'Sponsored';

  /* ── Sidebar: vertical stack, all visible ── */
  if (isSidebar) {
    return (
      <div className={`w-full space-y-4 ${className}`}>
        {banners.map((b) => (
          <BannerCard
            key={b.id}
            banner={b}
            variant={variant}
            sponsored={sponsored}
            onClick={handleClick}
          />
        ))}
      </div>
    );
  }

  /* ── Other positions: horizontal row, all visible side by side ── */
  return (
    <div
      className={`w-full flex flex-wrap gap-3 items-center ${className}`}
    >
      {banners.map((b) => (
        <BannerCard
          key={b.id}
          banner={b}
          variant={variant}
          sponsored={sponsored}
          onClick={handleClick}
        />
      ))}
    </div>
  );
}
