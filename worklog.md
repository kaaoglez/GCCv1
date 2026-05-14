# Gran Canaria Conecta - Worklog

## Phase 8: Color Contrast Fixes

**Date**: Session 8
**Description**: Fixed all color contrast issues across the site. Text was invisible in cards and sidebar sections due to low-contrast muted-foreground colors and excessive opacity reductions.

### Files Modified

#### 1. `/src/app/globals.css`
- Light mode `muted`: `#D8F3DC` → `#e8f5e9` (lighter tint so text pops more against it)
- Light mode `muted-foreground`: `#4a6a4a` → `#3a5a3a` (darker green for better contrast on white/light cards)
- Dark mode `muted-foreground`: `#7aad8a` → `#8ec9a0` (brighter green for better readability on dark backgrounds)

#### 2. `/src/components/shared/StatCard.tsx`
- Added `variant?: 'default' | 'light'` prop
- When `variant="light"`: uses `bg-white/10 border-white/15`, white number text, `text-white/80` label, `bg-white/15 text-white` icon
- Clean declarative approach replacing fragile CSS selector overrides

#### 3. `/src/components/home/CommunityStats.tsx`
- Removed all fragile `[&>div]:...` and `[&_span]:...` CSS selector overrides
- Replaced with clean `variant="light"` prop on StatCard
- Subtitle: `text-primary-foreground/70` → `/90`
- No-results text: `text-primary-foreground/60` → `/80`

#### 4. Opacity Fixes Across Components
| File | Change |
|------|--------|
| `ArticleCard.tsx` | `text-muted-foreground/70` → `text-muted-foreground` |
| `RecyclingCard.tsx` | `text-muted-foreground/60` → `text-muted-foreground/80` |
| `CategoryGrid.tsx` | `text-muted-foreground/70` → `text-muted-foreground` |
| `EventCard.tsx` | `opacity-80` → `opacity-90`, `text-muted-foreground/60` → `/80` |
| `PricingSection.tsx` | `text-primary-foreground/80` → `/90` |
| `BusinessDirectory.tsx` | `text-primary-foreground/80` → `/90` |
| `PostAdModal.tsx` | `text-muted-foreground/70` → `text-muted-foreground` |
| `Footer.tsx` | Nav links `/70` → `/80`, newsletter `/70` → `/80`, copyright `/60` → `/80` |
| `AdminLayout.tsx` | Subtitle `/60` → `/80`, nav items `/70` → `/80` |

### Build Status
- Dev server compiles successfully (`✓ Compiled`)
- No new lint errors introduced
- All pre-existing lint errors remain unchanged (setup.js require imports, Navbar setMounted pattern)

---

## Phase 1: API Routes Implementation

**Date**: Session 1  
**Description**: Created all backend API routes for the community portal.

### Files Created

#### 1. `/src/app/api/categories/route.ts`
- **GET** `/api/categories?locale=es|en`
- Returns all active categories with parent-child hierarchy
- Includes listing counts (aggregated from children)
- Accepts `locale` query param to support ES/EN (DTO always includes both languages)
- Nested children are included recursively
- Categories ordered by `sortOrder`

#### 2. `/src/app/api/listings/route.ts`
- **GET** `/api/listings?categoryId=&municipality=&tier=&search=&page=&limit=&sortBy=`
  - Paginated response with `PaginatedResponse<ListingDTO>` shape
  - Filters: categoryId (includes children), municipality, tier, search (title/description)
  - Sorting: newest, oldest, popular, price_asc, price_desc
  - Includes full category and author (UserSummaryDTO) info
  - Parses JSON metadata/images and extracts computed `price` and `condition`
  - Only returns ACTIVE listings
- **POST** `/api/listings`
  - Accepts `ListingCreateDTO` body
  - Validates required fields (title, description, categoryId)
  - Verifies category exists and is active
  - Auto-generates unique slug from title
  - Calculates expiry date from category's `expiryDays`
  - Defaults to ACTIVE status with current publish date
  - Exports shared `mapListingToDTO()` for reuse

#### 3. `/src/app/api/listings/[id]/route.ts`
- **GET** `/api/listings/:id`
- Returns single listing with full details
- Auto-increments `viewCount` on each fetch
- Returns 404 if listing not found

#### 4. `/src/app/api/listings/featured/route.ts`
- **GET** `/api/listings/featured`
- Returns up to 10 featured listings (tier !== 'FREE')
- Ordered by `bumpedAt` desc (nulls last), then `createdAt` desc
- Only ACTIVE listings

#### 5. `/src/app/api/events/route.ts`
- **GET** `/api/events?category=&municipality=&isFree=&isEco=&status=&search=&page=&limit=`
  - Paginated response with `PaginatedResponse<EventDTO>` shape
  - Filters: EventCategory, municipality, isFree (boolean), isEco (boolean), status, search
  - **Default status: UPCOMING** when no status specified
  - Ordered by startDate ascending
  - Parses JSON `recurring` and `ecoTags` fields

#### 6. `/src/app/api/articles/route.ts`
- **GET** `/api/articles?category=&search=&page=&limit=`
  - Paginated response with `PaginatedResponse<ArticleDTO>` shape
  - Only published articles (`isPublished: true`)
  - Filters: ArticleCategory, search (title/content/excerpt)
  - Ordered by publishedAt desc

#### 7. `/src/app/api/recycling/route.ts`
- **GET** `/api/recycling?municipality=&type=&facilityType=`
  - Only active recycling points
  - Filters: municipality, RecyclingType (in-memory JSON filter), FacilityType
  - Ordered by municipality then name
  - Parses JSON `types` and `schedule` fields

