// ═══════════════════════════════════════════════════════════════
// GRAN CANARIA CONECTA - PostAdPage Component
// Full-page listing creation — replaces PostAdModal popup
// Steps: 1-Category (parents → children) → 2-Plan → 3-Details → 4-Publish
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
  ArrowLeft,
  Home,
  CreditCard,
  ShieldCheck,
  Banknote,
} from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/hooks/use-i18n';
import { useModalStore } from '@/lib/modal-store';
import { getIcon } from '@/lib/icons';
import { PRICING_PLANS } from '@/lib/types';
import { MUNICIPALITIES } from '@/lib/types';
import { cn } from '@/lib/utils';
import { navigateBack } from '@/hooks/use-navigation';
import type { CategoryDTO, ListingTier } from '@/lib/types';

const STEPS_NORMAL = [
  { keyEs: 'Categoría', keyEn: 'Category' },
  { keyEs: 'Plan', keyEn: 'Plan' },
  { keyEs: 'Detalles', keyEn: 'Details' },
  { keyEs: 'Publicar', keyEn: 'Publish' },
];

const STEPS_PAID = [
  { keyEs: 'Categoría', keyEn: 'Category' },
  { keyEs: 'Pago', keyEn: 'Payment' },
  { keyEs: 'Detalles', keyEn: 'Details' },
  { keyEs: 'Publicar', keyEn: 'Publish' },
];

