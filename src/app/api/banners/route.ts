import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/banners?position=leaderboard — Public: fetch active banners by position
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const position = searchParams.get('position');

    const now = new Date();

    const where: any = {
      active: true,
      validFrom: { lte: now },
    };

    if (position) {
      where.position = position;
    }

    const banners = await db.adBanner.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        position: true,
        title: true,
        imageUrl: true,
        linkUrl: true,
        altText: true,
        businessName: true,
        description: true,
        width: true,
        height: true,
        validFrom: true,
        validUntil: true,
      },
    });

    // Filter out expired banners
    const filtered = banners.filter((b) => !b.validUntil || b.validUntil >= now);

    // Increment impressions (fire and forget)
    if (filtered.length > 0) {
      const ids = filtered.map((b) => b.id);
      db.adBanner.updateMany({
        where: { id: { in: ids } },
        data: { impressions: { increment: 1 } },
      }).catch(() => {});
    }

    return NextResponse.json(filtered);
  } catch (error) {
    console.error('[GET /api/banners]', error);
    return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 });
  }
}

// POST /api/banners — Track click on a banner
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bannerId } = body;

    if (!bannerId) {
      return NextResponse.json({ error: 'bannerId required' }, { status: 400 });
    }

    await db.adBanner.update({
      where: { id: bannerId },
      data: { clicks: { increment: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[POST /api/banners]', error);
    return NextResponse.json({ error: 'Failed to track click' }, { status: 500 });
  }
}
