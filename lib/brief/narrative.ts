/**
 * Claude writes the daily brief from the fact digest using a strict
 * "use ONLY the facts" system prompt, structured JSON output,
 * prompt caching on the static system prompt. Every failure path returns null so
 * the caller renders the deterministic fallback — the cron NEVER depends on the
 * API being up.
 */
import Anthropic from "@anthropic-ai/sdk";
import type { BriefFacts, BriefSection } from "@/lib/types";

// Haiku is plenty for headline summarization and keeps cost ~$1/mo; override for
// richer prose (e.g. claude-sonnet-4-6).
const MODEL = process.env.BRIEF_MODEL || "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT = `You write the morning TCU Horned Frogs FOOTBALL brief for a family. They open it on their phone at 6am and want to be caught up in 2 minutes. One cousin, Brad Robbins, is TCU's quarterbacks coach — when a story mentions Brad/Robbins, surface it warmly.

Hard rules:
- Use ONLY the facts in the FACTS payload. Never invent or estimate scores, names, dates, records, or stories. Every claim must trace to a provided item.
- Keep it TIGHT and warm — scannable in ~2 minutes. One punchy "one-liner" that captures the day, then 2–4 short sections, each with at most 3 one-line bullets.
- Lead with the single biggest story. Group the rest by what they are (Offense, Recruiting, Schedule, Fan pulse). Mention source names inline (e.g. "per Sports Illustrated").
- If FACTS.bradCount > 0, include a short "Brad watch" beat. If 0, omit it (no filler).
- If FACTS has a nextGame, you may reference the countdown in the radar line.
- It's college football — slow offseason days are normal. If the items are thin, keep it calm and honest ("Quiet day for Frog football"), do NOT pad with invented hype.
- Set "emphasis": true only on a genuinely big/breaking bullet. Otherwise false.
- No greetings, sign-offs, links, or markdown syntax in your strings — those are added around your output.`;

const OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    oneLiner: { type: "string", description: "One punchy sentence capturing the day." },
    sections: {
      type: "array",
      description: "2–4 sections.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          heading: { type: "string" },
          bullets: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                text: { type: "string" },
                emphasis: { type: "boolean" },
              },
              required: ["text", "emphasis"],
            },
          },
        },
        required: ["heading", "bullets"],
      },
    },
    radar: { type: "string", description: "One short 'on the radar' line." },
  },
  required: ["oneLiner", "sections", "radar"],
} as const;

type NarrativeJson = { oneLiner: string; sections: BriefSection[]; radar: string };

function isNarrativeJson(v: unknown): v is NarrativeJson {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (typeof o.oneLiner !== "string" || !Array.isArray(o.sections)) return false;
  return o.sections.every((s) => {
    const sec = s as Record<string, unknown>;
    return (
      sec &&
      typeof sec.heading === "string" &&
      Array.isArray(sec.bullets) &&
      sec.bullets.every((b) => {
        const bl = b as Record<string, unknown>;
        return bl && typeof bl.text === "string";
      })
    );
  });
}

export async function generateNarrative(facts: BriefFacts): Promise<NarrativeJson | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1200,
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: OUTPUT_SCHEMA },
      },
      messages: [
        {
          role: "user",
          content: `FACTS:\n${JSON.stringify(facts, null, 2)}\n\nWrite the brief as JSON matching the schema.`,
        },
      ],
    });

    if (response.stop_reason === "refusal") return null;
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    if (!text.trim()) return null;

    const parsed: unknown = JSON.parse(text);
    if (!isNarrativeJson(parsed)) return null;

    const sections = parsed.sections
      .map((s) => ({
        heading: s.heading.trim(),
        bullets: s.bullets
          .filter((b) => b.text.trim().length > 0)
          .map((b) => ({ text: b.text.trim(), emphasis: Boolean(b.emphasis) })),
      }))
      .filter((s) => s.heading.length > 0 && s.bullets.length > 0);

    return { oneLiner: parsed.oneLiner.trim(), sections, radar: parsed.radar.trim() };
  } catch (err) {
    console.error("[brief] narrative generation failed; falling back:", err);
    return null;
  }
}
