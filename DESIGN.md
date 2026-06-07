# Frog Blog — design notes

**A daily TCU Horned Frogs football brief + news wire.**
Wake up to a fresh 2-minute catch-up, then scroll the hottest stories on your phone.

Frog Blog is a small, modern web app: a home page that opens with an auto-generated daily
**brief** (a 2-minute "where TCU sits / what's hot" read), followed by **the Wire** — a
scrollable, filterable feed of the hottest TCU football articles aggregated from across the web,
deduped and ranked. It's an installable PWA, so it lives on your phone's home screen.

Stack: **Next.js 16 (App Router) · React 19 · Tailwind v4 · Anthropic Claude · Upstash Redis ·
react-markdown · Vercel + Vercel Cron.** It's intentionally lean — one developer can run and
extend it — and it degrades gracefully: with no API keys set it still runs locally on seeded
sample data and a deterministic brief.

---

## 1. Brand / color (grounded from brand.tcu.edu)

TCU's official primary is **Horned Frog Purple — `#4D1979`, Pantone 268 C** (RGB 77/25/121);
the brand standard wants purple dominant. Official secondaries: **White**, **Horned Frog Grey
`#A3A9AC` (PMS 429)**, **Black**. We run a dark, premium sports-media theme with purple as the
accent (brightened to `#8B5CF6` for legibility on near-black):

```css
:root{
  --bg:#0E0A14;          /* near-black (softened TCU Black) */
  --surface:#171120;
  --surface-alt:#211833;
  --text:#F4F1F8;
  --muted:#A3A9AC;       /* official Horned Frog Grey */
  --accent:#8B5CF6;      /* TCU Purple #4D1979 brightened for dark legibility */
  --accent-hover:#A78BFA;
  --accent-deep:#4D1979; /* the official purple, for brand chrome */
  --border:#2C2440;
  --gold:#F9D44B;        /* top-story / "Brad" marker, used sparingly */
  --red:#E5484D;         /* breaking only */
  --green:#3FB950;       /* "official" source badge */
}
```

Fonts: **DM Sans + DM Mono** (license-free, geometric — a clean match for a sports-media feel;
DM Mono for scores/clocks/countdowns). Direction: calm and high-contrast, readable at 6 AM —
a single hero headline, tight cards, generous spacing. See `mockup/index.html`.

---

## 2. Where the content comes from

Tier the sources: **directly integrate the ones with real feeds; let an aggregator carry the
paywalled/ToS-locked ones; skip paid APIs.** Each source is just a function returning
`WireItem[]`, registered in `SOURCES` (`lib/ingest.ts`) — the pipeline is source-agnostic.

### Shipped
- **Google News RSS** — the workhorse. `news.google.com/rss/search?q="TCU football"…` — one
  normalized feed that already aggregates ESPN/SI/247/Yahoo/Frogs O' War. (Its `<link>` is a
  Google redirect; resolving to the true publisher URL is a future best-effort add.)
- **Frogs O' War** (SB Nation, Atom feed) — the richest TCU-only source. Full text in the feed,
  but we keep only a short excerpt + thumbnail (see §3).

### Deferred (slots ready in `SOURCES`)
- **YouTube channel RSS** (`youtube.com/feeds/videos.xml?channel_id=UC…`) — press conferences,
  highlights, analysis. No key required.
- **Reddit r/TCU + r/CFB** (OAuth) — the social-buzz signal (upvotes feed the hotness ranking).

### Skipped
- **Paywalled/ToS-locked** (247Sports, On3, ESPN, SI direct) → surfaced only via Google News,
  link-out + attribution; no direct scraping.
- **X/Twitter** → no free tier; not worth it for v1.

### Pipeline
`fetch (parallel, fault-tolerant) → normalize → merge same-story-across-sources → store`, run by
`/api/cron/ingest`. The daily brief (`/api/cron/daily-brief`) pulls the last 24h of items,
builds a deterministic fact digest, asks Claude to write a ~250-word markdown brief from *facts
only*, and falls back to a deterministic brief if the API is unavailable.

---

## 3. The one rule: the copyright boundary