#### 8. `/src/app/api/stats/route.ts`
- **GET** `/api/stats`
- Returns all community stats
- Ordered by statKey ascending

### Architecture Notes
- All routes use `db` from `@/lib/db` (Prisma singleton)
- All DTOs match types defined in `@/lib/types.ts`
- Consistent error handling with try/catch and proper HTTP status codes
- JSON fields (metadata, images, ecoTags, types, schedule, recurring, allowedFields) are safely parsed with fallbacks
- Shared `mapListingToDTO` function exported from listings/route.ts for reuse by [id] and featured routes
- Pagination defaults: page=1, limit=12, max limit=50

---

## Phase 2: Shared Reusable Components

**Date**: Session 2  
**Description**: Created utility helpers and 9 shared reusable components for the community portal UI.

### Utility Files Created

#### `/src/lib/icons.ts`
- `getIcon(name, className?, size?)` — Dynamic Lucide icon renderer by string name
- Falls back to `Circle` icon if name not found
- Used across all badge and card components

#### `/src/lib/format.ts`
- `formatDate(date, locale)` — Full date display (e.g., "12 de enero de 2025")
- `formatCalendarDate(date, locale)` — Calendar-style: `{ day, month, weekday }`
- `formatNumber(num, locale)` — Locale-aware number formatting (es-ES / en-US)
- `formatPrice(price, locale)` — Euro currency formatting (0 decimals)
- `getRelativeTime(date, locale)` — Relative time strings ("hace 3 horas" / "3 hours ago") using date-fns
- `truncateText(text, maxLength)` — Truncate with ellipsis
- `formatTime(date, locale)` — HH:mm time format
- Uses `date-fns` with `es` and `enUS` locales

### Shared Components Created

#### 1. `/src/components/shared/TierBadge.tsx`
- Renders listing tier badge using PRICING_PLANS colors from `types.ts`
- FREE → gray "GRATIS"/"FREE"
- HIGHLIGHTED → amber "DESTACADO"/"HIGHLIGHTED"
- VIP → orange with sparkle icon "VIP"
- BUSINESS → purple with star icon "NEGOCIO"/"BUSINESS"
- Uses shadcn/ui `Badge` with inline color styles
- Locale-aware labels via `useI18n`

#### 2. `/src/components/shared/CategoryBadge.tsx`
- Small badge with Lucide icon + translated category name
- Props: `category (CategoryDTO)`, `size: 'sm' | 'md'`, `className`
- Background uses `category.color` with opacity (`#color18`)
- Uses `getIcon()` for dynamic icon rendering

#### 3. `/src/components/shared/ListingCard.tsx`
- Main reusable card for listings
- Image with fallback (ImageOff icon)
- TierBadge overlay (top-left), price overlay (bottom-right)
- CategoryBadge, truncated title (60 chars)
- Municipality with MapPin icon, author name + ShieldCheck verified badge
- Relative time display
- VIP/BUSINESS → golden/purple left border (4px)
- HIGHLIGHTED → subtle amber background
- Hover: `scale(1.02)` + `y(-4)` + shadow via framer-motion

#### 4. `/src/components/shared/EventCard.tsx`
- Calendar-style date block (big day number + abbreviated month) in primary color
- Image with fallback, category badge, "Gratis" green badge, "Eco" leaf badge
- Location with municipality, time display (or "Todo el día"/"All day")
- Hover animation via framer-motion

#### 5. `/src/components/shared/ArticleCard.tsx`
- Image with category badge overlay (color-coded: ENVIRONMENT=green, BUSINESS=purple, etc.)
- Title (line-clamp-2), excerpt (truncated 120 chars, strips HTML)
- Author + relative time
- Hover animation via framer-motion

#### 6. `/src/components/shared/RecyclingCard.tsx`
- Facility type icon (Recycle/Trash2/Droplets/Factory) in emerald circle
- Name + facility type badge (ecoparque/container/clean_point/specialized)
- Address, municipality
- Recycling type badges (colored pills using RECYCLING_TYPES constants)
- Schedule info (shows up to 3 days, "+ más días" for overflow)
- Hover animation via framer-motion

#### 7. `/src/components/shared/SectionContainer.tsx`
- Page section wrapper with consistent max-width and padding
- Props: `title (TranslationString)`, `subtitle?`, `action?: {label, href}`, `children`, `hideOnMobile?`
- Translated h2 title, optional subtitle, optional "View all" link with arrow
- Responsive padding: `px-4 sm:px-6 lg:px-8 py-8 md:py-12`

#### 8. `/src/components/shared/StatCard.tsx`
- Centered card with icon in primary-colored circle
- Animated number counter on scroll into view (ease-out cubic, 1.5s)
- Uses `framer-motion` `useInView` for trigger
- Format numbers with locale-aware separators
- Fade-in + slide-up entrance animation

#### 9. `/src/components/shared/EmptyState.tsx`
- Centered layout with muted icon circle
- Title, optional description, optional action button
- Uses shadcn/ui `Button` for action
- Max-width constraint (`max-w-md`)

### Lint Results
- All 11 new files pass ESLint with zero errors
- Pre-existing errors in `Navbar.tsx` (React refs during render) are unrelated

---

## Phase 3: Theme, Layout & Navigation

**Date**: Session 3
**Description**: Built the visual foundation — eco-friendly theme, root layout, responsive navbar, footer, and utility libraries.

### Files Modified

