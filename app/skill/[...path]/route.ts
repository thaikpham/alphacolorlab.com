import { readSkillFile, skillFiles } from "@/lib/skill";

const TYPES: Record<string, string> = { md: "text/markdown", json: "application/json", csv: "text/csv" };

export function generateStaticParams() {
  return skillFiles().map((f) => ({ path: f.split("/") }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const path = (await params).path.join("/");
  const body = readSkillFile(path);
  if (!body) return new Response("Not found", { status: 404 });
  const type = TYPES[path.split(".").pop()!] ?? "text/plain";
  return new Response(body, { headers: { "Content-Type": `${type}; charset=utf-8` } });
}
