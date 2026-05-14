// ═══════════════════════════════════════════════════════════════
// GRAN CANARIA CONECTA - PostAdModal Component
// Multi-step modal for creating a new listing
// Steps: 1-Category → 2-Tier → 3-Details → 4-Review & Publish
// ═══════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Upload,
  Image as ImageIcon,
  Sparkles,
  X,
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useI18n } from '@/hooks/use-i18n';
import { useModalStore } from '@/lib/modal-store';
import { getIcon } from '@/lib/icons';
import { PRICING_PLANS } from '@/lib/types';
import { MUNICIPALITIES } from '@/lib/types';
import { cn } from '@/lib/utils';
import type { CategoryDTO, ListingTier } from '@/lib/types';

const STEPS = [
  { keyEs: 'Categoría', keyEn: 'Category' },
  { keyEs: 'Plan', keyEn: 'Plan' },
  { keyEs: 'Detalles', keyEn: 'Details' },
  { keyEs: 'Publicar', keyEn: 'Publish' },
];

export function PostAdModal() {
  const { locale, tp } = useI18n();
  const { isPostAdOpen, closePostAd } = useModalStore();
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form state
  const [selectedCategory, setSelectedCategory] = useState<CategoryDTO | null>(null);
  const [selectedTier, setSelectedTier] = useState<ListingTier>('FREE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [location, setLocation] = useState('');
  const [contactMethod, setContactMethod] = useState('message');
  const [images, setImages] = useState<string[]>([]);
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set());
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxImages = selectedCategory?.maxImages ?? 5;

  // Fetch categories on mount
  useEffect(() => {
    if (isPostAdOpen) {
      async function fetchCategories() {
        try {
          const res = await fetch(`/api/categories?locale=${locale}`);
          if (res.ok) {
            const data = await res.json();
            setCategories(data || []);
          }
        } catch {
          // silent
        }
      }
      fetchCategories();
      resetForm();
    }
  }, [isPostAdOpen, locale]);

  // Auto-select minimum tier when category changes
  useEffect(() => {
    if (selectedCategory?.isPaid && selectedTier === 'FREE') {
      setSelectedTier('HIGHLIGHTED');
    }
  }, [selectedCategory, selectedTier]);

  function resetForm() {
    setStep(0);
    setSelectedCategory(null);
    setSelectedTier('FREE');
    setTitle('');
    setDescription('');
    setPrice('');
    setMunicipality('');
    setLocation('');
    setContactMethod('message');
    setImages([]);
    setUploadingIds(new Set());
    setDragOver(false);
    setSuccess(false);
  }

  function handleClose() {
    closePostAd();
    resetForm();
  }

  async function handleSubmit() {
    if (!selectedCategory || !title || !description) return;

    setSubmitting(true);
    try {
      const metadata: Record<string, unknown> = {};
      if (price) metadata.price = parseFloat(price);

      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          categoryId: selectedCategory.id,
          tier: selectedTier,
          metadata,
          images,
          municipality: municipality || undefined,
          location: location || undefined,
          contactMethod,
          showPhone: contactMethod === 'phone' || contactMethod === 'whatsapp',
          showEmail: contactMethod === 'email' || contactMethod === 'message',
        }),
      });

      if (res.ok) {
        setSuccess(true);
      }
    } catch {
      // error
    } finally {
      setSubmitting(false);
    }
  }

  const canNext = () => {
    if (step === 0) return !!selectedCategory;
    if (step === 1) return !!selectedTier;
    if (step === 2) return !!title && !!description;
    return true;
  };

  const handleNext = () => {
    if (step < 3 && canNext()) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const uploadFiles = useCallback(
    async (files: File[]) => {
      const remaining = maxImages - images.length;
      if (remaining <= 0) return;

      const toUpload = files.slice(0, remaining);
      const newIds = toUpload.map(() => `upload-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);

      setUploadingIds((prev) => new Set([...prev, ...newIds]));

      const uploadPromises = toUpload.map(async (file, idx) => {
        const uid = newIds[idx];
        try {
          const formData = new FormData();
          formData.append('file', file);
          const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          if (res.ok) {
            const data = await res.json();
            setImages((prev) => [...prev, data.url]);
          }
        } catch {
          // silent — upload failed for this file
        } finally {
          setUploadingIds((prev) => {
            const next = new Set(prev);
            next.delete(uid);
            return next;
          });
        }
      });

      await Promise.all(uploadPromises);
    },
    [maxImages, images.length]
  );

  // Flatten categories for selection (show children of parent categories)
  const allCategories = categories.flatMap((cat) =>
    cat.children && cat.children.length > 0
      ? cat.children
      : [cat]
  );

  return (
    <Dialog open={isPostAdOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-xl font-bold">
            {tp('form', 'postAd')}
          </DialogTitle>

          {/* Step Indicator */}
          <div className="flex items-center gap-2 mt-4">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-2 flex-1">
                <div
                  className={cn(
                    'flex items-center justify-center size-8 rounded-full text-xs font-bold transition-all',
                    i < step
                      ? 'bg-primary text-primary-foreground'
                      : i === step
                        ? 'bg-primary/20 text-primary border-2 border-primary'
                        : 'bg-muted text-muted-foreground'
                  )}
                >
                  {i < step ? <Check className="size-4" /> : i + 1}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium hidden sm:inline',
                    i === step ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {locale === 'es' ? s.keyEs : s.keyEn}
                </span>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-px bg-border mx-1" />
                )}
              </div>
            ))}
          </div>
        </DialogHeader>

        {/* Step Content */}
        <div className="px-6 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* STEP 1: Category Selection */}
              {step === 0 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {tp('form', 'selectCategory')}
                  </p>
                  {selectedCategory?.isPaid && (
                    <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 text-sm">
                      <span className="font-medium text-amber-700 dark:text-amber-400">
                        {tp('form', 'paidCategoryNote')}
                      </span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {allCategories.map((cat) => {
                      const name = locale === 'es' ? cat.nameEs : cat.nameEn;
                      const isSelected = selectedCategory?.id === cat.id;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat)}
                          className={cn(
                            'flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all',
                            isSelected
                              ? 'border-primary bg-primary/5 shadow-sm'
                              : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          )}
                        >
                          <div
                            className="flex items-center justify-center size-10 rounded-lg"
                            style={{
                              backgroundColor: `${cat.color}18`,
                              color: cat.color,
                            }}
                          >
                            {getIcon(cat.icon, undefined, 20)}
                          </div>
                          <span className="text-xs font-medium leading-tight line-clamp-2">
                            {name}
                          </span>
                          {cat.isPaid && (
                            <Badge className="text-[9px] px-1 py-0 bg-amber-500 text-white border-amber-500">
                              Premium
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 2: Tier Selection */}
              {step === 1 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {tp('form', 'selectPlan')}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {PRICING_PLANS.filter(
                      (p) => !selectedCategory?.isPaid || p.id !== 'FREE'
                    ).map((plan) => {
                      const isSelected = selectedTier === plan.id;
                      const name =
                        locale === 'es' ? plan.nameEs : plan.nameEn;
                      return (
                        <button
                          key={plan.id}
                          onClick={() => setSelectedTier(plan.id)}
                          className={cn(
                            'relative flex flex-col gap-2 rounded-xl border p-4 text-left transition-all',
                            isSelected
                              ? 'border-primary bg-primary/5 shadow-md'
                              : 'border-border hover:border-primary/50'
                          )}
                        >
                          {plan.isPopular && (
                            <div className="absolute -top-2 right-3">
                              <Badge className="text-[9px] px-1.5 py-0 gap-1" style={{ backgroundColor: plan.color, color: '#fff', borderColor: plan.color }}>
                                <Sparkles className="size-2.5" />
                                {tp('pricing', 'mostPopular')}
                              </Badge>
                            </div>
                          )}
                          <div className="flex items-center gap-3">
                            <div
                              className="flex items-center justify-center size-10 rounded-lg shrink-0"
                              style={{ backgroundColor: `${plan.color}18` }}
                            >
                              {getIcon(
                                plan.id === 'FREE'
                                  ? 'circle'
                                  : plan.id === 'HIGHLIGHTED'
                                    ? 'sparkles'
                                    : plan.id === 'VIP'
                                      ? 'star'
                                      : 'store',
                                undefined,
                                20
                              )}
                            </div>
                            <div>
                              <span className="font-bold text-sm">{name}</span>
                              <div className="text-lg font-extrabold" style={{ color: plan.color }}>
                                {plan.price === 0
                                  ? locale === 'es' ? 'Gratis' : 'Free'
                                  : `€${plan.price}`}
                              </div>
                            </div>
                          </div>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {(locale === 'es' ? plan.featuresEs : plan.featuresEn)
                              .slice(0, 3)
                              .map((f, i) => (
                                <li key={i} className="flex items-center gap-1.5">
                                  <Check className="size-3 text-primary shrink-0" />
                                  {f}
                                </li>
                              ))}
                          </ul>
                          {isSelected && (
                            <div
                              className="absolute top-3 right-3 size-5 rounded-full flex items-center justify-center text-white"
                              style={{ backgroundColor: plan.color }}
                            >
                              <Check className="size-3" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 3: Details */}
              {step === 2 && (
                <div className="space-y-4">
                  {/* Title */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {tp('form', 'title')} *
                    </label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={
                        locale === 'es'
                          ? 'Ej: Bicicleta de montaña en buen estado'
                          : 'E.g: Mountain bike in good condition'
                      }
                      maxLength={120}
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {tp('form', 'description')} *
                    </label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={
                        locale === 'es'
                          ? 'Describe tu anuncio con detalle...'
                          : 'Describe your listing in detail...'
                      }
                      rows={4}
                      maxLength={2000}
                    />
                  </div>

                  {/* Price (if category shows price) */}
                  {selectedCategory?.showPrice && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        {tp('listings', 'price')} (€)
                      </label>
                      <Input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder={
                          locale === 'es'
                            ? 'Deja vacío si es gratis'
                            : 'Leave empty if free'
                        }
                        min="0"
                      />
                    </div>
                  )}

                  {/* Municipality */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {tp('form', 'municipality')}
                    </label>
                    <Select value={municipality} onValueChange={setMunicipality}>
                      <SelectTrigger>
                        <SelectValue placeholder={tp('form', 'selectMunicipality')} />
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

                  {/* Location detail */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {tp('form', 'location')}
                    </label>
                    <Input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder={tp('form', 'locationPlaceholder')}
                    />
                  </div>

                  {/* Contact method */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {tp('form', 'contactMethod')}
                    </label>
                    <Select value={contactMethod} onValueChange={setContactMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="message">
                          {locale === 'es' ? 'Mensaje' : 'Message'}
                        </SelectItem>
                        <SelectItem value="phone">
                          {locale === 'es' ? 'Teléfono' : 'Phone'}
                        </SelectItem>
                        <SelectItem value="email">
                          {tp('form', 'email')}
                        </SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Image upload */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {tp('form', 'images')} ({images.length}/{maxImages})
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files) uploadFiles(Array.from(files));
                        e.target.value = '';
                      }}
                    />
                    {images.length < maxImages && (
                      <div
                        className={cn(
                          'border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer',
                          dragOver
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        )}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDragOver(true);
                        }}
                        onDragEnter={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDragOver(true);
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDragOver(false);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDragOver(false);
                          const files = Array.from(e.dataTransfer.files).filter(
                            (f) => f.type.startsWith('image/')
                          );
                          if (files.length > 0) uploadFiles(files);
                        }}
                      >
                        <Upload className="size-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {tp('form', 'dragDrop')}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          JPG, PNG, WebP, GIF — Max 5MB
                        </p>
                      </div>
                    )}
                    {images.length > 0 && (
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                        {images.map((url, idx) => (
                          <div
                            key={url}
                            className="relative group aspect-square rounded-lg overflow-hidden border border-border"
                          >
                            <img
                              src={url}
                              alt={`${tp('form', 'images')} ${idx + 1}`}
                              className="size-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setImages((prev) => prev.filter((_, i) => i !== idx))
                              }
                              className="absolute top-1 right-1 size-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                            >
                              <X className="size-3" />
                            </button>
                          </div>
                        ))}
                        {uploadingIds.size > 0 &&
                          Array.from(uploadingIds).map((id) => (
                            <div
                              key={id}
                              className="aspect-square rounded-lg border border-border bg-muted flex items-center justify-center"
                            >
                              <Loader2 className="size-5 text-primary animate-spin" />
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 4: Review & Publish */}
              {step === 3 && (
                <div className="space-y-6">
                  {success ? (
                    <div className="text-center py-8 space-y-4">
                      <div className="flex items-center justify-center size-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto">
                        <Check className="size-8" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground">
                        {tp('form', 'success')}
                      </h3>
                      <Button onClick={handleClose} variant="outline">
                        {tp('common', 'close')}
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* Preview Card */}
                      <div className="rounded-xl border bg-card overflow-hidden">
                        <div className="aspect-video bg-muted flex items-center justify-center relative overflow-hidden">
                          {images.length > 0 ? (
                            <img
                              src={images[0]}
                              alt={title}
                              className="size-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="size-12 text-muted-foreground/20" />
                          )}
                          {images.length > 1 && (
                            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                              +{images.length - 1} {tp('listings', 'photos').toLowerCase()}
                            </div>
                          )}
                        </div>
                        <div className="p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            {selectedCategory && (
                              <Badge
                                variant="secondary"
                                className="text-xs"
                                style={{
                                  backgroundColor: `${selectedCategory.color}18`,
                                  color: selectedCategory.color,
                                }}
                              >
                                {locale === 'es'
                                  ? selectedCategory.nameEs
                                  : selectedCategory.nameEn}
                              </Badge>
                            )}
                            <Badge
                              style={{
                                backgroundColor:
                                  PRICING_PLANS.find((p) => p.id === selectedTier)
                                    ?.color,
                                color: '#fff',
                              }}
                            >
                              {PRICING_PLANS.find((p) => p.id === selectedTier)?.badge}
                            </Badge>
                          </div>
                          <h3 className="font-bold text-lg">{title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {description}
                          </p>
                          {price && (
                            <span className="text-lg font-bold text-primary">
                              €{parseFloat(price).toLocaleString()} {locale === 'es' ? '' : ''}
                            </span>
                          )}
                          {municipality && (
                            <p className="text-xs text-muted-foreground">{municipality}</p>
                          )}
                        </div>
                      </div>

                      {/* Summary */}
                      <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{tp('form', 'category')}</span>
                          <span className="font-medium">
                            {locale === 'es'
                              ? selectedCategory?.nameEs
                              : selectedCategory?.nameEn}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{tp('form', 'plan')}</span>
                          <span className="font-medium">
                            {PRICING_PLANS.find((p) => p.id === selectedTier)?.badge}{' '}
                            {selectedTier !== 'FREE' &&
                              `— €${PRICING_PLANS.find((p) => p.id === selectedTier)?.price}`}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{tp('form', 'contactMethod')}</span>
                          <span className="font-medium capitalize">{contactMethod}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        {!success && (
          <div className="flex items-center justify-between px-6 pb-6 pt-2">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 0}
              className="gap-1"
            >
              <ChevronLeft className="size-4" />
              {tp('common', 'previous')}
            </Button>

            {step < 3 ? (
              <Button onClick={handleNext} disabled={!canNext()} className="gap-1">
                {tp('common', 'next')}
                <ChevronRight className="size-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="gap-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                {submitting ? tp('common', 'loading') : tp('form', 'publish')}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
