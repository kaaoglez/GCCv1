// ═══════════════════════════════════════════════════════════════
// GRAN CANARIA CONECTA - ComingSoonPage
// Placeholder page for views not yet implemented
// ═══════════════════════════════════════════════════════════════

'use client';

import { motion } from 'framer-motion';
import { Home, Construction } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { EmptyState } from '@/components/shared/EmptyState';
import { useI18n } from '@/hooks/use-i18n';
import { useModalStore, type PageView } from '@/lib/modal-store';
import { navigateBack } from '@/hooks/use-navigation';

interface ComingSoonPageProps {
  viewKey: Exclude<PageView, 'home' | 'anuncios' | 'eventos'>;
}

const VIEW_LABELS: Record<string, { section: string; key: string }> = {
  categorias: { section: 'pages', key: 'categorias' },
  news:       { section: 'pages', key: 'news' },
  directory:  { section: 'pages', key: 'directory' },
  recycling:  { section: 'pages', key: 'recycling' },
};

export function ComingSoonPage({ viewKey }: ComingSoonPageProps) {
  const { tp } = useI18n();
  const setCurrentView = useModalStore((s) => s.setCurrentView);

  const viewLabel = VIEW_LABELS[viewKey];
  const title = viewLabel ? tp(viewLabel.section, viewLabel.key) : viewKey;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10"
    >
      {/* ── Breadcrumb ──────────────────────────────────── */}
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
            <BreadcrumbPage>{title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* ── Coming Soon Content ─────────────────────────── */}
      <EmptyState
        icon="Construction"
        title={tp('common', 'comingSoon')}
        description={tp('pages', 'comingSoonMsg')}
        action={{
          label: tp('common', 'backHome'),
          onClick: () => navigateBack(),
        }}
      />
    </motion.div>
  );
}
