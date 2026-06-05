import { Header } from "@/components/Header";
import { BriefHero } from "@/components/BriefHero";
import { FilterChips, FILTERS, type FilterKey } from "@/components/FilterChips";
import { Wire } from "@/components/Wire";
import { getOrBuildTodayBrief } from "@/lib/brief/today";
import { ensureSeeded, getItems } from "@/lib/store";
import { fullSchedule } from "@/lib/nextGame";
import { hotness } from "@/lib/util";
import type { WireItem } from "@/lib/types";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

const VALID = new Set<FilterKey>(FILTERS.map((f) => f.key));

function applyFilter(items: WireItem[], active: FilterKey): WireItem[] {
  switch (active) {
    case "brad":
      return items.filter((i) => i.bradMention);
    case "official":
      return items.filter((i) => i.official);
    case "offense":
      return items.filter((i) => i.topic === "Offense");
    case "recruiting":
      return items.filter((i) => i.topic === "Recruiting");
    case "schedule":
      return items.filter((i) => i.topic === "Schedule");
    default:
      return items;
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ f?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const active: FilterKey = VALID.has(params.f as FilterKey)
    ? (params.f as FilterKey)
    : "hot";

  // On phones, open article links in the SAME tab — new tabs pile up on mobile.
  // Desktop keeps new-tab (multiple tabs are handy there).
  const ua = (await headers()).get("user-agent") ?? "";
  const sameTab = /Mobi|Android|iPhone|iPad|iPod|Windows Phone|BlackBerry|IEMobile|Opera Mini/i.test(ua);

  await ensureSeeded();
  const schedule = fullSchedule();
  const [brief, allItems] = await Promise.all([getOrBuildTodayBrief(), getItems()]);

  const now = Date.now();
  const sort: "hot" | "new" = active === "new" ? "new" : "hot";
  const items = applyFilter(allItems, active).sort((a, b) =>
    sort === "new"
      ? Date.parse(b.publishedAt) - Date.parse(a.publishedAt)
      : hotness(b, now) - hotness(a, now),
  );

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-2">
        <BriefHero brief={brief} schedule={schedule} sameTab={sameTab} />
        <div className="mt-5">
          <FilterChips active={active} />
        </div>
        <Wire items={items} sort={sort} sameTab={sameTab} />
      </main>
      <footer className="px-5 pb-12 text-center text-xs text-muted">
        <div className="mx-auto max-w-4xl">
          <a
            href="/api/refresh"
            className="inline-flex min-h-[40px] items-center rounded-full border border-edge bg-surface px-4 font-semibold text-muted transition-colors hover:text-ink"
          >
            ↻ Refresh now
          </a>
          <p className="mt-4">Frog Wire · robbins.coach · updated daily at 4:00 AM CT</p>
          <p className="mx-auto mt-1.5 max-w-prose text-[11px] text-muted/70">
            An unofficial fan site for the Robbins family. Not affiliated with,
            endorsed by, or sponsored by Texas Christian University. All articles
            link to and credit their original publishers.
          </p>
        </div>
      </footer>
    </div>
  );
}
