/**
 * Minimal STORE-only ZIP writer. No compression, CRC32 only.
 * ~60 lines, suitable for browser and Node (no external deps).
 */

export interface ZipEntry {
  path: string;
  data: Uint8Array;
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = crc ^ data[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function makeZip(entries: ZipEntry[]): Uint8Array {
  const parts: Uint8Array[] = [];
  const centralDir: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const filename = entry.path;
    const data = entry.data;
    const crc = crc32(data);

    // Local file header
    const localHeader = new Uint8Array(30 + filename.length);
    const dv = new DataView(localHeader.buffer);
    dv.setUint32(0, 0x04034b50, true); // PK\03\04
    dv.setUint16(4, 20, true); // version needed
    dv.setUint16(6, 0, true); // flags
    dv.setUint16(8, 0, true); // compression method (0 = store)
    dv.setUint16(10, 0, true); // file mod time
    dv.setUint16(12, 0, true); // file mod date
    dv.setUint32(14, crc, true);
    dv.setUint32(18, data.length, true); // compressed size
    dv.setUint32(22, data.length, true); // uncompressed size
    dv.setUint16(26, filename.length, true);
    dv.setUint16(28, 0, true); // extra field length
    localHeader.set(new TextEncoder().encode(filename), 30);

    parts.push(localHeader);
    parts.push(data);

    // Central directory header
    const centralHeader = new Uint8Array(46 + filename.length);
    const cdv = new DataView(centralHeader.buffer);
    cdv.setUint32(0, 0x02014b50, true); // PK\01\02
    cdv.setUint16(4, 20, true); // version made by
    cdv.setUint16(6, 20, true); // version needed
    cdv.setUint16(8, 0, true); // flags
    cdv.setUint16(10, 0, true); // compression method
    cdv.setUint16(12, 0, true); // file mod time
    cdv.setUint16(14, 0, true); // file mod date
    cdv.setUint32(16, crc, true);
    cdv.setUint32(20, data.length, true); // compressed size
    cdv.setUint32(24, data.length, true); // uncompressed size
    cdv.setUint16(28, filename.length, true);
    cdv.setUint16(30, 0, true); // extra field length
    cdv.setUint16(32, 0, true); // file comment length
    cdv.setUint16(34, 0, true); // disk number start
    cdv.setUint16(36, 0, true); // internal attributes
    cdv.setUint32(38, 0, true); // external attributes
    cdv.setUint32(42, offset, true); // relative offset of local header
    centralHeader.set(new TextEncoder().encode(filename), 46);

    centralDir.push(centralHeader);
    offset += localHeader.length + data.length;
  }

  // End of central directory record
  const centralSize = centralDir.reduce((s, h) => s + h.length, 0);
  const eocdHeader = new Uint8Array(22);
  const eodv = new DataView(eocdHeader.buffer);
  eodv.setUint32(0, 0x06054b50, true); // PK\05\06
  eodv.setUint16(4, 0, true); // disk number
  eodv.setUint16(6, 0, true); // disk with central directory
  eodv.setUint16(8, entries.length, true); // entries on this disk
  eodv.setUint16(10, entries.length, true); // total entries
  eodv.setUint32(12, centralSize, true); // central directory size
  eodv.setUint32(16, offset, true); // central directory offset
  eodv.setUint16(20, 0, true); // comment length

  // Combine all parts
  const allParts: Uint8Array[] = [...parts, ...centralDir, eocdHeader];
  const totalSize = allParts.reduce((s, p) => s + p.length, 0);
  const result = new Uint8Array(totalSize);

  let pos = 0;
  for (const part of allParts) {
    result.set(part, pos);
    pos += part.length;
  }

  return result;
}
