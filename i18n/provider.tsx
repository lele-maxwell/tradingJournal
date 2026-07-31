'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { locales, type Locale, localeNames } from './config';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  localeNames: typeof localeNames;
}

const I18nContext = createContext<I18nContextType | null>(null);

// Cache for loaded messages
const messageCache: Record<Locale, Record<string, string>> = {
  en: {},
  fr: {},
};

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

// Load messages dynamically
async function loadMessages(locale: Locale): Promise<Record<string, string>> {
  if (Object.keys(messageCache[locale]).length > 0) {
    return messageCache[locale];
  }

  const messages = await import(`../messages/${locale}.json`);
  messageCache[locale] = flattenMessages(messages.default);
  return messageCache[locale];
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [messages, setMessages] = useState<Record<string, string>>({});

  useEffect(() => {
    // Load initial messages
    loadMessages(locale).then(setMessages);

    // Check for saved preference
    const saved = typeof window !== 'undefined'
      ? (localStorage.getItem('locale') as Locale | null)
      : null;

    if (saved && locales.includes(saved)) {
      setLocaleState(saved);
      loadMessages(saved).then(setMessages);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
    loadMessages(newLocale).then(setMessages);
  };

  const t = (key: string): string => {
    return messages[key] || key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, localeNames }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}