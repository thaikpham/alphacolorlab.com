import { test } from "node:test";
import assert from "node:assert/strict";
import { generateMission } from "../lib/game/mission.ts";
import { verify, scoreOf } from "../lib/game/verify.ts";
import { getCatalog, labelOf, settingOf } from "../lib/game/catalog.ts";
import { settingDir, readSettingFiles } from "../lib/game/card.ts";
import type { CardFile, Verification } from "../lib/game/types.ts";
import type { FileSystemDirectoryHandle, FileSystemFileHandle, File } from "../lib/cardWriter.ts";

/**
 * Fake FileSystemDirectory for testing card operations
 */
class FakeDirectory implements FileSystemDirectoryHandle {
  kind = "directory" as const;
  files: Map<string, Uint8Array> = new Map();
  subdirs: Map<string, FakeDirectory> = new Map();
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  async getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FileSystemDirectoryHandle> {
    const key = name.toUpperCase();
    let dir = this.subdirs.get(key);
    if (!dir) {
      if (!options?.create) {
        const err = new Error("Not found");
        (err as any).name = "NotFoundError";
        throw err;
      }
      dir = new FakeDirectory(name);
      this.subdirs.set(key, dir);
    }
    return dir;
  }

  async getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle> {
    const key = name.toUpperCase();
    if (!this.files.has(key)) {
      if (!options?.create) {
        const err = new Error("Not found");
        (err as any).name = "NotFoundError";
        throw err;
      }
      this.files.set(key, new Uint8Array());
    }
    return new FakeFile(name, this, key) as any;
  }

  setFileData(name: string, data: Uint8Array): void {
    this.files.set(name.toUpperCase(), data);
  }

  getSubdir(name: string): FakeDirectory | undefined {
    return this.subdirs.get(name.toUpperCase());
  }

  [Symbol.asyncIterator]() {
    const fileEntries = Array.from(this.files.entries()).map(([key, _]) => [key, new FakeFile(key, this, key)]);
    const dirEntries = Array.from(this.subdirs.entries());
    const entries = [...fileEntries, ...dirEntries];
    let index = 0;
    return {
      next: async () => {
        if (index < entries.length) {
          return { value: entries[index++], done: false };
        }
        return { done: true, value: undefined };
      },
    };
  }
}

class FakeFile implements FileSystemFileHandle {
  kind = "file" as const;
  name: string;
  dir: FakeDirectory;
  key: string;

  constructor(name: string, dir: FakeDirectory, key: string) {
    this.name = name;
    this.dir = dir;
    this.key = key;
  }

  async getFile(): Promise<File> {
    const data = this.dir.files.get(this.key) || new Uint8Array();
    const buffer = new ArrayBuffer(data.length);
    const view = new Uint8Array(buffer);
    view.set(data);
    return {
      arrayBuffer: async () => buffer,
      size: data.length,
      type: "",
      slice: (start?: number, end?: number) => {
        const s = start || 0;
        const e = end || data.length;
        const sliced = data.slice(s, e);
        return new Blob([sliced]) as any;
      },
      stream: () => undefined as any,
      text: async () => "",
    } as any;
  }

  async createWritable(): Promise<any> {
    throw new Error("Not implemented");
  }
}

test("catalog: loads catalog with both models", () => {
  const cat = getCatalog();
  assert.ok(cat.zve10);
  assert.ok(cat.a6400);
  assert.ok(cat.zve10.settings.length > 0);
  assert.ok(cat.a6400.settings.length > 0);
});

test("catalog: labelOf returns correct labels", () => {
  const label = labelOf("zve10", "focusMode", "AF-C", "vi");
  assert.equal(label, "AF liên tục");

  const enLabel = labelOf("zve10", "focusMode", "AF-C", "en");
  assert.equal(enLabel, "Continuous AF");
});

test("catalog: settingOf returns correct setting", () => {
  const setting = settingOf("zve10", "focusMode");
  assert.ok(setting);
  assert.equal(setting?.id, "focusMode");
  assert.equal(setting?.decoded, true);
});

