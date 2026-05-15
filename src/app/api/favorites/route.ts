import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { mapListingToDTO } from '@/lib/map-listing';

// GET /api/favorites — list user's favorites
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const favorites = await db.favorite.findMany({
      where: { userId: session.user.id },
      include: {
        listing: {
          include: {
            category: true,
            author: {
              select: { id: true, name: true, avatar: true, municipality: true, isVerified: true, role: true, businessName: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(favorites.map((f) => mapListingToDTO(f.listing)));
  } catch (error) {
    console.error('[GET /api/favorites]', error);
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }
}

// POST /api/favorites — toggle favorite { listingId }
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { listingId } = await request.json();
    if (!listingId) {
      return NextResponse.json({ error: 'listingId required' }, { status: 400 });
    }

    const existing = await db.favorite.findUnique({
      where: { userId_listingId: { userId: session.user.id, listingId } },
    });

    if (existing) {
      await db.favorite.delete({ where: { id: existing.id } });
      return NextResponse.json({ isFavorite: false });
    }

    await db.favorite.create({
      data: { userId: session.user.id, listingId },
    });

    return NextResponse.json({ isFavorite: true });
  } catch (error) {
    console.error('[POST /api/favorites]', error);
    return NextResponse.json({ error: 'Failed to toggle favorite' }, { status: 500 });
  }
}
