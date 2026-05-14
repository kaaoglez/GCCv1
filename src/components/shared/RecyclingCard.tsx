// ═══════════════════════════════════════════════════════════════
// GRAN CANARIA CONECTA - RecyclingCard Component
// Card for recycling point display
// ═══════════════════════════════════════════════════════════════

'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/hooks/use-i18n';
import { RECYCLING_TYPES } from '@/lib/types';
import { cn } from '@/lib/utils';
import { MapPin, Clock, Recycle, Factory, Trash2, Droplets } from 'lucide-react';
import type { RecyclingPointDTO, FacilityType, RecyclingType } from '@/lib/types';

interface RecyclingCardProps {
  point: RecyclingPointDTO;
  className?: string;
}

const facilityIcons: Record<FacilityType, React.ReactNode> = {
  ecoparque: <Recycle className="size-5" />,
  container: <Trash2 className="size-5" />,
  clean_point: <Droplets className="size-5" />,
  specialized: <Factory className="size-5" />,
};

export function RecyclingCard({ point, className }: RecyclingCardProps) {
  const { locale } = useI18n();

  const facilityLabels: Record<FacilityType, string> = {
    ecoparque: locale === 'es' ? 'Eco-parque' : 'Eco-park',
    container: locale === 'es' ? 'Contenedor' : 'Container',
    clean_point: locale === 'es' ? 'Punto limpio' : 'Clean point',
    specialized: locale === 'es' ? 'Especializado' : 'Specialized',
  };

  const facilityLabel = facilityLabels[point.facilityType];
  const scheduleInfo = point.schedule;

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
      >
        {/* Header with facility icon */}
        <div className="flex items-center gap-3 bg-muted/50 px-4 py-3">
          <div className="flex items-center justify-center size-10 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            {facilityIcons[point.facilityType]}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground truncate">
              {point.name}
            </h3>
            <Badge
              variant="secondary"
              className="text-xs mt-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
            >
              {facilityLabel}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-2 p-4">
          {/* Address */}
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <MapPin className="size-3.5 mt-0.5 shrink-0" />
            <span className="leading-relaxed">{point.address}</span>
          </div>

          {/* Municipality */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium">{point.municipality}</span>
          </div>

          {/* Recycling types */}
          {point.types && point.types.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {point.types.map((type: RecyclingType) => {
                const typeInfo = RECYCLING_TYPES[type];
                if (!typeInfo) return null;
                const label = locale === 'es' ? typeInfo.iconEs : typeInfo.iconEn;
                return (
                  <span
                    key={type}
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border"
                    style={{
                      backgroundColor: `${typeInfo.color}18`,
                      color: typeInfo.color,
                      borderColor: `${typeInfo.color}30`,
                    }}
                  >
                    {label}
                  </span>
                );
              })}
            </div>
          )}

          {/* Schedule */}
          {scheduleInfo && Object.keys(scheduleInfo).length > 0 && (
            <div className="mt-1 pt-2 border-t">
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <Clock className="size-3.5 mt-0.5 shrink-0" />
                <div className="flex flex-col gap-0.5">
                  {Object.entries(scheduleInfo).slice(0, 3).map(([day, hours]) => (
                    <span key={day} className="leading-relaxed">
                      <span className="font-medium capitalize">{day}</span>: {String(hours)}
                    </span>
                  ))}
                  {Object.keys(scheduleInfo).length > 3 && (
                    <span className="text-muted-foreground/80">
                      {locale === 'es' ? '+ más días...' : '+ more days...'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
