#!/usr/bin/env node
/**
 * Auto-discover all vault knowledge notes and assign home/group.
 * Builds knowledge.json from scratch; unknown slugs fail import.
 */

import fs from 'fs'
import path from 'path'
// First-mention [[links]] added on 2026-11-10; applied after KNOWLEDGE_EDITS, same exact-replacement format
import LINK_EDITS from './knowledge-link-edits.json' with { type: 'json' }

const PROJECT_ROOT = path.resolve(import.meta.dirname, '..')
// alphaskill nằm cạnh dự án này trong thư mục mẹ AlphaColorLab.com
const VAULT_ROOT = path.resolve(PROJECT_ROOT, '..', 'alphaskill', 'data', 'knowledge')

// Do not import these notes
const EXCLUDE_NOTES = new Set(['creative-look', 'khac-biet-zv-e10-a6400-va-a7c-ii']) // user removed the comparison note 2026-11-08

type KnowledgeEntry = {
  slug: string
  title: string
  section: string
  aliases: string[]
  summary: string
  links: string[]
  level?: string
  body?: string
  home: Home
  group?: string
  mergedInto?: string
}

type Home = 'knowledge' | 'blog' | 'product'

// Map slug → (home, group). Unknown slugs fail the import.
const SLUG_HOME_GROUP: Record<string, { home: Home; group: string; mergedInto?: string }> = {
  // Menu terms (knowledge/menu-terms)
  'bu-sang': { home: 'knowledge', group: 'menu-terms' },
  'che-do-chup-p-a-s-m': { home: 'knowledge', group: 'menu-terms' },
  'iso': { home: 'knowledge', group: 'menu-terms' },
  'khau-do': { home: 'knowledge', group: 'menu-terms' },
  'toc-do-man-trap': { home: 'knowledge', group: 'menu-terms' },
  'do-sang': { home: 'knowledge', group: 'menu-terms' },
  'can-bang-trang-va-nhiet-do-mau': { home: 'knowledge', group: 'menu-terms' },
  'raw-jpeg-va-heif': { home: 'knowledge', group: 'menu-terms' },
  'lay-net': { home: 'knowledge', group: 'menu-terms' },
  'dong-bo-man-sau': { home: 'knowledge', group: 'menu-terms' },
  'picture-profile': { home: 'knowledge', group: 'menu-terms' },
  'bo-nho-cai-dat-va-memory-recall': { home: 'knowledge', group: 'menu-terms' },
  // Concepts (knowledge/concepts)
  'stop-va-ev': { home: 'knowledge', group: 'concepts' },
  'tam-giac-phoi-sang': { home: 'knowledge', group: 'concepts' },
  // Product spec terms (knowledge/specs), linked from spec labels on /wiki/san-pham
  'bo-xu-ly-hinh-anh': { home: 'knowledge', group: 'specs' },
  'cam-bien-hinh-anh': { home: 'knowledge', group: 'specs' },
  'do-phan-giai-anh-tinh': { home: 'knowledge', group: 'specs' },
  'do-phan-giai-va-toc-do-khung-hinh-video': { home: 'knowledge', group: 'specs' },
  'pin-may-anh-sony': { home: 'knowledge', group: 'specs' },
  'chong-rung-ibis': { home: 'knowledge', group: 'specs' },
  'chong-rung-dien-tu': { home: 'knowledge', group: 'specs' },
  'oss': { home: 'knowledge', group: 'specs' },
  'tieu-cu': { home: 'knowledge', group: 'specs' },
  'ong-kinh-zoom-va-ong-kinh-fix': { home: 'knowledge', group: 'specs' },
  'power-zoom': { home: 'knowledge', group: 'specs' },
  'dong-ong-kinh-g-va-g-master': { home: 'knowledge', group: 'specs' },
  'kich-thuoc-filter': { home: 'knowledge', group: 'specs' },
  'do-sau-truong-anh-va-xoa-phong': { home: 'knowledge', group: 'concepts' },
  'he-menu-legacy-va-new-gen': { home: 'knowledge', group: 'concepts' },
  // Blog: merged into articles
  'silhouette': { home: 'blog', group: 'merged', mergedInto: 'chup-silhouette-tren-sony' },
  'panning': { home: 'blog', group: 'merged', mergedInto: 'panning-tren-sony' },
  'phoi-sang-dai': { home: 'blog', group: 'merged', mergedInto: 'phoi-sang-dai-tren-sony' },
  'khung-trong-khung': { home: 'blog', group: 'merged', mergedInto: 'khung-trong-khung-tien-canh' },
  'san-mau-phoi-mau-va-lop-canh': { home: 'blog', group: 'merged', mergedInto: 'san-mau-va-lop-canh-30-phut' },
  'goc-may-va-khung-hinh': { home: 'blog', group: 'merged', mergedInto: 'mot-chu-the-ba-goc-may' },
  'bo-cuc': { home: 'blog', group: 'merged', mergedInto: 'bat-luoi-1-3-va-bon-bo-cuc' },
  'dat-ten-va-loc-anh': { home: 'blog', group: 'merged', mergedInto: 'loc-anh-sau-buoi-chup' },
  // Blog: rewritten as full articles with the same slug (2026-11-10)
  'chong-anh': { home: 'blog', group: 'merged', mergedInto: 'chong-anh' },
  'chu-the-chinh': { home: 'blog', group: 'merged', mergedInto: 'chu-the-chinh' },
  // Product comparison
}

