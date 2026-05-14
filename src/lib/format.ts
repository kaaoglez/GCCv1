// ═══════════════════════════════════════════════════════════════
// GRAN CANARIA CONECTA - Formatting Utilities
// Locale-aware formatting for dates, numbers, prices, and text
// ═══════════════════════════════════════════════════════════════

import type { Locale } from './types';

/**
 * Format a date string or Date object into a locale-friendly string.
 * Example: "15 de enero de 2025" / "January 15, 2025"
 */
export function formatDate(date: string | Date, locale: Locale): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format a date for calendar-style display.
 * Returns { day, month, weekday } strings.
 */
export function formatCalendarDate(
  date: string | Date,
  locale: Locale
): { day: string; month: string; weekday: string } {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return { day: '', month: '', weekday: '' };

  const day = d.getDate().toString();
  const month = d.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
    month: 'short',
  });
  const weekday = d.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
    weekday: 'short',
  });

  return { day, month, weekday };
}

/**
 * Format time as HH:mm string.
 */
export function formatTime(date: string | Date, locale: Locale): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(locale === 'es' ? 'es-ES' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a number with locale-appropriate grouping.
 * Example: 1234 → "1.234" (es) / "1,234" (en)
 */
export function formatNumber(num: number, locale: Locale): string {
  return num.toLocaleString(locale === 'es' ? 'es-ES' : 'en-US');
}

/**
 * Format a price in euros, or return "Gratis"/"Free" if null/undefined/0.
 * Example: 2500 → "2.500 €" (es) / "€2,500" (en)
 */
export function formatPrice(
  price: number | null | undefined,
  locale: Locale
): string {
  if (price == null || price === 0) {
    return locale === 'es' ? 'Gratis' : 'Free';
  }
  const formatted = price.toLocaleString(locale === 'es' ? 'es-ES' : 'en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return locale === 'es' ? `${formatted} €` : `€${formatted}`;
}

/**
 * Get a human-readable relative time string.
 * Example: "hace 3 días" / "3 days ago"
 */
export function getRelativeTime(date: string | Date, locale: Locale): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  const units =
    locale === 'es'
      ? [
          [diffSeconds, 'segundo', 'segundos'],
          [diffMinutes, 'minuto', 'minutos'],
          [diffHours, 'hora', 'horas'],
          [diffDays, 'día', 'días'],
          [diffWeeks, 'semana', 'semanas'],
          [diffMonths, 'mes', 'meses'],
          [diffYears, 'año', 'años'],
        ] as const
      : [
          [diffSeconds, 'second', 'seconds'],
          [diffMinutes, 'minute', 'minutes'],
          [diffHours, 'hour', 'hours'],
          [diffDays, 'day', 'days'],
          [diffWeeks, 'week', 'weeks'],
          [diffMonths, 'month', 'months'],
          [diffYears, 'year', 'years'],
        ] as const;

  for (let i = units.length - 1; i >= 0; i--) {
    const [value, singular, plural] = units[i];
    if (value > 0) {
      const label = value === 1 ? singular : plural;
      return locale === 'es' ? `hace ${value} ${label}` : `${value} ${label} ago`;
    }
  }

  return locale === 'es' ? 'ahora mismo' : 'just now';
}

/**
 * Truncate text to maxLength characters, appending "..." if truncated.
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '...';
}
