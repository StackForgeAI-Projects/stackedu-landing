import Link from "next/link";
import { MarketingPageShell } from "@/components/landing/MarketingPageShell";
import type { Market } from "@/lib/market";

export function ComingSoonPage({ market, title }: { market: Market; title: string }) {
  return (
    <MarketingPageShell market={market}>
      <div className="mx-auto max-w-2xl text-center sm:text-left">
        <Link href="/" className="text-sm font-semibold text-primary hover:underline">
          ← Back to StackEDU
        </Link>
        <p className="eyebrow mt-8 text-primary">Coming soon</p>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          We&apos;re working on this page. Please check back later.
        </p>
      </div>
    </MarketingPageShell>
  );
}
