import { createHash } from "crypto";
import type { WireItem } from "@/lib/types";

/** Short stable id from any string (canonical URL). */
export function hashId(s: string): string {
  return createHash("sha1").update(s).digest("hex").slice(0, 16);
}

/**
 * Canonicalize a URL for dedupe: drop hash + tracking params, lowercase host,
 * strip www./amp. and trailing slashes. Same story at slightly different URLs
 * collapses to one key. (Google News redirect resolution is a v2 add — DESIGN §7.)
 */
export function canonicalUrl(raw: string): string {
  try {
    const u = new URL(raw);
    u.hash = "";
    for (const p of [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "fbclid",
      "gclid",
      "ref",
      "amp",
    ]) {
      u.searchParams.delete(p);
    }
    const host = u.host.toLowerCase().replace(/^www\./, "").replace(/^amp\./, "");
    const path = u.pathname.replace(/\/amp\/?$/, "/").replace(/\/+$/, "");
    const qs = u.searchParams.toString();
    return `${u.protocol}//${host}${path}${qs ? `?${qs}` : ""}`;
  } catch {
    return raw;
  }
}

/** Strip HTML tags + entities to plain text. */
export function stripHtml(s: string): string {
  return s
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/gi, "&")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Teaser-length excerpt — NEVER store more than this (copyright boundary). */
export function excerptOf(s: string, n = 280): string {
  const t = stripHtml(s);
  return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t;
}

const THUMB_DENY =
  /doubleclick|googlesyndication|google-analytics|\/pixel|[/_-]1x1|spacer|blank\.|transparent\.|\/ads?\/|beacon|gravatar|s\.w\.org|feedburner/i;
const THUMB_EXT = /\.(jpe?g|png|webp|avif)(\?|$)/i;

/**
 * Heuristic "sniff test" for a thumbnail URL — no network. Only let a tile show
 * an image we're fairly sure is a real, sizeable picture: must be an http(s)
 * raster image (jpg/png/webp/avif, not .svg/.gif icons), not a tracking pixel /
 * spacer / ad / avatar, and not flagged tiny by a width/height query param.
 */
export function isUsableThumbnail(url?: string | null): url is string {
  if (!url) return false;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return false;
  if (THUMB_DENY.test(url)) return false;
  if (!THUMB_EXT.test(u.pathname)) return false;
  for (const k of ["w", "width", "h", "height"]) {
    const v = Number(u.searchParams.get(k));
    if (v && v < 200) return false;
  }
  return true;
}

