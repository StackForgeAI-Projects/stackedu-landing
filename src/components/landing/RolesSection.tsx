"use client";

import { Check } from "lucide-react";
import { ROLE_ICONS, ROLE_TAGS } from "@/lib/content";
import { useLocale } from "@/lib/i18n";

export function RolesSection() {
  const { t } = useLocale();

  return (
    <section id="roles" className="py-24 bg-surface-alt">
      <div className="mx-auto max-w-7xl px-6">
        <div className="reveal max-w-2xl">
          <div className="eyebrow text-primary mb-3">
            {t.roles.eyebrow}
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-ink">
            {t.roles.title}
          </h2>
          <p className="mt-4 text-muted-foreground">{t.roles.subtitle}</p>
        </div>

        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-5 reveal">
          {t.roles.items.map((r, i) => {
            const Icon = ROLE_ICONS[i];
            return (
              <div
                key={r.name}
                className="group bg-white p-7 rounded-3xl border border-border hover:border-primary/30 hover:-translate-y-1 hover:shadow-lift transition-all"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="grid place-items-center size-12 rounded-2xl bg-primary/8 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <Icon className="size-5" />
                  </div>
                  <span className="eyebrow tracking-widest text-muted-foreground">
                    /{ROLE_TAGS[i]}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-ink mb-4">{r.name}</h3>
                <ul className="space-y-2.5">
                  {r.caps.map((c) => (
                    <li key={c} className="flex items-start gap-2.5 text-sm text-foreground/70">
                      <Check className="size-4 text-primary shrink-0 mt-0.5" strokeWidth={3} />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
