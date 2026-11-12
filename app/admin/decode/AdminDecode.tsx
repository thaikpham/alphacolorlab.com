"use client";

// Nội dung /admin/decode sau cổng AdminGate: chọn máy, bảng tham số, ứng viên, rồi lượt tiếp theo có nút lưu lượt vào dự án.
// rows, summaries và candidates do AdminGate nhận từ /admin/decode/data; trang công khai không có dữ liệu này.
import { useState } from "react";
import { cameraModels, decodeConsole } from "@/app/content";
import { DecodeTable, segment } from "@/app/components/decode/DecodeTable";
import { NextRound } from "@/app/components/decode/NextRound";
import { setModel, useModel } from "@/lib/model";
import type { TableRow } from "@/lib/decode/table";
import type { ModelSummary } from "@/lib/decode/matrix";
import type { GameModel } from "@/lib/game/types";
import { Candidates } from "./Candidates";
import type { Candidate } from "./Candidates";

export type AdminData = {
  rows: TableRow[];
  summaries: Record<GameModel, ModelSummary>;
  candidates: Candidate[];
};

export function AdminDecode({ rows, summaries, candidates }: AdminData) {
  const model = useModel();
  const a = decodeConsole.admin;
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
      <DecodeTable rows={rows} summaries={summaries} focus={focus} onToggleFocus={toggleFocus} current={model} />
      <Candidates candidates={candidates} />
      <NextRound model={model} focus={focus} showDevSave />
    </div>
  );
}
