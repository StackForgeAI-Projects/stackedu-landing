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
  return buildPageMetadata(market, getStaticPageSeo(market, "/careers"));
}

export default async function CareersPage() {
  const market = await getRequestMarket();
  const page = getStaticPageSeo(market, "/careers");

  return (
    <>
      <JsonLd
        data={buildSimplePageJsonLd(market, page.path, page.title, page.description, [
          { name: "Home", path: "/" },
          { name: "Careers", path: "/careers" },
        ])}
      />
      <MarketingPageShell market={market}>
        <SecondaryPageContent page="careers" />
      </MarketingPageShell>
    </>
  );
}
