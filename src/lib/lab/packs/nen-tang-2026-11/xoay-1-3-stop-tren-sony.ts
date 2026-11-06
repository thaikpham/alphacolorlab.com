import type { Article } from '../../types'

export const page: Article = {
  id: 'xoay-1-3-stop-tren-sony',
  kind: 'article',
  topic: 'exposure',
  level: 'mid',
  archetype: 'explainer',
  read: '5 phút đọc',
  title: 'Xoay một nấc bánh = 1/3 stop: đọc EV trên Sony',
  dek: 'Trên Sony, một nấc bánh = 1/3 stop = gấp ~1.26 lần ánh sáng. Ba nấc = 1 stop = gấp đôi. Đọc con số EV để biết bạn xoay bao nhiêu.',
  blocks: [
    {
      t: 'tldr',
      items: [
        'Stop là đơn vị chung: 1 stop = gấp đôi hoặc giảm một nửa ánh sáng.',
        '1/3 stop là bước mặc định Sony — xoay 3 nấc = 1 stop = gấp đôi ánh sáng.',
        'EV (Exposure Value) trên màn hình mô tả độ sáng của cặp khẩu–tốc; số cao hơn = sáng hơn.',
      ],
    },
    {
      t: 'p',
      text: '[[Stop và EV]] là khái niệm trừu tượng để so sánh ánh sáng qua ba yếu tố khác nhau: [[khẩu độ]], [[tốc độ màn trập]], và [[ISO]]. Chúng dùng đơn vị khác nhau nên người ta định nghĩa stop: +1 stop = gấp đôi ánh sáng, −1 stop = giảm một nửa, dù bạn thay khẩu, tốc hay ISO. Bài này giúp bạn đọc trên Sony.',
    },
    {
      t: 'figure',
      caption: 'Camera on stack of books. Ảnh: Markus Spiske markusspiske · CC0 · Wikimedia Commons',
    },
    { t: 'h', text: 'Sony dùng 1/3 stop làm bước nhỏ nhất' },
    {
      t: 'p',
      text: 'Khẩu trên Sony: F2, F2.8, F4, F5.6, F8... — cách ra đều. Nhưng giữa mỗi con số có 2 giá trị trung gian: F2 → F2.2 → F2.5 → F2.8 — ba bước = 1 stop. Tương tự với tốc độ và ISO. Bạn xoay bánh và cảm nhận 3 "nấc" nhỏ cho mỗi step lớn — đó là 1/3 stop. Tại sao? Vì ISO có bước 1 stop sẵn, nên để khẩu, tốc, ISO hợp nhất, Sony chọn 1/3 stop — đủ nhỏ tinh chỉnh, không quay liên tục.',
    },
    { t: 'h', text: 'Đọc EV trên màn hình' },
    {
      t: 'p',
      text: 'EV (Exposure Value) là con số duy nhất mô tả độ sáng của cặp khẩu–tốc ở ISO cố định. Ở chế độ M, nhìn thanh đo sáng — bên cạnh mũi có con số EV (ví dụ "EV 12.5"). Khi bạn xoay bánh: xoay 3 nấc ISO → EV tăng 1 số (từ 12 lên 13); xoay tốc từ 1/125 sang 1/100 (1 nấc) → EV tăng 1/3. Hai cấu hình EV nhau = cùng độ sáng.',
    },
    {
      t: 'callout',
      label: 'EV trên máy vs. "+EV" khi bù sáng',
      text: 'Trên màn hình "EV 14" = độ sáng cụ thể (F5.6–1/500 ở ISO 100). Khi bù sáng "+1 EV" = sáng hơn 1 stop so với mục tiêu của máy. Hai dùng từ "EV" nhưng ý khác — chỉ cần nhớ: trên máy xem được con số EV (độ sáng hiện tại); bù sáng là lệch so với máy tính toán.',
    },
    {
      t: 'table',
      head: ['Xoay bánh', 'Stop', 'EV'],
      caption: 'Từng nấc bánh = 1/3 stop = 1/3 EV = gấp ~1.26 lần.',
      rows: [
        ['0 nấc', '0 stop', '0 EV'],
        ['3 nấc', '1 stop', '1 EV'],
        ['6 nấc', '2 stop', '2 EV'],
        ['−3 nấc', '−1 stop', '−1 EV'],
      ],
    },
    {
      t: 'h',
      text: 'Câu hỏi thường gặp',
    },
    {
      t: 'p',
      text: 'Tại sao phải biết EV? Khi chụp phim trong studio (cảnh sáng cố định), bạn muốn tất cả tấm cùng EV, không chỉ "thanh đo ở 0" — nó giúp kiểm tra nhanh. Xoay 3 nấc = 1 stop = gấp 2? Đúng. Ba nấc nhân 1/3 stop = 1 stop. 1 stop = log₂(2) = gấp đúng 2. 1/3 stop = gấp 2^(1/3) ≈ 1.26 — không cần nhớ công thức, chỉ biết 3 nấc = gấp 2 là đủ.',
    },
    {
      t: 'checklist',
      label: 'Thực hành trên máy',
      items: [
        'Menu Setup → Exposure Step → tính 1/3 EV (nếu chưa)',
        'Chế độ M, xem thanh đo sáng — tìm con số EV',
        'Xoay ISO đúng 3 nấc — kiểm tra EV tăng 1 số',
        'Xoay ISO lại 3 nấc — kiểm tra EV tăng thêm 1',
        'Thử với khẩu: xoay từ F8 sang F5.6 (3 nấc) — EV tăng 1',
      ],
    },
  ],
  meta: {
    related: [
      { kind: 'knowledge', id: 'stop-va-ev' },
      { kind: 'knowledge', id: 'khau-do' },
      { kind: 'knowledge', id: 'toc-do-man-trap' },
      { kind: 'knowledge', id: 'iso' },
      { kind: 'knowledge', id: 'tam-giac-phoi-sang' },
      { kind: 'knowledge', id: 'bu-sang' },
    ],
    prerequisites: ['stop-va-ev'],
    concepts: [],
    sources: [
      {
        url: 'https://helpguide.sony.net/ilc/2110/v1/en/contents/TP1000616634.html',
        title: 'Sony Help Guide: Exposure Step',
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
