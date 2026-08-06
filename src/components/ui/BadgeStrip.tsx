import { PayBadge } from "@/components/ui/PayBadge";

type BadgeStripProps = {
  eyebrow: string;
  headline?: string;
  labels: string[];
  dots?: (string | undefined)[];
  eyebrowClass?: string;
  className?: string;
};

export function BadgeStrip({
  eyebrow,
  headline,
  labels,
  dots,
  eyebrowClass = "text-muted-foreground",
  className = "border-y border-border bg-surface-alt",
}: BadgeStripProps) {
  return (
    <div className={className}>
      <div className="mx-auto max-w-7xl px-6 py-6 flex flex-wrap items-center justify-between gap-6">
        <div>
          <div className={`eyebrow ${eyebrowClass}`}>{eyebrow}</div>
          {headline ? <p className="mt-1 text-xs font-semibold text-ink">{headline}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {labels.map((label, i) => (
            <PayBadge key={label} label={label} dot={dots?.[i]} />
          ))}
        </div>
      </div>
    </div>
  );
}
