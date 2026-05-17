import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PRICING_PLANS } from '@/lib/types';

// GET /api/admin/listing-plans — Return all plans, seed from defaults if empty
export async function GET() {
  try {
    let plans = await db.listingPlan.findMany({
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
      durationDays: p.durationDays,
      maxImages: p.maxImages,
      isPopular: p.isPopular,
      isActive: p.isActive,
      sortOrder: p.sortOrder,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error('[GET /api/admin/listing-plans]', error);
    return NextResponse.json(
      { error: 'Failed to fetch listing plans' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/listing-plans — Upsert all plans
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
      durationDays: number;
      maxImages: number;
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
      const existing = await db.listingPlan.findUnique({
        where: { tier: plan.tier },
      });

      if (existing) {
        const updated = await db.listingPlan.update({
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
            durationDays: plan.durationDays,
            maxImages: plan.maxImages,
            isPopular: plan.isPopular,
            isActive: plan.isActive,
            sortOrder: plan.sortOrder,
            updatedAt: new Date(),
          },
        });
        results.push(updated);
      } else {
        const created = await db.listingPlan.create({
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
            durationDays: plan.durationDays,
            maxImages: plan.maxImages,
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
    console.error('[PUT /api/admin/listing-plans]', error);
    return NextResponse.json(
      { error: 'Failed to update listing plans' },
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
