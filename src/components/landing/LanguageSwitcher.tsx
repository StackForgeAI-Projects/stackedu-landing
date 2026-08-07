"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import { getLocalesForMarket, useLocale, type Locale } from "@/lib/i18n";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, market, setLocale } = useLocale();
  const locales = getLocalesForMarket(market);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const active = locales.find((l) => l.code === locale) ?? locales[0];

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const select = (code: Locale) => {
    setLocale(code);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={`relative inline-block ${className ?? ""}`}>
      <button
        type="button"
        aria-label="Select language"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-xs font-semibold text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
      >
        <Globe className="size-3.5 text-muted-foreground" />
        <span className="eyebrow tracking-wider">{active.short}</span>
        <ChevronDown
          className={`size-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Languages"
          className="absolute right-0 top-[calc(100%+0.4rem)] z-[60] min-w-[10.5rem] overflow-hidden rounded-2xl border border-border bg-white py-1 shadow-lift"
        >
          {locales.map(({ code, short, label }) => {
            const selected = locale === code;
            return (
              <li key={code} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => select(code)}
                  className={`flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-sm transition-colors ${
                    selected
                      ? "bg-primary/8 font-semibold text-ink"
                      : "text-foreground/75 hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="eyebrow tracking-wider text-muted-foreground">
                      {short}
                    </span>
                    {label}
                  </span>
                  {selected && <Check className="size-4 text-primary" strokeWidth={3} />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
