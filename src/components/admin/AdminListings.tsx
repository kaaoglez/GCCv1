'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/hooks/use-i18n';
import { getIcon } from '@/lib/icons';
import { getRelativeTime, formatNumber } from '@/lib/format';
import {
  Search, MoreHorizontal, Trash2, Eye, Star, ArrowUpDown,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import type { ListingDTO, ListingTier, ListingStatus, PaginatedResponse, CategoryDTO } from '@/lib/types';
import { PRICING_PLANS } from '@/lib/types';

const TIERS: ListingTier[] = ['FREE', 'HIGHLIGHTED', 'VIP', 'BUSINESS'];
const STATUSES: ListingStatus[] = ['ACTIVE', 'DRAFT', 'EXPIRED', 'SOLD', 'ARCHIVED'];

export function AdminListings() {
  const { tp, locale } = useI18n();
  const [listings, setListings] = useState<ListingDTO[]>([]);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 15;

  // Dialogs
  const [selectedListing, setSelectedListing] = useState<ListingDTO | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [tierDialogOpen, setTierDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newTier, setNewTier] = useState<ListingTier>('FREE');
  const [newStatus, setNewStatus] = useState<ListingStatus>('ACTIVE');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);
    if (tierFilter) params.set('tier', tierFilter);
    if (statusFilter) params.set('status', statusFilter);
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/listings?${params}`);
        const data: PaginatedResponse<ListingDTO> = await res.json();
        if (!cancelled) { setListings(Array.isArray(data.data) ? data.data : []); setTotalPages(data.totalPages || 1); setTotal(data.total || 0); }
      } catch (err) { console.error('[AdminListings load]', err); }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [search, tierFilter, statusFilter, page, limit]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/categories?locale=' + locale)
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setCategories(data); })
      .catch((err) => console.error('[AdminListings categories]', err));
    return () => { cancelled = true; };
  }, [locale]);

  const reload = () => setPage((p) => p);

  const handleTierChange = async () => {
    if (!selectedListing) return;
    setActionLoading(true);
    try {
      await fetch(`/api/admin/listings/${selectedListing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: newTier }),
      });
      setTierDialogOpen(false);
      reload();
    } catch (err) { console.error('[AdminListings tier]', err); }
    setActionLoading(false);
  };

  const handleStatusChange = async () => {
    if (!selectedListing) return;
    setActionLoading(true);
    try {
      await fetch(`/api/admin/listings/${selectedListing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      setDetailOpen(false);
      reload();
    } catch (err) { console.error('[AdminListings status]', err); }
    setActionLoading(false);
  };

  const handleDelete = async () => {
    if (!selectedListing) return;
    setActionLoading(true);
    try {
      await fetch(`/api/admin/listings/${selectedListing.id}`, { method: 'DELETE' });
      setDeleteDialogOpen(false);
      reload();
    } catch (err) { console.error('[AdminListings delete]', err); }
    setActionLoading(false);
  };

  const tierBadge = (tier: string): React.CSSProperties => {
    const colors: Record<string, { backgroundColor: string; color: string }> = {
      FREE: { backgroundColor: '#6b7280', color: '#ffffff' },
      HIGHLIGHTED: { backgroundColor: '#f59e0b', color: '#ffffff' },
      VIP: { backgroundColor: '#f97316', color: '#ffffff' },
      BUSINESS: { backgroundColor: '#9333ea', color: '#ffffff' },
    };
    return colors[tier] || colors.FREE;
  };

  const statusBadge = (status: string): React.CSSProperties => {
    const colors: Record<string, { backgroundColor: string; color: string }> = {
      ACTIVE: { backgroundColor: '#059669', color: '#ffffff' },
      DRAFT: { backgroundColor: '#6b7280', color: '#ffffff' },
      EXPIRED: { backgroundColor: '#f59e0b', color: '#ffffff' },
      SOLD: { backgroundColor: '#2563eb', color: '#ffffff' },
      ARCHIVED: { backgroundColor: '#dc2626', color: '#ffffff' },
    };
    return colors[status] || colors.DRAFT;
  };

  const currentPlan = PRICING_PLANS.find((p) => p.id === newTier);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={tp('admin.searchListing')}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>
            <select
              value={tierFilter}
              onChange={(e) => { setTierFilter(e.target.value); setPage(1); }}
              className="h-10 rounded-md border bg-background px-3 text-sm"
            >
              <option value="">{tp('admin.allTiers')}</option>
              {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="h-10 rounded-md border bg-background px-3 text-sm"
            >
              <option value="">{tp('admin.allStatuses')}</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Results info */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{tp('common.showing')} {listings.length} {tp('common.of')} {formatNumber(total, locale)}</span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="px-2">{page} / {totalPages}</span>
          <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Listings Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted text-muted-foreground">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground min-w-[250px]">{tp('form.title')}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">{tp('form.category')}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tier</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">{tp('listings.views')}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">Fecha</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground w-12"></th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-4 py-3"><Skeleton className="h-4 w-48" /></td>
                      <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-6 w-16 rounded-full" /></td>
                      <td className="px-4 py-3 hidden sm:table-cell"><Skeleton className="h-6 w-16 rounded-full" /></td>
                      <td className="px-4 py-3 hidden lg:table-cell"><Skeleton className="h-4 w-10" /></td>
                      <td className="px-4 py-3 hidden xl:table-cell"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-8 w-8" /></td>
                    </tr>
                  ))
                : listings.length === 0
                  ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                        {tp('admin.noListings')}
                      </td>
                    </tr>
                  )
                  : listings.map((listing) => (
                    <tr key={listing.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {listing.images[0] ? (
                            <img src={listing.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                              {getIcon(listing.category?.icon || 'circle', 'w-4 h-4 text-muted-foreground')}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium truncate max-w-[220px]">{listing.title}</p>
                            <p className="text-xs text-muted-foreground md:hidden">
                              {locale === 'es' ? listing.category?.nameEs : listing.category?.nameEn}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {locale === 'es' ? listing.category?.nameEs : listing.category?.nameEn}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className="border-transparent" style={tierBadge(listing.tier)}>
                          {listing.tier}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <Badge className="border-transparent" style={statusBadge(listing.status)}>
                          {listing.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{formatNumber(listing.viewCount, locale)}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden xl:table-cell">
                        {getRelativeTime(listing.createdAt, locale)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setSelectedListing(listing); setDetailOpen(true); }}>
                              <Eye className="w-4 h-4 mr-2" /> {tp('admin.viewDetails')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSelectedListing(listing); setNewTier(listing.tier); setTierDialogOpen(true); }}>
                              <Star className="w-4 h-4 mr-2" /> {tp('admin.changeTier')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => { setSelectedListing(listing); setDeleteDialogOpen(true); }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> {tp('common.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedListing?.title}</DialogTitle>
            <DialogDescription>
              {locale === 'es' ? selectedListing?.category?.nameEs : selectedListing?.category?.nameEn}
            </DialogDescription>
          </DialogHeader>
          {selectedListing && (
            <div className="space-y-4">
              {selectedListing.images[0] && (
                <img src={selectedListing.images[0]} alt="" className="w-full rounded-lg object-cover max-h-60" />
              )}
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedListing.description}</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Tier: </span><Badge className="border-transparent" style={tierBadge(selectedListing.tier)}>{selectedListing.tier}</Badge></div>
                <div><span className="text-muted-foreground">Estado: </span><Badge className="border-transparent" style={statusBadge(selectedListing.status)}>{selectedListing.status}</Badge></div>
                <div><span className="text-muted-foreground">{tp('listings.views')}: </span>{formatNumber(selectedListing.viewCount, locale)}</div>
                <div><span className="text-muted-foreground">{tp('listings.by')}: </span>{selectedListing.author?.name}</div>
                {selectedListing.municipality && (
                  <div><span className="text-muted-foreground">📍 </span>{selectedListing.municipality}</div>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as ListingStatus)}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <Button onClick={handleStatusChange} disabled={actionLoading}>
              {tp('admin.changeStatus')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tier Change Dialog */}
      <Dialog open={tierDialogOpen} onOpenChange={setTierDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{tp('admin.changeTier')}</DialogTitle>
            <DialogDescription>{selectedListing?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {TIERS.map((t) => {
              const plan = PRICING_PLANS.find((p) => p.id === t);
              const isSelected = newTier === t;
              return (
                <button
                  key={t}
                  onClick={() => setNewTier(t)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-transparent hover:border-muted'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: plan?.color + '20', color: plan?.color }}
                  >
                    {getIcon('circle', 'w-4 h-4')}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm">{locale === 'es' ? plan?.nameEs : plan?.nameEn}</p>
                    <p className="text-xs text-muted-foreground">
                      {plan?.price === 0 ? tp('pricing.free') : `€${plan?.price}`}
                      {t === 'BUSINESS' ? ` ${tp('pricing.monthly')}` : ` ${tp('pricing.perPost')}`}
                    </p>
                  </div>
                  {isSelected && <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-primary-foreground" /></div>}
                </button>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTierDialogOpen(false)}>{tp('common.cancel')}</Button>
            <Button onClick={handleTierChange} disabled={actionLoading || newTier === selectedListing?.tier}>
              {tp('admin.applyPromotion')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{tp('admin.deleteListing')}</DialogTitle>
            <DialogDescription>{tp('admin.confirmDelete')}</DialogDescription>
          </DialogHeader>
          {selectedListing && (
            <p className="font-medium text-sm">"{selectedListing.title}"</p>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>{tp('common.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={actionLoading}>{tp('common.delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
