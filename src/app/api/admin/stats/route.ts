import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mapListingToDTO } from '@/lib/map-listing';

interface PaymentDTO {
  id: string;
  userId: string;
  userName: string;
  listingId?: string;
  listingTitle?: string;
  type: string;
  amount: number;
  status: string;
  provider?: string;
  providerId?: string;
  validFrom: string;
  validUntil?: string;
  createdAt: string;
  updatedAt: string;
}

interface AdminStatsResponse {
  totalListings: number;
  activeListings: number;
  draftListings: number;
  expiredListings: number;
  vipListings: number;
  businessListings: number;
  highlightedListings: number;
  totalUsers: number;
  activeUsers: number;
  totalBusinesses: number;
  totalRevenue: number;
  monthlyRevenue: number;
  pendingPayments: number;
  completedPayments: number;
  refundedPayments: number;
  listingsByTier: Record<string, number>;
  listingsByStatus: Record<string, number>;
  listingsByCategory: Record<string, number>;
  recentListings: ReturnType<typeof mapListingToDTO>[];
  recentPayments: PaymentDTO[];
}

// GET /api/admin/stats
export async function GET() {
  try {
    // Run all aggregations in parallel
    const [
      totalListings,
      activeListings,
      draftListings,
      expiredListings,
      vipListings,
      businessListings,
      highlightedListings,
      totalUsers,
      activeUsers,
      totalBusinesses,
      completedPayments,
      pendingPayments,
      refundedPayments,
      listingsByTier,
      listingsByStatus,
      listingsByCategory,
      recentListings,
      recentPayments,
      revenueAgg,
    ] = await Promise.all([
      db.listing.count(),
      db.listing.count({ where: { status: 'ACTIVE' } }),
      db.listing.count({ where: { status: 'DRAFT' } }),
      db.listing.count({ where: { status: 'EXPIRED' } }),
      db.listing.count({ where: { tier: 'VIP' } }),
      db.listing.count({ where: { tier: 'BUSINESS' } }),
      db.listing.count({ where: { tier: 'HIGHLIGHTED' } }),
      db.user.count(),
      db.user.count({ where: { isActive: true } }),
      db.user.count({ where: { role: 'BUSINESS' } }),
      db.payment.count({ where: { status: 'COMPLETED' } }),
      db.payment.count({ where: { status: 'PENDING' } }),
      db.payment.count({ where: { status: 'REFUNDED' } }),
      db.listing.groupBy({ by: ['tier'], _count: { tier: true } }),
      db.listing.groupBy({ by: ['status'], _count: { status: true } }),
      db.listing.groupBy({ by: ['categoryId'], _count: { categoryId: true } }),
      // Recent listings
      db.listing.findMany({
        include: {
          category: true,
          author: {
            select: {
              id: true,
              name: true,
              avatar: true,
              municipality: true,
              isVerified: true,
              role: true,
              businessName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      // Recent payments with user info
      db.payment.findMany({
        include: {
          user: { select: { id: true, name: true } },
          listing: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      // Revenue aggregations
      db.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'COMPLETED' },
      }),
    ]);

    // Monthly revenue: completed payments in the current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyRevenueAgg = await db.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: 'COMPLETED',
        createdAt: { gte: startOfMonth },
      },
    });

    // Build listingsByTier map
    const tierMap: Record<string, number> = {};
    for (const item of listingsByTier) {
      tierMap[item.tier] = item._count.tier;
    }

    // Build listingsByStatus map
    const statusMap: Record<string, number> = {};
    for (const item of listingsByStatus) {
      statusMap[item.status] = item._count.status;
    }

    // Build listingsByCategory map
    const categoryMap: Record<string, number> = {};
    for (const item of listingsByCategory) {
      categoryMap[item.categoryId] = item._count.categoryId;
    }

    // Map recent payments
    const recentPaymentsDTO: PaymentDTO[] = recentPayments.map((p) => ({
      id: p.id,
      userId: p.userId,
      userName: p.user.name,
      listingId: p.listingId ?? undefined,
      listingTitle: p.listing?.title ?? undefined,
      type: p.type,
      amount: p.amount,
      status: p.status,
      provider: p.provider ?? undefined,
      providerId: p.providerId ?? undefined,
      validFrom: p.validFrom.toISOString(),
      validUntil: p.validUntil?.toISOString(),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));

    const response: AdminStatsResponse = {
      totalListings,
      activeListings,
      draftListings,
      expiredListings,
      vipListings,
      businessListings,
      highlightedListings,
      totalUsers,
      activeUsers,
      totalBusinesses,
      totalRevenue: revenueAgg._sum.amount ?? 0,
      monthlyRevenue: monthlyRevenueAgg._sum.amount ?? 0,
      pendingPayments,
      completedPayments,
      refundedPayments,
      listingsByTier: tierMap,
      listingsByStatus: statusMap,
      listingsByCategory: categoryMap,
      recentListings: recentListings.map(mapListingToDTO),
      recentPayments: recentPaymentsDTO,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[GET /api/admin/stats]', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin stats' },
      { status: 500 }
    );
  }
}
