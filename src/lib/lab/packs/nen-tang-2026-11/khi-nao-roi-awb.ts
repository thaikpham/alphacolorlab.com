import type { Article } from '../../types'

export const page: Article = {
  id: 'khi-nao-roi-awb',
  kind: 'article',
  topic: 'color',
  level: 'mid',
  archetype: 'technique',
  read: '7 phút',
  title: 'Khi nào AWB sai, và cách chọn White Balance đúng',
  dek: 'Ba tình huống màu sắc bị nhàm hoặc thiệt hại vì máy chọn sai nhiệt độ màu: cách nhận biết và ba cách sửa bằng tay.',
  updatedAt: '2026-11-06',
  blocks: [
    {
      t: 'tldr',
      items: [
        'AWB (Auto White Balance) đi từ trung bình của ánh sáng trong khung; nó sai khi ảnh có một màu ánh sáng chiếm ưu thế.',
        'Ba tình huống: ảnh xanh lạnh vì đèn huỳnh quang, ảnh cam khi chụp lửa hay đèn sợi, ảnh trắng bị ảnh hưởng đốm màu lớn.',
        'Ba cách sửa: chọn Preset (Daylight, Incandescent, Fluor.), nhập Kelvin tay, hoặc dùng Cân bằng trắng tùy chỉnh bằng White Balance tuning.',
      ],
    },
    {
      t: 'p',
      text: '[[Cân bằng trắng và nhiệt độ màu]] là cách máy diễn dịch nhiệt độ ánh sáng trong lúc chụp. Khi máy chọn AWB (tự động), nó tìm trường trung lập và điều chỉnh màu. Tuy nhiên, [[Creative Look]] hoặc cài đặt màu khác cũng ảnh hưởng. Bài này nói về ba khi nào AWB sai và các cách sửa tay.',
    },
    {
      t: 'figure',
      caption: 'Chụp dưới ánh sáng hỗn hợp: đèn huỳnh quang xanh lạnh và ánh chiều tạo nhiệt độ khác nhau; AWB chọn trung bình dẫn đến ảnh bị màu. Ảnh: Unknown Artist · CC0 1.0 · Wikimedia Commons',
    },
    {
      t: 'h',
      text: 'Tình huống 1: Ảnh xanh lạnh dưới đèn huỳnh quang',
    },
    {
      t: 'p',
      text: 'Đèn huỳnh quang phát ra ánh sáng xanh lạnh (~4000K ở dòng Warm White, hay lên tới 5500K+ ở dòng Cool White). Khi ảnh có rất nhiều ánh đèn huỳnh quang, máy cố gắng chuyển nó thành trung tính nhưng không đủ: ảnh vẫn có đốm xanh như bệnh.',
    },
    {
      t: 'menu',
      old: 'MENU → Camera Settings2 → White Balance (hoặc AWB tuning) → Fluor.: Warm White (hoặc Fluor.: Cool White)',
      new: 'MENU → Shoot (hoặc Chụp) → White Balance → Fluor.: Warm White hoặc Fluor.: Cool White',
    },
    {
      t: 'callout',
      label: 'Nhận biết đèn huỳnh quang',
      text: 'Đèn tuýp dài trên trần, ánh sáng tím nhạt hoặc xanh nhạt khi nhìn thẳng. Bộ máy lao động, siêu thị, văn phòng thường dùng loại này.',
    },
    {
      t: 'h',
      text: 'Tình huống 2: Ảnh cam đỏ dưới lửa hoặc đèn sợi đốt',
    },
    {
      t: 'p',
      text: 'Lửa (khoảng 1500–2000K) và đèn sợi đốt (2700–3000K) phát tia cam đỏ rất nồng. Nếu chớp dưới tiếng gió hay ánh lửa, AWB thấy rất nhiều cam nên thêm xanh để cân bằng — kết quả là ảnh mất hồng tự nhiên, trở nên xanh tái.',
    },
    {
      t: 'menu',
      old: 'MENU → Camera Settings2 → White Balance → Incandescent',
      new: 'MENU → Shoot → White Balance → Incandescent',
    },
    {
      t: 'p',
      text: 'Nếu muốn thêm ấm áp cho bầu không khí, hãy giữ Incandescent và thêm chỉnh tay bằng Tuning (mũi tên A/B) lệch sang Amber — thêm cam vào ảnh.',
    },
    {
      t: 'h',
      text: 'Tình huống 3: Ảnh chứa một miếng rất sáng hoặc rất tối',
    },
    {
      t: 'p',
      text: 'Giả sử bạn chụp một người trước bức tường trắng rất sáng, hoặc đối diện một vật đen tuyền lớn. AWB sẽ nhìn khoảng trống lớn và điều chỉnh cho nó thành trung tính, làm cho phần còn lại bị ảnh hưởng. Ví dụ: tường trắng lớn khiến ảnh có xu hướng bị xanh để bù được từng ấy sáng.',
    },
    {
      t: 'callout',
      label: 'Tối ưu hóa AWB',
      text: 'Chế độ AWB (Priority White) và AWB (Priority Ambience) là hai cách máy xử lý tình huống này. Priority White ưu tiên trung lập; Priority Ambience cố gắng giữ sắc thái của ánh sáng xung quanh. Thử cả hai để thấy khác biệt.',
    },
    {
      t: 'h',
      text: 'Ba cách chọn White Balance tay',
    },
    {
      t: 'p',
      text: 'Thay vì để AWB tự chọn, bạn có ba công cụ:',
    },
    {
      t: 'table',
      caption: 'Công cụ White Balance',
      head: ['Công cụ', 'Cách dùng', 'Khi nào tốt'],
      rows: [
        ['Preset (Daylight, Cloudy…)', 'Menu White Balance → chọn Preset phù hợp ánh sáng', 'Ánh sáng có tên rõ: mặt trời, bóng, đèn hình cụ thể'],
        ['Kelvin (C.Temp./Filter)', 'Menu White Balance → C.Temp./Filter → nhập Kelvin (2500–9900)', 'Bạn biết chính xác nhiệt độ (có đồng hồ hoặc kinh nghiệm)'],
        ['Tuning (Shift A/B, G/M)', 'White Balance → Tuning → Shift bằng mũi tên', 'Điều chỉnh tinh vi sau khi chọn Preset hoặc Kelvin'],
      ],
    },
    {
      t: 'h',
      text: 'FAQ',
    },
    {
      t: 'h',
      text: 'Sao chụp ở chế độ RAW thì lại không bị vấn đề?',
    },
    {
      t: 'p',
      text: 'RAW lưu dữ liệu gốc mà không áp dụng White Balance khi chụp. Bạn chỉnh màu sau trong Lightroom hay software khác, khi đó bạn thấy đầy đủ dữ liệu và dễ khôi phục hơn. White Balance chỉ là tham khảo trong metadata; phần mềm chỉnh ảnh sẽ cho bạn toàn quyền.',
    },
    {
      t: 'h',
      text: 'Gray Card là gì?',
    },
    {
      t: 'p',
      text: 'Gray Card là một tờ giấy xám 18% được thiết kế để phản ánh ánh sáng đúng. Bạn chụp Gray Card dưới ánh sáng mà bạn định chụp (trước khi bắt đầu chụp chính), rồi dùng ảnh đó để White Balance → Tùy chỉnh (Custom White Balance) trên máy hoặc chỉnh sau. Nó là cách chính xác nhất khi ánh sáng không có Preset rõ ràng.',
    },
    {
      t: 'h',
      text: 'Làm sao để biết Kelvin số mấy là đúng?',
    },
    {
      t: 'p',
      text: 'Mặt trời trưa hôm nay khoảng 5500K; lửa khoảng 1800K; đèn sợi đốt 2700–3000K; đèn huỳnh quang 4000–5500K. Nếu không chắc, hãy thử từng mức từ 3000K (cam hơn) lên tới 7000K (xanh hơn) và quan sát LCD của máy để chọn cảm giác thoải mái nhất.',
    },
    {
      t: 'checklist',
      items: [
        'Chụp một tấm ảnh với AWB để thấy màu sắc hiện tại.',
        'Nhận dạng ánh sáng chính: Daylight, Incandescent, hay Fluor.',
        'Chọn Preset phù hợp trong menu White Balance.',
        'Chụp lại và so sánh với tấm AWB trước.',
        'Nếu vẫn không tốt, dùng Tuning để điều chỉnh Shift A/B thêm Amber hoặc Blue.',
        'Lưu cấu hình bằng cách tắt menu; lần sau máy nhớ cấu hình này.',
      ],
    },
  ],
  meta: {
    related: [
      { kind: 'knowledge', id: 'can-bang-trang-va-nhiet-do-mau' },
      { kind: 'knowledge', id: 'creative-look' },
      { kind: 'knowledge', id: 'silhouette' },
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
