type StatTileProps = {
  label: string;
  value: number;
  suffix?: string;
  accent?: boolean;
  warn?: boolean;
};

export function StatTile({ label, value, suffix = "", accent, warn }: StatTileProps) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
      <div className="eyebrow text-[9px] text-white/50 tracking-widest mb-2">
        {label.toUpperCase()}
      </div>
      <div
        className={`text-2xl font-extrabold tracking-tight tabular-nums ${
          accent ? "text-primary-bright" : warn ? "text-orange-300" : "text-white"
        }`}
        data-count={value}
        data-suffix={suffix}
      >
        0{suffix}
      </div>
    </div>
  );
}
