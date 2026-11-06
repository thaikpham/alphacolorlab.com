import type { Article } from '../../types'

export const page: Article = {
  id: 'chup-dem-cam-tay-iso-cao',
  kind: 'article',
  topic: 'exposure',
  level: 'mid',
  archetype: 'technique',
  read: '7 phút đọc',
  title: 'Chụp đêm cầm tay: ISO lên bao nhiêu, tốc độ tối thiểu, Creative Look nào',
  dek: 'Đêm xuống, nâng ISO lên 6.400 hay 25.600 là chuyện thường. Quy tắc để cân bằng nét, sáng và nhiễu — và Creative Look thích hợp.',
  updatedAt: '2026-11-06',
  blocks: [
    {
      t: 'tldr',
      items: [
        'Đêm phố: điểm xuất phát ISO 6.400–12.800, tốc độ theo quy tắc 1/(tiêu cự × 1.5).',
        'Ảnh nhoè không cứu được; nhiễu thì giảm được ở hậu kỳ. Chọn ISO cao để nét, rồi giảm nhiễu sau.',
        'Creative Look **NT** (Neutral) hoặc **ST** (Standard) khi ánh sáng lạc màu; từ chối bất kỳ Look "đẹp" nào.',
      ],
    },
    {
      t: 'p',
      text: 'Chụp đêm cầm tay (không chân máy) là bài toán ba cạnh: **nét** (tốc độ tối thiểu), **sáng** (exposure), **nhiễu** (ISO). Ba cái đều muốn tối ưu, nhưng camera không thể cho ba cái cùng lúc. Hiểu vấn đề và ưu tiên đúng là bí quyết. [[ISO]] là yếu tố chính ở đây.',
    },
    {
      t: 'figure',
      caption: 'Ánh sáng đêm đặt thử thách cho phơi sáng cầm tay. Ảnh: Archangel12 · CC BY 2.0 · Wikimedia Commons',
    },
    { t: 'h', text: 'Ba kiểu ánh sáng đêm' },
    {
      t: 'p',
      text: '**Trong nhà** có đèn điện: tối nhất, ISO phải lên cao nhất. **Phố** có đèn đường, biển hiệu, quán sáng: sáng hơn nhưng loang lổ. **Sân khấu, bảng quảng cáo**: sáng nhất nhưng tương phản rất gắt. Mỗi kiểu cần một cách xử lý.',
    },
    {
      t: 'menu',
      old: 'MENU → Camera Settings1 → ISO Setting → ISO (ZV-E10: Camera Settings1 → ISO)',
      new: 'MENU → Exposure/Color → Exposure → ISO (chế độ M hoặc A)',
    },
    { t: 'h', text: 'Cân bằng ba yếu tố: ưu tiên nét trước' },
    {
      t: 'p',
      text: 'Quy tắc nên nhớ: **ảnh nhoè không cứu được, ảnh nhiễu hơi sửa được**. Vì vậy bước 1 là **chọn [[Tốc độ màn trập|tốc độ tối thiểu để ảnh nét]]**, dùng công thức 1/(tiêu cự × 1.5). Ống 50mm cần 1/80s trở lên; ống góc rộng 24mm cần 1/40s. SteadyShot On giúp chậm xuống được một chút, nhưng đừng trông vào nó lúc đêm.',
    },
    {
      t: 'table',
      head: ['Tình huống đêm', 'Tốc độ + Khẩu (SteadyShot On)', 'ISO kỳ vọng'],
      caption: 'Quy tắc tính ISO cho đêm: tốc độ + khẩu cố định → máy chọn ISO để sáng.',
      rows: [
        ['Phố có đèn đường (ống nhanh)', '1/60s (50mm) + f/2.8', 'ISO 3.200–6.400'],
        ['Phố có đèn đường (ống kit)', '1/60s (50mm) + f/5.6', 'ISO 12.800–25.600'],
        ['Quán cà phê chiều sáng', '1/30s (góc rộng) + f/1.8', 'ISO 1.600–3.200'],
        ['Rạp chiếu phim sân khấu', '1/30s (góc rộng) + f/2.8', 'ISO 6.400'],
      ],
    },
    { t: 'h', text: 'Creative Look: chọn Neutral để tránh thêm vấn đề' },
    {
      t: 'p',
      text: '**Đêm trong nhà** ánh sáng thường là hỗn hợp: đèn vàng ấm + màn hình điện thoại xanh lạnh + neon cam. Cân bằng trắng sẽ bối rối. [[Creative Look|Creative Look]] **VV** (Vivid) hoặc **FL** (Film) sẽ làm vấn đề tệ hơn bằng cách tăng độ bão hòa của màu lạc. Dùng **NT** (Neutral) — nhạt nhưng trung thực — và để hậu kỳ sửa màu nếu cần. Luôn chụp [[RAW, JPEG và HEIF|RAW]] để có cơ hội sửa cân bằng trắng và xử lý nhiễu tốt hơn so với JPEG.',
    },
    {
      t: 'h',
      text: 'Ba cách giảm nhiễu: ngay khi chụp, hậu kỳ, hoặc tấm',
    },
    {
      t: 'p',
      text: '**Ngay khi chụp**: đặt ISO AUTO Min. SS để máy giữ tốc đủ nhanh thay vì hạ tốc; Long Exposure NR chỉ chạy khi phơi từ 1 giây trở lên nên chụp đêm cầm tay không cần đụng tới nó. **Hậu kỳ**: giảm nhiễu trong Lightroom hoặc phần mềm chuyên giảm nhiễu, quá tay thì ảnh mịn như sáp. **Chụp nhiều tấm**: xếp chồng nhiều tấm trong Photoshop (Stack Mode: Mean) cho ảnh sạch hơn một tấm đơn.',
    },
    {
      t: 'checklist',
      label: 'Kiểm tra trước khi ra phố chụp đêm',
      items: [
        'Ống kính có SteadyShot? On hay Off — kiểm tra vòng trên ống hoặc menu.',
        'Pin đầy? Màn hình sáng lâu và chụp liên tục tiêu pin nhanh.',
        'Thẻ nhớ còn trống? RAW nặng gấp nhiều lần JPEG.',
        'Tốc độ tối thiểu đã tính công thức chưa? Viết tờ giấy: "ống 50mm = 1/80s".',
      ],
    },
  ],
  meta: {
    related: [
      { kind: 'knowledge', id: 'iso' },
      { kind: 'knowledge', id: 'toc-do-man-trap' },
      { kind: 'knowledge', id: 'creative-look' },
      { kind: 'knowledge', id: 'raw-jpeg-va-heif' },
    ],
    prerequisites: ['iso'],
    concepts: [],
    sources: [
      {
        url: 'https://helpguide.sony.net/ilc/2110/v1/en/contents/TP1000640850.html',
        title: 'ILCE-7M4 Help Guide — ISO',
        checkedAt: '2026-11-05',
      },
      {
        url: 'https://helpguide.sony.net/ilc/2110/v1/en/contents/TP1000640848.html',
        title: 'ILCE-7M4 Help Guide — Shutter Speed',
        checkedAt: '2026-11-05',
      },
      {
        url: 'https://helpguide.sony.net/ilc/2110/v1/en/contents/TP1000640837.html',
        title: 'ILCE-7M4 Help Guide — Creative Look',
        checkedAt: '2026-11-05',
      },
    ],
    authorName: null,
    reviewedAt: null,
    section: null,
    order: null,
  },
}
