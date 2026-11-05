import type { Article } from '../../types'

export const page: Article = {
  id: 'raw-hay-jpeg-cho-nguoi-moi',
  kind: 'article',
  topic: 'gear',
  level: 'newbie',
  archetype: 'reference',
  read: '8 phút',
  title: 'Người mới nên chụp RAW, JPEG hay cả hai?',
  dek: 'RAW giữ toàn bộ dữ liệu để chỉnh sau; JPEG tô xong và bằng máy ngay. Lựa chọn phụ thuộc vào thời gian bạn có và mục đích ảnh.',
  updatedAt: '2026-11-06',
  blocks: [
    {
      t: 'tldr',
      items: [
        'RAW là tất cả dữ liệu thô từ cảm biến; JPEG là ảnh đã xử lý và nén của máy theo [[Creative Look]] hoặc Picture Profile.',
        'RAW cho phép chỉnh toàn bộ (màu, sáng, cân bằng trắng, gamma) sau với ít mất mát; JPEG là ảnh cuối cùng, khó sửa lại.',
        'Người mới nên chụp RAW nếu có thời gian chỉnh ảnh; nếu không, JPEG là hoàn thành và dùng được ngay.',
      ],
    },
    {
      t: 'p',
      text: '[[RAW, JPEG và HEIF]] là ba định dạng Sony Alpha hỗ trợ. Khi bạn chụp, máy ghi dữ liệu từ cảm biến vào file. Tuỳ vào chế độ, file đó là RAW (dữ liệu thô), JPEG (ảnh đã xử lý), hoặc HEIF (ảnh nén mới). Chọn cái nào phụ thuộc vào dòng quy trình của bạn.',
    },
    {
      t: 'figure',
      caption: 'Bộ nhớ SD có đủ chỗ cho cả RAW và JPEG: máy Sony hỗ trợ quay số song song, lưu cả hai định dạng cùng lúc. Ảnh: Unknown Artist · CC0 1.0 · Wikimedia Commons',
    },
    {
      t: 'h',
      text: 'RAW: dữ liệu thô, toàn quyền chỉnh sau',
    },
    {
      t: 'p',
      text: 'RAW là dữ liệu gốc từ cảm biến mà máy chưa xử lý. Khi bạn chụp ở chế độ RAW, máy lưu tất cả thông tin sáng từng pixel, rồi bạn chỉnh trong Lightroom, Capture One, hoặc Imaging Edge. Điểm tốt: bạn có toàn bộ tự do chỉnh White Balance, Exposure, Tone, Shadows—Highlights mà không mất chi tiết. Điểm xấu: mỗi tấm RAW lớn khoảng 50 MB trên máy Sony, cần software chuyên dụng để mở, và bạn phải chỉnh từng ảnh.',
    },
    {
      t: 'callout',
      label: 'Định dạng RAW của Sony',
      text: 'Sony Alpha lưu RAW dưới dạng ARW (hoặc ARQ nếu máy mới). Khi bạn chuyển đổi sang định dạng quốc tế, nó là DNG. Phần mềm như Lightroom, Adobe Bridge, Capture One đều hỗ trợ ARW mà không cần chuyển đổi.',
    },
    {
      t: 'h',
      text: 'JPEG: ảnh tô xong, dùng được ngay',
    },
    {
      t: 'p',
      text: 'JPEG là ảnh đã được máy xử lý theo [[Creative Look]], Picture Profile, hoặc cấu hình mặc định của máy. Bạn nhấn chụp, máy xử lý ngay lập tức và lưu file khoảng 8–12 MB. Ảnh có thể dùng ngay trên điện thoại, in ra, hoặc đăng lên mạng mà không cần chỉnh sau. Điểm tốt: nhỏ gọn, nhanh, hoàn thành. Điểm xấu: nếu bạn chụp sai màu hoặc sáng, khó sửa lại vì máy đã nén và xóa mất dữ liệu.',
    },
    {
      t: 'h',
      text: 'HEIF: ảnh nén mới, nhỏ và tốt',
    },
    {
      t: 'p',
      text: 'HEIF (High Efficiency Image Format) là định dạng nén mới hơn JPEG. Tệp nhỏ hơn JPEG cùng chất lượng (khoảng 6–9 MB), nhưng không phải phần mềm nào cũng hỗ trợ. Một số điện thoại và phần mềm chỉnh ảnh bắt đầu hỗ trợ, nhưng đó là tương lai. Hiện tại, nếu bạn muốn ảnh nhỏ mà vẫn tốt, HEIF là lựa chọn; nếu cần mở ở bất kỳ máy tính nào, vẫn JPEG.',
    },
    {
      t: 'h',
      text: 'Bảng so sánh ba định dạng',
    },
    {
      t: 'table',
      caption: 'Đặc điểm từng định dạng',
      head: ['Yếu tố', 'RAW', 'JPEG', 'HEIF'],
      rows: [
        ['Dung lượng trên thẻ', '40–60 MB/tấm', '8–12 MB/tấm', '6–9 MB/tấm'],
        ['Chỉnh được những gì', 'Tất cả: sáng, màu, gamma, gamma, shadow–highlight', 'Màu, độ sáng giới hạn; không thể lấy lại dữ liệu mất', 'Giống JPEG, không khai thác hết vì nén'],
        ['Thời gian chỉnh', '5–15 phút/tấm trong Lightroom', 'Hầu hết dùng được ngay', 'Hầu hết dùng được ngay'],
        ['Hỗ trợ phần mềm', 'Lightroom, Capture One, Imaging Edge, Photoshop', 'Mọi phần mềm, mọi điện thoại', 'Một số phần mềm (macOS, iOS, một số Android)'],
        ['Chất lượng in', 'Tốt nhất (chỉnh từ dữ liệu gốc)', 'Tốt (tuỳ vào cấu hình Creative Look)', 'Tốt (gần bằng JPEG)'],
      ],
    },
    {
      t: 'h',
      text: 'Đề xuất cho từng loại người chụp',
    },
    {
      t: 'p',
      text: 'Người mới chụp lần đầu: Chọn JPEG hoặc HEIF, để [[Creative Look]] là Portrait rồi chụp thử. Ảnh ra ngay, dùng được, không phải lo phần mềm hay quy trình phức tạp. Nếu bạn có tôi bắt đầu yêu thích nhiếp ảnh, hãy chuyển sang RAW.',
    },
    {
      t: 'p',
      text: 'Người chụp chuyên hoặc muốn full kiểm soát: Chọn RAW + JPEG song song (máy Sony gọi là \"RAW+JPEG\" trong menu). Bạn lưu cả RAW để chỉnh chi tiết sau, và JPEG để kiểm tra nhanh hoặc dùng khi chưa có thời gian chỉnh.',
    },
    {
      t: 'h',
      text: 'FAQ',
    },
    {
      t: 'h',
      text: 'Tôi có bao nhiêu ảnh trong thẻ nhớ 64 GB?',
    },
    {
      t: 'p',
      text: 'Thẻ 64 GB có khoảng 60 GB dùng được. Nếu chụp JPEG: khoảng 6000–7000 tấm. HEIF: 7000–8000 tấm. RAW: 1000–1200 tấm. RAW+JPEG: 800–900 tấm (vì lưu cả hai).',
    },
    {
      t: 'h',
      text: 'Tôi phải mua thẻ nhớ nhanh loại nào?',
    },
    {
      t: 'p',
      text: 'Sony Alpha hỗ trợ UHS-II. Tìm thẻ có V60 hoặc V90 (Video Speed Class) để chụp video không lag. Cho chụp tĩnh JPEG/HEIF, V30 là đủ. Nếu chụp RAW liên tục (burst), V60 sẽ an toàn hơn.',
    },
    {
      t: 'h',
      text: 'Làm sao để chuyển toàn bộ RAW sang JPEG khi không có Lightroom?',
    },
    {
      t: 'p',
      text: 'Sony Imaging Edge là phần mềm miễn phí của Sony. Tải từ site Sony, mở RAW trong đó, chỉnh bằng giao diện đơn giản, rồi Export sang JPEG. Hoặc dùng lựa chọn chụp RAW+JPEG song song từ đầu; máy sẽ lưu cả hai, vậy bạn có JPEG ngay mà không cần chuyển đổi sau.',
    },
    {
      t: 'checklist',
      items: [
        'Vào MENU → Chế độ quay số → chọn RAW, JPEG, HEIF hoặc RAW+JPEG.',
        'Nếu chọn JPEG, bật Creative Look (Standard hoặc Portrait) để ảnh có tô màu.',
        'Chụp một tấm, kiểm tra LCD để xem ảnh ra thế nào.',
        'Nếu hài lòng ảnh, cứ JPEG; nếu muốn chỉnh sau, chuyển sang RAW hoặc RAW+JPEG.',
        'Khi chụp RAW, cài đặt Lightroom để chỉnh sau (bạn có thể chỉnh toàn bộ mà không mất chi tiết).',
      ],
    },
  ],
  meta: {
    related: [
      { kind: 'knowledge', id: 'dat-ten-va-loc-anh' },
      { kind: 'knowledge', id: 'creative-look' },
      { kind: 'knowledge', id: 'can-bang-trang-va-nhiet-do-mau' },
    ],
    prerequisites: [],
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
