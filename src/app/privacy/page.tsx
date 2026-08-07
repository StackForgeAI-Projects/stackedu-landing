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
  return buildPageMetadata(market, getStaticPageSeo(market, "/privacy"));
}

export default async function PrivacyPage() {
  const market = await getRequestMarket();
  const page = getStaticPageSeo(market, "/privacy");

  return (
    <>
      <JsonLd
        data={buildSimplePageJsonLd(market, page.path, page.title, page.description, [
          { name: "Home", path: "/" },
          { name: "Privacy Policy", path: "/privacy" },
        ])}
      />
      <MarketingPageShell market={market}>
        <SecondaryPageContent page="privacy" />
      </MarketingPageShell>
    </>
  );
}
