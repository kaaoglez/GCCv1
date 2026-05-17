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
// ═══════════════════════════════════════════════════════════════

'use client';

import { useEffect, useRef } from 'react';
import { useModalStore, __skipHistoryPush, type PageView } from '@/lib/modal-store';

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

// ── State stored in browser history ──
export interface HistoryState {
  view: PageView;
  selectedCategoryId: string | null;
  isPostAdPage: boolean;
  isPromoteBusinessPage: boolean;
  isListingFullView: boolean;
  isEventFullView: boolean;
  isArticleReadingView: boolean;
  isSearchOpen: boolean;
  searchQuery: string;
  searchCategoryId: string | null;
  editingFlyerId: string | null;
}

function readStoreState(): HistoryState {
  const s = useModalStore.getState();
  return {
    view: s.currentView,
    selectedCategoryId: s.selectedCategoryId,
    isPostAdPage: s.isPostAdPage,
    isPromoteBusinessPage: s.isPromoteBusinessPage,
    isListingFullView: s.isListingFullView,
    isEventFullView: s.isEventFullView,
    isArticleReadingView: s.isArticleReadingView,
    isSearchOpen: s.isSearchOpen,
    searchQuery: s.searchQuery,
    searchCategoryId: s.searchCategoryId,
    editingFlyerId: s.editingFlyerId,
  };
}

function updateTitle(view: PageView) {
  document.title = VIEW_TITLES[view] || 'Gran Canaria Conecta';
}

// ── Push: new entry in history (user navigated forward) ──
export function pushNavigationState() {
  const state = readStoreState();
  if (state.isPostAdPage) {
    document.title = 'Publicar Anuncio · Gran Canaria Conecta';
  } else if (state.isPromoteBusinessPage) {
    document.title = 'Promociona tu Negocio · Gran Canaria Conecta';
  } else if (state.view === 'crear-folleto' && state.editingFlyerId) {
    document.title = 'Editar Folleto · Gran Canaria Conecta';
  } else {
    updateTitle(state.view);
  }
  window.history.pushState(state, '', `#/${state.view}`);
}

// ── Replace: update current entry without adding new one ──
export function replaceNavigationState() {
  const state = readStoreState();
  updateTitle(state.view);
  window.history.replaceState(state, '', `#/${state.view}`);
}

// ── Navigate to a new page view (single history push) ──
// This is the ONLY way forward navigation should happen.
// Closes any open full-views before changing view.
export function navigateTo(view: PageView, extra?: { categoryId?: string }) {
  __skipHistoryPush(true);
  try {
    const store = useModalStore.getState();
    // Close any open full views first
    if (store.isPostAdPage) store.closePostAdPage();
    if (store.isPromoteBusinessPage) store.closePromoteBusinessPage();
    if (store.isListingFullView) store.closeListingFullView();
    if (store.isEventFullView) store.closeEventFullView();
    if (store.isArticleReadingView) store.closeArticleReadingView();
    if (store.isSearchOpen) store.closeSearch();
    // Set the new view
    store.setCurrentView(view);
    if (extra?.categoryId !== undefined) {
      store.setSelectedCategoryId(extra.categoryId);
    }
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
    // Same page: just replace (no new history entry)
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

    // View
    if (store.currentView !== state.view) store.setCurrentView(state.view);

    // Category filter
    if (store.selectedCategoryId !== state.selectedCategoryId) store.setSelectedCategoryId(state.selectedCategoryId);

    // Editing flyer ID
    if (store.editingFlyerId !== state.editingFlyerId) store.setEditingFlyerId(state.editingFlyerId);

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
      if (state.isListingFullView) store.openListingFullView();
      else store.closeListingFullView();
    }

    // Event full view
    if (state.isEventFullView !== store.isEventFullView) {
      if (state.isEventFullView) store.openEventFullView();
      else store.closeEventFullView();
    }

    // Article reading view
    if (state.isArticleReadingView !== store.isArticleReadingView) {
      if (state.isArticleReadingView && store.selectedArticle) {
        store.openArticleReadingView(store.selectedArticle);
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
    } else if (state.view === 'crear-folleto' && state.editingFlyerId) {
      document.title = 'Editar Folleto · Gran Canaria Conecta';
    } else {
      updateTitle(state.view);
    }
  } finally {
    __skipHistoryPush(false);
  }

  // Always scroll to top when going back — the user expects to see the top of the previous page
  window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
}

// ── Main hook: listens for popstate ──
export function useNavigation() {
  const initialized = useRef(false);

  useEffect(() => {
    // First mount: replace current history entry (don't create a new one)
    if (!initialized.current) {
      initialized.current = true;
      replaceNavigationState();
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

  // Handle direct hash access (#/categorias, etc.)
  useEffect(() => {
    const hash = window.location.hash.replace('#/', '');
    const validViews: PageView[] = ['home', 'anuncios', 'categorias', 'eventos', 'news', 'flyers', 'directory', 'recycling', 'messages', 'perfil', 'mis-anuncios', 'mis-flyers', 'crear-folleto', 'favoritos'];
    if (hash && validViews.includes(hash as PageView)) {
      const store = useModalStore.getState();
      if (store.currentView !== hash) {
        __skipHistoryPush(true);
        try {
          store.setCurrentView(hash as PageView);
        } finally {
          __skipHistoryPush(false);
        }
        replaceNavigationState();
      }
    }
  }, []);
}
