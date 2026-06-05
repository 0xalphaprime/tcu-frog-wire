/**
 * Cron/route guard. On Vercel, set CRON_SECRET and Vercel Cron sends it as a
 * Bearer token automatically. Empty secret = open (local dev only).
 */
export function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}
