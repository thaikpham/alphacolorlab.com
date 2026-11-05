import type { Article } from '../../types'

export const page: Article = {
  id: 'chon-metering-mode',
  kind: 'article',
  topic: 'exposure',
  level: 'mid',
  archetype: 'explainer',
  read: '6 phút đọc',
  title: 'Multi, Center, Spot: chọn metering mode khi nào',
  dek: 'Máy Sony có 3 cách đo sáng. Chọn đúng và bạn sẽ hiếm khi cần bù sáng, ảnh sáng bình ổn dù ánh sáng có trắc trở.',
  updatedAt: '2026-11-06',
  blocks: [
    {
      t: 'tldr',
      items: [
        '**Multi**: máy nhìn toàn khung, ưu tiên vùng lấy nét, thích hợp chụp thường ngày 80% trường hợp.',
        '**Center**: đo vùng giữa khung, bỏ qua viền → hữu ích khi chủ thể giữa khung và nền sáng/tối lệch nhiều.',
        '**Spot**: đo một điểm nhỏ → dùng khi chủ thể nhỏ hay áp sát viền, hoặc chụp ngược sáng.',
      ],
    },
    {
      t: 'p',
      text: '[[Đo sáng]] là bước máy chọn độ mở khẩu (A), tốc độ (S) hay ISO (Auto) để ảnh sáng bình ổn. Cùng một cảnh, ba cách đo sáng có thể cho ba phơi sáng khác nhau. Biết khi nào dùng cách nào là lợi thế lớn để không phải bù sáng lâu.',
    },
    {
      t: 'figure',
      caption: 'Ánh sáng ngược tạo thử thách cho phơi sáng. Ảnh: Jacopo188 · CC BY-SA 3.0 · Wikimedia Commons',
    },
    { t: 'h', text: 'Multi (đo toàn khung): mặc định tốt nhất' },
    {
      t: 'p',
      text: '**Multi** (gọi cũng là Evaluative Metering trên Canon) nhìn toàn khung, chia làm 1.200 điểm, so sánh với cơ sở dữ liệu của Sony, và ưu tiên vùng lấy nét. Bạn chụp người với nền trời sáng → nên dùng Multi, máy sẽ cân bằng để người nét sáng.',
    },
    {
      t: 'menu',
      old: 'MENU → Camera Settings1 → Metering Mode → Multi',
      new: 'MENU → Exposure/Color → Exposure → Metering Mode → Multi',
    },
    {
      t: 'h',
      text: 'Center (đo vùng giữa): chủ thể ở tâm, nền lệch sáng',
    },
    {
      t: 'p',
      text: 'Khi chủ thể ở **chính giữa khung** và nền quanh có màu sáng hoặc tối lệch: **chân dung trước tường trắng**, **chụp nước có bầu trời sáng**. Multi sẽ bị cân bằng quá khó. Dùng Center, máy chỉ nhìn vùng 40% giữa → người ra sáng đúng, nền có thể cháy hoặc tối là thứ yếu.',
    },
    {
      t: 'h',
      text: 'Spot (đo một điểm): chủ thể nhỏ hay ngoại viền',
    },
    {
      t: 'p',
      text: 'Khi **chủ thể nhỏ** (một chỉ chim bay trên trời) hoặc **quay ở một góc viền** (chân dung profile nằm lệch trái khung), Spot đo chỉ 5% giữa → máy cân bằng cho chủ thể đúng, bỏ qua toàn bộ nền.',
    },
    {
      t: 'table',
      head: ['Tình huống', 'Metering Mode', 'Tại sao'],
      caption: 'Ba tình huống thường gặp và cách đo sáng tương ứng.',
      rows: [
        ['Chân dung ngoài trời, nền bầu trời', 'Multi', 'Sony ưu tiên vùng lấy nét; người sáng đúng'],
        ['Chân dung trước tường trắng/sáng', 'Center', 'Nền sáng bị Multi lôi cuốn; Center chỉ xem giữa'],
        ['Chim bay hay đối tượng nhỏ', 'Spot', 'Chim nhỏ Multi bỏ qua; Spot đo trực tiếp chim'],
        ['Chụp silhouette hoàng hôn', 'Spot (trời)', 'Spot vào bầu trời → nền sáng từng màu, người thành bóng đen'],
      ],
    },
    {
      t: 'callout',
      label: 'Khi nào dùng bù sáng (Exposure Compensation)?',
      text: 'Bù sáng là lệnh "máy ơi, làm ảnh sáng hơn/tối hơn +/-1 EV" chứ không phải đo lại. Bạn vẫn dùng nó, nhưng lựa chọn [[Metering Mode]] đúng sẽ giảm tần suất bù sáng từ 50% trường hợp xuống 10%. Sony liên kết Metering Mode với **Focus Area** (vùng lấy nét): khi dùng Multi, nó sẽ ưu tiên vùng được lấy nét. Khi dùng Spot, vùng đo sáng và vùng lấy nét sẽ cùng một điểm. Hiểu mối liên kết này giúp bạn nhận ra tại sao bộ ba [[Đo sáng|đo sáng]], [[Bù sáng]], và lấy nét phải làm việc cùng nhau. Xem thêm [[Silhouette|kỹ thuật chụp silhouette]] khi bạn muốn đảo ngược logic sáng.',
    },
    {
      t: 'checklist',
      label: 'Thực hành: ba tình huống',
      items: [
        'Chụp người ngoài trời: dùng Multi, không bù sáng — nhìn kết quả ảnh',
        'Chân dung trước tường sáng: dùng Center — so sánh với Multi',
        'Chụp chim trên cành: dùng Spot — đo trực tiếp chim chứ không phải nền',
      ],
    },
  ],
  meta: {
    related: [
      { kind: 'knowledge', id: 'do-sang' },
      { kind: 'knowledge', id: 'bu-sang' },
      { kind: 'knowledge', id: 'silhouette' },
    ],
    prerequisites: ['do-sang'],
    concepts: [],
    sources: [
      {
        url: 'https://helpguide.sony.net/ilc/2110/v1/en/contents/TP1000640843.html',
        title: 'ILCE-7M4 Help Guide — Metering Mode',
        checkedAt: '2026-11-05',
      },
      {
        url: 'https://helpguide.sony.net/ilc/2110/v1/en/contents/TP1000640844.html',
        title: 'ILCE-7M4 Help Guide — Exposure Compensation',
        checkedAt: '2026-11-05',
      },
    ],
    authorName: null,
    reviewedAt: null,
    section: null,
    order: null,
  },
}
