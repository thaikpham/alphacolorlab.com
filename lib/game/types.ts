// Hợp đồng chung của mini game "Hiểu về menu máy ảnh Sony" (góp mẫu file Memory Recall).
// lib/game/* (logic) và app/components/game/* (giao diện) chỉ dựa vào file này. Đổi kiểu ở đây thì sửa cả hai phía.

export type GameModel = "zve10" | "a6400" | "a7c2";
export type Lang = "vi" | "en";
export type Localized = { vi: string; en: string };

// Danh mục thiết lập cho từng model: data/game-tasks.json
export type CatalogValue = { id: string; label: Localized };
export type CatalogSetting = {
  id: string; // ví dụ "metering", "wb"
  label: Localized; // tên menu trên máy
  path: Localized; // "MENU › Cài đặt máy ảnh1 › Chế độ đo sáng"
  values: CatalogValue[];
  decoded: boolean; // true: codec đọc được, dùng làm câu kiểm tra
};
export type ModelCatalog = {
  name: string; // "ZV-E10"
  headerModel: string; // chuỗi model trong header file, ví dụ "ZV-E10"
  settings: CatalogSetting[];
};
export type Catalog = Record<GameModel, ModelCatalog>;

// Đề bài: 4 ô nhớ. Mỗi ô liệt kê giá trị tuyệt đối phải đặt trước khi lưu ô đó.
export type StepRole = "control" | "target";
export type SlotStep = { settingId: string; valueId: string; role: StepRole };
export type SlotTask = { slot: 1 | 2 | 3 | 4; steps: SlotStep[] };
export type Mission = { id: string; model: GameModel; seed: number; createdAt: number; slots: SlotTask[] };

// File đọc từ thẻ: PRIVATE/SONY/SETTING/<folder>/<name>
export type CardFile = { folder: string; name: string; bytes: Uint8Array };

export type CheckResult = { slot: number; settingId: string; expected: string; actual: string | null; ok: boolean };
export type StructuralCheck = { id: string; slot?: number; ok: boolean; message: Localized };
export type Verification = {
  ok: boolean; // đủ điều kiện nộp
  checks: CheckResult[]; // câu kiểm tra từ giá trị đã giải mã (ZV-E10)
  structural: StructuralCheck[]; // đủ file, đúng model, đúng thứ tự lưu, ô có thay đổi…
  retrySlots: number[]; // ô nên làm lại
};
export type Score = { accuracy: number; speed: number; total: number }; // 0–700, 0–300, 0–1000

export type Submission = {
  missionId: string;
  model: GameModel;
  firmware: string | null; // người chơi nhập, ví dụ "2.01"
  region: "pal" | "ntsc" | null;
  nickname: string | null;
  lang: Lang;
  mission: Mission;
  files: { folder: string; name: string; base64: string }[];
  verification: Verification;
  score: Score;
  durationMs: number;
  retries: number;
  appVersion: string;
};

export type SubmitResult = { ok: true } | { ok: false; error: string };
