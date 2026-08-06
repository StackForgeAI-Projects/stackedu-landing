"use client";

import { MODULE_ICONS } from "@/lib/content";
import { useLocale } from "@/lib/i18n";

export function ModulesSection() {
  const { t } = useLocale();

  return (
    <section id="modules" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="reveal flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
          <div className="max-w-2xl">
            <div className="eyebrow text-primary mb-3">
              {t.modules.eyebrow}
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-ink">
              {t.modules.title}
            </h2>
          </div>
          <span className="eyebrow tracking-widest text-muted-foreground bg-secondary border border-border rounded-full px-4 py-2 self-start">
            {t.modules.version}
          </span>
        </div>
        <div className="reveal grid grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-3xl overflow-hidden border border-border">
          {t.modules.items.map((m, i) => {
            const Icon = MODULE_ICONS[i];
            return (
              <div
                key={m.t}
                className="group bg-white p-7 hover:bg-surface-alt transition-colors relative"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="grid place-items-center size-11 rounded-xl bg-primary/8 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <Icon className="size-5" />
                  </div>
                  <span className="eyebrow text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="font-bold text-ink">{m.t}</div>
                <div className="mt-2 text-xs text-muted-foreground leading-relaxed">{m.d}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
