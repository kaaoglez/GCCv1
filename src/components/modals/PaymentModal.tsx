// ═══════════════════════════════════════════════════════════════
// GRAN CANARIA CONECTA - PaymentModal Component
// Manual payment flow: Order Summary → Confirmation → Success
// ═══════════════════════════════════════════════════════════════

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  CheckCircle2,
  CircleDot,
  Mail,
  Copy,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/hooks/use-i18n';
import { useModalStore } from '@/lib/modal-store';
import { useSession } from 'next-auth/react';
import type { PaymentType } from '@/lib/types';

// Payment type label mapping helper
function getPaymentTypeLabel(type: string, locale: string): string {
  const typeLabels: Record<string, { es: string; en: string }> = {
    HIGHLIGHT_UPGRADE: { es: 'Destacar anuncio', en: 'Highlight listing' },
    VIP_UPGRADE:       { es: 'Mejora VIP', en: 'VIP upgrade' },
    BUSINESS_PLAN:     { es: 'Plan Negocio', en: 'Business plan' },
    BUMP:              { es: 'Republicar anuncio', en: 'Bump up listing' },
    LISTING_POST:      { es: 'Publicar anuncio de pago', en: 'Post paid listing' },
  };
  const label = typeLabels[type] || { es: type, en: type };
  return locale === 'en' ? label.en : label.es;
}

// Payment type color mapping
function getPaymentTypeColor(type: string): string {
  const colors: Record<string, string> = {
    HIGHLIGHT_UPGRADE: '#F59E0B',
    VIP_UPGRADE:       '#EA580C',
    BUSINESS_PLAN:     '#7C3AED',
    BUMP:              '#059669',
    LISTING_POST:      '#3B82F6',
  };
  return colors[type] || '#6B7280';
}

type Step = 'summary' | 'confirming' | 'success' | 'error';

interface CreatedPayment {
  id: string;
  type: PaymentType;
  amount: number;
  status: string;
  createdAt: string;
}

