import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PRICING_PLANS } from '@/lib/types';

// GET /api/listing-plans — Return active plans for public use (no auth)
export async function GET() {
  try {
    let plans = await db.listingPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    // Seed from defaults if none exist
    if (plans.length === 0) {
      const seedData = PRICING_PLANS.map((plan, idx) => ({
        tier: plan.id,
        nameEs: plan.nameEs,
        nameEn: plan.nameEn,
        price: plan.price,
        priceLabelEs: plan.price === 0 ? '/anuncio' : `${plan.price}€/anuncio`,
        priceLabelEn: plan.price === 0 ? '/listing' : `€${plan.price}/listing`,
        badgeEs: plan.badge,
        badgeEn: plan.badge,
        color: plan.color,
        featuresEs: JSON.stringify(plan.featuresEs),
        featuresEn: JSON.stringify(plan.featuresEn),
        durationDays: plan.durationDays,
        maxImages: plan.maxImages,
        isPopular: plan.isPopular || false,
        isActive: true,
        sortOrder: idx,
        updatedAt: new Date(),
      }));

      await db.listingPlan.createMany({ data: seedData });

      plans = await db.listingPlan.findMany({
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
      durationDays: p.durationDays,
      maxImages: p.maxImages,
      isPopular: p.isPopular,
      badge: p.badgeEs,
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error('[GET /api/listing-plans]', error);
    return NextResponse.json(
      { error: 'Failed to fetch listing plans' },
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
