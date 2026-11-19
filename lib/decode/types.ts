// Kiểu dùng chung cho lượt giải mã M1–M4 (lập lượt, đọc file, kiểm tra, phân tích).
// Mọi file trong lib/decode/* và app/components/decode/* chỉ dựa vào file này. Đổi kiểu ở đây thì sửa mọi chỗ dùng.

export type DecodeModel = "zve10" | "a6400" | "a7c2";
export type Lang = "vi" | "en";
export type Localized = { vi: string; en: string };

// Danh mục thiết lập cho từng model: data/decode-catalog.json
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
export type Catalog = Record<DecodeModel, ModelCatalog>;

// Đề bài: 4 ô nhớ. Mỗi ô liệt kê giá trị tuyệt đối phải đặt trước khi lưu ô đó.
export type StepRole = "control" | "target";
export type SlotStep = { settingId: string; valueId: string; role: StepRole };
export type SlotTask = { slot: 1 | 2 | 3 | 4; steps: SlotStep[] };
export type Mission = { id: string; model: DecodeModel; seed: number; createdAt: number; slots: SlotTask[] };

// File đọc từ thẻ: PRIVATE/SONY/SETTING/<folder>/<name>
export type CardFile = { folder: string; name: string; bytes: Uint8Array };

export type CheckResult = { slot: number; settingId: string; expected: string; actual: string | null; ok: boolean };
export type StructuralCheck = { id: string; slot?: number; ok: boolean; message: Localized };
export type Verification = {
  ok: boolean; // đạt: ghi nhận được phát hiện
  checks: CheckResult[]; // câu kiểm tra từ giá trị đã giải mã (ZV-E10)
  structural: StructuralCheck[]; // đủ file, đúng model, đúng thứ tự lưu, ô có thay đổi…
  retrySlots: number[]; // ô nên làm lại
};

// Một byte (ZV-E10, α6400: where = "0x…") hoặc một bản ghi (A7C II: where = "ID 0x…") đã đổi giữa hai ô
export type FindingChange = { where: string; from: number | string | null; to: number | string };

// Phát hiện từ một lượt giải mã (analyze.ts tạo ra)
export type Finding =
  | { kind: "confirm"; model: DecodeModel; slot: number; settingId: string; valueId: string; isNew: boolean }
  | { kind: "code"; model: DecodeModel; slot: number; settingId: string; valueId: string; raw: number | string; where: string }
  | { kind: "mismatch"; model: DecodeModel; slot: number; settingId: string; valueId: string; actual: string | null; raw: number | string | null }
  | { kind: "locate"; model: DecodeModel; slot: number; settingId: string; valueId: string; fromValueId: string | null; candidates: FindingChange[] }
  | { kind: "ambiguous"; model: DecodeModel; slot: number; settingIds: string[]; candidates: FindingChange[] };

// File của một ô trong lượt giải mã (bytes của file máy đã lưu)
export type RoundFile = { slot: number; bytes: Uint8Array };
