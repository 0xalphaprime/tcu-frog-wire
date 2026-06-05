/**
 * Sample TCU items so `npm run dev` shows a real-looking wire with no API keys.
 * Derived from the family's June 4 brief; timestamps are relative to now so they
 * look fresh. A real ingest run (cron / Refresh) overwrites these with live data.
 *
 * Excerpts are deliberately short teasers — the same copyright boundary the live
 * pipeline enforces (DESIGN.md §4).
 */
import type { WireItem } from "@/lib/types";
import {
  canonicalUrl,
  classifyTopic,
  excerptOf,
  hashId,
  mentionsBrad,
  sourceWeight,
} from "@/lib/util";

type SeedSpec = {
  source: string;
  title: string;
  url: string;
  blurb: string;
  hoursAgo: number;
  score?: number;
  official?: boolean;
  thumbnail?: string;
};

const SPECS: SeedSpec[] = [
  {
    source: "Dave Campbell's Texas Football",
    title: "Inside TCU: Why Sonny Dykes Is Betting Big on an Offensive Reset in 2026",
    url: "https://www.texasfootball.com/article/2026/04/15/inside-tcu-why-sonny-dykes-is-betting-big-on-an-offensive-reset-in-2026",
    blurb:
      "Dykes tore down the Air Raid-leaning attack for balance — more snaps under center and out of the pistol, with ball security borrowed from the UConn model.",
    hoursAgo: 3,
    score: 0,
  },
  {
    source: "TCU Athletics",
    title: "Robbins Tabbed to Lead Frog Quarterbacks in 2026",
    url: "https://gofrogs.com/news/2026/1/2/football-robbins-tabbed-to-lead-frog-quarterbacks-in-2026",
    blurb:
      "Brad Robbins joins from Tulsa, reuniting with OC Gordon Sammis — the two built UConn's 2024 offense together.",
    hoursAgo: 26,
    official: true,
  },
  {
    source: "Sports Illustrated",
    title: "Jaden Craig Could Fix TCU's Turnover Problem But There's One Big Question",
    url: "https://www.si.com/college/tcu/football/jaden-craig-tcu-football-turnover-problem-2026",
    blurb:
      "A 52:12 career TD-to-INT ratio and a 1.68% pick rate. The open question: does Ivy efficiency scale against Big 12 speed?",
    hoursAgo: 6,
    score: 0,
  },
  {
    source: "Roundtable",
    title: "TCU Is A Dangerous Big 12 Sleeper In 2026",
    url: "https://roundtable.io/sports/ncaa/tcu/news/tcu-is-a-dangerous-big-12-sleeper-in-2026",
    blurb:
      "Title odds around +1900 — writers read it as sleeper value. The recurring fan logic: good enough to matter, overlooked enough to strike.",
    hoursAgo: 9,
    score: 240,
  },
  {
    source: "Aer Lingus College Football Classic",
    title: "Aer Lingus College Football Classic 2026: TCU and UNC to Kick Off in Dublin",
    url: "https://www.aerlingus.com/en-ie/2026-aer-lingus-college-football-classic-tcu-vs-unc-set-for-dublin-showdown",
    blurb:
      "TCU is the designated home team, abroad for the first time. Storyline magnet: UNC is now coached by Bill Belichick.",
    hoursAgo: 50,
  },
  {
    source: "247Sports",
    title: "TCU QB Jaden Craig recaps performance from spring camp",
    url: "https://247sports.com/article/tcu-horned-frogs-jaden-craig-spring-camp-282740903/",
    blurb:
      "Strong reviews across 15 spring practices. The staff says he brings a running dimension the QB room hasn't had.",
    hoursAgo: 30,
  },
];

export function buildSeedItems(now = Date.now()): WireItem[] {
  return SPECS.map((s) => {
    const canon = canonicalUrl(s.url);
    const publishedAt = new Date(now - s.hoursAgo * 3_600_000).toISOString();
    const text = `${s.title} ${s.blurb}`;
    return {
      id: hashId(canon),
      source: s.source,
      sourceType: "rss",
      sourceWeight: sourceWeight(s.source),
      title: s.title,
      url: s.url,
      excerpt: excerptOf(s.blurb),
      topic: classifyTopic(text),
      thumbnail: s.thumbnail,
      publishedAt,
      firstSeenAt: publishedAt,
      score: s.score ?? 0,
      official: s.official,
      bradMention: mentionsBrad(text),
    } satisfies WireItem;
  });
}
