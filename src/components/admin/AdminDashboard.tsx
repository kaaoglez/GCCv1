'use client';

import { useState, useEffect } from 'react';
import { useAdminStore } from '@/lib/admin-store';
import { useI18n } from '@/hooks/use-i18n';
import { getIcon } from '@/lib/icons';
import { formatNumber } from '@/lib/format';
import {
  FileText, Users, Star, Store, CreditCard, Clock,
  CheckCircle, Sparkles, UserCog, DollarSign,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { ListingDTO, PaginatedResponse } from '@/lib/types';

interface AdminStats {
  totalListings: number;
  activeListings: number;
  draftListings: number;
  vipListings: number;
  businessListings: number;
  totalUsers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  pendingPayments: number;
  listingsByTier: Record<string, number>;
  recentListings: ListingDTO[];
}

export function AdminDashboard() {
  const { tp, locale } = useI18n();
  const { setActivePage } = useAdminStore();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setStats(data); })
      .catch((err) => console.error('[AdminDashboard]', err))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const statCards = stats
    ? [
        { label: tp('admin.totalListings'), value: stats.totalListings, icon: 'FileText', color: 'bg-emerald-600 text-white' },
        { label: tp('admin.activeUsers'), value: stats.totalUsers, icon: 'Users', color: 'bg-sky-600 text-white' },
        { label: tp('admin.vipListings'), value: stats.vipListings, icon: 'Star', color: 'bg-purple-600 text-white' },
        { label: tp('admin.businesses'), value: stats.businessListings, icon: 'Store', color: 'bg-amber-500 text-white' },
        { label: tp('admin.monthlyRevenue'), value: `€${formatNumber(stats.monthlyRevenue, locale)}`, icon: 'CreditCard', color: 'bg-green-600 text-white', isString: true },
        { label: tp('admin.pendingListings'), value: stats.draftListings, icon: 'Clock', color: 'bg-orange-500 text-white' },
      ]
    : [];

  const quickActions = [
    { label: tp('admin.approveListings'), icon: 'CheckCircle', page: 'listings' as const, color: 'text-emerald-700 bg-emerald-100' },
    { label: tp('admin.promoteVip'), icon: 'Sparkles', page: 'promotions' as const, color: 'text-amber-700 bg-amber-100' },
    { label: tp('admin.manageUsers'), icon: 'UserCog', page: 'users' as const, color: 'text-sky-700 bg-sky-100' },
    { label: tp('admin.viewPayments'), icon: 'DollarSign', page: 'payments' as const, color: 'text-green-700 bg-green-100' },
  ];

  const tierBadge = (tier: string): React.CSSProperties => {
    const colors: Record<string, { backgroundColor: string; color: string }> = {
      FREE: { backgroundColor: '#6b7280', color: '#ffffff' },
      HIGHLIGHTED: { backgroundColor: '#f59e0b', color: '#ffffff' },
      VIP: { backgroundColor: '#f97316', color: '#ffffff' },
      BUSINESS: { backgroundColor: '#9333ea', color: '#ffffff' },
    };
    return colors[tier] || colors.FREE;
  };

  const statusBadge = (status: string): React.CSSProperties => {
    const colors: Record<string, { backgroundColor: string; color: string }> = {
      ACTIVE: { backgroundColor: '#059669', color: '#ffffff' },
      DRAFT: { backgroundColor: '#6b7280', color: '#ffffff' },
      EXPIRED: { backgroundColor: '#f59e0b', color: '#ffffff' },
      SOLD: { backgroundColor: '#2563eb', color: '#ffffff' },
      ARCHIVED: { backgroundColor: '#dc2626', color: '#ffffff' },
    };
    return colors[status] || colors.DRAFT;
  };

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-10 w-10 rounded-lg mb-3" />
                  <Skeleton className="h-8 w-20 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))
          : statCards.map((card, i) => (
              <Card key={i} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${card.color}`}>
                    {getIcon(card.icon, 'w-5 h-5')}
                  </div>
                  <p className="text-2xl font-bold" style={{ color: '#1a2e1a' }}>
                    {card.isString ? card.value : formatNumber(card.value as number, locale)}
                  </p>
                  <p className="text-sm" style={{ color: '#6b7280' }}>{card.label}</p>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4" style={{ color: '#1a2e1a' }}>{tp('admin.quickActions')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, i) => (
            <Card
              key={i}
              className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5"
              onClick={() => setActivePage(action.page)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${action.color}`}>
                  {getIcon(action.icon, 'w-5 h-5')}
                </div>
                <span className="text-sm font-medium" style={{ color: '#1a2e1a' }}>{action.label}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Listings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: '#1a2e1a' }}>{tp('admin.recentListings')}</h2>
          <Button variant="outline" size="sm" onClick={() => setActivePage('listings')}>
            {tp('listings.viewAll')}
          </Button>
        </div>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#f0f0eb', color: '#374151' }}>
                  <th className="text-left px-4 py-3 font-medium" style={{ color: '#374151' }}>{tp('form.title')}</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell" style={{ color: '#374151' }}>{tp('form.category')}</th>
                  <th className="text-left px-4 py-3 font-medium" style={{ color: '#374151' }}>Tier</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell" style={{ color: '#374151' }}>Estado</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell" style={{ color: '#374151' }}>{tp('listings.by')}</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b">
                        <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                        <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-4 w-24" /></td>
                        <td className="px-4 py-3"><Skeleton className="h-6 w-16 rounded-full" /></td>
                        <td className="px-4 py-3 hidden sm:table-cell"><Skeleton className="h-6 w-16 rounded-full" /></td>
                        <td className="px-4 py-3 hidden lg:table-cell"><Skeleton className="h-4 w-20" /></td>
                      </tr>
                    ))
                  : (stats?.recentListings || []).map((listing) => (
                      <tr key={listing.id} className="border-b hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setActivePage('listings')}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {listing.images[0] ? (
                              <img src={listing.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                {getIcon(listing.category?.icon || 'circle', 'w-4 h-4 text-muted-foreground')}
                              </div>
                            )}
                            <span className="font-medium truncate max-w-[200px]" style={{ color: '#1a2e1a' }}>{listing.title}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell" style={{ color: '#6b7280' }}>
                          {locale === 'es' ? listing.category?.nameEs : listing.category?.nameEn}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className="border-transparent" style={tierBadge(listing.tier)}>
                            {listing.tier}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <Badge className="border-transparent" style={statusBadge(listing.status)}>
                            {listing.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell" style={{ color: '#6b7280' }}>{listing.author?.name}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