export function PaymentModal() {
  const { locale, tp } = useI18n();
  const { paymentConfig, isPaymentOpen, closePayment } = useModalStore();
  const { data: session } = useSession();

  const [step, setStep] = useState<Step>('summary');
  const [createdPayment, setCreatedPayment] = useState<CreatedPayment | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Reset state when modal config changes
  const isOpen = isPaymentOpen && !!paymentConfig;

  const handleClose = () => {
    setStep('summary');
    setCreatedPayment(null);
    setCopied(false);
    setErrorMessage('');
    closePayment();
  };

  const handleOpenAuth = () => {
    closePayment();
    useModalStore.getState().openAuth();
  };

  const handleConfirm = async () => {
    if (!paymentConfig) return;

    setStep('confirming');
    setErrorMessage('');

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: paymentConfig.type,
          listingId: paymentConfig.listingId || undefined,
          amount: paymentConfig.amount,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle 409 - existing pending payment
        if (res.status === 409 && data.existingPaymentId) {
          setCreatedPayment({
            id: data.existingPaymentId,
            type: paymentConfig.type as PaymentType,
            amount: paymentConfig.amount,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
          });
          setStep('success');
          return;
        }
        throw new Error(data.error || 'Payment creation failed');
      }

      setCreatedPayment(data);
      setStep('success');
    } catch (err) {
      console.error('[PaymentModal] Error:', err);
      setErrorMessage(err instanceof Error ? err.message : tp('payment', 'errorCreating'));
      setStep('error');
    }
  };

  const handleCopyRef = async () => {
    if (!createdPayment) return;
    try {
      await navigator.clipboard.writeText(createdPayment.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available
    }
  };

  if (!paymentConfig) return null;

  const typeColor = getPaymentTypeColor(paymentConfig.type);
  const formattedAmount = new Intl.NumberFormat(locale === 'es' ? 'es-ES' : 'en-US', {
    style: 'currency',
    currency: 'EUR',
  }).format(paymentConfig.amount);

  // Not logged in — show login prompt
  if (!session) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md p-0">
          <DialogTitle className="sr-only">{tp('payment', 'title')}</DialogTitle>
          <div className="p-6 space-y-4">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex items-center justify-center size-14 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <AlertCircle className="size-7 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-lg font-bold text-foreground">
                {locale === 'es' ? 'Inicia sesión para continuar' : 'Sign in to continue'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {locale === 'es'
                  ? 'Necesitas iniciar sesión para realizar pagos.'
                  : 'You need to sign in to make payments.'}
              </p>
            </div>
            <Button className="w-full font-semibold" onClick={handleOpenAuth}>
              {tp('nav', 'login')}
            </Button>
            <Button variant="ghost" className="w-full" onClick={handleClose}>
              {tp('common', 'cancel')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogTitle className="sr-only">{tp('payment', 'title')}</DialogTitle>

        <AnimatePresence mode="wait">
          {/* ═══ STEP 1: ORDER SUMMARY ═══ */}
          {step === 'summary' && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-0"
            >
              {/* Header */}
              <div className="px-6 pt-6 pb-4 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex items-center justify-center size-9 rounded-lg shrink-0"
                    style={{ backgroundColor: `${typeColor}18` }}
                  >
                    <CreditCard className="size-4.5" style={{ color: typeColor }} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">
                      {tp('payment', 'title')}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {tp('payment', 'orderSummary')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Details Card */}
              <div className="px-6 pb-4">
                <div className="rounded-xl border bg-card p-4 space-y-3">
                  {/* Payment type */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{tp('payment', 'type')}</span>
                    <Badge
                      variant="outline"
                      className="font-medium text-xs"
                      style={{ borderColor: typeColor, color: typeColor }}
                    >
                      {getPaymentTypeLabel(paymentConfig.type, locale)}
                    </Badge>
                  </div>

                  {/* Listing title (if applicable) */}
                  {paymentConfig.listingTitle && (
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-sm text-muted-foreground shrink-0">{tp('payment', 'listing')}</span>
                      <span className="text-sm font-medium text-foreground text-right line-clamp-1">
                        {paymentConfig.listingTitle}
                      </span>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="border-t" />

                  {/* Amount */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{tp('payment', 'amount')}</span>
                    <span className="text-xl font-extrabold" style={{ color: typeColor }}>
                      {formattedAmount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Manual Payment Info */}
              <div className="px-6 pb-4">
                <div className="rounded-lg bg-muted/50 p-3 flex items-start gap-2.5">
                  <CircleDot className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {tp('payment', 'manualPayment')}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {tp('payment', 'manualPaymentDesc')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-6 pb-6 flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleClose}
                >
                  {tp('common', 'cancel')}
                </Button>
                <Button
                  className="flex-1 gap-2 font-semibold text-white"
                  style={{ backgroundColor: typeColor }}
                  onClick={handleConfirm}
                >
                  <CreditCard className="size-4" />
                  {tp('payment', 'confirmOrder')}
                </Button>
              </div>
            </motion.div>
          )}

          {/* ═══ STEP 2: CONFIRMING (Loading) ═══ */}
          {step === 'confirming' && (
            <motion.div
              key="confirming"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="p-10 flex flex-col items-center justify-center gap-4 text-center"
            >
              <Loader2 className="size-10 text-primary animate-spin" />
              <div>
                <p className="font-semibold text-foreground">{tp('payment', 'confirming')}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {locale === 'es' ? 'Registrando tu pedido...' : 'Registering your order...'}
                </p>
              </div>
            </motion.div>
          )}

          {/* ═══ STEP 3: SUCCESS ═══ */}
          {step === 'success' && createdPayment && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="space-y-0"
            >
              {/* Success Header */}
              <div className="px-6 pt-6 pb-4 flex flex-col items-center gap-3 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                  className="flex items-center justify-center size-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30"
                >
                  <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400" />
                </motion.div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    {tp('payment', 'success')}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {tp('payment', 'pendingMessage')}
                  </p>
                </div>
              </div>

              {/* Reference + Details */}
              <div className="px-6 pb-4 space-y-3">
                <div className="rounded-xl border bg-card p-4 space-y-3">
                  {/* Reference Number */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-muted-foreground shrink-0">
                      {tp('payment', 'referenceNumber')}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono select-all">
                        {createdPayment.id.slice(0, 12)}...
                      </code>
                      <button
                        onClick={handleCopyRef}
                        className="flex items-center justify-center size-7 rounded-md hover:bg-muted transition-colors"
                        title={locale === 'es' ? 'Copiar' : 'Copy'}
                      >
                        {copied ? (
                          <Check className="size-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="size-3.5 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Type */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{tp('payment', 'type')}</span>
                    <span className="text-sm font-medium text-foreground">
                      {getPaymentTypeLabel(createdPayment.type, locale)}
                    </span>
                  </div>

                  {/* Amount */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{tp('payment', 'amount')}</span>
                    <span className="text-sm font-bold" style={{ color: typeColor }}>
                      {formattedAmount}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{tp('payment', 'status')}</span>
                    <Badge variant="outline" className="text-xs font-medium border-amber-400 text-amber-600">
                      {tp('payment', 'statuses.PENDING')}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="px-6 pb-4">
                <div className="rounded-lg bg-primary/5 dark:bg-primary/10 p-3 space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    {tp('payment', 'contactAdmin')}
                  </p>
                  <a
                    href={`mailto:${tp('payment', 'contactEmail')}?subject=${encodeURIComponent(
                      locale === 'es'
                        ? `Pago pendiente - Ref: ${createdPayment.id.slice(0, 12)}`
                        : `Pending payment - Ref: ${createdPayment.id.slice(0, 12)}`
                    )}`}
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Mail className="size-3.5" />
                    {tp('payment', 'contactEmail')}
                  </a>
                </div>
              </div>

              {/* Close Button */}
              <div className="px-6 pb-6">
                <Button className="w-full font-semibold" onClick={handleClose}>
                  {tp('payment', 'closeSuccess')}
                </Button>
              </div>
            </motion.div>
          )}

          {/* ═══ STEP ERROR ═══ */}
          {step === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="p-8 flex flex-col items-center gap-4 text-center"
            >
              <div className="flex items-center justify-center size-14 rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertCircle className="size-7 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{tp('payment', 'errorPayment')}</p>
                <p className="text-sm text-muted-foreground mt-1">{errorMessage}</p>
              </div>
              <div className="flex gap-2 w-full max-w-xs">
                <Button variant="outline" className="flex-1" onClick={handleClose}>
                  {tp('common', 'cancel')}
                </Button>
                <Button className="flex-1" onClick={() => setStep('summary')}>
                  {tp('common', 'retry')}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
