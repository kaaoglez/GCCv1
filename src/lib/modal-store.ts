// Gran Canaria Conecta - Global Modal State Store
// Zustand store for managing modal visibility across components
//
// HISTORY INTEGRATION RULES:
// - setCurrentView / setSelectedCategoryId: NO auto-push (callers decide)
// - openListingFullView / openEventFullView / openArticleReadingView: auto-push (they represent forward nav)
// - closeListingFullView / closeEventFullView / closeArticleReadingView: NO auto-push (back handled by popstate)
// - openSearch / closeSearch: auto-push (search is a navigation state)
// - All modals (PostAd, ListingDetail, EventDetail, ArticleDetail, Auth, Payment, Message): NO push (they're overlays)

'use client';

import { create } from 'zustand';
import type { ListingDTO, EventDTO, ArticleDTO } from './types';

// ── History integration (lazy import to avoid circular deps) ──
let _pushHistory: (() => void) | null = null;
let _skipPush = false;

export function __registerHistoryPush(fn: () => void) { _pushHistory = fn; }
/** Temporarily suppress history push (used during batch operations and popstate restore) */
export function __skipHistoryPush(suppress: boolean) { _skipPush = suppress; }

function tryPushHistory() { if (!_skipPush) _pushHistory?.(); }

export type PageView = 'home' | 'anuncios' | 'categorias' | 'eventos' | 'news' | 'directory' | 'recycling' | 'messages' | 'perfil' | 'mis-anuncios' | 'favoritos';

interface ModalState {
  // Current page view (client-side routing)
  currentView: PageView;
  setCurrentView: (view: PageView) => void;

  // Selected category for cross-page navigation
  selectedCategoryId: string | null;
  setSelectedCategoryId: (id: string | null) => void;

  // Admin full-page view
  isAdminView: boolean;
  setAdminView: (active: boolean) => void;

  // Post Ad Modal (overlay — no history push)
  isPostAdOpen: boolean;
  openPostAd: () => void;
  closePostAd: () => void;

  // Listing Detail Modal (overlay — no history push)
  selectedListing: ListingDTO | null;
  isListingDetailOpen: boolean;
  openListingDetail: (listing: ListingDTO) => void;
  closeListingDetail: () => void;

  // Search Results Modal (navigation state — pushes history)
  searchQuery: string;
  searchCategoryId: string | null;
  isSearchOpen: boolean;
  openSearch: (query: string, categoryId?: string) => void;
  closeSearch: () => void;

  // Event Detail Modal (overlay — no history push)
  selectedEvent: EventDTO | null;
  isEventDetailOpen: boolean;
  openEventDetail: (event: EventDTO) => void;
  closeEventDetail: () => void;

  // Article Detail Modal (overlay — no history push)
  selectedArticle: ArticleDTO | null;
  isArticleDetailOpen: boolean;
  openArticleDetail: (article: ArticleDTO) => void;
  closeArticleDetail: () => void;

  // Article Reading View (full-page nav — pushes history on open only)
  isArticleReadingView: boolean;
  openArticleReadingView: (article: ArticleDTO) => void;
  closeArticleReadingView: () => void;

  // Listing Full View (full-page nav — pushes history on open only)
  isListingFullView: boolean;
  openListingFullView: () => void;
  closeListingFullView: () => void;

  // Event Full View (full-page nav — pushes history on open only)
  isEventFullView: boolean;
  openEventFullView: () => void;
  closeEventFullView: () => void;

  // Auth Modal (overlay — no history push)
  isAuthOpen: boolean;
  openAuth: () => void;
  closeAuth: () => void;

  // Payment Modal (overlay — no history push)
  paymentConfig: { type: string; listingId?: string; amount: number; listingTitle?: string } | null;
  isPaymentOpen: boolean;
  openPayment: (config: { type: string; listingId?: string; amount: number; listingTitle?: string }) => void;
  closePayment: () => void;

  // Message Modal (overlay — no history push)
  messageConfig: { receiverId: string; receiverName: string; listingId?: string; listingTitle?: string; listingImage?: string } | null;
  isMessageOpen: boolean;
  openMessage: (config: { receiverId: string; receiverName: string; listingId?: string; listingTitle?: string; listingImage?: string }) => void;
  closeMessage: () => void;

  // Listings refresh key — bumped when listing data changes (status, delete, etc.)
  listingsRefreshKey: number;
  bumpListingsRefreshKey: () => void;
}

