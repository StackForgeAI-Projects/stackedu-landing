import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { getPublicContactEmail } from "@/lib/market";
import { getStaticPageSeo } from "@/lib/seo/config";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getRequestMarket } from "@/lib/seo/request-market";
import { buildSimplePageJsonLd } from "@/lib/seo/schema";

export async function generateMetadata(): Promise<Metadata> {
  const market = await getRequestMarket();
  return buildPageMetadata(market, getStaticPageSeo(market, "/privacy"));
}

export default async function PrivacyPage() {
  const market = await getRequestMarket();
  const email = getPublicContactEmail(market);
  const page = getStaticPageSeo(market, "/privacy");

  return (
    <>
      <JsonLd
        data={buildSimplePageJsonLd(market, page.path, page.title, page.description, [
          { name: "Home", path: "/" },
          { name: "Privacy Policy", path: "/privacy" },
        ])}
      />
      <main className="min-h-screen bg-background px-6 py-24">
        <div className="mx-auto max-w-2xl">
          <Link href="/" className="text-sm font-semibold text-primary hover:underline">
            ← Back to StackEDU
          </Link>
          <h1 className="mt-8 text-3xl font-extrabold tracking-tight text-ink">Privacy Policy</h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Our full privacy policy will be published here. For questions, contact{" "}
            <a href={`mailto:${email}`} className="text-primary font-medium hover:underline">
              {email}
            </a>
            .
          </p>
        </div>
      </main>
    </>
  );
}
