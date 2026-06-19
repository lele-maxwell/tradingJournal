import { describe, it, expect } from "vitest";
import {
  locales,
  defaultLocale,
  LOCALE_COOKIE,
  isSupportedLocale,
  resolveLocale,
  detectLocale,
} from "@/i18n/config";

describe("i18n/config", () => {
  describe("exports", () => {
    it("exports en and fr as the supported locales", () => {
      expect(locales).toEqual(["en", "fr"]);
    });

    it("uses en as the default locale", () => {
      expect(defaultLocale).toBe("en");
    });

    it("uses NEXT_LOCALE as the cookie name", () => {
      expect(LOCALE_COOKIE).toBe("NEXT_LOCALE");
    });
  });

  describe("isSupportedLocale", () => {
    it("accepts en", () => {
      expect(isSupportedLocale("en")).toBe(true);
    });

    it("accepts fr", () => {
      expect(isSupportedLocale("fr")).toBe(true);
    });

    it("rejects unsupported locale codes", () => {
      expect(isSupportedLocale("de")).toBe(false);
      expect(isSupportedLocale("es")).toBe(false);
      expect(isSupportedLocale("EN")).toBe(false);
      expect(isSupportedLocale("en-US")).toBe(false);
    });

    it("rejects empty string", () => {
      expect(isSupportedLocale("")).toBe(false);
    });

    it("rejects non-string values", () => {
      expect(isSupportedLocale(null)).toBe(false);
      expect(isSupportedLocale(undefined)).toBe(false);
      expect(isSupportedLocale(123)).toBe(false);
    });

    it("narrows the type to Locale for accepted values", () => {
      const value: unknown = "fr";
      if (isSupportedLocale(value)) {
        // Asserts value is Locale here
        const locale: "en" | "fr" = value;
        expect(locale).toBe("fr");
      }
    });
  });

  describe("resolveLocale", () => {
    it("returns the value when it is a supported locale", () => {
      expect(resolveLocale("en")).toBe("en");
      expect(resolveLocale("fr")).toBe("fr");
    });

    it("falls back to defaultLocale for unsupported input", () => {
      expect(resolveLocale("de")).toBe(defaultLocale);
      expect(resolveLocale("xyz")).toBe(defaultLocale);
    });

    it("falls back to defaultLocale for empty string", () => {
      expect(resolveLocale("")).toBe(defaultLocale);
    });

    it("falls back to defaultLocale for null/undefined", () => {
      expect(resolveLocale(null)).toBe(defaultLocale);
      expect(resolveLocale(undefined)).toBe(defaultLocale);
    });
  });

  describe("detectLocale", () => {
    it("returns the first matching base language from Accept-Language", () => {
      expect(detectLocale("fr-FR,fr;q=0.9,en;q=0.8")).toBe("fr");
      expect(detectLocale("en-US,en;q=0.9")).toBe("en");
    });

    it("prefers the higher-priority matching language", () => {
      expect(detectLocale("fr;q=0.9,en;q=0.8")).toBe("fr");
      expect(detectLocale("en;q=0.9,fr;q=0.8")).toBe("en");
    });

    it("matches a regional variant to its base language", () => {
      expect(detectLocale("fr-CA")).toBe("fr");
      expect(detectLocale("en-GB")).toBe("en");
    });

    it("falls back to defaultLocale when no supported language is present", () => {
      expect(detectLocale("de-DE,de;q=0.9,es;q=0.8")).toBe(defaultLocale);
    });

    it("falls back to defaultLocale for empty Accept-Language", () => {
      expect(detectLocale("")).toBe(defaultLocale);
    });

    it("falls back to defaultLocale for null/undefined", () => {
      expect(detectLocale(null)).toBe(defaultLocale);
      expect(detectLocale(undefined)).toBe(defaultLocale);
    });

    it("ignores malformed segments gracefully", () => {
      expect(detectLocale(",,fr;q=0.9,,en")).toBe("fr");
    });
  });
});
