import type { Article } from '../../types'

export const page: Article = {
  id: 'che-do-a-cho-ngay-dau',
  kind: 'article',
  topic: 'exposure',
  level: 'newbie',
  archetype: 'setup-guide',
  read: '4 phút đọc',
  title: 'Chế độ A cho ngày đầu: xoay rồi chụp ngay',
  dek: 'Xoay về A, cài ba cái trong menu, rồi chụp được ngay — máy lo tốc độ, bạn chỉ chọn khẩu độ.',
  blocks: [
    {
      t: 'tldr',
      items: [
        'Chế độ A: bạn chọn khẩu độ, máy tự chọn tốc độ để đúng sáng.',
        'Cài ISO AUTO 100–6400 + Min. SS 1/125 — ảnh sạch mà vẫn nét trong nhà.',
        'Xoay lên A bất cứ lúc nào; ba cài đặt trong menu làm sau khi về nhà.',
      ],
    },
    {
      t: 'p',
      text: 'Chế độ A là "tự động có mục đích": bạn kiểm soát khẩu độ (để xóa phông hay nét sâu), máy làm phần còn lại. Giáo trình Sony khuyên mọi người mới dùng A làm chế độ mặc định — nó đơn giản hơn M nhưng linh hoạt hơn P, vừa đủ kiểm soát để bạn học một cách bấm mới mà không phải học ba thứ cùng một lúc.',
    },
    {
      t: 'figure',
      caption: 'Quay bánh chế độ về A, ở bất kỳ máy Sony nào. Ảnh: Markus Spiske · CC BY-SA 2.0 · Wikimedia Commons',
    },
    { t: 'h', text: 'Xoay về A lần đầu' },
    {
      t: 'p',
      text: 'Quay bánh chế độ ở thân máy về A. Đó thôi. Bây giờ bạn có thể chụp — máy sẽ tự đo sáng và chọn tốc độ phù hợp với khẩu độ bạn chọn. Ảnh có thể sáng hay tối tùy cảnh, nhưng chưa bao giờ nhoè vô tính vì máy bảo vệ tốc độ bằng nâng ISO khi cần.',
    },
    { t: 'h', text: 'Ba cài đặt để ảnh nét hơn' },
    {
      t: 'p',
      text: 'Về nhà, vào menu và cài ISO AUTO từ 100 đến 6400, rồi cài ISO AUTO Min. SS thành 1/125. Ba cài này bảo máy: "nâng ISO trước khi hạ tốc" — vì ảnh nhoè thì không cứu được, nhưng nhiễu thì cứu được ở hậu kỳ.',
    },
    {
      t: 'menu',
      old: 'MENU → Camera Settings1 → ISO AUTO: Min 100 / Max 6400; ISO AUTO Min. SS: 1/125',
      new: 'MENU → Exposure/Color → Exposure → ISO AUTO: Min 100 / Max 6400; ISO AUTO Min. SS: 1/125',
    },
    {
      t: 'table',
      head: ['Tình huống', 'Khẩu độ', 'Lý do'],
      caption: 'Xoay khẩu để kiểm soát xóa phông; máy tự đổi tốc độ.',
      rows: [
        ['Chân dung', 'F4–F5.6', 'Xóa nền để chủ thể nổi'],
        ['Nhóm hay phong cảnh', 'F8–F11', 'Nét sâu để cả bức ảnh nét'],
        ['Sáng mạnh ngoài trời', 'F16–F22', 'Giảm ánh sáng để tốc không quá nhanh'],
      ],
    },
    {
      t: 'h',
      text: 'Câu hỏi thường gặp',
    },
    {
      t: 'p',
      text: 'F2.8 là khẩu nhỏ nhất, F32 lớn nhất? Ngược lại — F2.8 khẩu to (sáng hơn), F32 khẩu nhỏ (tối hơn), vì công thức khẩu là f-number = tiêu cự ÷ đường kính. Sao phải 1/125 không phải 1/30? Vì tốc 1/30 dễ bị tay rung, máy sẽ chọn nó khi bạn đặt ở F8 trong nhà. 1/125 bảo máy "hãy nâng ISO thay vì hạ tốc", cho dù ISO cao bạn vẫn có ảnh nét.',
    },
    {
      t: 'checklist',
      label: 'Kiểm tra sau khi cài',
      items: [
        'Bánh chế độ ở A',
        'Trên thân máy hiện ISO AUTO (không cố định)',
        'Menu Exposure có ISO AUTO Min. SS = 1/125',
      ],
    },
  ],
  meta: {
    related: [
      { kind: 'knowledge', id: 'che-do-chup-p-a-s-m' },
      { kind: 'knowledge', id: 'khau-do' },
      { kind: 'knowledge', id: 'iso' },
    ],
    prerequisites: ['che-do-chup-p-a-s-m'],
    concepts: [],
    sources: [
      {
        url: 'https://helpguide.sony.net/ilc/2110/v1/en/contents/TP1000640839.html',
        title: 'Sony Help Guide: Shoot Mode',
        checkedAt: '2026-11-05',
        scope: 'a7 IV, a6700',
      },
    ],
    authorName: null,
    reviewedAt: null,
    section: null,
    order: null,
  },
}
