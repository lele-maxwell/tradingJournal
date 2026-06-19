"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LOCALE_COOKIE, locales, type Locale } from "@/i18n/config";

export function LanguageSelector() {
  const locale = useLocale() as Locale;
  const t = useTranslations("language");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onSelect(nextLocale: Locale) {
    if (nextLocale === locale) return;

    document.cookie = `${LOCALE_COOKIE}=${nextLocale};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div
      role="group"
      aria-label={t("label")}
      style={{
        display: "inline-flex",
        gap: 4,
        padding: 4,
        background: "var(--bg-surface-2)",
        border: "1px solid var(--border)",
        borderRadius: 7,
      }}
    >
      {locales.map((loc) => {
        const isActive = loc === locale;
        return (
          <button
            key={loc}
            type="button"
            onClick={() => onSelect(loc)}
            disabled={isPending}
            aria-pressed={isActive}
            style={{
              padding: "4px 10px",
              fontSize: 12,
              fontWeight: isActive ? 600 : 400,
              borderRadius: 5,
              border: "none",
              cursor: isPending ? "wait" : "pointer",
              background: isActive ? "var(--accent)" : "transparent",
              color: isActive ? "#fff" : "var(--text-secondary)",
              transition: "all 0.12s",
              opacity: isPending ? 0.7 : 1,
            }}
          >
            {loc.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
