import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mapListingToDTO } from '@/lib/map-listing';
import type { UserRole, ListingDTO } from '@/lib/types';
import { adminUpdateUserFieldsSchema, validateBody } from '@/lib/validations';

interface AdminUserDetailDTO {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  phone?: string;
  bio?: string;
  municipality?: string;
  role: UserRole;
  language: string;
  isVerified: boolean;
  isActive: boolean;
  businessName?: string;
  businessDescription?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessWebsite?: string;
  businessLogo?: string;
  businessCategory?: string;
  businessHours?: string;
  planExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
  listings: ListingDTO[];
  listingCount: number;
}

// GET /api/admin/users/[id] — Full user detail with listings
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await db.user.findUnique({
      where: { id },
      include: {
        listings: {
          include: {
            category: true,
            author: {
              select: {
                id: true,
                name: true,
                avatar: true,
                municipality: true,
                isVerified: true,
                role: true,
                businessName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        _count: {
          select: { listings: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    let businessHours: Record<string, unknown> = {};
    try {
      businessHours = JSON.parse(user.businessHours || '{}');
    } catch {
      businessHours = {};
    }

    const data: AdminUserDetailDTO = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar ?? undefined,
      phone: user.phone ?? undefined,
      bio: user.bio ?? undefined,
      municipality: user.municipality ?? undefined,
      role: user.role as UserRole,
      language: user.language,
      isVerified: user.isVerified,
      isActive: user.isActive,
      businessName: user.businessName ?? undefined,
      businessDescription: user.businessDescription ?? undefined,
      businessAddress: user.businessAddress ?? undefined,
      businessPhone: user.businessPhone ?? undefined,
      businessWebsite: user.businessWebsite ?? undefined,
      businessLogo: user.businessLogo ?? undefined,
      businessCategory: user.businessCategory ?? undefined,
      businessHours: Object.keys(businessHours).length > 0
        ? JSON.stringify(businessHours)
        : undefined,
      planExpiresAt: user.planExpiresAt?.toISOString(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      listings: user.listings.map(mapListingToDTO),
      listingCount: user._count.listings,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('[GET /api/admin/users/:id]', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id] — Update user fields
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validation = validateBody(adminUpdateUserFieldsSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const validatedData = validation.data;

    // Verify user exists
    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    const updatableFields = [
      'name',
      'email',
      'phone',
      'bio',
      'municipality',
      'role',
      'language',
      'isVerified',
      'isActive',
      'businessName',
      'businessDescription',
      'businessAddress',
      'businessPhone',
      'businessWebsite',
      'businessLogo',
      'businessCategory',
      'planExpiresAt',
    ];

    for (const field of updatableFields) {
      if (validatedData[field] !== undefined) {
        updateData[field] = validatedData[field];
      }
    }

    // Handle businessHours as JSON
    if (validatedData.businessHours !== undefined) {
      updateData.businessHours = JSON.stringify(validatedData.businessHours);
    }

    // Always include updatedAt on any update
    updateData.updatedAt = new Date();

    const updated = await db.user.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { listings: true },
        },
      },
    });

    return NextResponse.json({
      id: updated.id,
      email: updated.email,
      name: updated.name,
      avatar: updated.avatar ?? undefined,
      phone: updated.phone ?? undefined,
      bio: updated.bio ?? undefined,
      municipality: updated.municipality ?? undefined,
      role: updated.role as UserRole,
      language: updated.language,
      isVerified: updated.isVerified,
      isActive: updated.isActive,
      businessName: updated.businessName ?? undefined,
      businessDescription: updated.businessDescription ?? undefined,
      businessAddress: updated.businessAddress ?? undefined,
      businessPhone: updated.businessPhone ?? undefined,
      businessWebsite: updated.businessWebsite ?? undefined,
      businessLogo: updated.businessLogo ?? undefined,
      businessCategory: updated.businessCategory ?? undefined,
      planExpiresAt: updated.planExpiresAt?.toISOString(),
      listingCount: updated._count.listings,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('[PUT /api/admin/users/:id]', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
