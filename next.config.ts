import type { NextConfig } from "next";
import { legacyRedirects } from "./lib/legacyRedirects";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
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
