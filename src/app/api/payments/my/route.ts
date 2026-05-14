import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import type { PaymentType, PaymentStatus, PaginatedResponse } from '@/lib/types';

interface UserPaymentDTO {
  id: string;
  listingId?: string;
  listingTitle?: string;
  type: PaymentType;
  amount: number;
  status: PaymentStatus;
  provider?: string;
  validFrom: string;
  validUntil?: string;
  createdAt: string;
  updatedAt: string;
}

// GET /api/payments/my — List current user's payments (paginated)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const status = searchParams.get('status') as PaymentStatus | null;

    const userId = session.user.id;

    // Build where clause
    const where: Record<string, unknown> = { userId };
    if (status) {
      where.status = status;
    }

    // Fetch paginated payments
    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where,
        include: {
          listing: {
            select: { id: true, title: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.payment.count({ where }),
    ]);

    const data: UserPaymentDTO[] = payments.map((p) => ({
      id: p.id,
      listingId: p.listingId ?? undefined,
      listingTitle: p.listing?.title ?? undefined,
      type: p.type as PaymentType,
      amount: p.amount,
      status: p.status as PaymentStatus,
      provider: p.provider ?? undefined,
      validFrom: p.validFrom.toISOString(),
      validUntil: p.validUntil?.toISOString(),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));

    const response: PaginatedResponse<UserPaymentDTO> = {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[GET /api/payments/my]', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}
