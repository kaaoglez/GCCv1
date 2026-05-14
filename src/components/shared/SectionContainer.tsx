// ═══════════════════════════════════════════════════════════════
// GRAN CANARIA CONECTA - SectionContainer Component
// Wrapper for each page section with title, subtitle, and action
// ═══════════════════════════════════════════════════════════════

'use client';

import { useI18n } from '@/hooks/use-i18n';
import { type PageView } from '@/lib/modal-store';
import { navigateTo } from '@/hooks/use-navigation';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';
import type { TranslationString } from '@/lib/types';

interface SectionContainerProps {
  title: TranslationString;
  subtitle?: TranslationString | ((locale: string) => string);
  action?: {
    label: TranslationString | ((locale: string) => string);
    href: string;
  };
  children: React.ReactNode;
  className?: string;
  /** If true, hides the section on mobile and shows it on md+ */
  hideOnMobile?: boolean;
}

const VIEW_MAP: Record<string, PageView> = {
  '/anuncios': 'anuncios',
  '/categorias': 'categorias',
  '/eventos': 'eventos',
  '/noticias': 'news',
  '/reciclaje': 'recycling',
  '/directorio': 'directory',
};

export function SectionContainer({
  title,
  subtitle,
  action,
  children,
  className,
  hideOnMobile = false,
}: SectionContainerProps) {
  const { locale } = useI18n();

  return (
    <section
      className={cn(
        'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12',
        hideOnMobile && 'hidden md:block',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-end justify-between gap-4 mb-6 md:mb-8">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            {locale === 'es' ? title.es : title.en}
          </h2>
          {subtitle && (
            <p className="text-sm md:text-base text-muted-foreground">
              {typeof subtitle === 'function' ? subtitle(locale) : (locale === 'es' ? subtitle.es : subtitle.en)}
            </p>
          )}
        </div>

        {action && (
          <button
            onClick={() => {
              const view = VIEW_MAP[action.href];
              if (view) navigateTo(view);
            }}
            className="group flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors whitespace-nowrap shrink-0"
          >
            <span>{typeof action.label === 'function' ? action.label(locale) : (locale === 'es' ? action.label.es : action.label.en)}</span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </button>
        )}
      </div>

      {/* Content */}
      {children}
    </section>
  );
}
