import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth';

// GET /api/messages/[id] — Get single message
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    const message = await db.message.findUnique({
      where: { id },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true },
        },
        receiver: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Only sender or receiver can see the message
    if (message.senderId !== session.user.id && message.receiverId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized to view this message' }, { status: 403 });
    }

    return NextResponse.json({
      id: message.id,
      listingId: message.listingId ?? undefined,
      sender: message.sender,
      receiver: message.receiver,
      subject: message.subject,
      content: message.content,
      isRead: message.isRead,
      createdAt: message.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('[GET /api/messages/[id]]', error);
    return NextResponse.json({ error: 'Failed to fetch message' }, { status: 500 });
  }
}

// PATCH /api/messages/[id] — Mark message as read
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    const message = await db.message.findUnique({
      where: { id },
      select: { id: true, receiverId: true, isRead: true },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Only the receiver can mark as read
    if (message.receiverId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized to update this message' }, { status: 403 });
    }

    if (message.isRead) {
      return NextResponse.json({ id: message.id, isRead: true });
    }

    const updated = await db.message.update({
      where: { id },
      data: { isRead: true },
    });

    return NextResponse.json({
      id: updated.id,
      isRead: updated.isRead,
    });
  } catch (error) {
    console.error('[PATCH /api/messages/[id]]', error);
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
  }
}
