import type { NextGame } from "@/lib/types";

/**
 * 2026 TCU football schedule. Dates verified June 2026 (gofrogs.com, ESPN id
 * 2628, Wikipedia all agree), incl. the TV-moved dates: Arizona Fri Nov 6 and
 * Texas Tech Thu Nov 26 (Thanksgiving). Bye weeks (Sep 5, Oct 10) omitted.
 *
 * Kickoff times: most 2026 kickoffs are still TBD this far out (set by TV
 * windows closer to game day) — only the 5 confirmed ones below carry a time.
 * ESPN lists those in ET; shown here converted to Central (the family's zone).
 * `home` is true for home + the neutral Dublin opener (TCU is designated home).
 * The ISO time is just a sort/countdown anchor — the `kickoff` string is the
 * source of truth for the displayed time.
 */
type ScheduleEntry = Pick<NextGame, "opponent" | "date" | "home" | "venue" | "kickoff" | "note">;

const SCHEDULE: ScheduleEntry[] = [
  {
    opponent: "North Carolina",
    date: "2026-08-29T16:00:00Z",
    home: true,
    venue: "Aviva Stadium, Dublin 🇮🇪",
    kickoff: "11:00 AM CT",
    note: "Aer Lingus Classic · Belichick's UNC · TCU's first-ever Week Zero",
  },
  { opponent: "Grambling State", date: "2026-09-12T17:00:00Z", home: true, venue: "Amon G. Carter Stadium, Fort Worth", kickoff: "7:00 PM CT" },
  { opponent: "Arkansas State", date: "2026-09-19T17:00:00Z", home: true, venue: "Amon G. Carter Stadium, Fort Worth", kickoff: "7:00 PM CT" },
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
    kickoff: "9:15 PM CT",
    note: "Friday night game",
  },
  { opponent: "Kansas State", date: "2026-11-14T17:00:00Z", home: true, venue: "Amon G. Carter Stadium, Fort Worth" },
  { opponent: "Utah", date: "2026-11-21T17:00:00Z", home: true, venue: "Amon G. Carter Stadium, Fort Worth" },
  {
    opponent: "Texas Tech",
    date: "2026-11-26T20:00:00Z",
    home: false,
    venue: "Lubbock, TX",
    kickoff: "7:00 PM CT",
    note: "Thanksgiving night · regular-season finale",
  },
];

const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Chicago",
  weekday: "short",
  month: "short",
  day: "numeric",
});

/** The full season with computed countdown, past/next flags, and display labels. */
export function fullSchedule(now = Date.now()): NextGame[] {
  const withDays = SCHEDULE.map((g) => ({
    ...g,
    daysUntil: Math.ceil((Date.parse(g.date) - now) / 86_400_000),
  }));
  const nextIdx = withDays.findIndex((g) => g.daysUntil >= 0);
  return withDays.map((g, i) => ({
    ...g,
    isPast: g.daysUntil < 0,
    isNext: i === nextIdx,
    dateLabel: DATE_FMT.format(new Date(g.date)),
    kickoffLabel: g.kickoff ?? "Time TBD",
  }));
}

/** The next upcoming game (for the brief radar + the hero card). */
export function nextGame(now = Date.now()): NextGame | undefined {
  return fullSchedule(now).find((g) => g.isNext);
}
