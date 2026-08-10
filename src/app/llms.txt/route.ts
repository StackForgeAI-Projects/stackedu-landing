import { buildLlmsTxt } from "@/lib/seo/schema";
import { getRequestMarket } from "@/lib/seo/request-market";

export async function GET() {
  const market = await getRequestMarket();
  const body = await buildLlmsTxt(market);

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
