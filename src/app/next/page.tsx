import type { Metadata } from "next";
import { StackForgeNextShell } from "@/components/stackforgenext/StackForgeNextShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { getNextPageSeo } from "@/lib/seo/config";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getRequestMarket } from "@/lib/seo/request-market";
import { buildNextJsonLd } from "@/lib/seo/schema";

export async function generateMetadata(): Promise<Metadata> {
  const market = await getRequestMarket();
  return buildPageMetadata(market, getNextPageSeo(market));
}

export default async function NextRoutePage() {
  const market = await getRequestMarket();

  return (
    <>
      <JsonLd data={buildNextJsonLd(market)} />
      <StackForgeNextShell market={market} />
    </>
  );
}
