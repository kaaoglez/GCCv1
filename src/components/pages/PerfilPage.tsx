'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSession, signOut } from 'next-auth/react';
import {
  Home,
  User,
  FileText,
  Heart,
  MapPin,
  Mail,
  LogOut,
  ShieldCheck,
  Edit3,
  Phone,
  Camera,
  Loader2,
  MessageSquare,
  Briefcase,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/hooks/use-i18n';
import { useModalStore } from '@/lib/modal-store';
import { navigateBack, navigateTo } from '@/hooks/use-navigation';
import { toast } from 'sonner';

// ── Helper: check if avatar URL is valid ────────────
function isValidAvatarUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  // Reject literal template strings from old backtick bug
  if (url.includes('${')) return false;
  // Must start with / and not be empty
  return url.startsWith('/');
}

// ── Profile data from API ────────────────────────────
interface ProfileData {
  name: string;
  email: string;
  phone?: string | null;
  municipality?: string | null;
  avatar?: string | null;
  role: string;
  isVerified: boolean;
  businessName?: string | null;
  businessDescription?: string | null;
  businessAddress?: string | null;
  businessPhone?: string | null;
  businessWebsite?: string | null;
  businessHours?: string | null;
}

const t = (es: string, en: string, locale: string) => (locale === 'es' ? es : en);

