"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";
import { ContactField } from "@/components/ui/ContactField";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { WHATSAPP_URL } from "@/lib/content";
import { useLocale } from "@/lib/i18n";

type FormState = {
  name: string;
  institution: string;
  email: string;
  phone: string;
  message: string;
};

const INITIAL: FormState = {
  name: "",
  institution: "",
  email: "",
  phone: "",
  message: "",
};

export function ContactSection() {
  const { t } = useLocale();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const setField = (key: keyof FormState) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error || t.contact.errors.generic);
        return;
      }

      setStatus("success");
      setForm(INITIAL);
    } catch {
      setStatus("error");
      setErrorMsg(t.contact.errors.network);
    }
  }

  return (
    <section id="contact" className="section-dark py-24">
      <div className="section-dark-overlay" />
      <div className="pointer-events-none absolute inset-0 dotted-pattern opacity-[0.035]" />
      <div className="mx-auto max-w-7xl px-6 relative">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <div className="eyebrow text-[11px] text-primary-bright mb-6">
              {t.contact.eyebrow}
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] mb-6">
              {t.contact.title}
            </h2>
            <p className="text-white/60 text-lg leading-relaxed max-w-lg mb-10">
              {t.contact.subtitle}
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/15 text-primary-bright">
                  <Mail className="size-5" />
                </span>
                <a
                  href={`mailto:${t.contact.email}`}
                  className="text-white/80 font-medium hover:text-primary-bright transition-colors"
                >
                  {t.contact.email}
                </a>
              </li>
              <li className="flex items-center gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/15 text-primary-bright">
                  <Phone className="size-5" />
                </span>
                <a
                  href="tel:+250799486531"
                  className="text-white/80 font-medium hover:text-primary-bright transition-colors"
                >
                  {t.contact.phone}
                </a>
              </li>
              <li className="flex items-center gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/15 text-primary-bright">
                  <WhatsAppIcon />
                </span>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/80 font-medium hover:text-primary-bright transition-colors"
                >
                  {t.contact.whatsapp}
                </a>
              </li>
              <li className="flex items-center gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/15 text-primary-bright">
                  <MapPin className="size-5" />
                </span>
                <span className="text-white/80 font-medium">{t.contact.location}</span>
              </li>
            </ul>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 md:p-10 backdrop-blur-sm shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
            <h3 className="text-2xl font-black mb-2">{t.contact.formTitle}</h3>
            <p className="text-white/60 text-sm mb-8">{t.contact.formSubtitle}</p>
            <form className="space-y-5" onSubmit={onSubmit}>
              <div className="grid sm:grid-cols-2 gap-5">
                <ContactField
                  label={t.contact.fields.name}
                  name="name"
                  placeholder={t.contact.placeholders.name}
                  value={form.name}
                  onChange={setField("name")}
                />
                <ContactField
                  label={t.contact.fields.institution}
                  name="institution"
                  placeholder={t.contact.placeholders.institution}
                  value={form.institution}
                  onChange={setField("institution")}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <ContactField
                  label={t.contact.fields.email}
                  name="email"
                  type="email"
                  placeholder={t.contact.placeholders.email}
                  value={form.email}
                  onChange={setField("email")}
                />
                <ContactField
                  label={t.contact.fields.phone}
                  name="phone"
                  placeholder={t.contact.placeholders.phone}
                  value={form.phone}
                  onChange={setField("phone")}
                />
              </div>
              <div>
                <label
                  htmlFor="message"
                  className="block eyebrow tracking-[0.18em] text-white/60 mb-2"
                >
                  {t.contact.fields.message}
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={4}
                  value={form.message}
                  onChange={(e) => setField("message")(e.target.value)}
                  placeholder={t.contact.placeholders.message}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm placeholder:text-white/30 focus:outline-none focus:border-primary-bright transition-colors resize-none"
                />
              </div>

              {status === "success" && (
                <p className="text-sm text-primary-bright font-semibold">{t.contact.success}</p>
              )}
              {status === "error" && (
                <p className="text-sm text-red-300 font-semibold">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full bg-primary-bright text-ink font-bold px-6 py-4 rounded-full text-base inline-flex items-center justify-center gap-2 hover:brightness-95 transition-all shadow-[0_0_40px_-8px_oklch(0.86_0.32_140_/_0.6)] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === "loading" ? t.contact.sending : t.contact.send}
                <ArrowRight className="size-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
