import type { Article } from '../../types'

export const page: Article = {
  id: 'dong-bo-man-sau-voi-flash',
  kind: 'article',
  topic: 'gear',
  level: 'pro',
  archetype: 'technique',
  read: '6 phút đọc',
  title: 'Đồng bộ màn sau với flash: khi nào, cài ở đâu',
  dek: '[[Đồng bộ màn sau]] là cho đèn flash nổ ở cuối lúc phơi sáng. Vệt sáng nằm phía sau chủ thể, đúng chiều di chuyển.',

  blocks: [
    {
      t: 'tldr',
      items: [
        'Đồng bộ màn sau (Rear Sync) để flash nổ ở cuối phơi, vệt sáng phía sau chủ thể.',
        'Dùng flash rời (HVL-F46RM, HVL-F60RM hoặc Godox), tốc độ 1/15–1/4s, khẩu F5.6–F8.',
        'Bù flash −1 EV để không bị "dán" lên nền tối; cân bằng trắng ~3.200K để vệt đèn ngả xanh lạnh.',
      ],
    },
    {
      t: 'p',
      text: '[[Đồng bộ màn sau]] là cho đèn flash nổ ở cuối thời gian phơi sáng thay vì đầu: vệt sáng chuyển động nằm phía sau chủ thể, đúng chiều chuyển động. Mặc định (đồng bộ màn trước), flash nổ ngay đầu nên vệt mờ nằm phía trước, trông như đang đi lùi.',
    },
    {
      t: 'figure',
      caption: 'Motion ghi trước, flash "đóng băng" chủ thể ở cuối: vệt phía sau. Ảnh: Takashi Hososhima · CC BY-SA 2.0 · Wikimedia Commons',
    },
    {
      t: 'h',
      text: 'Vì sao phải dùng Đồng bộ màn sau',
    },
    {
      t: 'p',
      text: 'Hành động chụp là: màn trập mở → chủ thể di chuyển (ghi vệt sáng từ nền) → flash nổ → [[tốc độ màn trập]] đóng. Với đồng bộ màn trước, flash nổ lúc mở màn, "đóng băng" chủ thể ở vị trí đầu, vệt sáng ghi sau nó → vệt phía trước. Với [[đồng bộ màn sau]], vệt ghi trước, flash nổ lúc đóng màn → chủ thể "đóng băng" ở vị trí cuối → vệt nằm phía sau, như đang lao tới với [[Cân bằng trắng và nhiệt độ màu]].',
    },
    {
      t: 'h',
      text: 'Cài đặt Sony Alpha cho Đồng bộ màn sau',
    },
    {
      t: 'menu',
      old: 'MENU → Camera Settings2 → Flash Mode → Rear Sync',
      new: 'MENU → Flash → Flash Mode → Rear Sync (hoặc Rear 1 + 2)',
    },
    {
      t: 'callout',
      label: 'Flash rời vs Flash trên máy',
      text: 'Chỉ flash rời (HVL-F46RM, HVL-F60RM hoặc Godox TT685S/V860S) hỗ trợ Rear Sync. Flash trên máy không hỗ trợ. Gắn flash vào hotshoe trước khi bấm chụp.',
    },
    {
      t: 'h',
      text: 'Cài đặt chi tiết cho Rear Sync',
    },
    {
      t: 'table',
      head: ['Thông số', 'Cài đặt khuyến nghị', 'Lý do'],
      rows: [
        ['Chế độ phơi', 'M hoặc S', 'Kiểm soát tốc độ để ghi vệt sáng nền'],
        ['Tốc độ màn trập', '1/15–1/4s', 'Đủ dài để ghi vệt, không quá lâu để nhòe quá mức'],
        ['Khẩu', 'F5.6–F8', 'Cân bằng ánh sáng nền và flash'],
        ['Bù flash', '−1 EV', 'Tránh flash quá sáng, "dán" lên nền'],
        ['Cân bằng trắng', '~3.200K (Đèn sợi đốt)', 'Vệt đèn nền ngả xanh lạnh'],
      ],
      caption: 'Các thông số khi chụp Rear Sync. Mỗi nơi sẽ khác nhau tùy ánh sáng nền.',
    },
    {
      t: 'h',
      text: 'Bước chụp Rear Sync từng bước',
    },
    {
      t: 'p',
      text: 'Bước 1: Chọn nơi có đèn nền màu: đèn phố, biển hiệu neon, sàn nhảy. Bước 2: Đo sáng cho hậu cảnh trước (chưa tính flash) — nền phải hơi thiếu sáng, không quá sáng. Bước 3: Chủ thể di chuyển qua khung (hoặc bạn lia nhẹ máy). Bước 4: **Giữ máy đến khi nghe flash nổ** — đó là lúc chủ thể được "đóng băng". Flash nổ xong mới hạ máy xuống.',
    },
    {
      t: 'h',
      text: 'Mẹo khi dạy hoặc tập Rear Sync',
    },
    {
      t: 'p',
      text: 'Chụp cùng một cảnh hai kiểu — Đồng bộ màn trước và Đồng bộ màn sau — rồi đặt kết quả cạnh nhau. Hướng vệt sáng khác nhau là minh họa thuyết phục nhất. Nếu kết quả mờ, kiểm tra: tốc độ có đủ dài không, bù flash có −1 EV không, cân bằng trắng có phù hợp không.',
    },
    {
      t: 'checklist',
      label: 'Khi chấm bài Rear Sync',
      items: [
        'Chủ thể nét nhờ flash nổ lúc đóng màn',
        'Vệt sáng từ nền nằm phía sau chủ thể, theo chiều di chuyển',
        'Flash không lấn át hoàn toàn ánh sáng nền (phải thấy được vệt nền)',
        'Cân bằng ánh sáng giữa vệt nền và chủ thể hợp lý',
      ],
    },
  ],

  meta: {
    sources: [
      {
        url: 'https://helpguide.sony.net/ilc/2110/v1/en/contents/TP1000640189.html',
        title: 'Flash Mode (ILCE-7M4)',
        publisher: 'Sony Help Guide',
        checkedAt: '2026-11-05',
        scope: 'ILCE-7M4',
      },
      {
        url: 'https://helpguide.sony.net/ilc/2110/v1/en/contents/TP1000640190.html',
        title: 'Using flash (ILCE-7M4)',
        publisher: 'Sony Help Guide',
        checkedAt: '2026-11-05',
        scope: 'ILCE-7M4',
      },
    ],
    related: [
      { kind: 'knowledge', id: 'dong-bo-man-sau' },
      { kind: 'knowledge', id: 'toc-do-man-trap' },
      { kind: 'knowledge', id: 'can-bang-trang-va-nhiet-do-mau' },
      { kind: 'knowledge', id: 'cai-dat-nhanh-truoc-buoi-chup' },
    ],
    prerequisites: [],
    concepts: [],
    authorName: null,
    reviewedAt: null,
    section: null,
    order: null,
  },
}
