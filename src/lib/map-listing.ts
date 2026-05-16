// ═══════════════════════════════════════════════════════════════
// GRAN CANARIA CONECTA - Listing DTO Mapper
// Single source of truth: Prisma listing -> ListingDTO
// ═══════════════════════════════════════════════════════════════

import type {
  ListingDTO,
  ListingStatus,
  CategoryDTO,
  UserSummaryDTO,
  ContactMethod,
} from '@/lib/types';

/**
 * Parse contactMethod field — handles both legacy single-string
 * ("message") and new JSON-array ('["message","phone"]') formats.
 */
function parseContactMethods(raw: string): ContactMethod[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as ContactMethod[];
  } catch {
    // not JSON — legacy single value
  }
  // Single string fallback
  const valid: ContactMethod[] = ['message', 'phone', 'email', 'whatsapp'];
  return valid.includes(raw as ContactMethod) ? [raw as ContactMethod] : ['message'];
}

/**
 * Maps a Prisma listing (with category + author includes) to a ListingDTO.
 * Safe JSON parsing for metadata, images, and allowedFields.
 */
export function mapListingToDTO(listing: {
  id: string;
  slug: string;
  title: string;
  description: string;
  categoryId: string;
  category: {
    id: string;
    slug: string;
    nameEs: string;
    nameEn: string;
    descEs: string | null;
    descEn: string | null;
    icon: string;
    color: string;
    parentId: string | null;
    sortOrder: number;
    isActive: boolean;
    isPaid: boolean;
    price: number | null;
    highlightPrice: number | null;
    vipPrice: number | null;
    allowedFields: string | null;
    showPrice: boolean;
    showLocation: boolean;
    showImages: boolean;
    maxImages: number;
    expiryDays: number;
  };
  authorId: string;
  author: {
    id: string;
    name: string;
    avatar: string | null;
    municipality: string | null;
    isVerified: boolean;
    role: string;
    businessName: string | null;
  };
  tier: string;
  metadata: string;
  images: string;
  municipality: string | null;
  location: string | null;
  lat: number | null;
  lng: number | null;
  status: string;
  expiresAt: Date | null;
  bumpedAt: Date | null;
  publishedAt: Date | null;
  viewCount: number;
  contactCount: number;
  showPhone: boolean;
  showEmail: boolean;
  contactMethod: string;
  createdAt: Date;
  updatedAt: Date;
}): ListingDTO {
  let metadata: Record<string, unknown> = {};
  try {
    metadata = JSON.parse(listing.metadata || '{}');
  } catch {
    metadata = {};
  }

  let images: string[] = [];
  try {
    images = JSON.parse(listing.images || '[]');
  } catch {
    images = [];
  }

  let allowedFields: CategoryDTO['allowedFields'] = [];
  try {
    allowedFields = JSON.parse(listing.category.allowedFields || '[]');
  } catch {
    allowedFields = [];
  }

  const author: UserSummaryDTO = {
    id: listing.author.id,
    name: listing.author.name,
    avatar: listing.author.avatar ?? undefined,
    municipality: listing.author.municipality ?? undefined,
    isVerified: listing.author.isVerified,
    role: listing.author.role as ListingDTO['author']['role'],
    businessName: listing.author.businessName ?? undefined,
  };

  const category: CategoryDTO = {
    id: listing.category.id,
    slug: listing.category.slug,
    nameEs: listing.category.nameEs,
    nameEn: listing.category.nameEn,
    descEs: listing.category.descEs ?? undefined,
    descEn: listing.category.descEn ?? undefined,
    icon: listing.category.icon,
    color: listing.category.color,
    parentId: listing.category.parentId ?? undefined,
    sortOrder: listing.category.sortOrder,
    isActive: listing.category.isActive,
    isPaid: listing.category.isPaid,
    price: listing.category.price ?? undefined,
    highlightPrice: listing.category.highlightPrice ?? undefined,
    vipPrice: listing.category.vipPrice ?? undefined,
    allowedFields,
    showPrice: listing.category.showPrice,
    showLocation: listing.category.showLocation,
    showImages: listing.category.showImages,
    maxImages: listing.category.maxImages,
    expiryDays: listing.category.expiryDays,
  };

  return {
    id: listing.id,
    slug: listing.slug,
    title: listing.title,
    description: listing.description,
    categoryId: listing.categoryId,
    category,
    authorId: listing.authorId,
    author,
    tier: listing.tier as ListingDTO['tier'],
    metadata,
    images,
    municipality: listing.municipality ?? undefined,
    location: listing.location ?? undefined,
    lat: listing.lat ?? undefined,
    lng: listing.lng ?? undefined,
    status: listing.status as ListingStatus,
    expiresAt: listing.expiresAt?.toISOString(),
    bumpedAt: listing.bumpedAt?.toISOString(),
    publishedAt: listing.publishedAt?.toISOString(),
    viewCount: listing.viewCount,
    contactCount: listing.contactCount,
    showPhone: listing.showPhone,
    showEmail: listing.showEmail,
    contactMethods: parseContactMethods(listing.contactMethod),
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
    price: (metadata.price as number) ?? undefined,
    condition: (metadata.condition as string) ?? undefined,
  };
}
