'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  Globe,
  Building2,
  Megaphone,
  Image as ImageIcon,
  Upload,
  X,
  Loader2,
  Star,
  LayoutDashboard,
  Newspaper,
  ChevronRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/hooks/use-i18n';
import { useModalStore } from '@/lib/modal-store';
import { cn } from '@/lib/utils';
import { navigateBack } from '@/hooks/use-navigation';
import { useSession } from 'next-auth/react';

// ── Ad Spot Types ──
interface AdSpot {
  id: string;
  nameEs: string;
  nameEn: string;
  descEs: string;
  descEn: string;
  priceMonthly: number;
  icon: React.ReactNode;
  sizeEs: string;
  sizeEn: string;
  color: string;
}

const AD_SPOTS: AdSpot[] = [
  {
    id: 'sidebar',
    nameEs: 'Banner Lateral',
    nameEn: 'Sidebar Banner',
    descEs: 'Visible en el panel lateral de todas las páginas del sitio',
    descEn: 'Visible on the sidebar of all site pages',
    priceMonthly: 29,
    icon: <LayoutDashboard className="size-6" />,
    sizeEs: '300 × 250 px',
    sizeEn: '300 × 250 px',
    color: '#0891b2',
  },
  {
    id: 'directory',
    nameEs: 'Destacado en Directorio',
    nameEn: 'Featured in Directory',
    descEs: 'Tu negocio aparece primero en el Directorio Comercial',
    descEn: 'Your business appears first in the Business Directory',
    priceMonthly: 49,
    icon: <Building2 className="size-6" />,
    sizeEs: 'Ficha completa',
    sizeEn: 'Full listing card',
    color: '#7C3AED',
  },
  {
    id: 'news',
    nameEs: 'Banner en Noticias',
    nameEn: 'News Banner',
    descEs: 'Banner destacado dentro de la sección de noticias y artículos',
    descEn: 'Featured banner inside the news and articles section',
    priceMonthly: 79,
    icon: <Newspaper className="size-6" />,
    sizeEs: '728 × 90 px',
    sizeEn: '728 × 90 px',
    color: '#059669',
  },
  {
    id: 'leaderboard',
    nameEs: 'Banner Superior',
    nameEn: 'Leaderboard',
    descEs: 'El banner más visible, en la parte superior de las páginas principales',
    descEn: 'The most visible banner, at the top of main pages',
    priceMonthly: 99,
    icon: <Megaphone className="size-6" />,
    sizeEs: '728 × 90 px',
    sizeEn: '728 × 90 px',
    color: '#EA580C',
  },
];

// ── Duration Options ──
interface DurationOption {
  months: number;
  discount: number;
  labelEs: string;
  labelEn: string;
}

const DURATION_OPTIONS: DurationOption[] = [
  { months: 1, discount: 0, labelEs: '1 Mes', labelEn: '1 Month' },
  { months: 3, discount: 10, labelEs: '3 Meses — 10% dto.', labelEn: '3 Months — 10% off' },
  { months: 6, discount: 15, labelEs: '6 Meses — 15% dto.', labelEn: '6 Months — 15% off' },
  { months: 12, discount: 20, labelEs: '12 Meses — 20% dto.', labelEn: '12 Months — 20% off' },
];

