// Admin authentication utility
// Verifies admin session from httpOnly cookie on all /api/admin/* routes

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Simple token: base64 of ADMIN_PASSWORD + timestamp (valid for 24h)
function generateToken(): string {
  const secret = ADMIN_PASSWORD || 'fallback-change-me';
  const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  const payload = `${secret}:${expiry}`;
  return Buffer.from(payload).toString('base64');
}

function verifyToken(token: string): boolean {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    const [secret, expiryStr] = decoded.split(':');
    const expiry = parseInt(expiryStr, 10);
    const expectedSecret = ADMIN_PASSWORD || 'fallback-change-me';

    if (secret !== expectedSecret) return false;
    if (Date.now() > expiry) return false;
    return true;
  } catch {
    return false;
  }
}

export async function verifyAdminAuth(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('gcc_admin_token')?.value;
    return verifyToken(token || '');
  } catch {
    return false;
  }
}

export function createAdminCookie(): string {
  return generateToken();
}

export function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
