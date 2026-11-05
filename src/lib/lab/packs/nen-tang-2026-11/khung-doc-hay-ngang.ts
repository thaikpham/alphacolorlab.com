import type { Article } from '../../types'

export const page: Article = {
  id: 'khung-doc-hay-ngang',
  kind: 'article',
  topic: 'composition',
  level: 'newbie',
  archetype: 'technique',
  read: '5 phút đọc',
  title: 'Khung dọc hay ngang: quyết định trước khi bấm',
  dek: 'Khung ngang (landscape) và khung dọc (portrait) kể hai câu chuyện khác nhau của cùng một chủ thể. Aspect Ratio trên máy giúp bạn nhìn trước kết quả.',
  updatedAt: '2026-11-06',
  blocks: [
    {
      t: 'tldr',
      items: [
        'Khung ngang: mắt quét trái phải — tốt cho bối cảnh rộng, nhóm người, phong cảnh.',
        'Khung dọc: mắt nhìn từ trên xuống — tốt cho chân dung, tòa nhà cao, hành động.',
        'Dùng Aspect Ratio trong máy để xem preview trước — cách dễ nhất để tập lựa chọn khung.',
      ],
    },
    {
      t: 'p',
      text: '[[Góc máy và khung hình]] bao gồm cả chiều của khung. Khung dọc hoặc ngang không chỉ là sở thích — nó quyết định mắt người xem nhìn ảnh theo chiều nào, và đó là một phần của câu chuyện.',
    },
    {
      t: 'h',
      text: 'Khung ngang (Landscape): bối cảnh rộng',
    },
    {
      t: 'p',
      text: 'Khung ngang — chiều rộng lớn hơn chiều cao — là chế độ mặc định của máy ảnh. Nó tốt cho cảnh rộng, bầu trời, đường chân trời, nhóm người, hay bất cứ thứ gì yêu cầu không gian ngang. Mắt người xem quét từ trái sang phải, kéo dàn thời gian.',
    },
    {
      t: 'h',
      text: 'Khung dọc (Portrait): chủ thể nổi bật',
    },
    {
      t: 'p',
      text: 'Khung dọc — chiều cao lớn hơn chiều rộng — buộc phải cắt bối cảnh bên cạnh. Nó tốt cho chân dung, tòa nhà cao, bất cứ chủ thể dọc nào, hoặc khi bạn muốn bối cảnh không chiếm chỗ. Mắt người xem cô đặc và tập trung hơn.',
    },
    {
      t: 'h',
      text: 'Aspect Ratio: nhìn preview trước khi chụp',
    },
    {
      t: 'menu',
      old: 'MENU → Camera Settings1 → File Format → Aspect Ratio',
      new: 'MENU → Setup → File Format → Aspect Ratio',
    },
    {
      t: 'p',
      text: 'Khi bạn đặt Aspect Ratio, máy sẽ hiển thị trong kính ngắm hoặc live view cách khung hình sẽ trông như thế nào khi bạn chụp. Cái gì sẽ bị cắt, cái gì sẽ giữ lại. Đây là cách tốt nhất để tập lựa chọn khung trước khi bấm chụp.',
    },
    {
      t: 'table',
      head: ['Aspect Ratio', 'Hình dạng', 'Tốt cho'],
      rows: [
        ['16:9', 'Ngang lưỡng lự', 'Video, bố cục ngang rộng'],
        ['3:2', 'Ngang chuẩn', 'Bối cảnh, hầu hết tình huống'],
        ['4:3', 'Cân bằng', 'Chân dung cân bằng'],
        ['1:1', 'Hình vuông', 'Mạng xã hội, bố cục cô đặc'],
      ],
      caption: 'Các Aspect Ratio phổ thông. Máy có thể có tùy chọn khác.',
    },
    {
      t: 'callout',
      label: 'Lưu ý: Aspect Ratio không cắt ảnh, chỉ thay đổi preview',
      text: 'Khi bạn đặt Aspect Ratio rồi chụp, máy vẫn ghi toàn bộ cảnh — nó chỉ hiển thị preview theo tỷ lệ đó. Bạn có thể cắt lại khi hậu kỳ. Vậy nên đừng sợ thử các Aspect Ratio khác nhau để xem cái nào hợp.',
    },
    {
      t: 'h',
      text: 'Bài tập: chuyển khung trong một buổi chụp',
    },
    {
      t: 'p',
      text: 'Đến một địa điểm có nhiều thứ để chụp. Chụp năm lần khung ngang, năm lần khung dọc. Xem lại: khung nào kể câu chuyện tốt hơn cho từng cảnh? Bạn thích khung nào hơn — theo tự nhiên hay bạn phải học?',
    },
    {
      t: 'h',
      text: 'Mạng xã hội và hình vuông (1:1)',
    },
    {
      t: 'p',
      text: 'Nếu bạn lên ảnh lên Instagram hay TikTok, hãy chụp ở Aspect Ratio 1:1 (hình vuông) từ đầu. Cách này tránh bị cắt tình cờ, và ảnh sẽ chiếm hết không gian feed. Hình vuông còn buộc bố cục cô đặc — mắt không có chỗ phân tán.',
    },
    {
      t: 'checklist',
      label: 'Trước khi chụp: lựa chọn khung',
      items: [
        'Chủ thể cao hay rộng? Chọn khung dọc hay ngang.',
        'Bối cảnh quan trọng hay chủ thể quan trọng? Khung dọc cắt bối cảnh, khung ngang giữ nó.',
        'Chụp cho mạng xã hội? Thử hình vuông (1:1).',
      ],
    },
  ],
  meta: {
    related: [
      { kind: 'knowledge', id: 'bo-cuc' },
      { kind: 'knowledge', id: 'chu-the-chinh' },
      { kind: 'knowledge', id: 'cai-dat-nhanh-truoc-buoi-chup' },
    ],
    prerequisites: ['goc-may-va-khung-hinh'],
    concepts: [],
    sources: [
      {
        url: 'https://helpguide.sony.net/ilc/2110/v1/en/contents/TP1000640182.html',
        title: 'Aspect Ratio',
        publisher: 'Sony',
        checkedAt: '2026-11-05',
        scope: 'ILCE-7M4',
      },
    ],
    authorName: null,
    reviewedAt: null,
    section: null,
    order: null,
  },
}
