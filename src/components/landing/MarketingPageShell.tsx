"use client";

import { Footer } from "@/components/landing/Footer";
import { Nav } from "@/components/landing/Nav";
import { LanguageProvider } from "@/lib/i18n";
import type { Market } from "@/lib/market";

export function MarketingPageShell({
  market,
  children,
}: {
  market: Market;
  children: React.ReactNode;
}) {
  return (
    <LanguageProvider market={market}>
      <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
        <Nav />
        <main className="flex-1 px-6 py-24">{children}</main>
        <Footer />
      </div>
    </LanguageProvider>
  );
}
