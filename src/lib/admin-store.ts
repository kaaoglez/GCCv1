// ═══════════════════════════════════════════════════════════════
// GRAN CANARIA CONECTA - Admin Store (Zustand)
// ═══════════════════════════════════════════════════════════════

import { create } from 'zustand';
import type { ListingDTO, UserRole, AdminPageKey } from './types';
import { ADMIN_ROLES, ROLE_PAGE_PERMISSIONS } from './types';

export type AdminPage = AdminPageKey;

interface AdminState {
  isAdmin: boolean;
  isLoading: boolean;
  activePage: AdminPage;
  userRole: UserRole | null;
  userName: string | null;
  selectedListing: ListingDTO | null;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  setSessionRole: (role: UserRole, name: string) => void;
  setActivePage: (page: AdminPage) => void;
  setSelectedListing: (listing: ListingDTO | null) => void;
  canAccess: (page: AdminPageKey) => boolean;
  getAllowedPages: () => AdminPageKey[];
}

export const useAdminStore = create<AdminState>((set, get) => ({
  isAdmin: false,
  isLoading: false,
  activePage: 'dashboard',
  userRole: null,
  userName: null,
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
        set({ isAdmin: true, isLoading: false });
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
      userRole: null,
      userName: null,
      selectedListing: null,
    });
  },

  setSessionRole: (role: UserRole, name: string) => {
    const allowedPages = ROLE_PAGE_PERMISSIONS[role] || [];
    const hasDashboard = allowedPages.includes('dashboard');
    set({
      userRole: role,
      userName: name,
      activePage: hasDashboard ? 'dashboard' : allowedPages[0] || 'dashboard',
    });
  },

  setActivePage: (page: AdminPage) => {
    const { userRole } = get();
    if (userRole) {
      const allowed = ROLE_PAGE_PERMISSIONS[userRole] || [];
      if (!allowed.includes(page)) return; // blocked
    }
    set({ activePage: page });
  },

  setSelectedListing: (listing) => set({ selectedListing: listing }),

  canAccess: (page: AdminPageKey) => {
    const { userRole } = get();
    if (!userRole) return false;
    const allowed = ROLE_PAGE_PERMISSIONS[userRole] || [];
    return allowed.includes(page);
  },

  getAllowedPages: () => {
    const { userRole } = get();
    if (!userRole) return [];
    return ROLE_PAGE_PERMISSIONS[userRole] || [];
  },
}));

/** Check if a role is an admin-level role */
export function isAdminRole(role: string | undefined | null): boolean {
  if (!role) return false;
  return ADMIN_ROLES.includes(role as UserRole);
}
