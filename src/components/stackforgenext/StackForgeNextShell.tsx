"use client";

import type { Market } from "@/lib/market";
import { LanguageProvider } from "@/lib/i18n";
import { StackForgeNextPage } from "./StackForgeNextPage";

export function StackForgeNextShell({ market }: { market: Market }) {
  return (
    <LanguageProvider market={market}>
      <StackForgeNextPage />
    </LanguageProvider>
  );
}
