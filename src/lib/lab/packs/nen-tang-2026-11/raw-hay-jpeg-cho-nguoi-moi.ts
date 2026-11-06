import type { Article } from '../../types'

export const page: Article = {
  id: 'raw-hay-jpeg-cho-nguoi-moi',
  kind: 'article',
  topic: 'gear',
  level: 'newbie',
  archetype: 'versus',
  read: '5 phút',
  title: 'Người mới nên chụp RAW, JPEG hay cả hai?',
  dek: 'RAW giữ toàn bộ dữ liệu để chỉnh sau; JPEG tô xong ngay. Lựa chọn phụ thuộc vào thời gian chỉnh ảnh của bạn.',
  updatedAt: '2026-11-06',
  blocks: [
    {
      t: 'tldr',
      items: [
        'RAW là dữ liệu thô từ cảm biến; JPEG là ảnh đã xử lý và nén bởi máy.',
        'RAW cho phép chỉnh toàn bộ (màu, sáng, cân bằng trắng) sau; JPEG là ảnh hoàn thành, khó sửa.',
        'Người mới nên chụp JPEG nếu không có thời gian chỉnh; RAW nếu muốn toàn quyền kiểm soát.',
      ],
    },
    {
      t: 'p',
      text: '[[RAW, JPEG và HEIF]] là ba định dạng Sony Alpha hỗ trợ. Khi bạn chụp, máy ghi dữ liệu từ cảm biến vào file: dữ liệu thô (RAW), ảnh đã xử lý (JPEG), hoặc ảnh nén mới (HEIF). Lựa chọn nào phụ thuộc vào quy trình chỉnh ảnh của bạn: RAW nếu có thời gian, JPEG nếu muốn hoàn thành ngay.',
    },
    {
      t: 'figure',
      caption: 'Bộ nhớ SD có đủ chỗ cho cả RAW và JPEG: máy Sony hỗ trợ chế độ RAW+JPEG để lưu cả hai cùng lúc. Ảnh: Unknown Artist · CC0 1.0 · Wikimedia Commons',
    },
    {
      t: 'h',
      text: 'RAW: dữ liệu thô, toàn quyền chỉnh',
    },
    {
      t: 'p',
      text: 'RAW là dữ liệu gốc từ cảm biến mà máy chưa xử lý. Bạn chỉnh trong Lightroom, Capture One, hoặc Imaging Edge (miễn phí). Điểm tốt: toàn bộ tự do chỉnh White Balance, Exposure, Shadows–Highlights mà không mất chi tiết. Điểm xấu: mỗi tấm khoảng 50 MB, cần phần mềm chuyên dụng, và bạn phải chỉnh từng ảnh.',
    },
    {
      t: 'h',
      text: 'JPEG: ảnh hoàn thành, dùng ngay',
    },
    {
      t: 'p',
      text: 'JPEG là ảnh đã được máy xử lý theo Creative Look hoặc Picture Profile. Tệp nhỏ (8–12 MB), dùng được ngay trên điện thoại, máy tính hay in ra. Điểm tốt: nhỏ gọn, hoàn thành. Điểm xấu: nếu chụp sai màu hoặc sáng, khó sửa lại vì máy đã nén và xóa dữ liệu.',
    },
    {
      t: 'table',
      caption: 'So sánh RAW và JPEG',
      head: ['Tiêu chí', 'RAW', 'JPEG'],
      rows: [
        ['Dung lượng', '40–60 MB/tấm', '8–12 MB/tấm'],
        ['Chỉnh được', 'Tất cả: sáng, màu, gamma', 'Giới hạn; không lấy lại dữ liệu'],
        ['Thời gian', '5–15 phút/tấm', 'Dùng ngay'],
        ['Hỗ trợ phần mềm', 'Lightroom, Capture One, Imaging Edge', 'Mọi phần mềm, mọi thiết bị'],
      ],
    },
    {
      t: 'h',
      text: 'Lựa chọn cho người mới',
    },
    {
      t: 'p',
      text: 'Nếu bạn vừa bắt đầu: chọn JPEG với [[Creative Look]] là Portrait, chụp thử, ảnh ra ngay, dùng được. Khi bạn yêu thích nhiếp ảnh và muốn kiểm soát toàn bộ: chuyển RAW. Mẹo: máy Sony có chế độ RAW+JPEG (chụp cả hai cùng lúc)—bạn có RAW để chỉnh chi tiết sau, và JPEG để [[Đặt tên và lọc ảnh]] sau đó kiểm tra nhanh.',
    },
    {
      t: 'h',
      text: 'Câu hỏi thường gặp',
    },
    {
      t: 'p',
      text: 'Thẻ 64 GB lưu được bao nhiêu ảnh? JPEG: 6000–7000 tấm. HEIF: 7000–8000 tấm. RAW: 1000–1200 tấm. RAW+JPEG: 800–900 tấm. Thẻ nào nhanh đủ? V60 hoặc V90 để an toàn; V30 là đủ cho JPEG. Chuyển RAW sang JPEG bằng cách nào? Dùng Sony Imaging Edge (miễn phí) hoặc Lightroom—mở RAW, chỉnh, Export JPEG.',
    },
    {
      t: 'checklist',
      label: 'Lựa chọn định dạng phù hợp',
      items: [
        'Vào MENU → File Format → chọn JPEG, RAW hoặc RAW+JPEG.',
        'Nếu chọn JPEG, bật Creative Look để ảnh có tô màu.',
        'Chụp một tấm, kiểm tra LCD để xem kết quả.',
        'Nếu hài lòng, cứ JPEG; muốn chỉnh sau thì đổi RAW.',
        'Cài đặt Lightroom hoặc Imaging Edge để chỉnh RAW khi cần.',
      ],
    },
  ],
  meta: {
    related: [
      { kind: 'knowledge', id: 'raw-jpeg-va-heif' },
      { kind: 'knowledge', id: 'dat-ten-va-loc-anh' },
      { kind: 'knowledge', id: 'creative-look' },
    ],
    prerequisites: ['raw-jpeg-va-heif'],
    concepts: [],
    sources: [
      {
        url: 'https://helpguide.sony.net/ilc/2110/v1/en/contents/TP1000649067.html',
        title: 'ILCE-7M4 Help Guide — File Format (still image)',
        checkedAt: '2026-11-05',
      },
    ],
    authorName: null,
    reviewedAt: null,
    section: null,
    order: null,
  },
}
