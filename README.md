# Frog Blog

A daily **TCU Horned Frogs football** brief + news wire for the family.
Wake up to a 2-minute catch-up, then scroll the hottest stories on your phone.

Modern, lean stack: **Next.js 16 · React 19 · Tailwind v4 · Anthropic Claude · Upstash
Redis · react-markdown · Vercel Cron.** Design notes are in [`DESIGN.md`](./DESIGN.md); a
static visual mockup is in [`mockup/index.html`](./mockup/index.html).

> **Disclaimer:** Unofficial, non-commercial fan project. Not affiliated with, endorsed by,
> or sponsored by Texas Christian University. All articles link to and credit their original
> publishers; only headlines + short excerpts are stored.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

**No keys needed for dev** — with no env set, the app seeds sample TCU articles into an
in-memory store and renders a deterministic brief, so it works fully offline. Copy
`.env.local.example` → `.env.local` and add keys to go live.

| Want… | Set |
|---|---|
| Claude-written brief (vs deterministic) | `ANTHROPIC_API_KEY` (+ optional `BRIEF_MODEL`) |
| Durable store across deploys | `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` |
| Protected cron routes | `CRON_SECRET` (Vercel Cron sends it automatically) |

```bash
npm run typecheck   # tsc --noEmit — the canary (no test suite)
```

## How it works

- **Ingest** (`lib/ingest.ts` → `lib/sources/*`): fetch sources in parallel (fault-tolerant),
  normalize → keep **football only** (other TCU sports filtered out) → merge the same story
  across sources → store in Redis (14-day TTL, auto-prunes).
  Ships **Google News RSS** + **Frogs O' War** (Atom). Each source is just a function returning
  `WireItem[]`; add YouTube RSS / Reddit-OAuth as new entries in `SOURCES`.
- **Daily brief** (`lib/brief/*`): rank facts → **Claude writes it** → **deterministic fallback**
  on any failure (the cron never depends on the API) → calm evergreen brief on a zero-news day.
- **UI** (`app/page.tsx`): brief hero + next-game countdown, filter chips (incl. ⭐ Brad tracker),
  and the Wire — a `grid-cols-1 sm:grid-cols-2` tile feed sorted by hotness.

## Endpoints

- `GET /api/cron/ingest` — fetch + store (Vercel Cron `*/5`).
- `GET /api/cron/daily-brief` — ingest + (re)build the brief (`0 9 * * *` UTC ≈ 4 AM CT).
- `GET /api/refresh` — public, rate-limited "Refresh now" button (a 60s Redis lock;
  the scheduled cron routes above stay `CRON_SECRET`-protected).

## The one rule (copyright boundary)

Store/display **only** headline + ≤300-char excerpt + link + attribution. Full article text
is used transiently to feed Claude, then discarded — never persisted. Enforced in
`lib/util.ts` (`excerptOf`) at the normalization boundary. Keep the site **non-commercial**.

## Deploy

Push to a Vercel project, set the env vars (incl. `CRON_SECRET`), point a subdomain of
your choice at it. On Vercel Pro the `*/5` ingest cron runs as scheduled; on the
Hobby tier (cron caps at once/day) drop the `*/5` ingest entry from `vercel.json` and rely on
the daily-brief cron + the "Refresh now" button.

## License

[MIT](./LICENSE) for the code. This does not grant any rights to TCU trademarks or to
third-party article content, which remain with their owners.
