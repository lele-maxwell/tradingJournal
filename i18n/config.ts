export const locales = ["en", "fr"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isSupportedLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" &&
    (locales as readonly string[]).includes(value)
  );
}

export function resolveLocale(value: string | null | undefined): Locale {
  return isSupportedLocale(value) ? value : defaultLocale;
}

export function detectLocale(
  acceptLanguage: string | null | undefined
): Locale {
  if (!acceptLanguage) return defaultLocale;

  const candidates = acceptLanguage
    .split(",")
    .map((part) => part.trim().split(";")[0].trim().toLowerCase())
    .filter(Boolean);

  for (const candidate of candidates) {
    const base = candidate.split("-")[0];
    if (isSupportedLocale(base)) return base;
  }

  return defaultLocale;
}