export const useModalStore = create<ModalState>()((set) => ({
  // ── Page view: NO auto-push (callers control history) ──
  currentView: 'home',
  setCurrentView: (view) => { set({ currentView: view }); },

  // ── Selected category: NO auto-push (callers control history) ──
  selectedCategoryId: null,
  setSelectedCategoryId: (id) => { set({ selectedCategoryId: id }); },

  // ── Admin view: NO history push ──
  isAdminView: false,
  setAdminView: (active) => set({ isAdminView: active }),

  // ── Post Ad Modal: overlay, no history ──
  isPostAdOpen: false,
  openPostAd: () => set({ isPostAdOpen: true }),
  closePostAd: () => set({ isPostAdOpen: false }),

  // ── Listing Detail Modal: overlay, no history ──
  selectedListing: null,
  isListingDetailOpen: false,
  openListingDetail: (listing) =>
    set({ selectedListing: listing, isListingDetailOpen: true }),
  closeListingDetail: () =>
    set({ selectedListing: null, isListingDetailOpen: false }),

  // ── Search: navigation state, pushes history ──
  searchQuery: '',
  searchCategoryId: null,
  isSearchOpen: false,
  openSearch: (query, categoryId) =>
    { set({ searchQuery: query, searchCategoryId: categoryId || null, isSearchOpen: true }); tryPushHistory(); },
  closeSearch: () =>
    { set({ searchQuery: '', searchCategoryId: null, isSearchOpen: false }); tryPushHistory(); },

  // ── Event Detail Modal: overlay, no history ──
  selectedEvent: null,
  isEventDetailOpen: false,
  openEventDetail: (event) =>
    set({ selectedEvent: event, isEventDetailOpen: true }),
  closeEventDetail: () =>
    set({ selectedEvent: null, isEventDetailOpen: false }),

  // ── Article Detail Modal: overlay, no history ──
  selectedArticle: null,
  isArticleDetailOpen: false,
  openArticleDetail: (article) =>
    set({ selectedArticle: article, isArticleDetailOpen: true }),
  closeArticleDetail: () =>
    set({ selectedArticle: null, isArticleDetailOpen: false }),

  // ── Article Reading View: full-page, push on OPEN only ──
  isArticleReadingView: false,
  openArticleReadingView: (article) =>
    { set({ selectedArticle: article, isArticleDetailOpen: false, isArticleReadingView: true }); tryPushHistory(); },
  closeArticleReadingView: () =>
    // NO push — back navigation is handled by popstate or navigateBack()
    { set({ selectedArticle: null, isArticleReadingView: false }); },

  // ── Listing Full View: full-page, push on OPEN only ──
  isListingFullView: false,
  openListingFullView: () =>
    { set({ isListingDetailOpen: false, isListingFullView: true }); tryPushHistory(); },
  closeListingFullView: () =>
    // NO push — back navigation is handled by popstate or navigateBack()
    { set({ selectedListing: null, isListingFullView: false }); },

  // ── Event Full View: full-page, push on OPEN only ──
  isEventFullView: false,
  openEventFullView: () =>
    { set({ isEventDetailOpen: false, isEventFullView: true }); tryPushHistory(); },
  closeEventFullView: () =>
    // NO push — back navigation is handled by popstate or navigateBack()
    { set({ selectedEvent: null, isEventFullView: false }); },

  // ── Auth Modal: overlay, no history ──
  isAuthOpen: false,
  openAuth: () => set({ isAuthOpen: true }),
  closeAuth: () => set({ isAuthOpen: false }),

  // ── Payment Modal: overlay, no history ──
  paymentConfig: null,
  isPaymentOpen: false,
  openPayment: (config) => set({ paymentConfig: config, isPaymentOpen: true }),
  closePayment: () => set({ paymentConfig: null, isPaymentOpen: false }),

  // ── Message Modal: overlay, no history ──
  messageConfig: null,
  isMessageOpen: false,
  openMessage: (config) => set({ messageConfig: config, isMessageOpen: true }),
  closeMessage: () => set({ messageConfig: null, isMessageOpen: false }),

  // ── Listings refresh key ──
  listingsRefreshKey: 0,
  bumpListingsRefreshKey: () => set((s) => ({ listingsRefreshKey: s.listingsRefreshKey + 1 })),
}));
