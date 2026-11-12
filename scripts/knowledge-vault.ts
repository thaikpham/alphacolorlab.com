// Vault kiến thức của alphaskill: đường dẫn và băm ghi chú.
// Dùng bởi scripts/import-knowledge.ts và test/knowledge-drift.test.ts. Import không chạy khi file này được nạp.
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

export const NOTES_DIR = '1 Kiến thức'

/** Thư mục alphaskill: ALPHASKILL_DIR, mặc định ../alphaskill cạnh dự án (cùng quy tắc với sync-alphaskill.ts). */
export function alphaskillRoot(projectRoot: string, env: Record<string, string | undefined> = process.env): string {
  return path.resolve(env.ALPHASKILL_DIR ?? path.resolve(projectRoot, '..', 'alphaskill'))
}

/** Thư mục ghi chú mà import đọc. */
export function notesDir(alphaskill: string): string {
  return path.join(alphaskill, 'data', 'knowledge', NOTES_DIR)
}

export type VaultHash = { sha256: string; noteFiles: number }

/** sha256 trên đường dẫn tương đối (posix, NFC, đã sắp xếp) và byte gốc của mọi file .md trong dir. */
export function hashNotes(dir: string): VaultHash {
  const files: Array<{ rel: string; abs: string }> = []
  const walk = (sub: string) => {
    for (const entry of fs.readdirSync(path.join(dir, sub), { withFileTypes: true })) {
      const rel = path.posix.join(sub, entry.name)
      if (entry.isDirectory()) walk(rel)
      else if (entry.isFile() && entry.name.endsWith('.md')) files.push({ rel: rel.normalize('NFC'), abs: path.join(dir, rel) })
    }
  }
  walk('')
  files.sort((a, b) => (a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0))

  const hash = createHash('sha256')
  for (const f of files) hash.update(f.rel).update('\0').update(fs.readFileSync(f.abs)).update('\0')
  return { sha256: hash.digest('hex'), noteFiles: files.length }
}
