import type { MetadataRoute } from "next";
import { absoluteUrl, SITEMAP_ROUTES } from "@/lib/seo/config";
import { getRequestMarket } from "@/lib/seo/request-market";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const market = await getRequestMarket();
  const lastModified = new Date();

  return SITEMAP_ROUTES.map((route) => ({
    url: absoluteUrl(market, route.path),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
    alternates: {
      languages: {
        "en-RW": absoluteUrl("rw", route.path),
        "rw-RW": absoluteUrl("rw", route.path),
        en: absoluteUrl("africa", route.path),
        fr: absoluteUrl("africa", route.path),
        "x-default": absoluteUrl("africa", route.path),
      },
    },
  }));
}
