/**
 * Frogs O' War (SB Nation / Vox) — the richest TCU-only source. It's an ATOM
 * feed (not RSS 2.0): /rss/current.xml 301s to /rss/index.xml, links live in
 * href attributes, the teaser is <summary>, and the full body is <content>.
 *
 * COPYRIGHT BOUNDARY (DESIGN.md §4): the feed ships the full article body, but
 * we only ever keep a short excerpt + a thumbnail URL. The full <content> is
 * read solely to pull the first image, then discarded — never stored/displayed.
 */
import { XMLParser } from "fast-xml-parser";
import type { WireItem } from "@/lib/types";
import {
  canonicalUrl,
  classifyTopic,
  excerptOf,
  hashId,
  isUsableThumbnail,
  mentionsBrad,
  sourceWeight,
} from "@/lib/util";

const FEED = "https://www.frogsowar.com/rss/index.xml";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

function asArray<T>(v: T | T[] | undefined): T[] {
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : [v];
}

/** A node may be a plain string, or { "@_type": ..., "#text": ... } when it has
 *  attributes. Return its text. */
function textOf(node: unknown): string {
  if (node == null) return "";
  if (typeof node === "string") return node;
  if (typeof node === "object") {
    const t = (node as Record<string, unknown>)["#text"];
    return typeof t === "string" ? t : "";
  }
  return "";
}

function altLink(link: unknown): string {
  const arr = asArray(link as Record<string, string> | Record<string, string>[]);
  const alt = arr.find((l) => l && l["@_rel"] === "alternate" && l["@_href"]);
  if (alt) return alt["@_href"];
  const any = arr.find((l) => l && l["@_href"]);
  return any ? any["@_href"] : "";
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, "&");
}

function firstImg(html: string): string | undefined {
  const m = html.match(/<img[^>]+src="([^"]+)"/i);
  return m ? decodeEntities(m[1]) : undefined;
}

type Entry = {
  title?: unknown;
  link?: unknown;
  summary?: unknown;
  content?: unknown;
  published?: string;
  updated?: string;
  author?: { name?: string } | { name?: string }[];
};

export async function fetchFrogsOWar(feed = FEED): Promise<WireItem[]> {
  const res = await fetch(feed, {
    headers: { "User-Agent": UA, Accept: "application/atom+xml, application/xml;q=0.9" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Frogs O' War ${res.status}`);
  const xml = await res.text();
  const doc = parser.parse(xml);
  const entries: Entry[] = asArray(doc?.feed?.entry);

  const items: WireItem[] = [];
  for (const e of entries) {
    const url = altLink(e.link).trim();
    const title = textOf(e.title).trim();
    if (!url || !title) continue;

    const summary = textOf(e.summary);
    const body = textOf(e.content); // read for the image only, then dropped
    const rawThumb = firstImg(summary) ?? firstImg(body);
    const thumbnail = isUsableThumbnail(rawThumb) ? rawThumb : undefined;
    const author = Array.isArray(e.author) ? e.author[0]?.name : e.author?.name;
    const when = e.published || e.updated;
    const publishedAt = when ? new Date(when).toISOString() : new Date().toISOString();
    const canon = canonicalUrl(url);
    const text = `${title} ${summary}`;

    items.push({
      id: hashId(canon),
      source: "Frogs O' War",
      sourceType: "rss",
      sourceWeight: sourceWeight("Frogs O' War"),
      title,
      url,
      excerpt: excerptOf(summary || title),
      author: author?.trim() || undefined,
      topic: classifyTopic(text),
      thumbnail,
      publishedAt,
      firstSeenAt: new Date().toISOString(),
      score: 0,
      official: false,
      bradMention: mentionsBrad(text),
    });
  }
  return items;
}
