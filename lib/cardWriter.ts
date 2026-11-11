/**
 * File System Access API wrapper for writing Memory Recall files to SD card.
 * Maps user-picked directory to E10 path, reads existing files, writes & verifies.
 * Chrome/Edge desktop only; declared minimal types to stay testable in Node.
 */

export type ErrorCode = "notCard" | "blocked" | "denied" | "readOnly" | "verify" | "abort" | "generic";

export interface CardError {
  code: ErrorCode;
  message?: string;
}

export interface FileEntry {
  name: string;
  data: Uint8Array;
}

// Minimal structural types for testing in Node (no actual DOM dependency)
export interface FileSystemHandle {
  name: string;
  kind: "file" | "directory";
}

export interface FileSystemDirectoryHandle extends FileSystemHandle {
  kind: "directory";
  getDirectoryHandle(
    name: string,
    options?: { create?: boolean }
  ): Promise<FileSystemDirectoryHandle>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
  queryPermission?(options?: { mode: "read" | "readwrite" }): Promise<"granted" | "denied" | "prompt">;
  requestPermission?(options?: { mode: "read" | "readwrite" }): Promise<"granted" | "denied">;
}

export interface FileSystemFileHandle extends FileSystemHandle {
  kind: "file";
  createWritable(): Promise<FileSystemWritableFileStream>;
  getFile(): Promise<File>;
}

export interface FileSystemWritableFileStream {
  write(data: BufferSource | Blob | string): Promise<void>;
  close(): Promise<void>;
}

export interface File extends Blob {
  arrayBuffer(): Promise<ArrayBuffer>;
}

/**
 * Resolve user-picked directory to E10 folder.
 * Maps by name (case-insensitive): E10 → self, SETTING → E10, SONY → SETTING/E10,
 * PRIVATE → SONY/SETTING/E10, other → treat as card root if has PRIVATE or DCIM.
 */
export async function resolveE10Dir(
  picked: FileSystemDirectoryHandle
): Promise<FileSystemDirectoryHandle> {
  const name = picked.name.toUpperCase();

  if (name === "E10") {
    return picked;
  }

  if (name === "SETTING") {
    return (await picked.getDirectoryHandle("E10", { create: true })) as FileSystemDirectoryHandle;
  }

  if (name === "SONY") {
    const setting = (await picked.getDirectoryHandle("SETTING", { create: true })) as FileSystemDirectoryHandle;
    return (await setting.getDirectoryHandle("E10", { create: true })) as FileSystemDirectoryHandle;
  }

  if (name === "PRIVATE") {
    const sony = (await picked.getDirectoryHandle("SONY", { create: true })) as FileSystemDirectoryHandle;
    const setting = (await sony.getDirectoryHandle("SETTING", { create: true })) as FileSystemDirectoryHandle;
    return (await setting.getDirectoryHandle("E10", { create: true })) as FileSystemDirectoryHandle;
  }

  // Treat as card root: probe for PRIVATE or DCIM
  let hasCardMarker = false;
  try {
    await (picked as any).getDirectoryHandle("PRIVATE");
    hasCardMarker = true;
  } catch (e: any) {
    if (!((e as any).name === "NotFoundError" || (e as any).name === "TypeMismatchError")) throw e;
  }

  if (!hasCardMarker) {
    try {
      await (picked as any).getDirectoryHandle("DCIM");
      hasCardMarker = true;
    } catch (e: any) {
      if (!((e as any).name === "NotFoundError" || (e as any).name === "TypeMismatchError")) throw e;
    }
  }

  if (!hasCardMarker) {
    throw { code: "notCard" } as CardError;
  }

  // Card root found; navigate to PRIVATE/SONY/SETTING/E10
  const private_ = (await picked.getDirectoryHandle("PRIVATE", { create: true })) as FileSystemDirectoryHandle;
  const sony = (await private_.getDirectoryHandle("SONY", { create: true })) as FileSystemDirectoryHandle;
  const setting = (await sony.getDirectoryHandle("SETTING", { create: true })) as FileSystemDirectoryHandle;
  return (await setting.getDirectoryHandle("E10", { create: true })) as FileSystemDirectoryHandle;
}

