'use client';

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedSlider } from '@/components/home/FeaturedSlider';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { LatestListings } from '@/components/home/LatestListings';
import { EventsSection } from '@/components/home/EventsSection';
import { BusinessDirectory } from '@/components/home/BusinessDirectory';
import { PricingSection } from '@/components/home/PricingSection';
import { NewsSection } from '@/components/home/NewsSection';
import { RecyclingSection } from '@/components/home/RecyclingSection';
import { CommunityStats } from '@/components/home/CommunityStats';
import { HomeModals } from '@/components/modals/HomeModals';
import { ArticleReadingView } from '@/components/modals/ArticleReadingView';
import { ListingFullView } from '@/components/modals/ListingFullView';
import { EventFullView } from '@/components/modals/EventFullView';
import { PostAdPage } from '@/components/pages/PostAdPage';
import { PromoteBusinessPage } from '@/components/pages/PromoteBusinessPage';
import { AdminPage } from '@/components/admin/AdminPage';
import { AnunciosPage } from '@/components/pages/AnunciosPage';
import { EventosPage } from '@/components/pages/EventosPage';

import { AdBannerSlot } from '@/components/shared/AdBannerSlot';
import { PageWithSidebar, MobileSidebarBanner, MobileExtraBanner } from '@/components/shared/PageWithSidebar';
import { CategoriasPage } from '@/components/pages/CategoriasPage';
import { NoticiasPage } from '@/components/pages/NoticiasPage';
import { ReciclajePage } from '@/components/pages/ReciclajePage';
import { DirectorioPage } from '@/components/pages/DirectorioPage';
import { FlyersPage } from '@/components/pages/FlyersPage';
import { MessagesPage } from '@/components/modals/MessagesPage';
import { PerfilPage } from '@/components/pages/PerfilPage';
import { MisAnunciosPage } from '@/components/pages/MisAnunciosPage';
import { MisFlyersPage } from '@/components/pages/MisFlyersPage';
import { CrearFolletoPage } from '@/components/pages/CrearFolletoPage';
import { FavoritosPage } from '@/components/pages/FavoritosPage';
import { useModalStore, __registerHistoryPush } from '@/lib/modal-store';
import { useAdminStore } from '@/lib/admin-store';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useNavigation, pushNavigationState } from '@/hooks/use-navigation';

