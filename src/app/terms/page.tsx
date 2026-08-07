import type { Metadata } from "next";
import { MarketingPageShell } from "@/components/landing/MarketingPageShell";
import { SecondaryPageContent } from "@/components/landing/SecondaryPageContent";
import { JsonLd } from "@/components/seo/JsonLd";
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
  const page = getStaticPageSeo(market, "/terms");

  return (
    <>
      <JsonLd
        data={buildSimplePageJsonLd(market, page.path, page.title, page.description, [
          { name: "Home", path: "/" },
          { name: "Terms and Conditions", path: "/terms" },
        ])}
      />
      <MarketingPageShell market={market}>
        <SecondaryPageContent page="terms" />
      </MarketingPageShell>
    </>
  );
}
