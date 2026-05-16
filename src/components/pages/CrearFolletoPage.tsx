// ═══════════════════════════════════════════════════════════════
// GRAN CANARIA CONECTA - CrearFolletoPage
// Full page for creating/editing a business flyer
// ═══════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import {
  Home,
  Megaphone,
  FileText,
  ImageIcon,
  Upload,
  X,
  Check,
  Loader2,
  ShieldCheck,
  Phone,
  Mail,
  Globe,
  MapPin,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useI18n } from '@/hooks/use-i18n';
import { navigateTo, navigateBack } from '@/hooks/use-navigation';
import { useModalStore } from '@/lib/modal-store';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  FLYER_CATEGORIES,
  FLYER_PLANS,
  MUNICIPALITIES,
  type FlyerDTO,
  type FlyerCategory,
  type FlyerTier,
  Locale,
} from '@/lib/types';

// ─── DB plan type (from /api/flyer-plans) ─────────────────
interface DBFlyerPlan {
  id: FlyerTier;
  nameEs: string;
  nameEn: string;
  price: number;
  priceLabelEs: string;
  priceLabelEn: string;
  badgeEs: string;
  badgeEn: string;
  color: string;
  featuresEs: string[];
  featuresEn: string[];
  flyersPerWeek: number;
  isPopular: boolean;
}

// ─────────────────────────────────────────────────────────────
// Constants & helpers
// ─────────────────────────────────────────────────────────────

const FLYER_CATEGORY_KEYS: FlyerCategory[] = [
  'SUPERMARKET', 'RESTAURANT', 'FASHION', 'ELECTRONICS', 'HOME',
  'BEAUTY', 'SPORTS', 'PHARMACY', 'AUTOMOTIVE', 'SERVICES', 'OTHER',
];

const MAX_FILE_SIZE_MB = 10;

/** Inline i18n helper */
function t(es: string, en: string, locale: Locale): string {
  return locale === 'es' ? es : en;
}

interface FormErrors {
  title?: string;
  category?: string;
  validFrom?: string;
  image?: string;
}

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

