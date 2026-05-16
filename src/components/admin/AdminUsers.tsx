'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/hooks/use-i18n';
import { formatNumber, getRelativeTime } from '@/lib/format';
import { toast } from 'sonner';
import { Search, Shield, ShieldOff, UserCog, ChevronLeft, ChevronRight, Crown, ShieldCheck, Eye, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import type { UserRole } from '@/lib/types';
import { ROLE_LABELS } from '@/lib/types';

const ALL_ROLES: UserRole[] = ['MEMBER', 'BUSINESS', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'];

function RoleIcon({ role, className = 'w-5 h-5' }: { role: string; className?: string }) {
  switch (role) {
    case 'SUPER_ADMIN': return <Crown className={className} />;
    case 'ADMIN': return <ShieldCheck className={className} />;
    case 'MODERATOR': return <Eye className={className} />;
    case 'BUSINESS': return <Shield className={className} />;
    default: return <ShieldOff className={className} />;
  }
}

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

  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [editRole, setEditRole] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [apiError, setApiError] = useState('');

  // Delete user state
  const [deleteUser, setDeleteUser] = useState<UserRow | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const reload = () => setRefreshKey((k) => k + 1);

  const handleDeleteUser = async () => {
    if (!deleteUser) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteUser.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error || tp('common.error'));
        setDeleteUser(null);
        setDeleteConfirm(false);
        setDeleteLoading(false);
        return;
      }
      toast.success(tp('admin.userDeleted') || 'Usuario eliminado correctamente');
      setDeleteUser(null);
      setDeleteConfirm(false);
      reload();
    } catch (err) {
      console.error('[AdminUsers delete]', err);
      toast.error(tp('common.error'));
      setDeleteUser(null);
      setDeleteConfirm(false);
    }
    setDeleteLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);
    if (roleFilter) params.set('role', roleFilter);
    (async () => {
      setLoading(true);
      setApiError('');
      try {
        const res = await fetch(`/api/admin/users?${params}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          if (res.status === 401) {
            setApiError(locale === 'es'
              ? 'Sesión de admin expirada. Vuelve a entrar al panel de administración.'
              : 'Admin session expired. Please re-enter the admin panel.');
          } else {
            setApiError(errData?.error || tp('common.error'));
          }
          if (!cancelled) { setUsers([]); setTotalPages(1); setTotal(0); }
          if (!cancelled) setLoading(false);
          return;
        }
        const data = await res.json();
        if (!cancelled) { setUsers(Array.isArray(data.data) ? data.data : []); setTotalPages(data.totalPages || 1); setTotal(data.total || 0); }
      } catch (err) { console.error('[AdminUsers load]', err); if (!cancelled) setApiError(tp('common.error')); }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [search, roleFilter, page, limit, refreshKey]);

  const handleRoleChange = async () => {
    if (!editUser || editRole === editUser.role) {
      setEditUser(null);
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${editUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: editRole }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        console.error('[AdminUsers role] API error:', res.status, data);
        toast.error(data?.error || tp('common.error'));
        setEditUser(null);
        setActionLoading(false);
        return;
      }
      setEditUser(null);
      toast.success(tp('admin.roleUpdated') || 'Rol actualizado');
      reload();
    } catch (err) {
      console.error('[AdminUsers role]', err);
      toast.error(tp('common.error'));
      setEditUser(null);
    }
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
    } catch (err) { console.error('[AdminUsers verify]', err); }
  };

  const toggleActive = async (user: UserRow) => {
    try {
      await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      reload();
    } catch (err) { console.error('[AdminUsers active]', err); }
  };

  const roleBadgeStyle = (role: string): React.CSSProperties => {
    const label = ROLE_LABELS[role as UserRole];
    if (label) {
      return { backgroundColor: label.color, color: '#ffffff' };
    }
    return { backgroundColor: '#6b7280', color: '#ffffff' };
  };

  return (
    <div className="space-y-6">
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
              {ALL_ROLES.map((r) => {
                const label = ROLE_LABELS[r];
                return (
                  <option key={r} value={r}>
                    {label ? (locale === 'es' ? label.es : label.en) : r}
                  </option>
                );
              })}
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

      {apiError && (
        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-700 dark:text-amber-300">{apiError}</p>
          <button
            onClick={reload}
            className="mt-2 text-sm font-medium text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 underline"
          >
            {locale === 'es' ? 'Reintentar' : 'Retry'}
          </button>
        </div>
      )}

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
                        <Badge className="border-transparent" style={roleBadgeStyle(user.role)}>
                          {(() => {
                            const label = ROLE_LABELS[user.role as UserRole];
                            return label ? (locale === 'es' ? label.es : label.en) : user.role;
                          })()}
                        </Badge>
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
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => { setEditUser(user); setEditRole(user.role); }}>
                            <UserCog className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => { setDeleteUser(user); setDeleteConfirm(false); }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={!!deleteUser} onOpenChange={() => { setDeleteUser(null); setDeleteConfirm(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              {tp('admin.deleteUser') || 'Eliminar usuario'}
            </DialogTitle>
          </DialogHeader>
          {deleteUser && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm font-medium">{deleteUser.name}</p>
                <p className="text-xs text-muted-foreground">{deleteUser.email}</p>
              </div>

              {!deleteConfirm ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {locale === 'es'
                      ? 'Esta acción eliminará permanentemente la cuenta del usuario y todos sus datos asociados (anuncios, mensajes, favoritos, folletos, etc.). Esta acción NO se puede deshacer.'
                      : 'This action will permanently delete the user account and all associated data (listings, messages, favorites, flyers, etc.). This action CANNOT be undone.'}
                  </p>
                  <Button
                    variant="destructive"
                    className="w-full gap-2"
                    onClick={() => setDeleteConfirm(true)}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    {locale === 'es' ? 'Sí, entiendo. Continuar' : 'Yes, I understand. Continue'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-destructive">
                    {locale === 'es'
                      ? '¿Estás completamente seguro? Escribe el nombre del usuario para confirmar:'
                      : 'Are you absolutely sure? Type the user name to confirm:'}
                  </p>
                  <Input
                    placeholder={deleteUser.name}
                    onChange={(e) => setDeleteConfirm(e.target.value === deleteUser.name ? 'confirmed' : 'typing')}
                  />
                  <p className="text-xs text-muted-foreground">
                    {locale === 'es'
                      ? `Escribe "${deleteUser.name}" para confirmar la eliminación`
                      : `Type "${deleteUser.name}" to confirm deletion`}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteUser(null); setDeleteConfirm(false); }} disabled={deleteLoading}>
              {tp('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={deleteLoading || deleteConfirm !== 'confirmed'}
              className="gap-2"
            >
              {deleteLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <Trash2 className="w-4 h-4" />
              {tp('admin.deleteUser') || 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{tp('admin.editRole')}</DialogTitle>
            <DialogDescription className="sr-only">Cambiar el rol del usuario seleccionado.</DialogDescription>
          </DialogHeader>
          {editUser && (
            <div className="space-y-4">
              <p className="text-sm">{editUser.name} <span className="text-muted-foreground">({editUser.email})</span></p>
              <div className="space-y-2">
                {ALL_ROLES.map((r) => {
                  const label = ROLE_LABELS[r];
                  const roleName = label ? (locale === 'es' ? label.es : label.en) : r;
                  const desc = label ? (locale === 'es' ? label.description.es : label.description.en) : '';
                  const isSelected = editRole === r;
                  return (
                    <button
                      key={r}
                      onClick={() => setEditRole(r)}
                      className={`w-full p-3 rounded-lg border-2 text-left transition-all flex items-start gap-3 ${
                        isSelected ? 'border-primary bg-primary/5' : 'border-transparent hover:border-muted'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        r === 'SUPER_ADMIN' ? 'bg-red-100 text-red-700 dark:bg-red-900/30' :
                        r === 'ADMIN' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' :
                        r === 'MODERATOR' ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30' :
                        r === 'BUSINESS' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-800'
                      }`}>
                        <RoleIcon role={r} className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm">{roleName}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                      </div>
                      {isSelected && <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1"><div className="w-2 h-2 rounded-full bg-primary-foreground" /></div>}
                    </button>
                  );
                })}
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
