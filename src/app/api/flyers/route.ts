import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import type { FlyerDTO, FlyerCategory, FlyerTier, FlyerStatus, PaginatedResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';

function mapFlyerToDTO(flyer: Record<string, unknown>): FlyerDTO {
  return {
    id: flyer.id as string,
    slug: flyer.slug as string,
    title: flyer.title as string,
    description: (flyer.description as string) || undefined,
    businessName: flyer.businessName as string,
    businessPhone: (flyer.businessPhone as string) || undefined,
    businessEmail: (flyer.businessEmail as string) || undefined,
    businessWebsite: (flyer.businessWebsite as string) || undefined,
    businessAddress: (flyer.businessAddress as string) || undefined,
    municipality: (flyer.municipality as string) || undefined,
    category: flyer.category as FlyerCategory,
    image: flyer.image as string,
    thumbnail: (flyer.thumbnail as string) || undefined,
    validFrom: (flyer.validFrom as Date).toISOString(),
    validUntil: flyer.validUntil ? (flyer.validUntil as Date).toISOString() : undefined,
    tier: flyer.tier as FlyerTier,
    status: flyer.status as FlyerStatus,
    viewCount: flyer.viewCount as number,
    clickCount: flyer.clickCount as number,
    authorId: flyer.authorId as string,
    createdAt: (flyer.createdAt as Date).toISOString(),
    updatedAt: (flyer.updatedAt as Date).toISOString(),
  };
}

/** Generate a URL-friendly slug from a title, ensuring uniqueness */
async function generateUniqueSlug(title: string): Promise<string> {
  const baseSlug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  let slug = baseSlug;
  let counter = 1;
  while (await db.flyer.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
}

/** Tier priority ordering: PREMIUM > FEATURED > BASIC */
const TIER_ORDER: Record<string, number> = {
  PREMIUM: 0,
  FEATURED: 1,
  BASIC: 2,
};

// ─────────────────────────────────────────────────────────────
// GET /api/flyers?category=&municipality=&tier=&search=&page=&limit=
// GET /api/flyers?mine=true  (business user's own flyers)
// ─────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const userRole = session?.user?.role as string | undefined;

    // Check if user is requesting their own flyers
    const mine = searchParams.get('mine') === 'true';

    // User's own flyers (any role can see theirs)
    if (mine && userId) {
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
      const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
      const statusFilter = searchParams.get('status') as FlyerStatus | null;

      const where: Record<string, unknown> = { authorId: userId };
      if (statusFilter) {
        where.status = statusFilter;
      }

      const [flyers, total] = await Promise.all([
        db.flyer.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.flyer.count({ where }),
      ]);

      const data = flyers.map((f) =>
        mapFlyerToDTO(f as unknown as Record<string, unknown>)
      );

      const response: PaginatedResponse<FlyerDTO> = {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };

      return NextResponse.json(response);
    }

    // Public flyers (only ACTIVE, valid)
    const category = searchParams.get('category') as FlyerCategory | null;
    const municipality = searchParams.get('municipality') || undefined;
    const tier = searchParams.get('tier') as FlyerTier | null;
    const search = searchParams.get('search') || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12', 10)));

    const now = new Date();

    // Build where clause — only ACTIVE, valid flyers visible to the public
    const where: Record<string, unknown> = {
      status: 'ACTIVE',
      validFrom: { lte: now },
      OR: [
        { validUntil: null },
        { validUntil: { gte: now } },
      ],
    };

    if (category) {
      where.category = category;
    }

    if (municipality) {
      where.municipality = municipality;
    }

    if (tier) {
      where.tier = tier;
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { title: { contains: search } },
            { businessName: { contains: search } },
            { description: { contains: search } },
          ],
        },
      ];
    }

    // Fetch paginated data
    const [flyers, total] = await Promise.all([
      db.flyer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.flyer.count({ where }),
    ]);

    // Sort in-memory: PREMIUM first, then FEATURED, then BASIC; within tier by createdAt desc
    flyers.sort((a, b) => {
      const tierA = TIER_ORDER[a.tier] ?? 99;
      const tierB = TIER_ORDER[b.tier] ?? 99;
      if (tierA !== tierB) return tierA - tierB;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    // Increment viewCount for each returned flyer (batch, non-blocking)
    if (flyers.length > 0) {
      db.flyer.updateMany({
        where: { id: { in: flyers.map((f) => f.id) } },
        data: { viewCount: { increment: 1 } },
      }).catch((err: unknown) => {
        console.error('[Flyers] Failed to batch-increment viewCount:', err);
      });
    }

    const data: FlyerDTO[] = flyers.map((f) =>
      mapFlyerToDTO(f as unknown as Record<string, unknown>)
    );

    const response: PaginatedResponse<FlyerDTO> = {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[GET /api/flyers]', error);
    return NextResponse.json(
      { error: 'Failed to fetch flyers' },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/flyers — Create a new flyer (business user or admin)
// ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const { title, businessName, category, image } = body;

    // Validate required fields
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!businessName || typeof businessName !== 'string' || businessName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Business name is required' },
        { status: 400 }
      );
    }

    if (!category || typeof category !== 'string' || category.trim().length === 0) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      );
    }

    if (!image || typeof image !== 'string' || image.trim().length === 0) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    const userRole = session.user.role as string;
    const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(userRole);

    // Business users' flyers start as DRAFT for admin review
    // Admin flyers go directly ACTIVE
    const initialStatus = isAdmin ? (body.status || 'ACTIVE') : 'DRAFT';

    // Auto-generate slug
    const slug = await generateUniqueSlug(title.trim());

    const flyer = await db.flyer.create({
      data: {
        slug,
        title: title.trim(),
        description: body.description || null,
        businessName: businessName.trim(),
        businessPhone: body.businessPhone || null,
        businessEmail: body.businessEmail || null,
        businessWebsite: body.businessWebsite || null,
        businessAddress: body.businessAddress || null,
        municipality: body.municipality || null,
        category: category.trim(),
        image: image.trim(),
        thumbnail: body.thumbnail || null,
        validFrom: body.validFrom ? new Date(body.validFrom) : new Date(),
        validUntil: body.validUntil ? new Date(body.validUntil) : null,
        tier: body.tier || 'BASIC',
        status: initialStatus,
        authorId: session.user.id,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      mapFlyerToDTO(flyer as unknown as Record<string, unknown>),
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/flyers]', error);
    return NextResponse.json(
      { error: 'Failed to create flyer' },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────
// PUT /api/flyers — Update an existing flyer (own flyers only, or admin)
// ─────────────────────────────────────────────────────────────
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.id || typeof body.id !== 'string') {
      return NextResponse.json(
        { error: 'Flyer ID is required' },
        { status: 400 }
      );
    }

    // Verify the flyer exists
    const existing = await db.flyer.findUnique({
      where: { id: body.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Flyer not found' },
        { status: 404 }
      );
    }

    // Ownership check: user must own the flyer OR be an admin
    const userRole = session.user.role as string;
    const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(userRole);

    if (existing.authorId !== session.user.id && !isAdmin) {
      return NextResponse.json(
        { error: 'No tienes permiso para editar este flyer' },
        { status: 403 }
      );
    }

    // Build update data (only include provided fields)
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    const allowedFields = [
      'title',
      'description',
      'businessName',
      'businessPhone',
      'businessEmail',
      'businessWebsite',
      'businessAddress',
      'municipality',
      'category',
      'image',
      'thumbnail',
      'validFrom',
      'validUntil',
      'tier',
    ] as const;

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'validFrom' || field === 'validUntil') {
          updateData[field] = body[field] ? new Date(body[field]) : null;
        } else if (field === 'title') {
          updateData[field] = body[field].trim();
        } else if (field === 'businessName') {
          updateData[field] = body[field].trim();
        } else if (field === 'description') {
          updateData[field] = body[field] || null;
        } else {
          updateData[field] = body[field];
        }
      }
    }

    // Non-admin users cannot change tier (that requires payment)
    if (!isAdmin && body.tier) {
      delete updateData.tier;
    }

    // Auto-update slug if title changed
    if (body.title && body.title.trim() !== existing.title) {
      updateData.slug = await generateUniqueSlug(body.title.trim());
    }

    const updated = await db.flyer.update({
      where: { id: body.id },
      data: updateData,
    });

    return NextResponse.json(
      mapFlyerToDTO(updated as unknown as Record<string, unknown>)
    );
  } catch (error) {
    console.error('[PUT /api/flyers]', error);
    return NextResponse.json(
      { error: 'Failed to update flyer' },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE /api/flyers — Soft-delete flyer (set status=EXPIRED)
// Only own flyers or admin
// ─────────────────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Flyer ID is required' },
        { status: 400 }
      );
    }

    // Verify the flyer exists
    const existing = await db.flyer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Flyer not found' },
        { status: 404 }
      );
    }

    // Ownership check
    const userRole = session.user.role as string;
    const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(userRole);

    if (existing.authorId !== session.user.id && !isAdmin) {
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar este flyer' },
        { status: 403 }
      );
    }

    const updated = await db.flyer.update({
      where: { id },
      data: { status: 'EXPIRED', updatedAt: new Date() },
    });

    return NextResponse.json(
      mapFlyerToDTO(updated as unknown as Record<string, unknown>)
    );
  } catch (error) {
    console.error('[DELETE /api/flyers]', error);
    return NextResponse.json(
      { error: 'Failed to delete flyer' },
      { status: 500 }
    );
  }
}
