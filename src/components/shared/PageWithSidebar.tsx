'use client';

import { type ReactNode } from 'react';
import { AdBannerSlot } from '@/components/shared/AdBannerSlot';

/**
 * Adds a sidebar for banner ads alongside page content.
 * Pages keep their own container; this just wraps them in a flex layout.
 * On desktop (lg+): content + sidebar side by side.
 * On mobile/tablet: sidebar stacks below content via MobileSidebarBanner.
 */
interface PageWithSidebarProps {
  children: ReactNode;
  /** Extra banner positions to show in the sidebar (e.g. 'directory') */
  extraPositions?: string[];
}

export function PageWithSidebar({ children, extraPositions }: PageWithSidebarProps) {
  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
      {/* Main content — constrained so sidebar always fits */}
      <div className="flex-1 min-w-0 w-full">
        {children}
      </div>

      {/* Desktop sidebar — sticky */}
      <aside className="hidden lg:block w-[280px] xl:w-[300px] shrink-0">
        <div className="sticky top-20 space-y-6">
          <AdBannerSlot position="sidebar" variant="sidebar" />
          {extraPositions?.map((pos) => (
            <AdBannerSlot key={pos} position={pos as any} variant="sidebar" />
          ))}
        </div>
      </aside>
    </div>
  );
}

/**
 * Mobile-only sidebar banner, placed after PageWithSidebar on small screens.
 */
export function MobileSidebarBanner() {
  return (
    <div className="lg:hidden mt-6">
      <AdBannerSlot position="sidebar" variant="inline" />
    </div>
  );
}

/**
 * Mobile banner for extra sidebar positions (e.g. directory banners on mobile).
 */
export function MobileExtraBanner({ position }: { position: string }) {
  return (
    <div className="lg:hidden mt-6">
      <AdBannerSlot position={position as any} variant="inline" />
    </div>
  );
}
