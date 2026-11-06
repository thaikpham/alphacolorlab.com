import type { Article } from '../../types'

export const page: Article = {
  id: 'body-ev-vs-flash-ev-sony-flash-ttl',
  kind: 'article',
  topic: 'exposure',
  level: 'mid',
  archetype: 'explainer',
  read: '8 phút đọc',
  title: 'Body EV chỉnh background, Flash EV chỉnh chủ thể',
  dek: 'Chụp flash mà background lúc cháy lúc tối thui. Trên máy Sony có hai thanh EV riêng biệt — một cho ánh sáng môi trường, một cho đèn — và đa số chỉ đụng tới một.',
  blocks: [
    {
      t: 'tldr',
      items: [
        'Body EV lo background, Flash EV lo chủ thể — hai thanh chạy song song, không còn phải đánh đổi.',
        'Đổi Exp.comp.set sang Ambient only trước, nếu không Body EV sẽ kéo tụt luôn công suất đèn.',
        'Chế độ A, ISO Auto, shutter không nhanh hơn 1/160s, Flash Mode để Rear Sync.',
      ],
    },
    {
      t: 'p',
      text: 'Tấm đầu: mặt đẹp, background cháy trắng. Kéo [[Bù sáng|sáng]] xuống chụp lại thì tấm sau background đúng ý, mặt tối thui. Vấn đề không nằm ở đèn. Một tấm ảnh có flash là hai lớp sáng chồng lên nhau trên cùng một [[Tam giác phơi sáng|tam giác phơi sáng]]. Máy Sony cho bạn một thanh bù sáng riêng cho từng lớp — đa số người dùng chỉ đụng tới một trong hai.',
    },
    {
      t: 'figure',
      caption: 'Ánh sáng tự nhiên từ một bên, đèn TTL ở phía trên: cách bố trí cổ điển để chiếu sáng chân dung. Ảnh: Jacopo188 · CC BY-SA 3.0 · Wikimedia Commons',
    },
    {
      t: 'p',
      text: 'Lớp ambient là ánh sáng môi trường, phụ thuộc vào khẩu, tốc và ISO — bạn thấy nó rõ nhất ở background. Lớp flash chỉ kéo dài khoảng một phần nghìn giây, nên dù shutter là 1/160s hay 1/15s thì cú đèn vẫn lọt trọn vào bên trong. Tốc độ màn trập không làm flash sáng hay tối đi. Shutter chậm hơn thì chỉ có ambient lọt vào nhiều hơn, background sáng lên còn chủ thể vẫn y nguyên. Đó là cần gạt tách biệt của bạn.',
    },
    { t: 'h', text: 'Dựng máy và đổi Exp.comp.set' },
    {
      t: 'p',
      text: 'Chế độ A, ISO Auto, khẩu chọn theo ý, shutter không nhanh hơn 1/160s — đó là tốc độ [[Rear Sync|đồng bộ đèn]] của ZV-E10. Nhanh hơn mức này thì màn trập chưa mở hết mà đèn đã đánh xong và ảnh có một dải đen cắt ngang. Gắn đèn vào thì máy thường tự giới hạn giúp bạn, cứ biết con số để đỡ hoảng khi chụp nắng gắt. Nhưng có một mục mặc định sai phải sửa trước khi tin vào bất cứ thứ gì phía dưới: Sony để Exp.comp.set ở Ambient & Flash, nghĩa là bạn kéo Body EV xuống một stop thì máy hạ luôn công suất đèn một stop, và cả background lẫn mặt cùng tối đi.',
    },
    {
      t: 'menu',
      old: 'MENU → Camera Settings1 → Exp.comp.set → Ambient only',
      new: 'MENU → Exposure/Color → Flash → Exp.comp.set → Ambient only',
    },
    {
      t: 'menu',
      old: 'MENU → Camera Settings1 → Flash Mode → Rear Sync.',
      new: 'MENU → Exposure/Color → Flash → Flash Mode → Rear Sync.',
    },
    { t: 'h', text: 'Kéo Body EV để dìm background' },
    {
      t: 'p',
      text: 'Body EV xuống thì máy tăng tốc màn trập hoặc hạ [[ISO]], ambient lọt vào ít đi và background thẫm lại. Flash TTL vẫn tự đo và bơm đủ sáng cho mặt nên chủ thể gần như không đổi. Đây là cách làm ra background dramatic mà không cần thêm đèn: bạn không làm chủ thể sáng lên, bạn dìm môi trường xuống. ZV-E10 không có bánh xe EV riêng, nên gán Exposure Comp. ra Control Wheel hoặc nút C1 trong Custom Key — bạn sẽ đụng vào nó liên tục, đừng để nó nằm trong menu. Muốn thấy trước background mà không phải chụp thử, gán thêm Shot. Result Preview vào một nút Custom: giữ nút là máy hiện đúng kết quả với khẩu đã khép và tốc, ISO thực tế, thả ra là về bình thường.',
    },
    {
      t: 'compare',
      beforeLabel: 'Body EV 0',
      afterLabel: 'Body EV -1.7',
      caption:
        'Cùng khẩu, cùng đèn TTL, chỉ khác Body EV: mặt giữ nguyên độ sáng, còn trời sau lưng chuyển từ trắng bệch sang lại có màu.',
    },

    { t: 'h', text: 'Kéo Flash EV để sửa chủ thể' },
    {
      t: 'p',
      text: 'Ở chế độ TTL, máy bắn một cú pre-flash, đo phản hồi rồi tự tính công suất — tính theo thuật toán, không theo gu của bạn. Flash Comp. là chỗ bạn nói thêm rằng tính xong thì cộng trừ giúp mình chừng này, trong dải ±3.0 EV. Nó chỉ tác động lên phần đèn chiếu tới, thường là mặt và thân trên, còn background ở xa nên gần như không nhận được gì. TTL vẫn là máy đoán: chủ thể mặc áo trắng thì nó giảm công suất và mặt bị tối, mặc đồ đen thì ngược lại. Flash EV chính là chỗ để sửa những lần đoán sai đó.',
    },
    {
      t: 'table',
      head: ['Bạn muốn', 'Body EV', 'Flash EV'],
      caption:
        'Điểm xuất phát, không phải công thức — đo trên ZV-E10 với đèn TTL gắn hotshoe và Exp.comp.set để Ambient only. Mỗi lần xem lại ảnh chỉ cần hỏi hai câu: background thế nào, và mặt thế nào.',
      rows: [
        ['Dramatic, chủ thể nổi bật', '-1 → -2', '0 → +0.7'],
        ['Trong nhà, tự nhiên', '-0.3 → 0', '-1 → -0.7'],
        ['Chống ngược sáng ban ngày', '-0.3 → -1', '0 → +1'],
        ['Tông sáng, airy', '0 → +0.7', '-1.3 → -0.7'],
        ['Golden hour, giữ màu trời', '-1 → -1.7', '+0.3 → +1'],
      ],
    },
    {
      t: 'checklist',
      label: 'Trước khi bấm tấm đầu tiên',
      items: [
        'Chế độ A, ISO Auto',
        'Shutter không nhanh hơn 1/160s',
        'Flash Mode đang là Rear Sync.',
        'Exp.comp.set đang là Ambient only',
        'Exposure Comp. đã gán ra Control Wheel hoặc C1',
        'Shot. Result Preview đã gán vào một nút Custom',
      ],
    },
  ],
  meta: {
    authorName: null,
    reviewedAt: null,
    section: null,
    order: null,
    concepts: [],
    related: [
      { kind: 'knowledge', id: 'iso' },
      { kind: 'knowledge', id: 'bu-sang' },
      { kind: 'knowledge', id: 'dong-bo-man-sau' },
      { kind: 'knowledge', id: 'tam-giac-phoi-sang' },
    ],
    prerequisites: ['iso-auto-min-ss'],
    sources: [
      { url: 'https://helpguide.sony.net/ilc/2110/v1/en/index.html', title: 'ILCE-7M4 Help Guide', publisher: 'Sony', checkedAt: '2026-11-05' },
    ],
  },
}
