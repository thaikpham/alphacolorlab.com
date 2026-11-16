import type { NextConfig } from "next";
import { legacyRedirects } from "./lib/legacyRedirects";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Stopgap since 2026-11-16: the host's image optimization quota is used up and /_next/image answers 402,
    // so every picture is served as it is (product photos straight from sony.jp). Remove this line once the quota is back.
    unoptimized: true,
    // 31 days: fewer re-optimizations of the same picture, so the host's image quota lasts longer
    minimumCacheTTL: 2678400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "static.bhphoto.com",
        pathname: "/images/**",
      },
      {
        protocol: "https",
        hostname: "www.sony.jp",
        pathname: "/products/**",
      },
      {
        protocol: "https",
        hostname: "www.sony.jp",
        pathname: "/content/dam/**",
      },
    ],
  },
  async redirects() {
    return legacyRedirects();
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
