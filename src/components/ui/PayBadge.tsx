type PayBadgeProps = {
  label: string;
  dot?: string;
};

export function PayBadge({ label, dot }: PayBadgeProps) {
  return (
    <span className="inline-flex items-center gap-2 bg-white border border-border rounded-full px-3.5 py-1.5 text-xs font-semibold text-ink shadow-soft">
      <span className="size-2 rounded-full" style={{ background: dot ?? "var(--primary)" }} />
      {label}
    </span>
  );
}
