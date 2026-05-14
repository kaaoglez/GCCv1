'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/hooks/use-i18n';
import { formatNumber, getRelativeTime } from '@/lib/format';
import { CreditCard, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';

interface PaymentRow {
  id: string;
  userName: string;
  listingTitle?: string;
  type: string;
  amount: number;
  status: string;
  provider?: string;
  createdAt: string;
}

export function AdminPayments() {
  const { tp, locale } = useI18n();
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ userId: '', listingId: '', amount: '', type: 'VIP_UPGRADE' });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (statusFilter) params.set('status', statusFilter);
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/payments?${params}`);
        const data = await res.json();
        if (!cancelled) { setPayments(data.data || []); setTotalPages(data.totalPages || 1); setTotal(data.total || 0); }
      } catch {}
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [statusFilter, page]);

  const handleCreate = async () => {
    if (!createForm.userId || !createForm.amount) return;
    setActionLoading(true);
    try {
      await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: createForm.userId,
          listingId: createForm.listingId || undefined,
          type: createForm.type,
          amount: parseFloat(createForm.amount),
          provider: 'manual',
        }),
      });
      setCreateOpen(false);
      setCreateForm({ userId: '', listingId: '', amount: '', type: 'VIP_UPGRADE' });
      setPage((p) => p);
    } catch {}
    setActionLoading(false);
  };

  const statusColor = (status: string): React.CSSProperties => {
    const colors: Record<string, { backgroundColor: string; color: string }> = {
      COMPLETED: { backgroundColor: '#059669', color: '#ffffff' },
      PENDING: { backgroundColor: '#f59e0b', color: '#ffffff' },
      REFUNDED: { backgroundColor: '#dc2626', color: '#ffffff' },
      FAILED: { backgroundColor: '#6b7280', color: '#ffffff' },
    };
    return colors[status] || colors.PENDING;
  };

  const typeColor = (type: string): React.CSSProperties => {
    const colors: Record<string, { backgroundColor: string; color: string }> = {
      LISTING_POST: { backgroundColor: '#6b7280', color: '#ffffff' },
      VIP_UPGRADE: { backgroundColor: '#f97316', color: '#ffffff' },
      HIGHLIGHT_UPGRADE: { backgroundColor: '#f59e0b', color: '#ffffff' },
      BUMP: { backgroundColor: '#0284c7', color: '#ffffff' },
      BUSINESS_PLAN: { backgroundColor: '#9333ea', color: '#ffffff' },
    };
    return colors[type] || { backgroundColor: '#6b7280', color: '#ffffff' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{tp('common.showing')} {payments.length} {tp('common.of')} {formatNumber(total, locale)}</span>
          </div>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {tp('admin.createPayment')}
        </Button>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2">
        {['', 'COMPLETED', 'PENDING', 'REFUNDED', 'FAILED'].map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setStatusFilter(s); setPage(1); }}
          >
            {s || 'Todos'}
          </Button>
        ))}
      </div>

      {/* Payments Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted text-muted-foreground">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">ID</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Usuario</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Anuncio</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipo</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Importe</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-6 w-24 rounded-full" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-6 w-20 rounded-full" /></td>
                      <td className="px-4 py-3 hidden lg:table-cell"><Skeleton className="h-4 w-24" /></td>
                    </tr>
                  ))
                : payments.length === 0
                  ? (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No hay pagos</td></tr>
                  )
                  : payments.map((payment) => (
                    <tr key={payment.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{payment.id.slice(-8)}</td>
                      <td className="px-4 py-3 font-medium">{payment.userName}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell truncate max-w-[200px]">{payment.listingTitle || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge className="border-transparent" style={typeColor(payment.type)}>{payment.type}</Badge>
                      </td>
                      <td className="px-4 py-3 font-semibold">€{formatNumber(payment.amount, locale)}</td>
                      <td className="px-4 py-3">
                        <Badge className="border-transparent" style={statusColor(payment.status)}>{payment.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{getRelativeTime(payment.createdAt, locale)}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-1">
        <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage(page - 1)}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="px-3 text-sm">{page} / {totalPages}</span>
        <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Create Payment Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{tp('admin.createPayment')}</DialogTitle>
            <DialogDescription>Registra un pago manual (efectivo, transferencia, etc.)</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-sm">ID del usuario *</Label>
              <Input value={createForm.userId} onChange={(e) => setCreateForm({ ...createForm, userId: e.target.value })} placeholder="cuid..." />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">ID del anuncio (opcional)</Label>
              <Input value={createForm.listingId} onChange={(e) => setCreateForm({ ...createForm, listingId: e.target.value })} placeholder="cuid..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-sm">Tipo</Label>
                <select
                  value={createForm.type}
                  onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
                  className="h-9 rounded-md border bg-background px-3 text-sm w-full"
                >
                  <option value="VIP_UPGRADE">VIP Upgrade</option>
                  <option value="HIGHLIGHT_UPGRADE">Highlight Upgrade</option>
                  <option value="BUMP">Bump</option>
                  <option value="BUSINESS_PLAN">Business Plan</option>
                  <option value="LISTING_POST">Listing Post</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Importe (€) *</Label>
                <Input type="number" step="0.01" value={createForm.amount} onChange={(e) => setCreateForm({ ...createForm, amount: e.target.value })} placeholder="15.00" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>{tp('common.cancel')}</Button>
            <Button onClick={handleCreate} disabled={actionLoading}>{tp('common.confirm')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
