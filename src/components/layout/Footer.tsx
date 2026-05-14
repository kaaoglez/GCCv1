'use client';

import { useState, useCallback, useEffect } from 'react';
import { Leaf, Instagram, Facebook, Twitter, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useI18n } from '@/hooks/use-i18n';
import { navigateTo } from '@/hooks/use-navigation';
import { APP_CONFIG, SITE_URLS } from '@/lib/constants';

export function Footer() {
  const { locale } = useI18n();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setEmail('');
    setSubscribed(true);
  }, [email]);

  useEffect(() => {
    if (!subscribed) return;
    const timer = setTimeout(() => setSubscribed(false), 3000);
    return () => clearTimeout(timer);
  }, [subscribed]);

  const t = (es: string, en: string) => (locale === 'en' ? en : es);

  return (
    <footer className="mt-auto bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">

          {/* ── Column 1: Logo + Social ─────────────── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                <Leaf className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-heading font-bold text-lg">{APP_CONFIG.name}</span>
            </div>
            <p className="text-primary-foreground/80 text-sm leading-relaxed mb-6">
              {t('Conectando a la comunidad de Gran Canaria de forma sostenible', 'Connecting Gran Canaria\'s community sustainably')}
            </p>
            <div className="flex items-center gap-3">
              <a href={SITE_URLS.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"><Instagram className="h-4 w-4" /></a>
              <a href={SITE_URLS.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"><Facebook className="h-4 w-4" /></a>
              <a href={SITE_URLS.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"><Twitter className="h-4 w-4" /></a>
              <a href={SITE_URLS.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"><Send className="h-4 w-4" /></a>
            </div>
          </div>

          {/* ── Column 2: Quick Links ────────────────── */}
          <div>
            <h3 className="font-heading font-semibold text-sm uppercase tracking-wider mb-4">
              {t('Enlaces rápidos', 'Quick Links')}
            </h3>
            <ul className="space-y-2.5">
              <li><button type="button" onClick={() => navigateTo('anuncios')} className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors text-left cursor-pointer bg-transparent border-0 p-0">{t('Anuncios', 'Classifieds')}</button></li>
              <li><button type="button" onClick={() => navigateTo('categorias')} className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors text-left cursor-pointer bg-transparent border-0 p-0">{t('Categorías', 'Categories')}</button></li>
              <li><button type="button" onClick={() => navigateTo('eventos')} className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors text-left cursor-pointer bg-transparent border-0 p-0">{t('Eventos', 'Events')}</button></li>
              <li><button type="button" onClick={() => navigateTo('news')} className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors text-left cursor-pointer bg-transparent border-0 p-0">{t('Noticias', 'News')}</button></li>
              <li><button type="button" onClick={() => navigateTo('directory')} className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors text-left cursor-pointer bg-transparent border-0 p-0">{t('Directorio', 'Directory')}</button></li>
              <li><button type="button" onClick={() => navigateTo('recycling')} className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors text-left cursor-pointer bg-transparent border-0 p-0">{t('Reciclaje', 'Recycling')}</button></li>
            </ul>
          </div>

          {/* ── Column 3: About + Legal ─────────────── */}
          <div>
            <h3 className="font-heading font-semibold text-sm uppercase tracking-wider mb-4">
              {t('Acerca de', 'About')}
            </h3>
            <ul className="space-y-2.5 mb-6">
              <li>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors cursor-default">{t('Sobre nosotros', 'About us')}</span>
                  </TooltipTrigger>
                  <TooltipContent>{t('Próximamente', 'Coming soon')}</TooltipContent>
                </Tooltip>
              </li>
              <li>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors cursor-default">{t('Contacto', 'Contact')}</span>
                  </TooltipTrigger>
                  <TooltipContent>{t('Próximamente', 'Coming soon')}</TooltipContent>
                </Tooltip>
              </li>
              <li><button type="button" onClick={() => navigateTo('home')} className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors text-left cursor-pointer bg-transparent border-0 p-0">{t('Cómo funciona', 'How it works')}</button></li>
              <li><button type="button" onClick={() => navigateTo('home')} className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors text-left cursor-pointer bg-transparent border-0 p-0">{t('Precios', 'Pricing')}</button></li>
            </ul>
            <h3 className="font-heading font-semibold text-sm uppercase tracking-wider mb-4">
              {t('Legal', 'Legal')}
            </h3>
            <ul className="space-y-2.5">
              {[
                t('Términos de uso', 'Terms of use'),
                t('Privacidad', 'Privacy'),
                t('Cookies', 'Cookies'),
                t('Aviso legal', 'Legal notice'),
              ].map((label, i) => (
                <li key={i}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors cursor-default">{label}</span>
                    </TooltipTrigger>
                    <TooltipContent>{t('Próximamente', 'Coming soon')}</TooltipContent>
                  </Tooltip>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Column 4: Newsletter ─────────────────── */}
          <div>
            <h3 className="font-heading font-semibold text-sm uppercase tracking-wider mb-4">Newsletter</h3>
            <p className="text-sm text-primary-foreground/80 mb-4">
              {t('Recibe novedades y eventos en tu email.', 'Get news and events in your inbox.')}
            </p>
            {subscribed ? (
              <div className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle className="h-4 w-4 text-accent-foreground" />
                <span>{t('¡Gracias por suscribirte!', 'Thanks for subscribing!')}</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('Tu email', 'Your email')}
                  className="bg-white/10 border-white/20 text-primary-foreground placeholder:text-primary-foreground/50 text-sm h-10 focus-visible:ring-white/30"
                />
                <Button type="submit" size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground shrink-0 font-semibold">
                  <Send className="h-4 w-4 mr-1.5" />
                  {t('Suscribirse', 'Subscribe')}
                </Button>
              </form>
            )}
          </div>

        </div>
      </div>

      <Separator className="bg-white/10" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-primary-foreground/80">
          <p>© {new Date().getFullYear()} {APP_CONFIG.name}. {t('Todos los derechos reservados', 'All rights reserved')}.</p>
          <p>{t('Hecho con ❤️ en Gran Canaria', 'Made with ❤️ in Gran Canaria')}</p>
        </div>
      </div>
    </footer>
  );
}
