'use client';

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
import { AdminAppearance } from './AdminAppearance';

const pages: Record<string, React.FC> = {
  dashboard: AdminDashboard,
  listings: AdminListings,
  promotions: AdminPromotions,
  users: AdminUsers,
  categories: AdminCategories,
  payments: AdminPayments,
  flyers: AdminFlyers,
  plans: () => <div className="text-muted-foreground">Planes de folletos - próximamente</div>,
  appearance: AdminAppearance,
};

export function AdminPanel() {
  const { isAdmin, activePage } = useAdminStore();

  if (!isAdmin) return <AdminLogin />;

  const PageComponent = pages[activePage] || AdminDashboard;

  return (
    <AdminLayout>
      <PageComponent />
    </AdminLayout>
  );
}
