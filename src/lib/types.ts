// ═══════════════════════════════════════════════════════════════
// GRAN CANARIA CONECTA - Type Definitions
// Single source of truth for all TypeScript types
// ═══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────
// ENUMS (Application-level, mapped to Prisma strings)
// ─────────────────────────────────────────────────────────────

export type ListingTier = 'FREE' | 'HIGHLIGHTED' | 'VIP';
export type ListingStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'SOLD' | 'ARCHIVED';
export type EventCategory = 'WORKSHOP' | 'CLEANUP' | 'MARKET' | 'CONCERT' | 'SPORT' | 'COMMUNITY' | 'CULTURE' | 'OTHER';
export type EventStatus = 'UPCOMING' | 'ONGOING' | 'PAST' | 'CANCELLED';
export type ArticleCategory = 'ENVIRONMENT' | 'COMMUNITY' | 'BUSINESS' | 'SUSTAINABILITY' | 'TOURISM' | 'GENERAL';
export type PaymentType = 'LISTING_POST' | 'VIP_UPGRADE' | 'HIGHLIGHT_UPGRADE' | 'BUMP' | 'BUSINESS_PLAN';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'REFUNDED' | 'FAILED';
export type UserRole = 'MEMBER' | 'BUSINESS' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN';

/** Admin panel permissions by role */
export const ADMIN_ROLES: UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'];

export const ROLE_LABELS: Record<UserRole, { es: string; en: string; color: string; description: { es: string; en: string } }> = {
  MEMBER: {
    es: 'Miembro', en: 'Member', color: '#6b7280',
    description: { es: 'Usuario registrado', en: 'Registered user' },
  },
  BUSINESS: {
    es: 'Negocio', en: 'Business', color: '#9333ea',
    description: { es: 'Cuenta de negocio con directorio comercial', en: 'Business account with commercial directory' },
  },
  MODERATOR: {
    es: 'Moderador', en: 'Moderator', color: '#0891b2',
    description: { es: 'Modera anuncios y categorías', en: 'Moderates listings and categories' },
  },
  ADMIN: {
    es: 'Administrador', en: 'Administrator', color: '#059669',
    description: { es: 'Gestión completa del sitio', en: 'Full site management' },
  },
  SUPER_ADMIN: {
    es: 'Super Administrador', en: 'Super Administrator', color: '#dc2626',
    description: { es: 'Acceso total y gestión de roles', en: 'Total access and role management' },
  },
};

/** Which admin pages each role can access */
export type AdminPageKey = 'dashboard' | 'listings' | 'promotions' | 'users' | 'categories' | 'payments';

export const ROLE_PAGE_PERMISSIONS: Record<UserRole, AdminPageKey[]> = {
  MEMBER: [],
  BUSINESS: [],
  MODERATOR: ['dashboard', 'listings', 'users', 'categories'],
  ADMIN: ['dashboard', 'listings', 'promotions', 'users', 'categories', 'payments'],
  SUPER_ADMIN: ['dashboard', 'listings', 'promotions', 'users', 'categories', 'payments'],
};

export type Language = 'ES' | 'EN';
export type ContactMethod = 'message' | 'phone' | 'email' | 'whatsapp';
export type FacilityType = 'ecoparque' | 'container' | 'clean_point' | 'specialized';

// ─────────────────────────────────────────────────────────────
// MUNICIPALITIES OF GRAN CANARIA
// ─────────────────────────────────────────────────────────────

export const MUNICIPALITIES = [
  'Agüimes',
  'Agaete',
  'Aldea de San Nicolás',
  'Artenara',
  'Arucas',
  'Firgas',
  'Gáldar',
  'Ingenio',
  'La Aldea de San Nicolás',
  'Las Palmas de Gran Canaria',
  'Mogán',
  'Moya',
  'San Bartolomé de Tirajana',
  'Santa Brígida',
  'Santa Lucía de Tirajana',
  'Santa María de Guía de Gran Canaria',
  'Tejeda',
  'Telde',
  'Teror',
  'Valleseco',
  'Valsequillo de Gran Canaria',
  'Vega de San Mateo',
] as const;

export type Municipality = (typeof MUNICIPALITIES)[number];

// ─────────────────────────────────────────────────────────────
// RECYCLING TYPES
// ─────────────────────────────────────────────────────────────

