"use client";

import type { Market } from "@/lib/market";
import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getMessagesForMarket } from "./get-messages";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  isLocaleAllowedForMarket,
  type Locale,
} from "./locales";
import type { Messages } from "./messages";

type LocaleContextValue = {
  locale: Locale;
  market: Market;
  setLocale: (locale: Locale) => void;
  t: Messages;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readStoredLocale(market: Market): Locale {
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored === "en" || stored === "fr" || stored === "rw") {
    return isLocaleAllowedForMarket(stored, market) ? stored : DEFAULT_LOCALE;
  }
  return DEFAULT_LOCALE;
}

export function LanguageProvider({
  children,
  market,
}: {
  children: ReactNode;
  market: Market;
}) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const stored = readStoredLocale(market);
    document.documentElement.lang = stored;
    startTransition(() => {
      setLocaleState(stored);
    });
  }, [market]);

  const setLocale = useCallback(
    (next: Locale) => {
      if (!isLocaleAllowedForMarket(next, market)) return;
      setLocaleState(next);
      localStorage.setItem(LOCALE_STORAGE_KEY, next);
      document.documentElement.lang = next;
    },
    [market],
  );

  const value = useMemo(
    () => ({
      locale,
      market,
      setLocale,
      t: getMessagesForMarket(locale, market),
    }),
    [locale, market, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LanguageProvider");
  return ctx;
}
