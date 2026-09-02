"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { TESTIMONIAL_IMAGES } from "@/lib/assets";
import { useLocale } from "@/lib/i18n";

export function TestimonialsCarousel() {
  const { t } = useLocale();
  const [idx, setIdx] = useState(0);
  const items = t.testimonials.items;
  const total = items.length;
  const item = items[idx];

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % total), 7000);
    return () => clearInterval(id);
  }, [total]);

  const go = (dir: number) => setIdx((i) => (i + dir + total) % total);

  return (
    <section className="py-24 bg-surface-alt">
      <div className="mx-auto max-w-7xl px-6">
        <div className="reveal text-center max-w-2xl mx-auto mb-14">
          <div className="eyebrow text-primary mb-3">
            {t.testimonials.eyebrow}
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-ink">
            {t.testimonials.title}
          </h2>
        </div>

        <div className="reveal grid lg:grid-cols-[1fr_1.3fr] gap-6 lg:gap-10 items-stretch">
          <div className="hidden lg:block rounded-3xl overflow-hidden relative min-h-[360px] lg:min-h-[460px] shadow-lift">
            {items.map((testimonial, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={TESTIMONIAL_IMAGES[i]}
                alt={testimonial.n}
                loading="lazy"
                className={`absolute inset-0 w-full h-full object-cover object-[50%_22%] transition-opacity duration-700 ${
                  i === idx ? "opacity-100" : "opacity-0"
                }`}
              />
            ))}
          </div>

          <div className="rounded-3xl bg-ink text-white p-8 md:p-14 flex flex-col justify-between relative overflow-hidden">
            <div>
              <Sparkles className="size-8 text-primary-bright" />
              <blockquote
                key={idx}
                className="text-2xl md:text-4xl font-bold leading-tight text-white mt-6 animate-in fade-in slide-in-from-bottom-2 duration-500"
              >
                &ldquo;{item.q}&rdquo;
              </blockquote>
            </div>

            <div className="mt-10 flex items-end justify-between gap-3 sm:items-center sm:gap-4">
              <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-bright text-sm font-bold text-ink sm:size-12">
                  {item.tag}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold leading-snug sm:text-base">{item.n}</div>
                  <div className="eyebrow text-[10px] leading-snug tracking-widest text-white/60 sm:text-xs">
                    {item.r}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Previous testimonial"
                  className="grid size-8 place-items-center rounded-full border border-white/15 text-white transition-all hover:border-primary-bright hover:bg-primary-bright hover:text-ink sm:size-11"
                >
                  <ChevronLeft className="size-4 sm:size-5" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Next testimonial"
                  className="grid size-8 place-items-center rounded-full border border-white/15 text-white transition-all hover:border-primary-bright hover:bg-primary-bright hover:text-ink sm:size-11"
                >
                  <ChevronRight className="size-4 sm:size-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIdx(i)}
              aria-label={`Go to testimonial ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === idx ? "w-8 bg-ink" : "w-2 bg-ink/20 hover:bg-ink/40"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
