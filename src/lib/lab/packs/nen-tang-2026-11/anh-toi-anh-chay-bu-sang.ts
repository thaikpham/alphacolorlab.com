import type { Article } from '../../types'

export const page: Article = {
  id: 'anh-toi-anh-chay-bu-sang',
  kind: 'article',
  topic: 'exposure',
  level: 'newbie',
  archetype: 'explainer',
  read: '5 phút đọc',
  title: 'Ảnh tối hay cháy sáng? Xoay bù sáng và đọc biểu đồ',
  dek: 'Xoay bánh bù sáng để sửa độ sáng ngay lúc chụp — rồi dùng biểu đồ để chắc bạn không mất chi tiết.',
  blocks: [
    {
      t: 'tldr',
      items: [
        'Xoay bánh bù sáng (hoặc nút ▼ / menu Exposure Comp.) để sáng lên (+) hay tối đi (−).',
        'Mỗi nấc = 1/3 stop; ba nấc = 1 stop = gấp đôi hay giảm một nửa ánh sáng.',
        'Kiểm tra biểu đồ (Histogram): đỉnh sát mép phải = cháy, sát trái = tối quá.',
      ],
    },
    {
      t: 'p',
      text: '[[Bù sáng]] là lệnh bảo máy chụp sáng hơn hoặc tối hơn so với mục tiêu của [[đo sáng]]. Máy tính toán một mức trung bình, nhưng cảnh thực tế khác — cảnh trắng cần bù +, cảnh đen cần bù −. Bù sáng không phải sửa sau — nó chỉnh máy lúc chụp để ảnh ra từ máy đã gần đúng.',
    },
    {
      t: 'figure',
      caption: 'Backlighting creates strong contrast — foreground darker than sky. Proper exposure compensation can reveal shadow detail. Ảnh: Staff Sgt. Daniel Love · Public domain · Wikimedia Commons',
    },
    { t: 'h', text: 'Xoay bù sáng' },
    {
      t: 'p',
      text: 'Đa số máy Sony có bánh bù sáng riêng ở thân (a7 series). Xoay về + để sáng, − để tối. Mỗi nấc = 1/3 stop — nhỏ đủ tinh chỉnh, đủ lớn thấy ngay hiệu quả. Nếu không có bánh riêng, gán Exposure Comp. vào nút Custom để nhanh.',
    },
    { t: 'h', text: 'Đọc biểu đồ' },
    {
      t: 'p',
      text: 'Biểu đồ (Histogram) là đồ thị trên màn hình — mép trái tối nhất, mép phải sáng nhất. Đỉnh sát mép phải = cháy sáng (mất chi tiết sáng). Đỉnh sát mép trái = tối quá (mất chi tiết tối). Ảnh đúng sáng = đỉnh phân tán không dính mép. Nhấn DISP (Display) lặp lại để xem biểu đồ khi xem ảnh.',
    },
    {
      t: 'table',
      head: ['Biểu đồ', 'Ý nghĩa', 'Cách sửa'],
      caption: 'Đọc biểu đồ để kiểm tra không mất chi tiết.',
      rows: [
        ['Đỉnh sát trái', 'Tối quá, mất chi tiết tối', 'Bù + (sáng lên)'],
        ['Đỉnh sát phải', 'Cháy sáng, mất chi tiết sáng', 'Bù − (tối đi)'],
        ['Đỉnh giữa', 'Bình thường, không mất chi tiết', 'Đúng rồi'],
      ],
    },
    {
      t: 'callout',
      label: 'Bù sáng khác gì hậu kỳ',
      text: 'Bù sáng là câu lệnh cho máy chụp khác — thay đổi khẩu, tốc, ISO tùy chế độ. Sửa hậu kỳ là kéo thanh độ sáng sau khi chụp. Bù sáng trước; sửa sau. Ảnh nhoè hay cháy không cứu được ở hậu kỳ — bù sáng từ trước là cách tránh.',
    },
    {
      t: 'h',
      text: 'Câu hỏi thường gặp',
    },
    {
      t: 'p',
      text: 'Sao lại 1/3 stop? Vì ISO có bước 1 stop, nên Sony chọn 1/3 stop làm đơn vị chính — đủ nhỏ tinh chỉnh mà không quay liên tục. Nếu xoay bù +3 mà vẫn tối? Nguyên nhân không bù sáng — đó cảnh quá tối. Nâng ISO, mở khẩu lớn hơn, hoặc hạ tốc — ba yếu tố của [[Tam giác phơi sáng|tam giác phơi sáng]]. Bạn đã ở trần bù sáng (phạm vi ±2 hoặc ±3 tùy máy); máy không thể sáng hơn được.',
    },
    {
      t: 'checklist',
      label: 'Sau khi chụp',
      items: [
        'Nhìn ảnh trên màn hình máy',
        'Nhấn DISP để xem biểu đồ',
        'Nếu đỉnh sát trái = bù + lần sau',
        'Nếu đỉnh sát phải = bù − lần sau',
        'Xoay từ từng 1–2 nấc để tìm mức vừa',
      ],
    },
  ],
  meta: {
    related: [
      { kind: 'knowledge', id: 'bu-sang' },
      { kind: 'knowledge', id: 'do-sang' },
      { kind: 'knowledge', id: 'tam-giac-phoi-sang' },
    ],
    prerequisites: ['bu-sang'],
    concepts: [],
    sources: [
      {
        url: 'https://helpguide.sony.net/ilc/2110/v1/en/contents/TP1000640168.html',
        title: 'Sony Help Guide: Exposure Comp.',
        checkedAt: '2026-11-05',
        scope: 'a7 IV, a6700',
      },
      {
        url: 'https://helpguide.sony.net/ilc/2110/v1/en/contents/TP1000657946.html',
        title: 'Sony Help Guide: Histogram Display',
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
