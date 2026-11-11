import { SYSTEM_PROMPT, readSkillFile, skillFiles } from "@/lib/skill";
import { skill } from "@/app/content";

/** Every alphaskill file in one markdown document, system prompt first: for chat apps that take one upload. */
export async function GET() {
  const files = [SYSTEM_PROMPT, ...skillFiles().filter((f) => f !== SYSTEM_PROMPT)];
  const body = [`# ${skill.title}\n\n${skill.description}`, ...files.map((f) => `<!-- file: ${f} -->\n\n${readSkillFile(f)}`)].join("\n\n");
  return new Response(body, { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
