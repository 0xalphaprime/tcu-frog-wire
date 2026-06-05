/**
 * Google News RSS — the workhorse source. One normalized feed that already
 * aggregates ESPN / SI / 247 / Frogs O' War / Yahoo, so we don't scrape them
 * directly (DESIGN.md §3). Server-side fetch with a browser-like UA (fixes the
 * Cloudflare 403s the WebFetch tool hit during research).
 *
 * NOTE: <link> is a news.google.com redirect. We store/display the publisher
 * NAME from <source> and dedupe on the redirect URL for now; resolving to the
 * true publisher URL is a v2 best-effort add (DESIGN.md §7).
 */
import { XMLParser } from "fast-xml-parser";
import type { WireItem } from "@/lib/types";
import {
  canonicalUrl,
  classifyTopic,
  excerptOf,
  hashId,
  isFootball,
  mentionsBrad,
  sourceWeight,
} from "@/lib/util";

const DEFAULT_FEED =
  "https://news.google.com/rss/search?q=%22TCU%20football%22%20OR%20%22Horned%20Frogs%20football%22&hl=en-US&gl=US&ceid=US:en";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

type RssItem = {
  title?: string;
  link?: string;
  pubDate?: string;
  description?: string;
  source?: string | { "#text"?: string; "@_url"?: string };
};

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

function asArray<T>(v: T | T[] | undefined): T[] {
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : [v];
}

function sourceName(raw: RssItem, title: string): string {
  const s = raw.source;
  if (s && typeof s === "object" && s["#text"]) return s["#text"];
  if (typeof s === "string" && s.trim()) return s;
  // Google News titles are usually "Headline - Source"; recover the suffix.
  const dash = title.lastIndexOf(" - ");
  return dash > 0 ? title.slice(dash + 3).trim() : "Google News";
}

export async function fetchGoogleNews(feed = process.env.GOOGLE_NEWS_FEED || DEFAULT_FEED): Promise<WireItem[]> {
  const res = await fetch(feed, {
    headers: { "User-Agent": UA, Accept: "application/rss+xml, application/xml;q=0.9" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Google News ${res.status}`);
  const xml = await res.text();
  const doc = parser.parse(xml);
  const raw: RssItem[] = asArray(doc?.rss?.channel?.item);

  const items: WireItem[] = [];
  for (const r of raw) {
    const link = (r.link || "").trim();
    const rawTitle = (r.title || "").trim();
    if (!link || !rawTitle) continue;

    const src = sourceName(r, rawTitle);
    // Strip the " - Source" suffix Google appends to titles.
    const title = rawTitle.endsWith(` - ${src}`) ? rawTitle.slice(0, -(src.length + 3)).trim() : rawTitle;
    const canon = canonicalUrl(link);
    const publishedAt = r.pubDate ? new Date(r.pubDate).toISOString() : new Date().toISOString();
    const text = `${title} ${r.description || ""}`;
    if (!isFootball(text)) continue; // football only

    items.push({
      id: hashId(canon),
      source: src,
      sourceType: "rss",
      sourceWeight: sourceWeight(src),
      title,
      url: link,
      excerpt: excerptOf(r.description || title),
      topic: classifyTopic(text),
      publishedAt,
      firstSeenAt: new Date().toISOString(),
      score: 0,
      official: /tcu athletics|gofrogs/i.test(src),
      bradMention: mentionsBrad(text),
    });
  }
  return items;
}
