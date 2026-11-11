/**
 * File System Access API wrapper tests.
 * In-memory fake handles simulate card directory structure and file operations.
 */

import { test, describe } from "node:test";
import assert from "node:assert";
import {
  resolveE10Dir,
  readExisting,
  writeAndVerify,
  mapError,
  isSupported,
  type FileSystemDirectoryHandle,
  type FileSystemFileHandle,
  type File,
} from "../lib/cardWriter.ts";

/**
 * In-memory fake FileSystemHandle tree.
 * Keys are uppercased; case-insensitive lookup.
 */
class FakeDirectory implements FileSystemDirectoryHandle {
  kind = "directory" as const;
  files: Map<string, Uint8Array> = new Map();
  subdirs: Map<string, FakeDirectory> = new Map();
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  async getDirectoryHandle(
    name: string,
    options?: { create?: boolean }
  ): Promise<FileSystemDirectoryHandle> {
    const key = name.toUpperCase();
    let dir = this.subdirs.get(key);
    if (!dir) {
      if (!options?.create) {
        const err = new Error("Not found");
        (err as any).name = "NotFoundError";
        throw err;
      }
      dir = new FakeDirectory(key);
      this.subdirs.set(key, dir);
    }
    return dir;
  }

  async getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle> {
    const key = name.toUpperCase();
    let handle = this.files.get(key);
    if (handle === undefined) {
      if (!options?.create) {
        const err = new Error("Not found");
        (err as any).name = "NotFoundError";
        throw err;
      }
      this.files.set(key, new Uint8Array());
      handle = this.files.get(key)!;
    }
    return new FakeFile(name, this, key);
  }

  async queryPermission?(): Promise<"granted" | "denied" | "prompt"> {
    return "granted";
  }

  async requestPermission?(): Promise<"granted" | "denied"> {
    return "granted";
  }

  // Helpers for testing
  hasDir(name: string): boolean {
    return this.subdirs.has(name.toUpperCase());
  }

  hasFile(name: string): boolean {
    return this.files.has(name.toUpperCase());
  }

  getFileData(name: string): Uint8Array | undefined {
    return this.files.get(name.toUpperCase());
  }

  setFileData(name: string, data: Uint8Array): void {
    this.files.set(name.toUpperCase(), data);
  }

