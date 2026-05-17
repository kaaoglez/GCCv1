// ═══════════════════════════════════════════════════════════════
// GRAN CANARIA CONECTA - useNavigation Hook
// Syncs Zustand SPA navigation with browser history
//
// DESIGN PRINCIPLES:
// 1. Every forward navigation = exactly ONE history push
// 2. Back button (browser or in-app) = popstate restores exact state
// 3. Same-page clicks (already on target) = replace, not push
// 4. Closing modals/overlays = never pushes history
// 5. restoreState always scrolls to top
// 6. On page reload / new tab: restores from history.state or URL hash
// 7. Individual items (listings, events, articles) stored with IDs for reload
// ═══════════════════════════════════════════════════════════════

'use client';

import { useEffect, useRef } from 'react';
import { useModalStore, __skipHistoryPush, type PageView } from '@/lib/modal-store';
import type { ListingDTO, EventDTO, ArticleDTO } from '@/lib/types';

const VIEW_TITLES: Record<PageView, string> = {
  home: 'Inicio · Gran Canaria Conecta',
  anuncios: 'Anuncios · Gran Canaria Conecta',
  categorias: 'Categorías · Gran Canaria Conecta',
  eventos: 'Eventos · Gran Canaria Conecta',
  news: 'Noticias · Gran Canaria Conecta',
  flyers: 'Ofertas · Gran Canaria Conecta',
  'mis-flyers': 'Mis Folletos · Gran Canaria Conecta',
  'crear-folleto': 'Crear Folleto · Gran Canaria Conecta',
  directory: 'Directorio · Gran Canaria Conecta',
  recycling: 'Reciclaje · Gran Canaria Conecta',
  messages: 'Mensajes · Gran Canaria Conecta',
  perfil: 'Mi Perfil · Gran Canaria Conecta',
  'mis-anuncios': 'Mis Anuncios · Gran Canaria Conecta',
  favoritos: 'Favoritos · Gran Canaria Conecta',
};

const VALID_VIEWS: PageView[] = ['home', 'anuncios', 'categorias', 'eventos', 'news', 'flyers', 'directory', 'recycling', 'messages', 'perfil', 'mis-anuncios', 'mis-flyers', 'crear-folleto', 'favoritos'];

// ── State stored in browser history ──
export interface HistoryState {
  view: PageView;
  selectedCategoryId: string | null;
  isPostAdPage: boolean;
  isPromoteBusinessPage: boolean;
  isListingFullView: boolean;
  listingId: string | null;
  isEventFullView: boolean;
  eventId: string | null;
  isArticleReadingView: boolean;
  articleId: string | null;
  isSearchOpen: boolean;
  searchQuery: string;
  searchCategoryId: string | null;
  editingFlyerId: string | null;
  anunciosPage: number;
  eventosPage: number;
  noticiasPage: number;
  scrollY: number;
}

function readStoreState(): HistoryState {
  const s = useModalStore.getState();
  // Use saved scrollY when available (set before Dialog opens, since
  // Radix Dialog sets overflow:hidden which resets window.scrollY to 0)
  const savedScroll = (window as unknown as Record<string, number>).__gccAnunciosScrollY;
  return {
    view: s.currentView,
    selectedCategoryId: s.selectedCategoryId,
    isPostAdPage: s.isPostAdPage,
    isPromoteBusinessPage: s.isPromoteBusinessPage,
    isListingFullView: s.isListingFullView,
    listingId: s.selectedListing?.id || null,
    isEventFullView: s.isEventFullView,
    eventId: s.selectedEvent?.id || null,
    isArticleReadingView: s.isArticleReadingView,
    articleId: s.selectedArticle?.id || null,
    isSearchOpen: s.isSearchOpen,
    searchQuery: s.searchQuery,
    searchCategoryId: s.searchCategoryId,
    editingFlyerId: s.editingFlyerId,
    anunciosPage: s.anunciosPage,
    eventosPage: s.eventosPage,
    noticiasPage: s.noticiasPage,
    scrollY: typeof savedScroll === 'number' ? savedScroll : window.scrollY,
  };
}

