import { z, type ZodType } from 'zod';
import type { ListingTier, ListingStatus, UserRole, PaymentType, ContactMethod } from '@/lib/types';

// ─────────────────────────────────────────────────────────────
// Admin Login
// ─────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

// ─────────────────────────────────────────────────────────────
// Create Listing
// ─────────────────────────────────────────────────────────────

export const createListingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title must be at most 200 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000, 'Description must be at most 5000 characters'),
  categoryId: z.string().min(1, 'categoryId is required'),
  authorId: z.string().optional(),
  tier: z.enum(['FREE', 'HIGHLIGHTED', 'VIP', 'BUSINESS'] as const).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  images: z.array(z.string()).optional(),
  municipality: z.string().optional(),
  location: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  showPhone: z.boolean().optional(),
  showEmail: z.boolean().optional(),
  contactMethods: z.array(z.enum(['message', 'phone', 'email', 'whatsapp'] as const)).optional(),
});

// ─────────────────────────────────────────────────────────────
// Admin Update User (PATCH /api/admin/users)
// ─────────────────────────────────────────────────────────────

export const adminUpdateUserSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  role: z.enum(['MEMBER', 'BUSINESS', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'] as const).optional(),
  isVerified: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

// ─────────────────────────────────────────────────────────────
// Admin Update User Fields (PUT /api/admin/users/:id)
// ─────────────────────────────────────────────────────────────

export const adminUpdateUserFieldsSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
  municipality: z.string().optional(),
  role: z.enum(['MEMBER', 'BUSINESS', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'] as const).optional(),
  language: z.string().optional(),
  isVerified: z.boolean().optional(),
  isActive: z.boolean().optional(),
  businessName: z.string().optional(),
  businessDescription: z.string().optional(),
  businessAddress: z.string().optional(),
  businessPhone: z.string().optional(),
  businessWebsite: z.string().optional(),
  businessLogo: z.string().optional(),
  businessCategory: z.string().optional(),
  planExpiresAt: z.string().optional(),
  businessHours: z.unknown().optional(),
});

// ─────────────────────────────────────────────────────────────
// Admin Update Listing (PUT /api/admin/listings/:id)
// ─────────────────────────────────────────────────────────────

export const adminUpdateListingSchema = z.object({
  tier: z.enum(['FREE', 'HIGHLIGHTED', 'VIP', 'BUSINESS'] as const).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'EXPIRED', 'SOLD', 'ARCHIVED'] as const).optional(),
});

// ─────────────────────────────────────────────────────────────
// Admin Update Category (PUT /api/admin/categories)
// ─────────────────────────────────────────────────────────────

export const adminUpdateCategorySchema = z.object({
  id: z.string().min(1, 'id is required'),
  nameEs: z.string().optional(),
  nameEn: z.string().optional(),
  descEs: z.string().optional(),
  descEn: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().optional(),
  isActive: z.boolean().optional(),
  isPaid: z.boolean().optional(),
  price: z.number().nullable().optional(),
  highlightPrice: z.number().nullable().optional(),
  vipPrice: z.number().nullable().optional(),
  showPrice: z.boolean().optional(),
  showLocation: z.boolean().optional(),
  showImages: z.boolean().optional(),
  maxImages: z.number().optional(),
  expiryDays: z.number().optional(),
  allowedFields: z.array(z.unknown()).optional(),
});

// ─────────────────────────────────────────────────────────────
// Admin Create Category (POST /api/admin/categories)
// ─────────────────────────────────────────────────────────────

export const adminCreateCategorySchema = z.object({
  nameEs: z.string().min(1, 'Nombre en español requerido').max(100),
  nameEn: z.string().min(1, 'Nombre en inglés requerido').max(100),
  descEs: z.string().optional(),
  descEn: z.string().optional(),
  icon: z.string().default('circle'),
  color: z.string().default('#52B788'),
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().default(0),
  isActive: z.boolean().default(true),
  isPaid: z.boolean().default(false),
  price: z.number().optional(),
  highlightPrice: z.number().optional(),
  vipPrice: z.number().optional(),
  showPrice: z.boolean().default(true),
  showLocation: z.boolean().default(true),
  showImages: z.boolean().default(true),
  maxImages: z.number().default(5),
  expiryDays: z.number().default(30),
  allowedFields: z.array(z.unknown()).optional().default([]),
});

// ─────────────────────────────────────────────────────────────
// Admin Create Payment (POST /api/admin/payments)
// ─────────────────────────────────────────────────────────────

export const adminCreatePaymentSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  listingId: z.string().optional(),
  type: z.enum(['LISTING_POST', 'VIP_UPGRADE', 'HIGHLIGHT_UPGRADE', 'BUMP', 'BUSINESS_PLAN'] as const),
  amount: z.number().positive('Amount must be a positive number'),
  note: z.string().optional(),
});

// ─────────────────────────────────────────────────────────────
// User Create Payment (POST /api/payments)
// ─────────────────────────────────────────────────────────────

export const createPaymentSchema = z.object({
  type: z.enum(['LISTING_POST', 'VIP_UPGRADE', 'HIGHLIGHT_UPGRADE', 'BUMP', 'BUSINESS_PLAN'] as const),
  listingId: z.string().optional(),
  amount: z.number().positive('Amount must be a positive number'),
});

// ─────────────────────────────────────────────────────────────
// Send Message
// ─────────────────────────────────────────────────────────────

export const sendMessageSchema = z.object({
  receiverId: z.string().min(1, 'receiverId is required'),
  subject: z.string().max(200, 'Subject must be at most 200 characters').optional(),
  content: z.string().min(1, 'Message content is required').max(2000, 'Message must be at most 2000 characters'),
  listingId: z.string().optional(),
});

// ─────────────────────────────────────────────────────────────
// Validation Helper
// ─────────────────────────────────────────────────────────────

export function validateBody<T>(schema: ZodType<T>, body: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(body);
  if (!result.success) {
    const messages = result.error.issues.map(i => i.message).join(', ');
    return { success: false, error: messages };
  }
  return { success: true, data: result.data };
}
