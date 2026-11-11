import { SITE_URL } from "@/lib/site";
import { SYSTEM_PROMPT, skillFiles } from "@/lib/skill";
import { skill } from "@/app/content";

// llms.txt (llmstxt.org): title, summary, then sections of links an agent can fetch.
const link = (f: string) => `- [${f}](${SITE_URL}/skill/${f})`;

export async function GET() {
  const files = skillFiles();
  const body = [
    `# ${skill.title}`,
    `> ${skill.description}`,
    skill.llms.intro(`${SITE_URL}/skill/all.md`),
    `## ${skill.llms.start}`,
    [SYSTEM_PROMPT, "skill/SKILL.md"].map(link).join("\n"),
    `## ${skill.llms.reference}`,
    files.filter((f) => f !== SYSTEM_PROMPT && f !== "skill/SKILL.md").map(link).join("\n"),
  ].join("\n\n");
  return new Response(`${body}\n`, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