export function CrearFolletoPage() {
  const { data: session, status } = useSession();
  const { locale } = useI18n();
  const editingFlyerId = useModalStore((s) => s.editingFlyerId);

  // ── Form state ────────────────────────────────────────────
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [tier, setTier] = useState<FlyerTier>('BASIC');
  const [businessName, setBusinessName] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessWebsite, setBusinessWebsite] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [municipality, setMunicipality] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loadingFlyer, setLoadingFlyer] = useState(false);
  const [editFlyerData, setEditFlyerData] = useState<FlyerDTO | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDragging = useRef(false);
  const [dragOver, setDragOver] = useState(false);

  const isEditing = !!editingFlyerId;

  // ── Fetch plans from database ────────────────────────────
  const [dbPlans, setDbPlans] = useState<DBFlyerPlan[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/flyer-plans');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setDbPlans(data);
          }
        }
      } catch { /* fallback to FLYER_PLANS */ }
    })();
  }, []);

  // Use DB plans if available, fallback to hardcoded
  const plans = dbPlans.length > 0 ? dbPlans : FLYER_PLANS;

  // ── Fetch existing flyer data when editing ────────────────
  useEffect(() => {
    if (editingFlyerId) {
      const loadFlyer = async () => {
        setLoadingFlyer(true);
        try {
          const res = await fetch(`/api/flyers?id=${editingFlyerId}&mine=true`);
          if (res.ok) {
            const data = await res.json();
            const flyer = data.data || data;
            if (flyer) {
              setEditFlyerData(flyer);
              setTitle(flyer.title);
              setDescription(flyer.description || '');
              setCategory(flyer.category);
              setValidFrom(flyer.validFrom ? flyer.validFrom.split('T')[0] : '');
              setValidUntil(flyer.validUntil ? flyer.validUntil.split('T')[0] : '');
              setTier(flyer.tier);
              setBusinessName(flyer.businessName);
              setBusinessPhone(flyer.businessPhone || '');
              setBusinessEmail(flyer.businessEmail || '');
              setBusinessWebsite(flyer.businessWebsite || '');
              setBusinessAddress(flyer.businessAddress || '');
              setMunicipality(flyer.municipality || '');
              setImageFile(null);
              setImagePreview(flyer.thumbnail || flyer.image);
              setErrors({});
            }
          } else {
            toast.error(t('Error al cargar el folleto', 'Error loading flyer', locale));
            navigateTo('mis-flyers');
          }
        } catch {
          toast.error(t('Error de conexión', 'Connection error', locale));
          navigateTo('mis-flyers');
        } finally {
          setLoadingFlyer(false);
        }
      };
      loadFlyer();
    } else {
      // New flyer — pre-fill from session
      setTitle('');
      setDescription('');
      setCategory('');
      setValidFrom(new Date().toISOString().split('T')[0]);
      setValidUntil('');
      setTier('BASIC');
      setBusinessName(session?.user?.businessName || session?.user?.name || '');
      setBusinessPhone('');
      setBusinessEmail(session?.user?.email || '');
      setBusinessWebsite('');
      setBusinessAddress('');
      setMunicipality('');
      setImageFile(null);
      setImagePreview('');
      setErrors({});
    }
  }, [editingFlyerId]);

  // ── i18n labels ───────────────────────────────────────────
  const l = useMemo(() => ({
    pageTitle: isEditing
      ? t('Editar Folleto', 'Edit Flyer', locale)
      : t('Crear Folleto', 'Create Flyer', locale),
    pageDesc: isEditing
      ? t('Modifica los datos de tu folleto.', 'Update your flyer details.', locale)
      : t('Completa el formulario para publicar tu folleto.', 'Fill in the form to publish your flyer.', locale),
    breadcrumbMisFlyers: t('Mis Folletos', 'My Flyers', locale),
    breadcrumbCurrent: isEditing
      ? t('Editar Folleto', 'Edit Flyer', locale)
      : t('Crear Folleto', 'Create Flyer', locale),
    cancel: t('Cancelar', 'Cancel', locale),
    sectionInfo: t('Información del Folleto', 'Flyer Information', locale),
    sectionPlan: t('Plan del Folleto', 'Flyer Plan', locale),
    sectionImage: t('Imagen del Folleto', 'Flyer Image', locale),
    sectionContact: t('Contacto del Negocio', 'Business Contact', locale),
    titleLabel: t('Título', 'Title', locale),
    titlePlaceholder: t('Ej: Ofertas de Navidad', 'e.g. Christmas Offers', locale),
    titleRequired: t('El título es obligatorio', 'Title is required', locale),
    descriptionLabel: t('Descripción', 'Description', locale),
    descriptionPlaceholder: t(
      'Describe brevemente tu oferta o promoción...',
      'Briefly describe your offer or promotion...',
      locale,
    ),
    categoryLabel: t('Categoría', 'Category', locale),
    categoryPlaceholder: t('Selecciona una categoría', 'Select a category', locale),
    categoryRequired: t('La categoría es obligatoria', 'Category is required', locale),
    validFromLabel: t('Válido desde', 'Valid from', locale),
    validUntilLabel: t('Válido hasta', 'Valid until', locale),
    validFromRequired: t('La fecha de inicio es obligatoria', 'Start date is required', locale),
    municipalityLabel: t('Municipio', 'Municipality', locale),
    municipalityPlaceholder: t('Selecciona un municipio', 'Select a municipality', locale),
    phoneLabel: t('Teléfono', 'Phone', locale),
    phonePlaceholder: t('+34 600 000 000', '+34 600 000 000', locale),
    emailLabel: t('Correo electrónico', 'Email', locale),
    emailPlaceholder: t('info@minegocio.com', 'info@mybusiness.com', locale),
    websiteLabel: t('Sitio web', 'Website', locale),
    websitePlaceholder: t('https://www.minegocio.com', 'https://www.mybusiness.com', locale),
    addressLabel: t('Dirección', 'Address', locale),
    addressPlaceholder: t('Calle Principal, 123', 'Main Street, 123', locale),
    businessNameLabel: t('Nombre del negocio', 'Business name', locale),
    businessNamePlaceholder: t('Mi Negocio S.L.', 'My Business LLC', locale),
    dragDrop: t('Arrastra tu imagen aquí', 'Drag your image here', locale),
    or: t('o', 'or', locale),
    browse: t('Busca en tu dispositivo', 'Browse your device', locale),
    maxSize: t(`(máx. ${MAX_FILE_SIZE_MB}MB)`, `(max ${MAX_FILE_SIZE_MB}MB)`, locale),
    imageRequired: t('La imagen es obligatoria', 'Image is required', locale),
    imageUploading: t('Subiendo imagen...', 'Uploading image...', locale),
    save: isEditing ? t('Guardar cambios', 'Save changes', locale) : t('Crear Folleto', 'Create Flyer', locale),
    saving: t('Guardando...', 'Saving...', locale),
    popular: t('Popular', 'Popular', locale),
    perMonth: t('/mes', '/month', locale),
    featureWeek: t('folleto por semana', 'flyer per week', locale),
    flyersPerWeek: t('folletos por semana', 'flyers per week', locale),
    appearsIn: t('Aparece en la sección de ofertas', 'Appears in the offers section', locale),
    basicStats: t('Estadísticas básicas', 'Basic statistics', locale),
    preferredPos: t('Posición preferente', 'Preferred position', locale),
    inNewsletter: t('Aparece en el newsletter', 'Appears in the newsletter', locale),
    featuredBadge: t('Badge "Oferta destacada"', '"Featured offer" badge', locale),
    newsletterBanner: t('Banner en el newsletter', 'Newsletter banner', locale),
    advancedStats: t('Estadísticas avanzadas', 'Advanced statistics', locale),
    prioritySupport: t('Soporte prioritario', 'Priority support', locale),
    premiumBadge: t('Badge "Premium"', '"Premium" badge', locale),
    changeImage: t('Cambiar imagen', 'Change image', locale),
    removeImage: t('Eliminar imagen', 'Remove image', locale),
    errorSaving: t('Error al guardar el folleto', 'Error saving flyer', locale),
    successCreate: t('¡Folleto creado con éxito!', 'Flyer created successfully!', locale),
    successUpdate: t('Folleto actualizado con éxito', 'Flyer updated successfully', locale),
    errorUploading: t('Error al subir la imagen', 'Error uploading image', locale),
    fileSizeError: t(
      `El archivo excede el límite de ${MAX_FILE_SIZE_MB}MB`,
      `File exceeds ${MAX_FILE_SIZE_MB}MB limit`,
      locale,
    ),
    fileTypeError: t(
      'Solo se permiten imágenes (JPG, PNG, WebP)',
      'Only images allowed (JPG, PNG, WebP)',
      locale,
    ),
  }), [locale, isEditing]);

  // ── Validation ────────────────────────────────────────────
  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!title.trim()) e.title = l.titleRequired;
    if (!category) e.category = l.categoryRequired;
    if (!validFrom) e.validFrom = l.validFromRequired;
    if (!imageFile && !imagePreview) e.image = l.imageRequired;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Image handling ────────────────────────────────────────
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error(l.fileTypeError);
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(l.fileSizeError);
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, image: undefined }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    isDragging.current = false;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isDragging.current) {
      isDragging.current = true;
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    isDragging.current = false;
    setDragOver(false);
  };

  // ── Upload image ──────────────────────────────────────────
  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return imagePreview || null;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('purpose', 'flyer');
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        return data.url || null;
      }
      toast.error(l.errorUploading);
      return null;
    } catch {
      toast.error(l.errorUploading);
      return null;
    } finally {
      setUploading(false);
    }
  };

  // ── Save handler ──────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Upload image first if we have a new file
    let imageUrl = imagePreview;
    if (imageFile) {
      const uploaded = await uploadImage();
      if (!uploaded) return;
      imageUrl = uploaded;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        validFrom: validFrom,
        validUntil: validUntil || undefined,
        tier,
        businessName: businessName.trim(),
        businessPhone: businessPhone.trim() || undefined,
        businessEmail: businessEmail.trim() || undefined,
        businessWebsite: businessWebsite.trim() || undefined,
        businessAddress: businessAddress.trim() || undefined,
        municipality: municipality || undefined,
        image: imageUrl,
      };

      let res: Response;
      if (isEditing && editFlyerData) {
        res = await fetch('/api/flyers', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editFlyerData.id, ...payload }),
        });
      } else {
        res = await fetch('/api/flyers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        toast.success(isEditing ? l.successUpdate : l.successCreate);
        useModalStore.getState().setEditingFlyerId(null);
        navigateTo('mis-flyers');
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || l.errorSaving);
      }
    } catch {
      toast.error(l.errorSaving);
    } finally {
      setSaving(false);
    }
  };

  // ── Cancel handler ────────────────────────────────────────
  const handleCancel = () => {
    useModalStore.getState().setEditingFlyerId(null);
    navigateTo('mis-flyers');
  };

  // ── Plan feature helpers ──────────────────────────────────
  const getPlanFeatures = (planId: FlyerTier) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return [];
    return locale === 'es' ? plan.featuresEs : plan.featuresEn;
  };

  const getPlanName = (planId: FlyerTier) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return planId;
    return locale === 'es' ? plan.nameEs : plan.nameEn;
  };

  const getPlanPrice = (planId: FlyerTier) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return '';
    return locale === 'es' ? plan.priceLabelEs : plan.priceLabelEn;
  };

  const getPlanBadge = (planId: FlyerTier) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return '';
    return locale === 'es' ? plan.badgeEs : plan.badgeEn;
  };

  const getPlanColor = (planId: FlyerTier) => {
    const plan = plans.find((p) => p.id === planId);
    return plan?.color || '#6B7280';
  };

  const isPlanPopular = (planId: FlyerTier) => {
    const plan = plans.find((p) => p.id === planId);
    return plan?.isPopular || false;
  };

  // Get available plan tiers from DB
  const availableTiers: FlyerTier[] = plans.map((p) => p.id);

  // ── Loading state (fetching existing flyer) ───────────────
  if (loadingFlyer) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
          <Separator />
          <div className="space-y-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10"
    >
      {/* ── Breadcrumb ──────────────────────────────────── */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <button
                onClick={() => navigateBack()}
                className="hover:text-primary transition-colors flex items-center gap-1"
              >
                <Home className="size-3.5" />
                {t('Inicio', 'Home', locale)}
              </button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <button
                onClick={handleCancel}
                className="hover:text-primary transition-colors"
              >
                {l.breadcrumbMisFlyers}
              </button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{l.breadcrumbCurrent}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* ── Header with cancel button ──────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Megaphone className="size-7 text-primary" />
            {l.pageTitle}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl">
            {l.pageDesc}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={saving || uploading}
          className="gap-2 shrink-0"
        >
          <ArrowLeft className="size-4" />
          {l.cancel}
        </Button>
      </div>

      {/* ── Form ────────────────────────────────────────── */}
      <form onSubmit={handleSave} className="space-y-6">

        {/* ── Section 1: Flyer Information ───────────────── */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            {l.sectionInfo}
          </h3>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="flyer-title">{l.titleLabel} *</Label>
            <Input
              id="flyer-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={l.titlePlaceholder}
              className={cn(errors.title && 'border-destructive')}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="flyer-description">{l.descriptionLabel}</Label>
            <Textarea
              id="flyer-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={l.descriptionPlaceholder}
              rows={3}
            />
          </div>

          {/* Category + Dates row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>{l.categoryLabel} *</Label>
              <Select value={category} onValueChange={(v) => { setCategory(v); setErrors((p) => ({ ...p, category: undefined })); }}>
                <SelectTrigger className={cn('w-full', errors.category && 'border-destructive')}>
                  <SelectValue placeholder={l.categoryPlaceholder} />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {FLYER_CATEGORY_KEYS.map((key) => {
                    const cat = FLYER_CATEGORIES[key];
                    return (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                          {locale === 'es' ? cat.nameEs : cat.nameEn}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="flyer-valid-from">{l.validFromLabel} *</Label>
              <Input
                id="flyer-valid-from"
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                className={cn(errors.validFrom && 'border-destructive')}
              />
              {errors.validFrom && <p className="text-xs text-destructive">{errors.validFrom}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="flyer-valid-until">{l.validUntilLabel}</Label>
              <Input
                id="flyer-valid-until"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                min={validFrom}
              />
            </div>
          </div>

          {/* Municipality */}
          <div className="space-y-1.5">
            <Label>{l.municipalityLabel}</Label>
            <Select value={municipality} onValueChange={setMunicipality}>
              <SelectTrigger className="w-full sm:w-1/2">
                <SelectValue placeholder={l.municipalityPlaceholder} />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {MUNICIPALITIES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* ── Section 2: Tier / Plan Selector ────────────── */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            {l.sectionPlan}
          </h3>

          <div className={`grid gap-3 ${availableTiers.length <= 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'}`}>
            {availableTiers.map((planId) => {
              const isSelected = tier === planId;
              const color = getPlanColor(planId);
              const popular = isPlanPopular(planId);

              return (
                <button
                  key={planId}
                  type="button"
                  onClick={() => setTier(planId)}
                  className={cn(
                    'relative flex flex-col items-start rounded-xl border-2 p-4 text-left transition-all duration-200',
                    'hover:shadow-md cursor-pointer',
                    isSelected
                      ? 'shadow-md bg-card'
                      : 'bg-card/60 opacity-80 hover:opacity-100',
                  )}
                  style={{
                    borderColor: isSelected ? '#059669' : 'var(--border)',
                  }}
                >
                  {/* Popular badge */}
                  {popular && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                      {l.popular}
                    </span>
                  )}

                  {/* Check mark for selected */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 flex items-center justify-center size-5 rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3" />
                    </div>
                  )}

                  {/* Plan name + price */}
                  <div className="flex flex-col gap-1 mb-3">
                    <span className="font-semibold text-sm text-foreground">{getPlanName(planId)}</span>
                    <span className="text-lg font-bold" style={{ color }}>
                      {getPlanPrice(planId)}
                    </span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-1.5 flex-1">
                    {getPlanFeatures(planId).map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Check className="size-3.5 shrink-0 mt-0.5" style={{ color }} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Badge */}
                  <Badge
                    className="mt-3 text-[10px] font-bold self-start"
                    style={{ backgroundColor: color, color: '#fff', borderColor: color }}
                  >
                    {getPlanBadge(planId)}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* ── Section 3: Image Upload ────────────────────── */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ImageIcon className="size-4 text-primary" />
            {l.sectionImage}
          </h3>

          {imagePreview ? (
            <div className="relative rounded-xl overflow-hidden border bg-muted group/img">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full max-h-72 object-contain bg-muted"
              />
              <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover/img:opacity-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="size-3.5" />
                  {l.changeImage}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => { setImageFile(null); setImagePreview(''); }}
                >
                  <X className="size-3.5" />
                  {l.removeImage}
                </Button>
              </div>
            </div>
          ) : (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-colors',
                dragOver
                  ? 'border-primary bg-primary/5'
                  : errors.image
                    ? 'border-destructive bg-destructive/5'
                    : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50',
              )}
            >
              <div className={cn(
                'flex items-center justify-center size-12 rounded-full',
                dragOver ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
              )}>
                <Upload className="size-6" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  {l.dragDrop}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {l.or}
                </p>
                <p className="text-xs text-primary font-medium mt-1">
                  {l.browse}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {l.maxSize}
                </p>
              </div>
            </div>
          )}

          {errors.image && <p className="text-xs text-destructive">{errors.image}</p>}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleInputChange}
          />
        </div>

        <Separator />

        {/* ── Section 4: Business Contact ────────────────── */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Phone className="size-4 text-primary" />
            {l.sectionContact}
          </h3>

          {/* Business Name */}
          <div className="space-y-1.5">
            <Label htmlFor="flyer-business-name">{l.businessNameLabel}</Label>
            <Input
              id="flyer-business-name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder={l.businessNamePlaceholder}
            />
          </div>

          {/* Phone + Email row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="flyer-phone">{l.phoneLabel}</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="flyer-phone"
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                  placeholder={l.phonePlaceholder}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="flyer-email">{l.emailLabel}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="flyer-email"
                  type="email"
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)}
                  placeholder={l.emailPlaceholder}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Website + Address row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="flyer-website">{l.websiteLabel}</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="flyer-website"
                  value={businessWebsite}
                  onChange={(e) => setBusinessWebsite(e.target.value)}
                  placeholder={l.websitePlaceholder}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="flyer-address">{l.addressLabel}</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="flyer-address"
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  placeholder={l.addressPlaceholder}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom Save Bar ────────────────────────────── */}
        <Separator />
        <div className="flex items-center justify-end gap-3 pt-2 pb-8">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={saving || uploading}
          >
            {l.cancel}
          </Button>
          <Button
            type="submit"
            className="bg-primary hover:bg-primary/90 gap-2 min-w-[140px]"
            disabled={saving || uploading}
          >
            {(saving || uploading) && <Loader2 className="size-4 animate-spin" />}
            {uploading ? l.imageUploading : saving ? l.saving : l.save}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
