import type { Article } from '../../types'

export const page: Article = {
  id: 'phoi-sang-dai-tren-sony',
  kind: 'article',
  topic: 'exposure',
  level: 'mid',
  archetype: 'technique',
  read: '7 phút đọc',
  title: 'Phơi sáng dài trên Sony: chế độ M, BULB, ISO 100',
  dek: 'Phơi sáng dài ghi chuyển động thành vệt mượt: nước như sương, mây kéo dài, đèn xe thành dải sáng.',

  blocks: [
    {
      t: 'tldr',
      items: [
        'Chế độ M, ISO 100, khẩu F8–F11, tốc độ 5–30s (hoặc BULB cho thời gian dài hơn).',
        'Ban ngày dùng kính lọc ND64 hoặc ND1000; lấy nét MF hoặc AF-S rồi khoá nét.',
        'Tắt SteadyShot khi gắn chân máy; dùng Hẹn giờ 2s hoặc điều khiển từ xa để tránh rung.',
      ],
    },
    {
      t: 'p',
      text: '[[Phơi sáng dài]] là mở [[tốc độ màn trập]] nhiều giây để ghi chuyển động thành vệt mượt: nước như sương, mây kéo dài, đèn xe thành dải sáng, người qua lại biến mất. [[Chế độ chụp P-A-S-M|Chế độ M]] cho kiểm soát đầy đủ. Kỹ thuật này yêu cầu chân máy vững chắc nhưng kết quả rất ấn tượng.',
    },
    {
      t: 'figure',
      caption: 'Vệt sáng từ chuyển động: phơi sáng dài ghi thời gian. Ảnh: NASA/Don Pettit · Public domain · Wikimedia Commons',
    },
    {
      t: 'h',
      text: 'Cài đặt Sony Alpha cho phơi sáng dài',
    },
    {
      t: 'menu',
      old: 'MENU → Camera Settings2 → SteadyShot → Off',
      new: 'MENU → Shooting → Image Stabilization → SteadyShot → Off',
    },
    {
      t: 'menu',
      old: 'MENU → Camera Settings1 → Long Exposure NR → On',
      new: 'MENU → Shooting → Image Quality → Long Exposure NR → On',
    },
    {
      t: 'callout',
      label: 'Tắt SteadyShot khi sử dụng chân máy',
      text: 'Với chân máy vững chắc, chống rung có thể tự gây rung. Tắt SteadyShot trong menu hoặc bằng công tắc trên ống kính; ống có công tắc thì chỉ công tắc có tác dụng.',
    },
    {
      t: 'h',
      text: 'Quy trình chụp phơi sáng dài từng bước',
    },
    {
      t: 'p',
      text: 'Bước 1: Thiết lập chân máy vững chắc. Nếu trời gió, treo balo vào móc giữa chân máy để tăng trọng lượng. Bước 2: Bố cục ảnh và lấy nét *trước khi gắn ND filter* — với kính lọc ND tối, khung ngắm gần như tối đen. Bước 3: Gắn kính ND, che kính ngắm để ánh sáng không lọt vào. Bước 4: Chọn tốc độ phơi phù hợp với hiệu ứng muốn có. Bước 5: Dùng Hẹn giờ 2s hoặc điều khiển từ xa để bấm chụp — tránh chạm trực tiếp vào máy để không rung.',
    },
    {
      t: 'table',
      head: ['Hiệu ứng muốn', 'Tốc độ phơi khuyến nghị', 'Điều kiện ánh sáng'],
      rows: [
        ['Vệt đèn xe nhẹ', '5–15s', 'Buổi tối, đường phố có đèn'],
        ['Nước như sương, mây kéo dài', '15–30s', 'Hoàng hôn hoặc sáng sớm'],
        ['Hiệu ứng mạnh (mây chảy, con người mất)', '30s+', 'Dùng BULB + ND1000'],
      ],
      caption: 'Tốc độ phơi theo hiệu ứng mong muốn. Để phơi trên 1 phút, dùng BULB và đếm giây với điều khiển từ xa.',
    },
    {
      t: 'h',
      text: 'Mẹo thực hành phơi sáng dài',
    },
    {
      t: 'p',
      text: 'Giờ xanh (khoảng 20–30 phút sau hoàng hôn) là thời điểm dễ nhất: đủ sáng để không cần ND, đủ tối để phơi 10–30s. Kiểm tra biểu đồ sau mỗi tấm để tránh cháy vùng đèn. Để Long Exposure NR ở On để máy trừ nhiễu của cảm biến. Chức năng này mất thêm thời gian đúng bằng thời gian phơi: phơi 30s thì chờ thêm 30s.',
    },
    {
      t: 'checklist',
      label: 'Khi đánh giá ảnh phơi sáng dài',
      items: [
        'Vật đứng yên (nền, đất) nét hoàn toàn, không bị rung chân máy',
        'Chuyển động được ghi thành vệt mượt có mục đích (nước, mây, đèn xe)',
        'Vùng đèn không cháy trắng',
        'Vệt nhòe theo hướng chuyển động tự nhiên',
      ],
    },
  ],

  meta: {
    sources: [
      {
        url: 'https://helpguide.sony.net/ilc/2110/v1/en/contents/TP1000617337.html',
        title: 'Shutter Priority (ILCE-7M4)',
        publisher: 'Sony Help Guide',
        checkedAt: '2026-11-05',
        scope: 'ILCE-7M4',
      },
      {
        url: 'https://helpguide.sony.net/ilc/2110/v1/en/contents/TP1000640135.html',
        title: 'BULB shooting (ILCE-7M4)',
        publisher: 'Sony Help Guide',
        checkedAt: '2026-11-05',
        scope: 'ILCE-7M4',
      },
    ],
    related: [
      { kind: 'knowledge', id: 'phoi-sang-dai' },
      { kind: 'knowledge', id: 'toc-do-man-trap' },
      { kind: 'knowledge', id: 'che-do-chup-p-a-s-m' },
    ],
    prerequisites: [],
    concepts: [],
    authorName: null,
    reviewedAt: null,
    section: null,
    order: null,
  },
}
