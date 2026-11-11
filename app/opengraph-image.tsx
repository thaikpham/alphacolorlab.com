import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";
import { seo } from "./content";

// Satori has no CSS variables: read the design tokens straight from globals.css.
const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");
const token = (name: string) => css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-f]+)`, "i"))![1];

export const alt = seo.siteName;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 56,
          background: token("bg"),
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 40,
        }}
      >
        <div style={{ fontSize: 72, fontWeight: "bold", color: token("label") }}>
          {seo.siteName}
        </div>
        <div style={{ fontSize: 36, color: token("secondary"), textAlign: "center" }}>
          {seo.ogImageSubtitle}
        </div>
      </div>
    ),
    { ...size }
  );
}
