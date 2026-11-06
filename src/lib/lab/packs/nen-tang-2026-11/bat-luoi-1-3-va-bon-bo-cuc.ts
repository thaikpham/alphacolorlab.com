import type { Article } from '../../types'

export const page: Article = {
  id: 'bat-luoi-1-3-va-bon-bo-cuc',
  kind: 'article',
  topic: 'composition',
  level: 'newbie',
  archetype: 'technique',
  read: '6 phút đọc',
  title: 'Bật Grid Line và bốn ô bố cục: cách dùng lưới 1/3',
  dek: 'Grid Line chia hình thành lưới chuẩn để giúp bạn đặt chủ thể theo quy tắc 1/3. Ba cài đặt trong máy, một bài tập 10 phút trong phố.',
  updatedAt: '2026-11-06',
  blocks: [
    {
      t: 'tldr',
      items: [
        'Bật Grid Line trong MENU → Setup → Screen Display Setting để nhìn lưới trong kính ngắm.',
        'Bốn ô bố cục đặt chủ thể tại giao điểm, không phải giữa — đó là cách mắt người xem dừa lâu.',
        'Dùng lưới khi bố cục: toàn cảnh căn ở giao điểm, đường chân trời căn ở một đường ngang.',
      ],
    },
    {
      t: 'p',
      text: '[[Bố cục]] là cách sắp xếp các yếu tố trong khung cố định. Nguyên tắc bố cục nói rằng mắt người xem dừa lâu ở bốn giao điểm của lưới 1/3, chứ không phải ở giữa. Grid Line là công cụ máy ảnh giúp bạn thấy lưới đó ngay trong kính ngắm, thay vì phải tưởng tượng.',
    },
    {
      t: 'figure',
      caption: 'Lưới 1/3 giúp bạn nhìn thấy bốn giao điểm—những nơi mắt người xem dừa lâu. Ảnh: Dietmar Rabich · CC BY-SA 4.0 · Wikimedia Commons',
    },
    {
      t: 'h',
      text: 'Bật Grid Line trong máy Sony',
    },
    {
      t: 'menu',
      old: 'MENU → Camera Settings1 → Screen Display Setting → Grid Line → Grid',
      new: 'MENU → Setup → Screen Display Setting → Grid Line → Grid',
    },
    {
      t: 'p',
      text: 'Lưới sẽ xuất hiện trong kính ngắm hoặc live view. Nếu muốn thay đổi độ sáng của lưới để dễ nhìn hơn, hãy tìm Brightness option gần đó.',
    },
    {
      t: 'h',
      text: 'Bốn ô bố cục: đặt chủ thể ở giao điểm',
    },
    {
      t: 'p',
      text: 'Khi bạn thấy lưới 1/3, bạn thấy chín ô bằng nhau và bốn giao điểm — chỗ hai đường cắt nhau. Đó là bốn "điểm nóng". Đặt [[chủ thể chính]] tại một điểm nóng thay vì giữa khiến ảnh cân bằng và có không gian để bối cảnh kể chuyện.',
    },
    {
      t: 'callout',
      label: 'Khi nào đặt ở giao điểm, khi nào để ở giữa',
      text: 'Giao điểm là mặc định tốt. Nhưng khi chụp chân dung cận cảnh, bạn có thể để chủ thể ở giữa — điều quan trọng là bạn chủ động lựa chọn, không phải vô tình.',
    },
    {
      t: 'h',
      text: 'Căn chân trời vào một đường ngang',
    },
    {
      t: 'p',
      text: 'Khi chụp quang cảnh với đường chân trời, hãy căn chân trời vào một trong hai đường ngang của lưới, không phải giữa. Bối cảnh phía trên hoặc dưới sẽ có tỷ lệ 2:1 thay vì 1:1, khiến ảnh động hơn. Kỹ thuật này gọi là [[khung trong khung]] khi cảnh ngoài có khung tự nhiên.',
    },
    {
      t: 'h',
      text: 'Bài tập 10 phút: chụp năm khung với lưới 1/3',
    },
    {
      t: 'p',
      text: 'Bật Grid Line, đi đến một địa điểm có nhiều yếu tố (con phố, sân công viên). Chụp năm khung hình, mỗi khung đặt một yếu tố khác nhau tại bốn giao điểm. Ví dụ: một tòa nhà ở giao điểm trên trái, một người ở giao điểm dưới phải, mặt trời ở giao điểm trên phải.',
    },
    {
      t: 'checklist',
      label: 'Trước khi chụp với lưới 1/3',
      items: [
        'Grid Line bật, lưới hiển thị rõ',
        'Bốn giao điểm nhìn thấy trong khung',
        'Chủ thể hoặc bối cảnh chính căn với giao điểm',
      ],
    },
  ],
  meta: {
    related: [
      { kind: 'knowledge', id: 'bo-cuc' },
      { kind: 'knowledge', id: 'chu-the-chinh' },
      { kind: 'knowledge', id: 'goc-may-va-khung-hinh' },
      { kind: 'knowledge', id: 'khung-trong-khung' },
    ],
    prerequisites: ['bo-cuc'],
    concepts: [],
    sources: [
      {
        url: 'https://helpguide.sony.net/ilc/2110/v1/en/contents/TP1000640824.html',
        title: 'Grid Line Display (still image/movie)',
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