#### 1. `/src/hooks/use-i18n.ts`
- **Bug fix**: Changed import from `@/lib/constants` → `@/lib/translations`
- The hook was importing from the wrong module; `translations` and `TranslationSection` are defined in `translations.ts`

#### 2. `/src/app/globals.css`
- Complete rewrite with eco-friendly green theme
- **Light mode palette**:
  - Primary: `#1B4332` (deep green), Secondary: `#52B788` (sage green), Accent: `DDA15E` (warm earth)
  - Background: `#FAFAF7` (warm white), Card: `#ffffff`, Muted: `#D8F3DC` (soft sage)
- **Dark mode palette**:
  - Primary: `#95D5B2` (bright green), Secondary: `#2D6A4F`
  - Background: `#0A1A0F` (very dark green), Card: `#132A1A`, Muted: `#1B3A25`
- Custom scrollbar styling (webkit)
- All Tailwind v4 `@theme inline` variables preserved and mapped to new colors
- No blue or indigo anywhere

#### 3. `/src/app/layout.tsx`
- Fonts: `Inter` (body, `--font-inter`) and `Poppins` (headings, `--font-poppins`) via `next/font/google`
- Metadata: Updated to Gran Canaria Conecta with Spanish/English descriptions, Open Graph, Twitter cards
- `lang="es"` on `<html>` tag
- `ThemeProvider` from `next-themes` wrapping children (attribute="class", defaultTheme="light", enableSystem)
- `disableTransitionOnChange` to prevent flash on theme switch
- `Toaster` preserved inside ThemeProvider

#### 4. `/src/components/layout/Navbar.tsx` (NEW)
- **Logo**: Leaf icon in green square + "Gran Canaria Conecta" text (Poppins font)
- **Desktop nav links**: 6 items from `NAV_ITEMS` constant, translated via `useI18n`
- **Right side actions**:
  - Language toggle (Globe icon, shows next locale "EN"/"ES")
  - Theme toggle (Sun/Moon) via `next-themes` — separate `ThemeToggle` sub-component to avoid hydration mismatch
  - Login button (ghost variant)
  - "Publicar anuncio" CTA button (primary, Plus icon)
- **Mobile**: Hamburger menu opens `Sheet` (right side, 320px)
  - Animated nav links with staggered `framer-motion` entrance
  - Login link + CTA button at bottom
- **Sticky header**: `backdrop-blur-lg` + border + shadow on scroll (`scrollY > 10`)
- Responsive: `lg:` breakpoint for desktop/mobile switch

#### 5. `/src/components/layout/Footer.tsx` (NEW)
- **4-column grid** (responsive: 1 → 2 → 4 cols)
  - **Col 1 (About)**: Logo, tagline, social icons (Instagram, Facebook, Twitter, WhatsApp)
  - **Col 2 (Resources)**: Links from `FOOTER_LINKS.resources`, translated
  - **Col 3 (Legal)**: Links from `FOOTER_LINKS.legal`, translated
  - **Col 4 (Newsletter)**: Email input + subscribe button (accent-colored)
- Social icons as circular buttons with hover effects
- **Bottom bar**: Copyright + "Hecho con ❤️ en Gran Canaria"
- Dark green background (`bg-primary`) with lighter text
- `mt-auto` for sticky footer behavior

#### 6. `/src/lib/format.ts` (REWRITTEN)
- `formatDate(date, locale)` — "15 de enero de 2025"
- `formatCalendarDate(date, locale)` — `{ day, month, weekday }` for calendar cards
- `formatTime(date, locale)` — HH:mm locale-aware
- `formatNumber(num, locale)` — "1.234" (es) / "1,234" (en)
- `formatPrice(price, locale)` — "2.500 €" / "€2,500", "Gratis"/"Free" for null/0
- `getRelativeTime(date, locale)` — "hace 3 días" / "3 days ago"
- `truncateText(text, maxLength)` — truncate with "..."
- Compatible with all existing shared components (EventCard, ListingCard, ArticleCard, StatCard)

#### 7. `/src/lib/icons.tsx` (REWRITTEN, renamed from .ts → .tsx)
- `getIcon(name, className?, size?)` — Returns JSX `<IconComponent>` directly
- Registry of 30+ Lucide icons mapped by kebab-case string names
- Fallback to `Circle` for unknown names
- Additional icons added: Circle, Sparkles, Star, MapPin, Clock, ShieldCheck, ImageOff, Trash2, Droplets, Factory
- Compatible with all existing shared components (CategoryBadge, StatCard, EmptyState, ListingCard)

#### 8. `/src/app/page.tsx` (UPDATED)
- Replaced scaffold placeholder with full-page layout
- `min-h-screen flex flex-col` wrapper for sticky footer
- `<Navbar />` at top, `<main className="flex-1">` with hero placeholder, `<Footer />` at bottom
- Hero placeholder shows app name, tagline, and leaf icon

### Architecture Notes
- React 19 strict mode compliance: No `setState` in effects, no ref access during render
- Theme toggle extracted to separate `ThemeToggle` component with `suppressHydrationWarning`
- Scroll detection uses proper `useEffect` with event listener subscription
- Mobile menu close handled via `useCallback` + `Sheet` controlled `open` prop
- All components use `'use client'` directive where needed
- ESLint passes with zero errors

---

## Phase 4: Homepage Sections

**Date**: Session 4
**Description**: Built all 9 homepage section components and assembled the full landing page with data fetching, loading states, scroll animations, and responsive layouts.

### Files Created

