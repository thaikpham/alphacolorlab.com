import type { Article } from '../../types'

export const page: Article = {
  id: 'loc-anh-sau-buoi-chup',
  kind: 'article',
  topic: 'gear',
  level: 'mid',
  archetype: 'workflow',
  read: '9 phút',
  title: 'Lọc ảnh sau buổi chụp: máy, Lightroom, đặt tên thư mục',
  dek: 'Ba bước từ thẻ nhớ tới máy tính, lọc ảnh hỏng, tổ chức thư mục với tên ngày tháng, và sao lưu an toàn dữ liệu gốc.',
  updatedAt: '2026-11-06',
  blocks: [
    {
      t: 'tldr',
      items: [
        'Đánh Rating trên máy (5 sao) hoặc trong Lightroom để lọc ảnh tốt, đủ nét, đủ sáng.',
        'Tổ chức thư mục: Năm → Tháng → YYYYMMDD-tên_buổi_chụp, và tách RAW vào subfolder riêng.',
        'Sao lưu gốc trước khi chỉnh: lưu RAW/JPEG gốc ở một đĩa cứng khác, chỉnh ảnh từ bản copy trên máy.',
      ],
    },
    {
      t: 'p',
      text: 'Sau buổi chụp, hàng trăm ảnh trong thẻ nhớ cần được lọc, sắp xếp và lưu trữ an toàn. [[Đặt tên và lọc ảnh]] là bước tiền chỉnh: loại bỏ ảnh hỏng, giữ lại ảnh tốt, tổ chức thư mục sao cho tháng sau bạn vẫn tìm được. Bài này hướng dẫn quy trình từ thẻ nhớ tới máy tính và sao lưu.',
    },
    {
      t: 'figure',
      caption: 'Máy Sony Alpha với thẻ nhớ UHS-II: sau buổi chụp, trước tiên hãy kiểm tra Rating trên máy, bật vùng hiển thị để xem nội dung chi tiết, rồi chép thẻ sang máy tính. Ảnh: Unknown Artist · CC0 1.0 · Wikimedia Commons',
    },
    {
      t: 'h',
      text: 'Bước 1: Lọc trên máy bằng Rating',
    },
    {
      t: 'p',
      text: 'Ngay sau buổi chụp, trên máy Sony, bạn có thể đánh Rating từng tấm ảnh. Rating từ 1 đến 5 sao: 5 sao cho ảnh tốt, 4 cho ảnh dự phòng, 3 cho bình thường, 1–2 cho ảnh hỏng (sẽ xóa). Lợi ích: bạn lọc nhanh, không cần chép toàn bộ lên máy tính, vì chỉ chép những ảnh tốt.',
    },
    {
      t: 'menu',
      old: 'MENU → Playback Menu (Xem ảnh) → Rating, hoặc bấm nút xoay/MENU khi xem ảnh → Rating',
      new: 'MENU → Playback Settings → Rating, hoặc khi xem ảnh bấm MENU → Rate Image (Đánh giá ảnh)',
    },
    {
      t: 'callout',
      label: 'Dấu hiệu ảnh không đạt',
      text: 'Ảnh bị nhòe (do rung tay), chủ thể không nét, sáng quá hoặc tối quá, hoặc biểu cảm xấu. Đánh 1 sao để đánh dấu xóa sau.',
    },
    {
      t: 'h',
      text: 'Bước 2: Chép thẻ sang máy tính và tổ chức thư mục',
    },
    {
      t: 'p',
      text: 'Khi chép dữ liệu thẻ nhớ sang máy tính (dùng Card Reader hoặc kết nối USB), hãy tạo thư mục với cấu trúc rõ ràng để tìm được sau:',
    },
    {
      t: 'p',
      text: '```\nPictures/\n├─ 2026/\n│  ├─ 2026-11/\n│  │  ├─ 20261105-dam-cuoi-nam\n│  │  │  ├─ RAW/\n│  │  │  │  ├─ DSC00001.ARW\n│  │  │  │  ├─ DSC00002.ARW\n│  │  │  ├─ edited/\n│  │  │  ├─ export-1024/\n│  │  ├─ 20261110-lang-thang-pho-cu\n│  │  │  ├─ RAW/\n│  │  │  ├─ edited/\n│  │  │  ├─ export-1024/\n```',
    },
    {
      t: 'p',
      text: 'Cấu trúc này giúp bạn: tìm nhanh theo năm, tháng; ngày và tên buổi chụp nằm trong tên thư mục; RAW riêng để dễ sao lưu; edited là những ảnh đã chỉnh; export-1024 là các ảnh đã xuất cho web/mạng xã hội.',
    },
    {
      t: 'h',
      text: 'Bước 3: Lọc trong Lightroom',
    },
    {
      t: 'p',
      text: 'Khi dữ liệu ở trên máy tính, mở Lightroom:',
    },
    {
      t: 'p',
      text: '1. File → Import Photos, chọn thư mục 20261105-dam-cuoi-nam.\n2. Lightroom sẽ scan và hiện danh sách ảnh.\n3. Ở cột bên trái, bật Filter → Flag để hiện chỉ những ảnh 5 sao từ máy.\n4. Sử dụng Flagging hoặc Star Ratings trong Lightroom để lọc tiếp (muốn tinh gọn hơn).\n5. Chọn những ảnh 5 sao để bắt đầu chỉnh (trong thư mục edited).',
    },
    {
      t: 'h',
      text: 'Bước 4: Sao lưu dữ liệu gốc',
    },
    {
      t: 'p',
      text: 'Đây là bước quan trọng: trước khi chỉnh hay xóa bất cứ cái gì, hãy sao lưu thư mục RAW sang một ổ cứng ngoài riêng biệt (hoặc Cloud). Lý do: nếu máy tính hỏng, bạn vẫn có bản RAW nguyên bản để làm lại. Quy tắc 3-2-1: 3 bản sao (máy + ổ ngoài + Cloud), trên 2 loại thiết bị (máy + ổ ngoài), 1 bản ở nơi khác (Cloud hoặc nhà bạn bè).',
    },
    {
      t: 'callout',
      label: 'Những công cụ sao lưu',
      text: 'rsync trên Mac/Linux, Robocopy trên Windows, hoặc phần mềm đồ họa như ChronoSync. Cloud: Google Drive, Dropbox, iCloud. Ổ cứng ngoài: dùng định kỳ (hàng tuần) hoặc sau mỗi buổi chụp lớn.',
    },
    {
      t: 'h',
      text: 'Ví dụ quy trình một buổi chụp',
    },
    {
      t: 'p',
      text: '1. Chụp xong buổi, máy có 500 ảnh JPEG + 200 RAW.\n2. Trên máy Sony: đánh Rating, giữ 5 sao cho 300 ảnh tốt, 1 sao cho 400 ảnh xấu.\n3. Chép thẻ sang máy tính vào thư mục Pictures/2026/2026-11/20261110-lang-thang/RAW.\n4. Trong Lightroom: import, lọc ảnh 5 sao, tìm được 200 ảnh để xem xét.\n5. Sao lưu thư mục RAW sang ổ ngoài (hoặc Cloud).\n6. Bắt đầu chỉnh ảnh trong Lightroom; ảnh đã chỉnh export vào thư mục export-1024.',
    },
    {
      t: 'h',
      text: 'FAQ',
    },
    {
      t: 'h',
      text: 'Lightroom hay Capture One cho lọc ảnh?',
    },
    {
      t: 'p',
      text: 'Cả hai đều được. Lightroom dễ dùng và rẻ (subscription), Capture One mạnh hơn nhưng đắt. Nếu mới bắt đầu, Lightroom là đủ. Nếu bạn muốn tốc độ xử lý nhanh hơn khi có hàng ngàn ảnh, Capture One tốt hơn.',
    },
    {
      t: 'h',
      text: 'Tôi nên giữ JPEG từ máy hay xóa?',
    },
    {
      t: 'p',
      text: 'Nếu chụp RAW+JPEG, JPEG là tham khảo nhanh để xem ảnh trên điện thoại hoặc chia sẻ nhanh. Hãy giữ. Nếu chỉ chụp JPEG và có kế hoạch chỉnh sau (nhưng JPEG khó chỉnh), thì giữ. Nếu không dùng đến, xóa để tiết kiệm chỗ.',
    },
    {
      t: 'h',
      text: 'Làm sao để tìm nhanh ảnh của buổi chụp 6 tháng trước?',
    },
    {
      t: 'p',
      text: 'Cấu trúc thư mục YYYYMMDD-tên giúp bạn nhớ ngay. Ví dụ: 20260505-phan-dau-xuan → bạn biết là ngày 5/5/2026, buổi Phan Đậu Xuân. Ở Lightroom, dùng Collections hoặc Smart Collections để lọc theo ngày chụp (EXIF).',
    },
    {
      t: 'checklist',
      items: [
        'Chụp xong, đánh Rating trên máy để lọc ảnh tốt (5 sao) và xấu (1 sao).',
        'Chép thẻ nhớ sang máy tính vào thư mục YYYYMMDD-tên_buổi_chụp.',
        'Tạo subfolder RAW để chứa file gốc.',
        'Trong Lightroom, import thư mục và lọc theo Rating.',
        'Sao lưu thư mục RAW sang ổ cứng ngoài hoặc Cloud ngay lập tức.',
        'Bắt đầu chỉnh ảnh tốt, export vào subfolder export-1024.',
      ],
    },
  ],
  meta: {
    related: [
      { kind: 'knowledge', id: 'raw-jpeg-va-heif' },
      { kind: 'knowledge', id: 'cai-dat-nhanh-truoc-buoi-chup' },
      { kind: 'knowledge', id: '8-bai-thuc-hanh' },
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
