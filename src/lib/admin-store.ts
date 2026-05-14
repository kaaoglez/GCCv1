// ═══════════════════════════════════════════════════════════════
// GRAN CANARIA CONECTA - Admin Store (Zustand)
// ═══════════════════════════════════════════════════════════════

import { create } from 'zustand';
import type { ListingDTO } from './types';

export type AdminPage = 'dashboard' | 'listings' | 'promotions' | 'users' | 'categories' | 'payments';

interface AdminState {
  isAdmin: boolean;
  isLoading: boolean;
  activePage: AdminPage;
  adminUser: { name: string; role: string } | null;
  selectedListing: ListingDTO | null;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  setActivePage: (page: AdminPage) => void;
  setSelectedListing: (listing: ListingDTO | null) => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  isAdmin: false,
  isLoading: false,
  activePage: 'dashboard',
  adminUser: null,
  selectedListing: null,

  login: async (password: string) => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        const data = await res.json();
        set({ isAdmin: true, adminUser: data.user, isLoading: false });
        return true;
      }
      set({ isLoading: false });
      return false;
    } catch {
      set({ isLoading: false });
      return false;
    }
  },

  logout: () => {
    set({
      isAdmin: false,
      activePage: 'dashboard',
      adminUser: null,
      selectedListing: null,
    });
  },

  setActivePage: (page: AdminPage) => set({ activePage: page }),
  setSelectedListing: (listing) => set({ selectedListing: listing }),
}));
