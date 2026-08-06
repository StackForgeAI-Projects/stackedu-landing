"use client";

import { BadgeStrip } from "@/components/ui/BadgeStrip";
import { PAYMENT_DOTS } from "@/lib/content";
import { useLocale } from "@/lib/i18n";

export function PaymentIntegrations() {
  const { t } = useLocale();

  return (
    <BadgeStrip
      eyebrow={t.payments.eyebrow}
      headline={t.payments.subtext}
      labels={t.payments.methods}
      dots={PAYMENT_DOTS}
      eyebrowClass="text-primary"
      className="border-y border-border bg-gradient-to-r from-accent/70 via-white to-primary/8"
    />
  );
}