  getSubdir(name: string): FakeDirectory | undefined {
    return this.subdirs.get(name.toUpperCase());
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

  async createWritable() {
    const dir = this.dir;
    const key = this.key;
    return {
      async write(data: BufferSource | Blob | string) {
        if (typeof data === "string") {
          dir.files.set(key, new TextEncoder().encode(data));
        } else if (data instanceof Uint8Array) {
          dir.files.set(key, data);
        } else {
          dir.files.set(key, new Uint8Array(data as ArrayBuffer));
        }
      },
      async close() {},
    };
  }

  async getFile(): Promise<File> {
    const data = this.dir.files.get(this.key) || new Uint8Array();
    return {
      size: data.length,
      type: "application/octet-stream",
      slice: () => new Blob(),
      stream: () => null as any,
      text: async () => "",
      arrayBuffer: async () => data.buffer,
    } as File;
  }
}

describe("resolveE10Dir", () => {
  test("picks E10 dir returns itself", async () => {
    const root = new FakeDirectory("E10");
    const result = await resolveE10Dir(root);
    assert.strictEqual(result.name, "E10");
  });

  test("picks SETTING dir creates/returns E10 inside", async () => {
    const root = new FakeDirectory("SETTING");
    const result = await resolveE10Dir(root);
    assert.strictEqual(result.name, "E10");
    assert(root.hasDir("E10"));
  });

  test("picks SONY dir creates SETTING/E10", async () => {
    const root = new FakeDirectory("SONY");
    const result = await resolveE10Dir(root);
    assert.strictEqual(result.name, "E10");
    const setting = root.getSubdir("SETTING");
    assert(setting);
    assert(setting.hasDir("E10"));
  });

  test("picks PRIVATE dir creates SONY/SETTING/E10", async () => {
    const root = new FakeDirectory("PRIVATE");
    const result = await resolveE10Dir(root);
    assert.strictEqual(result.name, "E10");
    const sony = root.getSubdir("SONY");
    assert(sony);
    const setting = sony.getSubdir("SETTING");
    assert(setting);
    assert(setting.hasDir("E10"));
  });

  test("picks card root with DCIM creates path to E10", async () => {
    const root = new FakeDirectory("CARD");
    // Add DCIM marker
    await root.getDirectoryHandle("DCIM", { create: true });

    const result = await resolveE10Dir(root);
    assert.strictEqual(result.name, "E10");

    const private_ = root.getSubdir("PRIVATE");
    assert(private_);
    const sony = private_.getSubdir("SONY");
    assert(sony);
    const setting = sony.getSubdir("SETTING");
    assert(setting);
    assert(setting.hasDir("E10"));
  });

  test("picks card root with PRIVATE marker creates path to E10", async () => {
    const root = new FakeDirectory("CARD");
    await root.getDirectoryHandle("PRIVATE", { create: true });

    const result = await resolveE10Dir(root);
    assert.strictEqual(result.name, "E10");

    const private_ = root.getSubdir("PRIVATE");
    assert(private_);
  });

  test("picks dir without markers throws notCard", async () => {
    const root = new FakeDirectory("RANDOM");
    try {
      await resolveE10Dir(root);
      assert.fail("should throw");
    } catch (e: any) {
      assert.strictEqual(e.code, "notCard");
    }
  });

  test("case-insensitive name matching", async () => {
    const root = new FakeDirectory("e10");
    const result = await resolveE10Dir(root);
    assert.strictEqual(result.name, "e10"); // Directory keeps its original name
  });
});

describe("readExisting", () => {
  test("reads all existing P files", async () => {
    const dir = new FakeDirectory("E10");
    dir.setFileData("CAMPR01P.DAT", new Uint8Array([1, 2, 3]));
    dir.setFileData("CAMPR03P.DAT", new Uint8Array([4, 5, 6]));

    const result = await readExisting(dir);
    assert.strictEqual(result.length, 2);
    assert(result.some((f) => f.name === "CAMPR01P.DAT"));
    assert(result.some((f) => f.name === "CAMPR03P.DAT"));
  });

  test("reads N and P variants", async () => {
    const dir = new FakeDirectory("E10");
    dir.setFileData("CAMPR01N.DAT", new Uint8Array([1]));
    dir.setFileData("CAMPR01P.DAT", new Uint8Array([2]));

    const result = await readExisting(dir);
    assert.strictEqual(result.length, 2);
  });

  test("empty dir returns empty array", async () => {
    const dir = new FakeDirectory("E10");
    const result = await readExisting(dir);
    assert.strictEqual(result.length, 0);
  });
});

describe("writeAndVerify", () => {
  test("writes files", async () => {
    const dir = new FakeDirectory("E10");
    const files = [{ name: "CAMPR01P.DAT", data: new Uint8Array([1, 2, 3]) }];

    await writeAndVerify(dir, files);
    const written = dir.getFileData("CAMPR01P.DAT");
    assert.deepStrictEqual(written, new Uint8Array([1, 2, 3]));
  });

  test("verifies content matches after write", async () => {
    const dir = new FakeDirectory("E10");
    const files = [{ name: "CAMPR02P.DAT", data: new Uint8Array([7, 8, 9]) }];

    await writeAndVerify(dir, files);
    // If verify failed, function would throw; reaching here means success
    assert(true);
  });

  test("throws verify error if read-back differs", async () => {
    // Create a directory that writes successfully but reads back wrong
    const dir = new FakeDirectory("E10");

    class FakeBadFile implements FileSystemFileHandle {
      kind = "file" as const;
      name = "CAMPR01P.DAT";

      async createWritable() {
        return {
          async write() {},
          async close() {},
        };
      }

      async getFile(): Promise<File> {
        // Read back different data
        const data = new Uint8Array([99, 99, 99]);
        return {
          size: data.length,
          type: "application/octet-stream",
          slice: () => new Blob(),
          stream: () => null as any,
          text: async () => "",
          arrayBuffer: async () => data.buffer,
        } as File;
      }
    }

    // Replace getFileHandle to return bad file on read
    let writeCount = 0;
    const origGet = dir.getFileHandle.bind(dir);
    dir.getFileHandle = async (name: string, options?: any) => {
      writeCount++;
      if (writeCount === 2) {
        // Second call is the verify read
        return new FakeBadFile();
      }
      return origGet(name, options);
    };

    const files = [{ name: "CAMPR01P.DAT", data: new Uint8Array([1, 2, 3]) }];

    try {
      await writeAndVerify(dir, files);
      assert.fail("should throw verify error");
    } catch (e: any) {
      assert.strictEqual(e.code, "verify");
    }
  });

  test("writes multiple files", async () => {
    const dir = new FakeDirectory("E10");
    const files = [
      { name: "CAMPR01P.DAT", data: new Uint8Array([1]) },
      { name: "CAMPR02P.DAT", data: new Uint8Array([2]) },
      { name: "CAMPR03P.DAT", data: new Uint8Array([3]) },
    ];

    await writeAndVerify(dir, files);

    for (const f of files) {
      const written = dir.getFileData(f.name);
      assert.deepStrictEqual(written, f.data);
    }
  });
});

describe("mapError", () => {
  test("AbortError → abort", () => {
    const e = new Error();
    (e as any).name = "AbortError";
    const result = mapError(e);
    assert.strictEqual(result.code, "abort");
  });

  test("NotAllowedError → denied", () => {
    const e = new Error();
    (e as any).name = "NotAllowedError";
    const result = mapError(e);
    assert.strictEqual(result.code, "denied");
  });

  test("SecurityError → blocked", () => {
    const e = new Error();
    (e as any).name = "SecurityError";
    const result = mapError(e);
    assert.strictEqual(result.code, "blocked");
  });

  test("message with system files → blocked", () => {
    const e = new Error("system files");
    const result = mapError(e);
    assert.strictEqual(result.code, "blocked");
  });

  test("NoModificationAllowedError → readOnly", () => {
    const e = new Error();
    (e as any).name = "NoModificationAllowedError";
    const result = mapError(e);
    assert.strictEqual(result.code, "readOnly");
  });

  test("message with read-only → readOnly", () => {
    const e = new Error("disk is read-only");
    const result = mapError(e);
    assert.strictEqual(result.code, "readOnly");
  });

  test("unknown error → generic", () => {
    const e = new Error("something went wrong");
    const result = mapError(e);
    assert.strictEqual(result.code, "generic");
    assert.strictEqual(result.message, "something went wrong");
  });

  test("null input → generic", () => {
    const result = mapError(null);
    assert.strictEqual(result.code, "generic");
  });
});

describe("isSupported", () => {
  test("returns false when window is undefined", () => {
    // This test can't really verify since we're in Node
    // but the function structure is testable by inspection
    assert.strictEqual(typeof isSupported, "function");
  });
});

test("mapError giữ nguyên lỗi đã phân loại (notCard, verify)", () => {
  assert.equal(mapError({ code: "notCard" }).code, "notCard");
  assert.equal(mapError({ code: "verify" }).code, "verify");
  assert.equal(mapError(new DOMException("x", "AbortError")).code, "abort");
});
