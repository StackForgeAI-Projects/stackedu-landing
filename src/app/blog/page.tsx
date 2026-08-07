import type { Metadata } from "next";
import { ComingSoonPage } from "@/components/ComingSoonPage";
import { JsonLd } from "@/components/seo/JsonLd";
import { getStaticPageSeo } from "@/lib/seo/config";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getRequestMarket } from "@/lib/seo/request-market";
import { buildSimplePageJsonLd } from "@/lib/seo/schema";

export async function generateMetadata(): Promise<Metadata> {
  const market = await getRequestMarket();
  return buildPageMetadata(market, getStaticPageSeo(market, "/blog"));
}

export default async function BlogPage() {
  const market = await getRequestMarket();
  const page = getStaticPageSeo(market, "/blog");

  return (
    <>
      <JsonLd
        data={buildSimplePageJsonLd(market, page.path, page.title, page.description, [
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
        ])}
      />
      <ComingSoonPage title="Blog" />
    </>
  );
}
