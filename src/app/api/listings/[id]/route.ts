import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { mapListingToDTO } from '@/lib/map-listing';

// GET /api/listings/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const listing = await db.listing.findUnique({
      where: { id },
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
    });

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Increment view count
    await db.listing.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json(mapListingToDTO(listing));
  } catch (error) {
    console.error(`[GET /api/listings/[id]]`, error);
    return NextResponse.json(
      { error: 'Failed to fetch listing' },
      { status: 500 }
    );
  }
}

// PUT /api/listings/[id] — update listing (status, renew, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const listing = await db.listing.findUnique({ where: { id } });
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Only owner or admin can update
    if (listing.authorId !== session.user.id && (session.user as { role?: string }).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};

    if (body.status !== undefined) updateData.status = body.status;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.municipality !== undefined) updateData.municipality = body.municipality;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.images !== undefined) updateData.images = JSON.stringify(body.images);
    if (body.metadata !== undefined) updateData.metadata = JSON.stringify(body.metadata);
    if (body.contactMethod !== undefined) updateData.contactMethod = body.contactMethod;
    if (body.showPhone !== undefined) updateData.showPhone = body.showPhone;
    if (body.showEmail !== undefined) updateData.showEmail = body.showEmail;

    // Renew: set status to ACTIVE and extend expiry
    if (body.renew) {
      const category = await db.category.findUnique({ where: { id: listing.categoryId } });
      const expiryDays = category?.expiryDays ?? 30;
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + expiryDays);
      updateData.status = 'ACTIVE';
      updateData.expiresAt = newExpiry;
      updateData.bumpedAt = new Date();
    }

    const updated = await db.listing.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        author: {
          select: { id: true, name: true, avatar: true, municipality: true, isVerified: true, role: true, businessName: true },
        },
      },
    });

    return NextResponse.json(mapListingToDTO(updated));
  } catch (error) {
    console.error(`[PUT /api/listings/[id]]`, error);
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 });
  }
}

// DELETE /api/listings/[id] — delete listing
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const listing = await db.listing.findUnique({ where: { id } });
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (listing.authorId !== session.user.id && (session.user as { role?: string }).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.listing.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`[DELETE /api/listings/[id]]`, error);
    return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 });
  }
}
