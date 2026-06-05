/**
 * Ingest orchestrator: fetch every enabled source in parallel (fault-tolerant —
 * one dead feed never breaks the run), dedupe within the batch, upsert into the
 * store, and record per-source health.
 *
 * v1 ships Google News only (it already carries ESPN/SI/247/Frogs O' War). Add
 * Frogs O' War RSS, YouTube channel RSS, and Reddit-OAuth here as new entries in
 * SOURCES — each just returns WireItem[] (see DESIGN.md §3 for the source tiers).
 */
import type { SourceHealth, WireItem } from "@/lib/types";
import { fetchGoogleNews } from "@/lib/sources/googleNews";
import { fetchFrogsOWar } from "@/lib/sources/frogsOWar";
import { saveHealth, upsertItems } from "@/lib/store";
import { mergeByFingerprint } from "@/lib/util";

type Source = { name: string; fetch: () => Promise<WireItem[]> };

const SOURCES: Source[] = [
  { name: "Google News", fetch: () => fetchGoogleNews() },
  { name: "Frogs O' War", fetch: () => fetchFrogsOWar() },
  // Deferred: YouTube channel RSS + Reddit (OAuth). Each is just another entry
  // here returning WireItem[]; the pipeline is source-agnostic.
];

export type IngestResult = {
  fetched: number;
  added: number;
  updated: number;
  health: SourceHealth[];
};

export async function ingestAll(): Promise<IngestResult> {
  const at = new Date().toISOString();
  const settled = await Promise.allSettled(SOURCES.map((s) => s.fetch()));

  const all: WireItem[] = [];
  const health: SourceHealth[] = [];
  settled.forEach((r, i) => {
    const name = SOURCES[i].name;
    if (r.status === "fulfilled") {
      all.push(...r.value);
      health.push({ source: name, ok: true, items: r.value.length, at });
    } else {
      const error = r.reason instanceof Error ? r.reason.message : String(r.reason);
      health.push({ source: name, ok: false, items: 0, error, at });
    }
  });

  // Merge the same story across sources (Google News + Frogs O' War overlap),
  // then dedupe exact-URL repeats before upserting.
  const merged = mergeByFingerprint(all);
  const byId = new Map(merged.map((it) => [it.id, it]));
  const { added, updated } = await upsertItems([...byId.values()]);
  await saveHealth(health);

  return { fetched: all.length, added, updated, health };
}