#### 1. `/src/components/home/HeroSection.tsx`
- Full-width hero with Unsplash Gran Canaria landscape background image
- Dark gradient overlay (left-to-right + bottom-to-top) for text readability
- Animated title, subtitle, search bar, and CTA buttons (framer-motion staggered fade-in)
- Search bar: `Input` + `Select` (categories fetched from `/api/categories`) + `Button`
- Two CTA buttons: "Publicar anuncio" (emerald-600) + "Explorar categorías" (glass outline)
- `useSyncExternalStore` for SSR-safe client detection (avoids `setState`-in-effect lint error)
- Responsive: text centered on mobile, left-aligned on desktop (`lg:text-left`)

#### 2. `/src/components/home/FeaturedSlider.tsx`
- Horizontal scrollable carousel of VIP/BUSINESS tier listings
- Fetches from `/api/listings/featured` (max 8 items)
- CSS scroll-snap for smooth snapping between cards
- Left/right scroll buttons (ChevronLeft/ChevronRight) with hover visibility
- Custom scrollbar hidden (`scrollbarWidth: none`, `msOverflowStyle: none`)
- Uses `ListingCard` component, wrapped in `SectionContainer`
- Loading state: 4 `Skeleton` placeholders; Empty state: `EmptyState` with Sparkles icon

#### 3. `/src/components/home/CategoryGrid.tsx`
- Grid of top-level parent categories (no `parentId`)
- Fetches from `/api/categories` and filters to parents
- Each card: icon in colored circle, translated name, description (line-clamp-2), listing count
- "Premium" badge (amber) shown for paid categories (`isPaid`)
- Hover: `scale(1.03)` + `y(-4)` via framer-motion
- Grid: 2 cols mobile, 3 tablet, 4-5 desktop
- Staggered entrance animation per card

#### 4. `/src/components/home/LatestListings.tsx`
- Grid of latest active listings (FREE + HIGHLIGHTED tiers only)
- Fetches from `/api/listings?limit=12&sortBy=newest`, filters out VIP/BUSINESS to avoid duplicates with FeaturedSlider
- Uses `ListingCard` component with staggered `whileInView` entrance
- Grid: 1 col mobile, 2 tablet, 3-4 desktop
- Loading: 8 skeleton cards; Empty: `EmptyState` with file-text icon

#### 5. `/src/components/home/EventsSection.tsx`
- Grid of upcoming events (status=UPCOMING by default)
- Fetches from `/api/events?limit=6`
- Uses `EventCard` component with calendar-style date display
- Grid: 1 col mobile, 2 tablet, 3 desktop
- Loading: 6 skeleton cards; Empty: `EmptyState` with calendar icon

#### 6. `/src/components/home/NewsSection.tsx`
- Grid of latest published articles
- Fetches from `/api/articles?limit=4`
- Uses `ArticleCard` component with category badge overlay
- Grid: 1 col mobile, 2 tablet/desktop
- Loading: 4 skeleton cards; Empty: `EmptyState` with file-text icon

#### 7. `/src/components/home/BusinessDirectory.tsx`
- Grid of BUSINESS tier listings only
- Fetches from `/api/listings?tier=BUSINESS&limit=6`
- Uses `ListingCard` component
- Promotional CTA banner at bottom: gradient background (primary → secondary) with "Promociona tu negocio" text, Sparkles icon, and "Comienza ahora" accent button
- Decorative background circles for visual depth
- Grid: 1 col mobile, 2-3 desktop

#### 8. `/src/components/home/RecyclingSection.tsx`
- Grid of recycling points (max 6 displayed)
- Fetches from `/api/recycling`
- Uses `RecyclingCard` component with facility type icon, recycling type pills, schedule
- Grid: 1 col mobile, 2-3 desktop
- Loading: 6 skeleton cards; Empty: `EmptyState` with recycle icon

#### 9. `/src/components/home/CommunityStats.tsx`
- Community impact statistics with green gradient background (`from-primary via-primary/95 to-secondary`)
- Radial gradient overlay for visual depth
- Fetches from `/api/stats`
- Maps `statKey` → icon + translated label using `statConfig` lookup
- Uses `StatCard` component with animated number counters
- Custom styling overrides for light text on dark background
- Grid: 2 cols mobile, 3 tablet, 6 desktop

### Files Modified

#### `/src/app/page.tsx` (REWRITTEN)
- Imports and renders all 9 homepage sections in order:
  1. HeroSection
  2. FeaturedSlider
  3. CategoryGrid (inside `bg-muted/30` wrapper)
  4. LatestListings
  5. EventsSection (inside `bg-muted/30` wrapper)
  6. BusinessDirectory
  7. NewsSection (inside `bg-muted/30` wrapper)
  8. RecyclingSection
  9. CommunityStats
- Sections alternate between plain and muted backgrounds for visual rhythm
- `min-h-screen flex flex-col` layout with `Navbar`, `flex-1` main, `Footer`

### Architecture Notes
- All 9 components are `'use client'` with `useEffect`-based data fetching
- Loading states use shadcn/ui `Skeleton` components
- Empty states use shared `EmptyState` component
- Scroll-triggered animations via framer-motion `whileInView` with `once: true`
- All API fetches use relative paths (no localhost, no ports)
- All text is internationalized via `useI18n` hook (`tp()` for translated strings)
- No blue/indigo colors used — follows eco-friendly green theme
- Mobile-first responsive design throughout
- ESLint passes with zero errors

---

## Phase 4.5: PricingSection Component

**Date**: Session 5
**Description**: Created a professional PricingSection component displaying the 4 pricing plans as a comparison on the homepage, serving as a key promotional tool for driving paid ad conversions.

