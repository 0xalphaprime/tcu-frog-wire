import type { WireItem } from "@/lib/types";
import { ArticleTile } from "@/components/ArticleTile";

export function Wire({ items, sort }: { items: WireItem[]; sort: "hot" | "new" }) {
  return (
    <section className="mx-auto max-w-4xl px-5 pb-16 sm:px-8">
      <div className="mb-3 mt-6 flex items-center justify-between px-0.5">
        <h2 className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted">
          The Wire
        </h2>
        <span className="text-xs text-muted">
          Sorted by{" "}
          <b className="text-accent-hover">{sort === "new" ? "newest" : "hotness"}</b>
        </span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-edge bg-surface/50 px-5 py-10 text-center text-sm text-muted">
          Nothing matches this filter right now. Check back after the next ingest —
          or hit Refresh.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {items.map((item, i) => (
            <ArticleTile key={item.id} item={item} feature={sort === "hot" && i === 0} />
          ))}
        </div>
      )}
    </section>
  );
}
