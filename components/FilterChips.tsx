import Link from "next/link";

export type FilterKey =
  | "hot"
  | "new"
  | "coaches"
  | "offense"
  | "recruiting"
  | "schedule"
  | "official";

export const FILTERS: { key: FilterKey; label: string; star?: boolean }[] = [
  { key: "hot", label: "🔥 Hottest" },
  { key: "new", label: "🕐 Newest" },
  { key: "coaches", label: "⭐ Coaches", star: true },
  { key: "offense", label: "Offense" },
  { key: "recruiting", label: "Recruiting" },
  { key: "schedule", label: "Schedule" },
  { key: "official", label: "Official" },
];

export function FilterChips({ active }: { active: FilterKey }) {
  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-8">
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-1">
        {FILTERS.map((f) => {
          const on = f.key === active;
          const base =
            "flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold whitespace-nowrap transition-colors";
          const cls = f.star
            ? on
              ? "bg-gold text-bg border-gold"
              : "border-gold/45 text-gold hover:border-gold"
            : on
              ? "bg-accent text-bg border-accent"
              : "border-edge bg-surface text-muted hover:text-ink";
          return (
            <Link key={f.key} href={`/?f=${f.key}`} className={`${base} ${cls}`} scroll={false}>
              {f.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
