import type { Article } from '../../types'

export const page: Article = {
  id: 'anh-mo-vi-rung-tay',
  kind: 'article',
  topic: 'exposure',
  level: 'newbie',
  archetype: 'fix',
  read: '5 phút đọc',
  title: 'Ảnh mờ vì rung tay: tốc độ tối thiểu theo tiêu cự',
  dek: 'Tay bạn rung như thế nào, máy cần tốc độ bao nhanh để ảnh nét — và quy tắc vàng của nhiếp ảnh Sony.',
  updatedAt: '2026-11-06',
  blocks: [
    {
      t: 'tldr',
      items: [
        'Tốc độ tối thiểu = 1/(tiêu cự × 1.5). Ống 24mm cần 1/40s; ống 100mm cần 1/150s.',
        'Sony có SteadyShot: mỗi nước giảm rủi ro rung 2 nấc tốc độ (1/40 ≈ 1/10).',
        'Tay rung từ hơi thở, nhịp tim, sợ hãi bấm: cách bấm, kiểm soát hơi thở, tập luyện giảm được nửa.',
      ],
    },
    {
      t: 'p',
      text: 'Rung tay là lý do #1 ảnh nhòe ở người mới. Không phải máy xấu, không phải ống kính—tay mình. Khi cầm máy lâu, bế tbreath, hoặc sợ bấm sai nút, tay bạn sẽ rung, từ vài pixel đến toàn khung nhòe. [[Tốc độ màn trập]] chính là cách phòng chữa đầu tiên.',
    },
    {
      t: 'figure',
      caption: 'Rung tay khiến cảnh nhoè. Ảnh: Suwatch · CC BY 2.0 · Wikimedia Commons',
    },
    { t: 'h', text: 'Quy tắc vàng: 1/(tiêu cự × 1.5)' },
    {
      t: 'p',
      text: 'Tốc độ tối thiểu để ảnh nét cầm tay là: **1 / (tiêu cự × 1.5)**. Ống 24mm ≈ 1/40s; ống 50mm ≈ 1/80s; ống 100mm ≈ 1/150s. Số này là trung bình cho photographer bình thường. Tay chắc thì giảm được; tay rung thì phải tăng tốc độ (bù ISO).',
    },
    {
      t: 'menu',
      old: 'MENU → Camera Settings1 → Shutter Speed (chế độ S)',
      new: 'MENU → Exposure/Color → Exposure → Shutter Speed (chế độ S)',
    },
    {
      t: 'h',
      text: 'Sony SteadyShot: mỗi nước chống rung = 2 nấc tốc độ',
    },
    {
      t: 'p',
      text: 'Ống kính Sony có **SteadyShot** (công tắc trên ống hoặc menu **Steadyshot**). Nó không chống rung 100%, nhưng mỗi bước On/Off giúp bạn chậm hơn ~2 nấc: 1/80 thành 1/20. Quy tắc vàng trên đã tính có SteadyShot. Tắt nó đi, bạn cần tăng tốc độ lên gấp 4.',
    },
    {
      t: 'table',
      head: ['Tiêu cự ống', 'Tốc độ tối thiểu (SteadyShot On)', 'Tốc độ tối thiểu (SteadyShot Off)'],
      caption: 'Cùng một ống, SteadyShot Off bạn cần tốc độ nhanh hơn gấp 4 (2 nấc × 2).',
      rows: [
        ['24mm', '1/40', '1/10'],
        ['50mm', '1/80', '1/20'],
        ['100mm', '1/150', '1/40'],
      ],
    },
    { t: 'h', text: 'Cách bấm và kiểm soát rung' },
    {
      t: 'p',
      text: 'Tay rung đến 50% là từ cách bấm nút chụp. **Bấm từ từ**, không tát. Hít thở sâu, tính đến 3, bấm ngay khi thở ra hoặc giữ nguyên (không nên bế). Nếu dùng **timer 2 giây** (Hẹn giờ), máy tự bấm khi tay bạn đã bỏ ra, toàn bộ rung từ cơ chế lấy gương biến mất.',
    },
    {
      t: 'callout',
      label: 'Nhầm lẫn: rung thẩu hay nhiễu?',
      text: 'Ảnh rung (blurred) có đường viền mơ hồ. Ảnh nhiễu (noisy, grainy) là hạt màu ngẫu nhiên. Không phải một cảnh tối bị nhiễu → tính tốc độ bộ lâu nữa.',
    },
    {
      t: 'checklist',
      label: 'Trước khi cho rằng máy bị rung',
      items: [
        'Bấm từ từ, không tát nút chụp.',
        'Hít thở sâu, giữ đều khi bấm.',
        'Dùng Hẹn giờ 2 giây nếu còn nghi ngờ.',
        'Xem ảnh 100% (Full, không zoom out) để kiểm tra, không nhìn màn hình máy.',
        'Kiểm tra tốc độ đã đủ nhanh theo công thức.',
      ],
    },
  ],
  meta: {
    related: [
      { kind: 'knowledge', id: 'toc-do-man-trap' },
      { kind: 'knowledge', id: 'iso' },
      { kind: 'article', id: 'iso-auto-min-ss' },
    ],
    prerequisites: ['toc-do-man-trap'],
    concepts: [],
    sources: [
      {
        url: 'https://helpguide.sony.net/ilc/2110/v1/en/contents/TP1000640848.html',
        title: 'ILCE-7M4 Help Guide — Shutter Speed',
        checkedAt: '2026-11-05',
      },
      {
        url: 'https://helpguide.sony.net/ilc/2110/v1/en/contents/TP1000640847.html',
        title: 'ILCE-7M4 Help Guide — Exposure Mode',
        checkedAt: '2026-11-05',
      },
    ],
    authorName: null,
    reviewedAt: null,
    section: null,
    order: null,
  },
}
