import type { CardFile } from "./types.ts";

/**
 * Resolve a directory handle to the setting folder (where model subfolders live).
 * Handles multiple input types: SETTING, SONY, PRIVATE, or card root.
 * Checks by folder name to support both ZV-E10 and A6400 structures.
 * Throws {code:"notCard"} if it doesn't look like a card.
 */
export async function settingDir(
  picked: FileSystemDirectoryHandle
): Promise<FileSystemDirectoryHandle> {
  const name = picked.name.toUpperCase();

  // If it's SETTING, use it directly
  if (name === "SETTING") {
    return picked;
  }

  // If it's SONY, navigate to SETTING inside it
  if (name === "SONY") {
    try {
      return await picked.getDirectoryHandle("SETTING", { create: false });
    } catch {
      throw { code: "notCard" };
    }
  }

  // If it's PRIVATE, navigate to SONY/SETTING
  if (name === "PRIVATE") {
    try {
      const sony = await picked.getDirectoryHandle("SONY", { create: false });
      return await sony.getDirectoryHandle("SETTING", { create: false });
    } catch {
      throw { code: "notCard" };
    }
  }

  // Otherwise, treat as card root: check for PRIVATE or DCIM
  let hasCardMarker = false;
  try {
    await picked.getDirectoryHandle("PRIVATE", { create: false });
    hasCardMarker = true;
  } catch {
    // Try DCIM
    try {
      await picked.getDirectoryHandle("DCIM", { create: false });
      hasCardMarker = true;
    } catch {
      // No marker found
    }
  }

  if (!hasCardMarker) {
    // Last resort: check if this folder directly contains CAMPR0*.DAT files
    try {
      for await (const [fileName] of (picked as any)) {
        if (fileName.match(/^CAMPR0[1-4][PN]\.DAT$/i)) {
          // This folder itself is the model folder; return picked
          return picked;
        }
      }
    } catch {
      // Can't iterate; not a card root
    }
    throw { code: "notCard" };
  }

  // Card root found; navigate to PRIVATE/SONY/SETTING
  try {
    const private_ = await picked.getDirectoryHandle("PRIVATE", { create: false });
    const sony = await private_.getDirectoryHandle("SONY", { create: false });
    return await sony.getDirectoryHandle("SETTING", { create: false });
  } catch {
    throw { code: "notCard" };
  }
}

export async function readSettingFiles(
  root: FileSystemDirectoryHandle
): Promise<CardFile[]> {
  const files: CardFile[] = [];

  // Resolve to the setting folder
  let current: FileSystemDirectoryHandle;
  try {
    current = await settingDir(root);
  } catch (e: any) {
    // Not a card; return empty
    return files;
  }

  // Walk the setting directory for CAMPR0[1-4][PN].DAT
  try {
    for await (const entry of (current as any)) {
      const [folderName, handle] = entry;
      if (handle.kind === "directory") {
        try {
          const subdir = await current.getDirectoryHandle(folderName, { create: false });
          for await (const subEntry of (subdir as any)) {
            const [fileName] = subEntry;
            if (fileName.match(/^CAMPR0[1-4][PN]\.DAT$/i)) {
              try {
                const fileHandle = await subdir.getFileHandle(fileName, { create: false });
                const blob = await fileHandle.getFile();
                const bytes = new Uint8Array(await blob.arrayBuffer());
                files.push({ folder: folderName, name: fileName, bytes });
              } catch (e) {
                // Skip
              }
            }
          }
        } catch (e) {
          // Skip inaccessible folders
        }
      }
    }
  } catch (e) {
    // Not iterable or not accessible
  }

  // Fallback: if empty, return any *.DAT <= 64 KB directly in SETTING/*
  if (files.length === 0) {
    try {
      for await (const entry of (current as any)) {
        const [folderName, handle] = entry;
        if (handle.kind === "directory") {
          try {
            const subdir = await current.getDirectoryHandle(folderName, { create: false });
            for await (const subEntry of (subdir as any)) {
              const [fileName] = subEntry;
              if (fileName.endsWith(".DAT")) {
                try {
                  const fileHandle = await subdir.getFileHandle(fileName, { create: false });
                  const blob = await fileHandle.getFile();
                  if (blob.size <= 65536) { // 64 KB
                    const bytes = new Uint8Array(await blob.arrayBuffer());
                    files.push({ folder: folderName, name: fileName, bytes });
                  }
                } catch (e) {
                  // Skip
                }
              }
            }
          } catch (e) {
            // Skip
          }
        }
      }
    } catch (e) {
      // Skip
    }
  }

  return files;
}
