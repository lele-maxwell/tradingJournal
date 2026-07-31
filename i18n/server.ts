import type { Locale } from './config';
import { locales } from './config';

// Server-side message cache
let messagesCache: Record<Locale, Record<string, string> | null> = { en: null, fr: null };

// Flatten nested object into dot-notation keys
function flattenMessages(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      result[newKey] = value;
    } else if (typeof value === 'object' && value !== null) {
      Object.assign(result, flattenMessages(value as Record<string, unknown>, newKey));
    }
  }

  return result;
}

// Get messages for a locale (server-side)
async function getMessages(locale: Locale): Promise<Record<string, string>> {
  if (messagesCache[locale]) {
    return messagesCache[locale]!;
  }

  // Dynamic import for server-side
  const messages = await import(`../messages/${locale}.json`);
  messagesCache[locale] = flattenMessages(messages.default);
  return messagesCache[locale]!;
}

// Translation function creator
export async function createTranslator(locale: Locale = 'en') {
  const messages = await getMessages(locale);

  return function t(key: string): string {
    return messages[key] || key;
  };
}

// Get locale from request headers or default
export function getLocaleFromHeaders(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return 'en';

  // Parse Accept-Language header
  const languages = acceptLanguage.split(',')
    .map(lang => lang.split(';')[0].trim().substring(0, 2));

  for (const lang of languages) {
    if (locales.includes(lang as Locale)) {
      return lang as Locale;
    }
  }

  return 'en';
}