"use client";

import { useState } from "react";

/**
 * Tile thumbnail. The URL already passed the heuristic sniff test (isUsableThumbnail)
 * at ingest, but a sniff can't catch a hotlink that 403s or 404s at load time — so
 * on error we hide the image, letting the container's purple gradient show through
 * instead of a broken-image box.
 */
export function Thumb({ src }: { src: string }) {
  const [ok, setOk] = useState(true);
  if (!ok) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setOk(false)}
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}
