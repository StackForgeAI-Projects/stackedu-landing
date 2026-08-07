"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n";
import { getPublicContactEmail } from "@/lib/market";

export type SecondaryPageKey = "blog" | "careers" | "privacy" | "terms";

const TITLE_KEYS: Record<SecondaryPageKey, "blog" | "careers" | "privacyPolicy" | "termsAndConditions"> =
  {
    blog: "blog",
    careers: "careers",
    privacy: "privacyPolicy",
    terms: "termsAndConditions",
  };

export function SecondaryPageContent({ page }: { page: SecondaryPageKey }) {
  const { t, market } = useLocale();
  const email = getPublicContactEmail(market);
  const title = t.footer[TITLE_KEYS[page]];
  const isComingSoon = page === "blog" || page === "careers";

  return (
    <div className="mx-auto max-w-2xl text-center sm:text-left">
      <Link href="/" className="text-sm font-semibold text-primary hover:underline">
        {t.secondaryPages.backToStackedu}
      </Link>

      {isComingSoon ? (
        <>
          <p className="eyebrow mt-8 text-primary">{t.secondaryPages.comingSoon}</p>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{title}</h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            {t.secondaryPages.comingSoonMessage}
          </p>
        </>
      ) : (
        <>
          <h1 className="mt-8 text-3xl font-extrabold tracking-tight text-ink">{title}</h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            {page === "privacy" ? (
              <>
                {t.secondaryPages.privacyIntroBefore}
                <a href={`mailto:${email}`} className="text-primary font-medium hover:underline">
                  {email}
                </a>
                {t.secondaryPages.privacyIntroAfter}
              </>
            ) : (
              <>
                {t.secondaryPages.termsIntroBefore}
                <a href={`mailto:${email}`} className="text-primary font-medium hover:underline">
                  {email}
                </a>
                {t.secondaryPages.termsIntroAfter}
              </>
            )}
          </p>
        </>
      )}
    </div>
  );
}