test("mission: generates deterministic missions per seed", () => {
  const seed = 12345;
  const m1 = generateMission("zve10", seed);
  const m2 = generateMission("zve10", seed);
  assert.equal(m1.slots.length, 4);
  assert.equal(m2.slots.length, 4);
  assert.equal(JSON.stringify(m1.slots), JSON.stringify(m2.slots));
});

test("mission: has 4 slots with control and target steps", () => {
  const m = generateMission("zve10", 42);
  assert.equal(m.slots.length, 4);
  for (const slot of m.slots) {
    assert.ok(slot.slot >= 1 && slot.slot <= 4);
    assert.ok(slot.steps.length > 0);

    const targets = slot.steps.filter(s => s.role === "target");
    assert.equal(targets.length, 1);

    const controls = slot.steps.filter(s => s.role === "control");
    assert.ok(controls.length >= 1);
  }
});

test("mission: targets are distinct", () => {
  const m = generateMission("zve10", 99);
  const targets = m.slots
    .flatMap(s => s.steps.filter(st => st.role === "target"))
    .map(s => `${s.settingId}:${s.valueId}`);
  const unique = new Set(targets);
  assert.equal(unique.size, targets.length);
});

test("mission: A6400 missions have baseline controls in slot 1", () => {
  const m = generateMission("a6400", 100);
  const slot1 = m.slots[0];
  const controls = slot1.steps.filter(s => s.role === "control");
  assert.ok(controls.length >= 1);
});

test("verify: requires exactly 4 files", () => {
  const mission = generateMission("zve10", 1);
  const files: CardFile[] = [
    { folder: "M1", name: "CAMPR01P.DAT", bytes: new Uint8Array(100) }
  ];

  const v = verify(mission, files, "en");
  assert.equal(v.ok, false);
  assert.ok(v.retrySlots.length > 0);
});

test("verify: checks file sizes", () => {
  const mission = generateMission("zve10", 2);
  const files: CardFile[] = [
    { folder: "M1", name: "CAMPR01P.DAT", bytes: new Uint8Array(1000) },
    { folder: "M2", name: "CAMPR02P.DAT", bytes: new Uint8Array(1000) },
    { folder: "M3", name: "CAMPR03P.DAT", bytes: new Uint8Array(1000) },
    { folder: "M4", name: "CAMPR04P.DAT", bytes: new Uint8Array(1000) }
  ];

  const v = verify(mission, files, "en");
  assert.equal(v.ok, false);
  assert.ok(v.structural.some(s => s.id.includes("size")));
});

test("score: perfect accuracy and fast speed", () => {
  const v: Verification = {
    ok: true,
    checks: [
      { slot: 1, settingId: "focusMode", expected: "AF-C", actual: "AF-C", ok: true },
      { slot: 1, settingId: "metering", expected: "multi", actual: "multi", ok: true }
    ],
    structural: [],
    retrySlots: []
  };

  const score = scoreOf(v, 2 * 60 * 1000, 0);
  assert.equal(score.total, 1000);
  assert.equal(score.accuracy, 700);
  assert.equal(score.speed, 300);
});

test("score: penalizes retries", () => {
  const v: Verification = {
    ok: true,
    checks: [
      { slot: 1, settingId: "focusMode", expected: "AF-C", actual: "AF-C", ok: true },
      { slot: 1, settingId: "metering", expected: "multi", actual: "multi", ok: true }
    ],
    structural: [],
    retrySlots: []
  };

  const score1 = scoreOf(v, 2 * 60 * 1000, 0);
  const score2 = scoreOf(v, 2 * 60 * 1000, 1);

  assert.ok(score2.total < score1.total);
  assert.ok(score2.accuracy < score1.accuracy);
});

test("score: with slow speed", () => {
  const v: Verification = {
    ok: true,
    checks: [
      { slot: 1, settingId: "focusMode", expected: "AF-C", actual: "AF-C", ok: true }
    ],
    structural: [],
    retrySlots: []
  };

  const score = scoreOf(v, 19 * 60 * 1000, 0);
  assert.ok(score.speed < 100);
  assert.ok(score.total < 750);
});

