import { notFound } from "next/navigation";
import Link from "next/link";
import fs from "fs";
import path from "path";
import { validatePresetSets } from "@/lib/presetSets";
import { decodeConsole } from "@/app/content";
import { InfoTip } from "@/app/components/InfoTip";
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
    <div className="mx-auto max-w-page px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <h1 className="text-title font-normal">{adminCopy.title}</h1>
          <InfoTip entry={{ term: adminCopy.title, lines: [{ t: adminCopy.lead }] }} />
        </div>
        <Link
          href="/admin/decode"
          className="inline-flex h-11 shrink-0 items-center rounded-full bg-fill px-5 text-subhead font-semibold text-label transition-colors hover:bg-fill-strong"
        >
          {decodeConsole.admin.toDecode}
        </Link>
      </div>
      <AdminPresets initialSets={initialSets} />
    </div>
  );
}
