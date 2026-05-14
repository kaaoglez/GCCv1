import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { CommunityStatDTO } from '@/lib/types';

// GET /api/stats
export async function GET() {
  try {
    const stats = await db.communityStat.findMany({
      orderBy: { statKey: 'asc' },
    });

    const data: CommunityStatDTO[] = stats.map((stat) => ({
      id: stat.id,
      statKey: stat.statKey,
      statValue: stat.statValue,
      statLabel: stat.statLabel ?? undefined,
      updatedAt: stat.updatedAt.toISOString(),
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error('[GET /api/stats]', error);
    return NextResponse.json(
      { error: 'Failed to fetch community stats' },
      { status: 500 }
    );
  }
}
