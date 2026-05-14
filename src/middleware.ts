import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /api/admin/* routes (except login)
  if (pathname.startsWith('/api/admin/') && pathname !== '/api/admin/login') {
    const token = request.cookies.get('gcc_admin_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const decoded = Buffer.from(token, 'base64').toString();
      const [secret, expiryStr] = decoded.split(':');
      const expiry = parseInt(expiryStr, 10);
      const expectedSecret = process.env.ADMIN_PASSWORD || 'admin123';

      if (secret !== expectedSecret || Date.now() > expiry) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/admin/:path*',
};
