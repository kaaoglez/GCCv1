import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { adminUpdateListingSchema, validateBody } from '@/lib/validations';

// PUT /api/admin/listings/[id] — update tier or status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validation = validateBody(adminUpdateListingSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const { tier, status } = validation.data;

    const updateData: Record<string, unknown> = {};
    if (tier) updateData.tier = tier;
    if (status) updateData.status = status;

    const listing = await db.listing.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, listing: { id: listing.id, tier: listing.tier, status: listing.status } });
  } catch (error) {
    console.error('Admin update listing error:', error);
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 });
  }
}

// DELETE /api/admin/listings/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.listing.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin delete listing error:', error);
    return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 });
  }
}