Some feeds (esp. Frogs O' War) deliver **full article text**. We never persist or display it.

- Store + display **only**: headline + ≤300-char excerpt + link + source attribution + timestamp.
- Full text passes through Claude **transiently in memory** to summarize, then is discarded —
  never written to the store. Enforced at the normalization boundary (`excerptOf` in `lib/util.ts`).
- Keep the site **non-commercial** (no ads/sales). Footer carries an "unofficial fan site, not
  affiliated with TCU" disclaimer; team marks are text, not rehosted logos.

---

## 4. Features

**Now**
- Home = daily brief hero (the "one-line read" + next-game countdown) + the Wire (deduped tiles).
- Filter chips: Hottest / Newest / Offense / Recruiting / Schedule / Official.
- **Brad tracker** — a saved keyword filter that highlights any "Robbins" mention.
- **Cross-source merge** — the same story from multiple outlets collapses into one tile, tagged
  "+N more outlets" (corroboration also nudges the hotness ranking).
- Installable PWA.

**Next**
- 4 AM PWA push ("Your Frog brief is ready"), share-to-text, weekly recap, archive search.
- In-season auto score/result on the next-game card.

**On reactions.** A cosmetic "Family Picks" upvote exists but deliberately does **not** drive the
hotness ranking — at family scale, in-app voting is gameable and statistically meaningless. Real
ranking uses recency + source trust + corroboration (+ external Reddit buzz once that source lands).

---

## 5. Cadence & cost

- **Ingest cron:** every 5 minutes (`vercel.json`). Feeds change on the order of minutes-to-hours,
  so 5 min catches breaking news effectively instantly; finer polling just risks rate-limits/bans.
  A manual "Refresh now" button covers game-day impatience.
- **Brief cron:** once daily (`0 9 * * *` UTC ≈ 4 AM CT). DST drift accepted.
- **Cost:** runs near-free on hobby/free tiers; the only real line item is Claude (~$1/month with
  a Haiku model summarizing headlines+excerpts; $0 on any day the deterministic fallback runs).
  Items live in Redis with a 14-day TTL (auto-prunes), so storage stays small and bounded.

> Note on hosting tiers: Vercel's Hobby tier caps cron at once-per-day, so the `*/5` ingest cron
> needs Pro. On Hobby, drop the `*/5` entry and rely on the daily cron + the Refresh button.

---

## 6. Build gotchas to design around

1. **Google News redirect links** are opaque; resolving to the publisher URL is best-effort (cache
   results, fall back to title-fingerprint dedupe + the feed's `<source>` name).
2. **Empty offseason brief** is the most likely "broken on launch day" case — there's an explicit
   evergreen empty-state (next-game countdown + storyline) and every template slot is guarded.
3. **Frogs O' War is Atom, not RSS** — `/rss/current.xml` 301s to `/rss/index.xml`; links live in
   `href` attributes; needs a browser-like User-Agent (Cloudflare blocks default agents).
4. **Thumbnails** are hotlinked publisher images (`loading=lazy`, `referrerpolicy=no-referrer`)
   inside a fixed aspect-ratio box with a placeholder, so a broken image never breaks the grid.
   We don't route them through image optimization.
5. **Cross-source dedupe** (`mergeByFingerprint`): title-token Jaccard ≥0.8 within 36h. Batch-level
   (same ingest run) today; cross-run merge is a future add.
6. **Source health** is recorded per run so a silently-dead feed is visible, not just "stale news."

---

## 7. Data model (Redis)

- `items` — the wire (per-item hash + index, 14-day TTL → auto-prunes).
- `brief:<date>` — one generated brief per day.
- `seen` / `resolved` / `health` — dedupe set, URL-resolution cache, per-source last-run health.

---

## 8. Roadmap

1. ✅ Scaffold + TCU theme + PWA.
2. ✅ Ingest (Google News + Frogs O' War) → normalize → merge → Redis; source health.
3. ✅ The Wire UI — tiles, filter chips, Brad tracker.
4. ✅ Daily brief — fact digest → Claude → deterministic fallback → evergreen empty-state.
5. ☐ YouTube + Reddit sources; Google News URL resolution.
6. ☐ PWA push + share-to-text; weekly recap; archive search.
7. ☐ Deploy + custom subdomain.

## Open questions
- Name: "Frog Blog," or something else?
- Subdomain: a subdomain of your choice.
- Scope: football-only, or expand to all TCU sports later?
