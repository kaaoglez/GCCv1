import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import type { PaymentType } from '@/lib/types';
import { createPaymentSchema, validateBody } from '@/lib/validations';

// POST /api/payments — Create a new payment (user-facing)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const validation = validateBody(createPaymentSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { type, listingId, amount } = validation.data;
    const userId = session.user.id;

    // Verify listing exists and belongs to user if provided
    if (listingId) {
      const listing = await db.listing.findUnique({ where: { id: listingId } });
      if (!listing) {
        return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
      }
      if (listing.authorId !== userId) {
        return NextResponse.json({ error: 'You can only create payments for your own listings' }, { status: 403 });
      }
    }

    // Check for existing pending payment for the same listing+type
    if (listingId) {
      const existingPayment = await db.payment.findFirst({
        where: {
          listingId,
          type,
          status: 'PENDING',
          userId,
        },
      });
      if (existingPayment) {
        return NextResponse.json({
          error: 'You already have a pending payment for this',
          existingPaymentId: existingPayment.id,
        }, { status: 409 });
      }
    }

    // Create the payment with PENDING status (manual)
    const payment = await db.payment.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        listingId: listingId || null,
        type: type as PaymentType,
        amount: Number(amount),
        status: 'PENDING',
        provider: 'manual',
        providerId: null,
        providerData: null,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        listing: listingId ? {
          select: { id: true, title: true },
        } : false,
      },
    });

    return NextResponse.json({
      id: payment.id,
      userId: payment.userId,
      userName: payment.user.name,
      listingId: payment.listingId ?? undefined,
      listingTitle: payment.listing?.title ?? undefined,
      type: payment.type,
      amount: payment.amount,
      status: payment.status,
      provider: payment.provider,
      validFrom: payment.validFrom.toISOString(),
      createdAt: payment.createdAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/payments]', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}
