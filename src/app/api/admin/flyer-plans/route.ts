import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { FLYER_PLANS } from '@/lib/types';

// GET /api/admin/flyer-plans — Return all plans, seed from defaults if empty
export async function GET() {
  try {
    let plans = await db.flyerPlan.findMany({
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
        orderBy: { sortOrder: 'asc' },
      });
    }

    const data = plans.map((p) => ({
      id: p.id,
      tier: p.tier,
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
      isActive: p.isActive,
      sortOrder: p.sortOrder,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error('[GET /api/admin/flyer-plans]', error);
    return NextResponse.json(
      { error: 'Failed to fetch flyer plans' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/flyer-plans — Upsert all plans
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const plans: Array<{
      tier: string;
      nameEs: string;
      nameEn: string;
      price: number;
      priceLabelEs: string;
      priceLabelEn: string;
      badgeEs: string;
      badgeEn: string;
      color: string;
      featuresEs: string[];
      featuresEn: string[];
      flyersPerWeek: number;
      isPopular: boolean;
      isActive: boolean;
      sortOrder: number;
    }> = Array.isArray(body) ? body : body.plans;

    if (!Array.isArray(plans) || plans.length === 0) {
      return NextResponse.json(
        { error: 'plans array is required' },
        { status: 400 }
      );
    }

    const results = [];

    for (const plan of plans) {
      const existing = await db.flyerPlan.findUnique({
        where: { tier: plan.tier },
      });

      if (existing) {
        const updated = await db.flyerPlan.update({
          where: { tier: plan.tier },
          data: {
            nameEs: plan.nameEs,
            nameEn: plan.nameEn,
            price: plan.price,
            priceLabelEs: plan.priceLabelEs,
            priceLabelEn: plan.priceLabelEn,
            badgeEs: plan.badgeEs,
            badgeEn: plan.badgeEn,
            color: plan.color,
            featuresEs: JSON.stringify(plan.featuresEs || []),
            featuresEn: JSON.stringify(plan.featuresEn || []),
            flyersPerWeek: plan.flyersPerWeek,
            isPopular: plan.isPopular,
            isActive: plan.isActive,
            sortOrder: plan.sortOrder,
            updatedAt: new Date(),
          },
        });
        results.push(updated);
      } else {
        const created = await db.flyerPlan.create({
          data: {
            tier: plan.tier,
            nameEs: plan.nameEs,
            nameEn: plan.nameEn,
            price: plan.price,
            priceLabelEs: plan.priceLabelEs,
            priceLabelEn: plan.priceLabelEn,
            badgeEs: plan.badgeEs,
            badgeEn: plan.badgeEn,
            color: plan.color,
            featuresEs: JSON.stringify(plan.featuresEs || []),
            featuresEn: JSON.stringify(plan.featuresEn || []),
            flyersPerWeek: plan.flyersPerWeek,
            isPopular: plan.isPopular,
            isActive: plan.isActive,
            sortOrder: plan.sortOrder,
            updatedAt: new Date(),
          },
        });
        results.push(created);
      }
    }

    return NextResponse.json({ success: true, count: results.length });
  } catch (error) {
    console.error('[PUT /api/admin/flyer-plans]', error);
    return NextResponse.json(
      { error: 'Failed to update flyer plans' },
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
