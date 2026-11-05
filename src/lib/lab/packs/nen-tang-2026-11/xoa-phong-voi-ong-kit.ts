import type { Article } from '../../types'

export const page: Article = {
  id: 'xoa-phong-voi-ong-kit',
  kind: 'article',
  topic: 'composition',
  level: 'newbie',
  archetype: 'technique',
  read: '5 phút đọc',
  title: 'Ba cách xóa phông không mua ống mới',
  dek: 'Ống kit 18–55mm không khẩu lớn, nhưng ba kỹ thuật làm cho nền mờ như ống 50mm. Không mua ống, chỉ cần bố cục khác.',
  updatedAt: '2026-11-06',
  blocks: [
    {
      t: 'tldr',
      items: [
        'Kéo máy lùi, để chủ thể xa nền — khoảng cách vật thể đến camera quyết định độ xóa phông.',
        'Zoom tới cực hạn (55mm): độ xóa phông tăng khi tiêu cự dài hơn.',
        'Nền xa và [[khẩu độ]] rộng nhất (f/5.6 ở 55mm): ba yếu tố cộng lại là xóa phông đáng kể.',
      ],
    },
    {
      t: 'p',
      text: 'Xóa phông không phải là thuộc tính của ống kính — nó là kết quả của ba yếu tố: [[do-sau-truong-anh-va-xoa-phong]] (độ sâu trường), khoảng cách từ máy tới chủ thể, và khoảng cách từ chủ thể tới nền. Ống kit 18–55mm f/3.5–5.6 không khẩu lớn như 50mm f/1.8, nhưng nếu bạn chọn ba cái khác một cách thông minh, kết quả sẽ gần giống.',
    },
    {
      t: 'figure',
      caption: 'Hai ảnh chân dung cùng máy, ống kit 18–55mm: ảnh trái zoom 18mm khẩu f/3.5, nền như bức vẽ; ảnh phải zoom 55mm khẩu f/5.6, nền hoàn toàn mờ. Ảnh: example Wikimedia Commons',
    },
    {
      t: 'h',
      text: 'Một: kéo máy lùi'
    },
    {
      t: 'p',
      text: 'Khoảng cách máy tới chủ thể quyết định độ xóa phông hơn cả khẩu độ. Nếu bạn ngồi cách mặt người 30 cm, khẩu f/1.8 mới xóa phông được. Nhưng nếu bạn ngồi cách 1 mét, khẩu f/5.6 đã xóa rất tốt. Nên kéo máy lùi, để giữa bạn và người ít nhất 1 mét, rồi zoom tới 55mm — nền sẽ mờ hơn khi bạn ở gần.',
    },
    {
      t: 'h',
      text: 'Hai: zoom tới 55mm'
    },
    {
      t: 'p',
      text: 'Tiêu cự dài làm nền mờ hơn, tiêu cự ngắn làm toàn cảnh sắc nét. Ống kit 18–55mm có ba tùy chọn: 18mm xóa phông tệ, 35mm đã tốt hơn, 55mm là tốt nhất. Zoom tới đầu kia là bước đơn giản để xóa phông hơn mà không cần đổi ống.',
    },
    {
      t: 'h',
      text: 'Ba: để khẩu rộng nhất'
    },
    {
      t: 'p',
      text: 'Ở 55mm, ống kit mở khẩu f/5.6. Nếu đó là ống f/2.8, khẩu f/2.8 (rộng hơn) sẽ xóa phông thêm. Nhưng f/5.6 ở 55mm + khoảng cách 1 mét + nền xa = xóa phông nhìn thấy được. Không cần nâng ISO hay mở flash; chỉ cần bố cục đúng là xong.',
    },
    {
      t: 'table',
      head: ['Bạn muốn', 'Zoom', 'Khoảng cách', 'Nền'],
      caption: 'Ba cái kết hợp làm xóa phông tệ hay tốt, không phải khẩu độ một mình.',
      rows: [
        ['Nền sắc nét (toàn cảnh)', '18–35mm', 'Gần', 'Gần chủ thể'],
        ['Nền lơ mơ (chân dung)', '35–55mm', '0.8–1.5m', '1–2m sau chủ thể'],
        ['Nền hoàn toàn mờ (close-up)', '55mm', '0.5–0.7m', '> 2m sau chủ thể'],
      ],
    },
    {
      t: 'checklist',
      label: 'Ba kỹ thuật cộng lại',
      items: [
        'Zoom 55mm (đầu dài ống)',
        'Khoảng cách 1 mét từ máy tới mặt',
        'Nền ít nhất 2 mét phía sau chủ thể',
      ],
    },
  ],
  meta: {
    related: [
      { kind: 'knowledge', id: 'khau-do' },
      { kind: 'knowledge', id: 'lay-net' },
      { kind: 'knowledge', id: 'chu-the-chinh' },
    ],
    prerequisites: ['do-sau-truong-anh-va-xoa-phong'],
    concepts: [],
    sources: [
      {
        final: 'https://helpguide.sony.net/ilc/2110/v1/en/contents/TP1000640830_01_01.html',
        title: 'a7 IV Depth of Field',
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
