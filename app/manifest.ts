import type { MetadataRoute } from "next";
import { appInfo } from "./content";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: appInfo.name,
    short_name: appInfo.shortName,
    description: appInfo.description,
    lang: "vi",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f3f4f6",
    theme_color: "#f3f4f6",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
