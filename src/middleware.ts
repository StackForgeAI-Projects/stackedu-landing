import { NextResponse, type NextRequest } from "next/server";
import { AFRICA_HOSTS, RW_HOSTS, isKnownMarketHost } from "@/lib/market";

export function middleware(request: NextRequest) {
  const hostname = request.nextUrl.hostname.toLowerCase();

  if (!isKnownMarketHost(hostname)) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api") || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  const country = request.headers.get("x-vercel-ip-country")?.toUpperCase() || "";

  if (!country) {
    return NextResponse.next();
  }

  if (RW_HOSTS.includes(hostname as (typeof RW_HOSTS)[number]) && country !== "RW") {
    const url = request.nextUrl.clone();
    url.hostname = "www.stackedu.africa";
    url.protocol = "https:";
    return NextResponse.redirect(url, 307);
  }

  if (
    AFRICA_HOSTS.includes(hostname as (typeof AFRICA_HOSTS)[number]) &&
    country === "RW"
  ) {
    const url = request.nextUrl.clone();
    url.hostname = "www.stackedu.rw";
    url.protocol = "https:";
    return NextResponse.redirect(url, 307);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.png|icon.png|images/).*)"],
};
