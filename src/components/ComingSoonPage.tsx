import Link from "next/link";

export function ComingSoonPage({ title }: { title: string }) {
  return (
    <main className="min-h-screen bg-background px-6 py-24">
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
    </main>
  );
}
