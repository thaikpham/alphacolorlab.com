"use client";

// Trang /admin/decode (chỉ dev): chọn máy, bảng tham số, rồi lượt tiếp theo có nút lưu lượt vào dự án.
import { useMemo, useState, useSyncExternalStore } from "react";
import { cameraModels, decodeConsole } from "@/app/content";
import { DecodeTable, segment } from "@/app/components/decode/DecodeTable";
import { NextRound } from "@/app/components/decode/NextRound";
import { getLocalRaw, parseLocal, subscribeLocal } from "@/app/components/decode/localStore";
import { setModel, useModel } from "@/lib/model";
import { Candidates } from "./Candidates";

export function AdminDecode() {
  const model = useModel();
  const a = decodeConsole.admin;
  const raw = useSyncExternalStore(subscribeLocal, getLocalRaw, () => "");
  const local = useMemo(() => parseLocal(raw), [raw]);
  const [focus, setFocus] = useState<string[]>([]);
  const toggleFocus = (settingId: string) =>
    setFocus((f) => (f.includes(settingId) ? f.filter((x) => x !== settingId) : [...f, settingId]));

  return (
    <div className="space-y-8">
      <div role="group" aria-label={a.camera} className="inline-flex rounded-control bg-fill p-1">
        {cameraModels.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={model === c.id}
            onClick={() => setModel(c.id)}
            className={segment(model === c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>
      <DecodeTable local={local} focus={focus} onToggleFocus={toggleFocus} current={model} />
      <Candidates />
      <NextRound model={model} focus={focus} showDevSave />
    </div>
  );
}
