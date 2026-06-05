/**
 * 4 AM daily-brief cron: ingest fresh items, then (re)build + cache today's
 * brief. Build never throws — Claude failure falls back to the deterministic
 * brief, and a zero-news day yields a calm evergreen brief.
 *
 * TODO(v1.1): email the brief to the family via Resend, and fire the 4 AM PWA
 * push notification ("Your Frog brief is ready"). On a zero-news day, suppress
 * the email (still render the page) so inboxes don't learn to ignore it.
 */
import { ingestAll } from "@/lib/ingest";
import { getOrBuildTodayBrief } from "@/lib/brief/today";
import { authorized } from "@/lib/cronAuth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  if (!authorized(req)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const ingest = await ingestAll();
  const brief = await getOrBuildTodayBrief(true);
  return Response.json({
    ok: true,
    ingest,
    brief: {
      date: brief.date,
      source: brief.source,
      oneLiner: brief.oneLiner,
      counts: brief.counts,
    },
  });
}
