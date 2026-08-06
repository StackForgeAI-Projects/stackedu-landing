"use client";

import { PARTNERS } from "@/lib/content";
import { useLocale } from "@/lib/i18n";

export function PartnerStrip() {
  const { t } = useLocale();

  return (
    <section className="py-16 border-t border-border">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div className="eyebrow text-muted-foreground text-center md:text-left">
            {t.partners.trustedBy}
          </div>
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-12 gap-y-4">
            {PARTNERS.map((n) => (
              <div
                key={n}
                className="text-ink/50 font-bold tracking-tight text-base hover:text-ink transition-colors"
              >
                {n}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
