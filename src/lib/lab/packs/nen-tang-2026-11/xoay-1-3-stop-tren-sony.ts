import type { Article } from '../../types'

export const page: Article = {
  id: 'xoay-1-3-stop-tren-sony',
  kind: 'article',
  topic: 'exposure',
  level: 'mid',
  archetype: 'explainer',
  read: '5 phút đọc',
  title: 'Xoay một nấc bánh = 1/3 stop: đọc M.M. trên Sony',
  dek: 'Trên Sony, một nấc bánh = 1/3 stop = gấp ~1.26 lần ánh sáng. Ba nấc = 1 stop = gấp đôi. Đọc M.M. ở chế độ M để biết bạn xoay bao nhiêu.',
  blocks: [
    {
      t: 'tldr',
      items: [
        'Stop là đơn vị chung: 1 stop = gấp đôi hoặc giảm một nửa ánh sáng.',
        '1/3 stop là bước mặc định Sony — xoay 3 nấc = 1 stop = gấp đôi ánh sáng.',
        'M.M. ở chế độ M cho biết bạn đang lệch bao nhiêu stop so với mức máy đo.',
      ],
    },
    {
      t: 'p',
      text: '[[Stop và EV]] là khái niệm trừu tượng để so sánh ánh sáng qua ba yếu tố khác nhau: [[khẩu độ]], [[tốc độ màn trập]], và [[ISO]]. Chúng dùng đơn vị khác nhau nên người ta định nghĩa stop: +1 stop = gấp đôi ánh sáng, −1 stop = giảm một nửa, dù bạn thay khẩu, tốc hay ISO. Bài này chỉ cách đọc nó trên Sony.',
    },
    {
      t: 'figure',
      caption: 'Mặt trên a7R IV: bánh xe bù sáng và các bánh xe chỉnh khẩu, tốc. Ảnh: Franz van Duns · CC BY-SA 4.0 · Wikimedia Commons',
    },
    { t: 'h', text: 'Sony dùng 1/3 stop làm bước nhỏ nhất' },
    {
      t: 'p',
      text: 'Khẩu trên Sony: F2, F2.8, F4, F5.6, F8... — cách ra đều. Nhưng giữa mỗi con số có 2 giá trị trung gian: F2 → F2.2 → F2.5 → F2.8 — ba bước = 1 stop. Tương tự với tốc độ và ISO. Bạn xoay bánh và cảm nhận 3 "nấc" nhỏ cho mỗi step lớn — đó là 1/3 stop. Ba đại lượng cùng một nấc 1/3 stop, nên đổi một nấc khẩu lấy một nấc tốc là vừa khít.',
    },
    { t: 'h', text: 'Đọc M.M. trên màn hình ở chế độ M' },
    {
      t: 'p',
      text: 'Ở chế độ M với ISO cố định, Sony hiện M.M. (Metered Manual): số lệch giữa cặp khẩu–tốc–ISO bạn đặt và mức máy đo. 0 là đúng sáng theo máy, về phía + là sáng hơn, về phía − là tối hơn. Xoay ISO 3 nấc, M.M. nhảy đúng 1.0; xoay tốc từ 1/125 sang 1/100 (1 nấc), M.M. nhích 0.3. Hai cấu hình cùng M.M. thì cùng độ sáng.',
    },
    {
      t: 'callout',
      label: 'M.M. ở chế độ M và +EV khi bù sáng',
      text: 'M.M. +1.0 ở chế độ M và bù sáng +1 EV ở chế độ A đều nghĩa là sáng hơn mức máy đo một stop. Khác nhau ở chỗ ai chỉnh: ở M bạn tự xoay khẩu, tốc, ISO cho lệch đi; ở A bạn xoay bánh bù sáng và máy tự đổi tốc.',
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
      text: 'Tại sao phải biết EV? Khi chụp phim trong studio (cảnh sáng cố định), bạn muốn tất cả tấm cùng cặp khẩu–tốc–ISO; M.M. cho biết ngay cảnh đã đổi sáng chưa. Xoay 3 nấc = 1 stop = gấp 2? Đúng. Ba nấc nhân 1/3 stop = 1 stop. 1 stop = log₂(2) = gấp đúng 2. 1/3 stop = gấp 2^(1/3) ≈ 1.26 — không cần nhớ công thức, chỉ biết 3 nấc = gấp 2 là đủ.',
    },
    {
      t: 'checklist',
      label: 'Thực hành trên máy',
      items: [
        'Chế độ M, ISO cố định, xem M.M. trên màn hình',
        'Xoay ISO đúng 3 nấc — M.M. tăng 1.0',
        'Xoay ISO lại 3 nấc — M.M. tăng thêm 1.0',
        'Thử với khẩu: xoay từ F8 sang F5.6 (3 nấc) — M.M. tăng 1.0',
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
