// ═══════════════════════════════════════════════════════════════
// GRAN CANARIA CONECTA - PricingSection Component
// Displays the 4 pricing plans as a comparison on the homepage
// ═══════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Store, Star, Zap } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SectionContainer } from '@/components/shared/SectionContainer';
import { useI18n } from '@/hooks/use-i18n';
import { PRICING_PLANS } from '@/lib/types';
import { useModalStore } from '@/lib/modal-store';
import type { PricingPlan } from '@/lib/types';

/** Icon mapping for each plan tier */
const PLAN_ICONS: Record<string, React.ElementType> = {
  FREE: Check,
  HIGHLIGHTED: Zap,
  VIP: Star,
  BUSINESS: Store,
};

export function PricingSection() {
  const { locale, t, tp } = useI18n();
  const openPromoteBusinessPage = useModalStore((s) => s.openPromoteBusinessPage);
  const [plans, setPlans] = useState<PricingPlan[]>(PRICING_PLANS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/listing-plans');
        if (res.ok) {
          const data: PricingPlan[] = await res.json();
          if (!cancelled && Array.isArray(data) && data.length > 0) {
            setPlans(data);
          }
        }
      } catch {
        // Fall back to PRICING_PLANS constant
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5 }}
    >
      <SectionContainer
        title={t('pricing', 'title')}
        subtitle={t('pricing', 'subtitle')}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-stretch">
          {plans.map((plan, index) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              locale={locale}
              tp={tp}
              index={index}
            />
          ))}
        </div>

        {/* Business promo banner */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-8"
        >
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary via-primary/90 to-secondary text-primary-foreground p-6 sm:p-8">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center size-12 rounded-xl bg-white/15 shrink-0">
                  <Store className="size-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold mb-1">
                    {tp('pricing', 'promoteBusiness')}
                  </h3>
                  <p className="text-sm text-primary-foreground/90 leading-relaxed max-w-lg">
                    {tp('directory', 'promoteDesc')}
                  </p>
                </div>
              </div>
              <Button
                size="lg"
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold gap-2 shrink-0 shadow-lg"
                onClick={openPromoteBusinessPage}
              >
                {tp('directory', 'promoteCta')}
                <Sparkles className="size-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      </SectionContainer>
    </motion.div>
  );
}

/** Individual pricing plan card */
interface PricingCardProps {
  plan: PricingPlan;
  locale: 'es' | 'en';
  tp: (section: string, key: string) => string;
  index: number;
}

function PricingCard({ plan, locale, tp, index }: PricingCardProps) {
  const isPopular = plan.isPopular === true;
  const isFree = plan.price === 0;
  const isBusiness = plan.id === 'BUSINESS';
  const features = locale === 'es' ? plan.featuresEs : plan.featuresEn;
  const name = locale === 'es' ? plan.nameEs : plan.nameEn;
  const IconComponent = PLAN_ICONS[plan.id] || Check;

  // Pricing label: Business uses /mes, others use /anuncio
  const pricingLabel = isBusiness
    ? tp('pricing', 'monthly')
    : tp('pricing', 'perPost');

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className={isPopular ? 'md:-mt-3 md:mb-[-12px]' : ''}
    >
      <Card
        className={`
          relative flex flex-col h-full
          transition-all duration-300
          hover:shadow-lg hover:-translate-y-1
          ${isPopular ? 'ring-2 shadow-xl scale-[1.02] xl:scale-105 z-10' : 'border-border'}
        `}
        style={isPopular ? { borderColor: plan.color } : undefined}
      >
        {/* Popular badge */}
        {isPopular && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
            <Badge
              className="px-3 py-1 text-xs font-bold shadow-md gap-1.5"
              style={{
                backgroundColor: plan.color,
                color: '#ffffff',
                borderColor: plan.color,
              }}
            >
              <Sparkles className="size-3" />
              {tp('pricing', 'mostPopular')}
            </Badge>
          </div>
        )}

        <CardHeader className="text-center pb-2 pt-6">
          {/* Plan icon circle */}
          <div
            className="flex items-center justify-center size-12 rounded-full mx-auto mb-3"
            style={{ backgroundColor: `${plan.color}18` }}
          >
            <IconComponent className="size-5" style={{ color: plan.color }} />
          </div>

          {/* Plan name */}
          <CardTitle className="text-lg font-bold">{name}</CardTitle>

          {/* Plan tier badge */}
          <Badge
            variant="outline"
            className="mt-1 text-[10px] font-bold uppercase tracking-wider"
            style={{
              borderColor: `${plan.color}50`,
              color: plan.color,
              backgroundColor: `${plan.color}10`,
            }}
          >
            {plan.badge}
          </Badge>
        </CardHeader>

        <CardContent className="flex flex-col flex-1 gap-4 pb-4">
          {/* Price */}
          <div className="text-center">
            <div className="flex items-baseline justify-center gap-1">
              {isFree ? (
                <span className="text-3xl md:text-4xl font-extrabold" style={{ color: plan.color }}>
                  {tp('pricing', 'free')}
                </span>
              ) : (
                <>
                  <span className="text-4xl md:text-5xl font-extrabold" style={{ color: plan.color }}>
                    €{plan.price}
                  </span>
                  <span className="text-sm text-muted-foreground font-medium">
                    {pricingLabel}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Divider */}
          <div
            className="h-px w-full"
            style={{ backgroundColor: `${plan.color}20` }}
          />

          {/* Features list */}
          <ul className="flex flex-col gap-2.5 text-sm text-foreground/80 flex-1">
            {features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2">
                <Check
                  className="size-4 shrink-0 mt-0.5"
                  style={{ color: plan.color }}
                />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>

        <CardFooter className="pt-2 pb-6 px-6">
          <Button
            className="w-full font-semibold transition-all"
            variant={isPopular ? 'default' : 'outline'}
            style={
              isPopular
                ? { backgroundColor: plan.color, borderColor: plan.color }
                : { borderColor: `${plan.color}40`, color: plan.color }
            }
            onMouseEnter={(e) => {
              if (!isPopular) {
                e.currentTarget.style.backgroundColor = `${plan.color}10`;
              }
            }}
            onMouseLeave={(e) => {
              if (!isPopular) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {isFree ? tp('pricing', 'choosePlan') : tp('pricing', 'choosePlan')}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
