import type { Article } from '../../types'

export const page: Article = {
  id: 'so-f-tren-ong-kit',
  kind: 'article',
  topic: 'exposure',
  level: 'newbie',
  archetype: 'explainer',
  read: '6 phút đọc',
  title: 'f/3.5–5.6 trên ống kit: tại sao khẩu hẹp, có được mở hết không',
  dek: 'Ống kit Sony ghi F3.5–5.6 (16–50mm trên a6400 và ZV-E10, 28–70mm trên dòng a7): con số này có nghĩa gì, và tại sao bạn không thể mở khẩu lớn hơn.',
  updatedAt: '2026-11-06',
  blocks: [
    {
      t: 'tldr',
      items: [
        'f/3.5–5.6 = khẩu thay đổi theo tiêu cự: đầu rộng mở được f/3.5, đầu tele chỉ f/5.6.',
        'Khẩu hẹp (số f lớn) = ít sáng vào cảm biến → ảnh tối ở nhà, buộc phải nâng ISO.',
        'Ống kit không có vòng khẩu; chỉnh bằng bánh xe trên thân ở chế độ A hoặc M.',
      ],
    },
    {
      t: 'p',
      text: 'Ống kit của Sony ghi "f/3.5–5.6", nhưng bạn không biết nó có "tốt" không. Trước khi mua ống mới, hiểu rõ số này và tại sao nó ảnh hưởng tới ảnh bạn là bước đầu. [[Khẩu độ]] không chỉ về độ sâu trường ảnh — nó là về **sáng**.',
    },
    {
      t: 'figure',
      caption: 'FE 28–70mm F3.5–5.6 OSS, ống kit của dòng a7: số f đổi theo tiêu cự zoom. Ảnh: Roman Eisele · CC BY-SA 4.0 · Wikimedia Commons',
    },
    { t: 'h', text: 'f/3.5–5.6: khẩu thay đổi theo zoom' },
    {
      t: 'p',
      text: '**f/3.5** là khẩu mở được ở đầu rộng (16mm hay 28mm). **f/5.6** là khẩu mở được ở đầu tele (50mm hay 70mm). Khi zoom ra xa, khẩu lớn nhất **co dần từ f/3.5 về f/5.6**; ở tiêu cự giữa, máy hiện một số ở giữa. Đó là hạn chế của thiết kế quang học này.',
    },
    {
      t: 'h',
      text: 'Ống kit có khẩu hẹp (số f lớn) = ảnh tối ở trong nhà',
    },
    {
      t: 'p',
      text: 'f/3.5 so với ống f/2.8 kém hai phần ba [[Stop và EV|stop]]; f/5.6 ở đầu tele kém tới hai stop. Ngoài trời ban ngày không sao. **Trong nhà dưới đèn điện**, khẩu đã mở hết mà vẫn thiếu sáng thì máy chỉ còn hai đường. Ở chế độ A, nó hạ tốc xuống mức dễ rung tay; ở chế độ S với tốc 1/125s, nó nâng ISO lên cao và ảnh nhiễu. Đó là [[Tam giác phơi sáng|tam giác phơi sáng]] — đổi khẩu không chỉ đổi độ sáng mà cả [[Độ sâu trường ảnh và xóa phông|độ sâu trường ảnh]].',
    },
    {
      t: 'table',
      head: ['Tình huống ánh sáng', 'f/2.8', 'f/3.5–5.6'],
      caption: 'Cùng một cảnh, khẩu hẹp = ít sáng vào = tốc độ chậm hoặc ISO cao.',
      rows: [
        ['Nắng ban ngày 5.000 lux', '1/2.500 ISO 100', '1/1.000 ISO 100'],
        ['Nhà bằng đèn điện 300 lux', '1/60 ISO 100', '1/25 ISO 100 (f/3.5 phải dùng 1/15s → rung; hoặc ISO 400)'],
        ['Đêm phố 50 lux', '1/8 ISO 1.600', '1/3 ISO 1.600 (f/3.5 thành 1/1 → cần chân máy hoặc ISO 6.400)'],
      ],
    },
    { t: 'h', text: 'Mở khẩu bằng cách nào?' },
    {
      t: 'p',
      text: 'Ống kit không có vòng khẩu trên ống: bạn chỉnh khẩu bằng bánh xe trên thân ở chế độ A hoặc M. Xoay về số f nhỏ nhất là mở hết; không có nút riêng cho việc đó.',
    },
    {
      t: 'callout',
      label: 'Tại sao Sony không làm ống f/2.8 mọi tiêu cự?',
      text: 'Ống f/2.8 cố định phải to, nặng và đắt hơn nhiều. Sony bán riêng FE 24–70mm F2.8 GM II cho ai cần; ống kit dành cho người mới cần rẻ và nhẹ.',
    },
    {
      t: 'checklist',
      label: 'Trước khi mua ống mới: kiểm tra nhu cầu',
      items: [
        'Ảnh ở nhà thường bị ISO cao/tốc độ chậm? → Nâng cấp ống f/2.8.',
        'Xóa phông không được mạnh? → Giảm tiêu cự (gần chủ thể) hoặc mở khẩu (tìm ống f/1.8).',
        'Nắng ngoài trời bình thường? → Ống kit đủ sáng, hiện tại không cần đổi.',
        'Quay phim? → Kiểm tra ống có chống rung không; ống kit có, nhưng ống tele hẹp có thể không.',
      ],
    },
  ],
  meta: {
    related: [
      { kind: 'knowledge', id: 'khau-do' },
      { kind: 'knowledge', id: 'do-sau-truong-anh-va-xoa-phong' },
      { kind: 'knowledge', id: 'tam-giac-phoi-sang' },
      { kind: 'knowledge', id: 'stop-va-ev' },
    ],
    prerequisites: ['khau-do'],
    concepts: [],
    sources: [
      {
        url: 'https://helpguide.sony.net/ilc/2110/v1/en/contents/TP1000640847.html',
        title: 'ILCE-7M4 Help Guide — Exposure Mode',
        checkedAt: '2026-11-05',
      },
      {
        url: 'https://helpguide.sony.net/ilc/2110/v1/en/contents/TP1000640842.html',
        title: 'ILCE-7M4 Help Guide — Aperture',
        checkedAt: '2026-11-05',
      },
    ],
    authorName: null,
    reviewedAt: null,
    section: null,
    order: null,
  },
}
