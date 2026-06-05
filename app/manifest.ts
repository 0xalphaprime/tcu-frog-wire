import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Frog Wire — TCU football daily",
    short_name: "Frog Wire",
    description:
      "A daily TCU Horned Frogs football brief + news wire for the family. Caught up in 2 minutes.",
    start_url: "/",
    display: "standalone",
    background_color: "#0e0a14",
    theme_color: "#4d1979",
    orientation: "portrait",
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
