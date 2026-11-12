// How far each body's Memory Recall file format is decoded, computed from the data this site already ships (no hand-set numbers).
//   All three bodies use one measure: values confirmed out of every enumerated value (catalog and codec-only), read from data/decode-summary.json (written by npm run decode:scan).
// Module này nằm trong bundle của mọi trang console: chỉ import dữ liệu nhỏ, không kéo planner, ma trận, danh mục hay codec.
import summaryJson from '../data/decode-summary.json' with { type: 'json' }

export type DecodeState = 'decoded' | 'decoding' | 'none'
export type DecodeProgress = { state: DecodeState; percent: number; done: number; total: number }

type SummaryRow = { values: number; confirmed: number }
const summaries = (summaryJson as unknown as { models: Record<string, SummaryRow> }).models

// Trần 99: 100% chỉ khi bộ tạo file đã phát hành cho máy này (A7C II: bài thử gọi lại đạt 2026-11-10, vòng 10–10f).
// α6400: chỉ đọc, thử nghiệm (lib/a6400/dat.ts), không bao giờ là 'decoded'.
// ZV-E10: 'decoded' vì trang tạo được file M1–M4; phần trăm vẫn là giá trị đã thấy trong file máy thật, không ép 100.
function fromSummary(id: 'zve10' | 'a7c2' | 'a6400'): DecodeProgress {
  const s = summaries[id]
  const pct = Math.round((100 * s.confirmed) / s.values)
  return { state: id === 'zve10' ? 'decoded' : 'decoding', percent: id === 'zve10' ? pct : Math.min(99, pct), done: s.confirmed, total: s.values }
}

// Công tắc duy nhất: trạng thái, phần trăm và thanh tiến độ giải mã chỉ hiện khi chạy npm run dev. Bản production không có chữ hay số tiến độ.
export const showDecodeStatus = process.env.NODE_ENV !== 'production'

export function decodeProgress(id?: string): DecodeProgress {
  return id === 'zve10' || id === 'a7c2' || id === 'a6400' ? fromSummary(id) : { state: 'none', percent: 0, done: 0, total: 0 }
}
