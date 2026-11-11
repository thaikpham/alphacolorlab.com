"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { kolSets, glossary, recallGuideText } from "@/app/content";
import { useRemoteSetList, type RemoteSet } from "@/lib/kol";
import { cloneSlots, listedSets, type PresetSet } from "@/lib/presetSets";
import { buildPresetFiles, loadPresetBase, saveFile, ZIP_FILENAME, type PresetSystem } from "@/lib/presetDownload";
import { readSaved, toggleSaved, useSavedSets, writeSaved } from "@/lib/savedSets";
import { InfoTip } from "./InfoTip";

/** Sưu tầm hoặc bỏ sưu tầm một bộ trên máy này (đăng nhập thì đồng bộ theo tài khoản). */
export function SaveSetButton({ id }: { id: string }) {
  const saved = useSavedSets().includes(id);
  return (
    <button
      type="button"
      aria-pressed={saved}
      onClick={() => writeSaved(toggleSaved(readSaved(), id))}
      className={`inline-flex h-11 shrink-0 items-center rounded-full px-5 text-subhead font-semibold text-label transition-colors ${saved ? "bg-fill-strong" : "bg-fill hover:bg-fill-strong"}`}
    >
      {saved ? kolSets.saved : kolSets.save}
    </button>
  );
}

/** Một dòng bộ: tên, mở trang bộ, sưu tầm. byline: hiện tên tác giả (bộ trong repo); bộ KOL đã nằm dưới tiêu đề tác giả. */
function SetRow({ set, byline }: { set: PresetSet; byline: boolean }) {
  return (
    <li className="flex items-center gap-2 pr-3">
      <Link href={`/bo-m1-m4/${set.id}`} className="flex min-h-11 flex-1 items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-fill">
        <span className="min-w-0 text-body text-label">{set.name}</span>
        {byline && set.author && <span className="shrink-0 text-footnote text-secondary">{set.author.name}</span>}
      </Link>
      <SaveSetButton id={set.id} />
    </li>
  );
}

/** Bộ KOL nhóm theo handle, giữ thứ tự xuất hiện đầu tiên. */
function groupByAuthor(sets: RemoteSet[]): [string, RemoteSet[]][] {
  const groups = new Map<string, RemoteSet[]>();
  for (const s of sets) groups.set(s.author.handle, [...(groups.get(s.author.handle) ?? []), s]);
  return [...groups];
}

/**
 * Danh sách bộ chia sẻ: bộ trong repo đã công khai trước, rồi bộ KOL đã công khai nhóm theo tác giả. Dùng ở /bo-m1-m4 và cột phải của /console.
 * Bộ unlisted không hiện nhưng id vẫn bị chiếm (taken lấy từ mọi bộ). Chưa có backend hoặc lỗi mạng thì chỉ hiện bộ trong repo.
 * Không có bộ nào sau khi tải xong thì hiện một dòng chữ.
 */
export function PresetSetList({ sets }: { sets: PresetSet[] }) {
  const taken = useMemo(() => new Set(sets.map((s) => s.id)), [sets]);
  const remote = useRemoteSetList(taken);
  const listed = listedSets(sets);
  const groups = groupByAuthor(remote ?? []);
  const empty = remote !== undefined && listed.length === 0 && groups.length === 0;
  return (
    <>
      {listed.length > 0 && (
        <ul className="overflow-hidden rounded-card bg-card shadow-card divide-y divide-separator">
          {listed.map((set) => (
            <SetRow key={set.id} set={set} byline />
          ))}
        </ul>
      )}
      {groups.map(([handle, group]) => (
        <section key={handle} aria-labelledby={`kol-${handle}`} className="mt-6">
          <h3 id={`kol-${handle}`} className="mb-1.5 px-4 text-footnote font-medium text-secondary">
            <Link href={`/kol/${handle}`} className="transition-colors hover:text-label">
              {group[0].author.name}
            </Link>
          </h3>
          <ul className="overflow-hidden rounded-card bg-card shadow-card divide-y divide-separator">
            {group.map((set) => (
              <SetRow key={set.id} set={set} byline={false} />
            ))}
          </ul>
        </section>
      ))}
      {empty && <p className="text-body text-secondary">{kolSets.empty}</p>}
    </>
  );
}

/** Tải ZIP 4 file của bộ (theo hệ PAL/NTSC đã chọn) và nút "Dùng bộ này" mở Tạo bộ M1–M4 với bộ đó. Chỉ hiện cho ZV-E10. */
export function PresetSetActions({ set }: { set: PresetSet }) {
  const [system, setSystem] = useState<PresetSystem>("pal");
  const [failed, setFailed] = useState(false);

  const download = async () => {
    setFailed(false);
    try {
      const { base, headers } = await loadPresetBase(system);
      const guide = recallGuideText({ setName: set.name, labels: set.slots.map((s) => s.label) });
      const { zip } = buildPresetFiles(cloneSlots(set), base, headers, guide);
      saveFile(zip, ZIP_FILENAME, "application/zip");
    } catch {
      setFailed(true);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-1.5 flex items-center gap-1.5">
          <span className="text-footnote font-medium text-secondary">{kolSets.system}</span>
          <InfoTip entry={glossary.system} />
        </div>
        <div className="flex gap-1 rounded-control bg-fill p-1">
          {(["pal", "ntsc"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setSystem(v)}
              aria-pressed={system === v}
              className={`flex-1 h-11 rounded-badge text-subhead font-medium transition ${
                system === v ? "bg-card shadow-thumb font-semibold text-label" : "text-label hover:bg-fill-strong"
              }`}
            >
              {v.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={download}
          className="inline-flex h-12 items-center rounded-full bg-accent px-7 text-callout font-semibold text-on-accent transition-colors hover:bg-accent/90"
        >
          {kolSets.download}
        </button>
        <Link href={`/tao-m1-m4?set=${set.id}`} className="inline-flex h-11 items-center rounded-full bg-fill px-5 text-subhead font-semibold text-label transition-colors hover:bg-fill-strong">
          {kolSets.use}
        </Link>
      </div>
      {failed && <p role="alert" className="text-footnote text-danger">{kolSets.downloadError}</p>}
    </div>
  );
}
