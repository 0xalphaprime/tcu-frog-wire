/**
 * Build today's brief: rank facts -> let Claude write it -> deterministic
 * fallback. Always returns a renderable BriefDoc, including a calm evergreen
 * brief on a zero-news offseason day (the top launch-day risk, DESIGN.md §7).
 */
import type { BriefDoc, BriefSection, NextGame, WireItem } from "@/lib/types";
import { extractFacts, rankPool } from "@/lib/brief/facts";
import { generateNarrative } from "@/lib/brief/narrative";

function evergreen(date: string, nextGame: NextGame | undefined, now: number): BriefDoc {
  const radar = nextGame
    ? `${nextGame.daysUntil} days to ${nextGame.opponent} (${nextGame.venue}).`
    : "Offseason — full slate coming.";
  return {
    date,
    oneLiner: nextGame
      ? `Quiet day for Frog football — ${nextGame.daysUntil} days until ${nextGame.opponent} in Dublin.`
      : "Quiet day for Frog football.",
    sections: [
      {
        heading: "On the radar",
        bullets: [{ text: radar, emphasis: false }],
      },
    ],
    radar,
    source: "fallback",
    counts: { total: 0, brad: 0 },
    generatedAt: new Date(now).toISOString(),
  };
}

export async function buildBrief(
  date: string,
  items: WireItem[],
  nextGame: NextGame | undefined,
  now = Date.now(),
): Promise<BriefDoc> {
  const ranked = rankPool(items, now);
  if (ranked.pool.length === 0) return evergreen(date, nextGame, now);

  const lead = ranked.pool[0];
  const facts = extractFacts(date, ranked, nextGame, now);
  const bradCount = facts.bradCount;
  const leadStory = { title: lead.title, source: lead.source, url: lead.url };

  // 1) Try Claude.
  const narrative = await generateNarrative(facts);
  if (narrative) {
    return {
      date,
      oneLiner: narrative.oneLiner,
      sections: narrative.sections,
      radar: narrative.radar,
      leadStory,
      source: "tailored",
      counts: { total: ranked.pool.length, brad: bradCount },
      generatedAt: new Date(now).toISOString(),
    };
  }

  // 2) Deterministic fallback over the same facts.
  const sections: BriefSection[] = [
    {
      heading: "Top stories",
      bullets: ranked.pool.slice(0, 5).map((it, i) => ({
        text: `${it.title} — ${it.source}`,
        emphasis: i === 0,
      })),
    },
  ];
  if (bradCount > 0) {
    sections.push({
      heading: "Brad watch",
      bullets: ranked.pool
        .filter((it) => it.bradMention)
        .slice(0, 3)
        .map((it) => ({ text: `${it.title} — ${it.source}`, emphasis: false })),
    });
  }
  const radar = nextGame
    ? `${nextGame.daysUntil} days to ${nextGame.opponent} (${nextGame.venue}).`
    : undefined;

  return {
    date,
    oneLiner: `${lead.title} leads today's wire (${lead.source}).`,
    sections,
    radar,
    leadStory,
    source: "fallback",
    counts: { total: ranked.pool.length, brad: bradCount },
    generatedAt: new Date(now).toISOString(),
  };
}

/** Render a BriefDoc body to markdown for react-markdown (matches the family's
 *  existing markdown brief format). */
export function briefToMarkdown(brief: BriefDoc): string {
  const lines: string[] = [];
  for (const section of brief.sections) {
    lines.push(`### ${section.heading}`);
    for (const b of section.bullets) {
      lines.push(`- ${b.emphasis ? `**${b.text}**` : b.text}`);
    }
    lines.push("");
  }
  if (brief.radar) lines.push(`_On the radar: ${brief.radar}_`);
  return lines.join("\n");
}
