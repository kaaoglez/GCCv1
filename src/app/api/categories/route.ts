import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { CategoryDTO, Locale } from '@/lib/types';

// Force dynamic — never cache, always read fresh from DB
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/categories?locale=es|en
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale: Locale = (searchParams.get('locale') as Locale) || 'es';

    // Fetch all active categories with listing counts and children
    const categories = await db.category.findMany({
      where: { isActive: true },
      include: {
        children: {
          where: { isActive: true },
          include: {
            children: {
              where: { isActive: true },
              include: {
                _count: {
                  select: { listings: { where: { status: 'ACTIVE' } } },
                },
              },
            },
            _count: {
              select: { listings: { where: { status: 'ACTIVE' } } },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: { listings: { where: { status: 'ACTIVE' } } },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    // Transform to DTOs with hierarchy
    const dtoList: CategoryDTO[] = categories
      .filter((cat) => !cat.parentId) // Only root categories
      .map((cat) => mapToDTO(cat, locale));

    return NextResponse.json(dtoList);
  } catch (error) {
    console.error('[GET /api/categories]', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

function mapToDTO(
  cat: {
    id: string;
    slug: string;
    nameEs: string;
    nameEn: string;
    descEs: string | null;
    descEn: string | null;
    icon: string;
    color: string;
    parentId: string | null;
    sortOrder: number;
    isActive: boolean;
    isPaid: boolean;
    price: number | null;
    highlightPrice: number | null;
    vipPrice: number | null;
    allowedFields: string | null;
    showPrice: boolean;
    showLocation: boolean;
    showImages: boolean;
    maxImages: number;
    expiryDays: number;
    children?: (typeof cat)[];
    _count?: { listings: number };
  },
  locale: Locale
): CategoryDTO {
  let allowedFields: CategoryDTO['allowedFields'] = [];
  try {
    allowedFields = JSON.parse(cat.allowedFields || '[]');
  } catch {
    allowedFields = [];
  }

  const dto: CategoryDTO = {
    id: cat.id,
    slug: cat.slug,
    nameEs: cat.nameEs,
    nameEn: cat.nameEn,
    descEs: cat.descEs ?? undefined,
    descEn: cat.descEn ?? undefined,
    icon: cat.icon,
    color: cat.color,
    parentId: cat.parentId ?? undefined,
    sortOrder: cat.sortOrder,
    isActive: cat.isActive,
    isPaid: cat.isPaid,
    price: cat.price ?? undefined,
    highlightPrice: cat.highlightPrice ?? undefined,
    vipPrice: cat.vipPrice ?? undefined,
    allowedFields,
    showPrice: cat.showPrice,
    showLocation: cat.showLocation,
    showImages: cat.showImages,
    maxImages: cat.maxImages,
    expiryDays: cat.expiryDays,
    listingCount: cat._count?.listings ?? 0,
  };

  if (cat.children && cat.children.length > 0) {
    dto.children = cat.children.map((child) => mapToDTO(child, locale));
    // Sum listing counts from children
    dto.listingCount = (dto.listingCount ?? 0) + dto.children.reduce(
      (sum, child) => sum + (child.listingCount ?? 0),
      0
    );
  }

  return dto;
}