/**
 * Read existing CAMPR0{1-4}{N|P}.DAT files from E10 directory.
 * Returns array of files found (may be empty).
 */
export async function readExisting(e10: FileSystemDirectoryHandle): Promise<FileEntry[]> {
  const result: FileEntry[] = [];
  const names = ["CAMPR01N.DAT", "CAMPR01P.DAT", "CAMPR02N.DAT", "CAMPR02P.DAT",
                 "CAMPR03N.DAT", "CAMPR03P.DAT", "CAMPR04N.DAT", "CAMPR04P.DAT"];

  for (const name of names) {
    try {
      const fileHandle = (await (e10 as any).getFileHandle(name)) as FileSystemFileHandle;
      const file = (await fileHandle.getFile()) as File;
      const buffer = await file.arrayBuffer();
      result.push({ name, data: new Uint8Array(buffer) });
    } catch (e: any) {
      if (!((e as any).name === "NotFoundError" || (e as any).name === "TypeMismatchError")) throw e;
    }
  }

  return result;
}

/**
 * Write files to E10 directory and verify by re-reading.
 * Throws CardError on write or verify failure.
 */
export async function writeAndVerify(
  e10: FileSystemDirectoryHandle,
  files: FileEntry[]
): Promise<void> {
  // Write all files first
  for (const file of files) {
    try {
      const fileHandle = (await (e10 as any).getFileHandle(file.name, {
        create: true,
      })) as FileSystemFileHandle;
      const writable = await fileHandle.createWritable();
      await writable.write(file.data.buffer.slice(file.data.byteOffset, file.data.byteOffset + file.data.byteLength) as any);
      await writable.close();
    } catch (e: any) {
      throw mapError(e);
    }
  }

  // Verify all files
  for (const file of files) {
    try {
      const fileHandle = (await (e10 as any).getFileHandle(file.name)) as FileSystemFileHandle;
      const readFile = (await fileHandle.getFile()) as File;
      const buffer = await readFile.arrayBuffer();
      const readData = new Uint8Array(buffer);

      if (readData.length !== file.data.length || !bytesEqual(readData, file.data)) {
        throw { code: "verify" } as CardError;
      }
    } catch (e: any) {
      if ((e as any).code === "verify") throw e;
      throw mapError(e);
    }
  }
}

/**
 * Check if File System Access API is available and in top frame.
 * (not in iframe for security).
 */
export function isSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "showDirectoryPicker" in window && window.self === window.top;
}

/**
 * Map DOMException to ErrorCode.
 */
export function mapError(e: unknown): CardError {
  if (!e) return { code: "generic", message: "Unknown error" };

  const error = e as any;

  // Lỗi đã phân loại sẵn trong file này (notCard, verify…) giữ nguyên mã
  if (typeof error.code === "string" && ["notCard", "blocked", "denied", "readOnly", "verify", "abort", "generic"].includes(error.code)) {
    return error as CardError;
  }

  // User abort
  if (error.name === "AbortError") {
    return { code: "abort" };
  }

  // Permission denied
  if (error.name === "NotAllowedError") {
    return { code: "denied" };
  }

  // System file or blocked path
  if (error.name === "SecurityError" || (error.message && error.message.includes("system files"))) {
    return { code: "blocked" };
  }

  // Read-only detection
  if (
    error.name === "NoModificationAllowedError" ||
    error.name === "InvalidModificationError" ||
    error.name === "ReadOnlyError" ||
    (error.message && error.message.toLowerCase().includes("read-only"))
  ) {
    return { code: "readOnly" };
  }

  // Generic with message
  return { code: "generic", message: error.message || "Unknown error" };
}

/**
 * Compare two Uint8Arrays for equality.
 */
function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
