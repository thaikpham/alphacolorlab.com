import type { Article } from '../../types'

export const page: Article = {
  id: 'loc-anh-sau-buoi-chup',
  kind: 'article',
  topic: 'gear',
  level: 'mid',
  archetype: 'setup-guide',
  read: '5 phút',
  title: 'Lọc ảnh sau buổi chụp: Rating, thư mục, sao lưu',
  dek: 'Ba bước từ thẻ nhớ tới máy tính: Rating trên máy, tổ chức thư mục theo ngày, và sao lưu dữ liệu gốc an toàn.',
  updatedAt: '2026-11-06',
  blocks: [
    {
      t: 'tldr',
      items: [
        'Đánh Rating trên máy (5 sao là tốt, 1 sao là xóa) để lọc ảnh nhanh, không cần chép toàn bộ.',
        'Tổ chức thư mục: Năm → Tháng → YYYYMMDD-tên_buổi, RAW riêng một subfolder.',
        'Sao lưu RAW gốc sang ổ cứng khác hoặc Cloud trước khi chỉnh: bảo vệ dữ liệu gốc.',
      ],
    },
    {
      t: 'p',
      text: 'Sau buổi chụp, hàng trăm ảnh trong thẻ nhớ cần được lọc, sắp xếp và lưu trữ an toàn. [[Đặt tên và lọc ảnh]] là bước tiền chỉnh: loại bỏ ảnh hỏng, giữ lại ảnh tốt, tổ chức thư mục sao cho tháng sau bạn vẫn tìm được. Ba bước sau giúp bạn quy trình từ thẻ nhớ tới máy tính và sao lưu.',
    },
    {
      t: 'figure',
      caption: 'Máy Sony Alpha sau buổi chụp: trước tiên đánh Rating trên máy để lọc, rồi chép thẻ nhớ sang máy tính. Ảnh: Unknown Artist · CC0 1.0 · Wikimedia Commons',
    },
    {
      t: 'h',
      text: 'Bước 1: Lọc trên máy bằng Rating',
    },
    {
      t: 'menu',
      old: 'MENU → Playback Settings → Rating, hoặc khi xem ảnh bấm MENU → Rate Image',
      new: 'MENU → Playback → Playback Settings → Rating, hoặc bấm MENU khi xem ảnh',
    },
    {
      t: 'p',
      text: 'Đánh Rating từng tấm: 5 sao cho ảnh tốt (nét, sáng đủ, biểu cảm ok), 4 cho dự phòng, 1–2 cho ảnh hỏng (nhòe, tối, xấu—sẽ xóa). Lợi ích: bạn lọc nhanh trên máy, không cần chép toàn bộ lên máy tính, chỉ chép những ảnh tốt.',
    },
    {
      t: 'h',
      text: 'Bước 2: Chép và tổ chức thư mục',
    },
    {
      t: 'p',
      text: 'Tạo cấu trúc thư mục rõ ràng: Pictures → Năm (2026) → Tháng (2026-11) → Ngày-tên (20261110-lang-thang). Trong mỗi thư mục ngày-tên: subfolder RAW (chứa file ARW gốc), edited (ảnh đã chỉnh), export-1024 (ảnh xuất cho web). Cấu trúc này giúp bạn tìm nhanh theo năm, tháng, ngày, và tên buổi chụp.',
    },
    {
      t: 'h',
      text: 'Bước 3: Lọc trong Lightroom',
    },
    {
      t: 'p',
      text: 'Mở Lightroom → File → Import Photos → chọn thư mục ngày-tên. Lightroom scan hết ảnh, ở cột trái bật Filter → Flag để hiện chỉ ảnh 5 sao từ máy. Lọc tiếp nếu muốn, chọn những ảnh 5 sao để bắt đầu chỉnh (save vào thư mục edited).',
    },
    {
      t: 'h',
      text: 'Bước 4: Sao lưu dữ liệu gốc',
    },
    {
      t: 'p',
      text: 'Trước khi chỉnh hay xóa gì, sao lưu thư mục RAW sang ổ cứng ngoài riêng biệt (hoặc Cloud). Quy tắc 3-2-1: 3 bản (máy + ổ ngoài + Cloud), 2 loại thiết bị (máy + ổ ngoài), 1 bản ở nơi khác (Cloud). Dùng rsync, Robocopy, hoặc phần mềm như ChronoSync; sao lưu hàng tuần hoặc sau mỗi buổi chụp lớn.',
    },
    {
      t: 'h',
      text: 'Lightroom hay Capture One?',
    },
    {
      t: 'p',
      text: 'Cả hai đều được. Lightroom dễ dùng, rẻ (subscription), đủ cho lọc ảnh. Capture One mạnh hơn, xử lý nhanh khi có hàng ngàn ảnh, nhưng đắt. Nếu mới bắt đầu, Lightroom là đủ.',
    },
    {
      t: 'checklist',
      label: 'Quy trình lọc ảnh sau buổi chụp',
      items: [
        'Chụp xong, đánh Rating trên máy: 5 sao tốt, 1 sao xóa.',
        'Chép thẻ nhớ sang máy vào thư mục Pictures/2026/2026-11/YYYYMMDD-tên_buổi.',
        'Tạo subfolder RAW, edited, export-1024 trong thư mục ngày-tên.',
        'Mở Lightroom, import thư mục ngày-tên, lọc theo Rating.',
        'Sao lưu thư mục RAW sang ổ cứng ngoài ngay lập tức.',
        'Bắt đầu chỉnh ảnh tốt, export vào subfolder export-1024.',
      ],
    },
  ],
  meta: {
    related: [
      { kind: 'knowledge', id: 'dat-ten-va-loc-anh' },
      { kind: 'knowledge', id: 'raw-jpeg-va-heif' },
      { kind: 'knowledge', id: 'can-bang-trang-va-nhiet-do-mau' },
    ],
    prerequisites: ['dat-ten-va-loc-anh'],
    concepts: [],
    sources: [
      {
        url: 'https://helpguide.sony.net/ilc/2110/v1/en/contents/TP1000640844.html',
        title: 'ILCE-7M4 Help Guide — Playback and Protection',
        checkedAt: '2026-11-05',
      },
    ],
    authorName: null,
    reviewedAt: null,
    section: null,
    order: null,
  },
}
