// ═══════════════════════════════════════════════════════════════
// GRAN CANARIA CONECTA - Internationalization Hook
// Simple, lightweight i18n without external dependencies
// ═══════════════════════════════════════════════════════════════

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import translations, { type TranslationSection } from '@/lib/translations';
import type { Locale } from '@/lib/types';

interface I18nState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (sectionOrPath: string, key?: string) => { es: string; en: string };
  tp: (sectionOrPath: string, key?: string) => string;
}

export const useI18n = create<I18nState>()(
  persist(
    (set, get) => ({
      locale: 'es',

      setLocale: (locale) => set({ locale }),

      toggleLocale: () =>
        set((state) => ({
          locale: state.locale === 'es' ? 'en' : 'es',
        })),

      // Returns the full translation object { es: string, en: string }
      // Supports both: t('admin', 'dashboard') and t('admin.dashboard')
      t: (sectionOrPath, maybeKey) => {
        let section: string;
        let key: string;
        if (maybeKey !== undefined) {
          section = sectionOrPath as string;
          key = maybeKey;
        } else {
          const path = sectionOrPath as string;
          const dotIdx = path.indexOf('.');
          if (dotIdx > 0) {
            section = path.substring(0, dotIdx);
            key = path.substring(dotIdx + 1);
          } else {
            section = path;
            key = path;
          }
        }
        const sectionData = translations[section] as Record<string, { es: string; en: string }>;
        return sectionData?.[key] || { es: key, en: key };
      },

      // Returns the translation for the current locale
      // Supports both: tp('admin', 'dashboard') and tp('admin.dashboard')
      tp: (sectionOrPath, maybeKey) => {
        let section: string;
        let key: string;
        if (maybeKey !== undefined) {
          section = sectionOrPath as string;
          key = maybeKey;
        } else {
          const path = sectionOrPath as string;
          const dotIdx = path.indexOf('.');
          if (dotIdx > 0) {
            section = path.substring(0, dotIdx);
            key = path.substring(dotIdx + 1);
          } else {
            section = path;
            key = path;
          }
        }
        const sectionData = translations[section] as Record<string, { es: string; en: string }>;
        const trans = sectionData?.[key] || { es: section + '.' + key, en: section + '.' + key };
        return trans[get().locale] || trans.es;
      },
    }),
    {
      name: 'gc-conecta-locale',
      partialize: (state) => ({ locale: state.locale }),
    }
  )
);
