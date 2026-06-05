import type { WireItem } from "@/lib/types";
import { timeAgo } from "@/lib/util";
import { VoteButton } from "@/components/VoteButton";

export function ArticleTile({
  item,
  feature = false,
}: {
  item: WireItem;
  feature?: boolean;
}) {
  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-2xl border border-edge bg-surface transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_14px_34px_-12px_rgba(0,0,0,0.7)] ${
        feature ? "sm:col-span-2" : ""
      }`}
    >
      <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex flex-1 flex-col">
        {/* Thumbnail: hotlinked publisher image (no-referrer, lazy) inside a fixed
            aspect box; falls back to a purple placeholder so a broken image never
            breaks the grid (DESIGN.md §7). */}
        <div className="relative flex aspect-[16/9] items-end bg-gradient-to-br from-surface-alt to-[#120c1c] p-3">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(139,92,246,0.32),transparent_60%)]"
          />
          {item.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.thumbnail}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : null}
          <div className="absolute left-3 top-3 flex gap-1.5">
            {feature ? <Badge tone="breaking">🔥 Hot</Badge> : null}
            {item.bradMention ? <Badge tone="gold">⭐ Brad</Badge> : null}
            {item.official ? <Badge tone="official">Official</Badge> : null}
          </div>
          <span className="relative rounded-full border border-edge bg-bg/60 px-2.5 py-1 text-[11px] font-bold text-ink backdrop-blur-sm">
            {item.source}
          </span>
        </div>

        <div className="flex flex-1 flex-col px-4 pb-2 pt-3">
          {item.topic ? (
            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-accent-hover">
              {item.topic}
            </div>
          ) : null}
          <h3
            className={`mb-1.5 font-bold leading-snug tracking-tight ${
              feature ? "text-xl" : "text-base"
            }`}
          >
            {item.title}
          </h3>
          <p className="flex-1 text-[13px] text-muted">{item.excerpt}</p>
        </div>
      </a>

      <div className="flex items-center justify-between px-4 pb-3 pt-1">
        <span className="font-mono text-[11px] text-muted">
          {timeAgo(item.publishedAt)}
          {item.score > 0 ? ` · ${item.score} upvotes` : ""}
          {item.corroboration && item.corroboration > 1
            ? ` · +${item.corroboration - 1} more outlet${item.corroboration > 2 ? "s" : ""}`
            : ""}
        </span>
        <VoteButton />
      </div>
    </article>
  );
}

function Badge({
  tone,
  children,
}: {
  tone: "breaking" | "gold" | "official";
  children: React.ReactNode;
}) {
  const cls =
    tone === "gold"
      ? "bg-gold text-bg"
      : tone === "official"
        ? "bg-official/16 text-official border border-official/35"
        : "bg-breaking/16 text-breaking border border-breaking/40";
  return (
    <span
      className={`rounded-md px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.06em] ${cls}`}
    >
      {children}
    </span>
  );
}
