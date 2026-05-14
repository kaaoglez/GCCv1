import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import type { PaymentType, PaymentStatus } from '@/lib/types';

// GET /api/payments/[id] — Get payment details (user's own payments only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;

    const payment = await db.payment.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        listing: {
          select: { id: true, title: true },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Only allow user to see their own payments (or admin)
    if (payment.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    let providerData: Record<string, unknown> = {};
    try {
      providerData = JSON.parse(payment.providerData || '{}');
    } catch {
      providerData = {};
    }

    return NextResponse.json({
      id: payment.id,
      userId: payment.userId,
      userName: payment.user.name,
      listingId: payment.listingId ?? undefined,
      listingTitle: payment.listing?.title ?? undefined,
      type: payment.type as PaymentType,
      amount: payment.amount,
      status: payment.status as PaymentStatus,
      provider: payment.provider ?? undefined,
      providerId: payment.providerId ?? undefined,
      providerData: Object.keys(providerData).length > 0 ? providerData : undefined,
      validFrom: payment.validFrom.toISOString(),
      validUntil: payment.validUntil?.toISOString(),
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('[GET /api/payments/[id]]', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment' },
      { status: 500 }
    );
  }
}

// PATCH /api/payments/[id] — Update payment status (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const { status } = body;
    if (!status || !['PENDING', 'COMPLETED', 'REFUNDED', 'FAILED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be PENDING, COMPLETED, REFUNDED, or FAILED' },
        { status: 400 }
      );
    }

    const payment = await db.payment.findUnique({ where: { id } });
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // If completing a payment that has a listing, update the listing tier
    const updateData: Record<string, unknown> = { status };

    if (status === 'COMPLETED' && payment.listingId) {
      const typeToTier: Record<string, string> = {
        VIP_UPGRADE: 'VIP',
        HIGHLIGHT_UPGRADE: 'HIGHLIGHTED',
        BUSINESS_PLAN: 'BUSINESS',
      };

      const tierDuration: Record<string, number> = {
        FREE: 30,
        HIGHLIGHTED: 60,
        VIP: 90,
        BUSINESS: 365,
      };

      const newTier = typeToTier[payment.type];
      if (newTier) {
        const days = tierDuration[newTier] || 30;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);

        await db.listing.update({
          where: { id: payment.listingId },
          data: {
            tier: newTier,
            expiresAt,
            bumpedAt: new Date(),
            status: 'ACTIVE',
            publishedAt: new Date(),
          },
        });

        updateData.validFrom = new Date();
        updateData.validUntil = expiresAt;
      }
    }

    const updated = await db.payment.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        listing: {
          select: { id: true, title: true },
        },
      },
    });

    let providerData: Record<string, unknown> = {};
    try {
      providerData = JSON.parse(updated.providerData || '{}');
    } catch {
      providerData = {};
    }

    return NextResponse.json({
      id: updated.id,
      userId: updated.userId,
      userName: updated.user.name,
      listingId: updated.listingId ?? undefined,
      listingTitle: updated.listing?.title ?? undefined,
      type: updated.type as PaymentType,
      amount: updated.amount,
      status: updated.status as PaymentStatus,
      provider: updated.provider ?? undefined,
      providerId: updated.providerId ?? undefined,
      providerData: Object.keys(providerData).length > 0 ? providerData : undefined,
      validFrom: updated.validFrom.toISOString(),
      validUntil: updated.validUntil?.toISOString(),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('[PATCH /api/payments/[id]]', error);
    return NextResponse.json(
      { error: 'Failed to update payment' },
      { status: 500 }
    );
  }
}
