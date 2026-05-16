import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { FLYER_PLANS } from '@/lib/types';

// GET /api/flyer-plans — Return active plans for public use (no auth)
export async function GET() {
  try {
    let plans = await db.flyerPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    // Seed from defaults if none exist
    if (plans.length === 0) {
      const seedData = FLYER_PLANS.map((plan, idx) => ({
        tier: plan.id,
        nameEs: plan.nameEs,
        nameEn: plan.nameEn,
        price: plan.price,
        priceLabelEs: plan.priceLabelEs,
        priceLabelEn: plan.priceLabelEn,
        badgeEs: plan.badgeEs,
        badgeEn: plan.badgeEn,
        color: plan.color,
        featuresEs: JSON.stringify(plan.featuresEs),
        featuresEn: JSON.stringify(plan.featuresEn),
        flyersPerWeek: plan.id === 'FEATURED' ? 2 : plan.id === 'PREMIUM' ? 4 : 1,
        isPopular: (plan as any).isPopular || false,
        isActive: true,
        sortOrder: idx,
        updatedAt: new Date(),
      }));

      await db.flyerPlan.createMany({ data: seedData });

      plans = await db.flyerPlan.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
    }

    const data = plans.map((p) => ({
      id: p.tier,
      nameEs: p.nameEs,
      nameEn: p.nameEn,
      price: p.price,
      priceLabelEs: p.priceLabelEs,
      priceLabelEn: p.priceLabelEn,
      badgeEs: p.badgeEs,
      badgeEn: p.badgeEn,
      color: p.color,
      featuresEs: safeParse(p.featuresEs),
      featuresEn: safeParse(p.featuresEn),
      flyersPerWeek: p.flyersPerWeek,
      isPopular: p.isPopular,
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error('[GET /api/flyer-plans]', error);
    return NextResponse.json(
      { error: 'Failed to fetch flyer plans' },
      { status: 500 }
    );
  }
}

function safeParse(str: string): string[] {
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
