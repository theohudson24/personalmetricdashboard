import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Metric OS — Personal Metric Dashboard",
    short_name: "Metric OS",
    description: "Private tracking for habits, training, nutrition, and self-improvement.",
    start_url: "/",
    display: "standalone",
    background_color: "#111317",
    theme_color: "#10231d",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
