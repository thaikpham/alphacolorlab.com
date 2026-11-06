import type { Article } from '../../types'

export const page: Article = {
  id: 'khi-nao-roi-awb',
  kind: 'article',
  topic: 'color',
  level: 'mid',
  archetype: 'technique',
  read: '5 phút',
  title: 'Khi nào AWB sai, và cách chọn White Balance đúng',
  dek: 'Ba tình huống AWB nhầm lẫn: đèn huỳnh quang, lửa, hoặc vật quá sáng. Cách nhận biết và ba công cụ sửa tay.',
  updatedAt: '2026-11-06',
  blocks: [
    {
      t: 'tldr',
      items: [
        'AWB (Auto White Balance) chọn dựa trên trung bình ánh sáng khung; nó sai khi có một màu ánh sáng chiếm ưu thế.',
        'Ba tình huống: đèn huỳnh quang (xanh lạnh), lửa hay đèn sợi (cam nóng), hoặc vật quá sáng/tối làm nhiễu.',
        'Ba công cụ sửa: preset (Daylight, Incandescent, bốn mức Fluor.), chọn Kelvin tay, hoặc chỉnh Shift A/B.',
      ],
    },
    {
      t: 'p',
      text: '[[Cân bằng trắng và nhiệt độ màu]] là cách máy diễn dịch màu sắc ánh sáng khi chụp. Khi máy chọn AWB (tự động), nó tìm điểm trung lập rồi cân bằng. Nhưng ba tình huống khiến nó sai: ánh sáng có tên (đèn huỳnh quang xanh lạnh, lửa cam nóng), hoặc ảnh có vật quá sáng hay quá tối làm nhầm lạc máy.',
    },
    {
      t: 'figure',
      caption: 'Chụp dưới ánh sáng hỗn hợp: AWB chọn trung bình dẫn đến màu sắc bị lệch. Ảnh: CoolKoon · CC BY-SA 4.0 · Wikimedia Commons',
    },
    {
      t: 'h',
      text: 'Ba tình huống AWB nhầm lẫn',
    },
    {
      t: 'p',
      text: 'Đèn huỳnh quang ám xanh lục khiến da người xỉn. Lửa hay đèn sợi đốt rất cam, máy bù xanh để cân lại và làm mất hơi ấm tự nhiên. Khi ảnh có vật rất sáng (tường trắng) hoặc rất tối (nền đen), máy sẽ điều chỉnh cho nó thành trung tính, làm phần còn lại bị ảnh hưởng.',
    },
    {
      t: 'h',
      text: 'Ba công cụ chọn White Balance tay',
    },
    {
      t: 'table',
      caption: 'Công cụ sửa',
      head: ['Công cụ', 'Cách dùng', 'Khi nào tốt'],
      rows: [
        ['Preset', 'Chọn Daylight, Fluor., Incandescent từ menu WB', 'Ánh sáng có tên rõ'],
        ['Kelvin (C.Temp.)', 'Nhập nhiệt độ từ 2500–9900K', 'Bạn biết chính xác nhiệt độ'],
        ['Tuning (Shift A/B)', 'Điều chỉnh mũi tên theo hướng Amber (ấm) hoặc Blue (lạnh)', 'Tinh chỉnh sau Preset'],
      ],
    },
    {
      t: 'h',
      text: 'Gray Card: công cụ chính xác nhất',
    },
    {
      t: 'p',
      text: 'Gray Card là tờ giấy xám 18% được làm để phản chiếu ánh sáng trung tính. Chụp Gray Card dưới ánh sáng bạn sắp dùng, rồi đo Custom White Balance từ tấm đó, hoặc chỉnh ảnh sau trong Lightroom. Nó là cách chính xác nhất khi ánh sáng không có Preset rõ ràng.',
    },
    {
      t: 'h',
      text: 'RAW và Creative Look',
    },
    {
      t: 'p',
      text: '[[RAW]] lưu dữ liệu gốc mà không áp dụng White Balance khi chụp. Bạn chỉnh màu sau trong Lightroom hay Imaging Edge khi thấy đầy đủ dữ liệu và dễ khôi phục hơn. White Balance chỉ là tham khảo trong metadata. Ngược lại, [[Creative Look]] áp dụng trực tiếp trên JPEG nên White Balance sẽ ảnh hưởng tới màu sắc cuối cùng.',
    },
    {
      t: 'checklist',
      label: 'Chọn White Balance tay',
      items: [
        'Chụp một tấm với AWB để thấy màu sắc hiện tại.',
        'Nhận dạng ánh sáng: Daylight, Incandescent hay một mức Fluor.',
        'Chọn Preset trong menu White Balance.',
        'Chụp lại và so sánh với tấm AWB.',
        'Nếu chưa tốt, chỉnh Shift A/B thêm Amber hoặc Blue.',
        'Tắt menu để lưu cấu hình.',
      ],
    },
  ],
  meta: {
    related: [
      { kind: 'knowledge', id: 'can-bang-trang-va-nhiet-do-mau' },
      { kind: 'knowledge', id: 'creative-look' },
      { kind: 'knowledge', id: 'raw-jpeg-va-heif' },
    ],
    prerequisites: ['can-bang-trang-va-nhiet-do-mau'],
    concepts: [],
    sources: [
      {
        url: 'https://helpguide.sony.net/ilc/2110/v1/en/contents/TP1000640840.html',
        title: 'ILCE-7M4 Help Guide — White Balance (still image/movie)',
        checkedAt: '2026-11-05',
      },
    ],
    authorName: null,
    reviewedAt: null,
    section: null,
    order: null,
  },
}
