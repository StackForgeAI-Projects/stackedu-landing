import Link from "next/link";
import { headers } from "next/headers";
import { getMarketFromHost, getPublicContactEmail } from "@/lib/market";

export default async function TermsPage() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const email = getPublicContactEmail(getMarketFromHost(host));

  return (
    <main className="min-h-screen bg-background px-6 py-24">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm font-semibold text-primary hover:underline">
          ← Back to StackEDU
        </Link>
        <h1 className="mt-8 text-3xl font-extrabold tracking-tight text-ink">Terms and Conditions</h1>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          Our full terms and conditions will be published here. For questions, contact{" "}
          <a href={`mailto:${email}`} className="text-primary font-medium hover:underline">
            {email}
          </a>
          .
        </p>
      </div>
    </main>
  );
}