### Files Created

#### `/src/components/home/PricingSection.tsx`
- Displays all 4 pricing plans (Free, Highlighted, VIP, Business) from `PRICING_PLANS` in `types.ts`
- Uses shadcn/ui `Card`, `Button`, `Badge` components
- Uses `framer-motion` for staggered entrance animations (`whileInView` with `once: true`)
- **VIP card elevation**: `isPopular` flag causes the card to scale up (`xl:scale-105`), receive a colored ring border, and display a floating "Más popular" badge with Sparkles icon at the top
- **Plan-specific icons**: FREE → Check, HIGHLIGHTED → Zap, VIP → Star, BUSINESS → Store
- **Plan color accents**: Each card uses its `plan.color` for icon circle backgrounds, price text, feature checkmarks, dividers, and CTA button styling
- **Pricing display**: Business plan shows "€25/mes", others show "€5/anuncio" or "Gratuito" for Free
- **Feature list**: Translated via locale (uses `featuresEs`/`featuresEn` from plan data), each with a colored check icon
- **CTA button**: Popular plan uses `variant="default"` with plan-colored background; others use `variant="outline"` with colored border and hover fill
- **Responsive grid**: 1 col mobile, 2 cols tablet (`md:grid-cols-2`), 4 cols desktop (`xl:grid-cols-4`)
- **Business promo banner**: Gradient background (primary → secondary) with Store icon, promotional text, and accent-colored CTA button — mirrors the design pattern from BusinessDirectory
- **Internationalization**: All text via `useI18n` hook (`tp()`); supports ES/EN locales
- Wrapped in `SectionContainer` with title and subtitle

### Files Modified

#### `/src/app/page.tsx`
- Added `PricingSection` import
- Inserted PricingSection as section #7, between BusinessDirectory and NewsSection
- Placed inside `bg-muted/30` wrapper for visual rhythm alternation
- Updated section numbering comments (7→10)

### Architecture Notes
- No new translation keys needed — all existing `pricing.*` keys in `translations.ts` were sufficient
- Component follows the same patterns as other homepage sections: `'use client'`, framer-motion animations, shadcn/ui components, `useI18n` hook
- ESLint passes with zero errors

---

## Phase 5-6: PostAdModal & ListingDetailModal

**Date**: Session 6
**Description**: Created two key modal components for the promotional paid ads flow — a multi-step PostAdModal for creating listings, and a ListingDetailModal for viewing listing details with upgrade prompts. Integrated both into the homepage via a global modal store.

### Files Created

#### 1. `/src/lib/modal-store.ts` (NEW)
- Lightweight Zustand store for global modal state management
- Manages PostAdModal state: `postAdOpen`, `openPostAd()`, `closePostAd()`
- Manages ListingDetailModal state: `selectedListing`, `listingDetailOpen`, `openListingDetail(listing)`, `closeListingDetail()`
- Avoids prop drilling for deeply nested components (HeroSection, ListingCard)

#### 2. `/src/components/modals/PostAdModal.tsx` (NEW)
- Multi-step modal (4 steps) for creating new listings
- **Step 1 — Select Category**: Grid of categories fetched from `/api/categories`, with icons, translated names, and "Premium" badges for paid categories. Shows info note about free/paid status.
- **Step 2 — Select Tier**: Displays PRICING_PLANS in a card grid. Auto-selects HIGHLIGHTED (minimum paid) if category `isPaid`. VIP plan shows "Más popular" floating badge. Price displayed prominently with Euro icon.
- **Step 3 — Fill Details**: Form with title (required), description (required), price (conditional on `category.showPrice`), municipality select from `MUNICIPALITIES`, contact method (4 options), and image upload with drag/drop zone.
- **Step 4 — Review & Publish**: Full preview card showing image, badges, title, description, price, municipality, contact method. Publish button submits to `POST /api/listings`.
- **Step indicator**: Clickable pill-style steps at top with completed/active/pending states
- **framer-motion**: Slide transitions between steps with `AnimatePresence`
- **Auto-select logic**: If category `isPaid`, automatically selects HIGHLIGHTED tier in step 2

#### 3. `/src/components/modals/ListingDetailModal.tsx` (NEW)
- Full listing detail view modal triggered by clicking any ListingCard
- **Image gallery**: Full aspect-ratio main image with left/right navigation arrows, image counter badge
- **Listing header**: Title, price badge, TierBadge + CategoryBadge overlay
- **Meta row**: Municipality (MapPin), relative time (Clock), view count (Eye)
- **Description**: Full text with `whitespace-pre-wrap`
- **Author section**: Avatar, name with ShieldCheck badge, business name
- **Upgrade Prompt**: Orange gradient card for FREE/HIGHLIGHTED listings with VIP benefit list and CTA
- **Bump section**: "Republicar anuncio" button (€3)
- **Contact buttons**: Message, Phone, Email, WhatsApp (based on listing config)
- **Share button**: Web Share API with clipboard fallback

#### 4. `/src/components/modals/HomeModals.tsx` (NEW)
- Client component that renders both PostAdModal and ListingDetailModal globally
- Placed in page.tsx after Footer

### Files Modified

#### 1. `/src/lib/translations.ts`
- Added new `modal` translation section with 30+ keys

#### 2. `/src/components/home/HeroSection.tsx`
- Wired "Publicar anuncio" CTA button to `openPostAd()` via modal store

#### 3. `/src/components/shared/ListingCard.tsx`
- Added optional `onClick` prop for backward compatibility
- Opens ListingDetailModal on click by default

