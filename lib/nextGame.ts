import type { NextGame } from "@/lib/types";

/**
 * Static schedule anchor so the home page always has a populated hero element —
 * even on a zero-news offseason day (the top launch-day risk, DESIGN.md §7).
 * In-season, swap this for a fetched schedule + auto-filled scores.
 */
const SCHEDULE: Array<Omit<NextGame, "daysUntil">> = [
  {
    opponent: "North Carolina",
    date: "2026-08-29T16:00:00Z",
    venue: "Aviva Stadium, Dublin 🇮🇪",
    note: "Aer Lingus Classic · Belichick's UNC debut · first-ever Week Zero",
  },
  // add the rest of the 2026 slate here…
];

export function nextGame(now = Date.now()): NextGame | undefined {
  const upcoming = SCHEDULE.map((g) => ({
    ...g,
    daysUntil: Math.ceil((Date.parse(g.date) - now) / 86_400_000),
  }))
    .filter((g) => g.daysUntil >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil);
  return upcoming[0];
}
