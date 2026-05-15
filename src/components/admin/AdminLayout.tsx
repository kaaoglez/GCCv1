'use client';

import { useState, useCallback } from 'react';
import { useAdminStore, type AdminPage } from '@/lib/admin-store';
import { useSession } from 'next-auth/react';
import type { AdminPageKey, UserRole } from '@/lib/types';
import { ROLE_LABELS, ROLE_PAGE_PERMISSIONS } from '@/lib/types';
import {
  LogOut, Menu, Leaf, ChevronRight,
  LayoutDashboard, FileText, Sparkles, Users, FolderOpen, CreditCard,
  ExternalLink, Bell, Crown, ShieldCheck, Eye, Shield, ShieldOff,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';

const allNavItems: { key: AdminPageKey; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { key: 'listings', label: 'Anuncios', icon: <FileText className="w-5 h-5" /> },
  { key: 'promotions', label: 'Promociones', icon: <Sparkles className="w-5 h-5" /> },
  { key: 'users', label: 'Usuarios', icon: <Users className="w-5 h-5" /> },
  { key: 'categories', label: 'Categorías', icon: <FolderOpen className="w-5 h-5" /> },
  { key: 'payments', label: 'Pagos', icon: <CreditCard className="w-5 h-5" /> },
];

function getRoleLabel(role: string): string {
  const label = ROLE_LABELS[role as UserRole];
  if (!label) return role;
  return label.es;
}

function getRoleColor(role: string): string {
  const label = ROLE_LABELS[role as UserRole];
  return label?.color || '#6b7280';
}

function RoleIconDisplay({ role, className = 'w-4 h-4' }: { role: string; className?: string }) {
  switch (role) {
    case 'SUPER_ADMIN': return <Crown className={className} />;
    case 'ADMIN': return <ShieldCheck className={className} />;
    case 'MODERATOR': return <Eye className={className} />;
    case 'BUSINESS': return <Shield className={className} />;
    default: return <ShieldOff className={className} />;
  }
}

function SidebarContent({ activePage, onNavigate, onBack, onLogout, userRole, userName }: {
  activePage: AdminPage;
  onNavigate: (page: AdminPage) => void;
  onBack: () => void;
  onLogout: () => void;
  userRole: UserRole | null;
  userName: string | null;
}) {
  const allowedPages: AdminPageKey[] = userRole ? (ROLE_PAGE_PERMISSIONS[userRole] || []) : [];
  const navItems = allNavItems.filter((item) => allowedPages.includes(item.key));

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: '#1B4332', color: '#ffffff' }}>
      <div className="h-16 px-5 flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
          <Leaf className="w-5 h-5" style={{ color: '#ffffff' }} />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-[15px]">GC Admin</span>
          <span className="text-[11px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>v1.0</span>
        </div>
      </div>

      <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />

      {userRole && (
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: getRoleColor(userRole) }}>
              <RoleIconDisplay role={userRole} className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{userName || 'Usuario'}</p>
              <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.6)' }}>{getRoleLabel(userRole)}</p>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        <p className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Menú principal
        </p>
        {navItems.map((item) => {
          const isActive = activePage === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] font-medium transition-all duration-150"
              style={{
                backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: isActive ? '#ffffff' : 'rgba(255,255,255,0.75)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.color = '#ffffff';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.75)';
                }
              }}
            >
              <span style={{ display: 'flex', color: 'inherit' }}>{item.icon}</span>
              <span style={{ color: 'inherit' }}>{item.label}</span>
              {isActive && <ChevronRight className="w-4 h-4 ml-auto" style={{ opacity: 0.5 }} />}
            </button>
          );
        })}
      </nav>

      <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
      <div className="p-2 space-y-0.5">
        <button
          onClick={onBack}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] font-medium transition-all"
          style={{ color: 'rgba(255,255,255,0.7)' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#ffffff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
        >
          <ExternalLink className="w-5 h-5" />
          <span>Ver sitio</span>
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] font-medium transition-all"
          style={{ color: 'rgba(252,165,165,0.9)' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.12)'; e.currentTarget.style.color = '#fecaca'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(252,165,165,0.9)'; }}
        >
          <LogOut className="w-5 h-5" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  );
}

