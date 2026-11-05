import type { Article } from '../../types'

export const page: Article = {
  id: 'chup-silhouette-tren-sony',
  kind: 'article',
  topic: 'composition',
  level: 'newbie',
  archetype: 'technique',
  read: '6 phút đọc',
  title: 'Chụp silhouette trên Sony: đo sáng điểm và bù sáng âm',
  dek: 'Silhouette là chủ thể đen tuyền trước nền trời sáng. Ba cài đặt Sony và kỹ thuật đo sáng sẽ giúp bạn tạo ảnh.',

  blocks: [
    {
      t: 'tldr',
      items: [
        'Đo sáng Điểm vào vùng trời sáng nhất, cài bù −1.5 đến −2.5 EV.',
        'Chủ thể phải nằm trọn trên nền trời, không dính vào cây hay nhà phía sau.',
        'Chọn dáng có đường viền rõ: tay giơ, chân bước, mặt profile — không ép sát thân.',
      ],
    },
    {
      t: 'p',
      text: '[[Silhouette]] là [[đo sáng]] theo nền trời sáng để chủ thể thành một khối đen tuyền; ảnh sống nhờ hình dáng, không nhờ chi tiết. [[Bù sáng]] âm là khoá để đạt hiệu ứng này. Đây là một trong những cách nhanh nhất để tạo ảnh có ảnh hưởng mà người mới cầm máy có thể học trong một buổi chiều.',
    },
    {
      t: 'figure',
      caption: 'Silhouette tối giản: hình dáng và viền rõ. Ảnh: Ykphotography · CC BY-SA 4.0 · Wikimedia Commons',
    },
    {
      t: 'h',
      text: 'Cài đặt Sony Alpha để chụp silhouette',
    },
    {
      t: 'menu',
      old: 'MENU → Camera Settings1 → Exposure → Metering Mode → Spot',
      new: 'MENU → Exposure → Metering → Spot: Standard',
    },
    {
      t: 'callout',
      label: 'Nếu máy bạn có Creative Look',
      text: 'Chọn Creative Look VV (Vivid) để trời rực màu hơn. Điều chỉnh cân bằng trắng sang Trời nhiều mây hoặc Bóng râm để trời ngả vàng cam — không nên để Auto vì khó kiểm soát.',
    },
    {
      t: 'h',
      text: 'Cách chụp silhouette từng bước',
    },
    {
      t: 'checklist',
      label: 'Trước khi bấm chụp',
      items: [
        'Tắt đèn flash và tắt DRO/Auto HDR (chúng sẽ kéo sáng chủ thể lên)',
        'Đặt máy ở chế độ M hoặc A với bù sáng −1.5 đến −2.5 EV',
        'Chế độ lấy nét AF-S + Điểm; nếu máy khó bắt nét thì chuyển sang MF (lấy nét bằng tay)',
      ],
    },
    {
      t: 'p',
      text: 'Bước 1: Đặt chủ thể giữa mình và nguồn sáng — mặt trời, cửa sổ sáng, hay đèn sân khấu. Hạ máy xuống thấp, hướng lên để chủ thể nằm trọn trên nền trời, không có cây cối hay nhà cửa phía sau. Bước 2: Hướng khẩu kính lên vùng trời sáng nhất gần đầu chủ thể (không chấm vào mặt trời trực tiếp). Bấm nửa cò để đo sáng. Bước 3: Chọn dáng có đường viền rõ ràng: tay người mẫu giơ, chân bước, mặt nhìn sang hông (profile). Tránh ép tay sát thân vì sẽ biến thành một khối đen khó đọc.',
    },
    {
      t: 'table',
      head: ['Nguồn sáng', 'Bù sáng khuyến nghị', 'Ghi chú'],
      rows: [
        ['Mặt trời buổi sáng/chiều', '−1.5 đến −2.0 EV', 'Trời sáng, viền chủ thể rõ'],
        ['Cửa sổ trong phòng', '−1.5 EV', 'Nền có thể còn hơi sáng'],
        ['Hoàng hôn (golden hour)', '−2.5 EV', 'Nền vàng cam rực rỡ'],
      ],
      caption: 'Cài đặt bù sáng theo điều kiện ánh sáng. Điều chỉnh theo biểu đồ histogram trên máy để tránh cháy trời.',
    },
    {
      t: 'h',
      text: 'Mẹo khi chụp thực tế',
    },
    {
      t: 'p',
      text: 'Luôn kiểm tra biểu đồ (histogram) sau khi chụp: trời không nên cháy trắng ở cạnh phải. Chụp RAW nếu máy cho phép — khi hậu kỳ bạn có nhiều không gian để điều chỉnh. Hãy chụp 5–10 tấm liên tục với các dáng khác nhau; tỷ lệ đạt thường khoảng 2/10 là bình thường.',
    },
    {
      t: 'checklist',
      label: 'Tiêu chí một tấm silhouette tốt',
      items: [
        'Viền chủ thể rõ ràng, đọc được dáng người (tay hay chân)',
        'Nền trời có màu (vàng cam, hồng, xanh), không cháy trắng',
        'Chủ thể không bị che bởi vật khác hoặc dính vào cây cối phía sau',
      ],
    },
  ],

  meta: {
    sources: [
      {
        url: 'https://helpguide.sony.net/ilc/2110/v1/en/contents/TP1000616628.html',
        title: 'Metering Mode (ILCE-7M4)',
        publisher: 'Sony Help Guide',
        checkedAt: '2026-11-05',
        scope: 'ILCE-7M4',
      },
      {
        url: 'https://helpguide.sony.net/ilc/2110/v1/en/contents/TP1000640168.html',
        title: 'Exposure Compensation (ILCE-7M4)',
        publisher: 'Sony Help Guide',
        checkedAt: '2026-11-05',
        scope: 'ILCE-7M4',
      },
      {
        url: 'https://helpguide.sony.net/ilc/2110/v1/en/contents/TP1000640840.html',
        title: 'White Balance (ILCE-7M4)',
        publisher: 'Sony Help Guide',
        checkedAt: '2026-11-05',
        scope: 'ILCE-7M4',
      },
    ],
    related: [
      { kind: 'knowledge', id: 'silhouette' },
      { kind: 'knowledge', id: 'do-sang' },
      { kind: 'knowledge', id: 'bu-sang' },
      { kind: 'knowledge', id: 'can-bang-trang-va-nhiet-do-mau' },
    ],
    prerequisites: [],
    concepts: [],
    authorName: null,
    reviewedAt: null,
    section: null,
    order: null,
  },
}
