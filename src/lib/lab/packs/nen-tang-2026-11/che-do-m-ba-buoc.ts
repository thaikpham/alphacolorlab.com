import type { Article } from '../../types'

export const page: Article = {
  id: 'che-do-m-ba-buoc',
  kind: 'article',
  topic: 'exposure',
  level: 'mid',
  archetype: 'technique',
  read: '6 phút đọc',
  title: 'Chế độ M: ba bước lập khẩu, tốc, ISO theo thanh đo sáng',
  dek: 'Ở M, bạn kiểm soát cả khẩu, tốc, ISO — cứ ba bước: (1) khẩu, (2) tốc, (3) ISO để mũi thanh đo ở 0.',
  blocks: [
    {
      t: 'tldr',
      items: [
        'Chế độ M: bạn kiểm soát tất cả — máy chỉ báo độ sáng qua thanh đo sáng.',
        'Quy trình: (1) khẩu theo ý xóa phông, (2) tốc theo ý bắt dính, (3) ISO để mũi ở 0 ± 1/3.',
        'Dùng M khi cảnh sáng cố định (studio, pháo hoa, trăng) để tất cả tấm cùng độ sáng.',
      ],
    },
    {
      t: 'p',
      text: 'Chế độ M là chế độ duy nhất bạn hoàn toàn kiểm soát. Khó nhất nhưng linh hoạt nhất — khi cảnh sáng cố định thì M đảm bảo tất cả tấm cùng độ sáng. Quy trình ba bước lặp lại trước mỗi chụp, hoặc sau vài tấm khi ánh sáng đổi.',
    },
    {
      t: 'figure',
      caption: 'Thanh đo sáng ở M: mũi ở 0 là máy tính toán "đúng", lệch + hay − là máy báo "sáng" hay "tối" hơn. Ảnh: Markus Spiske · CC BY-SA 2.0 · Wikimedia Commons',
    },
    { t: 'h', text: 'Bước 1: Khẩu độ' },
    {
      t: 'p',
      text: 'Xoay bánh khẩu để chọn số f — F2.8 xóa phông, F8 nét sâu. Bạn quyết định khẩu theo hiệu ứng (xóa phông hay nét sâu), không phải đo sáng — đo là bước 3.',
    },
    { t: 'h', text: 'Bước 2: Tốc độ màn trập' },
    {
      t: 'p',
      text: 'Xoay bánh tốc để chọn thời gian — 1/1000 bắt dính bạc đẽ, 1" làm nhòe dòng nước. Bạn quyết định tốc theo hiệu ứng, không phải đo sáng. Nếu xoay vào BULB, máy giữ màn trập mở miễn là bạn giữ nút — hữu ích phơi sáng dài.',
    },
    { t: 'h', text: 'Bước 3: ISO để mũi thanh đo ở 0' },
    {
      t: 'p',
      text: 'Nhìn thanh đo sáng — xoay bánh ISO để kéo mũi về 0 hoặc ±1/3. ISO nào không quan trọng — quan trọng là mũi ở 0. Nếu bật ISO AUTO, máy tự nâng/hạ ISO để mũi ở 0 — dùng khi cố định cặp khẩu–tốc (phim studio: F5.6–1/125) mà không muốn chỉnh ISO tay.',
    },
    {
      t: 'table',
      head: ['Bước', 'Chọn gì', 'Dựa trên'],
      caption: 'Ba bước M theo thứ tự — không được lộn lẫn.',
      rows: [
        ['1', 'Khẩu độ (F.)', 'Muốn xóa phông hay nét sâu'],
        ['2', 'Tốc độ (s)', 'Muốn bắt dính hay làm nhòe chuyển động'],
        ['3', 'ISO', 'Mũi thanh đo sáng — kéo về 0'],
      ],
    },
    {
      t: 'h',
      text: 'Câu hỏi thường gặp',
    },
    {
      t: 'p',
      text: 'Sao mũi 0 là "đúng"? Máy đo độ sáng xám 18% nên luôn cố gắng làm ảnh xám trung tính. Con số 0 = "mũi ở 0 nếu máy tự chụp sẽ ra xám". Bạn có thể lệch khỏi 0 nếu muốn low-key (mũi −1.5), nhưng 0 là chuẩn máy tính. Ở M khi bật ISO AUTO? Máy tự nâng/hạ ISO để mũi ở 0 — giống như A nhưng bạn kiểm soát cả tốc lẫn khẩu. Dùng khi cố định cặp khẩu–tốc.',
    },
    {
      t: 'checklist',
      label: 'Trước lần chụp M đầu tiên',
      items: [
        'Quay chế độ về M',
        'Xem thanh đo sáng (nhấn DISP)',
        'Chọn khẩu theo ý xóa phông',
        'Chọn tốc theo ý bắt dính',
        'Xoay ISO đến mũi ở 0',
        'Chụp thử, kiểm tra ảnh',
      ],
    },
  ],
  meta: {
    related: [
      { kind: 'knowledge', id: 'tam-giac-phoi-sang' },
      { kind: 'knowledge', id: 'che-do-chup-p-a-s-m' },
      { kind: 'knowledge', id: 'do-sang' },
    ],
    prerequisites: ['tam-giac-phoi-sang'],
    concepts: [],
    sources: [
      {
        url: 'https://helpguide.sony.net/ilc/2110/v1/en/contents/TP1000640841.html',
        title: 'Sony Help Guide: Manual Exposure Mode (M)',
        checkedAt: '2026-11-05',
        scope: 'a7 IV, a6700',
      },
    ],
    authorName: null,
    reviewedAt: null,
    section: null,
    order: null,
  },
}