test("score: with incorrect controls", () => {
  const v: Verification = {
    ok: true,
    checks: [
      { slot: 1, settingId: "focusMode", expected: "AF-C", actual: "AF-S", ok: false },
      { slot: 1, settingId: "metering", expected: "multi", actual: "multi", ok: true }
    ],
    structural: [],
    retrySlots: []
  };

  const score = scoreOf(v, 2 * 60 * 1000, 0);
  assert.ok(score.accuracy < 700);
  assert.ok(score.accuracy > 0);
});

test("mission: ZV-E10 targets are never decoded settings", () => {
  const cat = getCatalog();
  const decodedIds = new Set(cat.zve10.settings.filter(s => s.decoded).map(s => s.id));

  for (let seed = 0; seed < 50; seed++) {
    const m = generateMission("zve10", seed);
    for (const slot of m.slots) {
      const target = slot.steps.find(s => s.role === "target");
      assert.ok(target, "Each slot has a target");
      assert.ok(!decodedIds.has(target.settingId),
        `Slot ${slot.slot} target ${target.settingId} should not be decoded`);
    }
  }
});

test("mission: ZV-E10 controls are distinct per slot", () => {
  for (let seed = 0; seed < 50; seed++) {
    const m = generateMission("zve10", seed);
    for (const slot of m.slots) {
      const controls = slot.steps.filter(s => s.role === "control");
      const controlIds = new Set(controls.map(c => c.settingId));
      assert.equal(controlIds.size, controls.length,
        `Slot ${slot.slot} has duplicate control settings`);
    }
  }
});

test("mission: ZV-E10 dependencies enforced over 200 seeds", () => {
  for (let seed = 0; seed < 200; seed++) {
    const m = generateMission("zve10", seed);
    for (const slot of m.slots) {
      const stepMap = new Map(slot.steps.map(s => [s.settingId, s.valueId]));

      // facePriority requires metering=multi in same slot
      if (stepMap.has("facePriority")) {
        assert.equal(stepMap.get("metering"), "multi",
          `Seed ${seed} slot ${slot.slot}: facePriority requires metering=multi`);
      }

      // tracking-* focusArea requires focusMode=AF-C
      if (stepMap.get("focusArea")?.toString().startsWith("tracking-")) {
        assert.equal(stepMap.get("focusMode"), "AF-C",
          `Seed ${seed} slot ${slot.slot}: tracking-* requires focusMode=AF-C`);
      }

      // focusArea must not be with MF
      if (stepMap.has("focusArea")) {
        assert.ok(stepMap.has("focusMode"), `Seed ${seed} slot ${slot.slot}: focusArea needs focusMode in the same slot`);
        assert.notEqual(stepMap.get("focusMode"), "MF",
          `Seed ${seed} slot ${slot.slot}: focusArea cannot be with focusMode=MF`);
      }
    }
  }
});

test("verify: identical-to-before is blocking", () => {
  // Create before and after files that are identical
  const beforeFile: CardFile = {
    folder: "M1",
    name: "CAMPR01P.DAT",
    bytes: new Uint8Array(100)
  };
  const currentFile: CardFile = {
    folder: "M1",
    name: "CAMPR01P.DAT",
    bytes: new Uint8Array(100)
  };

  const mission = generateMission("a6400", 1);
  const files: CardFile[] = [
    currentFile,
    { folder: "M2", name: "CAMPR02P.DAT", bytes: new Uint8Array(100) },
    { folder: "M3", name: "CAMPR03P.DAT", bytes: new Uint8Array(100) },
    { folder: "M4", name: "CAMPR04P.DAT", bytes: new Uint8Array(100) }
  ];

  const v = verify(mission, files, "en", [beforeFile]);
  assert.ok(v.retrySlots.includes(1), "Slot 1 should be in retrySlots");
  const block = v.structural.find(s => s.id === "slot_1_not_resaved_block");
  assert.ok(block && !block.ok, "Should have blocking not-resaved check");
});

