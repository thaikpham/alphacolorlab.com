import type { Article } from '../../types'

export const page: Article = {
  id: 'af-s-af-c-dmf-chon-mot',
  kind: 'article',
  topic: 'af',
  level: 'newbie',
  archetype: 'explainer',
  read: '7 phút đọc',
  title: 'Focus Mode: chọn AF-S, AF-C hay DMF cho tình huống nào',
  dek: 'Ba chế độ lấy nét của Sony, mỗi cái cho một công việc khác. Hiểu được sự khác biệt là bước đầu chọn đúng trong lúc gấp khi chụp.',
  updatedAt: '2026-11-06',
  blocks: [
    {
      t: 'tldr',
      items: [
        'AF-S (Single AF): lấy nét một lần, không bao giờ thay đổi. Chân dung, phong cảnh, khi chủ thể yên tĩnh.',
        'AF-C (Continuous AF): bám liên tục, thay đổi nút lấy nét mỗi millisecond. Chủ thể di chuyển, thể thao, hoặc panning.',
        'DMF (Direct Manual Focus): giữ auto-focus nhưng bạn có thể tay xoay vòng kính để sửa nét nhanh mà không chuyển sang chế độ thủ công.',
      ],
    },
    {
      t: 'p',
      text: '[[Lấy nét]] là công việc chọn khoảng cách mà máy sẽ để nét. Máy có ba cách để làm: cố định nó khi bạn bấm nút (AF-S), tiếp tục điều chỉnh trong lúc chụp (AF-C), hoặc cho phép bạn can thiệp bằng tay vào khoảng cách đó khi máy đã bắt được (DMF). Mỗi cách là cho một tình huống khác.',
    },
    {
      t: 'figure',
      caption: 'Ba chế độ lấy nét: AF-S khóa nét tại thời điểm bấm, AF-C bám liên tục, DMF cho phép sửa nét thủ công. Ảnh: Phiarc · CC BY-SA 4.0 · Wikimedia Commons',
    },
    {
      t: 'h',
      text: 'AF-S: lấy nét và khóa'
    },
    {
      t: 'p',
      text: 'Bạn bấm nút lấy nét, máy bắt được khoảng cách, xong — nét sẽ không thay đổi dù chủ thể di chuyển hay bạn xoay máy. Đó là lý do nó gọi là Single AF. Dùng lúc chủ thể đứng yên: chân dung, gia đình đứng theo dàn, phong cảnh, hay khi bạn muốn [[bố cục]] xong rồi mới bấm chụp (vì nếu bạn thay đổi vị trí máy, nét sẽ trượt).',
    },
    {
      t: 'h',
      text: 'AF-C: bám liên tục'
    },
    {
      t: 'p',
      text: 'Máy không bao giờ dừng lấy nét. Nó tiếp tục điều chỉnh tiêu cự từng millisecond để bám theo chủ thể nếu chủ thể di chuyển hoặc nếu bạn xoay máy. Dùng khi chủ thể chuyển động: chạy, [[panning]] một chiếc xe, thể thao, hay bất kỳ lúc nào bạn không chắc chủ thể sẽ dừng đúng chỗ nào.',
    },
    {
      t: 'table',
      head: ['Chế độ', 'Cách làm', 'Tình huống'],
      caption: 'Chọn dựa trên chủ thể, không phải trên máy hay ống kính.',
      rows: [
        ['AF-S', 'Lấy nét khi bạn bấm, rồi khóa', 'Chân dung, phong cảnh, chủ thể yên tĩnh'],
        ['AF-C', 'Bám liên tục khi bạn giữ nút', 'Chủ thể chuyển động, thể thao, trẻ em chạy'],
        ['DMF', 'Bắt AF-C, rồi xoay vòng kính sửa nét', 'AF bám lệch chút, bạn muốn sửa nhanh'],
      ],
    },
    {
      t: 'h',
      text: 'DMF: auto, nhưng bạn can thiệp'
    },
    {
      t: 'p',
      text: 'DMF là Direct Manual Focus — máy bắt nét tự động (AF-C), nhưng bạn có thể xoay vòng kính (focus ring) để sửa nó nhanh mà không phải chuyển sang chế độ thủ công. Ví dụ: máy bắt nét vào mũi người nhưng bạn muốn nét vào mắt, xoay vòng kính một chút là xong. Điểm yếu: máy sẽ cơ bản chỉ bắt nét khi bạn bấm nút; nếu bạn xoay vòng kính quá nhiều, máy tư bỏ AF-C và cho phép bạn kiểm soát hoàn toàn.',
    },
    {
      t: 'menu',
      old: 'MENU → Camera Settings1 → Focus Mode → AF-S / AF-C / DMF',
      new: 'MENU → Focus → AF/MF → Focus Mode → AF-S / AF-C / DMF',
    },
    {
      t: 'checklist',
      label: 'Ba quy tắc nhanh',
      items: [
        'Chủ thể yên tĩnh → AF-S',
        'Chủ thể di chuyển → AF-C',
        'AF bắt sai nhưng chỉ sai chút → DMF',
      ],
    },
  ],
  meta: {
    related: [
      { kind: 'knowledge', id: 'lay-net' },
      { kind: 'knowledge', id: 'bo-cuc' },
      { kind: 'knowledge', id: 'panning' },
    ],
    prerequisites: ['lay-net'],
    concepts: [],
    sources: [
      {
        url: 'https://helpguide.sony.net/ilc/2110/v1/en/contents/TP1000640840_01_01.html',
        title: 'a7 IV Focus Mode',
        publisher: 'Sony',
        checkedAt: '2026-11-05',
      },
    ],
    authorName: null,
    reviewedAt: null,
    section: null,
    order: null,
  },
}
