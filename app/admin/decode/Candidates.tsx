"use client";

// Mã và vị trí ứng viên mà bộ phân tích rút ra từ các lượt đã lưu (data/decode-observed.json). Chỉ dùng ở /admin/decode.
// Ứng viên chưa phải kết luận: đưa vào codec (lib/zve10, lib/a6400, lib/a7c2) rồi mới tính là đã giải mã.
import observedJson from "@/data/decode-observed.json";
import { cameraModels, codecSettingLabels, decodeConsole } from "@/app/content";
import { labelOf, settingOf } from "@/lib/game/catalog";
import type { Finding, GameModel } from "@/lib/game/types";

type Candidate = Finding & { missionId: string };
const candidates = (observedJson as unknown as { candidates: Candidate[] }).candidates;

const settingName = (model: GameModel, id: string) => settingOf(model, id)?.label.vi ?? codecSettingLabels[id] ?? id;
const valueName = (model: GameModel, id: string, value: string) => labelOf(model, id, value, "vi") ?? value;
const changes = (c: { where: string; from: number | string | null; to: number | string }[]) =>
  c.map((x) => `${x.where} (${x.from ?? "?"} thành ${x.to})`).join(", ");

function line(c: Candidate): string {
  const t = decodeConsole.table.candidates;
  if (c.kind === "code") return t.code(valueName(c.model, c.settingId, c.valueId), String(c.raw), c.where);
  if (c.kind === "locate") return t.locate(valueName(c.model, c.settingId, c.valueId), changes(c.candidates));
  if (c.kind === "ambiguous") return t.ambiguous(changes(c.candidates));
  if (c.kind === "mismatch") return t.mismatch(valueName(c.model, c.settingId, c.valueId), c.actual ?? "?");
  return "";
}

export function Candidates() {
  const t = decodeConsole.table.candidates;
  // Giá trị chỉ xác nhận lại thì đã nằm trong bảng; ở đây chỉ liệt kê điều cần người xem xét
  const list = candidates.filter((c) => c.kind !== "confirm");
  return (
    <section aria-labelledby="decode-candidates" className="rounded-card bg-card p-4 shadow-card sm:p-5">
      <h2 id="decode-candidates" className="text-subhead font-semibold">{t.title}</h2>
      {list.length === 0 ? (
        <p className="mt-3 text-footnote text-secondary">{t.none}</p>
      ) : (
        <ul className="mt-3 divide-y divide-separator">
          {list.map((c, i) => (
            <li key={i} className="space-y-1 py-3 text-footnote">
              <p className="text-callout text-label">
                {`${cameraModels.find((m) => m.id === c.model)?.name ?? c.model}, M${c.slot}, ${c.kind === "ambiguous" ? c.settingIds.map((id) => settingName(c.model, id)).join(", ") : settingName(c.model, c.settingId)}`}
              </p>
              <p className="break-words text-label tabular-nums">{line(c)}</p>
              <p className="break-all text-secondary">{`${t.round}: ${c.missionId}`}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
