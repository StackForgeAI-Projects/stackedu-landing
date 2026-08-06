"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useLocale } from "@/lib/i18n";

export function FAQ() {
  const { t } = useLocale();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 bg-surface-alt">
      <div className="mx-auto max-w-3xl px-6">
        <div className="reveal text-center mb-12">
          <div className="eyebrow text-primary mb-3">
            {t.faq.eyebrow}
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-ink">
            {t.faq.title}
          </h2>
        </div>
        <div className="reveal space-y-3">
          {t.faq.items.map((f, i) => {
            const active = open === i;
            return (
              <div
                key={f.q}
                className={`rounded-2xl border bg-white transition-colors ${
                  active ? "border-primary/30 shadow-soft" : "border-border"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpen(active ? null : i)}
                  className="w-full text-left px-6 py-5 flex items-center justify-between gap-4"
                >
                  <span className="font-bold text-ink">{f.q}</span>
                  <span
                    className={`grid place-items-center size-7 rounded-full shrink-0 transition-colors ${
                      active ? "bg-primary text-white" : "bg-secondary text-ink"
                    }`}
                  >
                    {active ? <Minus className="size-4" /> : <Plus className="size-4" />}
                  </span>
                </button>
                {active && (
                  <div className="px-6 pb-6 -mt-1 text-sm text-muted-foreground leading-relaxed">
                    {f.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
