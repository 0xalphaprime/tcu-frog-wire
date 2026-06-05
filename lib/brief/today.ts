/** Get today's brief from the store, building + caching it on first read. */
import type { BriefDoc } from "@/lib/types";
import { buildBrief } from "@/lib/brief/build";
import { ensureSeeded, getBrief, getItems, saveBrief } from "@/lib/store";
import { nextGame } from "@/lib/nextGame";
import { todayCentral } from "@/lib/util";

export async function getOrBuildTodayBrief(force = false): Promise<BriefDoc> {
  const date = todayCentral();
  if (!force) {
    const existing = await getBrief(date);
    if (existing) return existing;
  }
  await ensureSeeded();
  const items = await getItems();
  const brief = await buildBrief(date, items, nextGame());
  await saveBrief(brief);
  return brief;
}