export function PromoteBusinessPage() {
  const { locale, tp } = useI18n();
  const { isPromoteBusinessPage, closePromoteBusinessPage } = useModalStore();
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Business info
  const [businessName, setBusinessName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [description, setDescription] = useState('');

  // Ad selection
  const [selectedSpots, setSelectedSpots] = useState<string[]>([]);
  const [selectedDuration, setSelectedDuration] = useState(1);

  // Creative
  const [creativeOption, setCreativeOption] = useState<'own' | 'static' | 'animated'>('own');
  const [creativeInstructions, setCreativeInstructions] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const toggleSpot = (id: string) => {
    setSelectedSpots((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const monthlySubtotal = AD_SPOTS.filter((s) => selectedSpots.includes(s.id)).reduce((sum, s) => sum + s.priceMonthly, 0);
  const durationInfo = DURATION_OPTIONS.find((d) => d.months === selectedDuration) || DURATION_OPTIONS[0];
  const totalBeforeDiscount = monthlySubtotal * selectedDuration;
  const discountAmount = totalBeforeDiscount * (durationInfo.discount / 100);
  const totalPrice = totalBeforeDiscount - discountAmount;
  const designFee = creativeOption === 'static' ? 39.95 : creativeOption === 'animated' ? 99.95 : 0;
  const grandTotal = totalPrice + designFee;

  const canNext = () => {
    if (step === 0) return selectedSpots.length > 0;
    if (step === 1) return !!businessName && !!contactName && !!email && !!websiteUrl;
    return true;
  };

  const handleNext = () => { if (step < 3 && canNext()) setStep(step + 1); };

  const handleBack = () => {
    if (step > 0) { setStep(step - 1); return; }
    closePromoteBusinessPage();
    navigateBack();
  };

  const uploadFiles = useCallback(async (files: File[]) => {
    setUploading(true);
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (res.ok) {
          const data = await res.json();
          setImages((prev) => [...prev, data.url]);
        }
      } catch {}
    }
    setUploading(false);
  }, []);

  const handleSubmit = async () => {
    if (!session?.user) { useModalStore.getState().openAuth(); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'BUSINESS_PLAN',
          amount: grandTotal,
          metadata: {
            businessName,
            contactName,
            email,
            phone,
            websiteUrl,
            description,
            adSpots: selectedSpots,
            duration: selectedDuration,
            creativeOption,
            creativeInstructions,
            images,
          },
        }),
      });
      if (res.ok) {
        setSuccess(true);
      }
    } catch {} finally { setSubmitting(false); }
  };

  if (!isPromoteBusinessPage) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="w-full">
      {/* ── Header ── */}
      <div className="border-b bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground" onClick={handleBack}>
            <ArrowLeft className="size-4" />{locale === 'es' ? 'Volver' : 'Back'}
          </Button>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm font-semibold text-foreground">
            {locale === 'es' ? 'Promociona tu Negocio' : 'Promote Your Business'}
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* ── Title ── */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {locale === 'es' ? 'Promociona tu Negocio' : 'Promote Your Business'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {locale === 'es'
              ? 'Llega a miles de residentes y visitantes de Gran Canaria con publicidad dirigida'
              : 'Reach thousands of residents and visitors in Gran Canaria with targeted advertising'}
          </p>
        </div>

        {/* ── Step Indicator ── */}
        <div className="flex items-center gap-2 mb-10">
          {[
            { es: 'Espacio', en: 'Ad Spot' },
            { es: 'Tu Negocio', en: 'Business Info' },
            { es: 'Diseño', en: 'Creative' },
            { es: 'Confirmar', en: 'Confirm' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={cn('flex items-center justify-center size-9 rounded-full text-xs font-bold transition-all', i < step ? 'bg-primary text-primary-foreground' : i === step ? 'bg-primary/20 text-primary border-2 border-primary' : 'bg-muted text-muted-foreground')}>
                {i < step ? <Check className="size-4" /> : i + 1}
              </div>
              <span className={cn('text-sm font-medium hidden sm:inline', i === step ? 'text-foreground' : 'text-muted-foreground')}>
                {locale === 'es' ? s.es : s.en}
              </span>
              {i < 3 && <div className="flex-1 h-px bg-border mx-1" />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>

            {/* ═══ STEP 1: Ad Spots ═══ */}
            {step === 0 && (
              <div className="space-y-8">
                <div className="rounded-xl bg-primary/5 border border-primary/10 p-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-5 text-primary" />
                    <h3 className="font-semibold text-foreground">
                      {locale === 'es' ? 'Espacios publicitarios disponibles' : 'Available advertising spots'}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {locale === 'es'
                      ? 'Selecciona uno o más espacios donde quieras que aparezca tu publicidad. Precios mensuales.'
                      : 'Select one or more spots where you want your ad to appear. Monthly prices.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {AD_SPOTS.map((spot) => {
                    const isSelected = selectedSpots.includes(spot.id);
                    return (
                      <button key={spot.id} onClick={() => toggleSpot(spot.id)} className={cn('relative flex flex-col gap-3 rounded-2xl border-2 p-6 text-left transition-all hover:shadow-md', isSelected ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20' : 'border-border hover:border-primary/50')}>
                        <div className="flex items-start gap-4">
                          <div className="flex items-center justify-center size-12 rounded-xl shrink-0" style={{ backgroundColor: `${spot.color}18`, color: spot.color }}>{spot.icon}</div>
                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-base">{locale === 'es' ? spot.nameEs : spot.nameEn}</span>
                            <div className="text-2xl font-extrabold mt-0.5" style={{ color: spot.color }}>
                              €{spot.priceMonthly}<span className="text-sm font-normal text-muted-foreground">/{locale === 'es' ? 'mes' : 'mo'}</span>
                            </div>
                          </div>
                          {isSelected && <div className="size-6 rounded-full flex items-center justify-center text-white bg-primary"><Check className="size-4" /></div>}
                        </div>
                        <p className="text-sm text-muted-foreground">{locale === 'es' ? spot.descEs : spot.descEn}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <LayoutDashboard className="size-3" />
                          {locale === 'es' ? spot.sizeEs : spot.sizeEn}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Duration */}
                {selectedSpots.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <h3 className="font-semibold text-foreground">
                      {locale === 'es' ? '¿Por cuánto tiempo?' : 'How long would you like your ad to run?'}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {DURATION_OPTIONS.map((opt) => (
                        <button key={opt.months} onClick={() => setSelectedDuration(opt.months)} className={cn('rounded-xl border-2 p-4 text-center transition-all', selectedDuration === opt.months ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/50')}>
                          <span className="text-sm font-bold block">{locale === 'es' ? opt.labelEs : opt.labelEn}</span>
                          {opt.discount > 0 && <Badge className="mt-1.5 bg-emerald-500 text-white border-emerald-500 text-[10px]">-{opt.discount}%</Badge>}
                        </button>
                      ))}
                    </div>

                    {/* Price summary */}
                    <div className="rounded-xl bg-muted/50 p-5 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{locale === 'es' ? 'Espacios seleccionados' : 'Selected spots'}</span>
                        <span className="font-medium">{selectedSpots.length} × €{monthlySubtotal}/{locale === 'es' ? 'mes' : 'mo'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{locale === 'es' ? 'Duración' : 'Duration'}</span>
                        <span className="font-medium">{selectedDuration} {locale === 'es' ? 'mes(es)' : 'month(s)'}</span>
                      </div>
                      {durationInfo.discount > 0 && (
                        <div className="flex justify-between text-emerald-600">
                          <span>{locale === 'es' ? `Descuento (${durationInfo.discount}%)` : `Discount (${durationInfo.discount}%)`}</span>
                          <span className="font-medium">-€{discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between text-lg">
                        <span className="font-bold">{locale === 'es' ? 'Subtotal' : 'Subtotal'}</span>
                        <span className="font-extrabold text-primary">€{totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* ═══ STEP 2: Business Info ═══ */}
            {step === 1 && (
              <div className="space-y-6 max-w-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium">{locale === 'es' ? 'Nombre del Negocio' : 'Business Name'} *</label>
                    <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder={locale === 'es' ? 'Ej: Restaurante La Parrilla' : 'E.g: La Parrilla Restaurant'} className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{locale === 'es' ? 'Persona de Contacto' : 'Contact Person'} *</label>
                    <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder={locale === 'es' ? 'Nombre y apellidos' : 'Full name'} className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{locale === 'es' ? 'Teléfono' : 'Phone'}</label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+34 600 000 000" className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email *</label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@tu-negocio.com" className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{locale === 'es' ? 'Sitio Web' : 'Website'} *</label>
                    <Input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://www.tu-negocio.com" className="h-11" />
                    <p className="text-xs text-muted-foreground">
                      {locale === 'es' ? 'La URL a la que dirigirá tu publicidad' : 'The URL your ad will link to'}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{locale === 'es' ? 'Descripción breve de tu negocio' : 'Short business description'}</label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={locale === 'es' ? 'Cuéntanos sobre tu negocio en 2-3 líneas...' : 'Tell us about your business in 2-3 lines...'} rows={3} maxLength={500} />
                </div>

                {/* Selected spots reminder */}
                <div className="rounded-lg bg-muted/50 p-4 space-y-1 text-sm">
                  <span className="text-muted-foreground">{locale === 'es' ? 'Espacios seleccionados: ' : 'Selected spots: '}</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {AD_SPOTS.filter((s) => selectedSpots.includes(s.id)).map((s) => (
                      <Badge key={s.id} variant="secondary" style={{ backgroundColor: `${s.color}18`, color: s.color }}>{locale === 'es' ? s.nameEs : s.nameEn}</Badge>
                    ))}
                    <Badge variant="outline" className="gap-1">
                      <Star className="size-3" />{selectedDuration} {locale === 'es' ? 'mes(es)' : 'month(s)'}
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ STEP 3: Creative ═══ */}
            {step === 2 && (
              <div className="space-y-6 max-w-2xl">
                <h3 className="font-semibold text-foreground">
                  {locale === 'es' ? '¿Qué recursos de diseño tienes?' : 'What graphic design resources do you have?'}
                </h3>
                <div className="space-y-3">
                  {[
                    { id: 'own' as const, es: 'Aporto mi propio diseño final, listo para la web', en: "I'll supply my own final, web-ready ad design", price: 0 },
                    { id: 'static' as const, es: 'Diseñad un banner estático para mí', en: 'Design a new static ad for me', price: 39.95 },
                    { id: 'animated' as const, es: 'Diseñad un banner animado para mí', en: 'Design a new animated ad for me', price: 99.95 },
                  ].map((opt) => (
                    <button key={opt.id} onClick={() => setCreativeOption(opt.id)} className={cn('w-full flex items-center justify-between rounded-xl border-2 p-4 text-left transition-all', creativeOption === opt.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50')}>
                      <div className="flex items-center gap-3">
                        <div className={cn('size-5 rounded-full border-2 flex items-center justify-center', creativeOption === opt.id ? 'border-primary' : 'border-muted-foreground')}>
                          {creativeOption === opt.id && <div className="size-2.5 rounded-full bg-primary" />}
                        </div>
                        <span className="text-sm font-medium">{locale === 'es' ? opt.es : opt.en}</span>
                      </div>
                      {opt.price > 0 && <span className="text-sm font-bold text-primary">+€{opt.price.toFixed(2)}</span>}
                    </button>
                  ))}
                </div>

                {creativeOption !== 'own' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {locale === 'es' ? '¿Qué te gustaría en el diseño?' : 'What would you like in the ad?'}
                    </label>
                    <Textarea value={creativeInstructions} onChange={(e) => setCreativeInstructions(e.target.value)} placeholder={locale === 'es' ? 'Describe colores, texto, logotipo, mensaje principal...' : 'Describe colors, text, logo, main message...'} rows={4} maxLength={1000} />
                  </div>
                )}

                {creativeOption === 'own' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{locale === 'es' ? 'Sube tu diseño' : 'Upload your design'}</label>
                    <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => { if (e.target.files) uploadFiles(Array.from(e.target.files)); e.target.value = ''; }} />
                    {images.length < 3 && (
                      <div className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer border-border hover:border-primary/50 transition-colors" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="size-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">{locale === 'es' ? 'Haz clic o arrastra tus archivos aquí' : 'Click or drag your files here'}</p>
                        <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP — Max 5MB</p>
                      </div>
                    )}
                    {images.length > 0 && (
                      <div className="grid grid-cols-3 gap-3">
                        {images.map((url, idx) => (
                          <div key={url} className="relative group aspect-video rounded-xl overflow-hidden border border-border">
                            <img src={url} alt={`Design ${idx + 1}`} className="size-full object-cover" />
                            <button type="button" onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))} className="absolute top-1.5 right-1.5 size-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"><X className="size-3.5" /></button>
                          </div>
                        ))}
                        {uploading && <div className="aspect-video rounded-xl border border-border bg-muted flex items-center justify-center"><Loader2 className="size-6 text-primary animate-spin" /></div>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ═══ STEP 4: Confirm ═══ */}
            {step === 3 && (
              <div className="space-y-8">
                {success ? (
                  <div className="text-center py-16 space-y-6">
                    <div className="flex items-center justify-center size-20 rounded-full bg-emerald-100 text-emerald-600 mx-auto"><Check className="size-10" /></div>
                    <h3 className="text-xl font-bold text-foreground">{locale === 'es' ? '¡Pedido registrado!' : 'Order registered!'}</h3>
                    <p className="text-muted-foreground">{locale === 'es' ? 'Nos pondremos en contacto contigo para confirmar los detalles y el pago.' : 'We will contact you to confirm details and payment.'}</p>
                    <Button onClick={handleBack} variant="outline" size="lg">{locale === 'es' ? 'Volver al inicio' : 'Back to home'}</Button>
                  </div>
                ) : (
                  <>
                    {/* Order Summary */}
                    <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
                      <div className="p-6 space-y-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="size-5 text-primary" />
                          <h3 className="font-bold text-lg">{businessName}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">{description || (locale === 'es' ? 'Sin descripción' : 'No description')}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Globe className="size-3" />{websiteUrl}</span>
                          <span>{email}</span>
                          {phone && <span>{phone}</span>}
                        </div>
                      </div>
                      <Separator />
                      <div className="p-6 space-y-3">
                        <h4 className="font-semibold text-sm">{locale === 'es' ? 'Espacios publicitarios' : 'Advertising Spots'}</h4>
                        <div className="space-y-2">
                          {AD_SPOTS.filter((s) => selectedSpots.includes(s.id)).map((s) => (
                            <div key={s.id} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <div className="size-3 rounded-full" style={{ backgroundColor: s.color }} />
                                <span>{locale === 'es' ? s.nameEs : s.nameEn}</span>
                                <span className="text-muted-foreground">({locale === 'es' ? s.sizeEs : s.sizeEn})</span>
                              </div>
                              <span className="font-medium">€{s.priceMonthly}/{locale === 'es' ? 'mes' : 'mo'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Separator />
                      <div className="p-6 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{locale === 'es' ? 'Duración' : 'Duration'}</span>
                          <span className="font-medium">{selectedDuration} {locale === 'es' ? 'mes(es)' : 'month(s)'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{locale === 'es' ? 'Subtotal mensual' : 'Monthly subtotal'}</span>
                          <span className="font-medium">€{monthlySubtotal.toFixed(2)}</span>
                        </div>
                        {durationInfo.discount > 0 && (
                          <div className="flex justify-between text-sm text-emerald-600">
                            <span>{locale === 'es' ? `Descuento (${durationInfo.discount}%)` : `Discount (${durationInfo.discount}%)`}</span>
                            <span className="font-medium">-€{discountAmount.toFixed(2)}</span>
                          </div>
                        )}
                        {designFee > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{locale === 'es' ? 'Diseño' : 'Design'}</span>
                            <span className="font-medium">+€{designFee.toFixed(2)}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between text-lg">
                          <span className="font-bold">{locale === 'es' ? 'Total' : 'Total'}</span>
                          <span className="font-extrabold text-primary">€{grandTotal.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {locale === 'es' ? '* IVA incluido. Te contactaremos para confirmar el pago.' : '* Tax included. We will contact you to confirm payment.'}
                        </p>
                      </div>
                    </div>

                    {/* Contact info */}
                    <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 space-y-2">
                      <p className="text-sm font-medium">
                        {locale === 'es' ? 'Persona de contacto' : 'Contact person'}
                      </p>
                      <p className="text-sm text-muted-foreground">{contactName}</p>
                      <a href={`mailto:${email}`} className="text-sm text-primary hover:underline flex items-center gap-1">
                        {email} <ExternalLink className="size-3" />
                      </a>
                    </div>
                  </>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ── Navigation Footer ── */}
        {!success && (
          <div className="flex items-center justify-between mt-10 pt-6 border-t">
            <Button variant="outline" size="lg" onClick={handleBack} className="gap-2">
              <ArrowLeft className="size-4" />{tp('common', 'previous')}
            </Button>
            {step < 3 ? (
              <Button onClick={handleNext} disabled={!canNext()} size="lg" className="gap-2">
                {tp('common', 'next')}<ChevronRight className="size-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting} size="lg" className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <Megaphone className="size-4" />}
                {submitting ? tp('common', 'loading') : (locale === 'es' ? 'Confirmar Pedido (€' + grandTotal.toFixed(2) + ')' : 'Confirm Order (€' + grandTotal.toFixed(2) + ')')}
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
