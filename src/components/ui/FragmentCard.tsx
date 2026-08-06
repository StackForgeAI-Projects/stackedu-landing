import type { ReactNode } from "react";

type FragmentCardProps = {
  className?: string;
  label: string;
  tone?: "light" | "dark";
  children: ReactNode;
};

export function FragmentCard({
  className = "",
  label,
  tone = "light",
  children,
}: FragmentCardProps) {
  const isDark = tone === "dark";
  return (
    <div
      className={`${className} rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-lift border z-20 ${
        isDark ? "bg-ink border-white/10" : "bg-white/95 backdrop-blur border-border"
      }`}
    >
      <div
        className={`eyebrow text-[8px] sm:text-[9px] tracking-[0.12em] sm:tracking-[0.15em] mb-1.5 sm:mb-2 ${
          isDark ? "text-primary-bright" : "text-primary"
        }`}
      >
        {label}
      </div>
      {children}
    </div>
  );
}
