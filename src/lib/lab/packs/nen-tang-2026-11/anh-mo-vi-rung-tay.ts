import type { Article } from '../../types'

export const page: Article = {
  id: 'anh-mo-vi-rung-tay',
  kind: 'article',
  topic: 'exposure',
  level: 'newbie',
  archetype: 'fix',
  read: '5 phút đọc',
  title: 'Ảnh mờ vì rung tay: tốc độ tối thiểu theo tiêu cự',
  dek: 'Tay bạn rung như thế nào, máy cần tốc độ bao nhanh để ảnh nét — và quy tắc tốc độ tối thiểu theo tiêu cự.',
  updatedAt: '2026-11-06',
  blocks: [
    {
      t: 'tldr',
      items: [
        'Tốc độ tối thiểu = 1/(tiêu cự × 1.5). Ống 24mm cần 1/40s; ống 100mm cần 1/150s.',
        'SteadyShot giúp cầm tay chậm hơn một chút, không thay được tốc độ đủ nhanh.',
        'Tay rung từ hơi thở, nhịp tim, sợ hãi bấm: cách bấm, kiểm soát hơi thở, tập luyện giảm được nửa.',
      ],
    },
    {
      t: 'p',
      text: 'Rung tay là lý do #1 ảnh nhòe ở người mới. Không phải máy xấu, không phải ống kính—tay mình. Khi cầm máy lâu, nín thở, hoặc sợ bấm sai nút, tay bạn sẽ rung, từ vài pixel đến toàn khung nhòe. [[Tốc độ màn trập]] chính là cách phòng chữa đầu tiên. [[ISO]] là cách thứ hai khi bạn không thể làm chậm tốc độ hơn được. Bạn cũng nên xem [[Cài đặt nhanh trước buổi chụp]] để tối ưu máy từ lúc cầm lấy.',
    },
    {
      t: 'figure',
      caption: 'Rung tay khiến cảnh nhoè. Ảnh: Suwatch · CC BY 2.0 · Wikimedia Commons',
    },
    { t: 'h', text: 'Quy tắc vàng: 1/(tiêu cự × 1.5)' },
    {
      t: 'p',
      text: 'Tốc độ tối thiểu để ảnh nét cầm tay là: **1 / (tiêu cự × 1.5)**. Ống 24mm ≈ 1/40s; ống 50mm ≈ 1/80s; ống 100mm ≈ 1/150s. Số này là trung bình cho photographer bình thường. Ở chế độ A với ISO AUTO, để ISO AUTO Min. SS ở Standard là máy tự đặt sàn tốc độ theo tiêu cự ống kính; tay bạn rung thì chọn Fast hoặc Faster.',
    },
    {
      t: 'menu',
      old: 'MENU → Camera Settings1 → ISO Setting → ISO AUTO Min. SS → Standard',
      new: 'MENU → Exposure/Color → Exposure → ISO AUTO Min. SS → Standard',
    },
    {
      t: 'h',
      text: 'SteadyShot: bật khi cầm tay, tắt khi lên chân máy',
    },
    {
      t: 'p',
      text: 'Ống kính OSS và thân máy có chống rung đều gọi là **SteadyShot**. Nó cho bạn đi chậm hơn công thức một chút, nhưng không thay được tốc độ đủ nhanh. Sony ghi rằng khi biểu tượng SteadyShot nhấp nháy trong tối thì hãy mở khẩu hoặc nâng ISO để tốc nhanh hơn. Ống có công tắc SteadyShot thì chỉ công tắc đó có tác dụng, menu không đổi được. Lên chân máy thì tắt.',
    },
    {
      t: 'table',
      head: ['Tiêu cự ống', 'Tốc độ tối thiểu (SteadyShot On)', 'Tốc độ tối thiểu (SteadyShot Off)'],
      caption: 'Cùng một ống: SteadyShot On cầm tay được chậm hơn một chút; Off thì bám đúng công thức.',
      rows: [
        ['24mm', '1/40', '1/10'],
        ['50mm', '1/80', '1/20'],
        ['100mm', '1/150', '1/40'],
      ],
    },
    { t: 'h', text: 'Cách bấm và kiểm soát rung' },
    {
      t: 'p',
      text: 'Phần lớn rung đến từ cách bấm nút chụp. **Bấm từ từ**, không tát. Hít thở sâu, tính đến 3, bấm ngay khi thở ra (không nín thở quá lâu). Nếu dùng **timer 2 giây** (Hẹn giờ), máy tự bấm khi tay bạn đã bỏ ra, rung do ngón tay bấm biến mất.',
    },
    {
      t: 'callout',
      label: 'Nhầm lẫn: rung tay hay nhiễu?',
      text: 'Ảnh rung (blurred) có đường viền mơ hồ. Ảnh nhiễu (noisy, grainy) là hạt màu ngẫu nhiên. Ảnh nhiễu thì không cần tăng tốc độ; ảnh rung thì cần.',
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
      { kind: 'knowledge', id: 'cai-dat-nhanh-truoc-buoi-chup' },
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