export default function Home() {
  useNavigation();

  useEffect(() => {
    __registerHistoryPush(pushNavigationState);
  }, []);

  const { data: session, status } = useSession({ required: false });
  const isAdmin = useAdminStore((s) => s.isAdmin);
  const currentView = useModalStore((s) => s.currentView);
  const isAdminView = useModalStore((s) => s.isAdminView);
  const setAdminView = useModalStore((s) => s.setAdminView);
  const isAuthenticated = !!session?.user;

  // All hooks before any early return
  const isArticleReadingView = useModalStore((s) => s.isArticleReadingView);
  const isListingFullView = useModalStore((s) => s.isListingFullView);
  const isEventFullView = useModalStore((s) => s.isEventFullView);
  const isPostAdPage = useModalStore((s) => s.isPostAdPage);
  const isPromoteBusinessPage = useModalStore((s) => s.isPromoteBusinessPage);
  const selectedListing = useModalStore((s) => s.selectedListing);
  const selectedEvent = useModalStore((s) => s.selectedEvent);

  // When user logs out, exit admin view
  useEffect(() => {
    if (!isAuthenticated) {
      setAdminView(false);
      useAdminStore.getState().logout();
    }
  }, [isAuthenticated, setAdminView]);

  // Admin: requires both user session AND admin password
  if (isAdminView && isAdmin && isAuthenticated) {
    return <AdminPage />;
  }

  const renderMain = () => {
    if (isPostAdPage) {
      return <PostAdPage />;
    }
    if (isPromoteBusinessPage) {
      return <PromoteBusinessPage />;
    }
    // Listing full view: keep AnunciosPage mounted but hidden to preserve scroll/page state
    if (isListingFullView) {
      return (
        <>
          {currentView === 'anuncios' && (
            <div style={{ display: 'none' }} aria-hidden="true">
              <PageWithSidebar><AnunciosPage /></PageWithSidebar>
            </div>
          )}
          <ListingFullView key={`listing-${selectedListing?.id ?? 'none'}`} />
        </>
      );
    }
    // Event full view: keep EventosPage mounted but hidden
    if (isEventFullView) {
      return (
        <>
          {currentView === 'eventos' && (
            <div style={{ display: 'none' }} aria-hidden="true">
              <PageWithSidebar><EventosPage /></PageWithSidebar>
            </div>
          )}
          <EventFullView key={`event-${selectedEvent?.id ?? 'none'}`} />
        </>
      );
    }
    if (isArticleReadingView) {
      return (
        <>
          {currentView === 'news' && (
            <div style={{ display: 'none' }} aria-hidden="true">
              <PageWithSidebar><NoticiasPage /></PageWithSidebar>
            </div>
          )}
          <ArticleReadingView />
        </>
      );
    }

    if (currentView === 'home') {
      return (
        <>
          <HeroSection />
          {/* Banner slot: leaderboard after hero */}
          <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
            <AdBannerSlot position="leaderboard" variant="leaderboard" />
          </div>
          <div className="py-12 md:py-16">
            <FeaturedSlider />
          </div>
          <div className="bg-muted/30">
            <CategoryGrid />
          </div>
          {/* Banner slot: between listings and events */}
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
            <AdBannerSlot position="between_sections" variant="inline" />
          </div>
          <LatestListings />
          <div className="bg-muted/30">
            <EventsSection />
          </div>
          <BusinessDirectory />
          {/* Banner slot: sidebar style in directory area */}
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
            <AdBannerSlot position="directory" variant="inline" />
          </div>
          <PricingSection />
          <div className="bg-muted/30">
            <NewsSection />
          </div>
          <RecyclingSection />
          <CommunityStats />
        </>
      );
    }

    if (currentView === 'anuncios') return (<><PageWithSidebar><AnunciosPage /></PageWithSidebar><MobileSidebarBanner /></>);
    if (currentView === 'eventos') return (<><PageWithSidebar><EventosPage /></PageWithSidebar><MobileSidebarBanner /></>);
    if (currentView === 'news') return (<><PageWithSidebar><NoticiasPage /></PageWithSidebar><MobileSidebarBanner /></>);
    if (currentView === 'directory') return (<><PageWithSidebar extraPositions={['directory']}><DirectorioPage /></PageWithSidebar><MobileSidebarBanner /><MobileExtraBanner position="directory" /></>);
    if (currentView === 'recycling') return (<><PageWithSidebar><ReciclajePage /></PageWithSidebar><MobileSidebarBanner /></>);
    if (currentView === 'flyers') return (<><PageWithSidebar><FlyersPage /></PageWithSidebar><MobileSidebarBanner /></>);
    if (currentView === 'categorias') return (<><PageWithSidebar><CategoriasPage /></PageWithSidebar><MobileSidebarBanner /></>);
    if (currentView === 'messages') return (<><PageWithSidebar><MessagesPage /></PageWithSidebar><MobileSidebarBanner /></>);
    if (currentView === 'perfil') return (<><PageWithSidebar><PerfilPage /></PageWithSidebar><MobileSidebarBanner /></>);
    if (currentView === 'mis-anuncios') return (<><PageWithSidebar><MisAnunciosPage /></PageWithSidebar><MobileSidebarBanner /></>);
    if (currentView === 'mis-flyers') return (<><PageWithSidebar><MisFlyersPage /></PageWithSidebar><MobileSidebarBanner /></>);
    if (currentView === 'crear-folleto') return (<><PageWithSidebar><CrearFolletoPage /></PageWithSidebar><MobileSidebarBanner /></>);
    if (currentView === 'favoritos') return (<><PageWithSidebar><FavoritosPage /></PageWithSidebar><MobileSidebarBanner /></>);

    return null;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background" id="public-site">
      <Navbar />
      <main className="flex-1">{renderMain()}</main>
      <Footer />
      <HomeModals />
    </div>
  );
}
