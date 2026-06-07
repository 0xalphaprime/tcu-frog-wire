/** The canonical shape every source normalizes into. */
export type SourceType = "rss" | "api" | "social";

export type WireItem = {
  /** Stable id = hash of the canonical URL. Dedupe + upsert key. */
  id: string;
  source: string; // display name, e.g. "Sports Illustrated"
  sourceType: SourceType;
  /** Editorial trust 0..1 — official/established higher (see lib/util sourceWeight). */
  sourceWeight: number;
  title: string;
  /** Link out (resolved to the publisher when possible; see DESIGN.md §7). */
  url: string;
  /**
   * TEASER ONLY — ≤300 chars. We never persist full article bodies (copyright
   * boundary, DESIGN.md §4). Full text is used transiently to feed Claude, then
   * discarded.
   */
  excerpt: string;
  author?: string;
  topic?: string; // Offense | Recruiting | Schedule | Defense | Injury
  thumbnail?: string;
  publishedAt: string; // ISO
  firstSeenAt: string; // ISO
  /** Social signal (e.g. Reddit upvotes); 0 when none. Ranking input only. */
  score: number;
  official?: boolean; // from TCU Athletics / verified official source
  coachMention?: boolean; // mentions TCU coaching staff
  /** Distinct sources covering this (merged) story. 1 = single source. */
  corroboration?: number;
  /** Other outlets that ran the same story (canonical is the highest-weight one). */
  alsoCoveredBy?: string[];
};

/** One bullet in the brief. */
export type BriefBullet = { text: string; emphasis?: boolean };
export type BriefSection = { heading: string; bullets: BriefBullet[] };

/** A single day's brief, stored one-per-day and rendered on the home page. */
export type BriefDoc = {
  date: string; // YYYY-MM-DD (local)
  oneLiner: string; // the hero "one-line read"
  sections: BriefSection[]; // body, rendered to markdown
  radar?: string; // "on the radar" one-liner
  leadStory?: { title: string; source: string; url: string };
  /** Direct links to the top-ranked stories, rendered as a clickable list. */
  topLinks: { title: string; source: string; url: string }[];
  source: "tailored" | "fallback"; // Claude-written vs deterministic
  counts: { total: number; coach: number };
  generatedAt: string; // ISO
};

/** Compact, hallucination-proof digest handed to Claude. */
export type BriefFacts = {
  date: string;
  windowHours: number;
  items: {
    title: string;
    source: string;
    topic?: string;
    ageHours: number;
    score: number;
    official: boolean;
    coach: boolean;
  }[];
  hottest: { title: string; source: string }[];
  byTopic: { topic: string; count: number }[];
  coachCount: number;
  nextGame?: NextGame;
};

/** A scheduled game. Raw entries omit the computed fields (see lib/nextGame). */
export type NextGame = {
  opponent: string;
  date: string; // ISO date (time is a placeholder for sorting unless kickoff is set)
  home: boolean; // true for home + neutral-site (TCU as designated home); false = away
  venue: string;
  kickoff?: string; // confirmed kickoff, e.g. "11:00 AM CT"; undefined = TBD
  note?: string;
  // ---- computed by fullSchedule() ----
  daysUntil: number;
  isPast: boolean;
  isNext: boolean;
  dateLabel: string; // "Sat, Aug 29" (America/Chicago)
  kickoffLabel: string; // kickoff or "Time TBD"
};

/** Per-source health, surfaced to the owner so dead feeds don't fail silently. */
export type SourceHealth = {
  source: string;
  ok: boolean;
  items: number;
  error?: string;
  at: string; // ISO
};
