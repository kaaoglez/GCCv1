import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/profile — fetch current user's profile from DB
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        phone: true,
        bio: true,
        municipality: true,
        role: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        businessName: true,
        businessDescription: true,
        businessAddress: true,
        businessPhone: true,
        businessWebsite: true,
        businessHours: true,
        businessLogo: true,
        businessCategory: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('[GET /api/profile]', error);
    return NextResponse.json({ error: 'Error al obtener perfil' }, { status: 500 });
  }
}

// PUT /api/profile — update current user's profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    // ── Change password ──
    if (body.currentPassword !== undefined && body.newPassword !== undefined) {
      const currentPassword = String(body.currentPassword);
      const newPassword = String(body.newPassword);

      if (!currentPassword || !newPassword) {
        return NextResponse.json({ error: 'Contraseña actual y nueva son obligatorias' }, { status: 400 });
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' }, { status: 400 });
      }

      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user || !user.password) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
      }

      // Simple plain text comparison (matches current auth setup)
      if (user.password !== currentPassword) {
        return NextResponse.json({ error: 'Contraseña actual incorrecta' }, { status: 400 });
      }

      updateData.password = newPassword;
    }

    // ── Change email ──
    if (body.email !== undefined) {
      const email = String(body.email).trim().toLowerCase();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: 'Email no válido' }, { status: 400 });
      }
      // Check if email is already taken by another user
      const existing = await db.user.findUnique({ where: { email } });
      if (existing && existing.id !== userId) {
        return NextResponse.json({ error: 'Ese email ya está en uso' }, { status: 409 });
      }
      updateData.email = email;
    }

    // Don't allow role change
    if (body.role !== undefined) {
      return NextResponse.json({ error: 'El rol no se puede cambiar' }, { status: 400 });
    }

    // ── Personal fields ──
    if (body.name !== undefined) {
      const trimmed = String(body.name).trim();
      if (trimmed.length < 1) {
        return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
      }
      updateData.name = trimmed;
    }
    if (body.phone !== undefined) {
      updateData.phone = body.phone ? String(body.phone).trim() : null;
    }
    if (body.municipality !== undefined) {
      updateData.municipality = body.municipality ? String(body.municipality).trim() : null;
    }
    if (body.avatar !== undefined) {
      updateData.avatar = body.avatar ? String(body.avatar).trim() : null;
    }

    // ── Business fields ──
    if (body.businessName !== undefined) {
      updateData.businessName = body.businessName ? String(body.businessName).trim() : null;
    }
    if (body.businessDescription !== undefined) {
      updateData.businessDescription = body.businessDescription ? String(body.businessDescription).trim() : null;
    }
    if (body.businessAddress !== undefined) {
      updateData.businessAddress = body.businessAddress ? String(body.businessAddress).trim() : null;
    }
    if (body.businessPhone !== undefined) {
      updateData.businessPhone = body.businessPhone ? String(body.businessPhone).trim() : null;
    }
    if (body.businessWebsite !== undefined) {
      updateData.businessWebsite = body.businessWebsite ? String(body.businessWebsite).trim() : null;
    }
    if (body.businessHours !== undefined) {
      updateData.businessHours = body.businessHours ? String(body.businessHours).trim() : null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No hay cambios' }, { status: 400 });
    }

    updateData.updatedAt = new Date();

    const updated = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        phone: true,
        bio: true,
        municipality: true,
        role: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        businessName: true,
        businessDescription: true,
        businessAddress: true,
        businessPhone: true,
        businessWebsite: true,
        businessHours: true,
        businessLogo: true,
        businessCategory: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[PUT /api/profile]', error);
    return NextResponse.json(
      { error: 'Error al actualizar perfil' },
      { status: 500 }
    );
  }
}
