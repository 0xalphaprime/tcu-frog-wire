/**
 * Item + brief store. Uses Upstash Redis when configured; otherwise an in-memory
 * map (fine for local dev — one process; in prod always set Upstash). Items are
 * pruned to a rolling 14-day window so the store never grows unbounded — this is
 * why we use Redis, not Airtable, for items (DESIGN.md §6).
 */
import type { BriefDoc, SourceHealth, WireItem } from "@/lib/types";
import { getRedis } from "@/lib/redis";
import { buildSeedItems } from "@/lib/seed";

const ITEMS_KEY = "frogwire:items";
const BRIEF_KEY = (date: string) => `frogwire:brief:${date}`;
const HEALTH_KEY = "frogwire:health";
const RETENTION_MS = 14 * 24 * 3_600_000;

// In-memory fallback. Pinned to globalThis so it's shared across page and
// route-handler bundles in `next dev` (they're otherwise separate module
// instances). Dev/demo only — in prod each serverless invocation is cold, so
// always set Upstash. This is precisely why the durable store is Redis.
type MemStore = {
  items: Map<string, WireItem>;
  briefs: Map<string, BriefDoc>;
  health: SourceHealth[];
  seeded: boolean;
};
const g = globalThis as unknown as { __frogwireMem?: MemStore };
const mem: MemStore =
  g.__frogwireMem ??
  (g.__frogwireMem = {
    items: new Map<string, WireItem>(),
    briefs: new Map<string, BriefDoc>(),
    health: [],
    seeded: false,
  });

function prune(items: WireItem[], now = Date.now()): WireItem[] {
  const cutoff = now - RETENTION_MS;
  return items.filter((it) => Date.parse(it.firstSeenAt) >= cutoff);
}

export async function getItems(): Promise<WireItem[]> {
  const redis = getRedis();
  if (redis) {
    const items = (await redis.get<WireItem[]>(ITEMS_KEY)) ?? [];
    return prune(items);
  }
  return prune([...mem.items.values()]);
}

/** Insert new items, update score/excerpt on existing ones. Returns counts. */
export async function upsertItems(
  incoming: WireItem[],
): Promise<{ added: number; updated: number }> {
  const existing = await getItems();
  const byId = new Map(existing.map((it) => [it.id, it]));
  let added = 0;
  let updated = 0;

  for (const it of incoming) {
    const prev = byId.get(it.id);
    if (prev) {
      // Keep the original firstSeenAt; refresh score (e.g. Reddit climbing).
      byId.set(it.id, { ...prev, score: Math.max(prev.score, it.score), excerpt: it.excerpt });
      updated++;
    } else {
      byId.set(it.id, it);
      added++;
    }
  }

  const merged = prune([...byId.values()]).sort(
    (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
  );

  const redis = getRedis();
  if (redis) {
    await redis.set(ITEMS_KEY, merged);
  } else {
    mem.items = new Map(merged.map((it) => [it.id, it]));
  }
  return { added, updated };
}

export async function getBrief(date: string): Promise<BriefDoc | null> {
  const redis = getRedis();
  if (redis) return (await redis.get<BriefDoc>(BRIEF_KEY(date))) ?? null;
  return mem.briefs.get(date) ?? null;
}

export async function saveBrief(brief: BriefDoc): Promise<void> {
  const redis = getRedis();
  if (redis) {
    // Briefs are tiny and worth keeping ~a season; 400-day TTL.
    await redis.set(BRIEF_KEY(brief.date), brief, { ex: 400 * 24 * 3600 });
  } else {
    mem.briefs.set(brief.date, brief);
  }
}

export async function saveHealth(health: SourceHealth[]): Promise<void> {
  const redis = getRedis();
  if (redis) await redis.set(HEALTH_KEY, health);
  else mem.health = health;
}

export async function getHealth(): Promise<SourceHealth[]> {
  const redis = getRedis();
  if (redis) return (await redis.get<SourceHealth[]>(HEALTH_KEY)) ?? [];
  return mem.health;
}

/** Seed sample items the first time the store is read empty, so dev/demo always
 *  shows a populated wire. Real ingest overwrites these. */
export async function ensureSeeded(): Promise<void> {
  const items = await getItems();
  if (items.length > 0) return;
  const redis = getRedis();
  if (!redis && mem.seeded) return;
  await upsertItems(buildSeedItems());
  mem.seeded = true;
}
