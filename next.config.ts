import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tile thumbnails are hotlinked publisher images rendered with a plain <img>
  // (referrerpolicy=no-referrer) inside a fixed aspect-ratio box — we deliberately
  // do NOT route them through next/image optimization (see DESIGN.md §7).
};

export default nextConfig;
