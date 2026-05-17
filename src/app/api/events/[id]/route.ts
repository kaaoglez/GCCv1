import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { EventDTO, UserSummaryDTO, EventCategory, EventStatus } from '@/lib/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const event = await db.event.findUnique({
      where: { id },
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
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    await db.event.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    const data = mapEventToDTO(event);
    return NextResponse.json(data);
  } catch (error) {
    console.error(`[GET /api/events/[id]]`, error);
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 });
  }
}

function mapEventToDTO(event: {
  id: string;
  slug: string;
  title: string;
  description: string;
  authorId: string;
  author: { id: string; name: string; avatar: string | null; municipality: string | null; isVerified: boolean; role: string; businessName: string | null };
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
  try { ecoTags = JSON.parse(event.ecoTags || '[]'); } catch { ecoTags = []; }

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
