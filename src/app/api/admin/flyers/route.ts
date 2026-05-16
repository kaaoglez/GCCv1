import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type {
  FlyerDTO,
  FlyerCategory,
  FlyerTier,
  FlyerStatus,
  PaginatedResponse,
} from '@/lib/types';

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

// ─────────────────────────────────────────────────────────────
// GET /api/admin/flyers — Fetch ALL flyers (all statuses, tiers)
// ─────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const category = searchParams.get('category') as FlyerCategory | null;
    const status = searchParams.get('status') as FlyerStatus | null;
    const search = searchParams.get('search') || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    // Build where clause — admin sees everything
    const where: Record<string, unknown> = {};

    if (category) {
      where.category = category;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { businessName: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [flyers, total] = await Promise.all([
      db.flyer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              businessName: true,
            },
          },
        },
      }),
      db.flyer.count({ where }),
    ]);

    const data = flyers.map((f) => ({
      ...mapFlyerToDTO(f as unknown as Record<string, unknown>),
      authorName: f.author?.name || null,
      authorBusinessName: f.author?.businessName || null,
    }));

    const response: PaginatedResponse<FlyerDTO & { authorName: string | null; authorBusinessName: string | null }> = {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[GET /api/admin/flyers]', error);
    return NextResponse.json(
      { error: 'Failed to fetch flyers' },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/admin/flyers — Create a new flyer
// ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
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

    if (!body.authorId || typeof body.authorId !== 'string') {
      return NextResponse.json(
        { error: 'Author ID is required' },
        { status: 400 }
      );
    }

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
        status: body.status || 'ACTIVE',
        authorId: body.authorId,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      mapFlyerToDTO(flyer as unknown as Record<string, unknown>),
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/admin/flyers]', error);
    return NextResponse.json(
      { error: 'Failed to create flyer' },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────
// PUT /api/admin/flyers — Update an existing flyer
// ─────────────────────────────────────────────────────────────
export async function PUT(request: NextRequest) {
  try {
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
      'status',
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
    console.error('[PUT /api/admin/flyers]', error);
    return NextResponse.json(
      { error: 'Failed to update flyer' },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE /api/admin/flyers — Soft-delete flyer (set status=EXPIRED)
// ─────────────────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      // Fallback: try reading from request body for non-GET requests
      const body = await request.json().catch(() => null);
      const bodyId = body?.id;
      if (!bodyId) {
        return NextResponse.json(
          { error: 'Flyer ID is required' },
          { status: 400 }
        );
      }

      const existing = await db.flyer.findUnique({ where: { id: bodyId } });
      if (!existing) {
        return NextResponse.json(
          { error: 'Flyer not found' },
          { status: 404 }
        );
      }

      const updated = await db.flyer.update({
        where: { id: bodyId },
        data: { status: 'EXPIRED', updatedAt: new Date() },
      });

      return NextResponse.json(
        mapFlyerToDTO(updated as unknown as Record<string, unknown>)
      );
    }

    const existing = await db.flyer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Flyer not found' },
        { status: 404 }
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
    console.error('[DELETE /api/admin/flyers]', error);
    return NextResponse.json(
      { error: 'Failed to delete flyer' },
      { status: 500 }
    );
  }
}
