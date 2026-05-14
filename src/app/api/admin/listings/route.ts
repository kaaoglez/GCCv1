import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mapListingToDTO } from '@/lib/map-listing';
import type { ListingDTO, ListingStatus, ListingTier, PaginatedResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;
    const tier = searchParams.get('tier') as ListingTier | null;
    const status = searchParams.get('status') as ListingStatus | null;
    const municipality = searchParams.get('municipality') || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const sortBy = searchParams.get('sortBy') || 'newest';

    // Admin can see ALL listings (including DRAFT, EXPIRED)
    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (tier) where.tier = tier;
    if (status) where.status = status;
    if (municipality) where.municipality = municipality;

    const orderBy: Record<string, string> = {};
    switch (sortBy) {
      case 'oldest': orderBy.createdAt = 'asc'; break;
      case 'popular': orderBy.viewCount = 'desc'; break;
      default: orderBy.createdAt = 'desc';
    }

    const [listings, total] = await Promise.all([
      db.listing.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: true,
          author: { select: { id: true, name: true, avatar: true, municipality: true, isVerified: true, role: true, businessName: true } },
        },
      }),
      db.listing.count({ where }),
    ]);

    return NextResponse.json({
      data: listings.map(mapListingToDTO),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    } as PaginatedResponse<ListingDTO>);
  } catch (error) {
    console.error('Admin listings error:', error);
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
  }
}
