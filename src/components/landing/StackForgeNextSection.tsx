"use client";

import { ArrowRight, Heart, Sparkles } from "lucide-react";
import { STACKFORGE_NEXT_IMAGE } from "@/lib/assets";
import { useLocale } from "@/lib/i18n";

const STACKFORGE_NEXT_URL = "https://stackforgeai.africa";

export function StackForgeNextSection() {
  const { t } = useLocale();

  return (
    <section id="stackforgenext" className="relative overflow-hidden py-20 md:py-28 bg-background">
      <div className="pointer-events-none absolute inset-0 dotted-pattern opacity-40" />
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/8 blur-3xl" />
      <div className="pointer-events-none absolute top-40 right-0 h-96 w-96 rounded-full bg-primary-bright/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-12 items-center">
          <div className="reveal">
            <span className="inline-flex items-center gap-2 eyebrow text-primary bg-primary/8 border border-primary/15 px-3 py-1.5 rounded-full">
              <Heart className="size-3.5" />
              {t.stackForgeNext.eyebrow}
            </span>
            <h2 className="mt-6 text-3xl md:text-4xl lg:text-[3.25rem] leading-[1.08] font-extrabold tracking-tight text-ink">
              {t.stackForgeNext.title}
            </h2>
            <p className="mt-5 text-muted-foreground text-lg leading-relaxed max-w-xl">
              {t.stackForgeNext.paragraph1}
            </p>
            <p className="mt-4 text-muted-foreground leading-relaxed max-w-xl">
              {t.stackForgeNext.paragraph2}
            </p>
            <a
              href={STACKFORGE_NEXT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 bg-ink text-white font-bold px-6 py-3.5 rounded-full hover:bg-primary transition-colors"
            >
              {t.stackForgeNext.cta}
              <ArrowRight className="size-4" />
            </a>
          </div>

          <div className="relative reveal mt-10 lg:mt-0">
            <div className="relative overflow-hidden rounded-3xl border border-border shadow-lift">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={STACKFORGE_NEXT_IMAGE}
                alt={t.stackForgeNext.imageAlt}
                width={1024}
                height={768}
                className="block h-[220px] sm:h-[300px] lg:h-[360px] w-full object-cover"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white/90 px-4 py-2 text-sm font-semibold text-ink shadow-soft backdrop-blur-md">
                  <Sparkles className="size-4 text-primary" />
                  {t.stackForgeNext.badge}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
