import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { adminUpdateUserSchema, validateBody } from '@/lib/validations';
import type { PaginatedResponse } from '@/lib/types';

// GET /api/admin/users?page=&limit=
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    const [users, total] = await Promise.all([
      db.user.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { listings: true } },
        },
      }),
      db.user.count(),
    ]);

    const data = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      avatar: u.avatar,
      municipality: u.municipality,
      role: u.role,
      language: u.language,
      isVerified: u.isVerified,
      isActive: u.isActive,
      businessName: u.businessName,
      listingCount: u._count.listings,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    }));

    const response: PaginatedResponse<typeof data[number]> = {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// PATCH /api/admin/users — update user role, verified, active
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = validateBody(adminUpdateUserSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const { userId, role, isVerified, isActive } = validation.data;

    const updateData: Record<string, unknown> = {};
    if (role) updateData.role = role;
    if (typeof isVerified === 'boolean') updateData.isVerified = isVerified;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    const user = await db.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json({ success: true, user: { id: user.id, role: user.role, isVerified: user.isVerified, isActive: user.isActive } });
  } catch (error) {
    console.error('Admin update user error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
