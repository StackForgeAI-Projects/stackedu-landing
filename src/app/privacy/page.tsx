import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-24">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm font-semibold text-primary hover:underline">
          ← Back to StackEDU
        </Link>
        <h1 className="mt-8 text-3xl font-extrabold tracking-tight text-ink">Privacy Policy</h1>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          Our full privacy policy will be published here. For questions, contact{" "}
          <a href="mailto:hello@stackedu.africa" className="text-primary font-medium hover:underline">
            hello@stackedu.africa
          </a>
          .
        </p>
      </div>
    </main>
  );
}
