'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/hooks/use-i18n';
import { formatNumber, getRelativeTime } from '@/lib/format';
import { Search, Shield, ShieldOff, UserCog, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import type { UserRole, PaginatedResponse } from '@/lib/types';

const ROLES: UserRole[] = ['MEMBER', 'BUSINESS', 'ADMIN'];

interface UserRow {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  municipality?: string;
  role: string;
  isVerified: boolean;
  isActive: boolean;
  businessName?: string;
  listingCount: number;
  createdAt: string;
}

export function AdminUsers() {
  const { tp, locale } = useI18n();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Edit dialog
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [editRole, setEditRole] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const reload = () => setPage((p) => p);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);
    if (roleFilter) params.set('role', roleFilter);
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/users?${params}`);
        const data = await res.json();
        if (!cancelled) { setUsers(data.data || []); setTotalPages(data.totalPages || 1); setTotal(data.total || 0); }
      } catch {}
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [search, roleFilter, page, limit]);

  const handleRoleChange = async () => {
    if (!editUser) return;
    setActionLoading(true);
    try {
      await fetch(`/api/admin/users/${editUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: editRole }),
      });
      setEditUser(null);
      reload();
    } catch {}
    setActionLoading(false);
  };

  const toggleVerified = async (user: UserRow) => {
    try {
      await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVerified: !user.isVerified }),
      });
      reload();
    } catch {}
  };

  const toggleActive = async (user: UserRow) => {
    try {
      await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      reload();
    } catch {}
  };

  const roleColor = (role: string): React.CSSProperties => {
    const colors: Record<string, { backgroundColor: string; color: string }> = {
      MEMBER: { backgroundColor: '#6b7280', color: '#ffffff' },
      BUSINESS: { backgroundColor: '#9333ea', color: '#ffffff' },
      ADMIN: { backgroundColor: '#059669', color: '#ffffff' },
    };
    return colors[role] || colors.MEMBER;
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuario..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="h-10 rounded-md border bg-background px-3 text-sm"
            >
              <option value="">Todos los roles</option>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{tp('common.showing')} {users.length} {tp('common.of')} {formatNumber(total, locale)}</span>
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

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted text-muted-foreground">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Usuario</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rol</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">{tp('admin.verified')}</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">{tp('admin.active')}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">{tp('admin.listingCount')}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">{tp('admin.joined')}</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-4 w-40" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-6 w-16 rounded-full" /></td>
                      <td className="px-4 py-3 hidden sm:table-cell"><Skeleton className="h-6 w-8 mx-auto" /></td>
                      <td className="px-4 py-3 hidden sm:table-cell"><Skeleton className="h-6 w-8 mx-auto" /></td>
                      <td className="px-4 py-3 hidden lg:table-cell"><Skeleton className="h-4 w-8" /></td>
                      <td className="px-4 py-3 hidden xl:table-cell"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-8 w-8 ml-auto" /></td>
                    </tr>
                  ))
                : users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {user.avatar ? (
                            <img src={user.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{user.name}</p>
                            {user.businessName && <p className="text-xs text-muted-foreground">{user.businessName}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{user.email}</td>
                      <td className="px-4 py-3">
                        <Badge className="border-transparent" style={roleColor(user.role)}>{user.role}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center hidden sm:table-cell">
                        <button onClick={() => toggleVerified(user)} className="inline-flex">
                          {user.isVerified
                            ? <Shield className="w-5 h-5 text-emerald-500" />
                            : <ShieldOff className="w-5 h-5 text-muted-foreground" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center hidden sm:table-cell">
                        <button onClick={() => toggleActive(user)} className="inline-flex">
                          {user.isActive
                            ? <div className="w-5 h-5 rounded-full bg-emerald-500" />
                            : <div className="w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-600" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{user.listingCount}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden xl:table-cell">{getRelativeTime(user.createdAt, locale)}</td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => { setEditUser(user); setEditRole(user.role); }}>
                          <UserCog className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{tp('admin.editRole')}</DialogTitle>
          </DialogHeader>
          {editUser && (
            <div className="space-y-3">
              <p className="text-sm">{editUser.name} <span className="text-muted-foreground">({editUser.email})</span></p>
              <div className="space-y-2">
                {ROLES.map((r) => (
                  <button
                    key={r}
                    onClick={() => setEditRole(r)}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-all flex items-center gap-3 ${
                      editRole === r ? 'border-primary bg-primary/5' : 'border-transparent hover:border-muted'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      r === 'ADMIN' ? 'bg-emerald-100 text-emerald-700' :
                      r === 'BUSINESS' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>{r[0]}</div>
                    <span className="font-medium text-sm">{r}</span>
                    {editRole === r && <div className="ml-auto w-4 h-4 rounded-full bg-primary flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-primary-foreground" /></div>}
                  </button>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>{tp('common.cancel')}</Button>
            <Button onClick={handleRoleChange} disabled={actionLoading}>{tp('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
