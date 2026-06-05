import type { NextGame } from "@/lib/types";

/**
 * 2026 TCU football schedule. Verified June 2026 against the official site
 * (gofrogs.com), ESPN (id 2628), and Wikipedia — the three agree, incl. the two
 * TV-moved dates: Arizona is Fri Nov 6 (night game) and Texas Tech is Thu Nov 26
 * (Thanksgiving). Bye weeks (Sep 5, Oct 10) are omitted. Kickoff times are mostly
 * TBD, so the times below are placeholders only used for the day countdown — do
 * NOT present them as exact kickoff times. `home` is true for home + the neutral
 * Dublin opener (TCU is the designated home team).
 */
const SCHEDULE: Array<Omit<NextGame, "daysUntil">> = [
  {
    opponent: "North Carolina",
    date: "2026-08-29T16:00:00Z",
    home: true,
    venue: "Aviva Stadium, Dublin 🇮🇪",
    note: "Aer Lingus Classic · Belichick's UNC · TCU's first-ever Week Zero",
  },
  { opponent: "Grambling State", date: "2026-09-12T17:00:00Z", home: true, venue: "Amon G. Carter Stadium, Fort Worth" },
  { opponent: "Arkansas State", date: "2026-09-19T17:00:00Z", home: true, venue: "Amon G. Carter Stadium, Fort Worth" },
  { opponent: "UCF", date: "2026-09-26T17:00:00Z", home: false, venue: "Orlando, FL" },
  { opponent: "BYU", date: "2026-10-03T17:00:00Z", home: true, venue: "Amon G. Carter Stadium, Fort Worth" },
  { opponent: "Baylor", date: "2026-10-17T17:00:00Z", home: false, venue: "Waco, TX" },
  { opponent: "West Virginia", date: "2026-10-24T17:00:00Z", home: true, venue: "Amon G. Carter Stadium, Fort Worth" },
  { opponent: "Kansas", date: "2026-10-31T17:00:00Z", home: true, venue: "Amon G. Carter Stadium, Fort Worth" },
  {
    opponent: "Arizona",
    date: "2026-11-06T23:00:00Z",
    home: false,
    venue: "Tucson, AZ",
    note: "Friday night game",
  },
  { opponent: "Kansas State", date: "2026-11-14T17:00:00Z", home: true, venue: "Amon G. Carter Stadium, Fort Worth" },
  { opponent: "Utah", date: "2026-11-21T17:00:00Z", home: true, venue: "Amon G. Carter Stadium, Fort Worth" },
  {
    opponent: "Texas Tech",
    date: "2026-11-26T20:00:00Z",
    home: false,
    venue: "Lubbock, TX",
    note: "Thanksgiving night · regular-season finale",
  },
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