export type RecyclingType =
  | 'plastico'
  | 'vidrio'
  | 'papel'
  | 'organico'
  | 'electronica'
  | 'textil'
  | 'baterias'
  | 'aceite'
  | 'medicamentos'
  | 'mobiliario'
  | 'neumaticos'
  | 'escombros';

export const RECYCLING_TYPES: Record<RecyclingType, { iconEs: string; iconEn: string; color: string }> = {
  plastico:     { iconEs: 'Plástico',        iconEn: 'Plastic',        color: '#FFD166' },
  vidrio:       { iconEs: 'Vidrio',          iconEn: 'Glass',         color: '#06D6A0' },
  papel:        { iconEs: 'Papel/Cartón',    iconEn: 'Paper/Cardboard',color: '#118AB2' },
  organico:     { iconEs: 'Orgánico',        iconEn: 'Organic',       color: '#8B6914' },
  electronica:  { iconEs: 'Electrónica',     iconEn: 'Electronics',   color: '#EF476F' },
  textil:       { iconEs: 'Textil',          iconEn: 'Textile',       color: '#9B5DE5' },
  baterias:     { iconEs: 'Baterías',        iconEn: 'Batteries',     color: '#00BBF9' },
  aceite:       { iconEs: 'Aceite',          iconEn: 'Oil',           color: '#8B4513' },
  medicamentos:{ iconEs: 'Medicamentos',     iconEn: 'Medicines',     color: '#E63946' },
  mobiliario:   { iconEs: 'Mobiliario',      iconEn: 'Furniture',     color: '#6B4226' },
  neumaticos:   { iconEs: 'Neumáticos',      iconEn: 'Tires',         color: '#2D2D2D' },
  escombros:    { iconEs: 'Escombros',       iconEn: 'Debris',        color: '#888888' },
};

// ─────────────────────────────────────────────────────────────
// DYNAMIC FIELD TYPES (for category.allowedFields)
// ─────────────────────────────────────────────────────────────

export type DynamicFieldType = 'text' | 'number' | 'select' | 'multiselect' | 'boolean' | 'date' | 'url' | 'email';

export interface DynamicField {
  key: string;
  type: DynamicFieldType;
  labelEs: string;
  labelEn: string;
  placeholderEs?: string;
  placeholderEn?: string;
  required?: boolean;
  options?: string[];          // For select/multiselect
  min?: number;                // For number
  max?: number;                // For number
  step?: number;               // For number
  pattern?: string;            // For text (regex)
}

// ─────────────────────────────────────────────────────────────
// DATA TRANSFER OBJECTS (API shapes)
// ─────────────────────────────────────────────────────────────

export interface CategoryDTO {
  id: string;
  slug: string;
  nameEs: string;
  nameEn: string;
  descEs?: string;
  descEn?: string;
  icon: string;
  color: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
  isPaid: boolean;
  price?: number;
  highlightPrice?: number;
  vipPrice?: number;
  allowedFields: DynamicField[];
  showPrice: boolean;
  showLocation: boolean;
  showImages: boolean;
  maxImages: number;
  expiryDays: number;
  children?: CategoryDTO[];
  listingCount?: number;
}

export interface ListingDTO {
  id: string;
  slug: string;
  title: string;
  description: string;
  categoryId: string;
  category: CategoryDTO;
  authorId: string;
  author: UserSummaryDTO;
  tier: ListingTier;
  metadata: Record<string, unknown>;
  images: string[];
  municipality?: string;
  location?: string;
  lat?: number;
  lng?: number;
  status: ListingStatus;
  expiresAt?: string;
  bumpedAt?: string;
  publishedAt?: string;
  viewCount: number;
  contactCount: number;
  showPhone: boolean;
  showEmail: boolean;
  contactMethod: ContactMethod;
  createdAt: string;
  updatedAt: string;
  // Computed
  price?: number;
  condition?: string;
}

export interface ListingCreateDTO {
  title: string;
  description: string;
  categoryId: string;
  tier: ListingTier;
  metadata: Record<string, unknown>;
  images: string[];
  municipality?: string;
  location?: string;
  lat?: number;
  lng?: number;
  showPhone: boolean;
  showEmail: boolean;
  contactMethod: ContactMethod;
}

