// alphaskill/ (copied from the alphaskill repo by scripts/sync-alphaskill.ts), served under /skill.
import { readdirSync, readFileSync, statSync } from "fs";
import { join, relative, sep } from "path";

const ROOT = join(process.cwd(), "alphaskill");
/** Entry point for any AI agent: listed first in llms.txt and all.md. */
export const SYSTEM_PROMPT = "portable/system-prompt.md";

/** Every file under alphaskill/ (or one of its folders) as "skill/SKILL.md"-style paths, sorted. */
export const skillFiles = (folder = ""): string[] =>
  readdirSync(join(ROOT, folder), { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => relative(ROOT, join(e.parentPath, e.name)).split(sep).join("/"))
    .sort();

/** Null for anything that is not a listed file, so a crafted path never leaves alphaskill/. */
export const readSkillFile = (path: string) => (skillFiles().includes(path) ? readFileSync(join(ROOT, path)) : null);

export const skillFileSize = (path: string) => statSync(join(ROOT, path)).size;
