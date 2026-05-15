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
import { AdminPage } from '@/components/admin/AdminPage';
import { AnunciosPage } from '@/components/pages/AnunciosPage';
import { EventosPage } from '@/components/pages/EventosPage';

import { CategoriasPage } from '@/components/pages/CategoriasPage';
import { NoticiasPage } from '@/components/pages/NoticiasPage';
import { ReciclajePage } from '@/components/pages/ReciclajePage';
import { DirectorioPage } from '@/components/pages/DirectorioPage';
import { MessagesPage } from '@/components/modals/MessagesPage';
import { PerfilPage } from '@/components/pages/PerfilPage';
import { MisAnunciosPage } from '@/components/pages/MisAnunciosPage';
import { FavoritosPage } from '@/components/pages/FavoritosPage';
import { useModalStore, __registerHistoryPush } from '@/lib/modal-store';
import { useAdminStore } from '@/lib/admin-store';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useNavigation, pushNavigationState } from '@/hooks/use-navigation';

export default function Home() {
  useNavigation(); // Initialize browser history sync

  // Register history push function with the store
  useEffect(() => {
    __registerHistoryPush(pushNavigationState);
  }, []);

  const searchParams = useSearchParams();
  const isAdmin = useAdminStore((s) => s.isAdmin);
  const currentView = useModalStore((s) => s.currentView);
  const isAdminView = useModalStore((s) => s.isAdminView);
  const setAdminView = useModalStore((s) => s.setAdminView);
  const isArticleReadingView = useModalStore((s) => s.isArticleReadingView);
  const isListingFullView = useModalStore((s) => s.isListingFullView);
  const isEventFullView = useModalStore((s) => s.isEventFullView);
  const selectedListing = useModalStore((s) => s.selectedListing);
  const selectedEvent = useModalStore((s) => s.selectedEvent);

  useEffect(() => {
    const shouldShow = searchParams.get('admin') === '1' || isAdmin;
    if (shouldShow) setAdminView(true);
  }, [searchParams, isAdmin, setAdminView]);

  // Admin logged in: full page, no Navbar/Footer
  if (isAdminView && isAdmin) {
    return <AdminPage />;
  }

  const renderMain = () => {
    if (isListingFullView) {
      return <ListingFullView key={`listing-${selectedListing?.id ?? 'none'}`} />;
    }
    if (isEventFullView) {
      return <EventFullView key={`event-${selectedEvent?.id ?? 'none'}`} />;
    }
    if (isArticleReadingView) {
      return <ArticleReadingView />;
    }

    if (currentView === 'home') {
      return (
        <>
          <HeroSection />
          <div className="py-12 md:py-16">
            <FeaturedSlider />
          </div>
          <div className="bg-muted/30">
            <CategoryGrid />
          </div>
          <LatestListings />
          <div className="bg-muted/30">
            <EventsSection />
          </div>
          <BusinessDirectory />
          <PricingSection />
          <div className="bg-muted/30">
            <NewsSection />
          </div>
          <RecyclingSection />
          <CommunityStats />
        </>
      );
    }

    if (currentView === 'anuncios') return <AnunciosPage />;
    if (currentView === 'eventos') return <EventosPage />;
    if (currentView === 'news') return <NoticiasPage />;
    if (currentView === 'directory') return <DirectorioPage />;
    if (currentView === 'recycling') return <ReciclajePage />;
    if (currentView === 'categorias') return <CategoriasPage />;
    if (currentView === 'messages') return <MessagesPage />;
    if (currentView === 'perfil') return <PerfilPage />;
    if (currentView === 'mis-anuncios') return <MisAnunciosPage />;
    if (currentView === 'favoritos') return <FavoritosPage />;

    return null;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background" id="public-site">
      <Navbar />
      <main className="flex-1">{renderMain()}</main>
      <Footer />
      <HomeModals />
      {isAdminView && <AdminPage />}
    </div>
  );
}
