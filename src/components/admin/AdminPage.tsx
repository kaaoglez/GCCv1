'use client';

import { useEffect, useRef } from 'react';
import { useAdminStore, isAdminRole } from '@/lib/admin-store';
import { useModalStore } from '@/lib/modal-store';
import { AdminLayout } from './AdminLayout';
import { AdminDashboard } from './AdminDashboard';
import { AdminListings } from './AdminListings';
import { AdminPromotions } from './AdminPromotions';
import { AdminUsers } from './AdminUsers';
import { AdminCategories } from './AdminCategories';
import { AdminPayments } from './AdminPayments';
import { AdminFlyers } from './AdminFlyers';
import { AdminFlyerPlans } from './AdminFlyerPlans';
import { AdminListingPlans } from './AdminListingPlans';
import { AdminAppearance } from './AdminAppearance';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import type { UserRole } from '@/lib/types';

const pages: Record<string, React.FC> = {
  dashboard: AdminDashboard,
  listings: AdminListings,
  promotions: AdminPromotions,
  users: AdminUsers,
  categories: AdminCategories,
  payments: AdminPayments,
  flyers: AdminFlyers,
  plans: AdminFlyerPlans,
  listingPlans: AdminListingPlans,
  appearance: AdminAppearance,
};

export function AdminPage() {
  const { isAdmin, logout, activePage, userRole, setSessionRole } = useAdminStore();
  const setAdminView = useModalStore((s) => s.setAdminView);
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  const sessionRole = session?.user?.role as UserRole | undefined;
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

  // Not logged in as user: block access
  if (!isAuthenticated) {
    setAdminView(false);
    useAdminStore.getState().logout();
    return null;
  }

  // Check if user has an admin role
  if (!isAdminRole(sessionRole)) {
    setAdminView(false);
    useAdminStore.getState().logout();
    return null;
  }

  // Set session role in store if admin verified but not yet set
  if (isAdmin && sessionRole && session?.user?.name) {
    const store = useAdminStore.getState();
    if (!store.userRole) {
      store.setSessionRole(sessionRole, session.user.name);
    }
  }

  if (isAdmin) {
    const handleBack = () => {
      logout();
      setAdminView(false);
    };

    const allowedPages = useAdminStore.getState().getAllowedPages();
    if (allowedPages.length > 0 && !allowedPages.includes(activePage)) {
      useAdminStore.getState().setActivePage(allowedPages[0]);
    }

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

  setAdminView(false);
  return null;
}
