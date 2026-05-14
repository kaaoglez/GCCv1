'use client';

import { useEffect, useRef } from 'react';
import { useAdminStore } from '@/lib/admin-store';
import { useModalStore } from '@/lib/modal-store';
import { AdminLogin } from './AdminLogin';
import { AdminLayout } from './AdminLayout';
import { AdminDashboard } from './AdminDashboard';
import { AdminListings } from './AdminListings';
import { AdminPromotions } from './AdminPromotions';
import { AdminUsers } from './AdminUsers';
import { AdminCategories } from './AdminCategories';
import { AdminPayments } from './AdminPayments';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { motion } from 'framer-motion';

const pages: Record<string, React.FC> = {
  dashboard: AdminDashboard,
  listings: AdminListings,
  promotions: AdminPromotions,
  users: AdminUsers,
  categories: AdminCategories,
  payments: AdminPayments,
};

export function AdminPage() {
  const { isAdmin, logout, activePage } = useAdminStore();
  const setAdminView = useModalStore((s) => s.setAdminView);
  const prevDarkClass = useRef<boolean | null>(null);

  useEffect(() => {
    const html = document.documentElement;
    prevDarkClass.current = html.classList.contains('dark');
    if (prevDarkClass.current) html.classList.remove('dark');
    return () => {
      if (prevDarkClass.current) html.classList.add('dark');
      prevDarkClass.current = null;
    };
  }, []);

  // Not logged in: just the login popup (page.tsx shows the site behind)
  if (!isAdmin) {
    return (
      <Dialog open onOpenChange={(open) => { if (!open) setAdminView(false); }}>
        <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
          <DialogTitle className="sr-only">Admin Login</DialogTitle>
          <AdminLogin />
        </DialogContent>
      </Dialog>
    );
  }

  // Logged in: full admin panel
  const handleBack = () => {
    logout();
    setAdminView(false);
  };

  const PageComponent = pages[activePage] || AdminDashboard;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="min-h-screen bg-slate-50"
    >
      <AdminLayout onBack={handleBack}>
        <PageComponent />
      </AdminLayout>
    </motion.div>
  );
}