export function timeAgo(iso: string, now = Date.now()): string {
  const diff = Math.max(0, now - Date.parse(iso));
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${Math.max(1, m)}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function ageHours(iso: string, now = Date.now()): number {
  return Math.max(0, (now - Date.parse(iso)) / 3_600_000);
}

/**
 * Hotness score. Recency dominates; source trust, social signal (upvotes), and
 * corroboration (how many distinct outlets ran the story) refine it.
 */
export function hotness(item: WireItem, now = Date.now()): number {
  const recency = Math.exp(-ageHours(item.publishedAt, now) / 18); // ~18h half-feel
  const social = Math.min(1, Math.log10((item.score || 0) + 1) / 3);
  const corro = Math.min(1, ((item.corroboration ?? 1) - 1) / 3); // 1 src=0, 4+=1
  return 0.5 * recency + 0.27 * item.sourceWeight + 0.13 * social + 0.1 * corro;
}

// Domain words that appear in nearly every TCU headline — excluded so the
// distinguishing words drive title similarity.
const FINGERPRINT_STOP = new Set([
  "tcu", "football", "horned", "frogs", "frog", "the", "and", "for", "with",
  "from", "his", "her", "you", "are", "but", "out", "big", "12", "2026", "2027",
]);

function titleTokens(title: string): Set<string> {
  return new Set(
    stripHtml(title)
      .toLowerCase()
      .replace(/[^a-z0-9 ]+/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !FINGERPRINT_STOP.has(w)),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

/**
 * Collapse the same story arriving from multiple sources (e.g. Google News +
 * Frogs O' War) into one canonical item. Cluster by title similarity within a
 * 36h window; keep the highest-weight source as canonical, fold the rest in as
 * `alsoCoveredBy`, and set `corroboration` = distinct-source count (a hotness
 * boost). The dominant overlap (sources co-occurring in one ingest run) is
 * handled here; cross-run merge is a v2 add.
 */
export function mergeByFingerprint(items: WireItem[], now = Date.now()): WireItem[] {
  type Cluster = { items: WireItem[]; toks: Set<string>; t: number };
  const clusters: Cluster[] = [];
  // Highest source weight first → it becomes each cluster's canonical.
  const ordered = [...items].sort(
    (a, b) =>
      b.sourceWeight - a.sourceWeight ||
      Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
  );

  for (const it of ordered) {
    const toks = titleTokens(it.title);
    const t = Date.parse(it.publishedAt);
    const hit = clusters.find(
      (c) => Math.abs(t - c.t) <= 36 * 3_600_000 && jaccard(toks, c.toks) >= 0.8,
    );
    if (hit) hit.items.push(it);
    else clusters.push({ items: [it], toks, t });
  }

  return clusters.map((c) => {
    const canonical = c.items[0];
    const sources = [...new Set(c.items.map((i) => i.source))];
    const alsoCoveredBy = sources.filter((s) => s !== canonical.source);
    return {
      ...canonical,
      score: Math.max(...c.items.map((i) => i.score)),
      thumbnail: canonical.thumbnail ?? c.items.find((i) => i.thumbnail)?.thumbnail,
      corroboration: sources.length,
      alsoCoveredBy: alsoCoveredBy.length ? alsoCoveredBy : undefined,
    };
  });
}

const SOURCE_WEIGHTS: Array<[RegExp, number]> = [
  [/tcu athletics|gofrogs/i, 1.0],
  [/espn/i, 0.95],
  [/frogs o.? war/i, 0.9],
  [/dave campbell|texasfootball/i, 0.85],
  [/sports illustrated|\bsi\b|si\.com/i, 0.8],
  [/247sports|on3|rivals/i, 0.7],
  [/yahoo/i, 0.65],
  [/reddit/i, 0.55],
  [/youtube/i, 0.5],
];

export function sourceWeight(source: string): number {
  for (const [re, w] of SOURCE_WEIGHTS) if (re.test(source)) return w;
  return 0.6;
}

export function classifyTopic(text: string): string | undefined {
  const t = text.toLowerCase();
  if (/(commit|recruit|portal|transfer|signee|nil|class of 20)/.test(t)) return "Recruiting";
  if (/(schedule|kickoff|opener|dublin|bowl|big 12 title|week zero|aviva)/.test(t)) return "Schedule";
  if (/(offens|quarterback|\bqb\b|passing|rushing|sammis|air raid|pistol|craig)/.test(t)) return "Offense";
  if (/(defens|secondary|linebacker|pass rush|corner)/.test(t)) return "Defense";
  if (/(injur|out for|questionable|availab|suspend)/.test(t)) return "Injury";
  return undefined;
}

export function mentionsBrad(text: string): boolean {
  return /\brobbins\b/i.test(text);
}

const OTHER_SPORT =
  /\b(basketball|hoops|baseball|softball|volleyball|soccer|golf|tennis|track and field|cross country|swimming|gymnastics|equestrian|rifle|rowing|wrestling)\b/i;
const FOOTBALL_TERMS =
  /\b(football|quarterbacks?|qbs?|gridiron|sonny dykes|kickoff|touchdowns?|fall camp|spring game|depth chart|offensive line|defensive line|wide receivers?|running backs?|linebackers?|tight end)\b/i;

/**
 * Football-only gate. Frogs O' War's feed (and the occasional Google News hit)
 * cover all TCU sports — keep football, drop the rest. Article categories are the
 * strongest signal (Frogs O' War tags posts "TCU Football" / "Basketball" / …);
 * otherwise drop only items that clearly name another sport and never mention
 * football, so football pieces without the literal word "football" still pass.
 */
export function isFootball(text: string, categories: string[] = []): boolean {
  if (categories.some((c) => /football/i.test(c))) return true;
  if (categories.some((c) => OTHER_SPORT.test(c))) return false;
  const t = text.toLowerCase();
  if (OTHER_SPORT.test(t) && !FOOTBALL_TERMS.test(t)) return false;
  return true;
}

/** YYYY-MM-DD in America/Chicago (TCU is in Fort Worth, the family's TZ). */
export function todayCentral(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