#### 4. `/src/app/page.tsx`
- Added `<HomeModals />` after Footer for global modal access

### Architecture Notes
- Modal state managed via Zustand store to avoid prop drilling
- PostAdModal fetches categories from API on open
- ListingDetailModal reads from store
- Step transitions use framer-motion AnimatePresence
- ListingCard backward-compatible with existing usage

---

## Phase 7: Database Seeding & Production Launch

**Date**: Session 7
**Description**: Pushed Prisma schema to SQLite, seeded the database with realistic demo data (28 categories, 10 users, 16 listings across all tiers, 6 events, 4 articles, 6 recycling points, 6 community stats), and verified the full application works end-to-end.

### Actions Performed
1. `bun run db:push` — Schema already in sync, Prisma Client regenerated
2. `bun run prisma/seed.ts` — Successfully seeded:
   - 28 categories (6 root + 22 children) with isPaid flags, allowedFields, colors, icons
   - 10 users (1 admin, 3 business, 6 members) with avatars and municipalities
   - 16 listings across all tiers (FREE, HIGHLIGHTED, VIP, BUSINESS) with bilingual titles, Unsplash images, metadata, view counts
   - 6 events (cleanups, workshops, markets, concerts, sports, repair workshops) with eco tags
   - 4 articles (environment, sustainability, recycling guide, business spotlight) with markdown content
   - 6 recycling points (ecoparques, clean points, containers, specialized) with schedules
   - 6 community stats (2847 listings, 1523 users, 48520 kg recycled, 12600 kg CO₂ saved, 34 events/month, 287 businesses)
3. Dev server started — `GET / 200` in 2.4s
4. All API routes verified returning 200:
   - `/api/categories?locale=es` — 6 root categories with children
   - `/api/listings?tier=BUSINESS&limit=6` — Business listings
   - `/api/listings?limit=12&sortBy=newest` — Latest listings
   - `/api/listings/featured` — VIP/Highlighted listings
   - `/api/articles?limit=4` — Published articles
   - `/api/events?limit=6` — Upcoming events
   - `/api/recycling` — Recycling points
   - `/api/stats` — Community statistics

### Project Status: FULLY OPERATIONAL
The Gran Canaria Conecta portal is now running with real data across all sections of the homepage.

---

## Phase 9: Admin Panel Dark Mode Contrast Fix (DEFINITIVE)

**Date**: Session 9 (continued)
**Description**: Fixed the admin panel contrast issue where all text was invisible due to dark mode theme. Previous attempts (CSS variable overrides, inline styles, `.admin-light-mode` class) all failed because Tailwind CSS 4's `@custom-variant dark (&:is(.dark *))` makes ALL descendants of `<html class="dark">` match dark mode styles, and CSS variable overrides have equal specificity to `.dark` class definitions.

### Root Cause
- `next-themes` ThemeProvider with `attribute="class"` sets `class="dark"` on `<html>` element
- Tailwind CSS 4's `@custom-variant dark (&:is(.dark *))` generates selectors like `.dark *` for dark: prefixed classes
- These match ALL elements inside `.dark`, even those inside `.admin-light-mode` wrapper
- shadcn/ui components (Button, Input, Dialog) use `dark:` variants that still apply
- CSS variable overrides in `.admin-light-mode` were being overridden by later-compiled Tailwind output

### Solution: Remove `dark` class from `<html>` via JavaScript
Instead of fighting CSS specificity, use `useEffect` to literally remove the `dark` class from `<html>` when admin panel is visible. This guarantees NO `dark:` variant will match at all within the admin panel.

### Files Modified

#### 1. `/src/components/admin/AdminGate.tsx`
- Added `useEffect` that removes `class="dark"` from `document.documentElement` when admin panel is shown
- Saves previous dark state in `useRef` for cleanup
- Cleanup function restores `dark` class when admin panel is unmounted
- Removed `admin-light-mode` class (no longer needed)
- Kept inline `backgroundColor` for immediate render

#### 2. `/src/components/admin/AdminLayout.tsx`
- Removed unused `ADMIN_CSS_OVERRIDES` constant
- Removed `admin-light-mode` class from root div (no longer needed)
- All existing inline styles preserved (sidebar, header, main content)
- Clean, minimal implementation

### Why This Works
- Removing `dark` from `<html>` means `&:is(.dark *)` no longer matches any element
- All Tailwind `dark:` prefixed classes become inert
- shadcn/ui components (Button outline `dark:bg-input/30`, Input `dark:bg-input/30`, etc.) all revert to light mode
- CSS variables from `:root` (light mode) take effect naturally
- No CSS specificity battles, no `!important` needed

### Files Previously Modified (unchanged from earlier sessions)
- `globals.css` - `.admin-light-mode` class still present (harmless, can be cleaned up later)
- `AdminDashboard.tsx`, `AdminListings.tsx`, `AdminUsers.tsx`, `AdminPayments.tsx`, `AdminPromotions.tsx`, `AdminCategories.tsx` - Badge inline styles preserved
- `AdminLogin.tsx` - Unchanged (uses CSS variables which now resolve to light mode)

---

## Task 1-d/e/f: Internal Pages (Noticias, Reciclaje, Directorio)

**Task ID**: 1-d/e/f
**Description**: Built 3 internal page components for the Gran Canaria Conecta SPA navigation. These pages are rendered based on the `currentView` state in the modal store (managed by the parallel Task 1-b/c agent). No modifications to modal-store.ts, page.tsx, or Navbar.tsx were made.