export function PostAdPage() {
  const { locale, tp } = useI18n();
  const isPostAdPage = useModalStore((s) => s.isPostAdPage);
  const isPaymentOpen = useModalStore((s) => s.isPaymentOpen);
  const closePostAdPage = useModalStore((s) => s.closePostAdPage);
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Category selection state
  const [selectedParent, setSelectedParent] = useState<CategoryDTO | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryDTO | null>(null);

  const isPaidCategory = !!selectedCategory?.isPaid;
  const steps = isPaidCategory ? STEPS_PAID : STEPS_NORMAL;
  const categoryPrice = selectedCategory?.price ?? 0;

  // Payment state for paid categories
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  // Form state
  const [selectedTier, setSelectedTier] = useState<ListingTier>('FREE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [location, setLocation] = useState('');
  const [contactMethods, setContactMethods] = useState<string[]>(['message']);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set());
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxImages = selectedCategory?.maxImages ?? 5;

  // Fetch categories on mount
  useEffect(() => {
    if (isPostAdPage) {
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
  }, [isPostAdPage, locale]);

  // Scroll to top when entering
  useEffect(() => {
    if (isPostAdPage) {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, [isPostAdPage]);

  // When payment modal closes, detect and auto-submit or mark as confirmed
  const wasPaymentOpen = useRef(false);
  const pendingTierPayment = useRef(false);

  useEffect(() => {
    if (isPaymentOpen) {
      wasPaymentOpen.current = true;
    }
    // Payment modal closed
    if (wasPaymentOpen.current && !isPaymentOpen) {
      // Paid category payment confirmed (step 1) — auto-advance
      if (isPaidCategory && step === 1) {
        setPaymentConfirmed(true);
        setStep(2);
      }
      // Normal category with paid tier — auto-submit after payment
      if (pendingTierPayment.current && !isPaidCategory) {
        pendingTierPayment.current = false;
        submitListing();
      }
      wasPaymentOpen.current = false;
    }
  }, [isPaymentOpen, isPaidCategory, step]);

  async function submitListing() {
    if (!selectedCategory || !title || !description) return;
    setSubmitting(true);
    try {
      const metadata: Record<string, unknown> = {};
      if (price) metadata.price = parseFloat(price);
      if (websiteUrl) metadata.websiteUrl = websiteUrl;

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
          contactMethods,
        }),
      });

      if (res.ok) {
        setSuccess(true);
      }
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setStep(0);
    setSelectedParent(null);
    setSelectedCategory(null);
    setSelectedTier('FREE');
    setTitle('');
    setDescription('');
    setPrice('');
    setMunicipality('');
    setLocation('');
    setContactMethods(['message']);
    setWebsiteUrl('');
    setImages([]);
    setUploadingIds(new Set());
    setDragOver(false);
    setSuccess(false);
    setPaymentConfirmed(false);
    pendingTierPayment.current = false;
  }

  function handleClose() {
    closePostAdPage();
    resetForm();
  }

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
      return;
    }
    if (selectedParent) {
      setSelectedParent(null);
      setSelectedCategory(null);
      return;
    }
    navigateBack();
  };

  // For paid categories: payment was already confirmed in step 1
  // For normal categories: only HIGHLIGHTED/VIP need payment
  const needsPaymentAtPublish = !isPaidCategory && selectedTier !== 'FREE';
  const planInfo = PRICING_PLANS.find((p) => p.id === selectedTier);
  const planPaymentAmount = planInfo?.price ?? 0;

  function handleSubmit() {
    if (!selectedCategory || !title || !description) return;

    // For normal categories with paid tier, open payment modal, then auto-submit
    if (needsPaymentAtPublish) {
      pendingTierPayment.current = true;
      useModalStore.getState().openPayment({
        type: 'LISTING_UPGRADE',
        amount: planPaymentAmount,
        listingTitle: title,
      });
      return;
    }

    // For paid categories: payment already confirmed in step 1
    // For FREE: submit directly
    submitListing();
  }

  const canNext = () => {
    if (step === 0) return !!selectedCategory;
    if (step === 1) {
      if (isPaidCategory) return paymentConfirmed;
      return !!selectedTier;
    }
    if (step === 2) return !!title && !!description;
    return true;
  };

  const handleNext = () => {
    if (step < 3 && canNext()) setStep(step + 1);
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
          formData.append('purpose', 'listing');
          const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          if (res.ok) {
            const data = await res.json();
            setImages((prev) => [...prev, data.url]);
          }
        } catch {
          // silent
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

  // Separate parent and child categories
  const parentCategories = categories
    .filter((cat) => !cat.parentId && cat.isActive)
    .sort((a, b) => (locale === 'es' ? a.nameEs : a.nameEn).localeCompare(locale === 'es' ? b.nameEs : b.nameEn));

  const childCategories = selectedParent
    ? (selectedParent.children || [])
        .sort((a, b) => (locale === 'es' ? a.nameEs : a.nameEn).localeCompare(locale === 'es' ? b.nameEs : b.nameEn))
    : [];

  // Categories without children (standalone)
  const standaloneCategories = categories
    .filter((cat) => !cat.parentId && cat.isActive && (!cat.children || cat.children.length === 0))
    .sort((a, b) => (locale === 'es' ? a.nameEs : a.nameEn).localeCompare(locale === 'es' ? b.nameEs : b.nameEn));

  if (!isPostAdPage) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      {/* ═══ BREADCRUMB NAV ═══ */}
      <div className="border-b bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
            onClick={handleBack}
          >
            <ArrowLeft className="size-4" />
            {locale === 'es' ? 'Volver' : 'Back'}
          </Button>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm font-semibold text-foreground">
            {tp('form', 'postAd')}
          </span>
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {tp('form', 'postAd')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {locale === 'es'
              ? 'Publica tu anuncio en Gran Canaria Conecta en pocos pasos'
              : 'Publish your listing on Gran Canaria Conecta in a few steps'}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-10">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div
                className={cn(
                  'flex items-center justify-center size-9 rounded-full text-xs font-bold transition-all',
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
                  'text-sm font-medium hidden sm:inline',
                  i === step ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {locale === 'es' ? s.keyEs : s.keyEn}
              </span>
              {i < steps.length - 1 && (
                <div className="flex-1 h-px bg-border mx-1" />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* ═══ STEP 1: Category Selection ═══ */}
            {step === 0 && (
              <div className="space-y-6">
                {selectedCategory?.isPaid && (
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4 text-sm">
                    <span className="font-medium text-amber-700 dark:text-amber-400">
                      {tp('form', 'paidCategoryNote')}
                    </span>
                  </div>
                )}

                {/* Selected parent breadcrumb */}
                {selectedParent && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedParent(null);
                        setSelectedCategory(null);
                      }}
                      className="text-sm text-primary hover:underline font-medium flex items-center gap-1"
                    >
                      <ChevronLeft className="size-4" />
                      {locale === 'es' ? 'Todas las categorías' : 'All categories'}
                    </button>
                    <ChevronRight className="size-3 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">
                      {locale === 'es' ? selectedParent.nameEs : selectedParent.nameEn}
                    </span>
                  </div>
                )}

                {/* Category description */}
                <p className="text-sm text-muted-foreground">
                  {selectedParent
                    ? (locale === 'es'
                        ? `Selecciona una subcategoría de ${selectedParent.nameEs}`
                        : `Select a subcategory of ${selectedParent.nameEn}`)
                    : tp('form', 'selectCategory')}
                </p>

                {/* Parent categories grid (shown when no parent selected) */}
                {!selectedParent && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {[...parentCategories.filter((p) => p.children && p.children.length > 0), ...standaloneCategories].map((cat) => {
                      const name = locale === 'es' ? cat.nameEs : cat.nameEn;
                      const hasChildren = cat.children && cat.children.length > 0;
                      const isSelected = selectedCategory?.id === cat.id;

                      return (
                        <button
                          key={cat.id}
                          onClick={() => {
                            if (hasChildren) {
                              setSelectedParent(cat);
                            } else {
                              setSelectedParent(null);
                              setSelectedCategory(cat);
                            }
                          }}
                          className={cn(
                            'flex flex-col items-center gap-3 rounded-2xl border-2 p-5 text-center transition-all hover:shadow-md',
                            isSelected
                              ? 'border-primary bg-primary/5 shadow-sm'
                              : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          )}
                        >
                          <div
                            className="flex items-center justify-center size-14 rounded-xl"
                            style={{
                              backgroundColor: `${cat.color}18`,
                              color: cat.color,
                            }}
                          >
                            {getIcon(cat.icon, undefined, 28)}
                          </div>
                          <span className="text-sm font-semibold leading-tight">{name}</span>
                          {cat.isPaid && (
                            <Badge className="text-[10px] px-1.5 py-0 bg-amber-500 text-white border-amber-500">
                              Premium
                            </Badge>
                          )}
                          {hasChildren && (
                            <ChevronRight className="size-4 text-muted-foreground" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Child categories grid (shown when parent is selected) */}
                {selectedParent && childCategories.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {childCategories.map((cat) => {
                      const name = locale === 'es' ? cat.nameEs : cat.nameEn;
                      const isSelected = selectedCategory?.id === cat.id;

                      return (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat)}
                          className={cn(
                            'flex flex-col items-center gap-3 rounded-2xl border-2 p-5 text-center transition-all hover:shadow-md',
                            isSelected
                              ? 'border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20'
                              : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          )}
                        >
                          <div
                            className="flex items-center justify-center size-14 rounded-xl"
                            style={{
                              backgroundColor: `${cat.color}18`,
                              color: cat.color,
                            }}
                          >
                            {getIcon(cat.icon, undefined, 28)}
                          </div>
                          <span className="text-sm font-semibold leading-tight">{name}</span>
                          {cat.isPaid && (
                            <Badge className="text-[10px] px-1.5 py-0 bg-amber-500 text-white border-amber-500">
                              Premium
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* No children message */}
                {selectedParent && childCategories.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>{locale === 'es' ? 'No hay subcategorías disponibles' : 'No subcategories available'}</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        setSelectedParent(null);
                        setSelectedCategory(selectedParent);
                      }}
                    >
                      {locale === 'es'
                        ? `Usar "${selectedParent.nameEs}" como categoría`
                        : `Use "${selectedParent.nameEn}" as category`}
                    </Button>
                  </div>
                )}

                {/* Selected category summary */}
                {selectedCategory && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4 flex items-center gap-4"
                  >
                    <div
                      className="flex items-center justify-center size-12 rounded-xl shrink-0"
                      style={{
                        backgroundColor: `${selectedCategory.color}18`,
                        color: selectedCategory.color,
                      }}
                    >
                      {getIcon(selectedCategory.icon, undefined, 24)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground">
                        {locale === 'es' ? selectedCategory.nameEs : selectedCategory.nameEn}
                      </p>
                      {selectedParent && (
                        <p className="text-xs text-muted-foreground">
                          {locale === 'es' ? selectedParent.nameEs : selectedParent.nameEn}
                        </p>
                      )}
                    </div>
                    <Check className="size-6 text-primary shrink-0" />
                  </motion.div>
                )}
              </div>
            )}

            {/* ═══ STEP 2: Tier Selection (normal categories only) ═══ */}
            {step === 1 && !isPaidCategory && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {tp('form', 'selectPlan')}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {PRICING_PLANS.map((plan) => {
                    const isSelected = selectedTier === plan.id;
                    const name =
                      locale === 'es' ? plan.nameEs : plan.nameEn;
                    return (
                      <button
                        key={plan.id}
                        onClick={() => setSelectedTier(plan.id)}
                        className={cn(
                          'relative flex flex-col gap-3 rounded-2xl border-2 p-6 text-left transition-all hover:shadow-md',
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        {plan.isPopular && (
                          <div className="absolute -top-2.5 right-4">
                            <Badge className="text-[10px] px-2 py-0.5 gap-1" style={{ backgroundColor: plan.color, color: '#fff', borderColor: plan.color }}>
                              <Sparkles className="size-3" />
                              {tp('pricing', 'mostPopular')}
                            </Badge>
                          </div>
                        )}
                        <div className="flex items-center gap-4">
                          <div
                            className="flex items-center justify-center size-12 rounded-xl shrink-0"
                            style={{ backgroundColor: `${plan.color}18` }}
                          >
                            {getIcon(
                              plan.id === 'FREE'
                                ? 'circle'
                                : plan.id === 'HIGHLIGHTED'
                                  ? 'sparkles'
                                  : 'star',
                              undefined,
                              24
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-base">{name}</span>
                            <div className="text-2xl font-extrabold" style={{ color: plan.color }}>
                              {plan.price === 0
                                ? locale === 'es' ? 'Gratis' : 'Free'
                                : `€${plan.price}`}
                            </div>
                          </div>
                        </div>
                        <ul className="text-sm text-muted-foreground space-y-1.5">
                          {(locale === 'es' ? plan.featuresEs : plan.featuresEn)
                            .map((f, i) => (
                              <li key={i} className="flex items-center gap-2">
                                <Check className="size-4 text-primary shrink-0" />
                                {f}
                              </li>
                            ))}
                        </ul>
                        {isSelected && (
                          <div
                            className="absolute top-4 right-4 size-6 rounded-full flex items-center justify-center text-white"
                            style={{ backgroundColor: plan.color }}
                          >
                            <Check className="size-4" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ═══ STEP 2: Payment (paid categories only) ═══ */}
            {step === 1 && isPaidCategory && (
              <div className="space-y-6 max-w-lg mx-auto">
                {/* Category info */}
                <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5 flex items-center gap-4">
                  <div
                    className="flex items-center justify-center size-12 rounded-xl shrink-0"
                    style={{
                      backgroundColor: `${selectedCategory!.color}18`,
                      color: selectedCategory!.color,
                    }}
                  >
                    {getIcon(selectedCategory!.icon, undefined, 24)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground">
                      {locale === 'es' ? selectedCategory!.nameEs : selectedCategory!.nameEn}
                    </p>
                    {selectedParent && (
                      <p className="text-xs text-muted-foreground">
                        {locale === 'es' ? selectedParent.nameEs : selectedParent.nameEn}
                      </p>
                    )}
                  </div>
                  <Badge className="bg-amber-500 text-white border-amber-500 text-xs">
                    {locale === 'es' ? 'Pago requerido' : 'Payment required'}
                  </Badge>
                </div>

                {!paymentConfirmed ? (
                  <>
                    {/* Payment card */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl border bg-card overflow-hidden shadow-sm"
                    >
                      <div className="p-6 text-center space-y-4">
                        <div className="flex items-center justify-center size-16 rounded-2xl bg-primary/10 text-primary mx-auto">
                          <CreditCard className="size-8" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {locale === 'es'
                              ? 'Importe a pagar por publicar en esta categoría'
                              : 'Amount to pay to publish in this category'}
                          </p>
                          <p className="text-4xl font-extrabold text-primary mt-2">
                            €{categoryPrice.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div className="p-5 space-y-3">
                        <div className="flex items-start gap-3 text-sm">
                          <ShieldCheck className="size-5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">
                            {locale === 'es'
                              ? 'Pago seguro y protegido. Tu anuncio se publicará inmediatamente después de confirmar.'
                              : 'Secure and protected payment. Your listing will be published immediately after confirmation.'}
                          </span>
                        </div>
                        <div className="flex items-start gap-3 text-sm">
                          <Banknote className="size-5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">
                            {locale === 'es'
                              ? 'El precio lo establece el administrador de la plataforma.'
                              : 'The price is set by the platform administrator.'}
                          </span>
                        </div>
                      </div>

                      <div className="p-5 pt-0">
                        <Button
                          onClick={() => {
                            useModalStore.getState().openPayment({
                              type: 'PAID_CATEGORY',
                              amount: categoryPrice,
                              listingTitle: locale === 'es' ? selectedCategory!.nameEs : selectedCategory!.nameEn,
                            });
                          }}
                          size="lg"
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 text-base"
                        >
                          <CreditCard className="size-5" />
                          {locale === 'es' ? `Pagar €${categoryPrice.toFixed(2)}` : `Pay €${categoryPrice.toFixed(2)}`}
                        </Button>
                      </div>
                    </motion.div>
                  </>
                ) : (
                  /* Payment confirmed */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-4 py-6"
                  >
                    <div className="flex items-center justify-center size-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto">
                      <Check className="size-8" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">
                        {locale === 'es' ? '¡Pago confirmado!' : 'Payment confirmed!'}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {locale === 'es'
                          ? 'Ahora puedes rellenar los datos de tu anuncio.'
                          : 'Now you can fill in your listing details.'}
                      </p>
                    </div>
                    <div className="text-2xl font-bold text-emerald-600">€{categoryPrice.toFixed(2)}</div>
                  </motion.div>
                )}
              </div>
            )}

            {/* ═══ STEP 3: Details ═══ */}
            {step === 2 && (
              <div className="space-y-6 max-w-2xl">
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
                    className="h-11"
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
                    rows={6}
                    maxLength={2000}
                  />
                </div>

                {/* Price */}
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
                      className="h-11"
                    />
                  </div>
                )}

                {/* Municipality */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {tp('form', 'municipality')}
                  </label>
                  <Select value={municipality} onValueChange={setMunicipality}>
                    <SelectTrigger className="h-11">
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
                    className="h-11"
                  />
                </div>

                {/* Contact methods (multi-select checkboxes) */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">
                    {tp('form', 'contactMethod')}
                    <span className="text-xs font-normal text-muted-foreground ml-1">
                      ({locale === 'es' ? 'puedes seleccionar varias' : 'you can select multiple'})
                    </span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { value: 'message', label: locale === 'es' ? '💬 Mensaje' : '💬 Message' },
                      { value: 'phone', label: locale === 'es' ? '📞 Teléfono' : '📞 Phone' },
                      { value: 'email', label: `✉️ ${locale === 'es' ? 'Email' : 'Email'}` },
                      { value: 'whatsapp', label: '📱 WhatsApp' },
                    ] as const).map((opt) => {
                      const checked = contactMethods.includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setContactMethods((prev) =>
                              checked
                                ? prev.filter((m) => m !== opt.value)
                                : [...prev, opt.value]
                            );
                          }}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all',
                            checked
                              ? 'border-primary bg-primary/5 text-primary font-medium ring-1 ring-primary/20'
                              : 'border-border text-muted-foreground hover:border-primary/40 hover:bg-muted/50'
                          )}
                        >
                          <div
                            className={cn(
                              'size-4 rounded border-2 flex items-center justify-center transition-colors shrink-0',
                              checked
                                ? 'bg-primary border-primary'
                                : 'border-muted-foreground/40'
                            )}
                          >
                            {checked && <Check className="size-2.5 text-primary-foreground" />}
                          </div>
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Website URL */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {locale === 'es' ? 'Sitio web' : 'Website'} {selectedTier !== 'FREE' && <span className="text-primary">*</span>}
                  </label>
                  <Input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder={
                      locale === 'es'
                        ? 'https://www.tu-sitio.com'
                        : 'https://www.your-website.com'
                    }
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    {locale === 'es'
                      ? 'Añade el enlace de tu sitio web o red social (opcional para anuncios gratuitos)'
                      : 'Add your website or social media link (optional for free listings)'}
                  </p>
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
                        'border-2 border-dashed rounded-2xl p-10 text-center transition-colors cursor-pointer',
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
                      <Upload className="size-10 mx-auto text-muted-foreground mb-3" />
                      <p className="text-sm text-muted-foreground">
                        {tp('form', 'dragDrop')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        JPG, PNG, WebP, GIF — Max 5MB
                      </p>
                    </div>
                  )}
                  {images.length > 0 && (
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                      {images.map((url, idx) => (
                        <div
                          key={url}
                          className="relative group aspect-square rounded-xl overflow-hidden border border-border"
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
                            className="absolute top-1.5 right-1.5 size-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ))}
                      {uploadingIds.size > 0 &&
                        Array.from(uploadingIds).map((id) => (
                          <div
                            key={id}
                            className="aspect-square rounded-xl border border-border bg-muted flex items-center justify-center"
                          >
                            <Loader2 className="size-6 text-primary animate-spin" />
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═══ STEP 4: Review & Publish ═══ */}
            {step === 3 && (
              <div className="space-y-8">
                {success ? (
                  <div className="text-center py-16 space-y-6">
                    <div className="flex items-center justify-center size-20 rounded-full bg-emerald-100 text-emerald-600 mx-auto">
                      <Check className="size-10" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">
                      {tp('form', 'success')}
                    </h3>
                    <div className="flex items-center justify-center gap-3">
                      <Button onClick={handleClose} variant="outline" size="lg">
                        {locale === 'es' ? 'Volver al inicio' : 'Back to home'}
                      </Button>
                      <Button
                        onClick={() => {
                          resetForm();
                        }}
                        size="lg"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        {locale === 'es' ? 'Publicar otro anuncio' : 'Post another listing'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Preview Card */}
                    <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
                      <div className="aspect-video bg-muted flex items-center justify-center relative overflow-hidden">
                        {images.length > 0 ? (
                          <img
                            src={images[0]}
                            alt={title}
                            className="size-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="size-16 text-muted-foreground/20" />
                        )}
                        {images.length > 1 && (
                          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full">
                            +{images.length - 1} {tp('listings', 'photos').toLowerCase()}
                          </div>
                        )}
                      </div>
                      <div className="p-6 space-y-3">
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
                        <h3 className="font-bold text-xl">{title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {description}
                        </p>
                        {price && (
                          <span className="text-xl font-bold text-primary">
                            €{parseFloat(price).toLocaleString()}
                          </span>
                        )}
                        {municipality && (
                          <p className="text-xs text-muted-foreground">{municipality}</p>
                        )}
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="rounded-xl bg-muted/50 p-6 space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{tp('form', 'category')}</span>
                        <span className="font-medium">
                          {selectedParent && (
                            <>{locale === 'es' ? selectedParent.nameEs : selectedParent.nameEn} › </>
                          )}
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
                        <span className="font-medium capitalize">
                          {contactMethods.map((m) => {
                            const labels: Record<string, string> = {
                              message: locale === 'es' ? 'Mensaje' : 'Message',
                              phone: locale === 'es' ? 'Teléfono' : 'Phone',
                              email: 'Email',
                              whatsapp: 'WhatsApp',
                            };
                            return labels[m] || m;
                          }).join(', ')}
                        </span>
                      </div>
                      {websiteUrl && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{locale === 'es' ? 'Sitio web' : 'Website'}</span>
                          <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline truncate max-w-[200px]">
                            {websiteUrl}
                          </a>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer Navigation */}
        {!success && (
          <div className="flex items-center justify-between mt-10 pt-6 border-t">
            <Button
              variant="outline"
              size="lg"
              onClick={handleBack}
              className="gap-2"
            >
              <ChevronLeft className="size-4" />
              {tp('common', 'previous')}
            </Button>

            {step < 3 ? (
              <Button onClick={handleNext} disabled={!canNext()} size="lg" className="gap-2">
                {isPaidCategory && step === 1 && !paymentConfirmed
                  ? (locale === 'es' ? 'Pagar' : 'Pay')
                  : tp('common', 'next')}
                <ChevronRight className="size-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                size="lg"
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                {submitting ? (
                  <><Loader2 className="size-4 animate-spin" />{tp('common', 'loading')}</>
                ) : needsPaymentAtPublish ? (
                  <>{tp('form', 'publish')} — €{planPaymentAmount}</>
                ) : (
                  tp('form', 'publish')
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
