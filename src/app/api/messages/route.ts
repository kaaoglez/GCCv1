import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { sendMessageSchema, validateBody } from '@/lib/validations';

// GET /api/messages — Get messages for current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const listingId = searchParams.get('listingId');
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit')) || 20));

    const currentUserId = session.user.id;

    // Build where clause — only messages where user is sender OR receiver
    const where: Record<string, unknown> = {
      OR: [
        { senderId: currentUserId },
        { receiverId: currentUserId },
      ],
    };

    // If userId is provided, filter to conversation between current user and that user
    if (userId) {
      where.OR = [
        { senderId: currentUserId, receiverId: userId },
        { senderId: userId, receiverId: currentUserId },
      ];
    }

    // Filter by listingId if provided
    if (listingId) {
      where.listingId = listingId;
    }

    const [messages, total] = await Promise.all([
      db.message.findMany({
        where,
        include: {
          sender: {
            select: { id: true, name: true, avatar: true },
          },
          receiver: {
            select: { id: true, name: true, avatar: true },
          },
        },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.message.count({ where }),
    ]);

    return NextResponse.json({
      data: messages.map((m) => ({
        id: m.id,
        listingId: m.listingId ?? undefined,
        sender: m.sender,
        receiver: m.receiver,
        subject: m.subject,
        content: m.content,
        isRead: m.isRead,
        createdAt: m.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('[GET /api/messages]', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST /api/messages — Send a new message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const validation = validateBody(sendMessageSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { receiverId, subject, content, listingId } = validation.data;
    const senderId = session.user.id;

    // Cannot send message to yourself
    if (senderId === receiverId) {
      return NextResponse.json({ error: 'Cannot send message to yourself' }, { status: 400 });
    }

    // Verify receiver exists
    const receiver = await db.user.findUnique({
      where: { id: receiverId },
      select: { id: true, name: true, isActive: true },
    });
    if (!receiver || !receiver.isActive) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    }

    // If listingId provided, verify listing exists
    let finalSubject = subject;
    if (listingId) {
      const listing = await db.listing.findUnique({
        where: { id: listingId },
        select: { id: true, title: true },
      });
      if (!listing) {
        return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
      }
      // Auto-generate subject if not provided
      if (!finalSubject) {
        finalSubject = `Mensaje sobre: ${listing.title}`;
      }
    }

    if (!finalSubject) {
      finalSubject = 'Sin asunto';
    }

    const message = await db.message.create({
      data: {
        id: crypto.randomUUID(),
        senderId,
        receiverId,
        subject: finalSubject,
        content,
        listingId: listingId || null,
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true },
        },
        receiver: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return NextResponse.json({
      id: message.id,
      listingId: message.listingId ?? undefined,
      sender: message.sender,
      receiver: message.receiver,
      subject: message.subject,
      content: message.content,
      isRead: message.isRead,
      createdAt: message.createdAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/messages]', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
