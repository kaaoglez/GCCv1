import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { RecyclingPointDTO, RecyclingType, FacilityType } from '@/lib/types';

// GET /api/recycling?municipality=&type=&facilityType=
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const municipality = searchParams.get('municipality') || undefined;
    const type = searchParams.get('type') || undefined;
    const facilityType = searchParams.get('facilityType') as FacilityType | null;

    // Build where clause — only active points
    const where: Record<string, unknown> = { isActive: true };

    if (municipality) {
      where.municipality = municipality;
    }

    if (facilityType) {
      where.facilityType = facilityType;
    }

    // Fetch all recycling points matching filters
    const points = await db.recyclingPoint.findMany({
      where,
      orderBy: [{ municipality: 'asc' }, { name: 'asc' }],
    });

    // If type filter, we need to filter in-memory since types is JSON
    let data: RecyclingPointDTO[] = points.map(mapRecyclingPointToDTO);

    if (type) {
      data = data.filter((point) => point.types.includes(type as RecyclingType));
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[GET /api/recycling]', error);
    return NextResponse.json(
      { error: 'Failed to fetch recycling points' },
      { status: 500 }
    );
  }
}

function mapRecyclingPointToDTO(point: {
  id: string;
  name: string;
  description: string | null;
  address: string;
  municipality: string;
  lat: number | null;
  lng: number | null;
  types: string;
  schedule: string | null;
  phone: string | null;
  website: string | null;
  email: string | null;
  facilityType: string;
  isActive: boolean;
}): RecyclingPointDTO {
  let types: RecyclingType[] = [];
  try {
    types = JSON.parse(point.types || '[]');
  } catch {
    types = [];
  }

  let schedule: Record<string, string> | undefined;
  try {
    schedule = point.schedule ? JSON.parse(point.schedule) : undefined;
  } catch {
    schedule = undefined;
  }

  return {
    id: point.id,
    name: point.name,
    description: point.description ?? undefined,
    address: point.address,
    municipality: point.municipality,
    lat: point.lat ?? undefined,
    lng: point.lng ?? undefined,
    types,
    schedule,
    phone: point.phone ?? undefined,
    website: point.website ?? undefined,
    email: point.email ?? undefined,
    facilityType: point.facilityType as FacilityType,
    isActive: point.isActive,
  };
}
