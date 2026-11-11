import type { Mission, CardFile, Verification, Score, CheckResult, StructuralCheck, Lang } from "./types.ts";
import { labelOf, getCatalog } from "./catalog.ts";
import { decodeDat, parseDat } from "../zve10/dat.ts";
import { parseA7c2 } from "../a7c2/dat.ts";

function extractDate(bytes: Uint8Array): string | null {
  // Try ASCII "YYYYMMDD_HHMMSS" near 0x18, within first 0x40 bytes
  const slice = bytes.slice(0, 0x40);
  const text = new TextDecoder().decode(slice);
  const match = text.match(/\d{8}_\d{6}/);
  return match ? match[0] : null;
}

export function verify(
  mission: Mission,
  files: CardFile[],
  lang: Lang = "vi",
  before?: CardFile[]
): Verification {
  const checks: CheckResult[] = [];
  const structural: StructuralCheck[] = [];
  const retrySlots: number[] = [];

  const catalog = getCatalog();
  const modelCat = catalog[mission.model];

  // A6400 file names are unconfirmed: also accept the card.ts fallback names (…01.DAT)
  const slotRe = mission.model === "a6400" ? /0([1-4])[PN]?\.DAT$/i : /CAMPR0([1-4])([PN])\.DAT$/i;

  // Group files by slot (pick newest if multiple per slot)
  const filesBySlot: Record<number, CardFile> = {};
  for (const file of files) {
    const match = file.name.match(slotRe);
    if (match) {
      const slot = parseInt(match[1]) as 1 | 2 | 3 | 4;
      if (!filesBySlot[slot]) {
        filesBySlot[slot] = file;
      } else {
        // Pick newer by date
        const newDate = extractDate(file.bytes);
        const oldDate = extractDate(filesBySlot[slot].bytes);
        if (newDate && (!oldDate || newDate > oldDate)) {
          // Add non-blocking warning about multiple files
          structural.push({
            id: `slot_${slot}_multiple_files_warn`,
            slot,
            ok: true,
            message: {
              vi: `Ô ${slot} có nhiều file; dùng file mới nhất`,
              en: `Slot ${slot} has multiple files; using newest`
            }
          });
          filesBySlot[slot] = file;
        }
      }
    }
  }

  // Check: file per slot
  for (let slot = 1; slot <= 4; slot++) {
    if (!filesBySlot[slot]) {
      structural.push({
        id: `slot_${slot}_missing`,
        slot,
        ok: false,
        message: {
          vi: `Ô ${slot} không có file`,
          en: `Slot ${slot} missing file`
        }
      });
      retrySlots.push(slot);
    }
  }

  if (Object.keys(filesBySlot).length < 4) {
    return {
      ok: false,
      checks: [],
      structural,
      retrySlots
    };
  }

  // Index before files by slot
  const beforeBySlot: Record<number, CardFile | undefined> = {};
  if (before) {
    for (const file of before) {
      const match = file.name.match(slotRe);
      if (match) {
        const slot = parseInt(match[1]) as 1 | 2 | 3 | 4;
        beforeBySlot[slot] = file;
      }
    }
  }

  // Check file properties and before-identical
  const timestamps: string[] = [];
  let firstFileSize: number | null = null;

  for (let slot = 1; slot <= 4; slot++) {
    const file = filesBySlot[slot];
    if (!file) continue;

    // Check: file size > 0, all same size
    if (file.bytes.length === 0) {
      structural.push({
        id: `slot_${slot}_empty`,
        slot,
        ok: false,
        message: {
          vi: `Ô ${slot} file trống`,
          en: `Slot ${slot} file is empty`
        }
      });
      retrySlots.push(slot);
      continue;
    }

    if (firstFileSize === null) {
      firstFileSize = file.bytes.length;
    } else if (file.bytes.length !== firstFileSize) {
      structural.push({
        id: `slot_${slot}_size_mismatch`,
        slot,
        ok: false,
        message: {
          vi: `Ô ${slot} kích thước khác (${file.bytes.length} vs ${firstFileSize} byte)`,
          en: `Slot ${slot} size differs (${file.bytes.length} vs ${firstFileSize} bytes)`
        }
      });
      retrySlots.push(slot);
      continue;
    }

    // Check: identical to before file
    const beforeFile = beforeBySlot[slot];
    if (beforeFile && beforeFile.bytes.length === file.bytes.length) {
      let identical = true;
      for (let i = 0; i < file.bytes.length; i++) {
        if (file.bytes[i] !== beforeFile.bytes[i]) {
          identical = false;
          break;
        }
      }
      if (identical) {
        structural.push({
          id: `slot_${slot}_not_resaved_block`,
          slot,
          ok: false,
          message: {
            vi: `Ô ${slot} chưa được lưu lại`,
            en: `Slot ${slot} was not re-saved`
          }
        });
        retrySlots.push(slot);
        continue;
      }
    }

    // Extract date for timestamp order check
    const date = extractDate(file.bytes);
    if (date) timestamps[slot - 1] = date;

    // Read header model (for both models)
    const headerModelEnd = file.bytes.indexOf(0, 5);
    const headerModel = headerModelEnd > 5
      ? new TextDecoder().decode(file.bytes.slice(5, headerModelEnd)).replace(/\0/g, "")
      : "";

    // ZV-E10: strict header check + full parse
    if (mission.model === "zve10") {
      if (file.bytes.length !== 4608) {
        structural.push({
          id: `slot_${slot}_size`,
          slot,
          ok: false,
          message: {
            vi: `Ô ${slot} không phải file Memory Recall ZV-E10 (${file.bytes.length} byte)`,
            en: `Slot ${slot} is not a ZV-E10 Memory Recall file (${file.bytes.length} bytes)`
          }
        });
        retrySlots.push(slot);
        continue;
      }

      if (headerModel !== modelCat.headerModel) {
        structural.push({
          id: `slot_${slot}_header_mismatch`,
          slot,
          ok: false,
          message: {
            vi: `Header không khớp: "${headerModel}" (mong đợi "${modelCat.headerModel}")`,
            en: `Header mismatch: "${headerModel}" (expected "${modelCat.headerModel}")`
          }
        });
        retrySlots.push(slot);
        continue;
      }

      try {
        parseDat(file.bytes); // Just validate, don't need result here
      } catch (e) {
        structural.push({
          id: `slot_${slot}_parse_error`,
          slot,
          ok: false,
          message: {
            vi: `Lỗi đọc file: ${String(e).slice(0, 50)}`,
            en: `Read error: ${String(e).slice(0, 50)}`
          }
        });
        retrySlots.push(slot);
        continue;
      }
    } else if (mission.model === "a7c2") {
      // A7C II: khung file đã biết (header, số bản ghi, hai checksum) nên kiểm chặt như ZV-E10
      let error: string | null = headerModel !== modelCat.headerModel ? `Header "${headerModel}" (mong đợi "${modelCat.headerModel}")` : null;
      if (!error) {
        try {
          parseA7c2(file.bytes);
        } catch (e) {
          error = String(e instanceof Error ? e.message : e).slice(0, 60);
        }
      }
      if (error) {
        structural.push({
          id: `slot_${slot}_parse_error`,
          slot,
          ok: false,
          message: { vi: `Ô ${slot}: ${error}`, en: `Slot ${slot}: ${error}` }
        });
        retrySlots.push(slot);
        continue;
      }
    } else {
      // A6400: non-blocking header check only
      if (headerModel && headerModel !== modelCat.headerModel) {
        structural.push({
          id: `slot_${slot}_header_mismatch_warn`,
          slot,
          ok: true,
          message: {
            vi: `Header: "${headerModel}" (mong đợi "${modelCat.headerModel}")`,
            en: `Header: "${headerModel}" (expected "${modelCat.headerModel}")`
          }
        });
      }
    }
  }

  // Check timestamp order
  for (let i = 0; i < 3; i++) {
    if (timestamps[i] && timestamps[i + 1] && timestamps[i] >= timestamps[i + 1]) {
      structural.push({
        id: `timestamp_order_${i + 1}_${i + 2}`,
        slot: i + 2,
        ok: false,
        message: {
          vi: `Ô ${i + 1} lưu không trước ô ${i + 2}`,
          en: `Slot ${i + 1} not saved before slot ${i + 2}`
        }
      });
      retrySlots.push(i + 2);
    }
  }

  // ZV-E10: decode and check controls
  if (mission.model === "zve10") {
    let totalControls = 0;
    let correctControls = 0;

    for (let slot = 1; slot <= 4; slot++) {
      const file = filesBySlot[slot];
      if (!file) continue;

      let decoded;
      try {
        decoded = decodeDat(file.bytes);
      } catch (e) {
        continue;
      }

      const slotTask = mission.slots.find(s => s.slot === slot as 1 | 2 | 3 | 4);
      if (!slotTask) continue;

      const settingIdToField: Record<string, string> = {
        focusMode: "focus",
        focusArea: "focusArea",
        metering: "metering",
        facePriority: "facePriority",
        softSkin: "softSkin",
        autoReview: "autoReview",
        "flash-mode": "flashMode",
        "exp-comp-set": "expCompSet",
        "awb-priority": "awbPriority",
        "pre-af": "preAF",
        "e-front-curtain": "eFrontCurtain",
        "live-view-display": "liveView",
      };

      for (const step of slotTask.steps) {
        if (step.role !== "control") continue;

        // Skip steady-shot from controls (only selectable with OSS lenses)
        if (step.settingId === "steady-shot") continue;

        totalControls++;
        let actual: string | null = null;
        let ok = false;

        const fieldName = settingIdToField[step.settingId];
        if (fieldName && fieldName in decoded) {
          actual = (decoded as any)[fieldName] ?? null;
          ok = actual === step.valueId;
        }

        if (ok) correctControls++;
        else retrySlots.push(slot);

        checks.push({
          slot,
          settingId: step.settingId,
          expected: labelOf(mission.model, step.settingId, step.valueId, lang) || step.valueId,
          actual: actual ? (labelOf(mission.model, step.settingId, actual, lang) || actual) : null,
          ok
        });
      }
    }
  } else {
    // Máy chưa giải mã: báo nếu một ô giống hệt ô trước (không chặn). A7C II so từ 0x3C vì header có giờ lưu và checksum
    const bodyStart = mission.model === "a7c2" ? 0x3c : 0x28;
    for (let slot = 2; slot <= 4; slot++) {
      const file1 = filesBySlot[slot - 1];
      const file2 = filesBySlot[slot];
      if (!file1 || !file2) continue;

      if (file1.bytes.length === file2.bytes.length && file1.bytes.length > bodyStart) {
        const body1 = file1.bytes.slice(bodyStart);
        const body2 = file2.bytes.slice(bodyStart);
        let different = false;

        for (let i = 0; i < body1.length; i++) {
          if (body1[i] !== body2[i]) {
            different = true;
            break;
          }
        }

        if (!different) {
          structural.push({
            id: `${mission.model}_slot_${slot}_same_warn`,
            slot,
            ok: true,
            message: {
              vi: `Ô này giống ô trước: giá trị có thể chưa thay đổi`,
              en: `This slot same as previous: value may not have changed`
            }
          });
        }
      }
    }
  }

  // Determine overall ok status
  const blockingFails = structural.filter(s => s.ok === false);
  const accuracy = checks.length > 0 ? checks.filter(c => c.ok).length / checks.length : 1;
  const ok = blockingFails.length === 0 && (mission.model !== "zve10" || accuracy >= 0.75);

  return {
    ok,
    checks,
    structural,
    retrySlots: [...new Set(retrySlots)].sort()
  };
}

export function scoreOf(v: Verification, durationMs: number, retries: number): Score {
  const totalControls = v.checks.length;
  const correctControls = v.checks.filter(c => c.ok).length;

  // Accuracy: 700 points max
  const accuracy = Math.round(700 * (totalControls > 0 ? correctControls / totalControls : 1));

  // Speed: 300 points for ≤3 min, linear to 0 at 20 min
  const speedMs = Math.min(durationMs, 20 * 60 * 1000);
  const thresholdMs = 3 * 60 * 1000;
  const speed = speedMs <= thresholdMs
    ? 300
    : Math.max(0, 300 - ((speedMs - thresholdMs) / (20 * 60 * 1000 - thresholdMs)) * 300);

  // Retries penalty: × max(0, 1 − 0.15 × retries)
  const penalty = Math.max(0, 1 - 0.15 * retries);

  const total = Math.round((accuracy + speed) * penalty);

  return {
    accuracy: Math.round(accuracy * penalty),
    speed: Math.round(speed * penalty),
    total
  };
}
