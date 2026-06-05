/**
 * Manual "Refresh now" — the game-day button. PUBLIC (so anyone visiting can use
 * it), but rate-limited via a short Redis lock so it can't be hammered to burn
 * source rate-limits / function invocations. The scheduled crons stay protected
 * by CRON_SECRET; only this on-demand button is open.
 */
import { ingestAll } from "@/lib/ingest";
import { getRedis } from "@/lib/redis";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const COOLDOWN_SECONDS = 60;

export async function GET(req: Request) {
  const home = Response.redirect(new URL("/", req.url), 303);
  const redis = getRedis();
  if (redis) {
    // NX lock: only the first caller within the window actually ingests.
    const got = await redis.set("frogwire:refresh:lock", "1", {
      nx: true,
      ex: COOLDOWN_SECONDS,
    });
    if (got === null) return home; // refreshed too recently — just bounce home
  }
  await ingestAll();
  return home;
}
