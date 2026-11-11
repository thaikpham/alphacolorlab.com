import { readSkillFile, skillFiles } from "@/lib/skill";
import { makeZip } from "@/lib/zve10/zip";

/** The Claude skill folder (alphaskill/skill) as sony-alpha-viet/…, ready for Claude.ai or ~/.claude/skills. */
export async function GET() {
  const entries = skillFiles("skill").map((f) => ({ path: f.replace(/^skill\//, "sony-alpha-viet/"), data: new Uint8Array(readSkillFile(f)!) }));
  return new Response(Buffer.from(makeZip(entries)), {
    headers: { "Content-Type": "application/zip", "Content-Disposition": "attachment; filename=sony-alpha-viet.zip" },
  });
}
