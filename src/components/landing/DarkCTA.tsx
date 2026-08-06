"use client";

import { ArrowRight } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { scrollToContact } from "@/lib/scroll";

export function DarkCTA() {
  const { t } = useLocale();

  return (
    <section className="px-6 py-24">
      <div className="reveal relative mx-auto max-w-7xl bg-ink rounded-[36px] py-14 sm:py-20 px-6 sm:px-8 md:px-16 text-center overflow-hidden">
        <div className="absolute top-0 right-0 h-96 w-96 bg-primary/25 blur-[120px] rounded-full" />
        <div className="absolute inset-0 dotted-pattern opacity-[0.06]" />
        <div className="relative">
          <div className="eyebrow tracking-[0.3em] text-primary-bright mb-4 sm:mb-6">
            {t.darkCta.eyebrow}
          </div>
          <h2 className="text-white text-[clamp(1.875rem,8vw,3.75rem)] font-extrabold tracking-tight leading-[1.08]">
            <span className="block whitespace-nowrap">{t.darkCta.titleLine1}</span>
            <span className="block whitespace-nowrap">{t.darkCta.titleLine2}</span>
            <span className="block whitespace-nowrap text-primary-bright">{t.darkCta.titleAccent}</span>
          </h2>
          <div className="mt-8 sm:mt-10 flex flex-wrap gap-3 justify-center">
            <button
              type="button"
              onClick={scrollToContact}
              className="bg-primary-bright text-ink px-8 py-4 rounded-full font-extrabold hover:scale-105 transition-transform inline-flex items-center gap-2"
            >
              {t.darkCta.bookDemo} <ArrowRight className="size-4" />
            </button>
            <button
              type="button"
              onClick={scrollToContact}
              className="border border-white/20 text-white px-8 py-4 rounded-full font-bold hover:bg-white/5 transition-colors"
            >
              {t.darkCta.talkSales}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
