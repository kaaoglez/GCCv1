// ═══════════════════════════════════════════════════════════════
// GRAN CANARIA CONECTA - StatCard Component
// Card for community stats with animated counter
// ═══════════════════════════════════════════════════════════════

'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { getIcon } from '@/lib/icons';
import { formatNumber } from '@/lib/format';
import { useI18n } from '@/hooks/use-i18n';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: string;
  value: number;
  label: string;
  /** Use "light" when rendering on dark backgrounds (e.g. green gradient) */
  variant?: 'default' | 'light';
  className?: string;
}

function AnimatedNumber({ value, locale }: { value: number; locale: 'es' | 'en' }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    const duration = 1500;
    const startTime = Date.now();
    const startValue = 0;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (value - startValue) * eased);

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {formatNumber(displayValue, locale)}
    </span>
  );
}

export function StatCard({ icon, value, label, variant = 'default', className }: StatCardProps) {
  const { locale } = useI18n();
  const isLight = variant === 'light';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
    >
      <div
        className={cn(
          'flex flex-col items-center gap-3 rounded-xl border p-6 text-center',
          'transition-shadow duration-300 hover:shadow-md',
          isLight
            ? 'bg-white/10 border-white/15 hover:shadow-emerald-900/30'
            : 'bg-card',
          className
        )}
      >
        <div
          className={cn(
            'flex items-center justify-center size-12 rounded-full',
            isLight
              ? 'bg-white/15 text-white'
              : 'bg-primary/10 text-primary'
          )}
        >
          {getIcon(icon, 'size-6', 24)}
        </div>
        <div className="flex flex-col gap-0.5">
          <span
            className={cn(
              'text-2xl md:text-3xl font-bold',
              isLight ? 'text-white' : 'text-foreground'
            )}
          >
            <AnimatedNumber value={value} locale={locale} />
          </span>
          <span
            className={cn(
              'text-sm',
              isLight ? 'text-white/80' : 'text-muted-foreground'
            )}
          >
            {label}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
