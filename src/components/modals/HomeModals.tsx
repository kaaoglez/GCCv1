'use client';

import { PostAdModal } from './PostAdModal';
import { ListingDetailModal } from './ListingDetailModal';
import { SearchResultsModal } from './SearchResultsModal';
import { EventDetailModal } from './EventDetailModal';
import { ArticleDetailModal } from './ArticleDetailModal';
import { AuthModal } from './AuthModal';
import { PaymentModal } from './PaymentModal';
import { MessageModal } from './MessageModal';
import { useModalStore } from '@/lib/modal-store';

export function HomeModals() {
  const selectedListing = useModalStore((s) => s.selectedListing);
  const selectedEvent = useModalStore((s) => s.selectedEvent);

  return (
    <>
      <PostAdModal />
      {/* key forces remount when listing/event changes, resetting all local state */}
      <ListingDetailModal key={`listing-${selectedListing?.id ?? 'none'}`} />
      <SearchResultsModal />
      <EventDetailModal key={`event-${selectedEvent?.id ?? 'none'}`} />
      <ArticleDetailModal />
      <AuthModal />
      <PaymentModal />
      <MessageModal />
    </>
  );
}