test("verify: A6400 non-ZV-E10 layout passes structural", () => {
  // A6400 files don't need to be 4608 bytes
  const mission = generateMission("a6400", 1);
  const files: CardFile[] = [
    { folder: "a6400_data", name: "CAMPR01N.DAT", bytes: new Uint8Array(2000) },
    { folder: "a6400_data", name: "CAMPR02N.DAT", bytes: new Uint8Array(2000) },
    { folder: "a6400_data", name: "CAMPR03N.DAT", bytes: new Uint8Array(2000) },
    { folder: "a6400_data", name: "CAMPR04N.DAT", bytes: new Uint8Array(2000) }
  ];

  const v = verify(mission, files, "en");
  // Should not have blocking structural failures (only header_mismatch_warn which is non-blocking)
  const blocking = v.structural.filter(s => s.ok === false && !s.id.endsWith("_warn"));
  assert.equal(blocking.length, 0, "A6400 with non-standard layout should pass structural checks");
});

test("card: settingDir resolves SETTING folder directly", async () => {
  const fake = new FakeDirectory("SETTING");
  const result = await settingDir(fake as any);
  assert.equal(result.name, "SETTING");
});

test("card: settingDir resolves SONY folder with SETTING inside", async () => {
  const fake = new FakeDirectory("SONY");
  const setting = new FakeDirectory("SETTING");
  (fake as any).subdirs.set("SETTING", setting);
  const result = await settingDir(fake as any);
  assert.equal(result.name, "SETTING");
});

test("card: settingDir resolves PRIVATE folder with SONY/SETTING inside", async () => {
  const fake = new FakeDirectory("PRIVATE");
  const sony = new FakeDirectory("SONY");
  const setting = new FakeDirectory("SETTING");
  (sony as any).subdirs.set("SETTING", setting);
  (fake as any).subdirs.set("SONY", sony);
  const result = await settingDir(fake as any);
  assert.equal(result.name, "SETTING");
});

test("card: settingDir resolves card root with PRIVATE inside", async () => {
  const root = new FakeDirectory("root");
  const privateDir = new FakeDirectory("PRIVATE");
  const sony = new FakeDirectory("SONY");
  const setting = new FakeDirectory("SETTING");
  (sony as any).subdirs.set("SETTING", setting);
  (privateDir as any).subdirs.set("SONY", sony);
  (root as any).subdirs.set("PRIVATE", privateDir);
  const result = await settingDir(root as any);
  assert.equal(result.name, "SETTING");
});

test("card: settingDir detects direct model folder with CAMPR files", async () => {
  const modelFolder = new FakeDirectory("E10");
  modelFolder.setFileData("CAMPR01P.DAT", new Uint8Array(100));
  const result = await settingDir(modelFolder as any);
  assert.equal(result.name, "E10");
});

test("card: readSettingFiles reads files from resolved setting dir", async () => {
  const setting = new FakeDirectory("SETTING");
  const m1Dir = new FakeDirectory("M1");
  m1Dir.setFileData("CAMPR01P.DAT", new Uint8Array([1, 2, 3]));
  (setting as any).subdirs.set("M1", m1Dir);
  
  const files = await readSettingFiles(setting as any);
  assert.equal(files.length, 1);
  assert.equal(files[0].name, "CAMPR01P.DAT");
  assert.equal(files[0].folder, "M1");
});

test("card: readSettingFiles returns same results from card root and SETTING dir", async () => {
  // Set up SETTING dir with files
  const setting = new FakeDirectory("SETTING");
  const m1Dir = new FakeDirectory("M1");
  m1Dir.setFileData("CAMPR01P.DAT", new Uint8Array([1, 2, 3]));
  (setting as any).subdirs.set("M1", m1Dir);

  // Set up card root pointing to same structure
  const root = new FakeDirectory("root");
  const privateDir = new FakeDirectory("PRIVATE");
  const sony = new FakeDirectory("SONY");
  const settingCopy = new FakeDirectory("SETTING");
  const m1Copy = new FakeDirectory("M1");
  m1Copy.setFileData("CAMPR01P.DAT", new Uint8Array([1, 2, 3]));
  (settingCopy as any).subdirs.set("M1", m1Copy);
  (sony as any).subdirs.set("SETTING", settingCopy);
  (privateDir as any).subdirs.set("SONY", sony);
  (root as any).subdirs.set("PRIVATE", privateDir);

  const filesFromSetting = await readSettingFiles(setting as any);
  const filesFromRoot = await readSettingFiles(root as any);

  assert.equal(filesFromSetting.length, filesFromRoot.length);
  assert.equal(filesFromSetting[0].name, filesFromRoot[0].name);
  assert.equal(filesFromSetting[0].folder, filesFromRoot[0].folder);
});