export interface EventDTO {
  id: string;
  slug: string;
  title: string;
  description: string;
  authorId: string;
  author: UserSummaryDTO;
  startDate: string;
  endDate?: string;
  allDay: boolean;
  recurring?: Record<string, unknown>;
  location: string;
  municipality: string;
  lat?: number;
  lng?: number;
  image?: string;
  category: EventCategory;
  isFree: boolean;
  price?: number;
  ticketUrl?: string;
  capacity?: number;
  organizer?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  isEco: boolean;
  ecoTags: string[];
  status: EventStatus;
  viewCount: number;
  createdAt: string;
}

export interface ArticleDTO {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt?: string;
  authorId: string;
  author: UserSummaryDTO;
  category: ArticleCategory;
  image?: string;
  tags: string[];
  isPublished: boolean;
  publishedAt?: string;
  viewCount: number;
  createdAt: string;
}

export interface RecyclingPointDTO {
  id: string;
  name: string;
  description?: string;
  address: string;
  municipality: string;
  lat?: number;
  lng?: number;
  types: RecyclingType[];
  schedule?: Record<string, string>;
  phone?: string;
  website?: string;
  email?: string;
  facilityType: FacilityType;
  isActive: boolean;
}

export interface UserSummaryDTO {
  id: string;
  name: string;
  avatar?: string;
  municipality?: string;
  isVerified: boolean;
  role: UserRole;
  businessName?: string;
}

export interface CommunityStatDTO {
  id: string;
  statKey: string;
  statValue: number;
  statLabel?: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// PRICING PLANS
// ─────────────────────────────────────────────────────────────

export interface PricingPlan {
  id: ListingTier;
  nameEs: string;
  nameEn: string;
  price: number;
  featuresEs: string[];
  featuresEn: string[];
  color: string;
  badge: string;
  durationDays: number;
  isPopular?: boolean;
  maxImages: number;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'FREE',
    nameEs: 'Gratuito',
    nameEn: 'Free',
    price: 0,
    featuresEs: [
      'Anuncio activo 30 días',
      'Hasta 3 fotos',
      'Aparición en listado general',
      'Búsqueda por categoría y municipio',
    ],
    featuresEn: [
      'Active listing for 30 days',
      'Up to 3 photos',
      'Appears in general listing',
      'Search by category and municipality',
    ],
    color: '#6B7280',
    badge: 'GRATIS',
    durationDays: 30,
    maxImages: 3,
  },
  {
    id: 'HIGHLIGHTED',
    nameEs: 'Destacado',
    nameEn: 'Highlighted',
    price: 5,
    featuresEs: [
      'Todo lo gratuito, más:',
      'Fondo amarillo destacado',
      '60 días de vigencia',
      'Hasta 7 fotos',
      'Aparece primero en resultados',
    ],
    featuresEn: [
      'Everything in Free, plus:',
      'Highlighted yellow background',
      '60 days duration',
      'Up to 7 photos',
      'Appears first in results',
    ],
    color: '#F59E0B',
    badge: 'DESTACADO',
    durationDays: 60,
    maxImages: 7,
  },
  {
    id: 'VIP',
    nameEs: 'VIP',
    nameEn: 'VIP',
    price: 15,
    featuresEs: [
      'Todo lo destacado, más:',
      'Badge VIP naranja',
      'Slider en la página principal',
      '90 días de vigencia',
      'Hasta 10 fotos',
      'Estadísticas de vistas',
      'Soporte prioritario',
    ],
    featuresEn: [
      'Everything in Highlighted, plus:',
      'VIP orange badge',
      'Homepage slider',
      '90 days duration',
      'Up to 10 photos',
      'View statistics',
      'Priority support',
    ],
    color: '#EA580C',
    badge: 'VIP',
    durationDays: 90,
    maxImages: 10,
    isPopular: true,
  },
];

// ─────────────────────────────────────────────────────────────
// FILTERS & PAGINATION
// ─────────────────────────────────────────────────────────────

export interface ListingFilters {
  categoryId?: string;
  municipality?: string;
  tier?: ListingTier;
  status?: ListingStatus;
  search?: string;
  authorId?: string;
  isPaid?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'popular';
  page?: number;
  limit?: number;
}

export interface EventFilters {
  category?: EventCategory;
  municipality?: string;
  isFree?: boolean;
  isEco?: boolean;
  startDate?: string;
  endDate?: string;
  status?: EventStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─────────────────────────────────────────────────────────────
// i18n
// ─────────────────────────────────────────────────────────────

export type Locale = 'es' | 'en';

export interface TranslationString {
  es: string;
  en: string;
}
