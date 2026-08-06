"use client";

import { Check } from "lucide-react";
import { ABOUT_IMAGE } from "@/lib/assets";
import { SOLUTION_POSITIONS } from "@/lib/content";
import { useLocale } from "@/lib/i18n";

export function ProblemSolution() {
  const { t } = useLocale();

  return (
    <section id="about" className="py-24">
      <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-2 gap-14 items-center">
        <div className="reveal relative mx-auto w-full max-w-lg lg:max-w-none">
          <div className="relative aspect-[4/3] lg:aspect-[16/10] max-h-[380px] mx-auto">
            <div className="absolute -top-6 -right-6 size-40 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-4 size-48 rounded-full bg-primary-bright/10 blur-2xl pointer-events-none" />

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ABOUT_IMAGE}
              alt="Rwandan student using StackEDU on mobile"
              className="absolute inset-0 w-full h-full object-cover rounded-3xl shadow-lift"
              loading="lazy"
            />

            {t.problem.solutions.map((c, i) => (
              <div
                key={c.t}
                className={`absolute ${SOLUTION_POSITIONS[i]} w-[44%] max-w-[9.5rem] sm:max-w-none sm:w-52 p-2 sm:p-3.5 md:p-4 rounded-xl sm:rounded-2xl bg-white border border-border shadow-lift hover:border-primary/30 transition-all`}
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="grid place-items-center size-6 sm:size-7 md:size-8 rounded-md sm:rounded-lg bg-primary/10 text-primary shrink-0">
                    <Check className="size-3 sm:size-3.5 md:size-4" strokeWidth={3} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-ink text-[10px] sm:text-xs md:text-sm leading-snug">{c.t}</div>
                    <div className="text-[9px] sm:text-[11px] md:text-xs text-muted-foreground mt-0.5 leading-snug">{c.d}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="reveal">
          <div className="eyebrow text-primary mb-4">{t.problem.eyebrow}</div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-ink">
            {t.problem.title}
          </h2>
          <p className="mt-5 text-muted-foreground leading-relaxed">{t.problem.intro}</p>
          <ul className="mt-8 space-y-4">
            {t.problem.items.map((item) => (
              <li key={item} className="flex items-start gap-3 text-foreground/80">
                <span className="mt-2 size-1.5 rounded-full bg-primary shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
