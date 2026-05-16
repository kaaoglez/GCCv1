import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { CategoryDTO } from '@/lib/types';
import { adminUpdateCategorySchema, validateBody } from '@/lib/validations';

// GET /api/admin/categories — All categories with children, listing counts and revenue
export async function GET() {
  try {
    const categories = await db.category.findMany({
      include: {
        children: {
          include: {
            children: {
              include: {
                _count: {
                  select: { listings: true },
                },
              },
            },
            _count: {
              select: { listings: true },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: { listings: true },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { nameEs: 'asc' }],
    });

    // Get revenue per category via listing payments
    const paymentsByCategory = await db.payment.findMany({
      where: {
        status: 'COMPLETED',
        listingId: { not: null },
      },
      include: {
        listing: {
          select: { categoryId: true },
        },
      },
    });

    const categoryRevenue: Record<string, number> = {};
    for (const payment of paymentsByCategory) {
      if (payment.listing?.categoryId) {
        categoryRevenue[payment.listing.categoryId] =
          (categoryRevenue[payment.listing.categoryId] || 0) + payment.amount;
      }
    }

    const data: (CategoryDTO & { revenue: number })[] = categories
      .filter((cat) => !cat.parentId) // Only root categories
      .map((cat) => {
        let allowedFields: CategoryDTO['allowedFields'] = [];
        try {
          allowedFields = JSON.parse(cat.allowedFields || '[]');
        } catch {
          allowedFields = [];
        }

        const children: (CategoryDTO & { revenue: number })[] = (cat.children || []).map((child) => {
          let childFields: CategoryDTO['allowedFields'] = [];
          try {
            childFields = JSON.parse(child.allowedFields || '[]');
          } catch {
            childFields = [];
          }

          return {
            id: child.id,
            slug: child.slug,
            nameEs: child.nameEs,
            nameEn: child.nameEn,
            descEs: child.descEs ?? undefined,
            descEn: child.descEn ?? undefined,
            icon: child.icon,
            color: child.color,
            parentId: child.parentId ?? undefined,
            sortOrder: child.sortOrder,
            isActive: child.isActive,
            isPaid: child.isPaid,
            price: child.price ?? undefined,
            highlightPrice: child.highlightPrice ?? undefined,
            vipPrice: child.vipPrice ?? undefined,
            allowedFields: childFields,
            showPrice: child.showPrice,
            showLocation: child.showLocation,
            showImages: child.showImages,
            maxImages: child.maxImages,
            expiryDays: child.expiryDays,
            listingCount: child._count.listings,
            revenue: categoryRevenue[child.id] || 0,
          };
        });

        return {
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
          listingCount: cat._count.listings,
          revenue: categoryRevenue[cat.id] || 0,
          children,
        };
      });

    return NextResponse.json(data);
  } catch (error) {
    console.error('[GET /api/admin/categories]', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/categories — Update category fields
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = validateBody(adminUpdateCategorySchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const validatedData = validation.data;
    const { id } = validatedData;

    // Verify category exists
    const existing = await db.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    const updatableFields = [
      'nameEs',
      'nameEn',
      'descEs',
      'descEn',
      'icon',
      'color',
      'parentId',
      'sortOrder',
      'isActive',
      'isPaid',
      'price',
      'highlightPrice',
      'vipPrice',
      'showPrice',
      'showLocation',
      'showImages',
      'maxImages',
      'expiryDays',
    ];

    for (const field of updatableFields) {
      if (validatedData[field] !== undefined) {
        updateData[field] = validatedData[field];
      }
    }

    // Handle allowedFields as JSON
    if (validatedData.allowedFields !== undefined) {
      updateData.allowedFields = JSON.stringify(validatedData.allowedFields);
    }

    // Update slug if nameEs changed
    if (validatedData.nameEs && validatedData.nameEs !== existing.nameEs) {
      const baseSlug = validatedData.nameEs
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      let slug = baseSlug;
      let counter = 1;
      while (await db.category.findFirst({ where: { slug, NOT: { id } } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      updateData.slug = slug;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const updated = await db.category.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { listings: true },
        },
      },
    });

    let allowedFields: CategoryDTO['allowedFields'] = [];
    try {
      allowedFields = JSON.parse(updated.allowedFields || '[]');
    } catch {
      allowedFields = [];
    }

    return NextResponse.json({
      id: updated.id,
      slug: updated.slug,
      nameEs: updated.nameEs,
      nameEn: updated.nameEn,
      descEs: updated.descEs ?? undefined,
      descEn: updated.descEn ?? undefined,
      icon: updated.icon,
      color: updated.color,
      parentId: updated.parentId ?? undefined,
      sortOrder: updated.sortOrder,
      isActive: updated.isActive,
      isPaid: updated.isPaid,
      price: updated.price ?? undefined,
      highlightPrice: updated.highlightPrice ?? undefined,
      vipPrice: updated.vipPrice ?? undefined,
      allowedFields,
      showPrice: updated.showPrice,
      showLocation: updated.showLocation,
      showImages: updated.showImages,
      maxImages: updated.maxImages,
      expiryDays: updated.expiryDays,
      listingCount: updated._count.listings,
    });
  } catch (error) {
    console.error('[PUT /api/admin/categories]', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}
