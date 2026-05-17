import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth';

// GET /api/admin/banners — List all banners with optional filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const position = searchParams.get('position');
    const active = searchParams.get('active');

    const where: any = {};
    if (position) where.position = position;
    if (active !== null) where.active = active === 'true';

    const banners = await db.adBanner.findMany({
      where,
      orderBy: [{ position: 'asc' }, { sortOrder: 'asc' }],
    });

    return NextResponse.json(banners);
  } catch (error) {
    console.error('[GET /api/admin/banners]', error);
    return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 });
  }
}

// POST /api/admin/banners — Create a new banner
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      position, title, imageUrl, linkUrl, altText,
      businessName, businessEmail, businessPhone, businessSite,
      description, width, height, active, sortOrder, validFrom, validUntil,
      paymentId, userId,
    } = body;

    if (!position || !imageUrl) {
      return NextResponse.json({ error: 'position and imageUrl are required' }, { status: 400 });
    }

    const validPositions = ['nav_promo', 'leaderboard', 'sidebar', 'news', 'directory', 'between_sections'];
    if (!validPositions.includes(position)) {
      return NextResponse.json({ error: `Invalid position. Must be: ${validPositions.join(', ')}` }, { status: 400 });
    }

    const banner = await db.adBanner.create({
      data: {
        position,
        title: title || null,
        imageUrl,
        linkUrl: linkUrl || null,
        altText: altText || null,
        businessName: businessName || null,
        businessEmail: businessEmail || null,
        businessPhone: businessPhone || null,
        businessSite: businessSite || null,
        description: description || null,
        width: width ? parseInt(width) : null,
        height: height ? parseInt(height) : null,
        active: active !== undefined ? active : true,
        sortOrder: sortOrder ?? 0,
        validFrom: validFrom ? new Date(validFrom) : new Date(),
        validUntil: validUntil ? new Date(validUntil) : null,
        paymentId: paymentId || null,
        userId: userId || null,
      },
    });

    return NextResponse.json(banner, { status: 201 });
  } catch (error) {
    console.error('[POST /api/admin/banners]', error);
    return NextResponse.json({ error: 'Failed to create banner' }, { status: 500 });
  }
}

// PUT /api/admin/banners — Update a banner
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    if (data.validFrom) data.validFrom = new Date(data.validFrom);
    if (data.validUntil) data.validUntil = new Date(data.validUntil);
    if (data.width !== undefined) data.width = data.width ? parseInt(data.width) : null;
    if (data.height !== undefined) data.height = data.height ? parseInt(data.height) : null;

    const banner = await db.adBanner.update({
      where: { id },
      data,
    });

    return NextResponse.json(banner);
  } catch (error) {
    console.error('[PUT /api/admin/banners]', error);
    return NextResponse.json({ error: 'Failed to update banner' }, { status: 500 });
  }
}

// DELETE /api/admin/banners?id=xxx — Delete a banner
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await db.adBanner.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/admin/banners]', error);
    return NextResponse.json({ error: 'Failed to delete banner' }, { status: 500 });
  }
}
