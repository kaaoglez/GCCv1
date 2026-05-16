import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { PaymentType, PaymentStatus, ListingTier, PaginatedResponse } from '@/lib/types';
import { adminCreatePaymentSchema, validateBody } from '@/lib/validations';

interface AdminPaymentDTO {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  listingId?: string;
  listingTitle?: string;
  type: PaymentType;
  amount: number;
  status: PaymentStatus;
  provider?: string;
  providerId?: string;
  providerData?: Record<string, unknown>;
  validFrom: string;
  validUntil?: string;
  createdAt: string;
  updatedAt: string;
}

// GET /api/admin/payments?status=&type=&page=&limit=
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status') as PaymentStatus | null;
    const type = searchParams.get('type') as PaymentType | null;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    // Build where clause
    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    // Fetch payments with user and listing info
    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          listing: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.payment.count({ where }),
    ]);

    const data: AdminPaymentDTO[] = payments.map((p) => {
      let providerData: Record<string, unknown> = {};
      try {
        providerData = JSON.parse(p.providerData || '{}');
      } catch {
        providerData = {};
      }

      return {
        id: p.id,
        userId: p.userId,
        userName: p.user.name,
        userEmail: p.user.email,
        listingId: p.listingId ?? undefined,
        listingTitle: p.listing?.title ?? undefined,
        type: p.type as PaymentType,
        amount: p.amount,
        status: p.status as PaymentStatus,
        provider: p.provider ?? undefined,
        providerId: p.providerId ?? undefined,
        providerData: Object.keys(providerData).length > 0 ? providerData : undefined,
        validFrom: p.validFrom.toISOString(),
        validUntil: p.validUntil?.toISOString(),
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      };
    });

    const response: PaginatedResponse<AdminPaymentDTO> = {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[GET /api/admin/payments]', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

// POST /api/admin/payments — Create manual payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = validateBody(adminCreatePaymentSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const { userId, listingId, type, amount, note } = validation.data;

    // Verify user exists
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify listing if provided
    if (listingId) {
      const listing = await db.listing.findUnique({ where: { id: listingId } });
      if (!listing) {
        return NextResponse.json(
          { error: 'Listing not found' },
          { status: 404 }
        );
      }
    }

    // Payment type -> tier mapping for listing upgrades
    const typeToTier: Record<string, ListingTier> = {
      VIP_UPGRADE: 'VIP',
      HIGHLIGHT_UPGRADE: 'HIGHLIGHTED',
      BUSINESS_PLAN: 'BUSINESS',
    };

    // Tier duration mapping
    const tierDuration: Record<string, number> = {
      FREE: 30,
      HIGHLIGHTED: 60,
      VIP: 90,
      BUSINESS: 365,
    };

    // Create the payment with COMPLETED status
    const payment = await db.payment.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        listingId: listingId || null,
        type,
        amount: Number(amount),
        status: 'COMPLETED',
        provider: 'manual',
        providerId: null,
        providerData: note ? JSON.stringify({ note }) : null,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        listing: {
          select: { id: true, title: true },
        },
      },
    });

    // If listingId provided, update listing tier based on payment type
    if (listingId && typeToTier[type]) {
      const newTier = typeToTier[type];
      const days = tierDuration[newTier] || 30;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);

      await db.listing.update({
        where: { id: listingId },
        data: {
          tier: newTier,
          expiresAt,
          bumpedAt: new Date(),
          status: 'ACTIVE',
          publishedAt: new Date(),
        },
      });
    }

    let providerData: Record<string, unknown> = {};
    try {
      providerData = JSON.parse(payment.providerData || '{}');
    } catch {
      providerData = {};
    }

    const dto: AdminPaymentDTO = {
      id: payment.id,
      userId: payment.userId,
      userName: payment.user.name,
      userEmail: payment.user.email,
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
    };

    return NextResponse.json(dto, { status: 201 });
  } catch (error) {
    console.error('[POST /api/admin/payments]', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}