function updateTitle(view: PageView, extra?: { listing?: string; event?: string; article?: string }) {
  if (extra?.listing) document.title = `${extra.listing} · Gran Canaria Conecta`;
  else if (extra?.event) document.title = `${extra.event} · Gran Canaria Conecta`;
  else if (extra?.article) document.title = `${extra.article} · Gran Canaria Conecta`;
  else document.title = VIEW_TITLES[view] || 'Gran Canaria Conecta';
}

// ── Build URL hash from state ──
function stateToHash(state: HistoryState): string {
  if (state.isListingFullView && state.listingId) return `#/anuncio/${state.listingId}`;
  if (state.isEventFullView && state.eventId) return `#/evento/${state.eventId}`;
  if (state.isArticleReadingView && state.articleId) return `#/articulo/${state.articleId}`;
  if (state.isPostAdPage) return `#/publicar`;
  if (state.isPromoteBusinessPage) return `#/promocionar`;
  // Include page number in hash for paginated sections
  if (state.view === 'anuncios' && state.anunciosPage > 1) {
    return `#/anuncios?page=${state.anunciosPage}`;
  }
  if (state.view === 'eventos' && state.eventosPage > 1) {
    return `#/eventos?page=${state.eventosPage}`;
  }
  if (state.view === 'news' && state.noticiasPage > 1) {
    return `#/news?page=${state.noticiasPage}`;
  }
  return `#/${state.view}`;
}

// ── Push: new entry in history (user navigated forward) ──
export function pushNavigationState() {
  const state = readStoreState();
  // Clear saved scrollY after consuming it (only relevant for forward navigation)
  delete (window as unknown as Record<string, number>).__gccAnunciosScrollY;
  updateTitle(state.view, {
    listing: state.isListingFullView ? useModalStore.getState().selectedListing?.title : undefined,
    event: state.isEventFullView ? useModalStore.getState().selectedEvent?.title : undefined,
    article: state.isArticleReadingView ? useModalStore.getState().selectedArticle?.title : undefined,
  });
  window.history.pushState(state, '', stateToHash(state));
}

// ── Replace: update current entry without adding new one ──
export function replaceNavigationState() {
  const state = readStoreState();
  updateTitle(state.view);
  window.history.replaceState(state, '', stateToHash(state));
}

// ── Navigate to a new page view (single history push) ──
export function navigateTo(view: PageView, extra?: { categoryId?: string }) {
  __skipHistoryPush(true);
  try {
    const store = useModalStore.getState();
    if (store.isPostAdPage) store.closePostAdPage();
    if (store.isPromoteBusinessPage) store.closePromoteBusinessPage();
    if (store.isListingFullView) store.closeListingFullView();
    if (store.isEventFullView) store.closeEventFullView();
    if (store.isArticleReadingView) store.closeArticleReadingView();
    if (store.isSearchOpen) store.closeSearch();
    store.setCurrentView(view);
    if (extra?.categoryId !== undefined) {
      store.setSelectedCategoryId(extra.categoryId);
    }
    // Reset pagination when navigating from NavBar (fresh visit)
    if (view === 'anuncios') store.setAnunciosPage(1);
    if (view === 'eventos') store.setEventosPage(1);
    if (view === 'news') store.setNoticiasPage(1);
  } finally {
    __skipHistoryPush(false);
  }
  pushNavigationState();
  window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
}

// ── Navigate to the same page or home (replace, not push) ──
export function navigateToSameOrHome(view: PageView) {
  const store = useModalStore.getState();
  const alreadyThere = store.currentView === view && !store.isPostAdPage && !store.isPromoteBusinessPage && !store.isListingFullView && !store.isEventFullView && !store.isArticleReadingView;

  __skipHistoryPush(true);
  try {
    if (store.isPostAdPage) store.closePostAdPage();
    if (store.isPromoteBusinessPage) store.closePromoteBusinessPage();
    if (store.isListingFullView) store.closeListingFullView();
    if (store.isEventFullView) store.closeEventFullView();
    if (store.isArticleReadingView) store.closeArticleReadingView();
    if (store.isSearchOpen) store.closeSearch();
    store.setCurrentView(view);
  } finally {
    __skipHistoryPush(false);
  }

  if (alreadyThere) {
    replaceNavigationState();
  } else {
    pushNavigationState();
  }
  window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
}