### Files Created

#### 1. `/src/components/pages/NoticiasPage.tsx`
- **Full news/articles browser** with search, category filtering, and pagination
- **Page header**: "Noticias Locales" title + "Últimas noticias y artículos de la comunidad" subtitle via `tp('news', 'title')` and bilingual inline text
- **Filter bar** (responsive — stacked on mobile, row on desktop):
  - Search input with Search icon, Enter-to-search, and clear (X) button
  - Category select dropdown populated from `ARTICLE_CATEGORIES` constant (6 categories: ENVIRONMENT, COMMUNITY, BUSINESS, SUSTAINABILITY, TOURISM, GENERAL) with translated labels
- **Active search indicator**: Shows current search query with dismiss button
- **Results count**: "Mostrando X de Y artículos" (locale-aware singular/plural)
- **Article grid**: 1 col mobile / 2 tablet / 3 desktop — uses shared `ArticleCard` component
- **Loading state**: 6 skeleton cards (h-[320px])
- **Empty state**: `EmptyState` with contextual messages (search vs. no-articles)
- **Pagination**: Full shadcn/ui Pagination with prev/next, numbered pages, and ellipsis for large page counts
- **API**: `GET /api/articles?category=...&search=...&page=...&limit=9`
- **Animation**: framer-motion fade-in + slide-up entrance, staggered card animations
- All text bilingual via `useI18n` hook

#### 2. `/src/components/pages/ReciclajePage.tsx`
- **Recycling points directory** with municipality, recycling type, and facility type filters
- **Page header**: Recycle icon in emerald circle + "Puntos de Reciclaje" title + "Encuentra el punto más cercano para reciclar" subtitle
- **Filter bar** (responsive — 3 filters stacked on mobile, row on desktop):
  - Municipality select: all 21 municipalities sorted alphabetically
  - Recycling type select: all 12 types from `RECYCLING_TYPES` with colored dot indicators (plastico, vidrio, papel, organico, electronica, textil, baterias, aceite, medicamentos, mobiliario, neumaticos, escombros)
  - Facility type select: ecoparque, container, clean_point, specialized — translated
- **Results count**: "Mostrando X puntos de reciclaje" (locale-aware singular/plural)
- **Results grid**: 1 col mobile / 2 tablet / 3 desktop — uses shared `RecyclingCard` component
- **Loading state**: 6 skeleton cards (h-[280px])
- **Empty state**: Contextual messages for no-results vs. filtered-no-results, with "Limpiar filtros" action button when filters are active
- **API**: `GET /api/recycling?municipality=...&type=...&facilityType=...`
- **Animation**: framer-motion fade-in + slide-up entrance, staggered card animations
- All text bilingual via `useI18n` hook

#### 3. `/src/components/pages/DirectorioPage.tsx`
- **Business directory** with search, municipality filter, sort, promotional banner, and pagination
- **Page header**: Store icon in primary-colored circle + "Directorio Comercial" title + "Negocios locales que confían en nosotros" subtitle
- **Promotional banner** at top (mirrors BusinessDirectory component):
  - Gradient background (primary → secondary) with decorative circles
  - Sparkles icon + "Promociona tu negocio" text + promotional description
  - "Comienza ahora" accent CTA button → calls `openPostAd()` from modal store
- **Filter bar** (responsive — stacked on mobile, row on desktop):
  - Search input with Search icon, Enter-to-search, and clear (X) button
  - Municipality select: all 21 municipalities sorted alphabetically
  - Sort select: "Más recientes" (newest) / "Más populares" (popular)
- **Active search indicator**: Shows current search query with dismiss button
- **Results count**: "Mostrando X de Y negocios" (locale-aware singular/plural)
- **Results grid**: 1 col mobile / 2 tablet / 3 desktop — uses shared `ListingCard` component
- **Loading state**: 6 skeleton cards (h-[320px])
- **Empty state**: Contextual messages for no-results vs. filtered-no-results, with "Limpiar filtros" action button when filters are active
- **Pagination**: Full shadcn/ui Pagination with prev/next, numbered pages, and ellipsis
- **API**: `GET /api/listings?tier=BUSINESS&municipality=...&search=...&sortBy=...&page=...&limit=12`
- **Animation**: framer-motion fade-in + slide-up entrance, staggered card animations
- All text bilingual via `useI18n` hook

### Lint Results
- All 3 new files pass ESLint with zero errors
- Pre-existing errors in `setup.js` and `Navbar.tsx` are unrelated
- Dev server compiles successfully

