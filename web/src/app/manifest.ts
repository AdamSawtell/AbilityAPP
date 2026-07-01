import type { MetadataRoute } from "next";
import { MOBILE_APP_NAME, MOBILE_APP_SHORT_NAME } from "@/lib/mobile/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: MOBILE_APP_NAME,
    short_name: MOBILE_APP_SHORT_NAME,
    description: "Shifts, check-in, timesheets, and tasks for support workers in the field.",
    start_url: "/m/today",
    scope: "/m",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#b51266",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
