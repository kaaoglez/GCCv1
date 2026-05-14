// ═══════════════════════════════════════════════════════════════
// GRAN CANARIA CONECTA - CommunityStats Component
// Community impact statistics with green gradient background
// ═══════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/shared/StatCard';
import { useI18n } from '@/hooks/use-i18n';
import type { CommunityStatDTO } from '@/lib/types';

export function CommunityStats() {
  const { locale, tp } = useI18n();
  const [stats, setStats] = useState<CommunityStatDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(Array.isArray(data) ? data : []);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  // Map stat keys to icons and translated labels
  const statConfig: Record<string, { icon: string; labelEs: string; labelEn: string }> = {
    total_listings: { icon: 'file-text', labelEs: 'Anuncios publicados', labelEn: 'Published listings' },
    active_users: { icon: 'users', labelEs: 'Usuarios activos', labelEn: 'Active users' },
    kg_recycled: { icon: 'recycle', labelEs: 'Kg reciclados', labelEn: 'Kg recycled' },
    co2_saved: { icon: 'leaf', labelEs: 'Kg CO\u2082 ahorrados', labelEn: 'Kg CO\u2082 saved' },
    events_this_month: { icon: 'calendar', labelEs: 'Eventos este mes', labelEn: 'Events this month' },
    businesses: { icon: 'store', labelEs: 'Negocios locales', labelEn: 'Local businesses' },
  };

  // Fallback to using statLabel from API if config not found
  const getLabel = (stat: CommunityStatDTO) => {
    const config = statConfig[stat.statKey];
    if (config) {
      return locale === 'es' ? config.labelEs : config.labelEn;
    }
    return stat.statLabel || stat.statKey;
  };

  const getIcon = (key: string) => {
    return statConfig[key]?.icon || 'circle';
  };

  return (
    <section className="w-full py-16 md:py-20">
      <div className="relative w-full">
        {/* Green gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-secondary" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.1),_transparent_50%)]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-10 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-primary-foreground mb-2">
              {tp('stats', 'title')}
            </h2>
            <p className="text-sm md:text-base text-primary-foreground/90">
              {tp('stats', 'subtitle')}
            </p>
          </div>

          {/* Stats Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : stats.length === 0 ? (
            <p className="text-center text-primary-foreground/80 py-8">
              {tp('common', 'noResults')}
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {stats.map((stat) => (
                <div key={stat.id}>
                  <StatCard
                    icon={getIcon(stat.statKey)}
                    value={stat.statValue}
                    label={getLabel(stat)}
                    variant="light"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
