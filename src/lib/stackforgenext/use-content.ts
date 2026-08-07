"use client";

import { useMemo } from "react";
import { useLocale } from "@/lib/i18n";
import { getStackeduSiteUrl } from "@/lib/market";
import { getStackForgeNextContent } from "./content";

export function useStackForgeNextContent() {
  const { locale, market } = useLocale();
  return useMemo(
    () => getStackForgeNextContent(locale, market, getStackeduSiteUrl(market)),
    [locale, market],
  );
}
