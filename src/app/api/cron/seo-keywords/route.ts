import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

/** Daily cron: refresh cached Google Trends edtech keywords for both markets. */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  revalidateTag("seo-trends-rw", "max");
  revalidateTag("seo-trends-africa", "max");

  return NextResponse.json({ ok: true, revalidated: ["seo-trends-rw", "seo-trends-africa"] });
}