test("firmware: reads ZV-E10 from photo EXIF", async () => {
  const { readFirmware } = await import("../lib/game/firmware.ts");
  const root = new FakeDirectory("root");
  const dcim = new FakeDirectory("DCIM");
  const folder100 = new FakeDirectory("100MSDCF");
  
  // Create a synthetic photo with ZV-E10 v2.01 in the bytes
  const photoBytes = new Uint8Array(65536);
  const softwareName = "ZV-E10 v2.01";
  const encoder = new TextEncoder();
  const encoded = encoder.encode(softwareName);
  photoBytes.set(encoded, 1000); // Place at offset 1000
  
  folder100.setFileData("DSC00001.JPG", photoBytes);
  (dcim as any).subdirs.set("100MSDCF", folder100);
  (root as any).subdirs.set("DCIM", dcim);

  const result = await readFirmware(root as any);
  assert.ok(result);
  assert.equal(result.model, "ZV-E10");
  assert.equal(result.version, "2.01");
});

test("firmware: reads A6400 from photo EXIF", async () => {
  const { readFirmware } = await import("../lib/game/firmware.ts");
  const root = new FakeDirectory("root");
  const dcim = new FakeDirectory("DCIM");
  const folder100 = new FakeDirectory("100MSDCF");
  
  const photoBytes = new Uint8Array(65536);
  const softwareName = "ILCE-6400 v2.00";
  const encoder = new TextEncoder();
  const encoded = encoder.encode(softwareName);
  photoBytes.set(encoded, 2000);
  
  folder100.setFileData("DSC00001.ARW", photoBytes);
  (dcim as any).subdirs.set("100MSDCF", folder100);
  (root as any).subdirs.set("DCIM", dcim);

  const result = await readFirmware(root as any);
  assert.ok(result);
  assert.equal(result.model, "ILCE-6400");
  assert.equal(result.version, "2.00");
});

test("firmware: picks newest file by name", async () => {
  const { readFirmware } = await import("../lib/game/firmware.ts");
  const root = new FakeDirectory("root");
  const dcim = new FakeDirectory("DCIM");
  const folder100 = new FakeDirectory("100MSDCF");
  
  // Create two photos, newest one has v2.01
  const oldPhotoBytes = new Uint8Array(65536);
  const newPhotoBytes = new Uint8Array(65536);
  
  const encoder = new TextEncoder();
  oldPhotoBytes.set(encoder.encode("ZV-E10 v1.00"), 1000);
  newPhotoBytes.set(encoder.encode("ZV-E10 v2.01"), 1000);
  
  folder100.setFileData("DSC00001.JPG", oldPhotoBytes);
  folder100.setFileData("DSC00002.JPG", newPhotoBytes);
  (dcim as any).subdirs.set("100MSDCF", folder100);
  (root as any).subdirs.set("DCIM", dcim);

  const result = await readFirmware(root as any);
  assert.equal(result?.version, "2.01");
});

test("firmware: returns null when no DCIM", async () => {
  const { readFirmware } = await import("../lib/game/firmware.ts");
  const root = new FakeDirectory("root");

  const result = await readFirmware(root as any);
  assert.equal(result, null);
});

test("firmware: returns null for non-matching photo", async () => {
  const { readFirmware } = await import("../lib/game/firmware.ts");
  const root = new FakeDirectory("root");
  const dcim = new FakeDirectory("DCIM");
  const folder100 = new FakeDirectory("100MSDCF");
  
  const photoBytes = new Uint8Array(65536);
  folder100.setFileData("DSC00001.JPG", photoBytes); // No firmware string
  (dcim as any).subdirs.set("100MSDCF", folder100);
  (root as any).subdirs.set("DCIM", dcim);

  const result = await readFirmware(root as any);
  assert.equal(result, null);
});

test("firmware: returns null for PRIVATE folder (no parent access)", async () => {
  const { readFirmware } = await import("../lib/game/firmware.ts");
  const privateFolder = new FakeDirectory("PRIVATE");

  const result = await readFirmware(privateFolder as any);
  assert.equal(result, null);
});