// Creative Look + trainer edits
const KNOWLEDGE_EDITS: Record<string, Array<{ find: string; replace: string; count?: number }>> = {
  // 2026-11-10 (owner): SteadyShot is Sony's umbrella name. IBIS bodies coordinate IBIS + OSS; bodies without IBIS keep the sensor still (stills = lens OSS, movie Active = digital crop)
  'chong-rung-ibis': [
    {
      find: '- Menu gọi tính năng này là SteadyShot. Chụp ảnh có Bật và Tắt.',
      replace:
        '- SteadyShot là tên Sony dùng chung cho chống rung. Trên máy có IBIS, SteadyShot là IBIS và [[OSS]] phối hợp: gắn ống OSS, thân và ống trao đổi thông tin rung rồi chia việc cho nhau để đạt hiệu quả cao nhất. Máy đời mới như [[A7R V]] gọi đây là chống rung phối hợp thân và ống kính.\n- Trên máy không có IBIS, cảm biến đứng yên: SteadyShot khi chụp ảnh chỉ bật tắt OSS của ống kính, còn mức Chủ động (Active) khi quay là [[Chống rung điện tử]], cắt khung kỹ thuật số để giữ hình ổn định.\n- Chụp ảnh có Bật và Tắt.',
    },
  ],
  'chong-rung-dien-tu': [
    {
      find: '\n\n## Khi nào bật',
      replace:
        '\n- [[A6400]] không có mức Chủ động: SteadyShot chỉ bật tắt OSS, và chỉ dùng được khi tên ống kính có chữ OSS. Trên ZV-E10, mức Tiêu chuẩn cũng chỉ chọn được khi gắn ống OSS.\n\n## Khi nào bật',
    },
  ],
  oss: [
    {
      find: '\n\n## Công tắc chế độ OSS',
      replace:
        '\n- Trên máy không có IBIS, mục SteadyShot trong menu chính là công tắc của OSS khi chụp ảnh. Trên máy có IBIS, SteadyShot gồm cả OSS và IBIS phối hợp, chia việc cho nhau.\n\n## Công tắc chế độ OSS',
    },
  ],
  // 2026-11-10 (owner): on Sony, Fill-flash = front sync; with TTL, Flash EV drives the eye-focused face, Body EV the ambient/background
  'dong-bo-man-sau': [
    { find: ' · [[8 bài thực hành]]', replace: '' },
    {
      find: '\n\n## Cài đặt Sony Alpha',
      replace:
        '\n- Trên Sony, chế độ flash Fill-flash là đồng bộ màn trước; Đồng bộ sau (Rear Sync.) cho flash nổ ngay trước khi phơi sáng kết thúc. Với tốc nhanh, hai kiểu cho ảnh gần như giống nhau; khác biệt chỉ lộ ra khi tốc chậm và chủ thể chuyển động.\n\n## Cài đặt Sony Alpha',
    },
    {
      find: '\n\n## Tiêu chí đạt',
      replace:
        '\n\n## Flash TTL: Body EV và Flash EV\n- Ảnh flash có hai nguồn sáng. Bù sáng của thân máy (Body EV) chủ yếu điều khiển ánh sáng môi trường, cụ thể là độ sáng hậu cảnh. Bù flash (Flash EV) chủ yếu điều khiển phần flash chiếu tới, tức độ sáng khuôn mặt người mẫu khi máy lấy nét vào mắt.\n- Đặt **Cài đặt bù sáng → Chỉ môi trường** để hai thanh trượt độc lập: làm tối nền mà mặt không tối theo.\n- Công thức theo cảnh: [[body-ev-vs-flash-ev-sony-flash-ttl|Body EV và Flash EV]]. Vệt chuyển động phía sau chủ thể: [[dong-bo-man-sau-voi-flash|đồng bộ màn sau với flash]].\n\n## Tiêu chí đạt',
    },
  ],
  silhouette: [
    {
      find: '- Creative Look **VV** cho trời rực màu hơn. Cân bằng trắng **Trời nhiều mây / Bóng râm** để trời ngả vàng cam.',
      replace: '- Cân bằng trắng **Trời nhiều mây / Bóng râm** để trời ngả vàng cam.',
    },
    { find: ' · [[8 bài thực hành]]', replace: '' },
  ],
  'san-mau-phoi-mau-va-lop-canh': [
    {
      find: '[[Cân bằng trắng và nhiệt độ màu]] và [[Creative Look]] để đẩy tông ngay khi chụp.',
      replace: '[[Cân bằng trắng và nhiệt độ màu]] và Picture Profile để đẩy tông ngay khi chụp.',
    },
    { find: ' · [[8 bài thực hành]]', replace: '' },
  ],
  'can-bang-trang-va-nhiet-do-mau': [
    {
      find: '[[Creative Look]] · [[RAW, JPEG và HEIF]]',
      replace: '[[RAW, JPEG và HEIF]]',
    },
  ],
  'raw-jpeg-va-heif': [
    { find: 'Máy xử lý theo Creative Look', replace: 'Máy xử lý theo cài đặt màu', count: 2 },
    {
      find: 'Chọn đúng Creative Look và cân bằng trắng',
      replace: 'Chọn đúng Picture Profile và cân bằng trắng',
    },
    {
      find: '[[Creative Look]] · [[Cân bằng trắng và nhiệt độ màu]]',
      replace: '[[Cân bằng trắng và nhiệt độ màu]]',
    },
  ],
  'bo-cuc': [{ find: ' · [[8 bài thực hành]]', replace: '' }],
  'chu-the-chinh': [{ find: ' · [[Khóa Photo Basic 3 giờ]]', replace: '' }],
  'chong-anh': [{ find: ' · [[8 bài thực hành]]', replace: '' }],
  'khung-trong-khung': [{ find: ' · [[8 bài thực hành]]', replace: '' }],
  'panning': [
    { find: ' · [[8 bài thực hành]]', replace: '' },
    { find: '## Tiêu chí đạt (khi chấm bài)', replace: '## Tiêu chí đạt' },
  ],
  'phoi-sang-dai': [{ find: ' · [[8 bài thực hành]]', replace: '' }],
  'lay-net': [{ find: ' · [[Cài đặt nhanh trước buổi chụp]] · [[Tốc độ màn trập]]', replace: ' · [[Tốc độ màn trập]]' }],
  'toc-do-man-trap': [{ find: '. Xem [[Cài đặt nhanh trước buổi chụp]].', replace: '.' }],
  'do-sang': [{ find: ' · [[Cài đặt nhanh trước buổi chụp]]', replace: '' }],
  'che-do-chup-p-a-s-m': [{ find: ' · [[Cài đặt nhanh trước buổi chụp]]', replace: '' }],
  'iso': [
    { find: ' Xem [[Cài đặt nhanh trước buổi chụp]].', replace: '' },
    { find: ' → [[Khác biệt ZV-E10, A6400 và A7C II]].', replace: '.' },
  ],
  'dat-ten-va-loc-anh': [{ find: ' · [[Khóa Photo Basic 3 giờ]]', replace: '' }],
  'bo-nho-cai-dat-va-memory-recall': [{ find: ' · [[Cài đặt nhanh trước buổi chụp]]', replace: '' }],
  'he-menu-legacy-va-new-gen': [
    { find: ' · [[Cài đặt nhanh trước buổi chụp]]', replace: '' },
    { find: '[[Khác biệt ZV-E10, A6400 và A7C II]] · ', replace: '' },
  ],
  'picture-profile': [{ find: ' · [[Khác biệt ZV-E10, A6400 và A7C II]]', replace: '' }],
}

