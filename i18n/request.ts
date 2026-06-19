import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import {
  defaultLocale,
  detectLocale,
  isSupportedLocale,
  type Locale,
} from "@/i18n/config";

async function resolveRequestLocale(): Promise<Locale> {
  const cookieStore = await cookies();

  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;
  if (isSupportedLocale(cookieLocale)) {
    return cookieLocale;
  }

  const headerStore = await headers();
  const acceptLanguage = headerStore.get("accept-language");
  return detectLocale(acceptLanguage);
}

export default getRequestConfig(async () => {
  const locale = await resolveRequestLocale();

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
