"use client";

import { BadgeStrip } from "@/components/ui/BadgeStrip";
import { useLocale } from "@/lib/i18n";

export function TrustStrip() {
  const { t } = useLocale();

  return (
    <BadgeStrip
      eyebrow={t.trust.eyebrow}
      headline={t.trust.lawRef}
      labels={t.trust.points}
      className="border-y border-primary/15 bg-gradient-to-r from-primary/10 via-surface-alt to-accent/50"
    />
  );
}
