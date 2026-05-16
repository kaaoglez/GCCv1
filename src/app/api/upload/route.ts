import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_SIZE_FLYER = 10 * 1024 * 1024; // 10MB for flyers

/** Purposes: 'avatar' (default, 2MB) | 'listing' (5MB) | 'flyer' (10MB) */
function getMaxSize(purpose: string): number {
  if (purpose === 'flyer') return MAX_SIZE_FLYER;
  if (purpose === 'listing') return 5 * 1024 * 1024; // 5MB for listings
  return MAX_SIZE;
}

function getPrefix(purpose: string): string {
  if (purpose === 'flyer') return 'flyer';
  if (purpose === 'listing') return 'listing';
  return 'avatar';
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const purpose = (formData.get('purpose') as string) || 'avatar';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Solo se permiten imágenes (JPG, PNG, WebP, GIF)' },
        { status: 400 }
      );
    }

    const maxSize = getMaxSize(purpose);
 if (file.size > maxSize) {
      const maxMB = maxSize / (1024 * 1024);
      return NextResponse.json(
        { error: `La imagen no puede superar ${maxMB}MB` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename based on purpose
    const ext = file.name.split('.').pop() || 'jpg';
    const prefix = getPrefix(purpose);
    const filename = `${prefix}-${session.user.id}-${Date.now()}.${ext}`;

    // Ensure uploads directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    // Return the public URL
    const url = `/uploads/${filename}`;

    return NextResponse.json({ url });
  } catch (error) {
    console.error('[POST /api/upload]', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