// ── Avatar Image Component with error fallback ───────
function AvatarImage({
  src,
  alt,
  initials,
  size = 'lg',
}: {
  src: string;
  alt: string;
  initials: string;
  size?: 'lg' | 'md';
}) {
  const [error, setError] = useState(false);
  const sizeClasses = size === 'lg' ? 'h-28 w-28' : 'h-28 w-28';

  if (error || !isValidAvatarUrl(src)) {
    return (
      <div className={`${sizeClasses} flex items-center justify-center bg-gradient-to-br from-[#1e3a5f] to-[#0ea5e9] text-white ${size === 'lg' ? 'text-2xl' : 'text-3xl'} font-bold tracking-wide`}>
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${sizeClasses} object-cover`}
      onError={() => setError(true)}
    />
  );
}

export function PerfilPage() {
  const { data: session, status, update } = useSession();
  const { locale } = useI18n();
  const { openAuth } = useModalStore();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState({ listings: 0, favorites: 0, messages: 0 });
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const fetchProfileData = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const userId = session.user.id;
      const [profileRes, listingsRes, favsRes, msgsRes] = await Promise.all([
        fetch('/api/profile'),
        fetch(`/api/listings?authorId=${userId}&limit=1`),
        fetch('/api/favorites'),
        fetch('/api/messages/unread'),
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data);
      }

      const listingsData = await listingsRes.json();
      const favsData = await favsRes.json();
      const msgsData = await msgsRes.json();

      setStats({
        listings: listingsData.total || 0,
        favorites: Array.isArray(favsData) ? favsData.length : 0,
        messages: typeof msgsData === 'number' ? msgsData : (msgsData?.count || 0),
      });
    } catch {
      if (session?.user) {
        setProfile({
          name: session.user.name || '',
          email: session.user.email || '',
          phone: null,
          municipality: null,
          avatar: session.user.image || null,
          role: (session.user as { role?: string }).role || 'MEMBER',
          isVerified: (session.user as { isVerified?: boolean }).isVerified || false,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  // Loading
  if (status === 'loading') {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-52 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // Not logged in
  if (!session) {
    return (
      <div className="w-full max-w-md mx-auto px-4 sm:px-6 py-16 text-center space-y-4">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-foreground">
          {t('Inicia sesión', 'Sign in', locale)}
        </h2>
        <p className="text-muted-foreground text-sm">
          {t('Necesitas iniciar sesión para ver tu perfil.', 'You need to sign in to view your profile.', locale)}
        </p>
        <Button onClick={openAuth} className="bg-primary hover:bg-primary/90">
          {t('Iniciar sesión', 'Sign in', locale)}
        </Button>
      </div>
    );
  }

  const user = profile || {
    name: session.user.name || '',
    email: session.user.email || '',
    phone: null,
    municipality: null,
    avatar: session.user.image || null,
    role: (session.user as { role?: string }).role || 'MEMBER',
    isVerified: (session.user as { isVerified?: boolean }).isVerified || false,
  };

  const initials = user.name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || 'U';
  const isBusiness = user.role === 'BUSINESS';
  const showAvatar = isValidAvatarUrl(user.avatar);

  const roleLabel =
    user.role === 'ADMIN'
      ? t('Administrador', 'Admin', locale)
      : user.role === 'BUSINESS'
        ? t('Negocio', 'Business', locale)
        : t('Miembro', 'Member', locale);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10"
    >
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <button onClick={() => navigateBack()} className="hover:text-primary transition-colors flex items-center gap-1">
                <Home className="size-3.5" />
                {t('Inicio', 'Home', locale)}
              </button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t('Mi Perfil', 'My Profile', locale)}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-56 w-full rounded-xl" />
          <Skeleton className="h-36 w-full rounded-xl" />
        </div>
      ) : (
        <>
          {/* ── Profile Card ─────────────────────────── */}
          <Card className="overflow-hidden border-border">
            {/* Cover — modern blue gradient */}
            <div className="relative h-32 sm:h-40 bg-gradient-to-br from-[#1e3a5f] via-[#2563eb] to-[#0ea5e9]">
              {/* Subtle decorative circles */}
              <div className="absolute top-2 right-8 h-20 w-20 rounded-full bg-white/5" />
              <div className="absolute bottom-4 right-20 h-12 w-12 rounded-full bg-white/5" />
              <div className="absolute top-6 left-16 h-16 w-16 rounded-full bg-white/5" />
            </div>
            <CardContent className="relative px-4 sm:px-6 pb-6 -mt-14">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                {/* Avatar — perfect circle */}
                <div className="relative shrink-0">
                  <button
                    onClick={() => setEditOpen(true)}
                    className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-2 rounded-full"
                    aria-label={t('Cambiar avatar', 'Change avatar', locale)}
                  >
                    <div className="h-28 w-28 rounded-full border-4 border-background shadow-xl overflow-hidden bg-card">
                      {showAvatar ? (
                        <AvatarImage src={user.avatar!} alt={user.name} initials={initials} />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-[#1e3a5f] to-[#0ea5e9] text-white text-2xl font-bold tracking-wide">
                          {initials}
                        </div>
                      )}
                    </div>
                    {/* Camera overlay */}
                    <div className="absolute bottom-1 right-1 h-9 w-9 rounded-full bg-[#2563eb] text-white flex items-center justify-center shadow-lg hover:bg-[#1d4ed8] transition-colors border-3 border-background">
                      <Camera className="size-4" />
                    </div>
                  </button>
                </div>

                {/* Info — name + details */}
                <div className="flex-1 pt-2 sm:pt-6 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground">{user.name}</h1>
                    {user.isVerified && <ShieldCheck className="size-5 text-emerald-500 shrink-0" />}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge variant="secondary">{roleLabel}</Badge>
                    {isBusiness && user.businessName && (
                      <Badge variant="outline" className="gap-1">
                        <Briefcase className="size-3" />
                        {user.businessName}
                      </Badge>
                    )}
                    {user.municipality && (
                      <Badge variant="outline" className="gap-1">
                        <MapPin className="size-3" />
                        {user.municipality}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Edit button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 sm:mt-6 gap-1.5"
                  onClick={() => setEditOpen(true)}
                >
                  <Edit3 className="size-4" />
                  {t('Editar', 'Edit', locale)}
                </Button>
              </div>

              {/* Phone */}
              {user.phone && (
                <div className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Phone className="size-3.5" />
                  <span>{user.phone}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Business Card ────────────────────────── */}
          {isBusiness && (user.businessAddress || user.businessPhone || user.businessWebsite) && (
            <Card className="mt-4 border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Briefcase className="size-4" />
                  {t('Información del negocio', 'Business Info', locale)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {user.businessAddress && (
                  <div className="flex items-start gap-2 text-foreground">
                    <MapPin className="size-4 shrink-0 mt-0.5 text-muted-foreground" />
                    <span>{user.businessAddress}</span>
                  </div>
                )}
                {user.businessPhone && (
                  <div className="flex items-center gap-2 text-foreground">
                    <Phone className="size-4 shrink-0 text-muted-foreground" />
                    <span>{user.businessPhone}</span>
                  </div>
                )}
                {user.businessWebsite && (
                  <div className="flex items-center gap-2">
                    <Mail className="size-4 shrink-0 text-muted-foreground" />
                    <a
                      href={user.businessWebsite.startsWith('http') ? user.businessWebsite : `https://${user.businessWebsite}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {user.businessWebsite}
                    </a>
                  </div>
                )}
                {user.businessDescription && (
                  <>
                    <Separator className="my-2" />
                    <p className="text-muted-foreground leading-relaxed">{user.businessDescription}</p>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── Stats ────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <button
              onClick={() => navigateTo('mis-anuncios')}
              className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-colors text-left"
            >
              <div className="flex items-center justify-center size-12 rounded-xl bg-primary/10 text-primary shrink-0">
                <FileText className="size-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.listings}</p>
                <p className="text-sm text-muted-foreground">{t('Mis anuncios', 'My listings', locale)}</p>
              </div>
            </button>

            <button
              onClick={() => navigateTo('favoritos')}
              className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-red-300 dark:hover:bg-red-950/20 transition-colors text-left"
            >
              <div className="flex items-center justify-center size-12 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-500 shrink-0">
                <Heart className="size-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.favorites}</p>
                <p className="text-sm text-muted-foreground">{t('Favoritos', 'Favorites', locale)}</p>
              </div>
            </button>

            <button
              onClick={() => navigateTo('messages')}
              className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-colors text-left"
            >
              <div className="flex items-center justify-center size-12 rounded-xl bg-primary/10 text-primary shrink-0">
                <MessageSquare className="size-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.messages}</p>
                <p className="text-sm text-muted-foreground">{t('Mensajes', 'Messages', locale)}</p>
              </div>
            </button>
          </div>

          {/* ── Logout ───────────────────────────────── */}
          <div className="mt-6">
            <Button
              variant="outline"
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
              onClick={() => {
                signOut({ redirect: false });
                useModalStore.getState().setCurrentView('home');
                window.scrollTo({ top: 0 });
              }}
            >
              <LogOut className="size-4" />
              {t('Cerrar sesión', 'Sign out', locale)}
            </Button>
          </div>
        </>
      )}

      {/* ── Edit Dialog ──────────────────────────────── */}
      {session && (
        <EditProfileDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          profile={profile || {
            name: session.user.name || '',
            email: session.user.email || '',
            phone: null,
            municipality: null,
            avatar: session.user.image || null,
            role: (session.user as { role?: string }).role || 'MEMBER',
            isVerified: (session.user as { isVerified?: boolean }).isVerified || false,
          }}
          locale={locale}
          onSaved={(newAvatarUrl) => {
            fetchProfileData();
            // Update NextAuth session with the new avatar URL
            // so the Navbar shows the avatar immediately
            if (newAvatarUrl) {
              update({ image: newAvatarUrl });
            } else {
              update();
            }
          }}
        />
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// EDIT PROFILE DIALOG — with avatar upload, email & password
// ═══════════════════════════════════════════════════════════════
function EditProfileDialog({
  open,
  onOpenChange,
  profile,
  locale,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ProfileData;
  locale: string;
  onSaved: (avatarUrl?: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Fields
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone || '');
  const [municipality, setMunicipality] = useState(profile.municipality || '');
  const [avatar, setAvatar] = useState(profile.avatar || '');
  const [avatarError, setAvatarError] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  // Business
  const [businessName, setBusinessName] = useState(profile.businessName || '');
  const [businessDescription, setBusinessDescription] = useState(profile.businessDescription || '');
  const [businessAddress, setBusinessAddress] = useState(profile.businessAddress || '');
  const [businessPhone, setBusinessPhone] = useState(profile.businessPhone || '');
  const [businessWebsite, setBusinessWebsite] = useState(profile.businessWebsite || '');
  const [businessHours, setBusinessHours] = useState(profile.businessHours || '');

  const isBusiness = profile.role === 'BUSINESS';

  // Reset on open
  useEffect(() => {
    if (open) {
      setName(profile.name);
      setEmail(profile.email);
      setPhone(profile.phone || '');
      setMunicipality(profile.municipality || '');
      setAvatar(profile.avatar || '');
      setAvatarError(false);
      setCurrentPassword('');
      setNewPassword('');
      setShowCurrentPw(false);
      setShowNewPw(false);
      setBusinessName(profile.businessName || '');
      setBusinessDescription(profile.businessDescription || '');
      setBusinessAddress(profile.businessAddress || '');
      setBusinessPhone(profile.businessPhone || '');
      setBusinessWebsite(profile.businessWebsite || '');
      setBusinessHours(profile.businessHours || '');
    }
  }, [open, profile]);

  // Upload avatar
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      toast.error(t('Solo imágenes (JPG, PNG, WebP, GIF)', 'Only images (JPG, PNG, WebP, GIF)', locale));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('Máximo 2MB', 'Max 2MB', locale));
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        setAvatar(data.url);
        setAvatarError(false);
        toast.success(t('Imagen subida', 'Image uploaded', locale));
      } else {
        const data = await res.json();
        toast.error(data.error || 'Error');
      }
    } catch {
      toast.error('Error');
    } finally {
      setUploading(false);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(t('El nombre es obligatorio', 'Name is required', locale));
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        phone: phone.trim() || null,
        municipality: municipality.trim() || null,
        avatar: avatar.trim() || null,
      };

      // Email change
      if (email.trim() !== profile.email) {
        body.email = email.trim();
      }

      // Password change
      if (currentPassword && newPassword) {
        body.currentPassword = currentPassword;
        body.newPassword = newPassword;
      } else if (currentPassword || newPassword) {
        toast.error(t('Para cambiar contraseña necesitas la actual y la nueva', 'You need both current and new password', locale));
        setSaving(false);
        return;
      }

      // Business fields
      if (isBusiness) {
        body.businessName = businessName.trim() || null;
        body.businessDescription = businessDescription.trim() || null;
        body.businessAddress = businessAddress.trim() || null;
        body.businessPhone = businessPhone.trim() || null;
        body.businessWebsite = businessWebsite.trim() || null;
        body.businessHours = businessHours.trim() || null;
      }

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(t('Perfil actualizado', 'Profile updated', locale));
        onOpenChange(false);
        // Pass the avatar URL back so the parent can update the session
        onSaved(avatar.trim() || undefined);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Error');
      }
    } catch {
      toast.error('Error');
    } finally {
      setSaving(false);
    }
  };

  const initials = name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || 'U';
  const showAvatarPreview = avatar && !avatarError && isValidAvatarUrl(avatar);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Edit3 className="size-5" />
            {t('Editar perfil', 'Edit Profile', locale)}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-5">
          {/* ── Avatar Upload ── */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="h-28 w-28 rounded-full border-4 border-[#2563eb]/20 overflow-hidden bg-card flex items-center justify-center shadow-lg">
                {showAvatarPreview ? (
                  <img
                    src={avatar}
                    alt={name}
                    className="h-full w-full object-cover"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-[#1e3a5f] to-[#0ea5e9]">
                    <span className="text-white text-3xl font-bold tracking-wide">{initials}</span>
                  </div>
                )}
              </div>
              {/* Overlay */}
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploading ? (
                  <Loader2 className="size-6 text-white animate-spin" />
                ) : (
                  <Camera className="size-6 text-white" />
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            <p className="text-xs text-muted-foreground">
              {t('Haz clic para subir una foto', 'Click to upload a photo', locale)}
            </p>
          </div>

          <Separator />

          {/* ── Personal Info ── */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('Datos personales', 'Personal Info', locale)}
            </p>

            <div className="space-y-1.5">
              <Label className="text-foreground">{t('Nombre', 'Name', locale)} <span className="text-destructive">*</span></Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder={t('Tu nombre', 'Your name', locale)} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-foreground">{t('Email', 'Email', locale)}</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="tu@email.com" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-foreground">{t('Teléfono', 'Phone', locale)}</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="+34 600 000 000" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-foreground">{t('Municipio', 'Municipality', locale)}</Label>
              <Input value={municipality} onChange={(e) => setMunicipality(e.target.value)} placeholder={t('Ej: Las Palmas de GC', 'e.g. Las Palmas de GC', locale)} />
            </div>
          </div>

          <Separator />

          {/* ── Change Password ── */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <KeyRound className="size-3" />
              {t('Cambiar contraseña', 'Change Password', locale)}
            </p>

            <div className="space-y-1.5">
              <Label className="text-foreground">{t('Contraseña actual', 'Current Password', locale)}</Label>
              <div className="relative">
                <Input
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  type={showCurrentPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-foreground">{t('Nueva contraseña', 'New Password', locale)}</Label>
              <div className="relative">
                <Input
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  type={showNewPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {newPassword && newPassword.length < 6 && (
                <p className="text-xs text-amber-500">{t('Mínimo 6 caracteres', 'Minimum 6 characters', locale)}</p>
              )}
            </div>
          </div>

          {/* ── Business Fields ── */}
          {isBusiness && (
            <>
              <Separator />
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('Datos del negocio', 'Business Info', locale)}
                </p>

                <div className="space-y-1.5">
                  <Label className="text-foreground">{t('Nombre del negocio', 'Business Name', locale)}</Label>
                  <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder={t('Mi Negocio S.L.', 'My Business LLC', locale)} />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-foreground">{t('Descripción', 'Description', locale)}</Label>
                  <textarea
                    value={businessDescription}
                    onChange={(e) => setBusinessDescription(e.target.value)}
                    placeholder={t('Describe tu negocio...', 'Describe your business...', locale)}
                    rows={2}
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-foreground">{t('Dirección', 'Address', locale)}</Label>
                  <Input value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} placeholder={t('Calle, número, ciudad', 'Street, number, city', locale)} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-foreground">{t('Teléfono', 'Phone', locale)}</Label>
                    <Input value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} type="tel" placeholder="+34 928 000 000" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-foreground">{t('Web', 'Website', locale)}</Label>
                    <Input value={businessWebsite} onChange={(e) => setBusinessWebsite(e.target.value)} type="url" placeholder="https://..." />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-foreground">{t('Horario', 'Hours', locale)}</Label>
                  <Input value={businessHours} onChange={(e) => setBusinessHours(e.target.value)} placeholder={t('Lun-Vie 9:00-18:00', 'Mon-Fri 9:00-18:00', locale)} />
                </div>
              </div>
            </>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              {t('Cancelar', 'Cancel', locale)}
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin mr-2" />}
              {t('Guardar', 'Save', locale)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
