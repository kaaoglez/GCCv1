import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Default hero settings
const DEFAULTS: Record<string, string> = {
  hero_image: '/uploads/hero-gran-canaria.png',
  hero_height: '600',
  hero_title: '',
  hero_subtitle: '',
  hero_overlay_opacity: '0.6',
};

// GET /api/site-settings — public, returns all settings merged with defaults
export async function GET() {
  try {
    const settings = await db.siteSetting.findMany();
    const map: Record<string, string> = {};
    for (const s of settings) {
      map[s.key] = s.value;
    }
    // Merge with defaults so frontend always has a value
    const result: Record<string, string> = { ...DEFAULTS, ...map };
    return NextResponse.json(result);
  } catch (error) {
    console.error('[GET /api/site-settings]', error);
    return NextResponse.json(DEFAULTS);
  }
}

// PUT /api/site-settings — admin only, accepts { key: value } pairs
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const updates: Record<string, string> = body;

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    // Allowed keys for security
    const allowedKeys = Object.keys(DEFAULTS);

    for (const [key, value] of Object.entries(updates)) {
      if (!allowedKeys.includes(key)) continue;

      await db.siteSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PUT /api/site-settings]', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
