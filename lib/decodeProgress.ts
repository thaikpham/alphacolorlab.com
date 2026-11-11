// How far each body's Memory Recall file format is decoded, computed from the data this site already ships (no hand-set numbers).
//   ZV-E10: settings the camera stores in M1–M4 that the generator writes (presetSupport "co" vs "chua"; "khong" = not stored).
//   A7C II: menu values already seen in files the camera saved (A7C2_SETTINGS `confirmed`) out of every value in the menu.
import { presetSupport } from '../app/content.ts'
import { A7C2_SETTINGS } from './a7c2/settings.ts'
import { A6400_FIELDS } from './a6400/dat.ts'

export type DecodeState = 'decoded' | 'decoding' | 'none'
export type DecodeProgress = { state: DecodeState; percent: number; done: number; total: number }

function zve10(): DecodeProgress {
  const done = presetSupport.filter((p) => p.status === 'co').length
  const total = done + presetSupport.filter((p) => p.status === 'chua').length
  return { state: 'decoded', percent: Math.round((100 * done) / total), done, total }
}

function a7c2(): DecodeProgress {
  let done = 0
  let total = 0
  for (const s of Object.values(A7C2_SETTINGS) as readonly { values?: readonly string[]; confirmed?: readonly string[] }[]) {
    total += (s.values ?? []).filter(Boolean).length
    done += (s.confirmed ?? []).length
  }
  return { state: 'decoding', percent: Math.min(99, Math.round((100 * done) / total)), done, total } // recall test passed 2026-11-10 (rounds 10–10f); 100% only once the generator ships for this body
}

// α6400: chỉ đọc, thử nghiệm (lib/a6400/dat.ts). Mẫu số là số trường ZV-E10 (zve10()); tử số là trường đã có giá trị quan sát từ file máy thật; không bao giờ là 'decoded'.
function a6400(): DecodeProgress {
  const total = zve10().total
  const done = A6400_FIELDS.filter((f) => f.observed.length > 0).length
  return { state: 'decoding', percent: Math.min(99, Math.round((100 * done) / total)), done, total }
}

export function decodeProgress(id?: string): DecodeProgress {
  return id === 'zve10' ? zve10() : id === 'a7c2' ? a7c2() : id === 'a6400' ? a6400() : { state: 'none', percent: 0, done: 0, total: 0 }
}
