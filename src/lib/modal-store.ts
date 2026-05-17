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

export type PageView = 'home' | 'anuncios' | 'categorias' | 'eventos' | 'news' | 'directory' | 'recycling' | 'flyers' | 'messages' | 'perfil' | 'mis-anuncios' | 'mis-flyers' | 'crear-folleto' | 'favoritos';

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

  // Post Ad Page (full-page nav — pushes history on open only)
  isPostAdPage: boolean;
  openPostAdPage: () => void;
  closePostAdPage: () => void;

  // Promote Business Page (full-page nav — pushes history on open only)
  isPromoteBusinessPage: boolean;
  openPromoteBusinessPage: () => void;
  closePromoteBusinessPage: () => void;

  // Listing Detail Modal (overlay — no history push)
  // openListingDetail saves scrollY so pushNavigationState uses it when
  // navigating to full view (Dialog overflow:hidden kills window.scrollY).
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
  // openEventDetail saves scrollY (same pattern as openListingDetail)
  selectedEvent: EventDTO | null;
  isEventDetailOpen: boolean;
  openEventDetail: (event: EventDTO) => void;
  closeEventDetail: () => void;

  // Article Detail Modal (overlay — no history push)
  // openArticleDetail saves scrollY (same pattern as openListingDetail)
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
  setListingForFullView: (listing: ListingDTO) => void;

  // Event Full View (full-page nav — pushes history on open only)
  isEventFullView: boolean;
  openEventFullView: () => void;
  closeEventFullView: () => void;
  setEventForFullView: (event: EventDTO) => void;

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

  // Anuncios page number — preserved across full-view navigation
  anunciosPage: number;
  setAnunciosPage: (page: number) => void;

  // Anuncios scroll position — saved BEFORE opening listing detail modal
  anunciosScrollY: number;
  setAnunciosScrollY: (y: number) => void;

  // Eventos page number — preserved across full-view navigation
  eventosPage: number;
  setEventosPage: (page: number) => void;

  // Noticias page number — preserved across full-view navigation
  noticiasPage: number;
  setNoticiasPage: (page: number) => void;

  // Listings refresh key — bumped when listing data changes (status, delete, etc.)
  listingsRefreshKey: number;
  bumpListingsRefreshKey: () => void;

  // Editing flyer ID — set before navigating to crear-folleto page
  editingFlyerId: string | null;
  setEditingFlyerId: (id: string | null) => void;
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

  // ── Post Ad Page: full-page, push on OPEN only ──
  isPostAdPage: false,
  openPostAdPage: () =>
    { set({ isPostAdOpen: false, isPostAdPage: true, isPromoteBusinessPage: false }); tryPushHistory(); },
  closePostAdPage: () =>
    { set({ isPostAdPage: false }); },

  // ── Promote Business Page: full-page, push on OPEN only ──
  isPromoteBusinessPage: false,
  openPromoteBusinessPage: () =>
    { set({ isPromoteBusinessPage: true, isPostAdPage: false }); tryPushHistory(); window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }); },
  closePromoteBusinessPage: () =>
    { set({ isPromoteBusinessPage: false }); },

  // ── Listing Detail Modal: overlay, no history ──
  selectedListing: null,
  isListingDetailOpen: false,
  openListingDetail: (listing) => {
    // Save scroll position BEFORE Dialog opens (sets overflow:hidden → scrollY=0)
    (window as unknown as Record<string, number>).__gccAnunciosScrollY = window.scrollY;
    set({ selectedListing: listing, isListingDetailOpen: true });
  },
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
  openEventDetail: (event) => {
    (window as unknown as Record<string, number>).__gccEventosScrollY = window.scrollY;
    set({ selectedEvent: event, isEventDetailOpen: true });
  },
  closeEventDetail: () =>
    set({ selectedEvent: null, isEventDetailOpen: false }),

  // ── Article Detail Modal: overlay, no history ──
  selectedArticle: null,
  isArticleDetailOpen: false,
  openArticleDetail: (article) => {
    (window as unknown as Record<string, number>).__gccNoticiasScrollY = window.scrollY;
    set({ selectedArticle: article, isArticleDetailOpen: true });
  },
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
    // Keep selectedListing for back-navigation restore
    { set({ isListingFullView: false }); },
  setListingForFullView: (listing) =>
    { set({ selectedListing: listing, isListingDetailOpen: false, isListingFullView: true }); tryPushHistory(); },

  // ── Event Full View: full-page, push on OPEN only ──
  isEventFullView: false,
  openEventFullView: () =>
    { set({ isEventDetailOpen: false, isEventFullView: true }); tryPushHistory(); },
  closeEventFullView: () =>
    // NO push — back navigation is handled by popstate or navigateBack()
    // Keep selectedEvent for back-navigation restore
    { set({ isEventFullView: false }); },
  setEventForFullView: (event) =>
    { set({ selectedEvent: event, isEventDetailOpen: false, isEventFullView: true }); tryPushHistory(); },

  // ── Article Reading View restore helper ──
  setArticleForReadingView: (article) =>
    { set({ selectedArticle: article, isArticleDetailOpen: false, isArticleReadingView: true }); tryPushHistory(); },

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

  // ── Anuncios page number: NO auto-push (callers control history) ──
  anunciosPage: 1,
  setAnunciosPage: (page) => set({ anunciosPage: page }),

  // ── Eventos page number: NO auto-push (callers control history) ──
  eventosPage: 1,
  setEventosPage: (page) => set({ eventosPage: page }),

  // ── Noticias page number: NO auto-push (callers control history) ──
  noticiasPage: 1,
  setNoticiasPage: (page) => set({ noticiasPage: page }),

  // ── Anuncios scroll Y: saved before opening detail modal ──
  anunciosScrollY: 0,
  setAnunciosScrollY: (y) => set({ anunciosScrollY: y }),

  // ── Listings refresh key ──
  listingsRefreshKey: 0,
  bumpListingsRefreshKey: () => set((s) => ({ listingsRefreshKey: s.listingsRefreshKey + 1 })),

  // ── Editing flyer ID ──
  editingFlyerId: null,
  setEditingFlyerId: (id) => set({ editingFlyerId: id }),
}));
