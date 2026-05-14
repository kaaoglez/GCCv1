// ═══════════════════════════════════════════════════════════════
// GRAN CANARIA CONECTA - ReciclajePage
// Full recycling points directory with filters and result count
// ═══════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Recycle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { RecyclingCard } from '@/components/shared/RecyclingCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { useI18n } from '@/hooks/use-i18n';
import { MUNICIPALITIES, RECYCLING_TYPES } from '@/lib/types';
import type { RecyclingPointDTO, FacilityType, RecyclingType } from '@/lib/types';

export function ReciclajePage() {
  const { locale, tp } = useI18n();

  // Filter state
  const [municipality, setMunicipality] = useState<string>('all');
  const [recyclingType, setRecyclingType] = useState<string>('all');
  const [facilityType, setFacilityType] = useState<string>('all');

  // Data state
  const [points, setPoints] = useState<RecyclingPointDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // Facility type labels
  const facilityTypeLabels: Record<FacilityType, { es: string; en: string }> = {
    ecoparque: { es: 'Eco-parque', en: 'Eco-park' },
    container: { es: 'Contenedor', en: 'Container' },
    clean_point: { es: 'Punto limpio', en: 'Clean point' },
    specialized: { es: 'Especializado', en: 'Specialized' },
  };

  // Fetch recycling points
  const fetchPoints = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (municipality !== 'all') params.set('municipality', municipality);
      if (recyclingType !== 'all') params.set('type', recyclingType);
      if (facilityType !== 'all') params.set('facilityType', facilityType);

      const res = await fetch(`/api/recycling?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPoints(Array.isArray(data) ? data : []);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [municipality, recyclingType, facilityType]);

  useEffect(() => {
    fetchPoints();
  }, [fetchPoints]);

  // Sort municipalities alphabetically for the select
  const sortedMunicipalities = [...MUNICIPALITIES].sort((a, b) =>
    a.localeCompare(b, 'es')
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12"
    >
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center size-10 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <Recycle className="size-5" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            {tp('recycling', 'title')}
          </h1>
        </div>
        <p className="text-muted-foreground">
          {tp('recycling', 'subtitle')}
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        {/* Municipality select */}
        <Select value={municipality} onValueChange={setMunicipality}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder={tp('search', 'allMunicipalities')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {tp('search', 'allMunicipalities')}
            </SelectItem>
            {sortedMunicipalities.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Recycling type select */}
        <Select value={recyclingType} onValueChange={setRecyclingType}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder={tp('recycling', 'allTypes')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {tp('recycling', 'allTypes')}
            </SelectItem>
            {(Object.entries(RECYCLING_TYPES) as [RecyclingType, typeof RECYCLING_TYPES[RecyclingType]][]).map(
              ([key, info]) => (
                <SelectItem key={key} value={key}>
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block size-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: info.color }}
                    />
                    {locale === 'es' ? info.iconEs : info.iconEn}
                  </span>
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>

        {/* Facility type select */}
        <Select value={facilityType} onValueChange={setFacilityType}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue
              placeholder={
                locale === 'es' ? 'Tipo de instalación' : 'Facility type'
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {locale === 'es' ? 'Todos' : 'All'}
            </SelectItem>
            {(Object.entries(facilityTypeLabels) as [FacilityType, { es: string; en: string }][]).map(
              ([key, label]) => (
                <SelectItem key={key} value={key}>
                  {locale === 'es' ? label.es : label.en}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Result Count */}
      {!loading && points.length > 0 && (
        <div className="mb-6 text-sm text-muted-foreground">
          {locale === 'es' ? 'Mostrando' : 'Showing'} {points.length}{' '}
          {points.length === 1
            ? locale === 'es'
              ? 'punto de reciclaje'
              : 'recycling point'
            : locale === 'es'
              ? 'puntos de reciclaje'
              : 'recycling points'}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[280px] rounded-xl" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && points.length === 0 && (
        <EmptyState
          icon="recycle"
          title={
            municipality !== 'all' || recyclingType !== 'all' || facilityType !== 'all'
              ? locale === 'es'
                ? 'No se encontraron puntos con estos filtros'
                : 'No points found with these filters'
              : tp('common', 'noResults')
          }
          description={
            municipality !== 'all' || recyclingType !== 'all' || facilityType !== 'all'
              ? locale === 'es'
                ? 'Intenta cambiar los filtros para ver más resultados'
                : 'Try changing the filters to see more results'
              : undefined
          }
          action={
            municipality !== 'all' || recyclingType !== 'all' || facilityType !== 'all'
              ? {
                  label: locale === 'es' ? 'Limpiar filtros' : 'Clear filters',
                  onClick: () => {
                    setMunicipality('all');
                    setRecyclingType('all');
                    setFacilityType('all');
                  },
                }
              : undefined
          }
        />
      )}

      {/* Recycling Points Grid */}
      {!loading && points.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {points.map((point, index) => (
            <motion.div
              key={point.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <RecyclingCard point={point} />
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
