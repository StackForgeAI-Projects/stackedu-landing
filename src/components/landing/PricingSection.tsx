"use client";

import { ArrowRight, Check } from "lucide-react";
import { PLAN_FEATURED } from "@/lib/content";
import { useLocale } from "@/lib/i18n";
import { scrollToContact } from "@/lib/scroll";

export function PricingSection() {
  const { t } = useLocale();

  return (
    <section id="pricing" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="reveal text-center max-w-2xl mx-auto mb-14">
          <div className="eyebrow text-primary mb-3">
            {t.pricing.eyebrow}
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-ink">
            {t.pricing.title}
          </h2>
          <p className="mt-4 text-muted-foreground">{t.pricing.subtitle}</p>
        </div>

        <div className="reveal grid md:grid-cols-3 gap-5 items-stretch">
          {t.pricing.plans.map((p, i) => {
            const featured = PLAN_FEATURED[i];
            return (
              <div
                key={p.name}
                className={`relative flex flex-col rounded-3xl p-8 border transition-all ${
                  featured
                    ? "bg-ink text-white border-ink shadow-lift md:-translate-y-3"
                    : "bg-white border-border hover:border-primary/30 hover:shadow-lift"
                }`}
              >
                {featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-bright text-ink eyebrow tracking-widest px-3 py-1 rounded-full">
                    {t.pricing.mostChosen}
                  </span>
                )}
                <div>
                  <div className={`font-bold text-lg ${featured ? "text-white" : "text-ink"}`}>
                    {p.name}
                  </div>
                  <div
                    className={`text-xs mt-1 ${featured ? "text-white/60" : "text-muted-foreground"}`}
                  >
                    {p.tag}
                  </div>
                </div>
                <div className="mt-7 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span
                    className={`text-4xl font-extrabold tracking-tight ${
                      featured ? "text-primary-bright" : "text-ink"
                    }`}
                  >
                    {p.price}
                  </span>
                  <span
                    className={`text-xs eyebrow tracking-widest whitespace-nowrap ${
                      featured ? "text-white/60" : "text-muted-foreground"
                    }`}
                  >
                    {p.unit}
                  </span>
                </div>
                <ul
                  className={`mt-7 space-y-3 text-sm flex-1 ${
                    featured ? "text-white/80" : "text-foreground/75"
                  }`}
                >
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check
                        className={`size-4 shrink-0 mt-0.5 ${
                          featured ? "text-primary-bright" : "text-primary"
                        }`}
                        strokeWidth={3}
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={scrollToContact}
                  className={`mt-8 w-full py-3.5 rounded-full font-bold transition-all inline-flex items-center justify-center gap-2 ${
                    featured
                      ? "bg-primary-bright text-ink hover:scale-[1.02]"
                      : "bg-ink text-white hover:bg-primary"
                  }`}
                >
                  {p.cta}
                  <ArrowRight className="size-4" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="reveal mt-10 text-center text-xs text-muted-foreground">
          {t.pricing.footnote}
        </div>
      </div>
    </section>
  );
}
