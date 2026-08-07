import type { Market } from "@/lib/market";

export type Locale = "en" | "fr" | "rw";

export const LOCALES: { code: Locale; label: string; short: string }[] = [
  { code: "en", label: "English", short: "EN" },
  { code: "fr", label: "Français", short: "FR" },
  { code: "rw", label: "Ikinyarwanda", short: "RW" },
];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_STORAGE_KEY = "stackedu-locale";

export function getLocalesForMarket(market: Market) {
  if (market === "africa") {
    return LOCALES.filter((locale) => locale.code !== "rw");
  }
  return LOCALES;
}

export function isLocaleAllowedForMarket(locale: Locale, market: Market) {
  return getLocalesForMarket(market).some((entry) => entry.code === locale);
}
