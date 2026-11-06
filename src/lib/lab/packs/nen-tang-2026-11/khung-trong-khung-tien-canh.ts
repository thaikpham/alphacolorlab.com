import type { Article } from '../../types'

export const page: Article = {
  id: 'khung-trong-khung-tien-canh',
  kind: 'article',
  topic: 'composition',
  level: 'mid',
  archetype: 'technique',
  read: '6 phút đọc',
  title: 'Khung trong khung: tiền cảnh, lấy nét vào đâu, khẩu nào',
  dek: 'Khung một chủ thể bằng cửa, cầu thang, lá cây — ba điều khó: tiền cảnh mờ đúng mức, nét vào đâu, khẩu bao nhiêu.',
  updatedAt: '2026-11-06',
  blocks: [
    {
      t: 'tldr',
      items: [
        'Lấy nét vào chủ thể, không vào tiền cảnh — AF-C, Focus Area Tracking là đúng.',
        'Khẩu f/2.8–f/4 để tiền cảnh mờ nhưng vẫn nhìn rõ được là nó là gì.',
        'Tiền cảnh ít nhất 30 cm từ ống kính; chủ thể ít nhất 1 mét phía sau; ánh sáng từ chủ thể, không từ tiền cảnh.',
      ],
    },
    {
      t: 'p',
      text: '[[Khung trong khung]] là kỹ thuật đặt một hình dạng (cửa, cầu thang, cây) ở trước chủ thể để tạo chiều sâu. Nó tạo chiều sâu nhưng khó: nếu tiền cảnh quá nét, người xem cứ nhìn vào đó thay vì chủ thể; nếu quá mờ, người xem không hiểu nó là gì. Nó phải nằm giữa.',
    },
    {
      t: 'figure',
      caption: 'Cảnh quan được khung bởi lối vào cầu thang, với tầm nhìn sâu vào cảnh ngoài. Ảnh: Jules Verne Times Two · CC BY-SA 4.0 · Wikimedia Commons',
    },
    {
      t: 'h',
      text: 'Lấy nét vào chủ thể',
    },
    {
      t: 'p',
      text: 'Tiền cảnh ở trước, chủ thể ở giữa, nền ở phía sau — ba tầng. Máy sẽ bám vào lớp gần nhất (tiền cảnh) nếu bạn dùng Focus Area Wide. Dùng AF-C với Focus Area Tracking: bạn chỉ định chủ thể ở tầng giữa, máy bám vào đó và bỏ qua tiền cảnh. Khi bạn bấm nửa cò hoặc nút AF-ON, máy sẽ khóa vào mặt/cơ thể người, không phải cửa.',
    },
    {
      t: 'h',
      text: 'Khẩu f/2.8–f/4: vừa phải',
    },
    {
      t: 'p',
      text: 'Nếu để khẩu f/1.8, tiền cảnh gần như vô hình, người xem không hiểu nó là cửa hay là gì. Nếu để khẩu f/8, tiền cảnh lại quá nét, chiếm hết chú ý. Khẩu f/2.8–f/4 (tầm giữa) khiến tiền cảnh mờ nhưng nhìn thấy được form dáng của nó (hình chữ nhật của cửa, những vệt lá cây). Đó là chỗ [[Độ sâu trường ảnh và xóa phông|độ sâu trường ảnh và xóa phông]] phát huy: nó vừa đủ để tạo chiều sâu.',
    },
    {
      t: 'h',
      text: 'Ba khoảng cách',
    },
    {
      t: 'p',
      text: 'Tiền cảnh (cửa): 0.3–0.5 mét từ ống kính. Chủ thể (người): 1–2 mét phía sau. Nền: 3 mét trở lên. Nếu chủ thể gần tiền cảnh (< 30 cm), độ sâu trường ảnh mỏng và chủ thể có thể mờ một phần. Nếu chủ thể ở quá xa (> 5 mét), ba tầng trở thành một dãy mờ nhạt. Khoảng cách 1–2 mét giữa tiền cảnh và chủ thể là lý tưởng — đó là cơ sở của [[bố cục]] khung trong khung.',
    },
    {
      t: 'table',
      head: ['Yếu tố', 'Khoảng cách sai', 'Khoảng cách đúng'],
      caption: 'Ba khoảng cách kết hợp với khẩu độ đúng thành khung trong khung.',
      rows: [
        ['Tiền cảnh', '< 20cm hoặc > 1m', '30–50cm'],
        ['Chủ thể', '< 50cm hoặc > 5m', '1–2m'],
        ['Nền', 'Gần chủ thể (nông)', '3m+'],
      ],
    },
    {
      t: 'checklist',
      label: 'Bốn bước',
      items: [
        'Focus Mode: AF-C, Focus Area: Tracking lên chủ thể',
        'Khẩu f/2.8–f/4, ISO Auto',
        'Tiền cảnh 30–50cm, chủ thể 1–2m phía sau',
        'Ánh sáng chủ yếu chiếu lên chủ thể, tiền cảnh phụ',
      ],
    },
  ],
  meta: {
    related: [
      { kind: 'knowledge', id: 'khung-trong-khung' },
      { kind: 'knowledge', id: 'bo-cuc' },
      { kind: 'knowledge', id: 'do-sau-truong-anh-va-xoa-phong' },
      { kind: 'knowledge', id: 'lay-net' },
    ],
    prerequisites: ['khung-trong-khung'],
    concepts: [],
    sources: [
      {
        url: 'https://helpguide.sony.net/ilc/2110/v1/en/contents/TP1000640137.html',
        title: 'Aperture Priority',
        publisher: 'Sony',
        checkedAt: '2026-11-06',
      },
      {
        url: 'https://helpguide.sony.net/ilc/2110/v1/en/contents/TP1000649113.html',
        title: 'Selecting the focus method (Focus Mode)',
        publisher: 'Sony',
        checkedAt: '2026-11-06',
      },
    ],
    authorName: null,
    reviewedAt: null,
    section: null,
    order: null,
  },
}
