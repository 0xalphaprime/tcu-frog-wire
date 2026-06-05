/**
 * Manual "Refresh now" — the game-day button. Ingests, then redirects home.
 * (On Hobby this is how you get sub-daily freshness without a paid cron.)
 */
import { ingestAll } from "@/lib/ingest";
import { authorized } from "@/lib/cronAuth";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(req: Request) {
  if (!authorized(req)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  await ingestAll();
  return Response.redirect(new URL("/", req.url), 303);
}
