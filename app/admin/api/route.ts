import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { validatePresetSets, PresetError } from "@/lib/presetSets";

const DATA_FILE = path.join(process.cwd(), "data", "preset-sets.json");

function isLocalhost(origin: string): boolean {
  try {
    const url = new URL(origin);
    return url.hostname === "localhost" || url.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // CSRF guard: reject if Origin header is present and not localhost.
  // Limitation: dev server may listen on LAN address; this guard only checks 127.0.0.1/localhost.
  const origin = req.headers.get("origin");
  if (origin && !isLocalhost(origin)) {
    return NextResponse.json({ error: "CORS not allowed" }, { status: 403 });
  }

  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // CSRF guard: reject if Origin header is present and not localhost.
  // Limitation: dev server may listen on LAN address; this guard only checks 127.0.0.1/localhost.
  const origin = req.headers.get("origin");
  if (origin && !isLocalhost(origin)) {
    return NextResponse.json({ error: "CORS not allowed" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const sets = validatePresetSets(body);

    // Write atomically: write to temp file, then rename
    const tmpFile = DATA_FILE + ".tmp";
    fs.writeFileSync(tmpFile, JSON.stringify(sets, null, 2) + "\n");
    fs.renameSync(tmpFile, DATA_FILE);

    return NextResponse.json(sets);
  } catch (err) {
    if (err instanceof PresetError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
