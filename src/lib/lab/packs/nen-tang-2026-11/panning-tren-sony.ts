import type { Article } from '../../types'

export const page: Article = {
  id: 'panning-tren-sony',
  kind: 'article',
  topic: 'composition',
  level: 'mid',
  archetype: 'technique',
  read: '7 phút đọc',
  title: 'Panning trên Sony: lia máy, chế độ S và AF-C',
  dek: '[[Panning]] là lia máy bám theo chủ thể di chuyển ở tốc độ chậm. Chủ thể nét, nền nhòe thành vệt ngang, tạo cảm giác tốc độ.',

  blocks: [
    {
      t: 'tldr',
      items: [
        'Chế độ S, AF-C, Zone lấy nét, Continuous Hi kiểu chụp liên tục.',
        'Ống kính có công tắc OSS Mode 1/2: chọn Mode 2 (chỉ chống rung dọc).',
        'Lia từ hông (xoay thân), không xoay bằng tay; bám chủ thể trước khi bấm; lia tiếp sau khi chụp xong.',
      ],
    },
    {
      t: 'p',
      text: '[[Panning]] là lia máy bám theo chủ thể đang chạy ở tốc độ màn trập chậm: chủ thể nét, hậu cảnh nhòe thành vệt ngang, tạo cảm giác tốc độ. Đây là bài tập phổ biến nhất ở lớp nâng cao, vì nó kết hợp ba yếu tố: lấy nét AF-C, tốc độ chậm để ghi chuyển động, và kỹ năng thực hành rõ ràng.',
    },
    {
      t: 'figure',
      caption: 'Chủ thể nét, nền nhòe theo chiều chuyển động. Ảnh: Eva Rinaldi · CC BY-SA 2.0 · Wikimedia Commons',
    },
    {
      t: 'h',
      text: 'Cài đặt Sony Alpha cho panning',
    },
    {
      t: 'menu',
      old: 'MENU → Camera Settings2 → Focus Mode → AF-C',
      new: 'MENU → Focus → AF/MF → AF Mode → AF-C',
    },
    {
      t: 'menu',
      old: 'MENU → Camera Settings1 → Focus Area → Zone',
      new: 'MENU → Focus → Focus Area → Zone',
    },
    {
      t: 'callout',
      label: 'Kiểu chụp liên tục',
      text: 'Đảm bảo Kiểu chụp đang là Continuous Hi (chụp nhanh) — nút Fn ở phía trước máy hoặc menu Shoot Mode → Continuous: Hi.',
    },
    {
      t: 'h',
      text: 'Bước thực hành panning',
    },
    {
      t: 'p',
      text: 'Bước 1: Chọn hậu cảnh nhiều chi tiết (hàng cây, biển hiệu, hàng rào) để vệt nhòe rõ. Bước 2: Đứng vuông góc với hướng di chuyển, xoay từ hông (twist waist) chứ không xoay bằng tay — điều này giúp bạn lia mượt hơn. Bước 3: Bám chủ thể vào nguyên một vị trí trong khung *trước khi bấm chụp*. Bước 4: Bấm chụp (chụp liên tục), nhưng **lia tiếp sau khi chụp xong** — đừng dừng đột ngột. Thường cần 3–5 tấm liên tục để có 1 tấm đạt.',
    },
    {
      t: 'table',
      head: ['Tốc độ di chuyển', 'Tốc độ khởi điểm', 'Điều chỉnh nếu cần'],
      rows: [
        ['Người đi bộ', '1/30s', 'Giảm xuống 1/15s nếu muốn vệt mờ rõ hơn'],
        ['Xe đạp', '1/60s', 'Giảm xuống 1/30s nếu muốn vệt mờ rõ hơn'],
        ['Ô tô, xe máy', '1/125s', 'Giảm xuống 1/60s nếu muốn vệt mờ rõ hơn'],
      ],
      caption: 'Tốc độ khởi điểm theo tốc độ di chuyển của chủ thể. Kinh nghiệm sẽ giúp bạn điều chỉnh nhanh hơn.',
    },
    {
      t: 'h',
      text: 'Mẹo thực hành panning hiệu quả',
    },
    {
      t: 'p',
      text: 'Bắt đầu với tốc độ 1/125s và giảm dần để hậu cảnh nhòe nhiều hơn. Tỷ lệ đạt chỉ khoảng 1–2/10 tấm là bình thường, vì vậy chụp nhiều là chìa khóa. Nếu ống kính của bạn có công tắc Mode 1/2 (OSS Mode 1/2), hãy chọn Mode 2 để chỉ chống rung theo chiều dọc, không cản cú lia ngang của bạn.',
    },
    {
      t: 'checklist',
      label: 'Khi chấm bài panning',
      items: [
        'Phần chính của chủ thể (mặt người, đầu xe) rõ nét',
        'Hậu cảnh thành vệt ngang mượt (không bị cắt cụt hoặc rối)',
        'Vệt cùng hướng di chuyển của chủ thể',
        'Viền chủ thể không mờ nhòe đồng đều khắp',
      ],
    },
  ],

  meta: {
    sources: [
      {
        url: 'https://helpguide.sony.net/ilc/2110/v1/en/contents/TP1000649113.html',
        title: 'Focus Mode (ILCE-7M4)',
        publisher: 'Sony Help Guide',
        checkedAt: '2026-11-05',
        scope: 'ILCE-7M4',
      },
      {
        url: 'https://helpguide.sony.net/ilc/2110/v1/en/contents/TP1000616742.html',
        title: 'SteadyShot (ILCE-7M4)',
        publisher: 'Sony Help Guide',
        checkedAt: '2026-11-05',
        scope: 'ILCE-7M4',
      },
    ],
    related: [
      { kind: 'knowledge', id: 'panning' },
      { kind: 'knowledge', id: 'toc-do-man-trap' },
      { kind: 'knowledge', id: 'lay-net' },
      { kind: 'knowledge', id: '8-bai-thuc-hanh' },
    ],
    prerequisites: [],
    concepts: [],
    authorName: null,
    reviewedAt: null,
    section: null,
    order: null,
  },
}
