/**
 * Ingest cron. On Vercel Pro: schedule every 5 min (vercel.json). On Hobby:
 * fold this into the daily-brief cron + the manual Refresh button (DESIGN.md §6).
 */
import { ingestAll } from "@/lib/ingest";
import { authorized } from "@/lib/cronAuth";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(req: Request) {
  if (!authorized(req)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await ingestAll();
  return Response.json({ ok: true, ...result });
}
