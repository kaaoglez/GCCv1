import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminCookie } from '@/lib/admin-auth';
import { loginSchema, validateBody } from '@/lib/validations';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = validateBody(loginSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const { password } = validation.data;

    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (password !== adminPassword) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    const token = createAdminCookie();

    const cookieStore = await cookies();
    cookieStore.set('gcc_admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    return NextResponse.json({ success: true, user: { name: 'Admin', role: 'ADMIN' } });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
