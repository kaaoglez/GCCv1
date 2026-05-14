import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mapListingToDTO } from '@/lib/map-listing';
import type { ListingDTO, PaginatedResponse } from '@/lib/types';

// GET /api/listings/featured?page=&limit=
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12', 10)));

    const [listings, total] = await Promise.all([
      db.listing.findMany({
        where: {
          status: 'ACTIVE',
          tier: { not: 'FREE' },
        },
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
        orderBy: [
          { bumpedAt: { sort: 'desc', nulls: 'last' } },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.listing.count({
        where: {
          status: 'ACTIVE',
          tier: { not: 'FREE' },
        },
      }),
    ]);

    const data: ListingDTO[] = listings.map(mapListingToDTO);

    const response: PaginatedResponse<ListingDTO> = {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[GET /api/listings/featured]', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured listings' },
      { status: 500 }
    );
  }
}