const TRAINER_SECTIONS = ['Giảng thế nào', 'Mẹo khi dạy']

function parseFrontmatter(content: string): { fm: Record<string, any>; bodyStart: number } {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return { fm: {}, bodyStart: 0 }
  const fm: Record<string, any> = {}
  const lines = match[1].split('\n')
  for (const line of lines) {
    if (!line.trim()) continue
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    let value = line.slice(colonIdx + 1).trim()
    if (value.startsWith('[') && value.endsWith(']')) {
      const arrayValue = value.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter((s) => s)
      fm[key] = arrayValue
    } else if (value.startsWith('"') && value.endsWith('"')) {
      fm[key] = value.slice(1, -1)
    } else {
      fm[key] = value
    }
  }
  const bodyStart = content.indexOf('\n---\n') + 5
  return { fm, bodyStart }
}

function extractBody(content: string): string {
  const idx = content.indexOf('\n---\n')
  if (idx === -1) return ''
  const bodyStart = idx + 5
  const afterMarker = content.slice(bodyStart)
  const nextNewline = afterMarker.indexOf('\n')
  return afterMarker.slice(nextNewline + 1).trim()
}

function applyEdits(body: string, slug: string): string {
  const edits = [...(KNOWLEDGE_EDITS[slug] ?? []), ...((LINK_EDITS as typeof KNOWLEDGE_EDITS)[slug] ?? [])]
  if (!edits.length) return body
  let edited = body
  for (const edit of edits) {
    const count = edit.count ?? 1
    for (let i = 0; i < count; i++) {
      const idx = edited.indexOf(edit.find)
      if (idx === -1) {
        console.error(`❌ Edit #${i + 1} not found in ${slug}: "${edit.find}"`)
        process.exit(1)
      }
      edited = edited.replace(edit.find, edit.replace)
    }
  }
  return edited
}

