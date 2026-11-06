import type { Article } from '../../types'

export const page: Article = {
  id: 'khung-doc-hay-ngang',
  kind: 'article',
  topic: 'composition',
  level: 'newbie',
  archetype: 'technique',
  read: '5 phút đọc',
  title: 'Khung dọc hay ngang: quyết định trước khi bấm',
  dek: 'Khung ngang (landscape) và khung dọc (portrait) kể hai câu chuyện khác nhau của cùng một chủ thể. Aspect Ratio trên máy cho bạn thử thêm khung vuông hay khung rộng.',
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
      text: '[[Bố cục]] bắt đầu từ [[Góc máy và khung hình]]. Chiều của khung không chỉ là sở thích: nó quyết định mắt người xem đi theo chiều nào, và đó là một phần của câu chuyện.',
    },
    {
      t: 'figure',
      caption: 'Khung dọc buộc phải cắt bối cảnh bên cạnh, để chủ thể nổi bật. Ảnh: Lenny K Photography · CC BY 2.0 · Wikimedia Commons',
    },
    {
      t: 'p',
      text: '**Khung ngang** (Landscape): chiều rộng lớn hơn chiều cao — là chế độ mặc định của máy ảnh. Nó tốt cho cảnh rộng, bầu trời, đường chân trời, nhóm người, hay bất cứ thứ gì yêu cầu không gian ngang. Mắt người xem quét từ trái sang phải, kéo dài thời gian nhìn. **Khung dọc** (Portrait): chiều cao lớn hơn chiều rộng — buộc phải cắt bối cảnh bên cạnh. Nó tốt cho [[Chủ thể chính|chủ thể chính]] như chân dung, tòa nhà cao, bất cứ chủ thể dọc nào, hoặc khi bạn muốn bối cảnh không chiếm chỗ. Mắt người xem cô đặc và tập trung hơn.',
    },
    {
      t: 'h',
      text: 'Aspect Ratio: đổi tỷ lệ khung ngay trên máy',
    },
    {
      t: 'menu',
      old: 'MENU → Camera Settings1 → Aspect Ratio',
      new: 'MENU → Shooting → Image Quality → Aspect Ratio',
    },
    {
      t: 'p',
      text: 'Aspect Ratio không xoay khung dọc hay ngang — đó là việc của tay bạn. Nó cho bạn chọn tỷ lệ 3:2, 4:3, 16:9 hay 1:1 và thấy ngay trong kính ngắm cái gì bị cắt. Đổi tỷ lệ vài lần trong một buổi là cách rẻ nhất để biết mình thích kể chuyện trong khung nào.',
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
      label: 'Ảnh được ghi đúng tỷ lệ đã chọn',
      text: 'Ảnh JPEG được ghi đúng tỷ lệ bạn chọn, nên hãy chọn trước khi bấm chứ đừng trông vào hậu kỳ. Thử vài tỷ lệ trong một buổi để xem cái nào hợp với mắt mình.',
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
      { kind: 'knowledge', id: 'goc-may-va-khung-hinh' },
      { kind: 'knowledge', id: 'chu-the-chinh' },
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
