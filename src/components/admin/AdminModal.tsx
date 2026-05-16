'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAdminStore } from '@/lib/admin-store';
import { AdminLogin } from './AdminLogin';
import { AdminLayout } from './AdminLayout';
import { AdminDashboard } from './AdminDashboard';
import { AdminListings } from './AdminListings';
import { AdminPromotions } from './AdminPromotions';
import { AdminUsers } from './AdminUsers';
import { AdminCategories } from './AdminCategories';
import { AdminPayments } from './AdminPayments';
import { AdminFlyers } from './AdminFlyers';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const pages: Record<string, React.FC> = {
  dashboard: AdminDashboard,
  listings: AdminListings,
  promotions: AdminPromotions,
  users: AdminUsers,
  categories: AdminCategories,
  payments: AdminPayments,
  flyers: AdminFlyers,
};

export function AdminModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAdmin, logout, activePage } = useAdminStore();
  const prevDarkClass = useRef<boolean | null>(null);

  const showAdmin = searchParams.get('admin') === '1' || isAdmin;

  // Remove 'dark' class while admin modal is open
  useEffect(() => {
    if (!showAdmin) return;
    const html = document.documentElement;
    prevDarkClass.current = html.classList.contains('dark');
    if (prevDarkClass.current) html.classList.remove('dark');
    return () => {
      if (prevDarkClass.current) html.classList.add('dark');
      prevDarkClass.current = null;
    };
  }, [showAdmin]);

  const closeAdmin = () => {
    logout();
    router.replace('/');
  };

  if (!showAdmin) return null;

  // Not logged in: show small login dialog
  if (!isAdmin) {
    return (
      <Dialog open onOpenChange={(open) => { if (!open) closeAdmin(); }}>
        <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
          <AdminLogin />
        </DialogContent>
      </Dialog>
    );
  }

  // Logged in: show admin panel in a large dialog
  const PageComponent = pages[activePage] || AdminDashboard;

  return (
    <Dialog open onOpenChange={(open) => { if (!open) closeAdmin(); }}>
      <DialogContent
        className="w-[calc(100%-2rem)] max-w-6xl h-[calc(100%-4rem)] sm:h-[calc(100%-3rem)] p-0 gap-0 overflow-hidden"
        showCloseButton={true}
      >
        <DialogTitle className="sr-only">Panel de Administración</DialogTitle>
        <AdminLayout>
          <PageComponent />
        </AdminLayout>
      </DialogContent>
    </Dialog>
  );
}
