'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import { useSession, signOut } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  Leaf,
  Sun,
  Moon,
  Globe,
  Plus,
  Menu,
  Home,
  LogOut,
  User,
  FileText,
  Heart,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/hooks/use-i18n';
import { NAV_ITEMS, APP_CONFIG } from '@/lib/constants';
import { useAdminStore } from '@/lib/admin-store';
import { useModalStore, type PageView } from '@/lib/modal-store';
import { navigateTo, navigateToSameOrHome } from '@/hooks/use-navigation';

/* ── Hydration-safe client check via useSyncExternalStore ─────────── */
const emptySubscribe = () => () => {};
function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

/* ── Theme Toggle (separate component to avoid hydration mismatch) ─── */
function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = useIsMounted();

  const isDark = mounted && (resolvedTheme === 'dark');

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className={className}
      aria-label="Toggle theme"
    >
      {mounted ? (
        isDark ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )
      ) : (
        /* Render a placeholder with the same dimensions during SSR */
        <div className="h-4 w-4" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

/* ── Unread messages count ────────────────────────── */
function useUnreadCount() {
  const [count, setCount] = useState(0);
  const session = useSession();
  useEffect(() => {
    if (!session.data?.user?.id) return;
    let active = true;
    async function fetchCount() {
      try {
        const res = await fetch('/api/messages/unread');
        if (res.ok) { const data = await res.json(); if (active) setCount(data.count || 0); }
      } catch { /* ignore */ }
    }
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => { active = false; clearInterval(interval); };
  }, [session.data?.user?.id]);
  return count;
}

/* ── User Menu (shown when logged in) ────────────────────── */
function UserMenu() {
  const { data: session } = useSession();
  const { locale, tp } = useI18n();
  const openAuth = useModalStore((s) => s.openAuth);
  const unreadCount = useUnreadCount();

  if (!session?.user) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-primary"
        onClick={openAuth}
      >
        {tp('nav', 'login')}
      </Button>
    );
  }

  const user = session.user;
  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 px-2 text-muted-foreground hover:text-foreground"
        >
          <Avatar className="h-7 w-7">
            {user.image && <AvatarImage src={user.image} alt={user.name} />}
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden md:inline-block text-sm font-medium max-w-[120px] truncate">
            {user.name}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {/* User info header */}
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium truncate">{user.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => navigateTo('perfil')}>
          <User className="h-4 w-4" />
          {tp('auth', 'myProfile')}
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => navigateTo('mis-anuncios')}>
          <FileText className="h-4 w-4" />
          {tp('auth', 'myListings')}
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => navigateTo('favoritos')}>
          <Heart className="h-4 w-4" />
          {locale === 'es' ? 'Favoritos' : 'Favorites'}
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => navigateTo('messages')}>
          <Mail className="h-4 w-4" />
          {locale === 'es' ? 'Mensajes' : 'Messages'}
          {unreadCount > 0 && (
            <span className="ml-auto flex items-center justify-center size-5 rounded-full bg-red-500 text-white text-xs font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer gap-2 text-destructive focus:text-destructive"
          onClick={() => { signOut({ redirect: false }); useModalStore.getState().setCurrentView('home'); window.scrollTo({ top: 0 }); }}
        >
          <LogOut className="h-4 w-4" />
          {tp('auth', 'logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ── Mapping from navKeys index to PageView ─────────────────────── */
const NAV_KEY_TO_VIEW: PageView[] = [
  'anuncios',   // ads
  'categorias', // categories
  'eventos',    // events
  'news',       // news
  'directory',  // directory
  'recycling',  // recycling
];

/* ── Navbar ───────────────────────────────────────────────────────── */
export function Navbar() {
  const { locale, toggleLocale, tp } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentView = useModalStore((s) => s.currentView);
  const openAuth = useModalStore((s) => s.openAuth);
  const { data: session } = useSession();
  const unreadCount = useUnreadCount();

  // Scroll detection via event subscription (proper effect usage)
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial scroll position
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

  const handleNavClick = (index: number) => {
    const view = NAV_KEY_TO_VIEW[index];
    if (!view) return;
    navigateTo(view);
    closeMobile();
  };

  const handleHomeClick = () => {
    navigateToSameOrHome('home');
    closeMobile();
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'bg-background/80 backdrop-blur-lg border-b border-border shadow-sm'
          : 'bg-background border-b border-transparent'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* ── Logo ──────────────────────────────────────── */}
        <button
          onClick={handleHomeClick}
          className="flex items-center gap-2 group"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform group-hover:scale-105">
            <Leaf className="h-5 w-5" />
          </div>
          <span className="hidden sm:inline-block font-heading font-bold text-lg text-primary">
            {APP_CONFIG.name}
          </span>
        </button>

        {/* ── Desktop Nav Links ──────────────────────────── */}
        <div className="hidden lg:flex items-center gap-1">
          {currentView !== 'home' && (
            <button
              onClick={handleHomeClick}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors rounded-md hover:bg-muted flex items-center gap-1.5"
            >
              <Home className="size-3.5" />
              {tp('common', 'home')}
            </button>
          )}
          {NAV_ITEMS.map((item, index) => (
            <button
              key={index}
              onClick={() => handleNavClick(index)}
              className={`px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-muted ${
                currentView === NAV_KEY_TO_VIEW[index]
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-primary'
              }`}
            >
              {item[locale]}
            </button>
          ))}
        </div>

        {/* ── Desktop Right Actions ──────────────────────── */}
        <div className="hidden lg:flex items-center gap-2">
          {/* Language Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLocale}
            className="gap-1.5 text-muted-foreground hover:text-primary"
          >
            <Globe className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase">
              {locale === 'es' ? 'EN' : 'ES'}
            </span>
          </Button>

          {/* Theme Toggle */}
          <ThemeToggle className="text-muted-foreground hover:text-primary" />

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Messages button with badge */}
          {session?.user && (
            <Button
              variant="ghost"
              size="icon"
              className="relative text-muted-foreground hover:text-primary"
              onClick={() => navigateTo('messages')}
              title={locale === 'es' ? 'Mensajes' : 'Messages'}
            >
              <Mail className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center size-4 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          )}

          {/* Favorites button */}
          {session?.user && (
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-primary"
              onClick={() => navigateTo('favoritos')}
              title={locale === 'es' ? 'Favoritos' : 'Favorites'}
            >
              <Heart className="h-4 w-4" />
            </Button>
          )}

          {/* Login / User Menu */}
          <UserMenu />

          {/* CTA: Post Ad */}
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 font-semibold shadow-sm"
            onClick={() => {
              if (!session?.user) {
                openAuth();
                return;
              }
              useModalStore.getState().openPostAd();
            }}
          >
            <Plus className="h-4 w-4" />
            {tp('nav', 'postAd')}
          </Button>
        </div>

        {/* ── Mobile Actions ────────────────────────────── */}
        <div className="flex lg:hidden items-center gap-1.5">
          {/* Language Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLocale}
            className="text-muted-foreground hover:text-primary px-2"
          >
            <Globe className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase">
              {locale === 'es' ? 'EN' : 'ES'}
            </span>
          </Button>

          {/* Theme Toggle */}
          <ThemeToggle className="text-muted-foreground hover:text-primary" />

          {/* Mobile Menu Sheet */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0">
              <SheetTitle className="sr-only">
                Menú de navegación
              </SheetTitle>
              <div className="flex flex-col h-full">
                {/* Mobile Header */}
                <div className="flex items-center justify-between px-4 py-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Leaf className="h-4 w-4" />
                    </div>
                    <span className="font-heading font-bold text-primary">
                      {APP_CONFIG.name}
                    </span>
                  </div>
                </div>

                {/* Mobile Nav Links */}
                <div className="flex-1 overflow-y-auto py-4">
                  <div className="space-y-1 px-2">
                    {/* Home button when not on home */}
                    {currentView !== 'home' && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <button
                          onClick={handleHomeClick}
                          className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium text-primary hover:bg-muted rounded-lg transition-colors"
                        >
                          <Home className="size-4" />
                          {tp('common', 'home')}
                        </button>
                      </motion.div>
                    )}

                    {NAV_ITEMS.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (currentView !== 'home' ? 1 : 0) + index * 0.05 }}
                      >
                        <button
                          onClick={() => handleNavClick(index)}
                          className={`flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                            currentView === NAV_KEY_TO_VIEW[index]
                              ? 'text-primary bg-muted'
                              : 'text-foreground hover:text-primary hover:bg-muted'
                          }`}
                        >
                          {item[locale]}
                        </button>
                      </motion.div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  {/* Auth Links */}
                  <div className="space-y-1 px-2">
                    {session?.user ? (
                      <>
                        <div className="flex items-center gap-2 px-3 py-2.5">
                          <Avatar className="h-8 w-8">
                            {session.user.image && (
                              <AvatarImage src={session.user.image} alt={session.user.name} />
                            )}
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                              {session.user.name
                                ?.split(' ')
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join('')
                                .toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {session.user.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {session.user.email}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => { closeMobile(); navigateTo('perfil'); }}
                          className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium text-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors"
                        >
                          <User className="size-4" />
                          {tp('auth', 'myProfile')}
                        </button>
                        <button
                          onClick={() => { closeMobile(); navigateTo('mis-anuncios'); }}
                          className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium text-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors"
                        >
                          <FileText className="size-4" />
                          {tp('auth', 'myListings')}
                        </button>
                        <button
                          onClick={() => { closeMobile(); navigateTo('favoritos'); }}
                          className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium text-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors"
                        >
                          <Heart className="size-4" />
                          {locale === 'es' ? 'Favoritos' : 'Favorites'}
                        </button>
                        <button
                          onClick={() => { closeMobile(); navigateTo('messages'); }}
                          className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium text-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors"
                        >
                          <Mail className="size-4" />
                          {locale === 'es' ? 'Mensajes' : 'Messages'}
                          {unreadCount > 0 && (
                            <span className="ml-auto flex items-center justify-center size-5 rounded-full bg-red-500 text-white text-xs font-bold">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => { closeMobile(); signOut({ redirect: false }); useModalStore.getState().setCurrentView('home'); window.scrollTo({ top: 0 }); }}
                          className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        >
                          <LogOut className="size-4" />
                          {tp('auth', 'logout')}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          closeMobile();
                          openAuth();
                        }}
                        className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors"
                      >
                        {tp('nav', 'login')}
                      </button>
                    )}
                  </div>
                </div>

                {/* Mobile Footer CTA */}
                <div className="p-4 border-t border-border">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-semibold shadow-sm" onClick={() => {
                    if (!session?.user) {
                      openAuth();
                      return;
                    }
                    useModalStore.getState().openPostAd();
                  }}>
                    <Plus className="h-4 w-4" />
                    {tp('nav', 'postAd')}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
