import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type {
  EventDTO,
  UserSummaryDTO,
  EventCategory,
  EventStatus,
  PaginatedResponse,
} from '@/lib/types';

// GET /api/events?category=&municipality=&isFree=&isEco=&status=&search=&page=&limit=
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const category = searchParams.get('category') as EventCategory | null;
    const municipality = searchParams.get('municipality') || undefined;
    const isFreeParam = searchParams.get('isFree');
    const isEcoParam = searchParams.get('isEco');
    const status = searchParams.get('status') as EventStatus | null;
    const search = searchParams.get('search') || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12', 10)));

    // Build where clause — default to UPCOMING if no status specified
    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    } else {
      where.status = 'UPCOMING';
    }

    if (category) {
      where.category = category;
    }

    if (municipality) {
      where.municipality = municipality;
    }

    if (isFreeParam !== null && isFreeParam !== undefined) {
      where.isFree = isFreeParam === 'true';
    }

    if (isEcoParam !== null && isEcoParam !== undefined) {
      where.isEco = isEcoParam === 'true';
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { location: { contains: search } },
      ];
    }

    const [events, total] = await Promise.all([
      db.event.findMany({
        where,
        include: {
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
        orderBy: [{ startDate: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.event.count({ where }),
    ]);

    const data: EventDTO[] = events.map(mapEventToDTO);

    const response: PaginatedResponse<EventDTO> = {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[GET /api/events]', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

function mapEventToDTO(event: {
  id: string;
  slug: string;
  title: string;
  description: string;
  authorId: string;
  author: {
    id: string;
    name: string;
    avatar: string | null;
    municipality: string | null;
    isVerified: boolean;
    role: string;
    businessName: string | null;
  };
  startDate: Date;
  endDate: Date | null;
  allDay: boolean;
  recurring: string | null;
  location: string;
  municipality: string;
  lat: number | null;
  lng: number | null;
  image: string | null;
  category: string;
  isFree: boolean;
  price: number | null;
  ticketUrl: string | null;
  capacity: number | null;
  organizer: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  website: string | null;
  isEco: boolean;
  ecoTags: string | null;
  status: string;
  viewCount: number;
  createdAt: Date;
}): EventDTO {
  let ecoTags: string[] = [];
  try {
    ecoTags = JSON.parse(event.ecoTags || '[]');
  } catch {
    ecoTags = [];
  }

  const author: UserSummaryDTO = {
    id: event.author.id,
    name: event.author.name,
    avatar: event.author.avatar ?? undefined,
    municipality: event.author.municipality ?? undefined,
    isVerified: event.author.isVerified,
    role: event.author.role as EventDTO['author']['role'],
    businessName: event.author.businessName ?? undefined,
  };

  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    description: event.description,
    authorId: event.authorId,
    author,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate?.toISOString(),
    allDay: event.allDay,
    recurring: event.recurring ? JSON.parse(event.recurring) : undefined,
    location: event.location,
    municipality: event.municipality,
    lat: event.lat ?? undefined,
    lng: event.lng ?? undefined,
    image: event.image ?? undefined,
    category: event.category as EventCategory,
    isFree: event.isFree,
    price: event.price ?? undefined,
    ticketUrl: event.ticketUrl ?? undefined,
    capacity: event.capacity ?? undefined,
    organizer: event.organizer ?? undefined,
    contactEmail: event.contactEmail ?? undefined,
    contactPhone: event.contactPhone ?? undefined,
    website: event.website ?? undefined,
    isEco: event.isEco,
    ecoTags,
    status: event.status as EventStatus,
    viewCount: event.viewCount,
    createdAt: event.createdAt.toISOString(),
  };
}
