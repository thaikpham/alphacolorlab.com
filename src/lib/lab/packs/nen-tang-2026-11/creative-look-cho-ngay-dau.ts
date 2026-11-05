import type { Article } from '../../types'

export const page: Article = {
  id: 'creative-look-cho-ngay-dau',
  kind: 'article',
  topic: 'color',
  level: 'newbie',
  archetype: 'explainer',
  read: '5 phút',
  title: 'Creative Look cho ngày đầu: chọn cái nào, chỉnh gì',
  dek: 'Look giúp máy Sony tô màu ảnh ngay lúc chụp: chọn Look, chỉnh năm thông số chính, bắt đầu chụp.',
  updatedAt: '2026-11-06',
  blocks: [
    {
      t: 'tldr',
      items: [
        'Creative Look là bộ cài sẵn máy để tô màu JPEG trực tiếp khi chụp.',
        'Chọn Look (Standard hoặc Portrait), rồi chỉnh năm thông số chính: Contrast, Highlights, Shadows, Saturation, Clarity.',
        'Cấu hình cơ bản: Contrast +1, Highlights −6, Shadows +3, Saturation 0, Clarity 0.',
      ],
    },
    {
      t: 'p',
      text: '[[Creative Look]] là bộ cài sẵn để tô màu ảnh ngay trên máy khi bạn chụp JPEG hoặc HEIF. Mỗi Look (Standard, Portrait, Vivid) có nhân cách màu riêng. Bạn chọn Look rồi chỉnh thông số theo cách riêng—tất cả được máy lưu và dùng cho ảnh tiếp theo cho tới khi đổi.',
    },
    {
      t: 'figure',
      caption: 'Bộ cấu hình Creative Look cơ bản trên máy Sony. Ảnh: Unknown Artist · CC0 1.0 · Wikimedia Commons',
    },
    {
      t: 'h',
      text: 'Chọn Look từ menu Chụp',
    },
    {
      t: 'p',
      text: 'Vào menu Chụp rồi tìm Creative Look. Máy sẽ hiện các bộ Look có sẵn (Standard, Portrait, Vivid, v.v.). Chọn một cái để bắt đầu, rồi bạn có thể chỉnh từng thông số sau.',
    },
    {
      t: 'menu',
      old: 'MENU → Shoot (hoặc Chụp Ảnh) → Creative Look',
      new: 'MENU → Shoot → Creative Look',
    },
    {
      t: 'h',
      text: 'Năm thông số chính để chỉnh',
    },
    {
      t: 'p',
      text: 'Sau khi chọn một Look, bạn chỉnh từng thông số bằng nút mũi tên. Năm thông số chính là:',
    },
    {
      t: 'table',
      caption: 'Thông số nhanh',
      head: ['Thông số', 'Khoảng', 'Ý nghĩa'],
      rows: [
        ['Contrast', '−9 đến +9', 'Sắc nét và tương phản'],
        ['Highlights', '−9 đến +9', 'Chi tiết vùng sáng'],
        ['Shadows', '−9 đến +9', 'Chi tiết vùng tối'],
        ['Saturation', '−9 đến +9', 'Đậm nhạt màu sắc'],
        ['Clarity', '0 đến 9', 'Sáng chi tiết trung bình'],
      ],
    },
    {
      t: 'h',
      text: 'Cấu hình sơ lược cho chân dung',
    },
    {
      t: 'p',
      text: 'Bắt đầu từ Look Portrait, chỉnh: Contrast +1 (sắc nét), Highlights −6 (mềm vùng sáng), Shadows +3 (tăng chi tiết tối), Saturation 0 (màu tự nhiên), Clarity 0. Cấu hình này cân bằng độ sắc và mềm mại, phù hợp chân dung.',
    },
    {
      t: 'h',
      text: 'RAW hay JPEG, Look có ảnh hưởng?',
    },
    {
      t: 'p',
      text: 'Chụp JPEG hoặc HEIF thì Look quyết định màu. Chụp RAW thì Look chỉ lưu vào metadata làm tham khảo; phần mềm như Lightroom dùng nó làm gợi ý khi chỉnh sau.',
    },
    {
      t: 'checklist',
      label: 'Bắt đầu với Creative Look',
      items: [
        'Vào MENU → Shoot → Creative Look.',
        'Chọn Portrait hoặc Standard.',
        'Ấn vào Chỉnh để mở các thông số.',
        'Thử chỉnh Contrast và Highlights để cảm nhận hiệu ứng.',
        'Tắt menu để lưu cấu hình.',
        'Chụp vài tấm để kiểm tra màu trên JPEG ngay trong máy.',
      ],
    },
  ],
  meta: {
    related: [
      { kind: 'knowledge', id: 'creative-look' },
      { kind: 'knowledge', id: 'can-bang-trang-va-nhiet-do-mau' },
      { kind: 'knowledge', id: 'raw-jpeg-va-heif' },
    ],
    prerequisites: ['creative-look'],
    concepts: [],
    sources: [
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
