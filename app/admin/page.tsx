import { notFound } from "next/navigation";
import Link from "next/link";
import fs from "fs";
import path from "path";
import { validatePresetSets } from "@/lib/presetSets";
import { decodeConsole } from "@/app/content";
import { AdminPresets } from "./AdminPresets";
import { adminCopy } from "./copy";

export const metadata = {
  title: adminCopy.title,
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const dataPath = path.join(process.cwd(), "data", "preset-sets.json");
  const raw = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  const initialSets = validatePresetSets(raw);

  return (
    <div className="max-w-page mx-auto px-4 sm:px-6 py-10">
      <p className="mb-6 text-subhead">
        <Link href="/admin/decode" className="text-accent-text underline">{decodeConsole.admin.toDecode}</Link>
      </p>
      <div className="mb-8">
        <h1 className="text-title font-normal mb-2">{adminCopy.title}</h1>
        <p className="text-body text-secondary">{adminCopy.lead}</p>
      </div>
      <AdminPresets initialSets={initialSets} />
    </div>
  );
}