export function AdminLayout({ children, onBack }: { children: React.ReactNode; onBack?: () => void }) {
  const { activePage, setActivePage, logout, userRole, userName } = useAdminStore();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const effectiveRole = userRole || (session?.user?.role as UserRole) || null;
  const effectiveName = userName || session?.user?.name || null;

  const navigate = useCallback((page: AdminPage) => {
    setActivePage(page);
    setMobileOpen(false);
  }, [setActivePage]);

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
      return;
    }
    logout();
    setMobileOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.delete('admin');
    window.history.replaceState({}, '', url.toString());
  }, [onBack, logout]);

  const pageTitles: Record<string, string> = {
    dashboard: 'Dashboard',
    listings: 'Anuncios',
    promotions: 'Promociones',
    users: 'Usuarios',
    categories: 'Categorías',
    payments: 'Pagos',
  };

  const pageTitle = pageTitles[activePage] || 'Dashboard';
  const displayName = effectiveName || 'Administrador';
  const displayRole = effectiveRole ? getRoleLabel(effectiveRole) : 'Administrador';

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f0f0eb' }}>
      <div
        className="fixed top-0 left-0 right-0 z-40 h-11 flex items-center justify-between px-3 lg:px-4 text-sm border-b"
        style={{ backgroundColor: '#1a1a1a', color: '#ccc', borderColor: '#333' }}
      >
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden p-1 rounded hover:bg-white/10">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-medium" style={{ color: '#fff' }}>{pageTitle}</span>
          <span className="hidden sm:inline text-xs" style={{ color: '#888' }}>— Gran Canaria Conecta</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded hover:bg-white/10 relative" title="Notificaciones">
            <Bell className="w-4 h-4" />
            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-red-500" />
          </button>
          <div className="hidden sm:block w-px h-4" style={{ backgroundColor: '#444' }} />
          <button onClick={handleBack} className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/10" title="Ver sitio">
            <ExternalLink className="w-4 h-4" />
            <span className="text-xs">Ver sitio</span>
          </button>
          <div className="w-px h-4" style={{ backgroundColor: '#444' }} />
          <div className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/10 cursor-pointer">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: effectiveRole ? getRoleColor(effectiveRole) : '#1B4332' }}>
              <RoleIconDisplay role={effectiveRole || 'ADMIN'} className="w-3.5 h-3.5" />
            </div>
            <span className="hidden sm:inline font-medium text-sm" style={{ color: '#eee' }}>{displayName}</span>
          </div>
          <button
            onClick={() => { if (onBack) { onBack(); } else { logout(); setMobileOpen(false); } }}
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/10"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 pt-11">
        <aside className="hidden lg:flex w-60 flex-shrink-0 fixed top-11 bottom-0 left-0 z-30">
          <SidebarContent activePage={activePage} onNavigate={navigate} onBack={handleBack} onLogout={logout} userRole={effectiveRole} userName={effectiveName} />
        </aside>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-72 p-0 !bg-transparent" style={{ backgroundColor: '#1B4332' }}>
            <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
            <SidebarContent activePage={activePage} onNavigate={navigate} onBack={handleBack} onLogout={logout} userRole={effectiveRole} userName={effectiveName} />
          </SheetContent>
        </Sheet>
        <div className="flex-1 lg:ml-60 flex flex-col min-h-0">
          <div className="sticky top-11 z-20 border-b bg-white/80" style={{ borderColor: '#d4ddd4', backdropFilter: 'blur(8px)' }}>
            <div className="flex items-center justify-between px-5 lg:px-6 h-14">
              <div className="flex items-center gap-2 text-[15px]">
                <span style={{ color: '#888' }}>GC Admin</span>
                <ChevronRight className="w-4 h-4" style={{ color: '#bbb' }} />
                <span className="font-semibold text-base" style={{ color: '#1B4332' }}>{pageTitle}</span>
              </div>
              <Badge variant="outline" className="text-xs font-normal" style={{ borderColor: '#d4ddd4', color: '#666' }}>{displayRole}</Badge>
            </div>
          </div>
          <main className="flex-1 p-4 lg:p-6">{children}</main>
          <footer className="border-t px-5 lg:px-6 py-3 text-xs" style={{ borderColor: '#d4ddd4', color: '#999' }}>
            © {new Date().getFullYear()} Gran Canaria Conecta · Panel de Administración
          </footer>
        </div>
      </div>
    </div>
  );
}
