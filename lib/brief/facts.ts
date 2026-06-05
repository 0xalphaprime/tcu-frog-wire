/**
 * Deterministic fact extraction — the LLM's guardrail. We pick the window and
 * rank the items here, in code, so Claude only ever frames pre-selected facts
 * and can't invent stories or numbers.
 */
import type { BriefFacts, NextGame, WireItem } from "@/lib/types";
import { ageHours, hotness } from "@/lib/util";

export type RankedPool = {
  pool: WireItem[]; // ranked, hottest first
  windowHours: number;
};

/** Last 24h, widening to 48h then 72h if a thin (offseason) day yields too few. */
export function rankPool(items: WireItem[], now = Date.now()): RankedPool {
  const within = (h: number) => items.filter((it) => ageHours(it.publishedAt, now) <= h);
  let windowHours = 24;
  let pool = within(24);
  if (pool.length < 4) {
    windowHours = 48;
    pool = within(48);
  }
  if (pool.length < 4) {
    windowHours = 72;
    pool = within(72);
  }
  pool = [...pool].sort((a, b) => hotness(b, now) - hotness(a, now));
  return { pool, windowHours };
}

export function extractFacts(
  date: string,
  ranked: RankedPool,
  nextGame: NextGame | undefined,
  now = Date.now(),
): BriefFacts {
  const { pool, windowHours } = ranked;
  const topicCounts = new Map<string, number>();
  for (const it of pool) {
    if (it.topic) topicCounts.set(it.topic, (topicCounts.get(it.topic) ?? 0) + 1);
  }

  return {
    date,
    windowHours,
    items: pool.slice(0, 12).map((it) => ({
      title: it.title,
      source: it.source,
      topic: it.topic,
      ageHours: Math.round(ageHours(it.publishedAt, now)),
      score: it.score,
      official: Boolean(it.official),
      brad: Boolean(it.bradMention),
    })),
    hottest: pool.slice(0, 5).map((it) => ({ title: it.title, source: it.source })),
    byTopic: [...topicCounts.entries()]
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count),
    bradCount: pool.filter((it) => it.bradMention).length,
    nextGame,
  };
}
