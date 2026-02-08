import "server-only";
import { cookies, headers } from "next/headers";
import {
  createTranslator,
  DEFAULT_LOCALE,
  normalizeLocale,
  type Locale,
  type Translator,
} from "./index";

const LOCALE_COOKIE = "locale";

function parseAcceptLanguage(value: string | null): string | null {
  if (!value) return null;
  const [primary] = value.split(",");
  return primary?.trim() || null;
}

export async function getServerLocale(): Promise<Locale> {
  try {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
    if (cookieLocale) {
      return normalizeLocale(cookieLocale);
    }
  } catch {
    // Ignore cookie access errors and fall back to headers.
  }

  try {
    const headerStore = await headers();
    const acceptLanguage = headerStore.get("accept-language");
    return normalizeLocale(parseAcceptLanguage(acceptLanguage));
  } catch {
    return DEFAULT_LOCALE;
  }
}

export async function getServerTranslator(): Promise<Translator> {
  const locale = await getServerLocale();
  return createTranslator(locale);
}