### Design Notes
- Eco-green theme consistent with the rest of the site (primary: #1B4332, secondary: #52B788)
- No blue or indigo colors used anywhere
- Mobile-first responsive design throughout
- Filter bars are compact on mobile (stacked) and horizontal on desktop
- framer-motion page entrance animations (fade in + slide up)
- All text is bilingual (ES/EN) via the `tp()` translation function

---

## Task 1-b/c: Internal Pages (Anuncios, Eventos) + Client-Side Navigation

**Task ID**: 1-b/c
**Description**: Built client-side navigation system using Zustand state, created AnunciosPage and EventosPage internal page components with full filter/pagination, and updated the Navbar to use button-based navigation instead of broken `<Link>` routes. Also created a ComingSoonPage placeholder for views not yet implemented.

### Files Modified

#### 1. `/src/lib/modal-store.ts`
- Added `PageView` type: `'home' | 'anuncios' | 'categorias' | 'eventos' | 'news' | 'directory' | 'recycling'`
- Added `currentView` state (default: `'home'`) and `setCurrentView(view)` action
- Exported `PageView` type for use in other components
- `isArticleReadingView` kept separate for backward compatibility

#### 2. `/src/lib/translations.ts`
- Added to `search` section: `clearFilters`, `byDate`, `noListings`, `noListingsDesc`, `noEvents`, `noEventsDesc`, `allCategoriesEvent`, `category`, `municipality`
- Added to `common` section: `backHome`, `home`
- Added new `pages` section: `anuncios`, `anunciosDesc`, `eventos`, `eventosDesc`, `categorias`, `news`, `directory`, `recycling`, `comingSoonMsg`

#### 3. `/src/app/page.tsx` (REWRITTEN)
- Imports AnunciosPage, EventosPage, ComingSoonPage
- Uses `currentView` from modal store to determine main content
- `currentView === 'home'` → renders all homepage sections (HeroSection, FeaturedSlider, etc.)
- `currentView === 'anuncios'` → renders `<AnunciosPage />`
- `currentView === 'eventos'` → renders `<EventosPage />`
- All other views → renders `<ComingSoonPage viewKey={...} />`
- `isArticleReadingView` still takes priority over everything

#### 4. `/src/components/layout/Navbar.tsx` (REWRITTEN)
- **Navigation**: Changed all `<Link href="...">` to `<button onClick={handleNavClick(index)}>` using `setCurrentView()` from modal store
- **NAV_KEY_TO_VIEW mapping**: ads→anuncios, categories→categorias, events→eventos, news→news, directory→directory, recycling→recycling
- **Active state highlighting**: Current view's nav link is styled with `text-primary` color
- **Home button**: Shows "Inicio" button with Home icon when `currentView !== 'home'`
- **Logo**: Changed from `<Link>` to `<button>` that resets to home view
- **Scroll to top**: All navigation actions scroll to page top
- **ThemeToggle fix**: Replaced `useState + useEffect setMounted(true)` pattern with `useSyncExternalStore` hydration-safe check (`useIsMounted`) to fix `react-hooks/set-state-in-effect` lint error
- **Mobile menu**: Same navigation logic, active state highlighting on mobile nav links

### Files Created

#### 1. `/src/components/pages/AnunciosPage.tsx`
- **Full listing browser page** with search, category, municipality, and sort filters
- **Breadcrumb**: Home > Anuncios (clickable home returns to home view)
- **Page header**: "Anuncios" title + "Explora todos los anuncios de la comunidad" subtitle
- **Results count**: "Mostrando X–Y de Z resultados"
- **Filter bar** (responsive — stacked on mobile, rows on desktop):
  - Search input with debounced search (400ms) + clear button
  - Category select: fetches parent categories from `/api/categories`
  - Municipality select: all 21 municipalities from `MUNICIPALITIES` constant
  - Sort select: newest, oldest, price_asc, price_desc, popular (translated labels)
  - Clear filters button (shown only when filters are active)
- **Results grid**: 1 col mobile / 2 tablet / 3 desktop — uses shared `ListingCard`
- **Loading state**: 6 skeleton cards (aspect-[4/3] + text lines)
- **Empty state**: `EmptyState` with PackageSearch icon + contextual messages
- **Pagination**: Prev/next buttons + numbered pages + ellipsis for large page counts, scroll-to-top on page change
- **API**: `GET /api/listings?search=...&categoryId=...&municipality=...&sortBy=...&page=...&limit=12`
- **Animation**: framer-motion fade-in + slide-up page entrance

#### 2. `/src/components/pages/EventosPage.tsx`
- **Full events browser page** with search, category, municipality, isFree, isEco filters
- **Breadcrumb**: Home > Eventos (clickable home returns to home view)
- **Page header**: "Eventos" title + "Descubre los próximos eventos en Gran Canaria" subtitle
- **Results count**: "Mostrando X–Y de Z resultados"
- **Filter bar** (responsive):
  - Search input with debounced search + clear button
  - Event category select: 8 categories (WORKSHOP, CLEANUP, MARKET, CONCERT, SPORT, COMMUNITY, CULTURE, OTHER) from `EVENT_CATEGORIES` with translated labels
  - Municipality select: all 21 municipalities
  - Toggle switches: "Gratuito" (isFree) and "Ecológico" (isEco) with shadcn/ui Switch + Label
  - Clear filters button
- **Results grid**: 1 col mobile / 2 tablet / 3 desktop — uses shared `EventCard`
- **Loading state**: 6 skeleton cards matching EventCard layout (date block + image)
- **Empty state**: `EmptyState` with CalendarOff icon
- **Pagination**: Same pattern as AnunciosPage
- **API**: `GET /api/events?search=...&category=...&municipality=...&isFree=...&isEco=...&status=UPCOMING&page=...&limit=12`
- **Animation**: framer-motion fade-in + slide-up page entrance

#### 3. `/src/components/pages/ComingSoonPage.tsx`
- **Placeholder page** for views not yet implemented (categorias, news, directory, recycling)
- **Breadcrumb**: Home > [view title]
- **Content**: `EmptyState` with Construction icon + "Próximamente" / "Coming soon" message
- **Back button**: "Volver al inicio" action returns to home view
- **Dynamic title**: Looks up translated title from `pages` section by view key

### Build Status
- Dev server compiles successfully (`✓ Compiled`)
- ESLint passes for all new/modified files (only pre-existing setup.js errors remain)
- All navigation works via Zustand state — no route changes needed
- API calls confirmed working: `/api/listings?limit=12&sortBy=newest` and `/api/categories?locale=es` return 200
