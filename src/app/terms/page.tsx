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
  return buildPageMetadata(market, getStaticPageSeo(market, "/terms"));
}

export default async function TermsPage() {
  const market = await getRequestMarket();
  const email = getPublicContactEmail(market);
  const page = getStaticPageSeo(market, "/terms");

  return (
    <>
      <JsonLd
        data={buildSimplePageJsonLd(market, page.path, page.title, page.description, [
          { name: "Home", path: "/" },
          { name: "Terms and Conditions", path: "/terms" },
        ])}
      />
      <main className="min-h-screen bg-background px-6 py-24">
        <div className="mx-auto max-w-2xl">
          <Link href="/" className="text-sm font-semibold text-primary hover:underline">
            ← Back to StackEDU
          </Link>
          <h1 className="mt-8 text-3xl font-extrabold tracking-tight text-ink">
            Terms and Conditions
          </h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Our full terms and conditions will be published here. For questions, contact{" "}
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