// ── Navigate back ──
export function navigateBack() {
  window.history.back();
}

// ── Restore: apply a HistoryState to the store (used during popstate) ──
function restoreState(state: HistoryState) {
  __skipHistoryPush(true);
  try {
    const store = useModalStore.getState();

    if (store.currentView !== state.view) store.setCurrentView(state.view);
    if (store.selectedCategoryId !== state.selectedCategoryId) store.setSelectedCategoryId(state.selectedCategoryId);
    if (store.editingFlyerId !== state.editingFlyerId) store.setEditingFlyerId(state.editingFlyerId);
    if (store.anunciosPage !== state.anunciosPage) store.setAnunciosPage(state.anunciosPage);
    if (store.eventosPage !== state.eventosPage) store.setEventosPage(state.eventosPage);
    if (store.noticiasPage !== state.noticiasPage) store.setNoticiasPage(state.noticiasPage);

    // Post Ad Page
    if (state.isPostAdPage !== store.isPostAdPage) {
      if (state.isPostAdPage) store.openPostAdPage();
      else store.closePostAdPage();
    }

    // Promote Business Page
    if (state.isPromoteBusinessPage !== store.isPromoteBusinessPage) {
      if (state.isPromoteBusinessPage) store.openPromoteBusinessPage();
      else store.closePromoteBusinessPage();
    }

    // Listing full view
    if (state.isListingFullView !== store.isListingFullView) {
      if (state.isListingFullView) {
        // Data should still be in store (not cleared on close)
        if (store.selectedListing) {
          store.openListingFullView();
        } else if (state.listingId) {
          // Data was cleared, fetch it
          fetchAndShowListing(state.listingId);
        }
      } else {
        store.closeListingFullView();
      }
    }

    // Event full view
    if (state.isEventFullView !== store.isEventFullView) {
      if (state.isEventFullView) {
        if (store.selectedEvent) {
          store.openEventFullView();
        } else if (state.eventId) {
          fetchAndShowEvent(state.eventId);
        }
      } else {
        store.closeEventFullView();
      }
    }

    // Article reading view
    if (state.isArticleReadingView !== store.isArticleReadingView) {
      if (state.isArticleReadingView) {
        if (store.selectedArticle) {
          store.openArticleReadingView(store.selectedArticle);
        } else if (state.articleId) {
          fetchAndShowArticle(state.articleId);
        }
      } else {
        store.closeArticleReadingView();
      }
    }

    // Search
    if (state.isSearchOpen !== store.isSearchOpen) {
      if (state.isSearchOpen) {
        store.openSearch(state.searchQuery, state.searchCategoryId ?? undefined);
      } else {
        store.closeSearch();
      }
    }

    if (state.isPostAdPage) {
      document.title = 'Publicar Anuncio · Gran Canaria Conecta';
    } else if (state.isPromoteBusinessPage) {
      document.title = 'Promociona tu Negocio · Gran Canaria Conecta';
    } else {
      updateTitle(state.view, {
        listing: state.isListingFullView ? store.selectedListing?.title : undefined,
        event: state.isEventFullView ? store.selectedEvent?.title : undefined,
        article: state.isArticleReadingView ? store.selectedArticle?.title : undefined,
      });
    }
  } finally {
    __skipHistoryPush(false);
  }

  // Scroll: scroll to top when opening full views
  // When going back to anuncios/eventos/news, DON'T scroll here — set a global
  // flag so those pages can restore scroll AFTER their data loads and DOM is painted.
  const goingBackToList = (state.view === 'anuncios' && !state.isListingFullView)
    || (state.view === 'eventos' && !state.isEventFullView)
    || (state.view === 'news' && !state.isArticleReadingView);
  if (goingBackToList) {
    if (state.scrollY > 0) {
      (window as unknown as Record<string, number>).__gccRestoreScroll = state.scrollY;
    }
  } else {
    const goingBack = !state.isListingFullView && !state.isEventFullView && !state.isArticleReadingView
      && !state.isPostAdPage && !state.isPromoteBusinessPage && !state.isSearchOpen;
    if (goingBack && state.scrollY > 0) {
      window.scrollTo({ top: state.scrollY, behavior: 'instant' as ScrollBehavior });
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  }
}

// ── Fetch helpers for restoring views on reload/popstate ──
// These use raw setState to avoid triggering tryPushHistory()
async function fetchAndShowListing(id: string) {
  try {
    const res = await fetch(`/api/listings/${id}`);
    if (res.ok) {
      const listing: ListingDTO = await res.json();
      useModalStore.setState({ selectedListing: listing, isListingDetailOpen: false });
    }
  } catch (err) {
    console.warn('[NAV] Failed to restore listing:', id, err);
  }
}

async function fetchAndShowEvent(id: string) {
  try {
    const res = await fetch(`/api/events/${id}`);
    if (res.ok) {
      const event: EventDTO = await res.json();
      useModalStore.setState({ selectedEvent: event, isEventDetailOpen: false });
    }
  } catch (err) {
    console.warn('[NAV] Failed to restore event:', id, err);
  }
}

async function fetchAndShowArticle(id: string) {
  try {
    const res = await fetch(`/api/articles/${id}`);
    if (res.ok) {
      const article: ArticleDTO = await res.json();
      useModalStore.setState({ selectedArticle: article, isArticleDetailOpen: false });
    }
  } catch (err) {
    console.warn('[NAV] Failed to restore article:', id, err);
  }
}

// ── Parse URL hash to determine initial state ──
function parseHashToState(): HistoryState | null {
  const hash = window.location.hash;

  // #/anuncio/<id>
  const listingMatch = hash.match(/^#\/anuncio\/(.+)$/);
  if (listingMatch) {
    return {
      view: 'anuncios',
      selectedCategoryId: null,
      isPostAdPage: false,
      isPromoteBusinessPage: false,
      isListingFullView: true,
      listingId: listingMatch[1],
      isEventFullView: false,
      eventId: null,
      isArticleReadingView: false,
      articleId: null,
      isSearchOpen: false,
      searchQuery: '',
      searchCategoryId: null,
      editingFlyerId: null,
      anunciosPage: 1,
      scrollY: 0,
    };
  }

  // #/evento/<id>
  const eventMatch = hash.match(/^#\/evento\/(.+)$/);
  if (eventMatch) {
    return {
      view: 'eventos',
      selectedCategoryId: null,
      isPostAdPage: false,
      isPromoteBusinessPage: false,
      isListingFullView: false,
      listingId: null,
      isEventFullView: true,
      eventId: eventMatch[1],
      isArticleReadingView: false,
      articleId: null,
      isSearchOpen: false,
      searchQuery: '',
      searchCategoryId: null,
      editingFlyerId: null,
      anunciosPage: 1,
      scrollY: 0,
    };
  }

  // #/articulo/<id>
  const articleMatch = hash.match(/^#\/articulo\/(.+)$/);
  if (articleMatch) {
    return {
      view: 'news',
      selectedCategoryId: null,
      isPostAdPage: false,
      isPromoteBusinessPage: false,
      isListingFullView: false,
      listingId: null,
      isEventFullView: false,
      eventId: null,
      isArticleReadingView: true,
      articleId: articleMatch[1],
      isSearchOpen: false,
      searchQuery: '',
      searchCategoryId: null,
      editingFlyerId: null,
      anunciosPage: 1,
      scrollY: 0,
    };
  }

  // #/publicar
  if (hash === '#/publicar') {
    return {
      view: 'home',
      selectedCategoryId: null,
      isPostAdPage: true,
      isPromoteBusinessPage: false,
      isListingFullView: false,
      listingId: null,
      isEventFullView: false,
      eventId: null,
      isArticleReadingView: false,
      articleId: null,
      isSearchOpen: false,
      searchQuery: '',
      searchCategoryId: null,
      editingFlyerId: null,
      anunciosPage: 1,
      scrollY: 0,
    };
  }

  // Regular page: #/anuncios, #/anuncios?page=3, #/categorias, etc.
  const rawPath = hash.replace('#/', '');
  // Split off query string (e.g. 'anuncios?page=3' → 'anuncios' + '?page=3')
  const [pathOnly, queryString] = rawPath.split('?');
  if (pathOnly && VALID_VIEWS.includes(pathOnly as PageView)) {
    // Recover page number from URL query string, then sessionStorage fallback
    let recoveredPage = 1;
    let recoveredEventosPage = 1;
    let recoveredNoticiasPage = 1;
    if (pathOnly === 'anuncios') {
      const pageParam = new URLSearchParams(queryString || '').get('page');
      recoveredPage = pageParam ? (parseInt(pageParam, 10) || 1) : (parseInt(sessionStorage.getItem('gcc_anuncios_page') || '1', 10) || 1);
    }
    if (pathOnly === 'eventos') {
      const pageParam = new URLSearchParams(queryString || '').get('page');
      recoveredEventosPage = pageParam ? (parseInt(pageParam, 10) || 1) : (parseInt(sessionStorage.getItem('gcc_eventos_page') || '1', 10) || 1);
    }
    if (pathOnly === 'news') {
      const pageParam = new URLSearchParams(queryString || '').get('page');
      recoveredNoticiasPage = pageParam ? (parseInt(pageParam, 10) || 1) : (parseInt(sessionStorage.getItem('gcc_noticias_page') || '1', 10) || 1);
    }
    return {
      view: pathOnly as PageView,
      selectedCategoryId: null,
      isPostAdPage: false,
      isPromoteBusinessPage: false,
      isListingFullView: false,
      listingId: null,
      isEventFullView: false,
      eventId: null,
      isArticleReadingView: false,
      articleId: null,
      isSearchOpen: false,
      searchQuery: '',
      searchCategoryId: null,
      editingFlyerId: null,
      anunciosPage: recoveredPage,
      eventosPage: recoveredEventosPage,
      noticiasPage: recoveredNoticiasPage,
      scrollY: 0,
    };
  }

  return null;
}

// ── Determine initial state from browser on first load ──
function getInitialState(): HistoryState | null {
  // 1. Check history.state (preserved by browser across reloads)
  try {
    const hs = window.history.state as HistoryState | null;
    if (hs && hs.view && VALID_VIEWS.includes(hs.view)) {
      // If it has an item ID, validate the URL hash matches
      if ((hs.isListingFullView && hs.listingId) || (hs.isEventFullView && hs.eventId) || (hs.isArticleReadingView && hs.articleId)) {
        return hs;
      }
      if (!hs.isListingFullView && !hs.isEventFullView && !hs.isArticleReadingView) {
        // Fallback: restore page from sessionStorage if history.state doesn't have it
        if (hs.view === 'anuncios' && (!hs.anunciosPage || hs.anunciosPage < 1)) {
          const savedPage = parseInt(sessionStorage.getItem('gcc_anuncios_page') || '1', 10);
          if (savedPage > 1) hs.anunciosPage = savedPage;
        }
        if (hs.view === 'eventos' && (!hs.eventosPage || hs.eventosPage < 1)) {
          const savedPage = parseInt(sessionStorage.getItem('gcc_eventos_page') || '1', 10);
          if (savedPage > 1) hs.eventosPage = savedPage;
        }
        if (hs.view === 'news' && (!hs.noticiasPage || hs.noticiasPage < 1)) {
          const savedPage = parseInt(sessionStorage.getItem('gcc_noticias_page') || '1', 10);
          if (savedPage > 1) hs.noticiasPage = savedPage;
        }
        return hs;
      }
    }
  } catch {
    // history.state may not be accessible
  }

  // 2. Fall back to URL hash
  return parseHashToState();
}

// ── Main hook: listens for popstate ──
export function useNavigation() {
  const initialized = useRef(false);

  useEffect(() => {
    // Prevent browser from auto-scrolling on hash changes / popstate
    // We handle all scroll restoration manually
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    if (!initialized.current) {
      initialized.current = true;

      const savedState = getInitialState();

      if (savedState) {
        // ── ATOMIC STATE RESTORE ──
        // Set ALL state in a single setState call to prevent intermediate renders (flash)
        __skipHistoryPush(true);
        try {
          const atomicUpdate: Record<string, unknown> = {
            currentView: savedState.view,
            selectedCategoryId: savedState.selectedCategoryId,
            editingFlyerId: savedState.editingFlyerId,
            anunciosPage: savedState.anunciosPage,
            eventosPage: savedState.eventosPage,
            noticiasPage: savedState.noticiasPage,
            // Close all overlays / other views
            isListingDetailOpen: false,
            isEventDetailOpen: false,
            isArticleDetailOpen: false,
            isPostAdPage: false,
            isPromoteBusinessPage: false,
            isSearchOpen: false,
          };

          // Set the active full-view flag (without data — skeleton will show)
          if (savedState.isListingFullView) {
            atomicUpdate.isListingFullView = true;
            atomicUpdate.isEventFullView = false;
            atomicUpdate.isArticleReadingView = false;
          } else if (savedState.isEventFullView) {
            atomicUpdate.isEventFullView = true;
            atomicUpdate.isListingFullView = false;
            atomicUpdate.isArticleReadingView = false;
          } else if (savedState.isArticleReadingView) {
            atomicUpdate.isArticleReadingView = true;
            atomicUpdate.isListingFullView = false;
            atomicUpdate.isEventFullView = false;
          } else {
            atomicUpdate.isListingFullView = false;
            atomicUpdate.isEventFullView = false;
            atomicUpdate.isArticleReadingView = false;
          }

          // Post Ad / Promote Business pages
          if (savedState.isPostAdPage) {
            atomicUpdate.isPostAdPage = true;
          }
          if (savedState.isPromoteBusinessPage) {
            atomicUpdate.isPromoteBusinessPage = true;
          }

          // Apply everything in ONE batch — no intermediate renders
          useModalStore.setState(atomicUpdate);
        } finally {
          __skipHistoryPush(false);
        }

        // Replace history with restored state
        replaceNavigationState();

        // Async: fetch item data — components already show loading skeleton
        if (savedState.isListingFullView && savedState.listingId) {
          fetchAndShowListing(savedState.listingId);
        } else if (savedState.isEventFullView && savedState.eventId) {
          fetchAndShowEvent(savedState.eventId);
        } else if (savedState.isArticleReadingView && savedState.articleId) {
          fetchAndShowArticle(savedState.articleId);
        }

        // Set title for item pages (generic until data loads)
        if (savedState.isPostAdPage) {
          document.title = 'Publicar Anuncio · Gran Canaria Conecta';
        } else if (savedState.isPromoteBusinessPage) {
          document.title = 'Promociona tu Negocio · Gran Canaria Conecta';
        } else if (savedState.isListingFullView) {
          document.title = 'Anuncio · Gran Canaria Conecta';
        } else if (savedState.isEventFullView) {
          document.title = 'Evento · Gran Canaria Conecta';
        } else if (savedState.isArticleReadingView) {
          document.title = 'Noticia · Gran Canaria Conecta';
        }
      } else {
        replaceNavigationState();
      }
    }

    const onPopState = (e: PopStateEvent) => {
      const state = e.state as HistoryState | null;
      console.log('[NAV] popstate fired');
      if (state && state.view) {
        restoreState(state);
      } else {
        // User went back past our history — go home
        __skipHistoryPush(true);
        try {
          const store = useModalStore.getState();
          store.setCurrentView('home');
          store.setSelectedCategoryId(null);
          if (store.isPostAdPage) store.closePostAdPage();
          if (store.isPromoteBusinessPage) store.closePromoteBusinessPage();
          if (store.isListingFullView) store.closeListingFullView();
          if (store.isEventFullView) store.closeEventFullView();
          if (store.isArticleReadingView) store.closeArticleReadingView();
          if (store.isSearchOpen) store.closeSearch();
          updateTitle('home');
        } finally {
          __skipHistoryPush(false);
        }
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
}
