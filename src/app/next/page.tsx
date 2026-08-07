import type { Metadata } from "next";
import { headers } from "next/headers";
import { StackForgeNextShell } from "@/components/stackforgenext/StackForgeNextShell";
import { getStackForgeNextContent } from "@/lib/stackforgenext/content";
import { getMarketFromHost, getStackeduSiteUrl } from "@/lib/market";

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const market = getMarketFromHost(host);
  const content = getStackForgeNextContent("en", market, getStackeduSiteUrl(market));

  return {
    title: content.meta.title,
    description: content.meta.description,
    openGraph: {
      title: content.meta.title,
      description: content.meta.description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: content.meta.title,
      description: content.meta.description,
    },
  };
}

export default async function NextRoutePage() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";

  return <StackForgeNextShell market={getMarketFromHost(host)} />;
}
