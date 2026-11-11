/**
 * Read camera firmware version from EXIF Software tag (IFD0 0x0131)
 * in the newest JPG/ARW photo on the card.
 * Sony format: "ZV-E10 v2.01", "ILCE-6400 v2.00", "ILCE-7CM2 v2.01"
 */

/**
 * Find DCIM folder and read firmware from newest photo's EXIF.
 * Returns {model, version} or null if not found or no access to DCIM.
 * Never throws; returns null on error.
 */
export async function readFirmware(
  picked: any
): Promise<{ model: string; version: string } | null> {
  // Only access DCIM if picked is the card root (name doesn't match PRIVATE/SONY/SETTING)
  const name = picked.name.toUpperCase();
  if (["PRIVATE", "SONY", "SETTING"].includes(name)) {
    return null; // No parent access to find DCIM
  }

  // Try to find DCIM folder
  let dcimHandle: any;
  try {
    dcimHandle = await picked.getDirectoryHandle("DCIM", { create: false });
  } catch {
    return null; // DCIM not found
  }

  // Find newest photo by name in DCIM subfolders
  let newestFile: { folder: string; name: string; handle: any } | null = null;

  try {
    for await (const [folderName, folderHandle] of (dcimHandle as any)) {
      if (folderHandle.kind !== "directory") continue;

      try {
        for await (const [fileName, fileHandle] of (folderHandle as any)) {
          const upper = fileName.toUpperCase();
          if (upper.endsWith(".JPG") || upper.endsWith(".ARW")) {
            // newest = highest folder then name: DSC numbering restarts in each new 1xxMSDCF folder
            if (!newestFile || `${folderName}/${fileName}` > `${newestFile.folder}/${newestFile.name}`) {
              newestFile = { folder: folderName, name: fileName, handle: fileHandle };
            }
          }
        }
      } catch {
        // Skip inaccessible folder
      }
    }
  } catch {
    // Can't iterate DCIM
    return null;
  }

  if (!newestFile) return null;

  // Read first 65KB and decode EXIF Software tag
  try {
    const file = await newestFile.handle.getFile();
    const blob = file.slice(0, 65536);
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Decode as latin1 and match pattern
    const latin1 = new TextDecoder("latin1").decode(bytes);
    const match = latin1.match(/(ZV-E10|ILCE-6400|ILCE-7CM2) v(\d+\.\d+)/);

    if (match) {
      return { model: match[1], version: match[2] };
    }
  } catch {
    // Ignore read errors
  }

  return null;
}
