import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import type {
  ListingDTO,
  ListingCreateDTO,
  PaginatedResponse,
  ListingTier,
  ListingStatus,
} from '@/lib/types';
import { mapListingToDTO } from '@/lib/map-listing';
import { createListingSchema, validateBody } from '@/lib/validations';

// GET /api/listings?categoryId=&municipality=&tier=&search=&page=&limit=&sortBy=
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const categoryId = searchParams.get('categoryId') || undefined;
    const municipality = searchParams.get('municipality') || undefined;
    const tier = searchParams.get('tier') as ListingTier | null;
    const search = searchParams.get('search') || undefined;
    const authorId = searchParams.get('authorId') || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12', 10)));
    const sortBy = (searchParams.get('sortBy') as 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'popular') || 'newest';

    // Build where clause
    const where: Record<string, unknown> = {};

    // If filtering by authorId (My Ads), don't restrict to ACTIVE only
    if (authorId) {
      where.authorId = authorId;
    } else {
      // Show ACTIVE and SOLD listings so sold badge is visible
      where.status = { in: ['ACTIVE', 'SOLD'] };
    }

    if (categoryId) {
      // Include listings from this category and its children
      const categoryWithChildren = await db.category.findMany({
        where: {
          OR: [
            { id: categoryId },
            { parentId: categoryId },
          ],
        },
        select: { id: true },
      });
      const categoryIds = categoryWithChildren.map((c) => c.id);
      if (categoryIds.length > 0) {
        where.categoryId = { in: categoryIds };
      }
    }

    if (municipality) {
      where.municipality = municipality;
    }

    if (tier) {
      where.tier = tier;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // Build orderBy
    let orderBy: Record<string, string> = { createdAt: 'desc' };
    switch (sortBy) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'popular':
        orderBy = { viewCount: 'desc' };
        break;
      case 'price_asc':
        // For price sorting we'd need to access metadata JSON — simplified approach
        orderBy = { createdAt: 'asc' };
        break;
      case 'price_desc':
        orderBy = { createdAt: 'desc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    // Fetch paginated data
    const [listings, total] = await Promise.all([
      db.listing.findMany({
        where,
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
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.listing.count({ where }),
    ]);

    const data: ListingDTO[] = listings.map(mapListingToDTO);

    const response: PaginatedResponse<ListingDTO> = {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[GET /api/listings]', error);
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}

// POST /api/listings
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user exists in database (prevents P2003 if DB was reset after login)
    const existingUser = await db.user.findUnique({
      where: { id: session.user.id },
    });
    if (!existingUser) {
      return NextResponse.json(
        { error: 'Sesión inválida. Por favor, cierra sesión y vuelve a entrar.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = validateBody(createListingSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Validate required fields
    const { title, description, categoryId, tier, metadata, images, municipality, location, lat, lng, showPhone, showEmail, contactMethod } = validation.data;

    // Verify category exists
    const category = await db.category.findUnique({
      where: { id: categoryId, isActive: true },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found or inactive' },
        { status: 404 }
      );
    }

    // Generate slug from title
    const baseSlug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    let slug = baseSlug;
    let counter = 1;
    while (await db.listing.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Calculate expiry date
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + category.expiryDays);

    // Build create DTO
    const createDTO: ListingCreateDTO = {
      title,
      description,
      categoryId,
      tier: tier || 'FREE',
      metadata: metadata || {},
      images: images || [],
      municipality,
      location,
      lat,
      lng,
      showPhone: showPhone ?? false,
      showEmail: showEmail ?? true,
      contactMethod: contactMethod || 'message',
    };

    const listing = await db.listing.create({
      data: {
        slug,
        title: createDTO.title,
        description: createDTO.description,
        categoryId: createDTO.categoryId,
        authorId: session.user.id,
        tier: createDTO.tier,
        metadata: JSON.stringify(createDTO.metadata),
        images: JSON.stringify(createDTO.images),
        municipality: createDTO.municipality,
        location: createDTO.location,
        lat: createDTO.lat,
        lng: createDTO.lng,
        status: 'ACTIVE',
        expiresAt,
        publishedAt: new Date(),
        showPhone: createDTO.showPhone,
        showEmail: createDTO.showEmail,
        contactMethod: createDTO.contactMethod,
      },
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
    });

    return NextResponse.json(mapListingToDTO(listing), { status: 201 });
  } catch (error) {
    console.error('[POST /api/listings]', error);
    return NextResponse.json(
      { error: 'Failed to create listing' },
      { status: 500 }
    );
  }
}