function stripTrainerSections(body: string): string {
  return body.split(/\n(?=## )/).filter((part) => !TRAINER_SECTIONS.some((h) => part.startsWith(`## ${h}\n`))).join('\n')
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[àáảãạăằắẳẵặâầấẩẫậ]/g, 'a')
    .replace(/[èéẻẽẹêềếểễệ]/g, 'e')
    .replace(/[ìíỉĩị]/g, 'i')
    .replace(/[òóỏõọôồốổỗộơờớởỡợ]/g, 'o')
    .replace(/[ùúủũụưừứửữự]/g, 'u')
    .replace(/[ỳýỷỹỵ]/g, 'y')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function removeCreativeLookFromMenu(fm: Record<string, any>): Record<string, any> {
  if (!fm.menu || !Array.isArray(fm.menu)) return fm
  const filtered = fm.menu.filter((item: string) => !item.toLowerCase().includes('creative look'))
  return { ...fm, menu: filtered }
}

async function main() {
  // Discover all vault notes
  const knowledgeDir = path.join(VAULT_ROOT, '1 Kiến thức')
  const entries: KnowledgeEntry[] = []
  const processedSlugs = new Set<string>()

  for (const section of fs.readdirSync(knowledgeDir)) {
    const sectionPath = path.join(knowledgeDir, section)
    if (!fs.statSync(sectionPath).isDirectory()) continue

    for (const file of fs.readdirSync(sectionPath)) {
      if (!file.endsWith('.md')) continue
      const filePath = path.join(sectionPath, file)
      const content = fs.readFileSync(filePath, 'utf-8')
      const { fm } = parseFrontmatter(content)

      if (!fm.title) {
        console.warn(`⚠ No title in ${filePath}`)
        continue
      }

      // Slugify
      const slug = fm.slug || slugify(fm.title || file.replace('.md', ''))

      if (EXCLUDE_NOTES.has(slug)) {
        console.log(`⊘ Skipping excluded: ${slug}`)
        continue
      }

      // Check if slug is in the map
      if (!SLUG_HOME_GROUP[slug]) {
        console.error(`❌ Unknown slug "${slug}" from ${filePath}. Add to SLUG_HOME_GROUP.`)
        process.exit(1)
      }

      if (processedSlugs.has(slug)) {
        console.error(`❌ Duplicate slug: ${slug}`)
        process.exit(1)
      }
      processedSlugs.add(slug)

      const { home, group } = SLUG_HOME_GROUP[slug]
      let body = extractBody(content)
      body = applyEdits(body, slug)
      body = stripTrainerSections(body)

      const cleanedFm = removeCreativeLookFromMenu(fm)

      // "F-stop" thuộc Khẩu độ; bỏ khỏi Stop và EV để không trùng khóa wikilink
      if (slug === 'stop-va-ev' && Array.isArray(cleanedFm.aliases)) {
        cleanedFm.aliases = cleanedFm.aliases.filter((a: string) => a.toLowerCase() !== 'f-stop')
      }

      const { mergedInto } = SLUG_HOME_GROUP[slug]
      const entry: KnowledgeEntry = {
        slug,
        title: cleanedFm.title,
        section: cleanedFm.section || section,
        aliases: cleanedFm.aliases || [],
        // dòng tóm tắt in đậm đầu ghi chú, bỏ cú pháp [[liên kết]] vì summary hiện dạng chữ thường
        summary: (body.match(/^\*\*(.+)\*\*$/m)?.[1] ?? '').replace(/\[\[(?:[^\]|]+\|)?([^\]]+)\]\]/g, '$1'),
        links: [],
        level: cleanedFm.level || 'cơ bản',
        body,
        home,
        group,
        ...(mergedInto && { mergedInto }),
      }

      entries.push(entry)
      console.log(`✓ Imported ${slug}`)
    }
  }

  // Verify all mapped slugs were found
  for (const slug of Object.keys(SLUG_HOME_GROUP)) {
    if (!processedSlugs.has(slug)) {
      console.error(`❌ Mapped slug not found in vault: ${slug}`)
      process.exit(1)
    }
  }

  // links = tiêu đề các ghi chú được nhắc bằng [[…]] trong thân bài (đồ thị và backlink dùng)
  const fold = (t: string) => t.normalize('NFD').replace(/\p{M}/gu, '').replace(/[đĐ]/g, 'd').toLowerCase().trim()
  const titleOf = new Map<string, string>()
  for (const e of entries) for (const name of [e.title, ...e.aliases]) titleOf.set(fold(name), e.title)
  for (const e of entries) {
    const targets = [...(e.body ?? '').matchAll(/\[\[([^\]|#]+)/g)].map((m) => titleOf.get(fold(m[1])))
    e.links = [...new Set(targets.filter((t): t is string => !!t && t !== e.title))]
  }

  // Write knowledge.json (rebuild from scratch)
  const outputPath = path.join(PROJECT_ROOT, 'data/knowledge.json')
  fs.writeFileSync(outputPath, JSON.stringify(entries, null, 2))
  console.log(`✓ Wrote ${outputPath} with ${entries.length} entries`)
  console.log('✅ Knowledge import complete!')
}

main().catch((e) => {
  console.error('❌ Fatal error:', e)
  process.exit(1)
})
